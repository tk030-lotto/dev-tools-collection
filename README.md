# 開発ツール集 (DevTools Suite)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)
![Vanilla CSS](https://img.shields.io/badge/CSS-Vanilla-ff69b4.svg)

**開発ツール集 (DevTools Suite)** は、ソフトウェア開発およびAI協調開発におけるドキュメント検査、セキュリティチェック、コンテキストパック生成、プロンプト差分比較、整合性検証を統合・効率化するためのフロントエンドWebアプリケーションです。

---

## ✨ 主な特徴 (Features)

- **完全クライアントサイド完結 (Zero-Server / Privacy First)**:
  すべてのファイル解析、差分計算、レポート生成はブラウザ内部（`FileReader`, `Blob`, `navigator.clipboard`）でローカルに処理されます。外部サーバーへのデータ送信は一切行われません。
- **モジュール型プラグインアーキテクチャ (Plugin Architecture)**:
  `ToolPlugin` および `PluginRegistry` による拡張設計。各機能が独立してモジュール化されています。
- **堅牢なエラー絶縁 (Error Isolation)**:
  万が一特定のプラグイン内部で例外が発生した場合でも、`PluginErrorBoundary` が安全にエラーを隔離し、アプリ全体の停止を防止します。
- **共通 Drag & Drop & 多様な出力形式**:
  全ツール共通でファイル・フォルダの一括ドラッグ＆ドロップ受入に対応。検査結果は 1 クリックで Markdown, HTML, JSON ファイル出力およびクリップボードコピーが可能です。
- **洗練されたレスポンシブ UI**:
  グラスモルフィズムデザイン、☀️/🌙 テーマ切り替え、モバイル(375px)からPC(4K)までのフルレスポンシブ対応。

---

## 🛠️ 搭載ツール・プラグイン詳細 (Tools & Specifications)

| プラグイン名 | カテゴリ | 検査対象・技術仕様 |
| :--- | :--- | :--- |
| 🔗 **MarkdownLinkChecker** | Documentation | Markdown 内の相対パスリンク `[text](path)`、ローカル画像参照 `![alt](src)`、見出しアンカー `#heading` の構文パースと実ファイル存在確認。 |
| 🛡️ **GitHubPreflight** | Security | 公開前のセキュリティ点検。APIキー/アクセストークン（OpenAI, AWS, GitHub PAT等）、残存デバッグコード（`console.log`, `TODO`, `debugger`）、不要ファイル（`.env`, `node_modules`等）の正規表現一致検索。 |
| 📦 **HandoffPack** | AI Workflow | 参照ドキュメント（README/SCHEDULE/RECORD等）と完了タスク・次回予定を構造化し、AI指示用のコンテキストパック Markdown を自動生成。 |
| ⚖️ **PromptDiff** | Optimization | 自作 LCS (Longest Common Subsequence) エンジンによる 2 テキストの行単位および単語単位の差分比較・ハイライト表示・類似率計算。 |
| 🔍 **DocumentConsistencyChecker** | Verification | 複数ドキュメント間（README/SCHEDULE/RECORD等）の用語表記ゆれ、タスクID矛盾、標準セクション欠落、未完了 `[ ]` タスクの一括照合。 |

---

## 📖 基本的な利用方法 (Usage Guide)

### 1. アプリの起動とツール選択
1. ブラウザでアプリケーションを開きます。
2. 左側の**サイドバー**またはメインダッシュボードのカードから、利用したいツール（例: `GitHubPreflight` や `PromptDiff`）をクリックして選択します。
3. ヘッダー右上の ☀️/🌙 アイコンで、お好みのテーマ（ライトモード/ダークモード）へ切り替えることができます。

### 2. ファイルのインポート (Drag & Drop / 参照)
- **ファイルの一括読み込み**: 画面内の「ドラッグ＆ドロップエリア」へファイルやフォルダを直接ドラッグ＆ドロップするか、点線エリアをクリックしてファイルを選択します。
- **テキストの直貼り・編集**: `PromptDiff` や `HandoffPack` では、テキストエリアへ直接文字を入力・編集することも可能です。

### 3. 検査結果の確認
- ツールを選択すると自動的に解析・検証が実行され、ダッシュボードに**サマリーカード**（検出数・警告数・一致率など）と**詳細データテーブル**が表示されます。
- フィルターボタン（例: `All`, `Errors`, `Warnings`）を使用して表示結果を絞り込むことができます。

### 4. レポートのエクスポート
- 画面上部または下部の **エクスポートボタンエリア** から、1 クリックで分析・検証結果を出力できます。
  - 📝 **Markdown 保存**: `.md` ファイルとしてダウンロード。
  - 🌐 **HTML 保存**: テーブル付き `.html` ファイルとして保存。
  - 📄 **JSON 保存**: 構造化データ `.json` として出力。
  - 📋 **Copy to Clipboard**: クリップボードへ即座にコピー。

---

## 🚀 クイックスタート & 開発手順 (Quick Start & Development)

### 動作要件
- **Node.js**: v18.0.0 以上
- **npm**: v9.0.0 以上

### 開発環境での起動

```bash
# リポジトリのクローン
git clone https://github.com/tk030-lotto/dev-tools-collection.git
cd dev-tools-collection

# 依存関係のインストール
npm install

# 開発用ローカルサーバーの起動 (デフォルト: http://localhost:5173)
npm run dev
```

### Production ビルドとローカルプレビュー

```bash
# TypeScript 型チェックおよびバンドルビルド
npm run build

# ビルド成果物 (dist/) のローカルプレビュー
npm run preview
```

---

## ⚠️ 技術的制約と動作仕様 (Limitations & Specifications)

本アプリケーションを正しくご利用いただくための技術的仕様・制限事項です：

1. **解析ロジックの性質**:
   各種検査機能は構文木（AST）や言語モデル（LLM）ではなく、**正規表現および文字列比較に基づく静的解析**で動作します。難読化されたコード内のシークレットや複雑な文脈依存の論理矛盾の検出には対応していません。
2. **最大ファイル受入サイズ上限**:
   ブラウザのメモリ保護のため、1 ファイルあたりの最大受入上限は **20MB** に設定されています。
3. **テキスト Diff 比較行数上限**:
   ブラウザのメインスレッドフリーズを防止するため、`PromptDiff` における LCS 比較は先頭 **3,000 行** を推奨上限として保護ガードが機能します。
4. **自動テストの現状**:
   `npm run build` による TypeScript コンパイル検証を行っていますが、Unit/E2E 自動テストスイートは未導入です。

---

## 🔌 新規プラグインの追加方法 (Adding New Plugins)

本アプリは `ToolPlugin` インターフェースに従って新しいツールを容易に追加できます。

```typescript
import { ToolPlugin } from './core/types/plugin';
import { pluginRegistry } from './core/registry/pluginRegistry';

const myCustomPlugin: ToolPlugin = {
  id: 'my-custom-tool',
  name: 'マイカスタムツール',
  description: '独自処理を行うプラグイン例',
  icon: '⚡',
  category: 'Utility',
  version: '1.0.0',
  component: MyCustomComponent,
};

// レジストリへ登録
pluginRegistry.register(myCustomPlugin);
```

---

## 📁 プロジェクト構成 (Project Structure)

```text
dev-tools-collection/
├── dist/                          # Production ビルド成果物
├── src/
│   ├── core/                      # コア基盤
│   │   ├── components/            # UI Shell (Header, Sidebar, MainContent, Layout, ExportButtons, FileDropZone)
│   │   ├── registry/              # PluginRegistry API & PluginContainer / ErrorBoundary
│   │   ├── services/              # fileReaderService, exportService
│   │   └── types/                 # 共通型定義 (file, export, plugin)
│   ├── plugins/                   # 機能プラグイン (全5ツール)
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
