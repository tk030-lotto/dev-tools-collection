// --- Diff Types ---
export type DiffType = 'unchanged' | 'added' | 'removed';

export interface DiffLine {
  type: DiffType;
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

export interface WordToken {
  type: DiffType;
  text: string;
}

export interface DiffStats {
  addedLines: number;
  removedLines: number;
  unchangedLines: number;
  totalLines: number;
  similarityPercentage: number;
  oldCharCount: number;
  newCharCount: number;
}
