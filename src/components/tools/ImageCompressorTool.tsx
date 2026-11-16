import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const ImageCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      setFile(selected);
      setImageEl(img);
      setMaxWidth(img.naturalWidth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to read image.');
    }
  };

  useEffect(() => {
    if (!imageEl) return;
    let active = true;

    const canvas = document.createElement('canvas');
    let targetW = imageEl.naturalWidth;
    let targetH = imageEl.naturalHeight;

    if (maxWidth > 0 && maxWidth < targetW) {
      const ratio = maxWidth / targetW;
      targetW = maxWidth;
      targetH = Math.round(targetH * ratio);
    }

    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(imageEl, 0, 0, targetW, targetH);

    canvas.toBlob(
      (blob) => {
        if (!active || !blob) return;
        setCompressedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      },
      format,
      quality / 100
    );

    return () => {
      active = false;
    };
  }, [imageEl, quality, format, maxWidth]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = () => {
    if (!compressedBlob || !file) return;
    const ext = format === 'image/webp' ? 'webp' : 'jpg';
    downloadBlob(compressedBlob, `${stripExtension(file.name)}-compressed.${ext}`);
  };

  const savedPercent =
    file && compressedBlob
      ? Math.round(((file.size - compressedBlob.size) / file.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload an image to compress"
        hint="Supports PNG, JPG, WebP — all compression happens in your browser"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          setFile(null);
          setImageEl(null);
          setCompressedBlob(null);
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
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Compression Controls
            </h3>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Quality</span>
                <span className="font-mono tabular-nums">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Output Format
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setFormat('image/jpeg')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    format === 'image/jpeg'
                      ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('image/webp')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    format === 'image/webp'
                      ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  WebP
                </button>
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Max Width (px)</span>
                <span className="font-mono tabular-nums">{maxWidth} px</span>
              </div>
              <input
                type="range"
                min={200}
                max={imageEl.naturalWidth}
                value={maxWidth}
                onChange={(e) => setMaxWidth(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {file && compressedBlob && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Original size</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Compressed size</span>
                  <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {formatBytes(compressedBlob.size)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Difference</span>
                  <span
                    className={`font-mono font-semibold tabular-nums ${
                      savedPercent >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {savedPercent >= 0 ? `${savedPercent}% smaller` : `${Math.abs(savedPercent)}% larger`}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={!compressedBlob}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              Download Compressed Image
            </button>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Compressed Preview</span>
              <span className="font-mono tabular-nums">
                {Math.min(maxWidth || imageEl.naturalWidth, imageEl.naturalWidth)} ×{' '}
                {Math.round(
                  imageEl.naturalHeight *
                    (Math.min(maxWidth || imageEl.naturalWidth, imageEl.naturalWidth) /
                      imageEl.naturalWidth)
                )}{' '}
                px
              </span>
            </div>
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Compressed preview"
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
