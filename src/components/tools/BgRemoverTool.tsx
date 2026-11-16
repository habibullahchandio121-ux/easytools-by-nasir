import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Eraser,
  Paintbrush,
  Pipette,
  RotateCcw,
  Sparkles,
  Eye,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import {
  downloadBlob,
  formatBytes,
  loadImageFromFile,
  stripExtension,
} from '../../utils/fileHelpers';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

type RemovalEngine = 'ai' | 'color';
type BrushMode = 'none' | 'erase' | 'restore';
type PreviewBackdrop = 'transparent' | 'white' | 'blue' | 'dark';

const TRANSFORMERS_CDN =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/transformers.web.min.js';
const IMGLY_CDN =
  'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm';

interface RmbgBundle {
  model: any;
  processor: any;
  RawImage: any;
}

let rmbgCachePromise: Promise<RmbgBundle> | null = null;

async function dynamicCdnImport(url: string): Promise<any> {
  return import(/* @vite-ignore */ url);
}

async function getRmbgModel(onProgress: (pct: number) => void): Promise<RmbgBundle> {
  if (!rmbgCachePromise) {
    rmbgCachePromise = (async () => {
      const mod = await dynamicCdnImport(TRANSFORMERS_CDN);
      const { AutoModel, AutoProcessor, RawImage, env } = mod;

      env.allowLocalModels = false;
      if (!window.crossOriginIsolated && env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
      }

      const fileProgress = new Map<string, number>();
      const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
        config: { model_type: 'custom' },
        dtype: 'q8',
        device: 'wasm',
        progress_callback: (info: { status?: string; file?: string; progress?: number }) => {
          if (typeof info?.progress === 'number') {
            const key = info.file || 'model';
            fileProgress.set(key, info.progress);
            const values = Array.from(fileProgress.values());
            const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
            onProgress(Math.min(88, Math.max(8, Math.round(avg))));
          }
        },
      });

      const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: 'ImageFeatureExtractor',
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
        },
      });

      return { model, processor, RawImage };
    })().catch((err) => {
      rmbgCachePromise = null;
      throw err;
    });
  }
  return rmbgCachePromise;
}

async function runRmbgInference(
  sourceCanvas: HTMLCanvasElement,
  onProgress: (pct: number) => void
): Promise<HTMLCanvasElement> {
  const { model, processor, RawImage } = await getRmbgModel(onProgress);
  onProgress(90);

  const image = RawImage.fromCanvas(sourceCanvas);
  const { pixel_values } = await processor(image);

  const inputNames: string[] | undefined = model.sessions?.model?.inputNames;
  const outputNames: string[] | undefined = model.sessions?.model?.outputNames;
  const inputKey = inputNames?.length ? inputNames[0] : 'input';

  const outputs = await model({ [inputKey]: pixel_values });
  const outputKey = outputNames?.length ? outputNames[0] : 'output';
  const outBatch = outputs[outputKey] ?? Object.values(outputs)[0];
  const maskTensor = outBatch[0];

  if (maskTensor.data.some((x: number) => x < -1e-5 || x > 1 + 1e-5)) {
    maskTensor.sigmoid_();
  }

  onProgress(96);
  const mask = await RawImage.fromTensor(maskTensor.mul_(255).to('uint8')).resize(
    image.width,
    image.height
  );

  const cloned = image.clone();
  cloned.putAlpha(mask);
  const outCanvas: HTMLCanvasElement = cloned.toCanvas();
  onProgress(100);
  return outCanvas;
}

