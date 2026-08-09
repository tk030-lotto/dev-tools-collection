/**
 * 整合性問題の種別
 */
export type IssueType =
  | 'term_inconsistency'
  | 'task_status_mismatch'
  | 'missing_section'
  | 'unfinished_todo';

/**
 * 整合性問題の深刻度
 */
export type IssueSeverity = 'high' | 'medium' | 'low';

/**
 * 整合性問題の定義
 */
export interface ConsistencyIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  targetFiles: string[];
  lineNumbers?: { file: string; line: number }[];
  suggestion?: string;
}

/**
 * タスクIDとその各ドキュメントでのステータス
 */
export interface TaskMatrixItem {
  taskId: string;
  statuses: { [filename: string]: string };
  isConsistent: boolean;
}

/**
 * 用語の揺れグループ
 */
export interface TermVariantGroup {
  baseTerm: string;
  variants: { text: string; count: number; files: string[] }[];
}

/**
 * 全体解析結果
 */
export interface AnalysisResult {
  score: number;
  totalFiles: number;
  issues: ConsistencyIssue[];
  taskMatrix: TaskMatrixItem[];
  termVariants: TermVariantGroup[];
  stats: {
    highCount: number;
    mediumCount: number;
    lowCount: number;
    termCount: number;
    taskMismatchCount: number;
    missingSectionCount: number;
    todoCount: number;
  };
}
