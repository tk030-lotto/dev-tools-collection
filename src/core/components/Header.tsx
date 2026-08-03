import React from 'react';
import { Theme } from '../hooks/useTheme';
import './Header.css';

interface HeaderProps {
  activeToolTitle?: string;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeToolTitle,
  theme,
  onToggleTheme,
  onToggleSidebar,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title="サイドバーの開閉"
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>
        <div className="header-brand">
          <span className="header-brand-icon">🛠️</span>
          <span className="header-title-gradient">DevTools Suite</span>
        </div>

        {activeToolTitle && (
          <>
            <div className="header-divider" />
            <div className="header-active-tool">{activeToolTitle}</div>
          </>
        )}
      </div>

      <div className="header-right">
        <div className="badge badge-success">
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--status-success)' }} />
          Ready
        </div>

        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`テーマの切替 (${theme === 'dark' ? 'Light' : 'Dark'})`}
          aria-label="Toggle Theme"
        >
          <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  );
};
