import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar, TOOLS } from './Sidebar';
import { MainContent } from './MainContent';
import { useTheme } from '../hooks/useTheme';
import './Layout.css';

export const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeToolId, setActiveToolId] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const activeTool = TOOLS.find((t) => t.id === activeToolId);
  const activeToolTitle = activeToolId === 'dashboard' ? undefined : activeTool?.title;

  return (
    <div className="app-layout">
      <Header
        activeToolTitle={activeToolTitle}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div className="app-layout-body">
        <Sidebar
          activeToolId={activeToolId}
          onSelectTool={(id) => setActiveToolId(id)}
          isCollapsed={isSidebarCollapsed}
        />
        <MainContent
          activeToolId={activeToolId}
          onSelectTool={(id) => setActiveToolId(id)}
        />
      </div>
    </div>
  );
};
