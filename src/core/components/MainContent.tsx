import React, { useState, useEffect } from 'react';
import { TOOLS } from './Sidebar';
import { FileDropZone } from './FileDropZone';
import { ExportButtons } from './ExportButtons';
import { PluginContainer } from './PluginContainer';
import { pluginRegistry } from '../registry/pluginRegistry';
import { ToolPlugin } from '../types/plugin';
import { samplePlugin } from '../../plugins/samplePlugin';
import './MainContent.css';

interface MainContentProps {
  activeToolId: string;
  onSelectTool: (id: string) => void;
}

const DEMO_REPORT_CONTENT = `# DevTools Suite 解析レポート サンプル

## 概要
本レポートは **DevTools Suite (Phase 1-4)** の Report Exporters 機能検証用のサンプルコンテンツです。

- **バージョン**: 1.0.0
- **ビルドステータス**: Successful
- **実行日時**: ${new Date().toLocaleString()}

### チェック項目
1. [x] クリップボードコピー機能
2. [x] Markdown (.md) 保存
3. [x] HTML (.html) 保存
4. [x] JSON (.json) 保存
5. [x] Text (.txt) 保存

> DevTools Suite は開発プロセスの自動化・効率化を強力にサポートします。
`;

export const MainContent: React.FC<MainContentProps> = ({
  activeToolId,
  onSelectTool,
}) => {
  const [registeredPlugins, setRegisteredPlugins] = useState<ToolPlugin[]>([]);
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);

  // Initialize and subscribe to PluginRegistry
  useEffect(() => {
    // Register sample plugin for verification
    pluginRegistry.register(samplePlugin);

    // Initial fetch
    setRegisteredPlugins(pluginRegistry.getAll());
    if (pluginRegistry.getAll().length > 0 && !selectedPluginId) {
      setSelectedPluginId(pluginRegistry.getAll()[0].metadata.id);
    }

    // Subscribe to registry updates
    const unsubscribe = pluginRegistry.subscribe(() => {
      setRegisteredPlugins(pluginRegistry.getAll());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const activeTool = TOOLS.find((t) => t.id === activeToolId);
  const activePlugin = registeredPlugins.find((p) => p.metadata.id === selectedPluginId);

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

          {/* プラグインコンテナ & レジストリ動作確認エリア (P1-5) */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                🧩 PluginContainer & Dynamic Registry デモ (Phase 1-5)
              </h2>
              <span className="badge badge-info" style={{ fontSize: '0.8rem' }}>
                登録数: {registeredPlugins.length}
              </span>
            </div>

            {/* Registered Plugin Selector */}
            {registeredPlugins.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {registeredPlugins.map((p) => (
                  <button
                    key={p.metadata.id}
                    className={`btn ${selectedPluginId === p.metadata.id ? 'btn-primary' : 'btn-muted'}`}
                    onClick={() => setSelectedPluginId(p.metadata.id)}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
                  >
                    {p.metadata.icon} {p.metadata.name}
                  </button>
                ))}
              </div>
            )}

            {/* Dynamic Plugin Rendering Container */}
            <PluginContainer
              plugin={activePlugin}
              onClose={() => setSelectedPluginId(null)}
            />
          </div>

          {/* 共通 File Drop Zone 動作確認エリア (P1-3) */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
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

          {/* 共通 Report Exporters 動作確認エリア (P1-4) */}
          <div style={{ marginBottom: 'var(--space-8)', padding: 'var(--space-4)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
              📤 共通 Report Exporters デモ (Phase 1-4)
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
              生成された解析レポートやツール結果を各種フォーマットで保存・コピーする共通コンポーネントです。
            </p>
            <ExportButtons
              content={DEMO_REPORT_CONTENT}
              filename="devtools_analysis_report"
              addTimestamp={true}
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
