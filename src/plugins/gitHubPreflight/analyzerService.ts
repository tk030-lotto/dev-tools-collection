import { LoadedFile } from '../../core/types/file';
import { IssueCategory, IssueSeverity, PreflightIssue } from './types';

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
export function scanFilesForPreflight(files: LoadedFile[]): PreflightIssue[] {
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
