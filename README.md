# 開発ツール集 (DevTools Suite)

ソフトウェア開発を効率化・品質向上・公開支援するための小規模ユーティリティツール集です。
本プロジェクトは **コアプラットフォーム（Core Shell）＋機能プラグイン（Tool Plugins）** の拡張型プラグインアーキテクチャを採用しています。

---

## 📅 工程管理・ロードマップ

開発工程および各タスクの進捗状況は [SCHEDULE.md](./SCHEDULE.md) で管理されています。

---

## 🏗️ システムアーキテクチャ

```text
+-------------------------------------------------------------------+
|                     DevTools Core Shell (UI/Service Container)    |
|  - Layout / Sidebar          - File I/O & Drag-and-Drop           |
|  - Theme & Design Tokens     - Common Report Exporter (MD/HTML)   |
+-------------------------------------------------------------------+
                                   | (ToolPlugin Registry API)
   +-------------------------------+-------------------------------+
   |                               |                               |
+--v------------------+  +---------v----------+  +-----------------v-+
| HandoffPack Plugin  |  | PromptDiff Plugin  |  | LinkChecker...... |
+---------------------+  +--------------------+  +-------------------+
```

---

## 🛠️ プラグイン一覧

| ツール名 | プラグインID | 分類 | 概要 | ステータス |
| :--- | :--- | :--- | :--- | :--- |
| **HandoffPack** | `handoff-pack` | Generator | [仕様書](./HandoffPack/README.md) - AI引き継ぎパック自動生成 | 仕様策定済 |
| **PromptDiff** | `prompt-diff` | Analysis | [仕様書](./PromptDiff/README.md) - AIプロンプトの差分比較・履歴管理 | 仕様策定済 |
| **DocumentConsistencyChecker** | `doc-consistency` | Checker | [仕様書](./DocumentConsistencyChecker/README.md) - ドキュメント不一致・重複・欠落検出 | 仕様策定済 |
| **GitHubPreflight** | `github-preflight` | Checker | [仕様書](./GitHubPreflight/README.md) - GitHub公開前自動チェック（APIキー等検出） | 仕様策定済 |
| **MarkdownLinkChecker** | `md-link-checker` | Checker | [仕様書](./MarkdownLinkChecker/README.md) - Markdown内の相対リンク・画像切れ検査 | 仕様策定済 |

---

## 🧩 プラグイン開発方法

新しいツールを開発する際は、コアシステムを変更せず `src/plugins/` 配下にプラグインコンポーネントを追加し、`ToolPlugin` インターフェースに従って登録します。

```typescript
// 新規プラグインの登録例
import { registerPlugin } from '@/core/registry';

registerPlugin({
  id: 'my-custom-plugin',
  name: 'カスタム解析ツール',
  description: '独自フォーマットを解析するツール',
  icon: 'search',
  category: 'analysis',
  version: '1.0.0',
  Component: MyCustomComponent,
});
```

詳細なインターフェース仕様および共通サービスについては [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) を参照してください。

---

## 📚 関連ドキュメント

- [SCHEDULE.md](./SCHEDULE.md) : 工程管理表・開発ロードマップ
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) : 共通開発ガイドライン・プラグイン定義仕様・使用技術
- [SKILLS.md](./SKILLS.md) : プロジェクト共通スキル規律
- [.agents/AGENTS.md](./.agents/AGENTS.md) : AIエージェント行動規範