async function runImglyCdnFallback(
  selectedFile: File,
  onProgress: (pct: number) => void
): Promise<HTMLCanvasElement> {
  const mod = await dynamicCdnImport(IMGLY_CDN);
  const removeBackground = mod.default || mod.removeBackground;
  if (typeof removeBackground !== 'function') {
    throw new Error('CDN background removal module unavailable.');
  }

  const resultBlob: Blob = await removeBackground(selectedFile, {
    model: 'isnet_quint8',
    device: 'cpu',
    output: { format: 'image/png', quality: 1 },
    progress: (_key: string, current: number, total: number) => {
      if (total > 0) {
        onProgress(Math.min(98, Math.max(10, Math.round((current / total) * 100))));
      }
    },
  });

  const url = URL.createObjectURL(resultBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to decode cutout image.'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext('2d')?.drawImage(img, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const BgRemoverTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);
  const [engine, setEngine] = useState<RemovalEngine>('ai');

  // AI removal state
  const [aiProcessing, setAiProcessing] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiReady, setAiReady] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Backup Solid Color flood-fill controls
  const [colorMode, setColorMode] = useState<'flood' | 'global'>('flood');
  const [targetColor, setTargetColor] = useState<RgbColor>({ r: 255, g: 255, b: 255 });
  const [tolerance, setTolerance] = useState<number>(38);
  const [feather, setFeather] = useState<number>(12);
  const [pickActive, setPickActive] = useState<boolean>(false);

  // Touch-up brush & preview backdrop
  const [brushMode, setBrushMode] = useState<BrushMode>('none');
  const [brushSize, setBrushSize] = useState<number>(28);
  const [isBrushing, setIsBrushing] = useState<boolean>(false);
  const [previewBackdrop, setPreviewBackdrop] = useState<PreviewBackdrop>('transparent');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cutoutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const aiCutoutCacheRef = useRef<HTMLCanvasElement | null>(null);
  const activeRunIdRef = useRef<number>(0);

  // Always export transparent PNG from cutoutCanvasRef (never white background)
  const exportTransparentPng = useCallback(() => {
    const cutout = cutoutCanvasRef.current;
    if (!cutout) return;
    cutout.toBlob((blob) => {
      if (blob) setOutputBlob(blob);
    }, 'image/png');
  }, []);

  const renderDisplay = useCallback(() => {
    const display = displayCanvasRef.current;
    const cutout = cutoutCanvasRef.current;
    const src = sourceCanvasRef.current;
    if (!display || !cutout || !src) return;

    display.width = cutout.width;
    display.height = cutout.height;
    const ctx = display.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, display.width, display.height);

    if (showOriginal) {
      ctx.drawImage(src, 0, 0);
      return;
    }

    if (previewBackdrop !== 'transparent') {
      ctx.fillStyle =
        previewBackdrop === 'white'
          ? '#ffffff'
          : previewBackdrop === 'blue'
            ? '#2563eb'
            : '#0f172a';
      ctx.fillRect(0, 0, display.width, display.height);
    }

    ctx.drawImage(cutout, 0, 0);
  }, [previewBackdrop, showOriginal]);

  useEffect(() => {
    return () => {
      if (originalPreviewUrl) URL.revokeObjectURL(originalPreviewUrl);
    };
  }, [originalPreviewUrl]);

  useEffect(() => {
    if (originalImg && cutoutCanvasRef.current && (aiReady || engine === 'color')) {
      renderDisplay();
    }
  }, [originalImg, aiReady, engine, renderDisplay]);

  const applyColorRemovalToCutout = useCallback(() => {
    const src = sourceCanvasRef.current;
    const cutout = cutoutCanvasRef.current;
    if (!src || !cutout) return;

    const width = src.width;
    const height = src.height;
    cutout.width = width;
    cutout.height = height;

    const srcCtx = src.getContext('2d');
    const cutCtx = cutout.getContext('2d');
    if (!srcCtx || !cutCtx) return;

    const imgData = srcCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const maxDist = Math.max(1, tolerance * 2.2);
    const featherRange = Math.max(1, feather * 2.2);

    const colorDist = (idx: number) => {
      const dr = data[idx] - targetColor.r;
      const dg = data[idx + 1] - targetColor.g;
      const db = data[idx + 2] - targetColor.b;
      return Math.sqrt(dr * dr + dg * dg + db * db);
    };

    if (colorMode === 'global') {
      for (let i = 0; i < data.length; i += 4) {
        const dist = colorDist(i);
        if (dist <= maxDist) {
          data[i + 3] = 0;
        } else if (dist <= maxDist + featherRange) {
          const factor = (dist - maxDist) / featherRange;
          data[i + 3] = Math.round(data[i + 3] * factor);
        }
      }
    } else {
      const totalPixels = width * height;
      const visited = new Uint8Array(totalPixels);
      const queue = new Int32Array(totalPixels);
      let head = 0;
      let tail = 0;

      const trySeed = (x: number, y: number) => {
        const p = y * width + x;
        if (visited[p]) return;
        const dist = colorDist(p * 4);
        if (dist <= maxDist + featherRange) {
          visited[p] = 1;
          queue[tail++] = p;
        }
      };

      for (let x = 0; x < width; x++) {
        trySeed(x, 0);
        trySeed(x, height - 1);
      }
      for (let y = 0; y < height; y++) {
        trySeed(0, y);
        trySeed(width - 1, y);
      }

      while (head < tail) {
        const p = queue[head++];
        const idx = p * 4;
        const dist = colorDist(idx);

        if (dist <= maxDist) {
          data[idx + 3] = 0;
        } else {
          const factor = (dist - maxDist) / featherRange;
          data[idx + 3] = Math.round(data[idx + 3] * Math.min(1, Math.max(0, factor)));
        }

        const x = p % width;
        const y = (p - x) / width;
        const neighbors = [
          x > 0 ? p - 1 : -1,
          x < width - 1 ? p + 1 : -1,
          y > 0 ? p - width : -1,
          y < height - 1 ? p + width : -1,
        ];

        for (let n = 0; n < 4; n++) {
          const np = neighbors[n];
          if (np !== -1 && !visited[np]) {
            const ndist = colorDist(np * 4);
            if (ndist <= maxDist + featherRange) {
              visited[np] = 1;
              queue[tail++] = np;
            }
          }
        }
      }
    }

    cutCtx.putImageData(imgData, 0, 0);
    renderDisplay();
    exportTransparentPng();
  }, [colorMode, targetColor, tolerance, feather, renderDisplay, exportTransparentPng]);

  const runAiRemoval = useCallback(
    async (selectedFile: File, runId: number) => {
      const src = sourceCanvasRef.current;
      if (!src) return;

      setAiProcessing(true);
      setAiProgress(5);
      setAiReady(false);
      setAiError(null);
      setOutputBlob(null);

      try {
        let resultCanvas: HTMLCanvasElement;
        try {
          resultCanvas = await runRmbgInference(src, (pct) => {
            if (activeRunIdRef.current === runId) setAiProgress(pct);
          });
        } catch {
          if (activeRunIdRef.current !== runId) return;
          setAiProgress(15);
          resultCanvas = await runImglyCdnFallback(selectedFile, (pct) => {
            if (activeRunIdRef.current === runId) setAiProgress(pct);
          });
        }

        if (activeRunIdRef.current !== runId) return;

        const cache = document.createElement('canvas');
        cache.width = resultCanvas.width;
        cache.height = resultCanvas.height;
        cache.getContext('2d')?.drawImage(resultCanvas, 0, 0);
        aiCutoutCacheRef.current = cache;

        const cutout = cutoutCanvasRef.current;
        if (cutout) {
          cutout.width = resultCanvas.width;
          cutout.height = resultCanvas.height;
          const cCtx = cutout.getContext('2d');
          cCtx?.clearRect(0, 0, cutout.width, cutout.height);
          cCtx?.drawImage(resultCanvas, 0, 0);
        }

        setAiReady(true);
        setAiProgress(100);
        renderDisplay();
        exportTransparentPng();
      } catch {
        if (activeRunIdRef.current !== runId) return;
        setAiReady(false);
        setOutputBlob(null);
        setAiError('Please check internet and try again');
      } finally {
        if (activeRunIdRef.current === runId) {
          setAiProcessing(false);
        }
      }
    },
    [exportTransparentPng, renderDisplay]
  );

  const handleFilesSelected = async (files: File[]) => {
    const selected = files[0];
    const runId = ++activeRunIdRef.current;
    setFileError(null);
    setAiError(null);
    setAiReady(false);
    setOutputBlob(null);
    setShowOriginal(false);
    setBrushMode('none');
    setPickActive(false);
    aiCutoutCacheRef.current = null;

    try {
      const img = await loadImageFromFile(selected);
      if (activeRunIdRef.current !== runId) return;

      const src = document.createElement('canvas');
      src.width = img.naturalWidth;
      src.height = img.naturalHeight;
      const sCtx = src.getContext('2d');
      if (sCtx) {
        sCtx.drawImage(img, 0, 0);
        const corner = sCtx.getImageData(0, 0, 1, 1).data;
        setTargetColor({ r: corner[0], g: corner[1], b: corner[2] });
      }
      sourceCanvasRef.current = src;

      const cutout = document.createElement('canvas');
      cutout.width = img.naturalWidth;
      cutout.height = img.naturalHeight;
      cutoutCanvasRef.current = cutout;

      setFile(selected);
      setOriginalImg(img);
      const previewUrl = URL.createObjectURL(selected);
      setOriginalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewUrl;
      });

      if (engine === 'ai') {
        void runAiRemoval(selected, runId);
      } else {
        applyColorRemovalToCutout();
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Could not open image file.');
    }
  };

  useEffect(() => {
    if (engine === 'color' && originalImg) {
      applyColorRemovalToCutout();
    }
  }, [engine, originalImg, applyColorRemovalToCutout]);

  const handleSwitchEngine = (next: RemovalEngine) => {
    setEngine(next);
    setBrushMode('none');
    setPickActive(false);
    if (!file || !originalImg) return;

    if (next === 'ai') {
      if (aiCutoutCacheRef.current && cutoutCanvasRef.current) {
        const cut = cutoutCanvasRef.current;
        cut.width = aiCutoutCacheRef.current.width;
        cut.height = aiCutoutCacheRef.current.height;
        const ctx = cut.getContext('2d');
        ctx?.clearRect(0, 0, cut.width, cut.height);
        ctx?.drawImage(aiCutoutCacheRef.current, 0, 0);
        setAiReady(true);
        setAiError(null);
        renderDisplay();
        exportTransparentPng();
      } else {
        const runId = ++activeRunIdRef.current;
        void runAiRemoval(file, runId);
      }
    } else {
      applyColorRemovalToCutout();
    }
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = displayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const applyBrushAt = (x: number, y: number) => {
    const cutout = cutoutCanvasRef.current;
    const src = sourceCanvasRef.current;
    if (!cutout || !src) return;
    const cCtx = cutout.getContext('2d');
    if (!cCtx) return;

    const scaleRatio = Math.max(1, cutout.width / 640);
    const radius = (brushSize * scaleRatio) / 2;

    cCtx.save();
    cCtx.beginPath();
    cCtx.arc(x, y, radius, 0, Math.PI * 2);
    cCtx.clip();

    if (brushMode === 'erase') {
      cCtx.clearRect(x - radius - 2, y - radius - 2, radius * 2 + 4, radius * 2 + 4);
    } else if (brushMode === 'restore') {
      cCtx.drawImage(src, 0, 0);
    }
    cCtx.restore();

    renderDisplay();
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!originalImg) return;

    if (pickActive && sourceCanvasRef.current && displayCanvasRef.current) {
      const canvas = displayCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = Math.min(
        canvas.width - 1,
        Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width))
      );
      const y = Math.min(
        canvas.height - 1,
        Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height))
      );
      const sCtx = sourceCanvasRef.current.getContext('2d');
      if (sCtx) {
        const px = sCtx.getImageData(x, y, 1, 1).data;
        setTargetColor({ r: px[0], g: px[1], b: px[2] });
      }
      setPickActive(false);
      return;
    }

    if (brushMode !== 'none') {
      setIsBrushing(true);
      const pt = getCanvasCoordinates(e);
      applyBrushAt(pt.x, pt.y);
    }
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isBrushing || brushMode === 'none') return;
    const pt = getCanvasCoordinates(e);
    applyBrushAt(pt.x, pt.y);
  };

  const handleCanvasPointerUp = () => {
    if (isBrushing) {
      setIsBrushing(false);
      exportTransparentPng();
    }
  };

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    downloadBlob(outputBlob, `${stripExtension(file.name)}-no-bg.png`);
  };

  const resetTool = () => {
    activeRunIdRef.current++;
    setFile(null);
    setOriginalImg(null);
    setOriginalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setOutputBlob(null);
    setAiReady(false);
    setAiProcessing(false);
    setAiProgress(0);
    setAiError(null);
    setFileError(null);
    setPickActive(false);
    setBrushMode('none');
    setShowOriginal(false);
    aiCutoutCacheRef.current = null;
  };

  const hexColor = `#${[targetColor.r, targetColor.g, targetColor.b]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')}`;

  const canShowCutout = engine === 'ai' ? aiReady && !aiProcessing && !aiError : Boolean(originalImg);

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/*"
        label="Upload any photo to remove its background"
        hint="Powered by real AI segmentation (briaai/RMBG-1.4) — exports clean transparent PNG"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={resetTool}
      />

      {fileError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {fileError}
        </div>
      )}

      {originalImg && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Removal Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => handleSwitchEngine('ai')}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    engine === 'ai'
                      ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Segmentation
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchEngine('color')}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    engine === 'color'
                      ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  Solid Color (Backup)
                </button>
              </div>
            </div>

            {engine === 'ai' && aiProcessing && (
              <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/80 p-3 dark:border-blue-900 dark:bg-blue-950/40">
                <div className="flex justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                  <span>Removing Background... Please wait</span>
                  <span className="font-mono tabular-nums">{aiProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blue-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-150 dark:bg-blue-500"
                    style={{ width: `${aiProgress}%` }}
                  />
                </div>
              </div>
            )}

            {engine === 'ai' && aiError && !aiProcessing && (
              <div className="space-y-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                <div className="flex items-start gap-2 font-semibold">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (file) {
                      const runId = ++activeRunIdRef.current;
                      void runAiRemoval(file, runId);
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              </div>
            )}

            {engine === 'ai' && aiReady && !aiProcessing && !aiError && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                Background removed with AI segmentation. Ready to download transparent PNG.
              </div>
            )}

            {engine === 'color' && (
              <div className="space-y-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Backup mode for logos or solid studio backgrounds.
                </p>
                <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setColorMode('flood')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      colorMode === 'flood'
                        ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Edge Flood Fill
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('global')}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      colorMode === 'global'
                        ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All Matching
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={hexColor}
                      onChange={(e) => {
                        const hex = e.target.value.replace('#', '');
                        setTargetColor({
                          r: parseInt(hex.slice(0, 2), 16),
                          g: parseInt(hex.slice(2, 4), 16),
                          b: parseInt(hex.slice(4, 6), 16),
                        });
                      }}
                      className="h-8 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <span className="font-mono text-xs uppercase text-slate-600 dark:text-slate-300">
                      {hexColor}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBrushMode('none');
                        setPickActive((v) => !v);
                      }}
                      className={`ml-auto inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                        pickActive
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <Pipette className="h-3.5 w-3.5" />
                      {pickActive ? 'Click Photo...' : 'Pick'}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Color Tolerance</span>
                    <span className="font-mono tabular-nums">{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Edge Feather</span>
                    <span className="font-mono tabular-nums">{feather}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={feather}
                    onChange={(e) => setFeather(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            )}

            {/* Touch-up Brush Controls */}
            {canShowCutout && (
              <div className="space-y-2.5 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Touch-Up Brush
                  </span>
                  {brushMode !== 'none' && (
                    <button
                      type="button"
                      onClick={() => setBrushMode('none')}
                      className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Done
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPickActive(false);
                      setBrushMode((m) => (m === 'erase' ? 'none' : 'erase'));
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      brushMode === 'erase'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Eraser className="h-3.5 w-3.5" />
                    Erase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPickActive(false);
                      setBrushMode((m) => (m === 'restore' ? 'none' : 'restore'));
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      brushMode === 'restore'
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Paintbrush className="h-3.5 w-3.5" />
                    Restore
                  </button>
                </div>

                {brushMode !== 'none' && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                      <span>Brush Size</span>
                      <span className="font-mono tabular-nums">{brushSize} px</span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={80}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preview Backdrop (Download is Transparent PNG)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(
                      [
                        ['transparent', 'Clear'],
                        ['white', 'White'],
                        ['blue', 'Blue'],
                        ['dark', 'Dark'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPreviewBackdrop(key)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                          previewBackdrop === key
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputBlob || aiProcessing || (engine === 'ai' && Boolean(aiError))}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Download className="h-4 w-4" />
                Download Transparent PNG
              </button>
              <button
                type="button"
                onClick={resetTool}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Upload New Photo
              </button>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                {canShowCutout && (
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {showOriginal ? 'Showing Original (Click for Cutout)' : 'Compare Original'}
                  </button>
                )}
                {brushMode !== 'none' && (
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Drag on photo to {brushMode}
                  </span>
                )}
                {pickActive && (
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    Click photo to sample color
                  </span>
                )}
              </div>
              <span className="font-mono tabular-nums">
                {originalImg.naturalWidth} × {originalImg.naturalHeight} px
                {outputBlob ? ` · ${formatBytes(outputBlob.size)}` : ''}
              </span>
            </div>

            <div className="checkerboard-bg relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              {canShowCutout ? (
                <canvas
                  ref={displayCanvasRef}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerLeave={handleCanvasPointerUp}
                  className={`max-h-[460px] max-w-full rounded object-contain ${
                    pickActive || brushMode !== 'none'
                      ? 'touch-none cursor-crosshair ring-2 ring-blue-500'
                      : ''
                  }`}
                />
              ) : (
                originalPreviewUrl && (
                  <img
                    src={originalPreviewUrl}
                    alt="Uploaded photo"
                    className="max-h-[460px] max-w-full rounded object-contain opacity-60"
                  />
                )
              )}

              {aiProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 px-4 text-center backdrop-blur-[2px] dark:bg-slate-950/80">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Removing Background... Please wait
                  </p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-blue-600 dark:text-blue-400">
                    {aiProgress}%
                  </p>
                </div>
              )}

              {engine === 'ai' && aiError && !aiProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 px-6 text-center backdrop-blur-[2px] dark:bg-slate-950/85">
                  <AlertCircle className="h-10 w-10 text-red-500" />
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    Please check internet and try again
                  </p>
                  <p className="mt-1 max-w-sm text-xs text-slate-600 dark:text-slate-400">
                    Could not download the AI segmentation model. Verify your connection and retry.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (file) {
                        const runId = ++activeRunIdRef.current;
                        void runAiRemoval(file, runId);
                      }
                    }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry AI Removal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
