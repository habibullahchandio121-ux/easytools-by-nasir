import React, { useRef, useState } from 'react';
import { Upload, X, FileCheck2 } from 'lucide-react';
import { formatBytes } from '../../utils/fileHelpers';

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  file?: File | null;
  files?: File[];
  onFilesSelected: (files: File[]) => void;
  onClear?: () => void;
  compact?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  multiple = false,
  label,
  hint,
  file,
  files,
  onFilesSelected,
  onClear,
  compact = false,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) {
      onFilesSelected(multiple ? dropped : [dropped[0]]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files ? Array.from(e.target.files) : [];
    if (picked.length > 0) {
      onFilesSelected(multiple ? picked : [picked[0]]);
    }
    e.target.value = '';
  };

  const hasSingleFile = Boolean(file);
  const hasMultipleFiles = Boolean(files && files.length > 0);

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        aria-label={label}
      />

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          compact ? 'px-4 py-5' : 'px-6 py-8'
        } ${
          isDragging
            ? 'border-blue-600 bg-blue-50/70 dark:border-blue-400 dark:bg-blue-950/30'
            : 'border-slate-300 bg-slate-50/60 hover:border-blue-500 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-500 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-400 dark:group-hover:bg-blue-900/60">
          <Upload className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {hint && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-600">
          <Upload className="h-3.5 w-3.5" />
          Upload File{multiple ? 's' : ''}
        </span>
      </div>

      {hasSingleFile && file && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileCheck2 className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span className="truncate font-medium text-slate-800 dark:text-slate-100">
              {file.name}
            </span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {formatBytes(file.size)}
            </span>
          </div>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove uploaded file"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {hasMultipleFiles && files && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span className="font-medium tabular-nums">
            {files.length} file{files.length > 1 ? 's' : ''} loaded ·{' '}
            {formatBytes(files.reduce((acc, f) => acc + f.size, 0))}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};
