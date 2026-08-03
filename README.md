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

## 📖 基本的な利用方法 (Usage Guide)

### 1. 全ツール共通の操作フロー
1. **ツール選択**: 左側サイドバーまたはダッシュボードから利用したいツールをクリックします。
2. **インポート**: ドラッグ＆ドロップエリアへファイル/フォルダをドロップするか、直接テキストを入力します。
3. **結果確認**: 自動で解析が実行され、サマリーカードと詳細テーブルが表示されます。
4. **エクスポート**: 画面上のボタンから Markdown / HTML / JSON 保存およびクリップボードコピーが可能です。

---

## 🛠️ 全5プラグインの個別詳細ガイド (Tool-by-Tool Guide)

### 1. 🔗 MarkdownLinkChecker (相対リンク & 画像参照切れ検証)
- **目的**: ドキュメント内のリンク切れや欠落画像を公開前に自動検知します。
- **使い方**:
  1. サイドバーで `MarkdownLinkChecker` を選択します。
  2. 検査したい `.md` ファイル群またはプロジェクトフォルダを一括ドラッグ＆ドロップします（直接 Markdown テキストの貼り付けも可能）。
  3. 検出結果として「有効リンク (Valid)」「リンク切れ (Broken)」「外部URL (External)」「画像参照 (Images)」のカウントが表示されます。
  4. リンク切れ項目は該当ファイル名と行番号が赤色で表示されます。

### 2. 🛡️ GitHubPreflight (セキュリティ & pre-commit 事前点検)
- **目的**: Git コミット・公開前に機密情報（APIキー）やデバッグコードの残存を防ぎます。
- **使い方**:
  1. サイドバーで `GitHubPreflight` を選択します。
  2. ソースコードまたはプロジェクトフォルダをドラッグ＆ドロップします。
  3. **自動検知項目**:
     - 🔑 **Secrets**: OpenAI (`sk-...`), AWS (`AKIA...`), GitHub PAT, Private Key の露出
     - 🐛 **Debug Statements**: `console.log`, `TODO`, `FIXME`, `debugger`
     - 📁 **Forbidden Files**: `.env`, `node_modules`, `.DS_Store`, 1MB以上の大容量ファイル
  4. フィルターボタン（`CRITICAL`, `WARNING` 等）で表示を絞り込み、コードプレビューで確認できます。

### 3. 📦 HandoffPack (AI引き継ぎコンテキストパック生成)
- **目的**: 次のAIセッションや別エンジニアへの引き継ぎプロンプトを1クリックで作成します。
- **使い方**:
  1. サイドバーで `HandoffPack` を選択します。
  2. 参照用ファイル（`README.md`, `SCHEDULE.md`, ソースコード等）をドロップします。
  3. ドロップしたファイルから Done 項目や TODO が自動抽出されます。
  4. テンプレート形式（`Standard`, `Minimal`, `Full Context`）を選択すると、最適化された標準化引き継ぎ Markdown プロンプトがリアルタイム生成されます。
  5. 「Copy to Clipboard」でコピーし、そのままAIチャットへ貼り付けます。

### 4. ⚖️ PromptDiff (プロンプト & テキスト高精度差分比較)
- **目的**: プロンプトの改善前後（v1 vs v2）やテキストの変更箇所をカラーハイライト表示します。
- **使い方**:
  1. サイドバーで `PromptDiff` を選択します。
  2. 左側エリアに「変更前 (Original)」、右側エリアに「変更後 (Modified)」のテキストを入力またはドロップします（「サンプル比較」ボタンでデモ表示可能）。
  3. **視覚表示モード**:
     - **Side-by-Side**: 左右対比表示
     - **Unified**: 統合差分表示
     - **Word Diff**: 行内の単語レベル差分ハイライト
  4. 類似率（%）や追加/削除行数がダッシュボードに表示されます。

### 5. 🔍 DocumentConsistencyChecker (複数ドキュメント整合性・矛盾検証)
- **目的**: README / SCHEDULE / RECORD などのドキュメント間での記述の喰い違いを検知します。
- **使い方**:
  1. サイドバーで `DocumentConsistencyChecker` を選択します。
  2. 比較したい複数の Markdown ファイルをドロップします。
  3. **自動照合項目**:
     - 🔤 **表記ゆれ**: 英大文字/小文字、カタカナ等のパターン不一致
     - 📌 **タスクID照合**: `P1-1` などのタスクステータスがドキュメント間で一致しているか
     - ⚠️ **標準セクション欠落**: README に `# 概要` が存在するか
  4. 整合性スコア (0-100点) と改善提案リストが提示されます。

---

## 🚀 クイックスタート & 開発手順 (Quick Start & Development)

### 💡 Windows での簡単起動 (一番おすすめ)
Windows をお使いの場合、コマンド入力は不要です。プロジェクトフォルダ内の **`ツール起動.bat` をダブルクリック** するだけで、自動的にサーバーが立ち上がりブラウザでツールが開きます。

---

### 動作要件
- **Node.js**: v18.0.0 以上
- **npm**: v9.0.0 以上

### 開発環境での起動 (コマンド操作)

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
