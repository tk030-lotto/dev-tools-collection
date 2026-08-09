import { LoadedFile } from '../../core/types/file';
import {
  AnalysisResult,
  ConsistencyIssue,
  TaskMatrixItem,
  TermVariantGroup,
} from './types';
/**
 * 表記揺れ検出用の基本辞書キーワード（大文字小文字や揺れを検知）
 */
const KNOWN_KEYWORDS = [
  'GitHub',
  'TypeScript',
  'JavaScript',
  'Vite',
  'React',
  'DevTools Suite',
  'Markdown',
  'TailwindCSS',
  'PluginRegistry',
  'DocumentConsistencyChecker',
];

/**
 * 解析エンジン
 */
export function analyzeDocuments(files: LoadedFile[]): AnalysisResult {
  if (!files || files.length === 0) {
    return {
      score: 100,
      totalFiles: 0,
      issues: [],
      taskMatrix: [],
      termVariants: [],
      stats: {
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        termCount: 0,
        taskMismatchCount: 0,
        missingSectionCount: 0,
        todoCount: 0,
      },
    };
  }

  const issues: ConsistencyIssue[] = [];
  const taskMap: { [taskId: string]: { [file: string]: { status: string; line: number } } } = {};
  const termOccurrences: { [normalized: string]: { [exact: string]: { count: number; files: Set<string> } } } = {};
  let todoCount = 0;
  let missingSectionCount = 0;

  files.forEach((file) => {
    const lines = file.content.split('\n');

    // 1. セクションチェック
    const fileNameUpper = file.name.toUpperCase();
    if (fileNameUpper.includes('README')) {
      if (!file.content.includes('#') || (!file.content.includes('概要') && !file.content.includes('機能') && !file.content.includes('Overview'))) {
        issues.push({
          id: `sec-readme-${file.name}`,
          type: 'missing_section',
          severity: 'medium',
          title: `README 標準セクション未検出`,
          description: `${file.name} に標準的な「概要」または「機能」セクションが見つかりません。`,
          targetFiles: [file.name],
          suggestion: '`## 概要` または `## 主な機能` セクションを追加してください。',
        });
        missingSectionCount++;
      }
    } else if (fileNameUpper.includes('SCHEDULE')) {
      if (!file.content.includes('スケジュール') && !file.content.includes('Phase') && !file.content.includes('フェーズ')) {
        issues.push({
          id: `sec-sched-${file.name}`,
          type: 'missing_section',
          severity: 'medium',
          title: `SCHEDULE 標準セクション未検出`,
          description: `${file.name} に「スケジュール」または「Phase」セクションが見つかりません。`,
          targetFiles: [file.name],
          suggestion: '`# 開発スケジュール` や `## Phase` セクションを追加してください。',
        });
        missingSectionCount++;
      }
    }

    // 2. 行ごとの解析 (タスクID, TODO, 表記揺れ)
    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // TODO / FIXME チェック
      const todoMatch = line.match(/\b(TODO|FIXME|XXX|HACK)\b\s*:?\s*(.*)/i);
      if (todoMatch) {
        todoCount++;
        issues.push({
          id: `todo-${file.name}-${lineNum}`,
          type: 'unfinished_todo',
          severity: 'low',
          title: `未完了項目 (${todoMatch[1].toUpperCase()}): ${file.name}:${lineNum}`,
          description: line.trim(),
          targetFiles: [file.name],
          lineNumbers: [{ file: file.name, line: lineNum }],
          suggestion: '作業完了時に TODO/FIXME を解消してください。',
        });
      }

      // 未チェックボックス
      const uncompletedCheck = line.match(/^[\s-]*\[\s*\]\s+(.*)/);
      if (uncompletedCheck) {
        todoCount++;
        issues.push({
          id: `uncompleted-${file.name}-${lineNum}`,
          type: 'unfinished_todo',
          severity: 'low',
          title: `未完了タスク: ${file.name}:${lineNum}`,
          description: uncompletedCheck[1].trim(),
          targetFiles: [file.name],
          lineNumbers: [{ file: file.name, line: lineNum }],
          suggestion: '完了したら [x] に更新してください。',
        });
      }

      // タスクID抽出 (例: P1-1, P2-5, Task-1, タスク P2-4 など)
      const taskMatches = line.matchAll(/\b(P\d+-\d+|Task-\d+)\b/gi);
      for (const match of taskMatches) {
        const taskId = match[1].toUpperCase();
        if (!taskMap[taskId]) {
          taskMap[taskId] = {};
        }

        // ステータス推定
        let status = '記載あり';
        if (line.includes('完了') || line.includes('🎉') || line.includes('[x]')) {
          status = '完了';
        } else if (line.includes('進行中') || line.includes('🔄') || line.includes('作業中')) {
          status = '進行中';
        } else if (line.includes('未着手') || line.includes('⏳') || line.includes('[ ]')) {
          status = '未着手';
        } else if (line.includes('着手予定') || line.includes('準備中')) {
          status = '着手予定';
        }

        taskMap[taskId][file.name] = { status, line: lineNum };
      }

      // 用語出現チェック
      KNOWN_KEYWORDS.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = line.match(regex);
        if (matches) {
          const normalized = keyword.toLowerCase();
          if (!termOccurrences[normalized]) {
            termOccurrences[normalized] = {};
          }
          matches.forEach((exact) => {
            if (!termOccurrences[normalized][exact]) {
              termOccurrences[normalized][exact] = { count: 0, files: new Set() };
            }
            termOccurrences[normalized][exact].count++;
            termOccurrences[normalized][exact].files.add(file.name);
          });
        }
      });
    });
  });

  // 3. タスクIDの矛盾検証
  const taskMatrix: TaskMatrixItem[] = [];
  let taskMismatchCount = 0;

  Object.entries(taskMap).forEach(([taskId, fileStatuses]) => {
    const filenames = Object.keys(fileStatuses);
    const statuses = Object.values(fileStatuses).map((s) => s.status);
    const uniqueStatuses = Array.from(new Set(statuses));

    const isConsistent = filenames.length <= 1 || uniqueStatuses.length === 1;

    const statusObj: { [filename: string]: string } = {};
    const lineNums: { file: string; line: number }[] = [];
    filenames.forEach((fname) => {
      statusObj[fname] = fileStatuses[fname].status;
      lineNums.push({ file: fname, line: fileStatuses[fname].line });
    });

    taskMatrix.push({
      taskId,
      statuses: statusObj,
      isConsistent,
    });

    if (!isConsistent) {
      taskMismatchCount++;
      const statusDetails = filenames
        .map((fn) => `${fn} (${fileStatuses[fn].status})`)
        .join(', ');

      issues.push({
        id: `task-mismatch-${taskId}`,
        type: 'task_status_mismatch',
        severity: 'high',
        title: `タスクステータスの矛盾: ${taskId}`,
        description: `タスク ${taskId} のステータスがドキュメント間で不一致です: ${statusDetails}`,
        targetFiles: filenames,
        lineNumbers: lineNums,
        suggestion: '最新の進捗状態に合わせて各ドキュメントのステータス表記を統一してください。',
      });
    }
  });

  // 4. 表記揺れ検証
  const termVariants: TermVariantGroup[] = [];
  let termIssueCount = 0;

  Object.entries(termOccurrences).forEach(([normalized, exactMap]) => {
    const exactKeys = Object.keys(exactMap);
    if (exactKeys.length > 1) {
      termIssueCount++;
      const variants = exactKeys.map((k) => ({
        text: k,
        count: exactMap[k].count,
        files: Array.from(exactMap[k].files),
      }));

      // 出現頻度最高を基準用語とする
      variants.sort((a, b) => b.count - a.count);
      const baseTerm = variants[0].text;

      termVariants.push({
        baseTerm,
        variants,
      });

      const allFiles = Array.from(new Set(variants.flatMap((v) => v.files)));
      const variantStr = variants.map((v) => `"${v.text}" (${v.count}回)`).join(', ');

      issues.push({
        id: `term-variant-${normalized}`,
        type: 'term_inconsistency',
        severity: 'medium',
        title: `表記ゆれの検出: ${baseTerm}`,
        description: `用語 "${baseTerm}" に複数の表記パターンが存在します: ${variantStr}`,
        targetFiles: allFiles,
        suggestion: `推奨標準表記: "${baseTerm}" に統一することを検討してください。`,
      });
    }
  });

  // 統計とスコア算出
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  // 100点満点からの減点計算
  let score = 100 - (highCount * 15 + mediumCount * 5 + lowCount * 2);
  if (score < 0) score = 0;

  return {
    score,
    totalFiles: files.length,
    issues,
    taskMatrix,
    termVariants,
    stats: {
      highCount,
      mediumCount,
      lowCount,
      termCount: termIssueCount,
      taskMismatchCount,
      missingSectionCount,
      todoCount,
    },
  };
}
