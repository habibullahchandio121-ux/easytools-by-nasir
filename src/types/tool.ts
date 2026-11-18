import type { LucideIcon } from 'lucide-react';

export type ToolId =
  | 'bg-remover'
  | 'image-compressor'
  | 'image-resizer'
  | 'jpg-to-png'
  | 'image-enhancer'
  | 'image-to-pdf'
  | 'qr-code-generator'
  | 'password-generator'
  | 'word-counter'
  | 'age-calculator'
  | 'color-picker'
  | 'unit-converter'
  | 'text-to-speech'
  | 'video-to-mp3'
  | 'pdf-merge'
  | 'video-compressor'
  | 'image-to-text'
  | 'pdf-compressor';

export type ToolCategory = 'All' | 'Image' | 'PDF' | 'Video & Audio' | 'Text & Utilities';

export type PageKey = 'home' | 'about' | 'privacy' | 'contact' | 'terms';

export interface ToolItem {
  id: ToolId;
  name: string;
  description: string;
  category: Exclude<ToolCategory, 'All'>;
  icon: LucideIcon;
  accepts?: string;
}
