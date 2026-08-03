import React, { useState } from 'react';
import { ExportFormat, ExportResult } from '../types/export';
import { exportReport, copyToClipboard } from '../services/exportService';
import './ExportButtons.css';

export interface ExportButtonsProps {
  /** エクスポート・コピー対象の文字列コンテンツ */
  content: string;
  /** 出力ファイル名（ベース名、拡張子なし） */
  filename?: string;
  /** 表示する保存フォーマット指定（未指定時は全フォーマット表示） */
  formats?: ExportFormat[];
  /** クリップボードコピーボタンを表示するか */
  showCopy?: boolean;
  /** ファイル名に自動タイムスタンプを付与するか */
  addTimestamp?: boolean;
  /** 追加クラス名 */
  className?: string;
  /** エクスポート成功時コールバック */
  onExportSuccess?: (result: ExportResult) => void;
  /** エクスポート失敗時コールバック */
  onExportError?: (error: string) => void;
}

type ActiveFeedbackState = {
  key: string; // 'copy' | ExportFormat
  type: 'success' | 'error';
  message: string;
} | null;

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  content,
  filename = 'report',
  formats = ['markdown', 'html', 'json', 'text'],
  showCopy = true,
  addTimestamp = false,
  className = '',
  onExportSuccess,
  onExportError,
}) => {
  const [feedback, setFeedback] = useState<ActiveFeedbackState>(null);

  const showFeedback = (key: string, type: 'success' | 'error', message: string) => {
    setFeedback({ key, type, message });
    setTimeout(() => {
      setFeedback((current) => (current?.key === key ? null : current));
    }, 2500);
  };

  const handleCopy = async () => {
    if (!content) {
      const errMsg = 'コピー対象のコンテンツが空です';
      showFeedback('copy', 'error', errMsg);
      onExportError?.(errMsg);
      return;
    }

    const res = await copyToClipboard(content);
    if (res.success) {
      showFeedback('copy', 'success', 'クリップボードにコピーしました');
      onExportSuccess?.(res);
    } else {
      const errMsg = res.error || 'コピーに失敗しました';
      showFeedback('copy', 'error', errMsg);
      onExportError?.(errMsg);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!content) {
      const errMsg = '保存対象のコンテンツが空です';
      showFeedback(format, 'error', errMsg);
      onExportError?.(errMsg);
      return;
    }

    const res = exportReport(content, {
      filename,
      format,
      addTimestamp,
    });

    if (res.success) {
      showFeedback(format, 'success', `${format.toUpperCase()}形式でダウンロード保存しました`);
      onExportSuccess?.(res);
    } else {
      const errMsg = res.error || '保存に失敗しました';
      showFeedback(format, 'error', errMsg);
      onExportError?.(errMsg);
    }
  };

  const getFormatLabel = (format: ExportFormat): string => {
    switch (format) {
      case 'markdown':
        return 'Markdown 保存';
      case 'html':
        return 'HTML 保存';
      case 'json':
        return 'JSON 保存';
      case 'text':
        return 'Text 保存';
    }
  };

  const getFormatIcon = (format: ExportFormat): React.ReactNode => {
    switch (format) {
      case 'markdown':
        return (
          <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 13v-3l2.5 2.5L14 10v3" />
          </svg>
        );
      case 'html':
        return (
          <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      case 'json':
        return (
          <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3H7a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1" />
            <path d="M16 3h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1" />
          </svg>
        );
      case 'text':
      default:
        return (
          <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
    }
  };

  return (
    <div className={`export-buttons-container ${className}`}>
      <div className="export-buttons-group">
        {showCopy && (
          <button
            type="button"
            className={`export-btn export-btn-copy ${
              feedback?.key === 'copy' ? (feedback.type === 'success' ? 'export-btn-success' : 'export-btn-error') : ''
            }`}
            onClick={handleCopy}
            title="クリップボードにコピー"
          >
            {feedback?.key === 'copy' && feedback.type === 'success' ? (
              <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            <span>{feedback?.key === 'copy' && feedback.type === 'success' ? 'Copied!' : 'コピー'}</span>
          </button>
        )}

        {formats.map((fmt) => {
          const isFeedbackThis = feedback?.key === fmt;
          const isSuccess = isFeedbackThis && feedback.type === 'success';
          const isError = isFeedbackThis && feedback.type === 'error';

          return (
            <button
              key={fmt}
              type="button"
              className={`export-btn export-btn-${fmt} ${
                isSuccess ? 'export-btn-success' : isError ? 'export-btn-error' : ''
              }`}
              onClick={() => handleExport(fmt)}
              title={`${fmt.toUpperCase()} 形式で保存`}
            >
              {isSuccess ? (
                <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                getFormatIcon(fmt)
              )}
              <span>{isSuccess ? 'Downloaded!' : getFormatLabel(fmt)}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div className={`export-toast ${feedback.type === 'error' ? 'export-toast-error' : ''}`}>
          {feedback.type === 'success' ? (
            <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg className="export-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
