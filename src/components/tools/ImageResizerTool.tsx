import React, { useEffect, useState } from 'react';
import { Download, Lock, Unlock } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const ImageResizerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      setFile(selected);
      setImageEl(img);
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image.');
    }
  };

  const handleWidthChange = (val: number) => {
    const clean = Math.max(1, Math.min(8000, val || 1));
    setWidth(clean);
    if (lockRatio && imageEl) {
      setHeight(Math.max(1, Math.round((clean * imageEl.naturalHeight) / imageEl.naturalWidth)));
    }
  };

  const handleHeightChange = (val: number) => {
    const clean = Math.max(1, Math.min(8000, val || 1));
    setHeight(clean);
    if (lockRatio && imageEl) {
      setWidth(Math.max(1, Math.round((clean * imageEl.naturalWidth) / imageEl.naturalHeight)));
    }
  };

  const applyScale = (factor: number) => {
    if (!imageEl) return;
    setWidth(Math.max(1, Math.round(imageEl.naturalWidth * factor)));
    setHeight(Math.max(1, Math.round(imageEl.naturalHeight * factor)));
  };

  useEffect(() => {
    if (!imageEl || width <= 0 || height <= 0) return;
    let active = true;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(imageEl, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!active || !blob) return;
        setOutputBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      },
      format,
      0.92
    );

    return () => {
      active = false;
    };
  }, [imageEl, width, height, format]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    downloadBlob(outputBlob, `${stripExtension(file.name)}-${width}x${height}.${ext}`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload an image to resize"
        hint="Set exact dimensions in pixels or scale by percentage"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          setFile(null);
          setImageEl(null);
          setOutputBlob(null);
          setPreviewUrl(null);
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {imageEl && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Dimensions
              </h3>
              <button
                type="button"
                onClick={() => setLockRatio((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-colors ${
                  lockRatio
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                    : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {lockRatio ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {lockRatio ? 'Ratio Locked' : 'Unlocked'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Width (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={8000}
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Height (px)
                </label>
                <input
                  type="number"
                  min={1}
                  max={8000}
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Quick Scale Presets
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 0.75, 1.5].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => applyScale(scale)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs font-semibold text-slate-700 hover:border-blue-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500"
                  >
                    {scale * 100}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Output Format
              </label>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                {(
                  [
                    ['image/png', 'PNG'],
                    ['image/jpeg', 'JPG'],
                    ['image/webp', 'WebP'],
                  ] as const
                ).map(([mime, label]) => (
                  <button
                    key={mime}
                    type="button"
                    onClick={() => setFormat(mime)}
                    className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                      format === mime
                        ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!outputBlob}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              Download Resized Image
            </button>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                Original: {imageEl.naturalWidth} × {imageEl.naturalHeight} px
              </span>
              <span className="font-mono tabular-nums">
                Output: {width} × {height} px
                {outputBlob ? ` · ${formatBytes(outputBlob.size)}` : ''}
              </span>
            </div>
            <div className="checkerboard-bg flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Resized preview"
                  className="max-h-[420px] max-w-full rounded object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
