import React, { useState, useMemo } from 'react';
import { ToolPlugin, PluginComponentProps } from '../core/types/plugin';
import { FileDropZone } from '../core/components/FileDropZone';
import { ExportButtons } from '../core/components/ExportButtons';
import { LoadedFile } from '../core/types/file';

/**
 * Extracted Link Information Interface
 */
export interface ExtractedLink {
  id: string;
  sourceFile: string;
  line: number;
  text: string;
  target: string;
  type: 'relative_file' | 'relative_image' | 'anchor' | 'external_url';
  status: 'valid' | 'broken' | 'external' | 'anchor_valid' | 'anchor_broken';
  reason?: string;
}

/**
 * Normalizes relative paths for file matching
 */
function normalizePath(basePath: string, relativePath: string): string {
  const cleanRelative = relativePath.split('#')[0].split('?')[0];
  if (!basePath.includes('/') && !basePath.includes('\\')) {
    // Top-level file
    return cleanRelative.replace(/^(\.\/|\/)/, '');
  }
  const parts = basePath.replace(/\\/g, '/').split('/');
  parts.pop(); // Remove filename
  const relParts = cleanRelative.split('/');

  for (const part of relParts) {
    if (part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * Parser for extracting and validating links in Markdown documents
 */
function parseAndValidateLinks(files: LoadedFile[]): {
  links: ExtractedLink[];
  fileMap: Set<string>;
} {
  const links: ExtractedLink[] = [];
  const fileSet = new Set<string>();

  // Register all loaded file paths (normalized)
  files.forEach((f) => {
    fileSet.add(f.name.toLowerCase().replace(/\\/g, '/'));
    if (f.relativePath) {
      fileSet.add(f.relativePath.toLowerCase().replace(/\\/g, '/'));
    }
  });

  // Extract headings per file for anchor validation
  const headingsPerFile = new Map<string, Set<string>>();
  files.forEach((f) => {
    const headings = new Set<string>();
    const lines = f.content.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^#{1,6}\s+(.+)$/);
      if (match) {
        const title = match[1].trim();
        const slug = title
          .toLowerCase()
          .replace(/[^\w\u3000-\u30fe\u4e00-\u9fa5\s-]/g, '')
          .replace(/\s+/g, '-');
        headings.add(slug);
        headings.add(title.toLowerCase());
      }
    });
    headingsPerFile.set(f.name.toLowerCase(), headings);
  });

  let linkIdCounter = 1;

  files.forEach((f) => {
    // Only parse markdown/text files
    if (f.name.endsWith('.png') || f.name.endsWith('.jpg') || f.name.endsWith('.svg') || f.name.endsWith('.gif')) {
      return;
    }

    const lines = f.content.split('\n');
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;

      // 1. Markdown Images ![alt](url)
      const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match: RegExpExecArray | null;
      while ((match = mdImageRegex.exec(lineText)) !== null) {
        const alt = match[1] || '[Image]';
        const target = match[2].trim();
        const isExternal = /^https?:\/\//i.test(target) || /^data:/i.test(target);

        let status: ExtractedLink['status'] = 'valid';
        let reason = '';

        if (isExternal) {
          status = 'external';
          reason = '外部画像URL (オフライン環境のため実在未検証)';
        } else {
          const normTarget = normalizePath(f.name, target).toLowerCase();
          const exists = Array.from(fileSet).some(
            (fp) => fp === normTarget || fp.endsWith('/' + normTarget) || normTarget.endsWith(fp)
          );

          if (files.length === 1 && !exists) {
            status = 'broken';
            reason = `単一ファイル検証: 参照画像 "${target}" がロード一覧に含まれていません`;
          } else if (!exists) {
            status = 'broken';
            reason = `画像参照エラー: ファイル "${target}" が見つかりません`;
          } else {
            status = 'valid';
            reason = '画像ファイルが読み込み済みリストに存在します';
          }
        }

        links.push({
          id: `link-${linkIdCounter++}`,
          sourceFile: f.name,
          line: lineNum,
          text: `![${alt}]`,
          target,
          type: 'relative_image',
          status,
          reason,
        });
      }

      // 2. Markdown Links [text](url) (Exclude image prefix !)
      const mdLinkRegex = /(?:^|[^!])\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = mdLinkRegex.exec(lineText)) !== null) {
        const text = match[1];
        const target = match[2].trim();

        if (target.startsWith('#')) {
          // Anchor link
          const anchorName = target.slice(1).toLowerCase();
          const headings = headingsPerFile.get(f.name.toLowerCase());
          const isValidAnchor = headings ? headings.has(anchorName) : false;

          links.push({
            id: `link-${linkIdCounter++}`,
            sourceFile: f.name,
            line: lineNum,
            text,
            target,
            type: 'anchor',
            status: isValidAnchor ? 'anchor_valid' : 'anchor_broken',
            reason: isValidAnchor
              ? '同一ドキュメント内に一致する見出しが存在します'
              : `アンカーエラー: 見出し "${target}" が見つかりません`,
          });
          continue;
        }

        const isExternal = /^https?:\/\//i.test(target) || /^mailto:/i.test(target);
        if (isExternal) {
          links.push({
            id: `link-${linkIdCounter++}`,
            sourceFile: f.name,
            line: lineNum,
            text,
            target,
            type: 'external_url',
            status: 'external',
            reason: '外部Webサイトへのリンク (接続確認スキップ)',
          });
          continue;
        }

        // Relative file link
        const normTarget = normalizePath(f.name, target).toLowerCase();
        const exists = Array.from(fileSet).some(
          (fp) => fp === normTarget || fp.endsWith('/' + normTarget) || normTarget.endsWith(fp)
        );

        let status: ExtractedLink['status'] = 'valid';
        let reason = '参照ファイルが存在します';

        if (!exists) {
          status = 'broken';
          reason = files.length === 1
            ? `単一ドキュメント解析: リンク先 "${target}" は別ファイル参照です`
            : `リンク切れ: 相対ファイル "${target}" がロード済みフォルダに存在しません`;
        }

        links.push({
          id: `link-${linkIdCounter++}`,
          sourceFile: f.name,
          line: lineNum,
          text,
          target,
          type: 'relative_file',
          status,
          reason,
        });
      }
    });
  });

  return { links, fileMap: fileSet };
}

