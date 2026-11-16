import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { ArrowUp, ArrowDown, Trash2, Download } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { formatBytes, loadImageFromFile } from '../../utils/fileHelpers';

interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

export const ImageToPdfTool: React.FC = () => {
  const [items, setItems] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState<number>(10);
  const [building, setBuilding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const added: ImageEntry[] = [];
    for (const file of files) {
      try {
        const img = await loadImageFromFile(file);
        const previewUrl = URL.createObjectURL(file);
        added.push({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          file,
          previewUrl,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch {
        setError(`Skipped unsupported image: ${file.name}`);
      }
    }
    setItems((prev) => [...prev, ...added]);
  };

  const moveItem = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setItems([]);
    setError(null);
  };

  const handleDownloadPdf = async () => {
    if (items.length === 0) return;
    setBuilding(true);
    setError(null);

    try {
      let pdf: jsPDF | null = null;

      for (let i = 0; i < items.length; i++) {
        const entry = items[i];
        const img = await loadImageFromFile(entry.file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        if (pageSize === 'fit') {
          const pxToMm = 0.264583;
          const pw = Math.max(40, img.naturalWidth * pxToMm);
          const ph = Math.max(40, img.naturalHeight * pxToMm);
          const orient = pw >= ph ? 'landscape' : 'portrait';
          if (i === 0) {
            pdf = new jsPDF({ orientation: orient, unit: 'mm', format: [pw, ph] });
          } else if (pdf) {
            pdf.addPage([pw, ph], orient);
          }
          pdf?.addImage(dataUrl, 'JPEG', 0, 0, pw, ph);
        } else {
          if (i === 0) {
            pdf = new jsPDF({ orientation, unit: 'mm', format: pageSize });
          } else if (pdf) {
            pdf.addPage(pageSize, orientation);
          }
          if (pdf) {
            const pw = pdf.internal.pageSize.getWidth();
            const ph = pdf.internal.pageSize.getHeight();
            const availW = pw - margin * 2;
            const availH = ph - margin * 2;
            const ratio = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
            const drawW = img.naturalWidth * ratio;
            const drawH = img.naturalHeight * ratio;
            const x = (pw - drawW) / 2;
            const y = (ph - drawH) / 2;
            pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
          }
        }
      }

      pdf?.save('toolbazaar-images.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build PDF.');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        multiple
        label="Upload one or more images to convert to PDF"
        hint="Add PNG, JPG, or WebP files and reorder pages before exporting"
        files={items.map((i) => i.file)}
        onFilesSelected={handleFilesSelected}
        onClear={clearAll}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              PDF Layout
            </h3>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Page Size
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'fit')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="a4">A4 (210 × 297 mm)</option>
                <option value="letter">US Letter (8.5 × 11 in)</option>
                <option value="fit">Fit to Image Size</option>
              </select>
            </div>

            {pageSize !== 'fit' && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        orientation === 'portrait'
                          ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      Portrait
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                        orientation === 'landscape'
                          ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                      }`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Page Margin</span>
                    <span className="font-mono tabular-nums">{margin} mm</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={margin}
                    onChange={(e) => setMargin(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={building}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Download className="h-4 w-4" />
              {building ? 'Generating PDF...' : `Download PDF (${items.length} page${items.length > 1 ? 's' : ''})`}
            </button>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Page Order Preview</span>
              <span className="font-mono tabular-nums">{items.length} pages ready</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-40 items-center justify-center bg-slate-100 p-2 dark:bg-slate-950">
                    <img
                      src={item.previewUrl}
                      alt={item.file.name}
                      className="max-h-full max-w-full rounded object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-xs dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                        {idx + 1}. {item.file.name}
                      </p>
                      <p className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                        {item.width}×{item.height} · {formatBytes(item.file.size)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        aria-label="Move page earlier"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === items.length - 1}
                        aria-label="Move page later"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove page"
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
