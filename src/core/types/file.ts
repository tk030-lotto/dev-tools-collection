export interface LoadedFile {
  id: string;
  name: string;
  relativePath?: string;
  size: number;
  type: string;
  extension: string;
  content: string;
  lastModified: number;
}

export interface FileReadOptions {
  accept?: string[]; // 例: ['.md', '.txt', '.json']
  maxSizeBytes?: number; // デフォルト: 10MB
  readAs?: 'text' | 'dataUrl';
}

export type FileErrorCode = 
  | 'INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'READ_FAILED'
  | 'EMPTY_FILE';

export interface FileValidationError {
  fileName: string;
  code: FileErrorCode;
  message: string;
}

export interface FileReadResult {
  loadedFiles: LoadedFile[];
  errors: FileValidationError[];
}
