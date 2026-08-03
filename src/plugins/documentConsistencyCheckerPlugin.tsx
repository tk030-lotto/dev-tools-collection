import React, { useState, useMemo } from 'react';
import { ToolPlugin, PluginComponentProps } from '../core/types/plugin';
import { FileDropZone } from '../core/components/FileDropZone';
import { ExportButtons } from '../core/components/ExportButtons';
import { LoadedFile } from '../core/types/file';

/**
 * 整合性問題の種別
 */
export type IssueType =
  | 'term_inconsistency'
  | 'task_status_mismatch'
  | 'missing_section'
  | 'unfinished_todo';

/**
 * 整合性問題の深刻度
 */
export type IssueSeverity = 'high' | 'medium' | 'low';

/**
 * 整合性問題の定義
 */
export interface ConsistencyIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  targetFiles: string[];
  lineNumbers?: { file: string; line: number }[];
  suggestion?: string;
}

/**
 * タスクIDとその各ドキュメントでのステータス
 */
export interface TaskMatrixItem {
  taskId: string;
  statuses: { [filename: string]: string };
  isConsistent: boolean;
}

/**
 * 用語の揺れグループ
 */
export interface TermVariantGroup {
  baseTerm: string;
  variants: { text: string; count: number; files: string[] }[];
}

/**
 * 全体解析結果
 */
export interface AnalysisResult {
  score: number;
  totalFiles: number;
  issues: ConsistencyIssue[];
  taskMatrix: TaskMatrixItem[];
  termVariants: TermVariantGroup[];
  stats: {
    highCount: number;
    mediumCount: number;
    lowCount: number;
    termCount: number;
    taskMismatchCount: number;
    missingSectionCount: number;
    todoCount: number;
  };
}

