import { LoadedFile } from '../../core/types/file';
import { HandoffTemplate } from './types';

export interface HandoffInput {
  projectName: string;
  currentPhase: string;
  doneItems: string[];
  nextItems: string[];
  notes: string;
  files: LoadedFile[];
  template: HandoffTemplate;
}

export function generateHandoffMarkdown({ projectName, currentPhase, doneItems, nextItems, notes, files, template }: HandoffInput): string {    const timestamp = new Date().toLocaleString('ja-JP');

    if (template === 'minimal') {
      return `# 【${projectName}】引き継ぎプロンプト (${timestamp})

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- なし'}

## 2. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- なし'}

## 3. 補足指示
${notes || '特になし'}
`;
    }

    if (template === 'full') {
      let doc = `# 【${projectName}】詳細引き継ぎコンテキストパック

- **生成日時**: ${timestamp}
- **現在のフェーズ**: ${currentPhase}
- **添付ファイル数**: ${files.length} ファイル

---

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- なし'}

---

## 2. 現在のプロジェクト状態 (Current State)
- **プロジェクト名**: ${projectName}
- **進行中フェーズ**: ${currentPhase}
${notes ? `- **運用メモ**: ${notes}` : ''}

---

## 3. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- なし'}

---

## 4. ドロップファイル・コンテキスト詳細
`;
      if (files.length === 0) {
        doc += `*（添付された参照ファイルはありません）*\n`;
      } else {
        files.forEach((file, idx) => {
          const ext = file.name.split('.').pop() || '';
          doc += `\n### 4.${idx + 1}. [${file.name}] (${file.size} bytes)\n\`\`\`${ext}\n${file.content}\n\`\`\`\n`;
        });
      }

      return doc;
    }

    // Standard Template
    let doc = `# 【${projectName}】P2-3 完了・引き継ぎプロンプト

これまでに「${projectName}」の ${currentPhase} の実装・検証が完了しました。

---

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- (未入力)'}

---

## 2. 現在のプロジェクト状態 (Current State)
- **対象プロジェクト**: ${projectName}
- **現在のフェーズ**: ${currentPhase}
- **注意事項・申し送り**: ${notes || '規約・プロトコルに従って進めること'}

---

## 3. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- (未入力)'}

`;

    if (files.length > 0) {
      doc += `---

## 4. 添付コンテキストファイル
`;
      files.forEach((file) => {
        const ext = file.name.split('.').pop() || '';
        doc += `\n<details>\n<summary>📄 <code>${file.name}</code> (${file.size} B)</summary>\n\n\`\`\`${ext}\n${file.content}\n\`\`\`\n</details>\n`;
      });
    }

    return doc;
}
