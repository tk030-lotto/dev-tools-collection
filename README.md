# 開発ツール集 (DevTools Suite)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)
![Vanilla CSS](https://img.shields.io/badge/CSS-Vanilla-ff69b4.svg)

**開発ツール集 (DevTools Suite)** は、ソフトウェア開発およびAI協調開発におけるドキュメント検査、セキュリティチェック、コンテキストパック生成、プロンプト差分比較、整合性検証を統合・効率化するためのフロントエンドWebアプリケーションです。

---

## ✨ 主な特徴 (Features)

- **完全クライアントサイド完結 & Zero-Server**:
  ファイル処理、差分解析、レポート生成、データ書き出しはすべてブラウザ内でローカル処理されます。外部サーバーへデータを送信しないためセキュリティ面でも安心です。
- **プラグインベース拡張アーキテクチャ (Plugin Architecture)**:
  `ToolPlugin` および `PluginRegistry` によるモジュール型設計。新しい開発ツールを容易に追加・拡張可能。
- **堅牢なエラー絶縁 (Error Isolation)**:
  万が一特定のプラグインで例外が発生しても `PluginErrorBoundary` が安全にキャッチし、アプリ全体の影響を防止。
- **共通 Drag & Drop & ファイルロード**:
  ファイルやフォルダの一括ドロップ受入、自動エンコーディング判定、サイズ・拡張子バリデーション機能を提供。
- **共通 Report Exporters**:
  各ツールの分析・検証結果を 1 クリックで Markdown, HTML, JSON ファイル出力、およびクリップボードコピー可能。
- **洗練されたプレミアムデザイン**:
  ダークモード / ライトモード対応、ガラスモルフィズムスタイル、スムースなアニメーション、全デバイス対応レスポンシブデザイン。

---

## 🛠️ 搭載ツール・プラグイン一覧 (Tools & Plugins)

| プラグイン名 | カテゴリ | 概要・主要機能 |
| :--- | :--- | :--- |
| 🔗 **MarkdownLinkChecker** | Documentation | Markdown 内の相対パスリンク確認、ローカル画像参照切れ検出、アンカーリンク検証、リンク検証レポート生成。 |
| 🛡️ **GitHubPreflight** | Security | Pre-commit セキュリティ点検。APIキー / アクセストークン検出、TODO / console.log 残存チェック、不要ファイル検出。 |
| 📦 **HandoffPack** | AI Workflow | 参照ドキュメント（README/SCHEDULE/RECORD等）と完了タスク・次回予定を統合したAI引き継ぎ用コンテキストパック自動生成。 |
| ⚖️ **PromptDiff** | Optimization | 2つのプロンプト・テキストの行単位＆単語単位の差分（Diff）比較。類似率表示、追加/削除ハイライト表示、差分出力。 |
| 🔍 **DocumentConsistencyChecker** | Verification | 複数ドキュメント間の用語表記ゆれ、タスクID・ステータス矛盾、欠落セクション、未完了タスクの一括検証。 |

---

## 🚀 クイックスタート (Quick Start)

### 開発環境での起動

```bash
# 依存関係のインストール
npm install

# 開発用ローカルサーバーの起動 (http://localhost:5173)
npm run dev
```

### Production ビルド

```bash
# TypeScript 型チェックおよびバンドルビルド
npm run build

# ビルド成果物のローカルプレビュー
npm run preview
```

---

## 📁 プロジェクト構成 (Project Structure)

```text
c:\Users\tk030\Desktop\開発ツール集
├── dist/                          # Production ビルド成果物
├── src/
│   ├── core/                      # コア基盤
│   │   ├── components/            # UI Shell (Header, Sidebar, MainContent, Layout, ExportButtons, FileDropZone)
│   │   ├── registry/              # PluginRegistry API & PluginContainer / ErrorBoundary
│   │   ├── services/              # fileReaderService, exportService
│   │   └── types/                 # 共通型定義 (file, export, plugin)
│   ├── plugins/                   # 機能プラグイン
│   │   ├── markdownLinkCheckerPlugin.tsx
│   │   ├── gitHubPreflightPlugin.tsx
│   │   ├── handoffPackPlugin.tsx
│   │   ├── promptDiffPlugin.tsx
│   │   └── documentConsistencyCheckerPlugin.tsx
│   ├── App.tsx                    # アプリケーションルート
│   ├── index.css                  # 共通デザインシステム & ユーティリティ
│   └── main.tsx                   # エントリポイント
├── README.md                      # 本ドキュメント
├── SCHEDULE.md                    # 工程管理表
└── RECORD.md                      # 開発記録
```

---

## 📄 ライセンス (License)

[MIT License](LICENSE)
