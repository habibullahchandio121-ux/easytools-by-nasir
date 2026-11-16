import React, { useEffect, useRef, useState } from 'react';
import { Download, Sparkles, RotateCcw } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const ImageEnhancerTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [warmth, setWarmth] = useState<number>(0);
  const [sharpness, setSharpness] = useState<number>(0);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      setFile(selected);
      setImageEl(img);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setWarmth(0);
      setSharpness(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image.');
    }
  };

  const applyAutoEnhance = () => {
    setBrightness(106);
    setContrast(116);
    setSaturation(114);
    setWarmth(6);
    setSharpness(25);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setSharpness(0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return;

    const w = imageEl.naturalWidth;
    const h = imageEl.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (showOriginal) {
      ctx.filter = 'none';
      ctx.drawImage(imageEl, 0, 0);
      return;
    }

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    ctx.drawImage(imageEl, 0, 0);
    ctx.filter = 'none';

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Warmth adjustment
    if (warmth !== 0) {
      const shift = warmth * 1.4;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, data[i] + shift));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] - shift));
      }
    }

    // Sharpen convolution kernel
    if (sharpness > 0) {
      const amount = sharpness / 100;
      const copy = new Uint8ClampedArray(data);
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = (y * w + x) * 4;
          for (let c = 0; c < 3; c++) {
            const center = copy[idx + c] * 5;
            const neighbors =
              copy[idx - 4 + c] +
              copy[idx + 4 + c] +
              copy[idx - w * 4 + c] +
              copy[idx + w * 4 + c];
            const sharpened = center - neighbors;
            data[idx + c] = Math.min(
              255,
              Math.max(0, copy[idx + c] * (1 - amount) + sharpened * amount)
            );
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setOutputBlob(blob);
    }, 'image/png');
  }, [imageEl, brightness, contrast, saturation, warmth, sharpness, showOriginal]);

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    downloadBlob(outputBlob, `${stripExtension(file.name)}-enhanced.png`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload a photo to enhance"
        hint="Apply auto-enhance or fine-tune brightness, contrast, saturation, warmth, and sharpness"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          setFile(null);
          setImageEl(null);
          setOutputBlob(null);
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
                Enhancements
              </h3>
              <button
                type="button"
                onClick={applyAutoEnhance}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900/60"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto Enhance
              </button>
            </div>

            {[
              { label: 'Brightness', value: brightness, min: 50, max: 160, set: setBrightness, suffix: '%' },
              { label: 'Contrast', value: contrast, min: 50, max: 180, set: setContrast, suffix: '%' },
              { label: 'Saturation', value: saturation, min: 0, max: 200, set: setSaturation, suffix: '%' },
              { label: 'Warmth', value: warmth, min: -40, max: 40, set: setWarmth, suffix: '' },
              { label: 'Sharpness', value: sharpness, min: 0, max: 100, set: setSharpness, suffix: '%' },
            ].map((ctrl) => (
              <div key={ctrl.label}>
                <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>{ctrl.label}</span>
                  <span className="font-mono tabular-nums">
                    {ctrl.value}
                    {ctrl.suffix}
                  </span>
                </div>
                <input
                  type="range"
                  min={ctrl.min}
                  max={ctrl.max}
                  value={ctrl.value}
                  onChange={(e) => ctrl.set(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            ))}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputBlob}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Download className="h-4 w-4" />
                Download Enhanced PNG
              </button>
              <button
                type="button"
                onClick={resetAdjustments}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Sliders
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onMouseLeave={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                onClick={() => setShowOriginal((v) => !v)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {showOriginal ? 'Showing Original (Click to view Enhanced)' : 'Compare Original'}
              </button>
              <span className="font-mono tabular-nums">
                {imageEl.naturalWidth} × {imageEl.naturalHeight} px
                {outputBlob ? ` · ${formatBytes(outputBlob.size)}` : ''}
              </span>
            </div>
            <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900">
              <canvas
                ref={canvasRef}
                className="max-h-[420px] max-w-full rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
