import React from 'react';
import './Sidebar.css';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: string;
}

export const TOOLS: ToolItem[] = [
  {
    id: 'dashboard',
    title: 'ダッシュボード',
    description: '全開発ツールの概要とクイックアクセス',
    icon: '📊',
  },
  {
    id: 'markdown-link-checker',
    title: 'Markdown Link Checker',
    description: '相対リンク・画像参照エラーの自動検出',
    icon: '🔗',
    badge: 'P2-1',
  },
  {
    id: 'github-preflight',
    title: 'GitHub Preflight',
    description: 'コミット前の認証情報・ログ漏洩検出',
    icon: '🚀',
    badge: 'P2-2',
  },
  {
    id: 'handoff-pack',
    title: 'Handoff Pack',
    description: 'AI・開発者引き継ぎ用ドキュメント生成',
    icon: '📦',
    badge: 'P2-3',
  },
  {
    id: 'prompt-diff',
    title: 'Prompt Diff',
    description: 'プロンプト・テキスト間差分の差分比較',
    icon: '🔍',
    badge: 'P2-4',
  },
  {
    id: 'doc-consistency-checker',
    title: 'Doc Consistency Checker',
    description: '複数ドキュメント間の整合性・矛盾検査',
    icon: '📄',
    badge: 'P2-5',
  },
];

interface SidebarProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
  isCollapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeToolId,
  onSelectTool,
  isCollapsed,
}) => {
  return (
    <aside className={`app-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-nav">
        <div className="sidebar-section-title">Navigation</div>
        {TOOLS.map((tool) => {
          const isActive = activeToolId === tool.id;
          return (
            <div
              key={tool.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTool(tool.id)}
              title={isCollapsed ? `${tool.title} (${tool.description})` : undefined}
            >
              <span className="sidebar-item-icon">{tool.icon}</span>
              <span className="sidebar-item-text">{tool.title}</span>
            </div>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">DevTools Suite v1.0.0</span>
        {isCollapsed && <span>v1.0</span>}
      </div>
    </aside>
  );
};
