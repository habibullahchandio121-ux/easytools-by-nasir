import React, { useEffect, useRef, useState } from 'react';
import { Download, Video } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, stripExtension } from '../../utils/fileHelpers';

export const VideoCompressorTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [resolutionScale, setResolutionScale] = useState<'100' | '720' | '480' | '360'>('720');
  const [bitrateKbps, setBitrateKbps] = useState<number>(1000);
  const [compressing, setCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cancelRef = useRef<boolean>(false);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
    };
  }, [sourceUrl, outputUrl]);

  const handleFilesSelected = (files: File[]) => {
    const selected = files[0];
    setError(null);
    setOutputBlob(null);
    setProgress(0);
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
    }
    const url = URL.createObjectURL(selected);
    setSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setFile(selected);
  };

  const handleCompress = async () => {
    if (!file || !sourceUrl) return;
    setCompressing(true);
    setProgress(0);
    setError(null);
    cancelRef.current = false;

    const video = document.createElement('video');
    video.src = sourceUrl;
    video.muted = false;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Could not decode video metadata.'));
      });

      const origW = video.videoWidth || 640;
      const origH = video.videoHeight || 360;
      let targetW = origW;
      let targetH = origH;

      if (resolutionScale !== '100') {
        const maxH = parseInt(resolutionScale, 10);
        if (origH > maxH) {
          const ratio = maxH / origH;
          targetH = maxH;
          targetW = Math.round((origW * ratio) / 2) * 2;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');

      const canvasStream = canvas.captureStream(30);

      // Attach audio track if browser supports captureStream on video element
      const videoAny = video as HTMLVideoElement & {
        captureStream?: () => MediaStream;
        mozCaptureStream?: () => MediaStream;
      };
      const mediaStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((t) => mediaStream.addTrack(t));

      try {
        const vidStream = videoAny.captureStream?.() || videoAny.mozCaptureStream?.();
        vidStream?.getAudioTracks().forEach((t) => mediaStream.addTrack(t));
      } catch {
        // Silent fallback if audio track capture is restricted
      }

      const mimeCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];
      const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(mediaStream, {
        mimeType,
        videoBitsPerSecond: bitrateKbps * 1000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const donePromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType.split(';')[0] }));
        };
      });

      recorder.start(250);
      video.currentTime = 0;
      video.volume = 0.01;
      await video.play();

      const drawFrame = () => {
        if (cancelRef.current || video.paused || video.ended) {
          if (recorder.state === 'recording') recorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, targetW, targetH);
        if (video.duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
        }
        requestAnimationFrame(drawFrame);
      };

      video.onended = () => {
        setProgress(100);
        if (recorder.state === 'recording') recorder.stop();
      };

      requestAnimationFrame(drawFrame);
      const resultBlob = await donePromise;
      const outUrl = URL.createObjectURL(resultBlob);
      setOutputUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return outUrl;
      });
      setOutputBlob(resultBlob);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Video compression failed. Try a smaller MP4 or WebM clip.'
      );
    } finally {
      video.pause();
      setCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!outputBlob || !file) return;
    downloadBlob(outputBlob, `${stripExtension(file.name)}-compressed.webm`);
  };

  const savedPercent =
    file && outputBlob ? Math.round(((file.size - outputBlob.size) / file.size) * 100) : 0;

  return (
    <div className="space-y-6">
      <DropZone
        accept="video/*"
        label="Upload a video file to compress in-browser"
        hint="Re-encodes video frames with target resolution and bitrate in real time"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          cancelRef.current = true;
          if (sourceUrl) URL.revokeObjectURL(sourceUrl);
          if (outputUrl) URL.revokeObjectURL(outputUrl);
          setFile(null);
          setSourceUrl(null);
          setOutputBlob(null);
          setOutputUrl(null);
          setProgress(0);
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
              Compression Settings
            </h3>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Max Resolution
              </label>
              <select
                value={resolutionScale}
                onChange={(e) => setResolutionScale(e.target.value as '100' | '720' | '480' | '360')}
                disabled={compressing}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="100">Keep Original Resolution</option>
                <option value="720">720p HD</option>
                <option value="480">480p SD</option>
                <option value="360">360p Compact</option>
              </select>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Target Bitrate</span>
                <span className="font-mono tabular-nums">{bitrateKbps} kbps</span>
              </div>
              <input
                type="range"
                min={300}
                max={3500}
                step={100}
                disabled={compressing}
                value={bitrateKbps}
                onChange={(e) => setBitrateKbps(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <button
              type="button"
              onClick={handleCompress}
              disabled={compressing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Video className="h-4 w-4" />
              {compressing ? `Compressing (${progress}%)...` : 'Compress Video'}
            </button>

            {outputBlob && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Original</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                    {formatBytes(file.size)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Compressed</span>
                  <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {formatBytes(outputBlob.size)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Savings</span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {savedPercent >= 0 ? `${savedPercent}% smaller` : `${Math.abs(savedPercent)}% larger`}
                  </span>
                </div>
              </div>
            )}

            {outputBlob && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
              >
                <Download className="h-4 w-4" />
                Download Compressed Video
              </button>
            )}
          </div>

          <div className="space-y-3 lg:col-span-8">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{outputUrl ? 'Compressed Video Preview' : 'Uploaded Video Preview'}</span>
              {compressing && (
                <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  Processing {progress}%
                </span>
              )}
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 dark:border-slate-800">
              <video
                key={outputUrl || sourceUrl}
                controls
                src={outputUrl || sourceUrl || undefined}
                className="max-h-[400px] w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
