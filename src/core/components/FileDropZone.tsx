import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { LoadedFile, FileReadOptions, FileValidationError } from '../types/file';
import { readFiles, formatFileSize } from '../services/fileReaderService';
import './FileDropZone.css';

export interface FileDropZoneProps {
  onFilesLoaded?: (files: LoadedFile[]) => void;
  onErrors?: (errors: FileValidationError[]) => void;
  options?: FileReadOptions;
  multiple?: boolean;
  title?: string;
  description?: string;
  className?: string;
  showFileList?: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFilesLoaded,
  onErrors,
  options,
  multiple = true,
  title = 'ファイルをドラッグ＆ドロップ',
  description = 'またはクリックしてファイルを選択します',
  className = '',
  showFileList = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
  const [errors, setErrors] = useState<FileValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptString = options?.accept?.join(',') || '';

  const handleProcessFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsLoading(true);
    setErrors([]);

    const filesArray = Array.from(fileList);
    const targetFiles = multiple ? filesArray : [filesArray[0]];

    const result = await readFiles(targetFiles, options);

    setIsLoading(false);

    if (result.errors.length > 0) {
      setErrors(result.errors);
      if (onErrors) onErrors(result.errors);
    }

    if (result.loadedFiles.length > 0) {
      const updatedFiles = multiple
        ? [...loadedFiles, ...result.loadedFiles]
        : result.loadedFiles;

      setLoadedFiles(updatedFiles);
      if (onFilesLoaded) onFilesLoaded(updatedFiles);
    }
  };

  // Drag Events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // ドロップゾーン外に出た時のみ解除
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleProcessFiles(e.dataTransfer.files);
    }
  };

  // File Input Click & Change
  const handleClickDropZone = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await handleProcessFiles(e.target.files);
    // リセットして同じファイルの再選択を許可
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    const updated = loadedFiles.filter((f) => f.id !== fileId);
    setLoadedFiles(updated);
    if (onFilesLoaded) onFilesLoaded(updated);
  };

  const handleClearAll = () => {
    setLoadedFiles([]);
    setErrors([]);
    if (onFilesLoaded) onFilesLoaded([]);
  };

  return (
    <div className={`file-dropzone-container ${className}`}>
      {/* Drop Zone Box */}
      <div
        className={`file-dropzone ${isDragging ? 'is-dragging' : ''} ${
          errors.length > 0 ? 'has-error' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickDropZone}
        role="button"
        tabIndex={0}
        aria-label={title}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="dropzone-input"
          accept={acceptString}
          multiple={multiple}
          onChange={handleInputChange}
        />

        {isLoading ? (
          <div className="dropzone-loading">
            <div className="spinner"></div>
            <span>ファイルを読み込み中...</span>
          </div>
        ) : (
          <>
            <div className="dropzone-icon-wrapper">
              <svg
                className="dropzone-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>

            <div className="dropzone-text-content">
              <h3 className="dropzone-title">{title}</h3>
              <p className="dropzone-description">
                {description}
                <span className="dropzone-browse-btn">ファイル参照</span>
              </p>
            </div>

            <div className="dropzone-badge-group">
              {options?.accept && options.accept.length > 0 && (
                <span className="badge badge-primary">
                  {options.accept.join(', ')}
                </span>
              )}
              {options?.maxSizeBytes && (
                <span className="badge badge-secondary">
                  最大 {formatFileSize(options.maxSizeBytes)}
                </span>
              )}
              {multiple ? (
                <span className="badge badge-secondary">複数選択可</span>
              ) : (
                <span className="badge badge-secondary">単一ファイル</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* エラー一覧 */}
      {errors.length > 0 && (
        <div className="dropzone-errors">
          {errors.map((err, idx) => (
            <div key={idx} className="error-item">
              <span>
                <strong>{err.fileName}</strong>: {err.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 選択済みファイル一覧 */}
      {showFileList && loadedFiles.length > 0 && (
        <div className="loaded-files-container animate-fade-in">
          <div className="loaded-files-header">
            <div className="loaded-files-title">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              選択済みファイル ({loadedFiles.length} 件)
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearAll}
            >
              すべて解除
            </button>
          </div>

          <div className="loaded-files-list">
            {loadedFiles.map((file) => (
              <div key={file.id} className="loaded-file-item">
                <div className="loaded-file-info">
                  <span className="file-icon-badge">
                    {file.extension ? file.extension.replace('.', '') : 'FILE'}
                  </span>
                  <div>
                    <div className="file-name-text" title={file.name}>
                      {file.name}
                    </div>
                    <div className="file-size-text">
                      {formatFileSize(file.size)} • {file.content.length} 文字
                    </div>
                  </div>
                </div>

                <div className="file-actions">
                  <button
                    className="btn-icon"
                    onClick={() => handleRemoveFile(file.id)}
                    title="ファイルを削除"
                    aria-label="ファイルを削除"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
