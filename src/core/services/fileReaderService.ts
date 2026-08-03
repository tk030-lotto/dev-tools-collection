import {
  LoadedFile,
  FileReadOptions,
  FileValidationError,
  FileReadResult,
} from '../types/file';

/**
 * バイト数を読み取りやすい単位（B, KB, MB, GB）に変換します
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * ファイルの拡張子を取得します（ドット付き小文字: 例 '.md'）
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot).toLowerCase();
}

/**
 * ファイルのバリデーションを行います
 */
export function validateFile(
  file: File,
  options?: FileReadOptions
): FileValidationError | null {
  const maxSizeBytes = options?.maxSizeBytes ?? 20 * 1024 * 1024; // 20MB default

  if (file.size > maxSizeBytes) {
    return {
      fileName: file.name,
      code: 'FILE_TOO_LARGE',
      message: `ファイルサイズが上限 (${formatFileSize(maxSizeBytes)}) を超えています: ${formatFileSize(file.size)}`,
    };
  }

  if (options?.accept && options.accept.length > 0) {
    const ext = getFileExtension(file.name);
    const isAccepted = options.accept.some((allowedExt) => {
      const normalizedAllowed = allowedExt.startsWith('.')
        ? allowedExt.toLowerCase()
        : `.${allowedExt.toLowerCase()}`;
      return ext === normalizedAllowed;
    });

    if (!isAccepted) {
      return {
        fileName: file.name,
        code: 'INVALID_TYPE',
        message: `サポートされていないファイル形式です。許可形式: ${options.accept.join(', ')}`,
      };
    }
  }

  return null;
}

/**
 * 単一ファイルを UTF-8 テキストとして読み込みます
 */
export function readFileAsText(file: File): Promise<LoadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const content = (reader.result as string) || '';
      
      // バイナリファイル誤検出チェック (先頭4KBにNull文字が含まれる場合)
      const sample = content.substring(0, 4096);
      if (sample.includes('\0')) {
        reject({
          fileName: file.name,
          code: 'INVALID_TYPE',
          message: 'バイナリまたはサポートされていない非テキスト形式のファイルが検出されました。',
        } as FileValidationError);
        return;
      }

      const loadedFile: LoadedFile = {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
        size: file.size,
        type: file.type || 'text/plain',
        extension: getFileExtension(file.name),
        content,
        lastModified: file.lastModified,
      };
      resolve(loadedFile);
    };

    reader.onerror = () => {
      reject({
        fileName: file.name,
        code: 'READ_FAILED',
        message: `ファイルの読み込みに失敗しました: ${reader.error?.message || '不明なエラー'}`,
      } as FileValidationError);
    };

    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 単一ファイルを DataURL として読み込みます
 */
export function readFileAsDataUrl(file: File): Promise<LoadedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const content = (reader.result as string) || '';
      const loadedFile: LoadedFile = {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        relativePath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        extension: getFileExtension(file.name),
        content,
        lastModified: file.lastModified,
      };
      resolve(loadedFile);
    };

    reader.onerror = () => {
      reject({
        fileName: file.name,
        code: 'READ_FAILED',
        message: `ファイルの読み込みに失敗しました: ${reader.error?.message || '不明なエラー'}`,
      } as FileValidationError);
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 複数ファイルの一括バリデーションおよび読み込みを行います
 */
export async function readFiles(
  files: File[],
  options?: FileReadOptions
): Promise<FileReadResult> {
  const loadedFiles: LoadedFile[] = [];
  const errors: FileValidationError[] = [];

  const readFunc = options?.readAs === 'dataUrl' ? readFileAsDataUrl : readFileAsText;

  for (const file of files) {
    const validationError = validateFile(file, options);
    if (validationError) {
      errors.push(validationError);
      continue;
    }

    try {
      const loaded = await readFunc(file);
      loadedFiles.push(loaded);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        errors.push(err as FileValidationError);
      } else {
        errors.push({
          fileName: file.name,
          code: 'READ_FAILED',
          message: `ファイルの読み込み中にエラーが発生しました。`,
        });
      }
    }
  }

  return { loadedFiles, errors };
}
