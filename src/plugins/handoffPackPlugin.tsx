import React, { useState, useMemo } from 'react';
import { ToolPlugin, PluginComponentProps } from '../core/types/plugin';
import { FileDropZone } from '../core/components/FileDropZone';
import { ExportButtons } from '../core/components/ExportButtons';
import { LoadedFile } from '../core/types/file';

/**
 * Handoff Pack Template Type
 */
export type HandoffTemplate = 'standard' | 'minimal' | 'full';

/**
 * HandoffPack Plugin Component
 */
export const HandoffPackComponent: React.FC<PluginComponentProps> = ({ metadata }) => {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [projectName, setProjectName] = useState<string>('開発ツール集 (DevTools Suite)');
  const [currentPhase, setCurrentPhase] = useState<string>('Phase 2 (機能プラグイン実装)');
  const [doneItems, setDoneItems] = useState<string[]>([
    'Phase 1 コア基盤 & プラグインレジストリ構築完了',
    'Phase 2-1 MarkdownLinkChecker プラグイン実装・検証完了',
    'Phase 2-2 GitHubPreflight プラグイン実装・検証完了',
  ]);
  const [newDoneInput, setNewDoneInput] = useState<string>('');

  const [nextItems, setNextItems] = useState<string[]>([
    'Phase 2-3 HandoffPack プラグイン実装と動作検証',
    'Phase 2-4 PromptDiff プラグイン実装',
  ]);
  const [newNextInput, setNewNextInput] = useState<string>('');

  const [notes, setNotes] = useState<string>(
    'AGENTS.mdのルールに従い、作業着手前に実装計画(implementation_plan.md)の作成と承認取得を徹底すること。'
  );
  const [template, setTemplate] = useState<HandoffTemplate>('standard');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Automatically scan loaded files for TODOs or Completed items
  const handleFilesLoaded = (loaded: LoadedFile[]) => {
    setFiles((prev) => [...prev, ...loaded]);

    const detectedDone: string[] = [];
    const detectedNext: string[] = [];

    loaded.forEach((file) => {
      const lines = file.content.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        // Completed items detection
        if (
          (trimmed.startsWith('- [x]') || trimmed.startsWith('* [x]') || trimmed.includes('✅ 完了')) &&
          !detectedDone.includes(trimmed)
        ) {
          const cleanText = trimmed
            .replace(/^[-*]\s*\[x\]\s*/i, '')
            .replace(/✅/g, '')
            .trim();
          if (cleanText && !doneItems.includes(cleanText)) {
            detectedDone.push(cleanText);
          }
        }
        // Next items detection
        if (
          (trimmed.startsWith('- [ ]') || trimmed.startsWith('* [ ]') || trimmed.includes('⏳ 未着手') || trimmed.includes('TODO:')) &&
          !detectedNext.includes(trimmed)
        ) {
          const cleanText = trimmed
            .replace(/^[-*]\s*\[ \]\s*/i, '')
            .replace(/⏳|TODO:/g, '')
            .trim();
          if (cleanText && !nextItems.includes(cleanText)) {
            detectedNext.push(cleanText);
          }
        }
      });
    });

    if (detectedDone.length > 0) {
      setDoneItems((prev) => Array.from(new Set([...prev, ...detectedDone])));
    }
    if (detectedNext.length > 0) {
      setNextItems((prev) => Array.from(new Set([...prev, ...detectedNext])));
    }
  };

  // Add Item Helpers
  const addDoneItem = () => {
    if (newDoneInput.trim()) {
      setDoneItems([...doneItems, newDoneInput.trim()]);
      setNewDoneInput('');
    }
  };

  const removeDoneItem = (index: number) => {
    setDoneItems(doneItems.filter((_, i) => i !== index));
  };

  const addNextItem = () => {
    if (newNextInput.trim()) {
      setNextItems([...nextItems, newNextInput.trim()]);
      setNewNextInput('');
    }
  };

  const removeNextItem = (index: number) => {
    setNextItems(nextItems.filter((_, i) => i !== index));
  };

  const removeFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  // Generate Handoff Markdown Content
  const generatedMarkdown = useMemo(() => {
    const timestamp = new Date().toLocaleString('ja-JP');

    if (template === 'minimal') {
      return `# 【${projectName}】引き継ぎプロンプト (${timestamp})

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- なし'}

## 2. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- なし'}

## 3. 補足指示
${notes || '特になし'}
`;
    }

    if (template === 'full') {
      let doc = `# 【${projectName}】詳細引き継ぎコンテキストパック

- **生成日時**: ${timestamp}
- **現在のフェーズ**: ${currentPhase}
- **添付ファイル数**: ${files.length} ファイル

---

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- なし'}

---

## 2. 現在のプロジェクト状態 (Current State)
- **プロジェクト名**: ${projectName}
- **進行中フェーズ**: ${currentPhase}
${notes ? `- **運用メモ**: ${notes}` : ''}

---

## 3. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- なし'}

---

## 4. ドロップファイル・コンテキスト詳細
`;
      if (files.length === 0) {
        doc += `*（添付された参照ファイルはありません）*\n`;
      } else {
        files.forEach((file, idx) => {
          const ext = file.name.split('.').pop() || '';
          doc += `\n### 4.${idx + 1}. [${file.name}] (${file.size} bytes)\n\`\`\`${ext}\n${file.content}\n\`\`\`\n`;
        });
      }

      return doc;
    }

    // Standard Template
    let doc = `# 【${projectName}】P2-3 完了・引き継ぎプロンプト

これまでに「${projectName}」の ${currentPhase} の実装・検証が完了しました。

---

## 1. これまでに完了したこと (Done)
${doneItems.map((item) => `- ${item}`).join('\n') || '- (未入力)'}

---

## 2. 現在のプロジェクト状態 (Current State)
- **対象プロジェクト**: ${projectName}
- **現在のフェーズ**: ${currentPhase}
- **注意事項・申し送り**: ${notes || '規約・プロトコルに従って進めること'}

---

## 3. 次回着手するタスク (Next Up)
${nextItems.map((item) => `- ${item}`).join('\n') || '- (未入力)'}

`;

    if (files.length > 0) {
      doc += `---

## 4. 添付コンテキストファイル
`;
      files.forEach((file) => {
        const ext = file.name.split('.').pop() || '';
        doc += `\n<details>\n<summary>📄 <code>${file.name}</code> (${file.size} B)</summary>\n\n\`\`\`${ext}\n${file.content}\n\`\`\`\n</details>\n`;
      });
    }

    return doc;
  }, [projectName, currentPhase, doneItems, nextItems, notes, files, template]);

  return (
    <div className="plugin-handoff-pack animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{metadata.icon}</span> {metadata.name}
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>v{metadata.version}</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {metadata.description}
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card-hover)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button
            className={`btn ${activeTab === 'editor' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setActiveTab('editor')}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            ✏️ 入力 & ファイルドロップ
          </button>
          <button
            className={`btn ${activeTab === 'preview' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setActiveTab('preview')}
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
          >
            📋 プロンプト生成結果 ({files.length} ファイル添付)
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          {/* Left Column: Form & Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Project Basic Info */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>📌 基本設定</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    プロジェクト名
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    現在のフェーズ / ステータス
                  </label>
                  <input
                    type="text"
                    value={currentPhase}
                    onChange={(e) => setCurrentPhase(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                    出力テンプレート
                  </label>
                  <select
                    value={template}
                    onChange={(e) => setTemplate(e.target.value as HandoffTemplate)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="standard">標準引き継ぎプロンプト (Standard)</option>
                    <option value="minimal">ミニマムサマリー (Minimal)</option>
                    <option value="full">フル詳細コンテキストパック (Full Context)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Done Items Section */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>✅ 完了したこと (Done)</h3>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>{doneItems.length} 件</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="例: MarkdownLinkChecker の実装"
                  value={newDoneInput}
                  onChange={(e) => setNewDoneInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addDoneItem()}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.85rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button className="btn btn-primary" onClick={addDoneItem} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                  追加
                </button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {doneItems.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem 0.6rem',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span>- {item}</span>
                    <button
                      onClick={() => removeDoneItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="削除"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Items Section */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🚀 次回着手するタスク (Next Up)</h3>
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{nextItems.length} 件</span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  placeholder="例: PromptDiff の実装"
                  value={newNextInput}
                  onChange={(e) => setNewNextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNextItem()}
                  style={{
                    flex: 1,
                    padding: '0.4rem 0.6rem',
                    fontSize: '0.85rem',
                    background: 'var(--bg-main)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                  }}
                />
                <button className="btn btn-primary" onClick={addNextItem} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                  追加
                </button>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {nextItems.map((item, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.4rem 0.6rem',
                      background: 'var(--bg-main)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span>- {item}</span>
                    <button
                      onClick={() => removeNextItem(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      title="削除"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Dropzone & Context Files */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Notes Input */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>💡 補足事項・運用メッセージ</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="注意点や規約の申し送りを記入..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* File Drop Zone */}
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                📂 ドキュメント / ソースコード ドロップ
              </h3>
              <FileDropZone
                onFilesLoaded={handleFilesLoaded}
                options={{
                  accept: ['.md', '.txt', '.json', '.ts', '.tsx', '.js', '.py'],
                  maxSizeBytes: 5 * 1024 * 1024,
                }}
                title="参照ファイルをここに追加"
                description="README, SCHEDULE, RECORD や仕様書をドロップするとDone/TODOを自動検出"
              />

              {/* Loaded files list */}
              {files.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    読み込み済みコンテキストファイル ({files.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {files.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.4rem 0.75rem',
                          background: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.825rem',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>📄 {file.name} ({Math.round(file.size / 1024 * 10) / 10} KB)</span>
                        <button
                          onClick={() => removeFile(file.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Preview Action Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>準備完了</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  生成された Markdown プロンプトを確認・出力します。
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab('preview')}
                style={{ padding: '0.5rem 1.25rem' }}
              >
                生成結果を表示 ➔
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Export Tab */
        <div
          style={{
            background: 'var(--bg-card)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> AI引き継ぎプロンプトパック (Markdown)
            </h3>
            <ExportButtons
              content={generatedMarkdown}
              filename={`handoff_pack_${projectName.replace(/\s+/g, '_')}`}
              addTimestamp={true}
            />
          </div>

          <textarea
            readOnly
            value={generatedMarkdown}
            rows={22}
            style={{
              width: '100%',
              padding: '1rem',
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              resize: 'vertical',
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * HandoffPack Plugin Definition
 */
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
