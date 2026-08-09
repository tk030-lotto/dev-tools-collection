import { ToolPlugin } from '../../core/types/plugin';
import { PromptDiffComponent } from './PromptDiffComponent';

export const promptDiffPlugin: ToolPlugin = {
  metadata: {
    id: 'prompt-diff',
    name: 'Prompt Diff',
    description: '2つのプロンプト・テキスト間の差分比較・色分けハイライト・差分レポート出力',
    icon: '🔍',
    category: 'utility',
    version: '1.0.0',
  },
  component: PromptDiffComponent,
};