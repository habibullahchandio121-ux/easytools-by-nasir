import React, { useEffect, useRef, useState } from 'react';
import { Download, Eraser, RotateCcw, Wand2 } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const WatermarkRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [brushSize, setBrushSize] = useState<number>(22);
  const [hasMask, setHasMask] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [processed, setProcessed] = useState<boolean>(false);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderComposite = () => {
    const display = displayCanvasRef.current;
    const work = workingCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!display || !work || !mask) return;
    const ctx = display.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, display.width, display.height);
    ctx.drawImage(work, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(mask, 0, 0);
    ctx.restore();
  };

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      setFile(selected);
      setImageEl(img);
      setHasMask(false);
      setProcessed(false);
      setOutputBlob(null);

      setTimeout(() => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        const work = document.createElement('canvas');
        work.width = w;
        work.height = h;
        work.getContext('2d')?.drawImage(img, 0, 0);
        workingCanvasRef.current = work;

        const mask = document.createElement('canvas');
        mask.width = w;
        mask.height = h;
        maskCanvasRef.current = mask;

        if (displayCanvasRef.current) {
          displayCanvasRef.current.width = w;
          displayCanvasRef.current.height = h;
          renderComposite();
        }
      }, 30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load image.');
    }
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const paintAt = (x: number, y: number) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d');
    if (!ctx) return;
    const scaleFactor = Math.max(1, mask.width / 600);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, (brushSize * scaleFactor) / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
    renderComposite();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!imageEl) return;
    setIsDrawing(true);
    const pt = getCanvasPoint(e);
    paintAt(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    paintAt(pt.x, pt.y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const clearMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    mask.getContext('2d')?.clearRect(0, 0, mask.width, mask.height);
    setHasMask(false);
    renderComposite();
  };

  const resetImage = () => {
    if (!imageEl || !workingCanvasRef.current) return;
    const wCtx = workingCanvasRef.current.getContext('2d');
    wCtx?.drawImage(imageEl, 0, 0);
    clearMask();
    setProcessed(false);
    setOutputBlob(null);
  };

  const runInpaint = () => {
    const work = workingCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!work || !mask) return;
    const w = work.width;
    const h = work.height;
    const wCtx = work.getContext('2d');
    const mCtx = mask.getContext('2d');
    if (!wCtx || !mCtx) return;

    const imgData = wCtx.getImageData(0, 0, w, h);
    const maskData = mCtx.getImageData(0, 0, w, h).data;
    const pixels = imgData.data;

    // Build boolean mask of pixels to reconstruct
    const isMasked = new Uint8Array(w * h);
    let maskedCount = 0;
    for (let i = 0; i < w * h; i++) {
      if (maskData[i * 4 + 3] > 20) {
        isMasked[i] = 1;
        maskedCount++;
      }
    }
    if (maskedCount === 0) return;

    // Multi-pass boundary-inward pixel diffusion inpainting
    const filled = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      filled[i] = isMasked[i] ? 0 : 1;
    }

    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];

    let remaining = maskedCount;
    let safety = 0;
    while (remaining > 0 && safety < 400) {
      safety++;
      const updates: Array<{ idx: number; r: number; g: number; b: number }> = [];

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const p = y * w + x;
          if (filled[p]) continue;

          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          let weightSum = 0;

          for (let d = 0; d < dirs.length; d++) {
            const nx = x + dirs[d][0];
            const ny = y + dirs[d][1];
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const np = ny * w + nx;
              if (filled[np]) {
                const weight = d < 4 ? 1 : 0.707;
                const pIdx = np * 4;
                rSum += pixels[pIdx] * weight;
                gSum += pixels[pIdx + 1] * weight;
                bSum += pixels[pIdx + 2] * weight;
                weightSum += weight;
              }
            }
          }

          if (weightSum > 0) {
            updates.push({
              idx: p,
              r: Math.round(rSum / weightSum),
              g: Math.round(gSum / weightSum),
              b: Math.round(bSum / weightSum),
            });
          }
        }
      }

      if (updates.length === 0) break;
      for (const u of updates) {
        const pIdx = u.idx * 4;
        pixels[pIdx] = u.r;
        pixels[pIdx + 1] = u.g;
        pixels[pIdx + 2] = u.b;
        pixels[pIdx + 3] = 255;
        filled[u.idx] = 1;
        remaining--;
      }
    }

    // Smooth pass across the masked boundary for seamless blending
    const copy = new Uint8ClampedArray(pixels);
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const p = y * w + x;
          if (!isMasked[p]) continue;
          let r = 0, g = 0, b = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const idx = ((y + dy) * w + (x + dx)) * 4;
              r += copy[idx];
              g += copy[idx + 1];
              b += copy[idx + 2];
            }
          }
          const outIdx = p * 4;
          pixels[outIdx] = Math.round(r / 9);
          pixels[outIdx + 1] = Math.round(g / 9);
          pixels[outIdx + 2] = Math.round(b / 9);
        }
      }
      copy.set(pixels);
    }

    wCtx.putImageData(imgData, 0, 0);
    mCtx.clearRect(0, 0, w, h);
    setHasMask(false);
    setProcessed(true);
    renderComposite();

    work.toBlob((blob) => {
      if (blob) setOutputBlob(blob);
    }, 'image/png');
  };

  useEffect(() => {
    if (imageEl && workingCanvasRef.current && !outputBlob) {
      workingCanvasRef.current.toBlob((blob) => {
        if (blob) setOutputBlob(blob);
      }, 'image/png');
    }
  }, [imageEl, outputBlob]);

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    downloadBlob(outputBlob, `${stripExtension(file.name)}-cleaned.png`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload an image to remove watermarks or unwanted marks"
        hint="Brush over any text, logo, or stamp, then click Remove Watermark"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          setFile(null);
          setImageEl(null);
          setOutputBlob(null);
          setHasMask(false);
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
              Brush & Inpaint Controls
            </h3>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Brush Size</span>
                <span className="font-mono tabular-nums">{brushSize} px</span>
              </div>
              <input
                type="range"
                min={6}
                max={60}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={runInpaint}
              disabled={!hasMask}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Wand2 className="h-4 w-4" />
              Remove Watermark
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={clearMask}
                disabled={!hasMask}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear Brush
              </button>
              <button
                type="button"
                onClick={resetImage}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={!outputBlob}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
            >
              <Download className="h-4 w-4" />
              Download Clean PNG
            </button>

            {processed && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Watermark area blended. You can brush again to refine further or download.
              </p>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Paint red over the watermark area on the preview</span>
              <span className="font-mono tabular-nums">
                {imageEl.naturalWidth} × {imageEl.naturalHeight} px
                {outputBlob ? ` · ${formatBytes(outputBlob.size)}` : ''}
              </span>
            </div>
            <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100/70 p-4 dark:border-slate-800 dark:bg-slate-900">
              <canvas
                ref={displayCanvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="max-h-[420px] max-w-full touch-none cursor-crosshair rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
