import React, { useMemo, useRef, useState } from 'react';
import { Download, ArrowLeftRight, Upload } from 'lucide-react';
import { downloadTextFile } from '../../utils/fileHelpers';

type CategoryKey = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed' | 'storage';

interface UnitDef {
  label: string;
  factor: number; // relative to base unit (unused for temperature)
}

const CATEGORIES: Record<CategoryKey, { name: string; units: Record<string, UnitDef> }> = {
  length: {
    name: 'Length',
    units: {
      m: { label: 'Meters (m)', factor: 1 },
      km: { label: 'Kilometers (km)', factor: 1000 },
      cm: { label: 'Centimeters (cm)', factor: 0.01 },
      mm: { label: 'Millimeters (mm)', factor: 0.001 },
      mi: { label: 'Miles (mi)', factor: 1609.344 },
      yd: { label: 'Yards (yd)', factor: 0.9144 },
      ft: { label: 'Feet (ft)', factor: 0.3048 },
      in: { label: 'Inches (in)', factor: 0.0254 },
    },
  },
  weight: {
    name: 'Weight / Mass',
    units: {
      kg: { label: 'Kilograms (kg)', factor: 1 },
      g: { label: 'Grams (g)', factor: 0.001 },
      mg: { label: 'Milligrams (mg)', factor: 0.000001 },
      lb: { label: 'Pounds (lb)', factor: 0.45359237 },
      oz: { label: 'Ounces (oz)', factor: 0.0283495231 },
      t: { label: 'Metric Tons (t)', factor: 1000 },
    },
  },
  temperature: {
    name: 'Temperature',
    units: {
      c: { label: 'Celsius (°C)', factor: 1 },
      f: { label: 'Fahrenheit (°F)', factor: 1 },
      k: { label: 'Kelvin (K)', factor: 1 },
    },
  },
  area: {
    name: 'Area',
    units: {
      sqm: { label: 'Square Meters (m²)', factor: 1 },
      sqkm: { label: 'Square Kilometers (km²)', factor: 1_000_000 },
      sqft: { label: 'Square Feet (ft²)', factor: 0.09290304 },
      acre: { label: 'Acres', factor: 4046.8564224 },
      ha: { label: 'Hectares (ha)', factor: 10000 },
    },
  },
  volume: {
    name: 'Volume',
    units: {
      l: { label: 'Liters (L)', factor: 1 },
      ml: { label: 'Milliliters (mL)', factor: 0.001 },
      gal: { label: 'US Gallons (gal)', factor: 3.785411784 },
      cup: { label: 'US Cups', factor: 0.2365882365 },
      m3: { label: 'Cubic Meters (m³)', factor: 1000 },
    },
  },
  speed: {
    name: 'Speed',
    units: {
      mps: { label: 'Meters/sec (m/s)', factor: 1 },
      kmh: { label: 'Kilometers/hr (km/h)', factor: 0.277777778 },
      mph: { label: 'Miles/hr (mph)', factor: 0.44704 },
      knot: { label: 'Knots (kn)', factor: 0.514444 },
    },
  },
  storage: {
    name: 'Digital Storage',
    units: {
      gb: { label: 'Gigabytes (GB)', factor: 1024 * 1024 * 1024 },
      mb: { label: 'Megabytes (MB)', factor: 1024 * 1024 },
      kb: { label: 'Kilobytes (KB)', factor: 1024 },
      b: { label: 'Bytes (B)', factor: 1 },
      tb: { label: 'Terabytes (TB)', factor: 1024 * 1024 * 1024 * 1024 },
    },
  },
};

function convertUnit(cat: CategoryKey, val: number, from: string, to: string): number {
  if (Number.isNaN(val)) return 0;
  if (cat === 'temperature') {
    let celsius = val;
    if (from === 'f') celsius = ((val - 32) * 5) / 9;
    else if (from === 'k') celsius = val - 273.15;

    if (to === 'c') return celsius;
    if (to === 'f') return (celsius * 9) / 5 + 32;
    return celsius + 273.15;
  }
  const units = CATEGORIES[cat].units;
  const base = val * units[from].factor;
  return base / units[to].factor;
}

function formatNum(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (Math.abs(num) >= 1e9 || (Math.abs(num) > 0 && Math.abs(num) < 1e-5)) {
    return num.toExponential(4);
  }
  return Number(num.toPrecision(7)).toString();
}

export const UnitConverterTool: React.FC = () => {
  const [category, setCategory] = useState<CategoryKey>('length');
  const [valueStr, setValueStr] = useState<string>('100');
  const [fromUnit, setFromUnit] = useState<string>('km');
  const [toUnit, setToUnit] = useState<string>('mi');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const unitKeys = Object.keys(CATEGORIES[category].units);

  const handleCategoryChange = (next: CategoryKey) => {
    setCategory(next);
    const keys = Object.keys(CATEGORIES[next].units);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  const numVal = parseFloat(valueStr);
  const converted = useMemo(
    () => convertUnit(category, Number.isNaN(numVal) ? 0 : numVal, fromUnit, toUnit),
    [category, numVal, fromUnit, toUnit]
  );

  const allConversions = useMemo(() => {
    const val = Number.isNaN(numVal) ? 0 : numVal;
    return unitKeys.map((key) => ({
      key,
      label: CATEGORIES[category].units[key].label,
      result: formatNum(convertUnit(category, val, fromUnit, key)),
    }));
  }, [category, numVal, fromUnit, unitKeys]);

  const handleUploadNumber = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const match = text.match(/-?\d+(\.\d+)?/);
    if (match) setValueStr(match[0]);
    e.target.value = '';
  };

  const handleDownloadCsv = () => {
    const rows = [
      ['Input Value', 'Input Unit', 'Target Unit', 'Converted Value'].join(','),
      ...allConversions.map((r) =>
        [valueStr || '0', fromUnit, `"${r.label}"`, r.result].join(',')
      ),
    ];
    downloadTextFile(rows.join('\n'), `toolbazaar-${category}-conversions.csv`, 'text/csv;charset=utf-8');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleCategoryChange(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === key
                  ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-800 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {CATEGORIES[key].name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleUploadNumber}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Value (.txt)
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>
      </div>

      <div className="grid items-end gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60 md:grid-cols-11">
        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Value
          </label>
          <input
            type="number"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 font-mono text-base font-semibold tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            From Unit
          </label>
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {unitKeys.map((k) => (
              <option key={k} value={k}>
                {CATEGORIES[category].units[k].label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center md:col-span-1">
          <button
            type="button"
            onClick={() => {
              const prevFrom = fromUnit;
              setFromUnit(toUnit);
              setToUnit(prevFrom);
            }}
            aria-label="Swap units"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>

        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            To Unit
          </label>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {unitKeys.map((k) => (
              <option key={k} value={k}>
                {CATEGORIES[category].units[k].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/70 dark:bg-blue-950/30">
        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Result Preview</p>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
          {valueStr || '0'} {fromUnit} = {formatNum(converted)} {toUnit}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5">Unit</th>
              <th className="px-4 py-2.5 text-right">Converted Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
            {allConversions.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                  {row.label}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-blue-600 dark:text-blue-400">
                  {row.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