// サンプルデータ定義（テスト・デモ用）
const SAMPLE_FILES: LoadedFile[] = [
  {
    id: 'sample-readme',
    name: 'README.md',
    extension: 'md',
    size: 2450,
    type: 'text/markdown',
    lastModified: Date.now(),
    content: `# DevTools Suite (開発ツール集)

開発プロセスを高速化・自動化するオールインワンツールプラットフォーム。

## 主な機能
- **P1-1 〜 P1-5**: コア基盤 & プラグインレジストリ ［🎉 完了］
- **P2-1**: MarkdownLinkChecker ［🎉 完了］
- **P2-2**: GitHubPreflight ［🎉 完了］
- **P2-3**: HandoffPack ［🎉 完了］
- **P2-4**: PromptDiff ［🔄 進行中］
- **P2-5**: DocumentConsistencyChecker ［⏳ 未着手］

## 技術スタック
- Vite / React / TypeScript / Typescript / Github / TailwindCSS

TODO: インストール手順の詳細を追記する
`,
  },
  {
    id: 'sample-schedule',
    name: 'SCHEDULE.md',
    extension: 'md',
    size: 1890,
    type: 'text/markdown',
    lastModified: Date.now(),
    content: `# 開発スケジュール (SCHEDULE.md)

## Phase 2: 機能プラグイン実装
- [x] **P2-1**: MarkdownLinkChecker プラグインの実装
- [x] **P2-2**: GitHubPreflight プラグインの実装
- [x] **P2-3**: HandoffPack プラグインの実装
- [x] **P2-4**: PromptDiff プラグインの実装 (完了)
- [ ] **P2-5**: DocumentConsistencyChecker プラグインの実装

## フェーズ進捗
- GitHub リポジトリ運用中 (GitHub / typescript)
`,
  },
  {
    id: 'sample-record',
    name: 'RECORD.md',
    extension: 'md',
    size: 3100,
    type: 'text/markdown',
    lastModified: Date.now(),
    content: `# 開発記録 (RECORD.md)

## 変更・差分の記録
### Phase 2 タスク進捗
- **P2-1**: MarkdownLinkChecker 完了 (2026-08-03)
- **P2-2**: GitHubPreflight 完了 (2026-08-03)
- **P2-3**: HandoffPack 完了 (2026-08-03)
- **P2-4**: PromptDiff 完了 (2026-08-03)
- **P2-5**: DocumentConsistencyChecker 着手予定

## ノート
- GitHub連携および TypeScript で開発。
- FIXME: 古いビルド設定の参照を削除する
`,
  },
];

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
function analyzeDocuments(files: LoadedFile[]): AnalysisResult {
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

/**
 * DocumentConsistencyChecker プラグインUI
 */
const DocumentConsistencyCheckerComponent: React.FC<PluginComponentProps> = () => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'term' | 'task' | 'section' | 'todo'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // サンプルデータ一括読み込み
  const handleLoadSample = () => {
    setFiles(SAMPLE_FILES);
  };

  // ドキュメント解析処理
  const analysis: AnalysisResult = useMemo(() => {
    if (files.length === 0) {
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
    return analyzeDocuments(files);
  }, [files]);

  // フィルタリング後の問題リスト
  const filteredIssues = useMemo(() => {
    return analysis.issues.filter((issue) => {
      // タブフィルター
      if (activeTab === 'term' && issue.type !== 'term_inconsistency') return false;
      if (activeTab === 'task' && issue.type !== 'task_status_mismatch') return false;
      if (activeTab === 'section' && issue.type !== 'missing_section') return false;
      if (activeTab === 'todo' && issue.type !== 'unfinished_todo') return false;

      // 深刻度フィルター
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

      // 検索クエリ
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchFile = issue.targetFiles.some((f) => f.toLowerCase().includes(query));
        return matchTitle || matchDesc || matchFile;
      }

      return true;
    });
  }, [analysis.issues, activeTab, severityFilter, searchQuery]);

  // レポートMarkdownコンテンツ生成
  const reportMarkdown = useMemo(() => {
    if (files.length === 0) return '# ドキュメント整合性解析レポート\n\nファイルが読み込まれていません。';

    return `# 📄 ドキュメント整合性解析レポート (DocumentConsistencyChecker)

## 📊 解析サマリー
- **解析対象ファイル数**: ${analysis.totalFiles} 個
- **整合性スコア**: ${analysis.score} / 100 点
- **検出された課題総数**: ${analysis.issues.length} 件 (High: ${analysis.stats.highCount}, Medium: ${analysis.stats.mediumCount}, Low: ${analysis.stats.lowCount})
- **実行日時**: ${new Date().toLocaleString()}

### 内訳
- 🔴 タスクステータス矛盾: ${analysis.stats.taskMismatchCount} 件
- 🟡 表記ゆれ検出: ${analysis.stats.termCount} 件
- 🟡 欠落セクション: ${analysis.stats.missingSectionCount} 件
- 🔵 未完了TODO / タスク: ${analysis.stats.todoCount} 件

---

## 🎯 タスクステータス照合マトリックス
| タスクID | 整合性 | 各ファイルでのステータス |
| :--- | :---: | :--- |
${analysis.taskMatrix
  .map(
    (item) =>
      `| **${item.taskId}** | ${item.isConsistent ? '✅ 整合' : '❌ 矛盾'} | ${Object.entries(item.statuses)
        .map(([f, s]) => `${f}: ${s}`)
        .join(', ')} |`
  )
  .join('\n')}

---

## ⚠️ 検出された問題・改善アドバイス

${analysis.issues
  .map(
    (issue, i) => `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
- **対象ファイル**: ${issue.targetFiles.join(', ')}
- **詳細**: ${issue.description}
${issue.suggestion ? `- **推奨アクション**: ${issue.suggestion}` : ''}
`
  )
  .join('\n')}
`;
  }, [files, analysis]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ツールヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📄 Document Consistency Checker
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
            複数プロジェクトドキュメント間での用語の表記ゆれ、タスクステータスの矛盾、セクション欠落、TODO残数を一括自動検出。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-muted"
            onClick={handleLoadSample}
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
          >
            🧪 デモ用サンプルファイル読込
          </button>
          {files.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={() => setFiles([])}
              style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* File Drop Zone */}
      <FileDropZone
        options={{
          accept: ['.md', '.txt', '.json', '.rst'],
        }}
        onFilesLoaded={(loaded) => setFiles((prev) => [...prev, ...loaded])}
        title="プロジェクトドキュメントの一括ドロップ"
        description="README.md / SCHEDULE.md / RECORD.md 等のファイルを複数ドラッグ＆ドロップ（またはクリックして選択）"
      />

      {/* 解析結果ビュー（ファイル読み込み時） */}
      {files.length > 0 && (
        <>
          {/* ダッシュボードカード */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* スコアカード */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>整合性スコア</span>
                <div
                  style={{
                    fontSize: '2.25rem',
                    fontWeight: 800,
                    color: analysis.score >= 80 ? '#10b981' : analysis.score >= 50 ? '#f59e0b' : '#ef4444',
                    lineHeight: 1.2,
                  }}
                >
                  {analysis.score}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}> / 100</span>
                </div>
              </div>
              <div style={{ fontSize: '2.5rem' }}>
                {analysis.score >= 80 ? '🛡️' : analysis.score >= 50 ? '⚠️' : '🚨'}
              </div>
            </div>

            {/* ドキュメント数 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>読み込みファイル数</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>
                {analysis.totalFiles} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>files</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {files.map((f) => f.name).join(', ')}
              </div>
            </div>

            {/* 問題数サマリー */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>検出された問題</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '4px' }}>
                {analysis.issues.length} <span style={{ fontSize: '0.875rem', fontWeight: 400 }}>件</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <span className="badge badge-danger">High: {analysis.stats.highCount}</span>
                <span className="badge badge-warning">Med: {analysis.stats.mediumCount}</span>
                <span className="badge badge-info">Low: {analysis.stats.lowCount}</span>
              </div>
            </div>

            {/* 項目別集計 */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>カテゴリ別ブレークダウン</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '0.8125rem' }}>
                <div>🔴 ステータス矛盾: <strong>{analysis.stats.taskMismatchCount}</strong></div>
                <div>🟡 表記ゆれ: <strong>{analysis.stats.termCount}</strong></div>
                <div>🔵 未完了TODO: <strong>{analysis.stats.todoCount}</strong></div>
              </div>
            </div>
          </div>

          {/* タスク照合マトリックスセクション */}
          {analysis.taskMatrix.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🎯 タスクステータス比較マトリックス
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', background: 'var(--bg-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>タスク ID</th>
                      <th style={{ padding: '8px 12px' }}>整合性</th>
                      {files.map((f) => (
                        <th key={f.name} style={{ padding: '8px 12px' }}>{f.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.taskMatrix.map((item) => (
                      <tr key={item.taskId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.taskId}</td>
                        <td style={{ padding: '8px 12px' }}>
                          {item.isConsistent ? (
                            <span className="badge badge-success">✅ 一致</span>
                          ) : (
                            <span className="badge badge-danger">❌ 矛盾あり</span>
                          )}
                        </td>
                        {files.map((f) => {
                          const st = item.statuses[f.name];
                          return (
                            <td key={f.name} style={{ padding: '8px 12px', color: st ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                              {st ? (
                                <span
                                  style={{
                                    fontWeight: st === '完了' ? 600 : 400,
                                    color: st === '完了' ? '#10b981' : st === '進行中' ? '#3b82f6' : 'var(--text-secondary)',
                                  }}
                                >
                                  {st}
                                </span>
                              ) : (
                                '―'
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 表記ゆれ一覧パネル */}
          {analysis.termVariants.length > 0 && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🔤 検出された用語表記ゆれグループ
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {analysis.termVariants.map((tv, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.875rem',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      標準提案: <span style={{ color: '#10b981', textDecoration: 'underline' }}>{tv.baseTerm}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {tv.variants.map((v, vidx) => (
                        <div key={vidx} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>• "{v.text}"</span>
                          <span style={{ fontSize: '0.75rem' }}>
                            {v.count}回 ({v.files.join(', ')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* フィルター＆検索・詳細問題リスト */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                📋 整合性エラー・改善リスト ({filteredIssues.length} / {analysis.issues.length})
              </h3>

              {/* 検索・フィルター */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="問題・ファイルを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text-primary)',
                    minWidth: '180px',
                  }}
                />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8125rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-muted)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">全深刻度</option>
                  <option value="high">High (高)</option>
                  <option value="medium">Medium (中)</option>
                  <option value="low">Low (低)</option>
                </select>
              </div>
            </div>

            {/* カテゴリタブ */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <button
                className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('all')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                すべて ({analysis.issues.length})
              </button>
              <button
                className={`btn ${activeTab === 'task' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('task')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                タスク矛盾 ({analysis.stats.taskMismatchCount})
              </button>
              <button
                className={`btn ${activeTab === 'term' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('term')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                表記ゆれ ({analysis.stats.termCount})
              </button>
              <button
                className={`btn ${activeTab === 'section' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('section')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                欠落セクション ({analysis.stats.missingSectionCount})
              </button>
              <button
                className={`btn ${activeTab === 'todo' ? 'btn-primary' : 'btn-muted'}`}
                onClick={() => setActiveTab('todo')}
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8125rem' }}
              >
                未完了TODO ({analysis.stats.todoCount})
              </button>
            </div>

            {/* 問題カードリスト */}
            {filteredIssues.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                条件に該当する整合性問題は見つかりませんでした。🎉
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredIssues.map((issue) => (
                  <div
                    key={issue.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-muted)',
                      borderLeft: `4px solid ${
                        issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#f59e0b' : '#3b82f6'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.925rem' }}>{issue.title}</span>
                      <span
                        className={`badge ${
                          issue.severity === 'high'
                            ? 'badge-danger'
                            : issue.severity === 'medium'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>

                    <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {issue.description}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div>対象: <strong>{issue.targetFiles.join(', ')}</strong></div>
                      {issue.suggestion && (
                        <div style={{ color: '#10b981', fontWeight: 500 }}>💡 提言: {issue.suggestion}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Export Integration */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              📤 解析レポートのエクスポート
            </h3>
            <ExportButtons
              content={reportMarkdown}
              filename="document_consistency_report"
              addTimestamp={true}
            />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * ToolPlugin インターフェース定義に準拠した DocumentConsistencyChecker プラグイン
 */
export const documentConsistencyCheckerPlugin: ToolPlugin = {
  metadata: {
    id: 'doc-consistency-checker',
    name: 'Document Consistency Checker',
    version: '1.0.0',
    description: '複数ドキュメント間での用語表記ゆれ、タスクステータス矛盾、欠落セクション、未完了TODOを自動照合',
    author: 'DevTools Suite Team',
    icon: '📄',
    category: 'analyzer',
    keywords: ['consistency', 'markdown', 'tasks', 'terms', 'quality'],
  },
  component: DocumentConsistencyCheckerComponent,
};
