import { ToolPlugin } from '../../core/types/plugin';
import { DocumentConsistencyCheckerComponent } from './DocumentConsistencyCheckerComponent';

/** DocumentConsistencyChecker プラグイン登録定義 */
export const documentConsistencyCheckerPlugin: ToolPlugin = {
  metadata: {
    id: 'doc-consistency-checker',
    name: 'Document Consistency Checker',
    version: '1.0.0',
    description: '複数ドキュメント間での用語表記ゆれ、タスクステータス矛盾、欠落セクション、未完了TODOを自動照合',
    author: 'DevTools Suite Team',
    icon: '📄',
    category: 'analyzer',
    keywords: ['consistency', 'markdown', 'tasks', 'terms', 'quality'],
  },
  component: DocumentConsistencyCheckerComponent,
};