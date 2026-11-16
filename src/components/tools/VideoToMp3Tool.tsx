import React, { useEffect, useState } from 'react';
import { Mp3Encoder } from '@breezystack/lamejs';
import { Download, Music } from 'lucide-react';
import { DropZone } from '../shared/DropZone';
import { downloadBlob, formatBytes, stripExtension } from '../../utils/fileHelpers';

function floatToInt16(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export const VideoToMp3Tool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bitrate, setBitrate] = useState<128 | 192 | 320>(192);
  const [progress, setProgress] = useState<number>(0);
  const [processing, setProcessing] = useState<boolean>(false);
  const [mp3Blob, setMp3Blob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const convertFile = async (selected: File, kbps: 128 | 192 | 320) => {
    setProcessing(true);
    setProgress(10);
    setError(null);
    setMp3Blob(null);

    try {
      const arrayBuffer = await selected.arrayBuffer();
      setProgress(25);
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      setDuration(audioBuffer.duration);
      setProgress(45);

      const channels = Math.min(2, audioBuffer.numberOfChannels);
      const sampleRate = audioBuffer.sampleRate;
      const encoder = new Mp3Encoder(channels, sampleRate, kbps);

      const left = floatToInt16(audioBuffer.getChannelData(0));
      const right = channels > 1 ? floatToInt16(audioBuffer.getChannelData(1)) : undefined;

      const chunkSize = 1152;
      const mp3Chunks: Uint8Array[] = [];

      for (let i = 0; i < left.length; i += chunkSize) {
        const leftSlice = left.subarray(i, i + chunkSize);
        const rightSlice = right ? right.subarray(i, i + chunkSize) : undefined;
        const encoded = encoder.encodeBuffer(leftSlice, rightSlice);
        if (encoded.length > 0) {
          mp3Chunks.push(new Uint8Array(encoded));
        }
        if (i % (chunkSize * 80) === 0) {
          setProgress(45 + Math.round((i / left.length) * 50));
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      const end = encoder.flush();
      if (end.length > 0) {
        mp3Chunks.push(new Uint8Array(end));
      }

      const blobParts = mp3Chunks.map((c) => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength) as ArrayBuffer);
      const blob = new Blob(blobParts, { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);

      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setMp3Blob(blob);
      setProgress(100);
    } catch {
      setError('Could not extract audio from this video. Make sure the file has an audio track in MP4, WebM, MOV, or M4A format.');
    } finally {
      setProcessing(false);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const selected = files[0];
    setFile(selected);
    convertFile(selected, bitrate);
  };

  const handleDownload = () => {
    if (!mp3Blob || !file) return;
    downloadBlob(mp3Blob, `${stripExtension(file.name)}.mp3`);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="video/*,audio/*"
        label="Upload a video file to extract MP3 audio"
        hint="Supports MP4, WebM, MOV, MKV — decodes and encodes to real MP3 in your browser"
        file={file}
        onFilesSelected={handleFilesSelected}
        onClear={() => {
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          setFile(null);
          setMp3Blob(null);
          setAudioUrl(null);
          setProgress(0);
          setError(null);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            MP3 Bitrate:
          </span>
          <div className="flex gap-1.5 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
            {([128, 192, 320] as const).map((kbps) => (
              <button
                key={kbps}
                type="button"
                onClick={() => {
                  setBitrate(kbps);
                  if (file) convertFile(file, kbps);
                }}
                className={`rounded-md px-3 py-1 font-mono text-xs font-semibold transition-colors ${
                  bitrate === kbps
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                {kbps} kbps
              </button>
            ))}
          </div>
        </div>

        {mp3Blob && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Download className="h-4 w-4" />
            Download MP3 ({formatBytes(mp3Blob.size)})
          </button>
        )}
      </div>

      {processing && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Encoding MP3 audio locally...</span>
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {audioUrl && mp3Blob && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <Music className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Audio Preview
            </span>
            <span className="font-mono tabular-nums">
              {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')} · {bitrate} kbps · {formatBytes(mp3Blob.size)}
            </span>
          </div>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
};
