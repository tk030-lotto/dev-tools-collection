import { ExportFormat, ExportOptions, ExportResult } from '../types/export';

/**
 * フォーマットに対応する MIME タイプを取得
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown;charset=utf-8';
    case 'html':
      return 'text/html;charset=utf-8';
    case 'json':
      return 'application/json;charset=utf-8';
    case 'text':
    default:
      return 'text/plain;charset=utf-8';
  }
}

/**
 * フォーマットに対応する標準拡張子を取得
 */
export function getExportFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'markdown':
      return '.md';
    case 'html':
      return '.html';
    case 'json':
      return '.json';
    case 'text':
    default:
      return '.txt';
  }
}

/**
 * タイムスタンプ文字列の生成 (YYYYMMDD_HHMMSS)
 */
function getTimestampString(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * OS予約文字 (/ \ : * ? " < > |) や不可視制御文字を除去・安全な文字に置換します
 */
export function sanitizeFilename(filename: string): string {
  // OS 予約文字および制御文字をアンダースコアに置換
  return filename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[\x00-\x1f\x7f]/g, '')
    .trim();
}

/**
 * 出力ファイル名の生成
 */
export function generateFilename(
  baseName: string,
  format: ExportFormat,
  addTimestamp: boolean = false
): string {
  const ext = getExportFileExtension(format);
  // サニタイズ適用
  let cleanName = sanitizeFilename(baseName);
  
  if (cleanName.endsWith(ext)) {
    cleanName = cleanName.slice(0, -ext.length);
  } else {
    cleanName = cleanName.replace(/\.[^/.]+$/, '');
  }

  if (!cleanName) {
    cleanName = 'report';
  }

  if (addTimestamp) {
    return `${cleanName}_${getTimestampString()}${ext}`;
  }

  return `${cleanName}${ext}`;
}

/**
 * テキストコンテンツをブラウザからファイルとしてダウンロード保存
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): ExportResult {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // リソース解放
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);

    return {
      success: true,
      filename,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `ファイルダウンロードに失敗しました: ${errorMessage}`,
    };
  }
}

/**
 * オプション指定に基づきレポートを適切な形式でエクスポート保存
 */
export function exportReport(
  content: string,
  options: ExportOptions
): ExportResult {
  const mimeType = options.mimeType || getMimeType(options.format);
  const filename = generateFilename(options.filename, options.format, options.addTimestamp);

  let formattedContent = content;

  // JSONフォーマット時の自動整形チェック
  if (options.format === 'json') {
    try {
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, 2);
    } catch {
      // JSON構文エラーでもそのままテキストとして出力
    }
  }

  const result = downloadFile(formattedContent, filename, mimeType);
  return {
    ...result,
    format: options.format,
  };
}

/**
 * テキストをクリップボードへコピー
 */
export async function copyToClipboard(text: string): Promise<ExportResult> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return {
        success: true,
        format: 'clipboard',
      };
    } else {
      // フォールバック (execCommand)
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        return {
          success: true,
          format: 'clipboard',
        };
      } else {
        throw new Error('execCommand copy returned false');
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      format: 'clipboard',
      error: `クリップボードへのコピーに失敗しました: ${errorMessage}`,
    };
  }
}
