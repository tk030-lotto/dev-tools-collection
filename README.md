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
├── LICENSE                        # MIT ライセンス全文
├── README.md                      # 本ドキュメント
├── SCHEDULE.md                    # 工程管理表
└── RECORD.md                      # 開発記録
```

---

## 📄 ライセンス (License)

本プロジェクトは **[MIT License](LICENSE)** のもとで公開・配布されています。

### MIT ライセンス全条項（日本語訳）

```text
MIT License

Copyright (c) 2026 tk030

以下に定める条件に従い、本ソフトウェアおよび関連文書のファイル（以下「ソフトウェア」）の複製を取得するすべての人に対し、ソフトウェアを無制限に扱う無償の許可が付与されます。これには、ソフトウェアの複製を使用、複写、変更、結合、掲載、配布、サブライセンス、および/または販売する権利、およびソフトウェアを提供する相手にそれを許可する権利が含まれますが、これらに限定されません。

上記の著作権表示および本許諾表示は、ソフトウェアのすべての複製または重要な部分に含まれるものとします。

本ソフトウェアは「現状のまま」提供され、明示または黙示を問わず、商品性、特定目的への適合性、および権利侵害がないことの保証を含むがこれらに限定されない、いかなる種類の保証も行われません。いかなる場合においても、作者または著作権者は、契約行為、不法行為、またはその他の行為であるかを問わず、ソフトウェアまたはソフトウェアの使用またはその他の扱いに関連して発生する、いかなる請求、損害、その他の責任についても責任を負わないものとします。
```

### Official MIT License (English Original Text)

```text
MIT License

Copyright (c) 2026 tk030

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
