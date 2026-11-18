import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { TOOL_GUIDES } from '../data/toolGuides';
import type { ToolId, ToolItem } from '../types/tool';
import { BgRemoverTool } from './tools/BgRemoverTool';
import { ImageCompressorTool } from './tools/ImageCompressorTool';
import { ImageResizerTool } from './tools/ImageResizerTool';
import { JpgToPngTool } from './tools/JpgToPngTool';
import { ImageEnhancerTool } from './tools/ImageEnhancerTool';
import { ImageToPdfTool } from './tools/ImageToPdfTool';
import { QrCodeGeneratorTool } from './tools/QrCodeGeneratorTool';
import { PasswordGeneratorTool } from './tools/PasswordGeneratorTool';
import { WordCounterTool } from './tools/WordCounterTool';
import { AgeCalculatorTool } from './tools/AgeCalculatorTool';
import { ColorPickerTool } from './tools/ColorPickerTool';
import { UnitConverterTool } from './tools/UnitConverterTool';
import { TextToSpeechTool } from './tools/TextToSpeechTool';
import { VideoToMp3Tool } from './tools/VideoToMp3Tool';
import { PdfMergeTool } from './tools/PdfMergeTool';
import { VideoCompressorTool } from './tools/VideoCompressorTool';
import { ImageToTextTool } from './tools/ImageToTextTool';
import { PdfCompressorTool } from './tools/PdfCompressorTool';

interface ToolWorkspaceProps {
  tool: ToolItem;
  onBack: () => void;
  onSelectTool: (id: ToolId) => void;
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  tool,
  onBack,
  onSelectTool,
}) => {
  const Icon = tool.icon;
  const guide = TOOL_GUIDES[tool.id];

  const renderTool = () => {
    switch (tool.id) {
      case 'bg-remover':
        return <BgRemoverTool />;
      case 'image-compressor':
        return <ImageCompressorTool />;
      case 'image-resizer':
        return <ImageResizerTool />;
      case 'jpg-to-png':
        return <JpgToPngTool />;
      case 'image-enhancer':
        return <ImageEnhancerTool />;
      case 'image-to-pdf':
        return <ImageToPdfTool />;
      case 'qr-code-generator':
        return <QrCodeGeneratorTool />;
      case 'password-generator':
        return <PasswordGeneratorTool />;
      case 'word-counter':
        return <WordCounterTool />;
      case 'age-calculator':
        return <AgeCalculatorTool />;
      case 'color-picker':
        return <ColorPickerTool />;
      case 'unit-converter':
        return <UnitConverterTool />;
      case 'text-to-speech':
        return <TextToSpeechTool />;
      case 'video-to-mp3':
        return <VideoToMp3Tool />;
      case 'pdf-merge':
        return <PdfMergeTool />;
      case 'video-compressor':
        return <VideoCompressorTool />;
      case 'image-to-text':
        return <ImageToTextTool />;
      case 'pdf-compressor':
        return <PdfCompressorTool />;
      default:
        return null;
    }
  };

  return (
    <section
      aria-label={tool.name}
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-600 dark:hover:text-blue-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Tools
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="quick-tool-switch" className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Switch tool:
          </label>
          <select
            id="quick-tool-switch"
            value={tool.id}
            onChange={(e) => onSelectTool(e.target.value as ToolId)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            {TOOLS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {tool.name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                {tool.description}
              </p>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {tool.category} · Browser Only
          </span>
        </div>

        {renderTool()}
      </div>

      {guide && (
        <article
          aria-label={`How to use ${tool.name} and key benefits`}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-7"
        >
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                How to Use {tool.name}
              </h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {guide.howToUse.map((step, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-5 md:border-t-0 md:border-l md:pt-0 md:pl-8 dark:border-slate-800">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Key Benefits
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {guide.keyBenefits}
              </p>
            </div>
          </div>
        </article>
      )}
    </section>
  );
};
