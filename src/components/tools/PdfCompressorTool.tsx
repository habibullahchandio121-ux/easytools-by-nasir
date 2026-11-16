import React, { useEffect, useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Download, FileArchive } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, stripExtension } from '../../utils/fileHelpers';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type CompressionLevel = 'balanced' | 'maximum' | 'lossless';

export const PdfCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('balanced');
  const [compressing, setCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFilesSelected = (files: File[]) => {
    setFile(files[0]);
    setCompressedBlob(null);
    setProgress(0);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setCompressing(true);
    setProgress(5);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();

      if (level === 'lossless') {
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        setPageCount(doc.getPageCount());
        setProgress(60);
        const saved = await doc.save({ useObjectStreams: true, addDefaultPage: false });
        const blob = new Blob([new Uint8Array(saved)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setCompressedBlob(blob);
        setProgress(100);
        return;
      }

      const scale = level === 'maximum' ? 1.0 : 1.4;
      const jpegQuality = level === 'maximum' ? 0.55 : 0.72;

      const loadingTask = getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      const total = pdf.numPages;
      setPageCount(total);

      const outDoc = await PDFDocument.create();

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const origViewport = page.getViewport({ scale: 1 });
        const renderViewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(renderViewport.width);
        canvas.height = Math.round(renderViewport.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvas, viewport: renderViewport }).promise;

        const imgBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Page compression failed.'))),
            'image/jpeg',
            jpegQuality
          );
        });
        const imgBytes = await imgBlob.arrayBuffer();
        const embedded = await outDoc.embedJpg(imgBytes);
        const outPage = outDoc.addPage([origViewport.width, origViewport.height]);
        outPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: origViewport.width,
          height: origViewport.height,
        });

        setProgress(Math.round((i / total) * 95));
      }

      const outBytes = await outDoc.save({ useObjectStreams: true });
      const blob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setCompressedBlob(blob);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to compress PDF.');
    } finally {
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!compressedBlob || !file) return;
    downloadBlob(compressedBlob, `${stripExtension(file.name)}-compressed.pdf`);
  };

  const savedPercent =
    file && compressedBlob
      ? Math.round(((file.size - compressedBlob.size) / file.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <DropZone
        accept="application/pdf,.pdf"
        label="Upload a PDF document to compress"
        hint="Optimizes PDF pages and images directly inside your browser"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setFile(null);
          setCompressedBlob(null);
          setPreviewUrl(null);
          setProgress(0);
          setError(null);
        }}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {file && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-4">
            <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
              Compression Preset
            </h3>

            <div className="space-y-2">
              {(
                [
                  {
                    id: 'balanced',
                    title: 'Balanced Compression',
                    desc: 'Sharp text & medium JPEG image recompression',
                  },
                  {
                    id: 'maximum',
                    title: 'Maximum Size Reduction',
                    desc: 'Smallest PDF size for email & web uploads',
                  },
                  {
                    id: 'lossless',
                    title: 'Lossless Structure Cleanup',
                    desc: 'Preserves selectable text using object streams',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLevel(opt.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    level === opt.id
                      ? 'border-blue-600 bg-blue-50/80 dark:border-blue-500 dark:bg-blue-950/50'
                      : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{opt.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCompress}
              disabled={compressing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <FileArchive className="h-4 w-4" />
              {compressing ? `Compressing (${progress}%)...` : 'Compress PDF'}
            </button>

            {compressedBlob && (
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
                  <span className="text-slate-500 dark:text-slate-400">Reduction</span>
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

            {compressedBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <Download className="h-4 w-4" />
                Download Compressed PDF
              </button>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Compressed PDF Preview</span>
              {pageCount > 0 && (
                <span className="font-mono tabular-nums">
                  {pageCount} page{pageCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {previewUrl ? (
              <iframe
                title="Compressed PDF Preview"
                src={previewUrl}
                className="h-[420px] w-full rounded-xl border border-slate-200 bg-white dark:border-slate-800"
              />
            ) : (
              <div className="flex h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <FileArchive className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Select a compression preset and click &ldquo;Compress PDF&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your compressed PDF preview will appear here ready for download.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
