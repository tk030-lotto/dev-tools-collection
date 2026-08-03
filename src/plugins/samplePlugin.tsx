import React, { useState } from 'react';
import { ToolPlugin, PluginComponentProps } from '../core/types/plugin';
import { FileDropZone } from '../core/components/FileDropZone';
import { ExportButtons } from '../core/components/ExportButtons';
import { LoadedFile } from '../core/types/file';

/**
 * Interactive Demo Component for Sample Plugin
 */
const SamplePluginView: React.FC<PluginComponentProps> = ({ metadata }) => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [simulateError, setSimulateError] = useState<boolean>(false);

  if (simulateError) {
    throw new Error('【テスト動作】サンプルプラグイン内で手動エラーが発生しました。');
  }

  const sampleReportData = JSON.stringify(
    {
      plugin: metadata.name,
      processedFilesCount: files.length,
      timestamp: new Date().toISOString(),
      files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      summary: 'サンプルプラグインによる解析デモデータです。',
    },
    null,
    2
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>🧩 動的プラグイン機能テスト</h4>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          このコンポーネントは <code>PluginRegistry</code> 経由で動的に描画されています。
          ファイル読み込みやレポート保存などの共通サービスを利用可能です。
        </p>
      </div>

      {/* File Dropzone Component Integration */}
      <div>
        <h5 style={{ margin: '0 0 0.5rem 0', color: '#334155' }}>📁 ファイル読み込みテスト</h5>
        <FileDropZone
          onFilesLoaded={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
        />
      </div>

      {/* Exporter Buttons Integration */}
      {files.length > 0 && (
        <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
          <h5 style={{ margin: '0 0 0.75rem 0', color: '#334155' }}>📊 解析レポートのエクスポート</h5>
          <ExportButtons
            content={sampleReportData}
            filename="sample_plugin_report"
            addTimestamp={true}
          />
        </div>
      )}

      {/* Error Boundary Testing Switch */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
        <button
          onClick={() => setSimulateError(true)}
          style={{
            padding: '0.4rem 0.8rem',
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            fontSize: '0.775rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🧪 Error Boundary 動作テスト (例外を発生させる)
        </button>
      </div>
    </div>
  );
};

/**
 * Export Sample Plugin definition
 */
export const samplePlugin: ToolPlugin = {
  metadata: {
    id: 'sample-analyzer-plugin',
    name: 'Sample File Analyzer',
    description: 'PluginRegistry と PluginContainer の動的ロードおよびエラーハンドリングを検証するサンプルプラグイン',
    version: '1.0.0',
    category: 'analyzer',
    icon: '📊',
    author: 'DevTools Team',
    keywords: ['sample', 'test', 'analyzer'],
  },
  component: SamplePluginView,
  onInit: () => {
    console.log('[SamplePlugin] Plugin initialized successfully!');
  },
  onDestroy: () => {
    console.log('[SamplePlugin] Plugin destroyed!');
  },
};
