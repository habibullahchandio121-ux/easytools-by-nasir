import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check, RefreshCw, Download, Upload } from 'lucide-react';
import { downloadTextFile } from '../../utils/fileHelpers';

export const PasswordGeneratorTool: React.FC = () => {
  const [length, setLength] = useState<number>(16);
  const [upper, setUpper] = useState<boolean>(true);
  const [lower, setLower] = useState<boolean>(true);
  const [numbers, setNumbers] = useState<boolean>(true);
  const [symbols, setSymbols] = useState<boolean>(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState<boolean>(false);
  const [batchCount, setBatchCount] = useState<number>(1);
  const [customSeed, setCustomSeed] = useState<string>('');
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const generatePasswords = useCallback(() => {
    let charset = '';
    if (upper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) charset += '0123456789';
    if (symbols) charset += '!@#$%^&*()-_=+[]{};:,.<>?';

    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz0123456789';

    if (excludeAmbiguous) {
      charset = charset.replace(/[Il1O0|`'"]/g, '');
    }

    const list: string[] = [];
    for (let b = 0; b < batchCount; b++) {
      const arr = new Uint32Array(length);
      window.crypto.getRandomValues(arr);
      let pwd = '';
      for (let i = 0; i < length; i++) {
        pwd += charset[arr[i] % charset.length];
      }
      if (customSeed.trim()) {
        const words = customSeed
          .trim()
          .split(/\s+/)
          .filter(Boolean);
        if (words.length > 0) {
          const randWord = words[arr[0] % words.length].slice(0, 8);
          pwd = `${randWord}-${pwd}`;
        }
      }
      list.push(pwd);
    }
    setPasswords(list);
  }, [length, upper, lower, numbers, symbols, excludeAmbiguous, batchCount, customSeed]);

  useEffect(() => {
    generatePasswords();
  }, [generatePasswords]);

  const handleUploadSeed = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCustomSeed(text.slice(0, 500));
    e.target.value = '';
  };

  const handleCopy = async (pwd: string, idx: number) => {
    await navigator.clipboard.writeText(pwd);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  const handleDownload = () => {
    downloadTextFile(passwords.join('\n'), 'toolbazaar-passwords.txt');
  };

  const poolSize =
    (upper ? 26 : 0) + (lower ? 26 : 0) + (numbers ? 10 : 0) + (symbols ? 26 : 0) || 36;
  const entropyBits = Math.round(length * Math.log2(poolSize));
  const strengthLabel =
    entropyBits >= 90 ? 'Very Strong' : entropyBits >= 65 ? 'Strong' : entropyBits >= 45 ? 'Moderate' : 'Weak';

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Generator Options
          </h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleUploadSeed}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Upload className="h-3 w-3" />
              Wordlist (.txt)
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Length</span>
            <span className="font-mono tabular-nums">{length} chars</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div>
          <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Batch Count</span>
            <span className="font-mono tabular-nums">{batchCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={batchCount}
            onChange={(e) => setBatchCount(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Uppercase (A-Z)', checked: upper, set: setUpper },
            { label: 'Lowercase (a-z)', checked: lower, set: setLower },
            { label: 'Numbers (0-9)', checked: numbers, set: setNumbers },
            { label: 'Symbols (!@#$)', checked: symbols, set: setSymbols },
          ].map((opt) => (
            <label
              key={opt.label}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={(e) => opt.set(e.target.checked)}
                className="accent-blue-600"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
          <input
            type="checkbox"
            checked={excludeAmbiguous}
            onChange={(e) => setExcludeAmbiguous(e.target.checked)}
            className="accent-blue-600"
          />
          <span>Exclude ambiguous characters (I, l, 1, O, 0)</span>
        </label>

        {customSeed && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
            <span>Custom prefix wordlist loaded</span>
            <button
              type="button"
              onClick={() => setCustomSeed('')}
              className="font-semibold underline"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={generatePasswords}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Download className="h-4 w-4" />
            Download .txt
          </button>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-7">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Preview ({passwords.length} generated via WebCrypto)
          </span>
          <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {strengthLabel} · ~{entropyBits} bits entropy
          </span>
        </div>

        <div className="space-y-2.5">
          {passwords.map((pwd, idx) => (
            <div
              key={`${idx}-${pwd.slice(0, 6)}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <code className="min-w-0 flex-1 break-all font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                {pwd}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(pwd, idx)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
