import React from 'react';
import { TOOLS } from './Sidebar';
import { FileDropZone } from './FileDropZone';
import './MainContent.css';

interface MainContentProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeToolId,
  onSelectTool,
}) => {
  const activeTool = TOOLS.find((t) => t.id === activeToolId);

  if (activeToolId === 'dashboard' || !activeTool) {
    return (
      <main className="app-main-content animate-fade-in">
        <div className="dashboard-container">
          <div className="dashboard-hero">
            <h1 className="dashboard-hero-title">DevTools Suite ダッシュボード</h1>
            <p className="dashboard-hero-subtitle">
              開発プロセスを高速化・自動化するオールインワンツールプラットフォーム。
              左側のサイドバーまたは以下のカードからツールを選択して実行できます。
            </p>
          </div>

          {/* 共通 File Drop Zone 動作確認エリア (P1-3) */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              📁 共通 File Drop Zone デモ (Phase 1-3)
            </h2>
            <FileDropZone
              options={{
                accept: ['.md', '.txt', '.json', '.js', '.ts', '.tsx', '.py'],
                maxSizeBytes: 10 * 1024 * 1024,
              }}
              title="プロジェクトファイルまたはテキスト・MDドロップ"
              description="ファイルをドラッグ＆ドロップするかクリックして選択（複数選択可）"
            />
          </div>

          <div className="dashboard-grid">
            {TOOLS.filter((t) => t.id !== 'dashboard').map((tool) => (
              <div
                key={tool.id}
                className="tool-card"
                onClick={() => onSelectTool(tool.id)}
              >
                <div>
                  <div className="tool-card-header">
                    <span className="tool-card-icon">{tool.icon}</span>
                    {tool.badge && (
                      <span className="badge badge-info">{tool.badge}</span>
                    )}
                  </div>
                  <h3 className="tool-card-title">{tool.title}</h3>
                  <p className="tool-card-desc">{tool.description}</p>
                </div>

                <div className="tool-card-footer">
                  <span className="badge badge-muted">Phase 2 準備中</span>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                    起動 ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-main-content animate-fade-in">
      <div className="tool-container">
        <div className="tool-placeholder">
          <span className="tool-placeholder-icon">{activeTool.icon}</span>
          <h2>{activeTool.title}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{activeTool.description}</p>
          <div className="badge badge-info" style={{ marginTop: '8px' }}>
            {activeTool.badge} - Phase 2 にて機能実装予定
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onSelectTool('dashboard')}
            style={{ marginTop: '16px' }}
          >
            ← ダッシュボードへ戻る
          </button>
        </div>
      </div>
    </main>
  );
};
