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
