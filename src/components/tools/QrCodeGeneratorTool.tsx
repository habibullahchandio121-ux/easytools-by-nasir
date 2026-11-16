import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Upload } from 'lucide-react';
import { downloadDataUrl, downloadTextFile } from '../../utils/fileHelpers';

export const QrCodeGeneratorTool: React.FC = () => {
  const [text, setText] = useState<string>('https://toolbazaar.app');
  const [fgColor, setFgColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [size, setSize] = useState<number>(320);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const value = text.trim() || ' ';
    setError(null);
    QRCode.toCanvas(
      canvas,
      value,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (err) => {
        if (err) {
          setError('Text is too long for selected QR size or correction level.');
        }
      }
    );
  }, [text, fgColor, bgColor, size, errorLevel]);

  const handleUploadText = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content.slice(0, 1500));
    e.target.value = '';
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    downloadDataUrl(canvasRef.current.toDataURL('image/png'), 'toolbazaar-qrcode.png');
  };

  const handleDownloadSvg = async () => {
    try {
      const svg = await QRCode.toString(text.trim() || ' ', {
        type: 'svg',
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      });
      downloadTextFile(svg, 'toolbazaar-qrcode.svg', 'image/svg+xml;charset=utf-8');
    } catch {
      setError('Could not export SVG for this content.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-6">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            URL, Text, Wi-Fi, or Contact Content
          </label>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleUploadText}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload .txt
            </button>
          </div>
        </div>

        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter URL or text to encode into QR code..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Foreground Color
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-slate-700 dark:text-slate-200">
                {fgColor}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Background Color
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-950">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-slate-700 dark:text-slate-200">
                {bgColor}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Size</span>
              <span className="font-mono tabular-nums">{size} px</span>
            </div>
            <input
              type="range"
              min={160}
              max={600}
              step={20}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Error Correction
            </label>
            <select
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-6 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-6">
        <div className="flex w-full items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Live QR Preview</span>
          <span className="font-mono tabular-nums">
            {size} × {size} px
          </span>
        </div>

        <div className="flex min-h-[260px] w-full items-center justify-center rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <canvas ref={canvasRef} className="max-h-[280px] max-w-full rounded" />
        </div>

        <div className="flex w-full flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Download className="h-4 w-4" />
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
};
