/**
 * Core Export Types
 * 共通レポート・データエクスポート機能の型定義
 */

export type ExportFormat = 'markdown' | 'html' | 'json' | 'text';

export interface ExportOptions {
  /** 出力ファイル名（拡張子なし、または指定拡張子付き） */
  filename: string;
  /** 出力フォーマット */
  format: ExportFormat;
  /** オプション: MIMEタイプを直接指定する場合 */
  mimeType?: string;
  /** オプション: ファイル名に YYYYMMDD_HHMMSS 形式のタイムスタンプを自動付与するかどうか */
  addTimestamp?: boolean;
}

export interface ExportResult {
  /** 処理が成功したか */
  success: boolean;
  /** 処理対象フォーマット */
  format?: ExportFormat | 'clipboard';
  /** 保存・コピーされたファイル名（ダウンロードの場合） */
  filename?: string;
  /** エラーメッセージ（失敗時） */
  error?: string;
}
