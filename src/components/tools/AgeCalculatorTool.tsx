import React, { useMemo, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { downloadDataUrl } from '../../utils/fileHelpers';

export const AgeCalculatorTool: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [birthDate, setBirthDate] = useState<string>('1998-06-15');
  const [targetDate, setTargetDate] = useState<string>(todayStr);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const result = useMemo(() => {
    const dob = new Date(`${birthDate}T00:00:00`);
    const target = new Date(`${targetDate}T00:00:00`);
    if (isNaN(dob.getTime()) || isNaN(target.getTime()) || dob > target) {
      return null;
    }

    let years = target.getFullYear() - dob.getFullYear();
    let months = target.getMonth() - dob.getMonth();
    let days = target.getDate() - dob.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthDays = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
      days += prevMonthDays;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const diffMs = target.getTime() - dob.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const totalHours = totalDays * 24;

    const nextBday = new Date(target.getFullYear(), dob.getMonth(), dob.getDate());
    if (nextBday < target) {
      nextBday.setFullYear(target.getFullYear() + 1);
    }
    const daysToNextBday = Math.ceil((nextBday.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

    const bornDay = dob.toLocaleDateString('en-US', { weekday: 'long' });

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      totalHours,
      daysToNextBday,
      bornDay,
    };
  }, [birthDate, targetDate]);

  const handleUploadDate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = (await file.text()).trim();
    const match = content.match(/\d{4}-\d{2}-\d{2}/);
    if (match) setBirthDate(match[0]);
    e.target.value = '';
  };

  const handleDownloadCard = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 800, 420);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, 800, 10);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 18px sans-serif';
    ctx.fillText('TOOLBAZAAR AGE SUMMARY', 48, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${result.years} yrs, ${result.months} mos, ${result.days} days`, 48, 140);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Born on ${result.bornDay} (${birthDate})`, 48, 195);
    ctx.fillText(`Total Months: ${result.totalMonths.toLocaleString()}   ·   Total Weeks: ${result.totalWeeks.toLocaleString()}`, 48, 250);
    ctx.fillText(`Total Days: ${result.totalDays.toLocaleString()}   ·   Total Hours: ${result.totalHours.toLocaleString()}`, 48, 290);
    ctx.fillStyle = '#60a5fa';
    ctx.fillText(`Next Birthday in ${result.daysToNextBday} day(s)`, 48, 355);

    downloadDataUrl(canvas.toDataURL('image/png'), `age-summary-${birthDate}.png`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
            Date Inputs
          </h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleUploadDate}
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

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Date of Birth
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Calculate Age As Of
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={handleDownloadCard}
          disabled={!result}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Download className="h-4 w-4" />
          Download Age Card (.png)
        </button>
      </div>

      <div className="lg:col-span-7">
        {!result ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Please ensure the Date of Birth is earlier than or equal to the target date.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-6 dark:border-blue-900/70 dark:bg-blue-950/30">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                Exact Age Preview
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white sm:text-4xl">
                {result.years} Years, {result.months} Months, {result.days} Days
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Born on <span className="font-semibold text-slate-900 dark:text-white">{result.bornDay}</span> · Next birthday in{' '}
                <span className="font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {result.daysToNextBday}
                </span>{' '}
                day{result.daysToNextBday === 1 ? '' : 's'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Months', value: result.totalMonths.toLocaleString() },
                { label: 'Total Weeks', value: result.totalWeeks.toLocaleString() },
                { label: 'Total Days', value: result.totalDays.toLocaleString() },
                { label: 'Total Hours', value: result.totalHours.toLocaleString() },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-mono text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
