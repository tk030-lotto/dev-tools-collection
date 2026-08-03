import React, { useState, useMemo } from 'react';
import { ToolPlugin, PluginComponentProps } from '../core/types/plugin';
import { FileDropZone } from '../core/components/FileDropZone';
import { ExportButtons } from '../core/components/ExportButtons';
import { LoadedFile } from '../core/types/file';

/**
 * Severity level of detected issues
 */
export type IssueSeverity = 'error' | 'warning' | 'info';

/**
 * Issue Category
 */
export type IssueCategory = 'secret' | 'debug' | 'ignored_file' | 'large_file';

/**
 * Individual preflight issue interface
 */
export interface PreflightIssue {
  id: string;
  file: string;
  line?: number;
  category: IssueCategory;
  severity: IssueSeverity;
  ruleName: string;
  message: string;
  snippet?: string;
}

/**
 * Preflight Check Rule Definition
 */
interface CheckRule {
  name: string;
  category: IssueCategory;
  severity: IssueSeverity;
  pattern?: RegExp;
  description: string;
}

// Rules for text file scanning
const TEXT_RULES: CheckRule[] = [
  {
    name: 'OpenAI API Key',
    category: 'secret',
    severity: 'error',
    pattern: /sk-[a-zA-Z0-9T3BlbkFJ]{20,}/g,
    description: 'OpenAI API Key detected in source code.',
  },
  {
    name: 'AWS Access Key ID',
    category: 'secret',
    severity: 'error',
    pattern: /AKIA[0-9A-Z]{16}/g,
    description: 'AWS Access Key ID detected.',
  },
  {
    name: 'GitHub Personal Access Token',
    category: 'secret',
    severity: 'error',
    pattern: /(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/g,
    description: 'GitHub Personal Access Token detected.',
  },
  {
    name: 'Private Key Block',
    category: 'secret',
    severity: 'error',
    pattern: /-----BEGIN (RSA|OPENSSH|EC|DSA|PGP)? PRIVATE KEY-----/g,
    description: 'Private encryption key header detected.',
  },
  {
    name: 'Hardcoded Secret Attribute',
    category: 'secret',
    severity: 'error',
    pattern: /(api_key|apikey|secret_key|private_key|access_token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{8,}['"]/gi,
    description: 'Potential hardcoded secret variable found.',
  },
  {
    name: 'TODO / FIXME Comment',
    category: 'debug',
    severity: 'info',
    pattern: /\b(TODO|FIXME|HACK|XXX)\b/gi,
    description: 'Unresolved TODO or FIXME comment remaining.',
  },
  {
    name: 'Console Log Statement',
    category: 'debug',
    severity: 'warning',
    pattern: /\bconsole\.(log|debug|dir|trace)\s*\(/g,
    description: 'console.log or debug logging statement found.',
  },
  {
    name: 'Debugger Statement',
    category: 'debug',
    severity: 'error',
    pattern: /\bdebugger\b/g,
    description: 'debugger breakpoint statement remaining in production code.',
  },
];

// Ignored/Forbidden patterns for file path checking
const FORBIDDEN_FILE_PATTERNS: { pattern: RegExp; name: string; severity: IssueSeverity; message: string }[] = [
  {
    pattern: /(^|\/)\.env($|\..*)/i,
    name: 'Environment File (.env)',
    severity: 'error',
    message: 'Environment configuration file containing potential credentials.',
  },
  {
    pattern: /(^|\/)node_modules(\/|$)/i,
    name: 'node_modules Directory',
    severity: 'warning',
    message: 'Dependency directory should be excluded via .gitignore.',
  },
  {
    pattern: /(^|\/)(\.venv|venv|__pycache__)(\/|$)/i,
    name: 'Python Environment / Cache',
    severity: 'warning',
    message: 'Python virtual environment or pycache directory included.',
  },
  {
    pattern: /(^|\/)\.DS_Store$/i,
    name: 'macOS System File (.DS_Store)',
    severity: 'info',
    message: 'macOS folder metadata file should be excluded.',
  },
  {
    pattern: /(^|\/)(Thumbs\.db|desktop\.ini)$/i,
    name: 'Windows System File',
    severity: 'info',
    message: 'Windows OS metadata file should be excluded.',
  },
  {
    pattern: /\.(tmp|bak|swp|orig)$/i,
    name: 'Temporary / Backup File',
    severity: 'warning',
    message: 'Temporary or backup file left in workspace.',
  },
];

const LARGE_FILE_THRESHOLD_WARN = 1 * 1024 * 1024; // 1 MB
const LARGE_FILE_THRESHOLD_ERR = 5 * 1024 * 1024; // 5 MB

/**
 * Scan files for security and quality issues
 */
function scanFilesForPreflight(files: LoadedFile[]): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  let idCounter = 1;

  files.forEach((file) => {
    const filePath = file.relativePath || file.name;

    // 1. Check for File Path Rules (Ignored / Temp Files)
    FORBIDDEN_FILE_PATTERNS.forEach((rule) => {
      if (rule.pattern.test(filePath)) {
        issues.push({
          id: `issue-${idCounter++}`,
          file: filePath,
          category: 'ignored_file',
          severity: rule.severity,
          ruleName: rule.name,
          message: rule.message,
        });
      }
    });

    // 2. Check for File Size Rules
    if (file.size >= LARGE_FILE_THRESHOLD_ERR) {
      issues.push({
        id: `issue-${idCounter++}`,
        file: filePath,
        category: 'large_file',
        severity: 'error',
        ruleName: 'Very Large File (> 5MB)',
        message: `File size is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Large files slow down Git repositories.`,
      });
    } else if (file.size >= LARGE_FILE_THRESHOLD_WARN) {
      issues.push({
        id: `issue-${idCounter++}`,
        file: filePath,
        category: 'large_file',
        severity: 'warning',
        ruleName: 'Large File (> 1MB)',
        message: `File size is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Consider using LFS or excluding.`,
      });
    }

    // 3. Scan Text File Contents
    if (file.content) {
      const lines = file.content.split('\n');

      lines.forEach((lineText, lineIdx) => {
        const lineNum = lineIdx + 1;

        TEXT_RULES.forEach((rule) => {
          if (!rule.pattern) return;
          // Reset regex state
          rule.pattern.lastIndex = 0;

          let match: RegExpExecArray | null;
          while ((match = rule.pattern.exec(lineText)) !== null) {
            // Trim snippet preview for display
            const snippet = lineText.trim();
            const preview = snippet.length > 100 ? snippet.substring(0, 100) + '...' : snippet;

            // 偽陽性 (False Positive) 防止フィルター: dummy, example, your-api-key などのサンプル文字列を除外
            const isSecret = rule.category === 'secret';
            const matchedStr = match[0].toLowerCase();
            const isDummySecret =
              isSecret &&
              (matchedStr.includes('example') ||
                matchedStr.includes('dummy') ||
                matchedStr.includes('sample') ||
                matchedStr.includes('your_api_key') ||
                matchedStr.includes('your-key') ||
                matchedStr.includes('xxxx') ||
                matchedStr.includes('123456'));

            if (!isDummySecret) {
              issues.push({
                id: `issue-${idCounter++}`,
                file: filePath,
                line: lineNum,
                category: rule.category,
                severity: rule.severity,
                ruleName: rule.name,
                message: rule.description,
                snippet: preview,
              });
            }

            // Prevent infinite loop for non-global regex or zero-width match
            if (!rule.pattern.global || match.index === rule.pattern.lastIndex) {
              rule.pattern.lastIndex++;
            }
          }
        });
      });
    }
  });

  return issues;
}

/**
 * GitHubPreflight Component
 */
const GitHubPreflightComponent: React.FC<PluginComponentProps> = () => {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const issues = useMemo(() => {
    return scanFilesForPreflight(loadedFiles);
  }, [loadedFiles]);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalFiles = loadedFiles.length;
    const errors = issues.filter((i) => i.severity === 'error').length;
    const warnings = issues.filter((i) => i.severity === 'warning').length;
    const infos = issues.filter((i) => i.severity === 'info').length;

    const secrets = issues.filter((i) => i.category === 'secret').length;
    const debugs = issues.filter((i) => i.category === 'debug').length;
    const ignored = issues.filter((i) => i.category === 'ignored_file').length;
    const largeFiles = issues.filter((i) => i.category === 'large_file').length;

    let overallStatus: 'PASS' | 'WARNING' | 'CRITICAL' = 'PASS';
    if (errors > 0) {
      overallStatus = 'CRITICAL';
    } else if (warnings > 0) {
      overallStatus = 'WARNING';
    }

    return {
      totalFiles,
      totalIssues: issues.length,
      errors,
      warnings,
      infos,
      secrets,
      debugs,
      ignored,
      largeFiles,
      overallStatus,
    };
  }, [loadedFiles, issues]);

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inFileName = issue.file.toLowerCase().includes(query);
        const inRule = issue.ruleName.toLowerCase().includes(query);
        const inMsg = issue.message.toLowerCase().includes(query);
        const inSnippet = issue.snippet ? issue.snippet.toLowerCase().includes(query) : false;
        if (!inFileName && !inRule && !inMsg && !inSnippet) return false;
      }

      return true;
    });
  }, [issues, severityFilter, categoryFilter, searchQuery]);

  // Markdown Formatted Report for Export
  const markdownReport = useMemo(() => {
    return `# GitHubPreflight Security & Quality Audit Report

- **Date**: ${new Date().toLocaleString()}
- **Status**: ${stats.overallStatus}
- **Total Scanned Files**: ${stats.totalFiles}
- **Total Detected Issues**: ${stats.totalIssues}
- **Critical Errors**: ${stats.errors}
- **Warnings**: ${stats.warnings}
- **Info Notices**: ${stats.infos}

## Issue Breakdown by Category
- **API Secrets / Credentials**: ${stats.secrets}
- **Debug / TODO Code**: ${stats.debugs}
- **Ignored / System Files**: ${stats.ignored}
- **Large Files (>1MB)**: ${stats.largeFiles}

## Detailed Issues List
${
  issues.length === 0
    ? '✅ No issues detected. Your project is clean!'
    : issues
        .map(
          (i) =>
            `- [${i.severity.toUpperCase()}] **${i.ruleName}** (${i.category}) in \`${i.file}\`${
              i.line ? ` (Line ${i.line})` : ''
            }\n  - ${i.message}${i.snippet ? `\n  - Preview: \`${i.snippet}\`` : ''}`
        )
        .join('\n')
}
`;
  }, [stats, issues]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* File Drop & Selection Zone */}
      <section style={{ background: 'var(--color-bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📂 Target Project Files
        </h3>
        <FileDropZone
          onFilesLoaded={(files) => setLoadedFiles(files)}
          options={{ maxSizeBytes: 20 * 1024 * 1024 }}
          title="プロジェクトファイルをドラッグ＆ドロップ"
          description="フォルダ・全ファイルを選択して公開前点検を実行します"
        />
      </section>

      {/* Analysis Summary Header */}
      {loadedFiles.length > 0 && (
        <>
          <section
            style={{
              background: 'var(--color-bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: `1px solid ${
                stats.overallStatus === 'CRITICAL'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : stats.overallStatus === 'WARNING'
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(16, 185, 129, 0.4)'
              }`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--color-text-main)' }}>Audit Summary</h2>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      background:
                        stats.overallStatus === 'CRITICAL'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : stats.overallStatus === 'WARNING'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(16, 185, 129, 0.15)',
                      color:
                        stats.overallStatus === 'CRITICAL'
                          ? '#ef4444'
                          : stats.overallStatus === 'WARNING'
                          ? '#f59e0b'
                          : '#10b981',
                      border: `1px solid ${
                        stats.overallStatus === 'CRITICAL'
                          ? '#ef4444'
                          : stats.overallStatus === 'WARNING'
                          ? '#f59e0b'
                          : '#10b981'
                      }`,
                    }}
                  >
                    {stats.overallStatus === 'CRITICAL' ? '🚨 Critical Issues Found' : stats.overallStatus === 'WARNING' ? '⚠️ Warnings Detected' : '✅ Ready to Push'}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Scanned {stats.totalFiles} file(s) — Found {stats.totalIssues} issue(s)
                </p>
              </div>

              <ExportButtons content={markdownReport} filename="github-preflight-report" addTimestamp={true} />
            </div>

            {/* Stat Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Critical Errors</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444', marginTop: '2px' }}>{stats.errors}</div>
              </div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Warnings</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b', marginTop: '2px' }}>{stats.warnings}</div>
              </div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Info Notices</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6', marginTop: '2px' }}>{stats.infos}</div>
              </div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>API Secrets</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899', marginTop: '2px' }}>{stats.secrets}</div>
              </div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Debug Code</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6', marginTop: '2px' }}>{stats.debugs}</div>
              </div>
              <div style={{ background: 'var(--color-bg-subtle)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Ignored Files</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4', marginTop: '2px' }}>{stats.ignored}</div>
              </div>
            </div>
          </section>

          {/* Filters & Search Control Bar */}
          <section
            style={{
              background: 'var(--color-bg-card)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Severity Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Severity:</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Severities</option>
                  <option value="error">Error ({stats.errors})</option>
                  <option value="warning">Warning ({stats.warnings})</option>
                  <option value="info">Info ({stats.infos})</option>
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Category:</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-main)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Categories</option>
                  <option value="secret">Secrets ({stats.secrets})</option>
                  <option value="debug">Debug / TODO ({stats.debugs})</option>
                  <option value="ignored_file">Ignored Files ({stats.ignored})</option>
                  <option value="large_file">Large Files ({stats.largeFiles})</option>
                </select>
              </div>
            </div>

            {/* Keyword Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <input
                type="text"
                placeholder="Search rule, file or snippet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-subtle)',
                  color: 'var(--color-text-main)',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </section>

          {/* Issues Data Table */}
          <section
            style={{
              background: 'var(--color-bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                Detected Issues ({filteredIssues.length} / {issues.length})
              </h3>
            </div>

            {filteredIssues.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {issues.length === 0 ? '🎉 No security or quality issues detected! Your project looks clean.' : 'No issues match the selected filter criteria.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '12px 16px', width: '100px' }}>Severity</th>
                      <th style={{ padding: '12px 16px', width: '160px' }}>Rule</th>
                      <th style={{ padding: '12px 16px' }}>File Path & Location</th>
                      <th style={{ padding: '12px 16px' }}>Description / Snippet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIssues.map((issue) => {
                      const sevColor = issue.severity === 'error' ? '#ef4444' : issue.severity === 'warning' ? '#f59e0b' : '#3b82f6';
                      const sevBg = issue.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' : issue.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)';

                      return (
                        <tr key={issue.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s ease' }}>
                          {/* Severity Badge */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                background: sevBg,
                                color: sevColor,
                                border: `1px solid ${sevColor}`,
                              }}
                            >
                              {issue.severity}
                            </span>
                          </td>

                          {/* Rule Name & Category */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{issue.ruleName}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                              {issue.category.replace('_', ' ')}
                            </span>
                          </td>

                          {/* File Path & Line Number */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ fontFamily: 'monospace', color: 'var(--color-accent)', fontWeight: 500, wordBreak: 'break-all' }}>
                              {issue.file}
                            </div>
                            {issue.line && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Line: {issue.line}</span>
                            )}
                          </td>

                          {/* Description & Code Snippet Preview */}
                          <td style={{ padding: '12px 16px', verticalAlign: 'top' }}>
                            <div style={{ color: 'var(--color-text-main)', marginBottom: issue.snippet ? '6px' : 0 }}>{issue.message}</div>
                            {issue.snippet && (
                              <pre
                                style={{
                                  margin: 0,
                                  padding: '8px 12px',
                                  background: 'var(--color-bg-subtle)',
                                  borderRadius: '6px',
                                  border: '1px solid var(--color-border)',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  color: 'var(--color-text-muted)',
                                  overflowX: 'auto',
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-all',
                                }}
                              >
                                <code>{issue.snippet}</code>
                              </pre>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

/**
 * Plugin Export Definition
 */
export const gitHubPreflightPlugin: ToolPlugin = {
  metadata: {
    id: 'github-preflight',
    name: 'GitHub Preflight',
    description: 'APIキー/アクセストークン検出、TODO/console.log検査、不要・大容量ファイル事前点検ツール',
    version: '1.0.0',
    category: 'analyzer',
    icon: '🚀',
    author: 'DevTools Team',
    keywords: ['github', 'preflight', 'secret-checker', 'code-quality', 'security'],
  },
  component: GitHubPreflightComponent,
  onInit: () => {
    console.log('[GitHubPreflightPlugin] Registered successfully!');
  },
};
