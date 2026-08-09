import React, { useMemo, useState } from 'react';
import { FileDropZone } from '../../core/components/FileDropZone';
import { ExportButtons } from '../../core/components/ExportButtons';
import { LoadedFile } from '../../core/types/file';
import { diffLines, diffWords } from './diffService';
import { SAMPLE_MODIFIED_PROMPT, SAMPLE_ORIGINAL_PROMPT } from './sampleData';
import { DiffLine, DiffStats } from './types';
export const PromptDiffComponent: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>(SAMPLE_ORIGINAL_PROMPT);
  const [modifiedText, setModifiedText] = useState<string>(SAMPLE_MODIFIED_PROMPT);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side');
  const [enableWordDiff, setEnableWordDiff] = useState<boolean>(true);

  // Load preset sample
  const handleLoadSample = () => {
    setOriginalText(SAMPLE_ORIGINAL_PROMPT);
    setModifiedText(SAMPLE_MODIFIED_PROMPT);
  };

  // Clear all
  const handleClearAll = () => {
    setOriginalText('');
    setModifiedText('');
  };

  // File Drop Handlers
  const handleOriginalFiles = (files: LoadedFile[]) => {
    if (files.length > 0 && files[0].content) {
      setOriginalText(files[0].content);
    }
  };

  const handleModifiedFiles = (files: LoadedFile[]) => {
    if (files.length > 0 && files[0].content) {
      setModifiedText(files[0].content);
    }
  };

  // Calculate Diffs with performance guard
  const lineDiffs = useMemo(() => {
    // 改行コード (CRLF / CR) を LF に自動正規化して誤差分を防止
    const normalizedOld = originalText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const normalizedNew = modifiedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const oldLines = normalizedOld.split('\n');
    const newLines = normalizedNew.split('\n');

    // 長分ブラウザ保護ガード (3,000行超過時)
    const MAX_SAFE_LINES = 3000;
    if (oldLines.length > MAX_SAFE_LINES || newLines.length > MAX_SAFE_LINES) {
      const truncatedOld = oldLines.slice(0, MAX_SAFE_LINES);
      const truncatedNew = newLines.slice(0, MAX_SAFE_LINES);
      const diffs = diffLines(truncatedOld, truncatedNew);
      diffs.push({
        type: 'unchanged',
        text: `⚠️ [システム警告] テキストが非常に長いため (${Math.max(oldLines.length, newLines.length)} 行)、パフォーマンス保護目的で先頭 ${MAX_SAFE_LINES} 行のみ比較表示しています。`,
      });
      return diffs;
    }

    return diffLines(oldLines, newLines);
  }, [originalText, modifiedText]);

  // Statistics
  const stats: DiffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    lineDiffs.forEach((d) => {
      if (d.type === 'added') added++;
      else if (d.type === 'removed') removed++;
      else unchanged++;
    });

    const total = added + removed + unchanged;
    const similarity = total > 0 ? Math.round((unchanged / (unchanged + Math.max(added, removed))) * 100) : 100;

    return {
      addedLines: added,
      removedLines: removed,
      unchangedLines: unchanged,
      totalLines: lineDiffs.length,
      similarityPercentage: isNaN(similarity) ? 100 : similarity,
      oldCharCount: originalText.length,
      newCharCount: modifiedText.length,
    };
  }, [lineDiffs, originalText, modifiedText]);

  // Render Word Diff inside a line
  const renderWordDiffLine = (oldText: string, newText: string) => {
    const tokens = diffWords(oldText, newText);
    return (
      <span>
        {tokens.map((tok, idx) => {
          let style: React.CSSProperties = {};
          if (tok.type === 'added') {
            style = { background: 'rgba(34, 197, 94, 0.3)', color: '#4ade80', borderRadius: '2px', padding: '0 2px' };
          } else if (tok.type === 'removed') {
            style = { background: 'rgba(239, 68, 68, 0.3)', color: '#f87171', textDecoration: 'line-through', borderRadius: '2px', padding: '0 2px' };
          }
          return (
            <span key={idx} style={style}>
              {tok.text}
            </span>
          );
        })}
      </span>
    );
  };

  // Side-by-Side Lines Pair Generation
  const sideBySidePairs = useMemo(() => {
    const pairs: Array<{ left?: DiffLine; right?: DiffLine }> = [];
    let i = 0;
    while (i < lineDiffs.length) {
      const curr = lineDiffs[i];
      if (curr.type === 'unchanged') {
        pairs.push({ left: curr, right: curr });
        i++;
      } else if (curr.type === 'removed') {
        if (i + 1 < lineDiffs.length && lineDiffs[i + 1].type === 'added') {
          pairs.push({ left: curr, right: lineDiffs[i + 1] });
          i += 2;
        } else {
          pairs.push({ left: curr, right: undefined });
          i++;
        }
      } else if (curr.type === 'added') {
        pairs.push({ left: undefined, right: curr });
        i++;
      }
    }
    return pairs;
  }, [lineDiffs]);

  // Generated Markdown Report
  const generatedReport = useMemo(() => {
    const now = new Date().toLocaleString();
    return `# 🔍 PromptDiff 解析レポート

- **解析日時**: ${now}
- **一致率 (Similarity)**: ${stats.similarityPercentage}%
- **追加行数**: +${stats.addedLines} 行
- **削除行数**: -${stats.removedLines} 行
- **維持行数**: ${stats.unchangedLines} 行
- **文字数変化**: Original ${stats.oldCharCount} chars ➔ Modified ${stats.newCharCount} chars (${stats.newCharCount - stats.oldCharCount >= 0 ? '+' : ''}${stats.newCharCount - stats.oldCharCount})

---

## 📊 差分サマリー

\`\`\`diff
${lineDiffs
  .map((line) => {
    if (line.type === 'added') return `+ ${line.text}`;
    if (line.type === 'removed') return `- ${line.text}`;
    return `  ${line.text}`;
  })
  .join('\n')}
\`\`\`
`;
  }, [stats, lineDiffs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔍</span> PromptDiff 比較エンジン
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            2つのプロンプト・テキストファイルの行単位/単語単位の差分（Diff）を比較＆リアルタイム表示します。
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-muted" onClick={handleLoadSample} style={{ fontSize: '0.8125rem' }}>
            ⚡ サンプル比較をロード
          </button>
          <button className="btn btn-muted" onClick={handleClearAll} style={{ fontSize: '0.8125rem' }}>
            🗑️ クリア
          </button>
        </div>
      </div>

      {/* Input Section (Original vs Modified) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Original Input */}
        <div style={{ background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>📄</span> Original (変更前 / A)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{originalText.length} chars</span>
          </div>
          <FileDropZone
            multiple={false}
            options={{ accept: ['.txt', '.md', '.prompt', '.json', '.js', '.ts'] }}
            onFilesLoaded={handleOriginalFiles}
            title="Original ファイルドロップ"
            description="ファイルドラッグ＆ドロップまたはクリック"
            showFileList={false}
          />
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="元のプロンプト・テキストを入力..."
            rows={8}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Modified Input */}
        <div style={{ background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>📝</span> Modified (変更後 / B)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{modifiedText.length} chars</span>
          </div>
          <FileDropZone
            multiple={false}
            options={{ accept: ['.txt', '.md', '.prompt', '.json', '.js', '.ts'] }}
            onFilesLoaded={handleModifiedFiles}
            title="Modified ファイルドロップ"
            description="ファイルドラッグ＆ドロップまたはクリック"
            showFileList={false}
          />
          <textarea
            value={modifiedText}
            onChange={(e) => setModifiedText(e.target.value)}
            placeholder="変更後のプロンプト・テキストを入力..."
            rows={8}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
        </div>
      </div>

      {/* Stats Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>一致率 (Similarity)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.similarityPercentage > 70 ? 'var(--success-color)' : 'var(--warning-color)' }}>
            {stats.similarityPercentage}%
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>追加行数</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80' }}>+{stats.addedLines}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>削除行数</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f87171' }}>-{stats.removedLines}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>維持行数</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.unchangedLines}</div>
        </div>
      </div>

      {/* View Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, marginRight: '0.25rem' }}>表示モード:</span>
          <button
            className={`btn ${viewMode === 'side-by-side' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setViewMode('side-by-side')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
          >
            ↔️ Side-by-Side (左右比較)
          </button>
          <button
            className={`btn ${viewMode === 'unified' ? 'btn-primary' : 'btn-muted'}`}
            onClick={() => setViewMode('unified')}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8125rem' }}
          >
            ☰ Unified (統合表示)
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={enableWordDiff}
            onChange={(e) => setEnableWordDiff(e.target.checked)}
          />
          ✨ 単語レベル差分ハイライト (Word Diff)
        </label>
      </div>

      {/* Diff View Result Container */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Diff レンダリング結果</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>行数: {stats.totalLines} 行</span>
        </div>

        {/* View Mode: Side-by-Side */}
        {viewMode === 'side-by-side' && (
          <div style={{ overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  <th style={{ width: '40px', padding: '6px' }}>LN</th>
                  <th style={{ width: '50%', padding: '6px', textAlign: 'left', borderRight: '1px solid var(--border-color)' }}>Original (A)</th>
                  <th style={{ width: '40px', padding: '6px' }}>LN</th>
                  <th style={{ width: '50%', padding: '6px', textAlign: 'left' }}>Modified (B)</th>
                </tr>
              </thead>
              <tbody>
                {sideBySidePairs.map((pair, idx) => {
                  const left = pair.left;
                  const right = pair.right;

                  const isModifiedPair = left?.type === 'removed' && right?.type === 'added';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Left LN */}
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-secondary)', userSelect: 'none', background: 'rgba(0,0,0,0.1)' }}>
                        {left?.oldLineNumber || ''}
                      </td>
                      {/* Left Content */}
                      <td
                        style={{
                          padding: '4px 8px',
                          borderRight: '1px solid var(--border-color)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          background: left?.type === 'removed' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                          color: left?.type === 'removed' ? '#f87171' : 'var(--text-primary)',
                        }}
                      >
                        {left ? (
                          isModifiedPair && enableWordDiff ? (
                            renderWordDiffLine(left.text, right?.text || '')
                          ) : (
                            left.text
                          )
                        ) : null}
                      </td>

                      {/* Right LN */}
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: 'var(--text-secondary)', userSelect: 'none', background: 'rgba(0,0,0,0.1)' }}>
                        {right?.newLineNumber || ''}
                      </td>
                      {/* Right Content */}
                      <td
                        style={{
                          padding: '4px 8px',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          background: right?.type === 'added' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                          color: right?.type === 'added' ? '#4ade80' : 'var(--text-primary)',
                        }}
                      >
                        {right ? (
                          isModifiedPair && enableWordDiff ? (
                            renderWordDiffLine(left?.text || '', right.text)
                          ) : (
                            right.text
                          )
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode: Unified */}
        {viewMode === 'unified' && (
          <div style={{ overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {lineDiffs.map((line, idx) => {
                  let bg = 'transparent';
                  let color = 'var(--text-primary)';
                  let prefix = ' ';

                  if (line.type === 'added') {
                    bg = 'rgba(34, 197, 94, 0.15)';
                    color = '#4ade80';
                    prefix = '+';
                  } else if (line.type === 'removed') {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    color = '#f87171';
                    prefix = '-';
                  }

                  return (
                    <tr key={idx} style={{ background: bg, color: color, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ width: '40px', padding: '4px 6px', textAlign: 'right', color: 'var(--text-secondary)', userSelect: 'none' }}>
                        {line.oldLineNumber || ''}
                      </td>
                      <td style={{ width: '40px', padding: '4px 6px', textAlign: 'right', color: 'var(--text-secondary)', userSelect: 'none' }}>
                        {line.newLineNumber || ''}
                      </td>
                      <td style={{ width: '20px', padding: '4px 4px', fontWeight: 'bold', userSelect: 'none' }}>{prefix}</td>
                      <td style={{ padding: '4px 8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div style={{ background: 'var(--bg-card)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
          📤 差分レポートのエクスポート
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          解析された差分結果を Markdown, HTML, JSON 形式でダウンロード保存、またはクリップボードにコピーできます。
        </p>
        <ExportButtons
          content={generatedReport}
          filename="prompt_diff_report"
          addTimestamp={true}
        />
      </div>
    </div>
  );
};
