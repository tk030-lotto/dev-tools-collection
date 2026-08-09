import { ToolPlugin } from '../../core/types/plugin';
import { MarkdownLinkCheckerView } from './MarkdownLinkCheckerComponent';

/** MarkdownLinkChecker プラグイン登録定義 */
export const markdownLinkCheckerPlugin: ToolPlugin = {
  metadata: {
    id: 'markdown-link-checker',
    name: 'Markdown Link Checker',
    description: 'Markdown ドキュメント内の相対パスリンク確認・画像参照エラー検出・リンク検証レポート出力機能を提供',
    version: '1.0.0',
    category: 'analyzer',
    icon: '🔗',
    author: 'DevTools Team',
    keywords: ['markdown', 'link', 'checker', 'broken-link', 'validator'],
  },
  component: MarkdownLinkCheckerView,
  onInit: () => {
    console.log('[MarkdownLinkCheckerPlugin] Plugin registered successfully!');
  },
};