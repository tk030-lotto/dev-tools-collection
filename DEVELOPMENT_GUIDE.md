# DEVELOPMENT_GUIDE.md - 開発ツール集 共通開発ガイド

## 1. 目的

本プロジェクトは、ソフトウェア開発を効率化・品質向上・公開支援するための小規模ユーティリティツールを開発・公開することを目的とする。

各ツールは独立した機能モジュール（プラグイン）として動作し、共通の設計思想・プラグインコアアーキテクチャ・操作性を採用する。

---

## 2. 基本方針

* **プラグインアーキテクチャ**: コア（UI Shell/共通基盤）と機能プラグインの完全分離
* **シンプル設計**: 必要最小限の構成で拡張性を担保
* **ローカル環境完結**: オフラインで安全に動作（外部API非依存）
* **AI開発最適化**: AIエージェントがプラグインを自律的に追加・保守しやすい構造
* **一貫したUI/UX**: 共通デザインシステムとレイアウトコンテナの利用
* **MVP（最小実装）優先**: 段階的な機能拡張とZero-Dependency原則

---

## 3. プラグインアーキテクチャ設計 (Core & Plugins)

全ツールは共通の **Core プラットフォーム** と **機能プラグイン** の二層構造で開発する。

```text
+-------------------------------------------------------------------+
|                    Core Platform (UI Shell)                       |
|  +-------------------+  +-------------------+  +---------------+  |
|  | Navigation / Menu |  | Drag&Drop File I/O|  |Report Exporter|  |
|  +-------------------+  +-------------------+  +---------------+  |
+-------------------------------------------------------------------+
                                   | (Plugin Registry Interface)
    +------------------------------+------------------------------+
    |                              |                              |
+---+---------------+      +-------+-----------+      +-----------+-------+
| HandoffPack       |      | PromptDiff        |      | MarkdownLink...   |
| Plugin            |      | Plugin            |      | Plugin            |
+-------------------+      +-------------------+      +-------------------+
```

### 3.1 コア基盤 (Core) が提供する機能

1. **UI Shell (コンテナ)**: サイドバーナビゲーション、ヘッダー、ダーク/ライトテーマ、レスポンシブレイアウト
2. **File Services**: 共通フォルダ/ファイル読み込み、ドラッグ＆ドロップ判定、拡張子フィルタリング
3. **Report Exporters**: Markdown / HTML / JSON / プレーンテキスト出力、クリップボードコピー機能

### 3.2 プラグイン定義インターフェース (`ToolPlugin`)

すべての機能プラグインは以下の TypeScript インターフェースに従って実装・登録される。

```typescript
export interface ToolPlugin {
  id: string;                     // プラグイン識別子 (例: "prompt-diff")
  name: string;                   // 表示名 (例: "AIプロンプト差分管理")
  description: string;            // ツール概要
  icon: string;                   // アイコン識別子
  category: 'analysis' | 'generator' | 'checker' | 'utility';
  version: string;                // プラグインバージョン
  
  // メインコンポーネント
  Component: React.ComponentType;
  
  // オプション: 設定パネル/フック
  onInit?: () => void;
}
```

---

## 4. ディレクトリ構成

開発ツール集はモノレポ / モジュールプラグイン構造として管理する。

```text
DevelopmentTools/
├── src/
│   ├── core/                      # コア基盤（プラットフォーム・シェル）
│   │   ├── components/            # UI Shell, Sidebar, Modal, Layout
│   │   ├── services/              # FileSystem, DragDrop, Exporters
│   │   ├── hooks/                 # 共通カスタムフック
│   │   └── registry/              # PluginRegistry (動的登録)
│   ├── plugins/                   # 各機能プラグイン
│   │   ├── handoff-pack/          # AI引き継ぎパック生成
│   │   ├── prompt-diff/           # プロンプト差分比較
│   │   ├── doc-consistency/       # ドキュメント整合性チェッカー
│   │   ├── github-preflight/      # GitHub公開前チェッカー
│   │   └── md-link-checker/       # Markdownリンク切れチェッカー
│   ├── App.tsx                    # メインアプリケーションエントリー
│   └── main.tsx
├── HandoffPack/README.md          # 各ツールの独立設計仕様書
├── PromptDiff/README.md
├── DocumentConsistencyChecker/README.md
├── GitHubPreflight/README.md
├── MarkdownLinkChecker/README.md
├── DEVELOPMENT_GUIDE.md           # 本ガイド
└── README.md                      # メインポータル
```

---

## 5. 使用技術・開発ルール

* **Core**: TypeScript, React, Vite, Vanilla CSS
* **Design**: 共通デザインシステム（CSS Variables / UI Tokens）
* **Dependency**: Zero-Dependency First（外部ライブラリは事前承認制）
* **Code Quality**: 単一責任の原則、巨大ファイル自律分割（300行制限）

---

## 6. バージョン管理・リリース方針

* セマンティックバージョニングを採用
* コアプラットフォームの更新と個別プラグインの追加・バージョンアップは独立して実施可能とする
* 各 `README.md` に最新の機能と制限事項を明記する
