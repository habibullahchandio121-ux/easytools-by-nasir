import React, { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ArrowUp, ArrowDown, Trash2, Download, FileText } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes } from '../../utils/fileHelpers';

interface PdfItem {
  id: string;
  file: File;
  pageCount: number;
  bytes: ArrayBuffer;
}

export const PdfMergeTool: React.FC = () => {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [merging, setMerging] = useState<boolean>(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedUrl, setMergedUrl] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (mergedUrl) URL.revokeObjectURL(mergedUrl);
    };
  }, [mergedUrl]);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    const added: PdfItem[] = [];
    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        added.push({
          id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
          file,
          pageCount: doc.getPageCount(),
          bytes,
        });
      } catch {
        setError(`Could not read PDF: ${file.name}. Ensure it is a valid, unencrypted PDF.`);
      }
    }
    setItems((prev) => [...prev, ...added]);
    setMergedBlob(null);
  };

  const moveItem = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setMergedBlob(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (items.length < 2) {
      setError('Please upload at least 2 PDF files to merge.');
      return;
    }
    setMerging(true);
    setError(null);

    try {
      const merged = await PDFDocument.create();
      for (const item of items) {
        const src = await PDFDocument.load(item.bytes, { ignoreEncryption: true });
        const copied = await merged.copyPages(src, src.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }
      const pdfBytes = await merged.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setMergedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setMergedBlob(blob);
      setTotalPages(merged.getPageCount());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF merge failed.');
    } finally {
      setMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    downloadBlob(mergedBlob, 'toolbazaar-merged.pdf');
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="application/pdf,.pdf"
        multiple
        label="Upload 2 or more PDF files to merge"
        hint="Reorder files below, preview the merged result, and download locally"
        files={items.map((i) => i.file)}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          setItems([]);
          setMergedBlob(null);
          setMergedUrl(null);
          setError(null);
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                PDF Queue ({items.length})
              </h3>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {items.reduce((acc, i) => acc + i.pageCount, 0)} total pages
              </span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {idx + 1}. {item.file.name}
                      </p>
                      <p className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                        {item.pageCount} page{item.pageCount > 1 ? 's' : ''} · {formatBytes(item.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleMerge}
                disabled={merging || items.length < 2}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {merging ? 'Merging PDFs...' : 'Merge PDFs & Preview'}
              </button>

              {mergedBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                >
                  <Download className="h-4 w-4" />
                  Download Merged PDF ({formatBytes(mergedBlob.size)})
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Merged PDF Preview</span>
              {mergedBlob && (
                <span className="font-mono tabular-nums">
                  {totalPages} pages · {formatBytes(mergedBlob.size)}
                </span>
              )}
            </div>

            {mergedUrl ? (
              <iframe
                title="Merged PDF Preview"
                src={mergedUrl}
                className="h-[420px] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800"
              />
            ) : (
              <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Add at least 2 PDF files and click &ldquo;Merge PDFs &amp; Preview&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  The combined document preview will render right here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