/**
 * MarkdownLinkChecker Component UI
 */
const MarkdownLinkCheckerView: React.FC<PluginComponentProps> = () => {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [directText, setDirectText] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'direct'>('upload');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Combined input processing
  const effectiveFiles = useMemo<LoadedFile[]>(() => {
    if (activeTab === 'direct') {
      if (!directText.trim()) return [];
      const singleFile: LoadedFile = {
        id: 'direct-input-file',
        name: 'input_document.md',
        relativePath: 'input_document.md',
        size: directText.length,
        type: 'text/markdown',
        extension: '.md',
        lastModified: Date.now(),
        content: directText,
      };
      return [singleFile];
    }
    return loadedFiles;
  }, [activeTab, directText, loadedFiles]);

  const { links } = useMemo(() => {
    return parseAndValidateLinks(effectiveFiles);
  }, [effectiveFiles]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = links.length;
    const valid = links.filter((l) => l.status === 'valid' || l.status === 'anchor_valid').length;
    const broken = links.filter((l) => l.status === 'broken' || l.status === 'anchor_broken').length;
    const external = links.filter((l) => l.status === 'external').length;
    const images = links.filter((l) => l.type === 'relative_image').length;
    return { total, valid, broken, external, images };
  }, [links]);

  // Filtered link list
  const filteredLinks = useMemo(() => {
    if (statusFilter === 'all') return links;
    if (statusFilter === 'broken')
      return links.filter((l) => l.status === 'broken' || l.status === 'anchor_broken');
    if (statusFilter === 'valid')
      return links.filter((l) => l.status === 'valid' || l.status === 'anchor_valid');
    if (statusFilter === 'external') return links.filter((l) => l.status === 'external');
    if (statusFilter === 'images') return links.filter((l) => l.type === 'relative_image');
    return links;
  }, [links, statusFilter]);

  // Generate Report Data for Exporting
  const exportReportContent = useMemo(() => {
    return JSON.stringify(
      {
        title: 'Markdown Link Validation Report',
        generatedAt: new Date().toISOString(),
        totalFilesProcessed: effectiveFiles.length,
        summary: stats,
        brokenLinks: links
          .filter((l) => l.status === 'broken' || l.status === 'anchor_broken')
          .map((l) => ({
            file: l.sourceFile,
            line: l.line,
            text: l.text,
            target: l.target,
            type: l.type,
            reason: l.reason,
          })),
        allLinks: links,
      },
      null,
      2
    );
  }, [effectiveFiles.length, stats, links]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Info */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#f8fafc',
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔗</span>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Markdown Link Checker</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Markdown ドキュメント内の相対ファイルパス、画像参照エラー (`![alt](path)`), 見出しアンカー (`#anchor`), および外部URLを総合検証します。
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{
            padding: '0.6rem 1.2rem',
            background: activeTab === 'upload' ? '#2563eb' : 'transparent',
            color: activeTab === 'upload' ? '#ffffff' : '#64748b',
            border: 'none',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
        >
          📁 ファイル / フォルダ読み込み
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          style={{
            padding: '0.6rem 1.2rem',
            background: activeTab === 'direct' ? '#2563eb' : 'transparent',
            color: activeTab === 'direct' ? '#ffffff' : '#64748b',
            border: 'none',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s ease',
          }}
        >
          ✍️ テキスト直接貼り付け
        </button>
      </div>

      {/* Input Section */}
      {activeTab === 'upload' ? (
        <FileDropZone
          onFilesLoaded={(files) => setLoadedFiles((prev) => [...prev, ...files])}
          options={{
            accept: ['.md', '.markdown', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.txt'],
          }}
          multiple={true}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            Markdown テキスト入力:
          </label>
          <textarea
            value={directText}
            onChange={(e) => setDirectText(e.target.value)}
            placeholder="# Sample Document&#10;&#10;[Read Docs](./docs/readme.md)&#10;![Logo](./assets/logo.png)&#10;[Anchor Test](#sample-heading)&#10;"
            rows={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>
      )}

      {/* Summary Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }} className="animate-fade-in-up">
          <div className="glass-card hover-lift" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{stats.total}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>📊 総リンク数</div>
          </div>

          <div className="glass-card hover-lift" style={{ padding: '1rem', textAlign: 'center', borderColor: 'rgba(239, 68, 68, 0.4)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-error)' }}>{stats.broken}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-error)', marginTop: '0.2rem' }}>⚠️ リンク切れ/エラー</div>
          </div>

          <div className="glass-card hover-lift" style={{ padding: '1rem', textAlign: 'center', borderColor: 'rgba(16, 185, 129, 0.4)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-success)' }}>{stats.valid}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', marginTop: '0.2rem' }}>✅ 有効リンク</div>
          </div>

          <div className="glass-card hover-lift" style={{ padding: '1rem', textAlign: 'center', borderColor: 'rgba(14, 165, 233, 0.4)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-info)' }}>{stats.external}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--status-info)', marginTop: '0.2rem' }}>🌐 外部URL</div>
          </div>

          <div className="glass-card hover-lift" style={{ padding: '1rem', textAlign: 'center', borderColor: 'rgba(168, 85, 247, 0.4)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a855f7' }}>{stats.images}</div>
            <div style={{ fontSize: '0.75rem', color: '#a855f7', marginTop: '0.2rem' }}>🖼️ 画像参照</div>
          </div>
        </div>
      )}

      {/* Filter and Export Toolbar */}
      {links.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>絞り込み:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">すべてのリンク ({stats.total})</option>
              <option value="broken">⚠️ エラー/リンク切れ ({stats.broken})</option>
              <option value="valid">✅ 有効 ({stats.valid})</option>
              <option value="external">🌐 外部URL ({stats.external})</option>
              <option value="images">🖼️ 画像参照 ({stats.images})</option>
            </select>
          </div>

          <ExportButtons
            content={exportReportContent}
            filename="markdown_link_checker_report"
            addTimestamp={true}
          />
        </div>
      )}

      {/* Links Data Table */}
      {links.length > 0 ? (
        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem 1rem' }}>状態</th>
                <th style={{ padding: '0.75rem 1rem' }}>位置</th>
                <th style={{ padding: '0.75rem 1rem' }}>テキスト / Alt</th>
                <th style={{ padding: '0.75rem 1rem' }}>ターゲット URL / パス</th>
                <th style={{ padding: '0.75rem 1rem' }}>種別</th>
                <th style={{ padding: '0.75rem 1rem' }}>詳細理由</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((l) => {
                const isBroken = l.status === 'broken' || l.status === 'anchor_broken';
                return (
                  <tr
                    key={l.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isBroken ? '#fff5f5' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                      {l.status === 'valid' || l.status === 'anchor_valid' ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>✅ Valid</span>
                      ) : isBroken ? (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Broken</span>
                      ) : (
                        <span style={{ color: '#2563eb', fontWeight: 600 }}>🌐 External</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      <code>{l.sourceFile}:{l.line}</code>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#1e293b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.text}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#0284c7', maxWidth: '240px', wordBreak: 'break-all' }}>
                      <code>{l.target}</code>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {l.type === 'relative_image' && '🖼️ 画像'}
                      {l.type === 'relative_file' && '📄 ファイル'}
                      {l.type === 'anchor' && '⚓ アンカー'}
                      {l.type === 'external_url' && '🌐 外部URL'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: isBroken ? '#b91c1c' : '#475569', fontSize: '0.8rem' }}>
                      {l.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : effectiveFiles.length > 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          ℹ️ ロードされたドキュメント内に Markdown リンクや画像参照が見つかりませんでした。
        </div>
      ) : null}
    </div>
  );
};

/**
 * Export MarkdownLinkChecker ToolPlugin Registration Object
 */
export const markdownLinkCheckerPlugin: ToolPlugin = {
  metadata: {
    id: 'markdown-link-checker',
    name: 'Markdown Link Checker',
    description: 'Markdown ドキュメント内の相対パスリンク確認・画像参照エラー検出・リンク検証レポート出力機能を提供',
    version: '1.0.0',
    category: 'analyzer',
    icon: '🔗',
    author: 'DevTools Team',
    keywords: ['markdown', 'link', 'checker', 'broken-link', 'validator'],
  },
  component: MarkdownLinkCheckerView,
  onInit: () => {
    console.log('[MarkdownLinkCheckerPlugin] Plugin registered successfully!');
  },
};
