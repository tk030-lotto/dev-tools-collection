import { ToolPlugin } from '../../core/types/plugin';
import { HandoffPackComponent } from './HandoffPackComponent';

export const handoffPackPlugin: ToolPlugin = {
  metadata: {
    id: 'handoff-pack',
    name: 'HandoffPack',
    description: '要件・TODO・README・コンテキストを収集し、AI引き継ぎ用の構造化 Markdown パックを生成するツール',
    version: '1.0.0',
    category: 'generator',
    icon: '📦',
    author: 'DevTools Suite Team',
    keywords: ['handoff', 'ai', 'prompt', 'context', 'markdown', 'pack'],
  },
  component: HandoffPackComponent,
};