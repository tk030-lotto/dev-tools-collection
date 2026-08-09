import { LoadedFile } from '../../core/types/file';

// サンプルデータ定義（テスト・デモ用）
export const SAMPLE_FILES: LoadedFile[] = [
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
