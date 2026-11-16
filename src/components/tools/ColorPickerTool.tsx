import React, { useMemo, useRef, useState } from 'react';
import { Copy, Check, Download, Pipette } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadDataUrl, loadImageFromFile } from '../../utils/fileHelpers';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const k = 1 - Math.max(rn, gn, bn);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = Math.round(((1 - rn - k) / (1 - k)) * 100);
  const m = Math.round(((1 - gn - k) / (1 - k)) * 100);
  const y = Math.round(((1 - bn - k) / (1 - k)) * 100);
  return { c, m, y, k: Math.round(k * 100) };
}

export const ColorPickerTool: React.FC = () => {
  const [hex, setHex] = useState<string>('#2563eb');
  const [file, setFile] = useState<File | null>(null);
  const [palette, setPalette] = useState<string[]>(['#2563eb', '#1e40af', '#60a5fa', '#0f172a', '#f8fafc']);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const formats = useMemo(() => {
    const { r, g, b } = hexToRgb(hex);
    const { h, s, l } = rgbToHsl(r, g, b);
    const { c, m, y, k } = rgbToCmyk(r, g, b);
    return [
      { key: 'HEX', value: hex.toUpperCase() },
      { key: 'RGB', value: `rgb(${r}, ${g}, ${b})` },
      { key: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
      { key: 'CMYK', value: `cmyk(${c}%, ${m}%, ${y}%, ${k}%)` },
    ];
  }, [hex]);

  const handleImageSelected = async (files: File[]) => {
    setError(null);
    const selected = files[0];
    try {
      const img = await loadImageFromFile(selected);
      setFile(selected);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxDim = 900;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Sample grid to build a 6-color palette
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
        const step = Math.max(4, Math.floor(imgData.length / 4 / 2000)) * 4;
        for (let i = 0; i < imgData.length; i += step) {
          if (imgData[i + 3] < 128) continue;
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const qr = Math.round(r / 32) * 32;
          const qg = Math.round(g / 32) * 32;
          const qb = Math.round(b / 32) * 32;
          const key = `${qr},${qg},${qb}`;
          if (!buckets[key]) {
            buckets[key] = { r, g, b, count: 0 };
          }
          buckets[key].count++;
        }
        const sorted = Object.values(buckets)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map((c) => rgbToHex(c.r, c.g, c.b));
        if (sorted.length > 0) {
          setPalette(sorted);
          setHex(sorted[0]);
        }
      }, 30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load image.');
    }
  };

  const handleCanvasSample = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height)));
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const picked = rgbToHex(pixel[0], pixel[1], pixel[2]);
    setHex(picked);
    setPalette((prev) => [picked, ...prev.filter((c) => c !== picked)].slice(0, 6));
  };

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1400);
  };

  const handleDownloadPalette = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 900, 240);

    const colW = 900 / palette.length;
    palette.forEach((swatch, i) => {
      ctx.fillStyle = swatch;
      ctx.fillRect(i * colW, 0, colW, 180);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(swatch.toUpperCase(), i * colW + 16, 214);
    });
    downloadDataUrl(canvas.toDataURL('image/png'), 'toolbazaar-palette.png');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Color Controls
            </h3>
            <button
              type="button"
              onClick={handleDownloadPalette}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-3.5 w-3.5" />
              Download Palette
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-16 w-20 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
            />
            <div
              className="flex h-16 flex-1 items-center justify-center rounded-xl border border-slate-200 font-mono text-sm font-bold uppercase shadow-xs dark:border-slate-700"
              style={{ backgroundColor: hex, color: rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]).l > 55 ? '#0f172a' : '#ffffff' }}
            >
              {hex}
            </div>
          </div>

          <div className="space-y-2">
            {formats.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="font-semibold text-slate-500 dark:text-slate-400">{item.key}</span>
                <code className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {item.value}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(item.key, item.value)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60"
                >
                  {copiedKey === item.key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedKey === item.key ? 'Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Palette Swatches (Click to select)
            </p>
            <div className="grid grid-cols-6 gap-2">
              {palette.map((swatch, i) => (
                <button
                  key={`${swatch}-${i}`}
                  type="button"
                  onClick={() => setHex(swatch)}
                  title={swatch.toUpperCase()}
                  className={`h-10 rounded-lg border transition-transform hover:scale-105 ${
                    hex.toLowerCase() === swatch.toLowerCase()
                      ? 'ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-900'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-7">
          <DropZone
            compact
            accept="image/*"
            label="Upload an image to sample colors & extract palette"
            hint="Click anywhere on the uploaded image to pick an exact pixel color"
            file={file}
            onFilesSelected={handleImageSelected}
            onClear={() => setFile(null)}
          />

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </div>
          )}

          {file ? (
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Pipette className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Click on the image below to sample any pixel</span>
              </div>
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-900">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasSample}
                  className="max-h-[360px] max-w-full cursor-crosshair rounded object-contain"
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <div
                className="h-20 w-20 rounded-2xl border border-slate-200 shadow-xs dark:border-slate-700"
                style={{ backgroundColor: hex }}
              />
              <p className="mt-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">
                Active Color Preview: {hex.toUpperCase()}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use the picker on the left or upload an image above to sample pixel colors.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
