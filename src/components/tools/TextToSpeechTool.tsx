import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Pause, Download, Upload, Volume2 } from 'lucide-react';
import { downloadTextFile } from '../../utils/fileHelpers';

export const TextToSpeechTool: React.FC = () => {
  const [text, setText] = useState<string>(
    'Welcome to ToolBazaar! Type or upload any text here, select a natural voice from your device, adjust pitch and speed, and listen right inside your browser.'
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [rate, setRate] = useState<number>(1);
  const [pitch, setPitch] = useState<number>(1);
  const [speakingState, setSpeakingState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [supported] = useState<boolean>(() => typeof window !== 'undefined' && 'speechSynthesis' in window);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!supported) return;
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      if (list.length > 0 && !selectedVoiceUri) {
        const english = list.find((v) => v.lang.startsWith('en')) || list[0];
        setSelectedVoiceUri(english.voiceURI);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [supported, selectedVoiceUri]);

  const handlePlay = () => {
    if (!supported || !text.trim()) return;

    if (speakingState === 'paused') {
      window.speechSynthesis.resume();
      setSpeakingState('playing');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setSpeakingState('playing');
    utterance.onend = () => setSpeakingState('idle');
    utterance.onerror = () => setSpeakingState('idle');

    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setSpeakingState('paused');
  };

  const handleStop = () => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeakingState('idle');
  };

  const handleUploadText = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    e.target.value = '';
  };

  const handleDownloadTranscript = () => {
    downloadTextFile(text, 'toolbazaar-speech-script.txt');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Voice Controls
          </h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md"
              onChange={handleUploadText}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Upload className="h-3 w-3" />
              Upload .txt
            </button>
          </div>
        </div>

        {!supported && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            Web Speech Synthesis is not supported in this browser.
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Voice
          </label>
          <select
            value={selectedVoiceUri}
            onChange={(e) => setSelectedVoiceUri(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {voices.length === 0 ? (
              <option value="">System Default Voice</option>
            ) : (
              voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Speed (Rate)</span>
            <span className="font-mono tabular-nums">{rate.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Pitch</span>
            <span className="font-mono tabular-nums">{pitch.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.8}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {speakingState === 'playing' ? (
            <button
              type="button"
              onClick={handlePause}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlay}
              disabled={!supported || !text.trim()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Play className="h-4 w-4" />
              {speakingState === 'paused' ? 'Resume' : 'Listen Preview'}
            </button>
          )}
          <button
            type="button"
            onClick={handleStop}
            disabled={speakingState === 'idle'}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadTranscript}
          disabled={!text.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Download className="h-3.5 w-3.5" />
          Download Script (.txt)
        </button>
      </div>

      <div className="space-y-3 lg:col-span-7">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            Speech Text Preview ({speakingState === 'playing' ? 'Speaking now' : speakingState === 'paused' ? 'Paused' : 'Ready'})
          </span>
          <span className="font-mono tabular-nums">{text.length} chars</span>
        </div>
        <textarea
          rows={11}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter or paste text to read aloud..."
          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </div>
    </div>
  );
};
