import React, { useMemo, useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { downloadTextFile } from '../../utils/fileHelpers';

export const WordCounterTool: React.FC = () => {
  const [text, setText] = useState<string>(
    'ToolBazaar runs completely inside your browser. Paste any article, essay, or upload a text document to inspect word counts, sentence structure, reading time, and top keyword frequency.'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const charsWithSpaces = text.length;
    const charsWithoutSpaces = text.replace(/\s/g, '').length;
    const sentences = trimmed
      ? trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const paragraphs = trimmed
      ? trimmed.split(/\n+/).filter((p) => p.trim().length > 0).length
      : 0;
    const readingMins = Math.max(1, Math.ceil(words.length / 200));
    const speakingMins = Math.max(1, Math.ceil(words.length / 130));

    const freq: Record<string, number> = {};
    for (const raw of words) {
      const clean = raw.toLowerCase().replace(/[^a-z0-9'-]/g, '');
      if (clean.length < 3) continue;
      freq[clean] = (freq[clean] || 0) + 1;
    }
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      wordCount: words.length,
      charsWithSpaces,
      charsWithoutSpaces,
      sentences,
      paragraphs,
      readingTime: words.length === 0 ? '0 min' : `${readingMins} min`,
      speakingTime: words.length === 0 ? '0 min' : `${speakingMins} min`,
      topWords,
    };
  }, [text]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    e.target.value = '';
  };

  const handleDownloadReport = () => {
    const report = [
      'ToolBazaar Word Count Report',
      '============================',
      `Words: ${stats.wordCount}`,
      `Characters (with spaces): ${stats.charsWithSpaces}`,
      `Characters (no spaces): ${stats.charsWithoutSpaces}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Estimated Reading Time: ${stats.readingTime}`,
      `Estimated Speaking Time: ${stats.speakingTime}`,
      '',
      'Top Keywords:',
      ...stats.topWords.map(([w, c]) => `- ${w}: ${c}`),
      '',
      'Source Text:',
      text,
    ].join('\n');
    downloadTextFile(report, 'toolbazaar-word-report.txt');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,.log"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Text File
          </button>
          <button
            type="button"
            onClick={() => setText('')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Download className="h-3.5 w-3.5" />
          Download Report (.txt)
        </button>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Words', value: stats.wordCount },
          { label: 'Characters', value: stats.charsWithSpaces },
          { label: 'No Spaces', value: stats.charsWithoutSpaces },
          { label: 'Sentences', value: stats.sentences },
          { label: 'Paragraphs', value: stats.paragraphs },
          { label: 'Read Time', value: stats.readingTime },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Text Editor & Live Preview
          </label>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start typing or paste your text here..."
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-4">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Top Keyword Frequency
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Speaking time: <span className="font-mono tabular-nums">{stats.speakingTime}</span>
          </p>

          {stats.topWords.length === 0 ? (
            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              Type at least 3-letter words to inspect keyword frequency.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {stats.topWords.map(([word, count]) => (
                <div key={word} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{word}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                    {count}×
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
