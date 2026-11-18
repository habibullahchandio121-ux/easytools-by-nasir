import type { PageKey, ToolId } from '../types/tool';

export interface PageSeoMeta {
  title: string;
  description: string;
}

export interface ToolSeoMeta extends PageSeoMeta {
  h1: string;
}

export const SITE_ORIGIN = 'https://easytools-by-nasir.vercel.app';
export const SITE_NAME = 'EasyTools By Nasir';

export const PAGE_SEO: Record<PageKey, PageSeoMeta> = {
  home: {
    title: 'EasyTools By Nasir — 18 Free Online Browser Tools',
    description:
      'Use 18 free browser-based tools for images, PDFs, video, audio, and text. Fast, private, zero server uploads—works 100% locally in your browser.',
  },
  about: {
    title: 'About Us — EasyTools By Nasir | 18 Free Browser Tools',
    description:
      'Learn about EasyTools By Nasir from Karachi, Pakistan. 18 free, fast, private browser-only tools with no signup, no watermark, and zero uploads.',
  },
  privacy: {
    title: 'Privacy Policy — EasyTools By Nasir',
    description:
      'Read the Privacy Policy for EasyTools By Nasir. All 18 tools run locally in your browser with zero file uploads, AdSense cookie info, and analytics details.',
  },
  contact: {
    title: 'Contact Us — EasyTools By Nasir',
    description:
      'Contact EasyTools By Nasir at habibullahchandio121@gmail.com for questions, suggestions, or bug reports. We usually reply within 24 to 48 hours.',
  },
  terms: {
    title: 'Terms & Conditions — EasyTools By Nasir',
    description:
      'Review the Terms and Conditions for EasyTools By Nasir. Free browser utilities provided as-is with user file backup responsibility and acceptable use rules.',
  },
};

export const TOOL_SEO: Record<ToolId, ToolSeoMeta> = {
  'bg-remover': {
    title: 'Free Online Photo Background Remover - No Upload | EasyTools',
    description:
      'Remove photo backgrounds free online with AI in your browser. Zero server uploads, instant transparent PNG download, no signup or watermark.',
    h1: 'Free Online Photo Background Remover',
  },
  'image-compressor': {
    title: 'Free Online Image Compressor - Shrink JPG & WebP | EasyTools',
    description:
      'Compress JPG, PNG, and WebP images online without losing quality. 100% browser-based compression with zero uploads and instant download.',
    h1: 'Free Online Image Compressor',
  },
  'image-resizer': {
    title: 'Free Online Image Resizer - Resize Photos Fast | EasyTools',
    description:
      'Resize images online by pixels or percentage with aspect ratio lock. Fast, private photo resizer running 100% inside your browser.',
    h1: 'Free Online Image Resizer',
  },
  'jpg-to-png': {
    title: 'Free JPG to PNG Converter Online - Lossless PNG | EasyTools',
    description:
      'Convert JPG, JPEG, and WebP images to lossless PNG files online for free. Runs locally in your browser with no file uploads or limits.',
    h1: 'Free Online JPG to PNG Converter',
  },
  'image-enhancer': {
    title: 'Free Online Photo Enhancer - Fix Brightness & Color | EasyTools',
    description:
      'Enhance photo brightness, contrast, sharpness, and color online in seconds. Private browser-only image editor with zero uploads.',
    h1: 'Free Online Image & Photo Enhancer',
  },
  'image-to-pdf': {
    title: 'Free Image to PDF Converter Online - Multi-Page | EasyTools',
    description:
      'Convert JPG, PNG, and WebP images into a clean, print-ready PDF document online. Runs 100% in your browser with zero server uploads.',
    h1: 'Free Online Image to PDF Converter',
  },
  'qr-code-generator': {
    title: 'Free Online QR Code Generator - PNG & SVG Export | EasyTools',
    description:
      'Create custom scannable QR codes for URLs, Wi-Fi, and text online. Download high-resolution PNG or SVG QR codes with zero tracking.',
    h1: 'Free Online QR Code Generator',
  },
  'password-generator': {
    title: 'Free Strong Password Generator Online - WebCrypto | EasyTools',
    description:
      'Generate secure random passwords and passphrases locally in your browser using Web Crypto API. Zero tracking, logging, or server storage.',
    h1: 'Free Online Strong Password Generator',
  },
  'word-counter': {
    title: 'Free Online Word & Character Counter Tool | EasyTools',
    description:
      'Count words, characters, sentences, reading time, and keyword density online. Instant browser-based text counter with complete privacy.',
    h1: 'Free Online Word & Character Counter',
  },
  'age-calculator': {
    title: 'Free Online Age Calculator - Exact Years & Days | EasyTools',
    description:
      'Calculate your exact age in years, months, weeks, and days plus your next birthday countdown. Fast, private online age calculator.',
    h1: 'Free Online Exact Age Calculator',
  },
  'color-picker': {
    title: 'Free Online Image Color Picker - HEX, RGB, HSL | EasyTools',
    description:
      'Pick colors from any image or palette online and get instant HEX, RGB, HSL, and CMYK codes. Runs locally in your browser with PNG export.',
    h1: 'Free Online Image Color Picker',
  },
  'unit-converter': {
    title: 'Free Online Unit Converter - Length, Weight & More | EasyTools',
    description:
      'Convert length, weight, temperature, area, speed, time, and storage units instantly online with comparison tables and CSV export.',
    h1: 'Free Online Universal Unit Converter',
  },
  'text-to-speech': {
    title: 'Free Online Text to Speech Reader - Natural Voices | EasyTools',
    description:
      'Listen to text read aloud online with customizable browser voices, pitch, and speed. Private client-side TTS reader with zero uploads.',
    h1: 'Free Online Text to Speech Reader',
  },
  'video-to-mp3': {
    title: 'Free Video to MP3 Converter Online - Browser Audio | EasyTools',
    description:
      'Extract audio from MP4, WebM, and MOV videos to MP3 directly inside your browser. No file uploads, fast local encoding, free download.',
    h1: 'Free Online Video to MP3 Converter',
  },
  'pdf-merge': {
    title: 'Free Online PDF Merger - Combine PDF Files Safely | EasyTools',
    description:
      'Merge and reorder multiple PDF files into one document online for free. Runs 100% locally in your browser so private PDFs stay safe.',
    h1: 'Free Online PDF Merger',
  },
  'video-compressor': {
    title: 'Free Online Video Compressor - Reduce Video Size | EasyTools',
    description:
      'Compress MP4 and WebM videos online by choosing resolution and bitrate presets. Browser-based video compressor with zero server uploads.',
    h1: 'Free Online Video Compressor',
  },
  'image-to-text': {
    title: 'Free Image to Text OCR Converter Online | EasyTools',
    description:
      'Extract editable text from screenshots, receipts, and scanned photos online using local browser OCR. Fast, accurate, and completely private.',
    h1: 'Free Online Image to Text (OCR) Extractor',
  },
  'pdf-compressor': {
    title: 'Free Online PDF Compressor - Reduce PDF File Size | EasyTools',
    description:
      'Compress large PDF documents online directly in your browser. Zero uploads, instant file size reduction, and no watermarks.',
    h1: 'Free Online PDF Compressor',
  },
};
