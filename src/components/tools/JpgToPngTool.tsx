import React, { useState } from 'react';
import { Download, ArrowRight } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const JpgToPngTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable in this browser.');
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Conversion to PNG failed.');
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setFile(selected);
        setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        setPngBlob(blob);
      }, 'image/png');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to convert file.');
    }
  };

  const handleDownload = () => {
    if (!pngBlob || !file) return;
    downloadBlob(pngBlob, `${stripExtension(file.name)}.png`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/jpeg,image/jpg,image/webp,image/*"
        label="Upload a JPG, JPEG, or WebP image"
        hint="Instantly converts to lossless PNG right inside your browser"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setFile(null);
          setDimensions(null);
          setPngBlob(null);
          setPreviewUrl(null);
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {file && pngBlob && previewUrl && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                {file.type || 'image/jpeg'} ({formatBytes(file.size)})
              </span>
              <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                image/png ({formatBytes(pngBlob.size)})
              </span>
              {dimensions && (
                <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  · {dimensions.w} × {dimensions.h} px
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              Download PNG
            </button>
          </div>

          <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900">
            <img
              src={previewUrl}
              alt="Converted PNG preview"
              className="max-h-[420px] max-w-full rounded object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
