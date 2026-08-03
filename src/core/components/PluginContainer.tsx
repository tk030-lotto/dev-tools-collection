import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ToolPlugin } from '../types/plugin';
import './PluginContainer.css';

/**
 * Props for Error Boundary wrapper
 */
interface ErrorBoundaryProps {
  pluginName: string;
  children: ReactNode;
}

/**
 * State for Error Boundary wrapper
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary specifically isolating plugin runtime failures
 */
class PluginErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(`[PluginErrorBoundary] Error in plugin "${this.props.pluginName}":`, error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="plugin-error-fallback">
          <div className="plugin-error-icon">⚠️</div>
          <div className="plugin-error-title">
            プラグイン 「{this.props.pluginName}」 でエラーが発生しました
          </div>
          <div className="plugin-error-message">
            {this.state.error?.message || '予期せぬエラーが発生しました'}
          </div>
          <button className="plugin-retry-btn" onClick={this.handleReset}>
            再読み込み (Retry)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Props for PluginContainer
 */
export interface PluginContainerProps {
  plugin?: ToolPlugin | null;
  extraProps?: Record<string, unknown>;
  onClose?: () => void;
  className?: string;
}

/**
 * Safe, isolated dynamic container for rendering DevTool Plugins
 */
export const PluginContainer: React.FC<PluginContainerProps> = ({
  plugin,
  extraProps = {},
  onClose,
  className = '',
}) => {
  if (!plugin) {
    return (
      <div className={`plugin-container ${className}`}>
        <div className="plugin-empty-state">
          <div className="plugin-empty-icon">🧩</div>
          <div className="plugin-empty-title">プラグインが選択されていません</div>
          <p>サイドバーまたはツール一覧から利用したいプラグインを選択してください。</p>
        </div>
      </div>
    );
  }

  const { metadata, component: PluginComponent } = plugin;

  return (
    <div className={`plugin-container ${className}`}>
      {/* Plugin Header Bar */}
      <div className="plugin-container-header">
        <div className="plugin-header-main">
          <div className="plugin-icon-wrapper">
            {metadata.icon ? metadata.icon : '⚡'}
          </div>
          <div className="plugin-title-area">
            <div className="plugin-title-row">
              <h2 className="plugin-title">{metadata.name}</h2>
              <span className="plugin-category-badge">{metadata.category}</span>
              <span className="plugin-version-badge">v{metadata.version}</span>
            </div>
            <p className="plugin-description">{metadata.description}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="plugin-header-actions">
          {onClose && (
            <button
              className="plugin-action-btn"
              onClick={onClose}
              title="閉じる"
            >
              ✕ 閉じる
            </button>
          )}
        </div>
      </div>

      {/* Plugin Body with Isolated Error Boundary */}
      <div className="plugin-container-body">
        <PluginErrorBoundary pluginName={metadata.name}>
          <PluginComponent metadata={metadata} {...extraProps} />
        </PluginErrorBoundary>
      </div>
    </div>
  );
};
