import { ToolPlugin } from '../../core/types/plugin';
import { GitHubPreflightComponent } from './GitHubPreflightComponent';

/** GitHubPreflight プラグイン登録定義 */
export const gitHubPreflightPlugin: ToolPlugin = {
  metadata: {
    id: 'github-preflight',
    name: 'GitHub Preflight',
    description: 'APIキー/アクセストークン検出、TODO/console.log検査、不要・大容量ファイル事前点検ツール',
    version: '1.0.0',
    category: 'analyzer',
    icon: '🚀',
    author: 'DevTools Team',
    keywords: ['github', 'preflight', 'secret-checker', 'code-quality', 'security'],
  },
  component: GitHubPreflightComponent,
  onInit: () => {
    console.log('[GitHubPreflightPlugin] Registered successfully!');
  },
};