import React, { useEffect, useState } from 'react';
import { createWorker } from 'tesseract.js';
import { Copy, Check, Download, ScanText } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadTextFile, loadImageFromFile, stripExtension } from '../../utils/fileHelpers';

export const ImageToTextTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState<boolean>(true);
  const [extracting, setExtracting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFilesSelected = (files: File[]) => {
    const selected = files[0];
    setError(null);
    setExtractedText('');
    setProgress(0);
    setStatusText('');
    const url = URL.createObjectURL(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setFile(selected);
  };

  const runOcr = async () => {
    if (!file) return;
    setExtracting(true);
    setProgress(5);
    setStatusText('Preparing image...');
    setError(null);

    try {
      let source: Blob | File = file;

      if (highContrast) {
        const img = await loadImageFromFile(file);
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'grayscale(100%) contrast(150%)';
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
          if (blob) source = blob;
        }
      }

      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status) setStatusText(m.status);
          if (typeof m.progress === 'number') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const result = await worker.recognize(source);
      await worker.terminate();

      setExtractedText(result.data.text.trim());
      setProgress(100);
      setStatusText('Complete');
    } catch {
      setError('OCR engine could not initialize. Check your browser connection for initial language data or try a clearer image.');
    } finally {
      setExtracting(false);
    }
  };

  const handleCopy = async () => {
    if (!extractedText) return;
    await navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!extractedText || !file) return;
    downloadTextFile(extractedText, `${stripExtension(file.name)}-ocr.txt`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload an image or screenshot to extract text"
        hint="Runs Tesseract OCR locally inside your browser"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setFile(null);
          setPreviewUrl(null);
          setExtractedText('');
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
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Enhance contrast for clearer OCR</span>
              </label>

              <button
                type="button"
                onClick={runOcr}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <ScanText className="h-3.5 w-3.5" />
                {extracting ? 'Reading...' : 'Extract Text'}
              </button>
            </div>

            {extracting && (
              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span className="capitalize">{statusText || 'Processing...'}</span>
                  <span className="font-mono tabular-nums">{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-150 dark:bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-slate-800 dark:bg-slate-900">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Uploaded OCR source"
                  className="max-h-[340px] max-w-full rounded object-contain"
                />
              )}
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Extracted Text Preview
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!extractedText}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!extractedText}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download .txt
                </button>
              </div>
            </div>
            <textarea
              rows={14}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Click 'Extract Text' to run OCR on your uploaded image..."
              className="w-full rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      )}
    </div>
  );
};
