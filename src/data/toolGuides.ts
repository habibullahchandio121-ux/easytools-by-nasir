import type { ToolId } from '../types/tool';

export interface ToolGuide {
  howToUse: string[];
  keyBenefits: string;
}

export const TOOL_GUIDES: Record<ToolId, ToolGuide> = {
  'bg-remover': {
    howToUse: [
      'Upload your photo (JPG, PNG, or WebP) using drag-and-drop or the file picker.',
      'Wait a few moments while the browser-based AI segmentation isolates the foreground subject and removes the background.',
      'Inspect the transparent checkerboard preview, or optionally switch to Solid Color mode if you need simple uniform background cleanup.',
      'Click Download Transparent PNG to save your cutout image ready for thumbnails, product listings, or designs.',
    ],
    keyBenefits:
      'BG Remover runs directly inside your browser using client-side AI segmentation, meaning your personal photos and product shots are never uploaded to or stored on external servers. You get clean transparent PNG cutouts with no watermarks, no account signup, and zero per-image fees. Because everything executes locally on your device, your workflow stays fast, private, and safe for sensitive portraits or client assets.',
  },
  'image-compressor': {
    howToUse: [
      'Select or drop any image file into the uploader to view its original dimensions and file size.',
      'Choose your preferred output format (JPEG or WebP) and adjust the quality slider to balance clarity and compression.',
      'Preview the live compressed result alongside the exact percentage of file size saved.',
      'Click Download Compressed Image to save the optimized photo to your device.',
    ],
    keyBenefits:
      'Image Compressor shrinks heavy photos right inside your browser memory without sending a single byte to remote servers. Lighter images help websites load faster, improve SEO rankings, and make email or messaging attachments effortless while keeping visual details sharp. With zero file uploads, unlimited free usage, and instant side-by-side size comparison, it is the safest way to optimize personal and business photos.',
  },
  'image-resizer': {
    howToUse: [
      'Upload the image you want to resize from your computer or mobile gallery.',
      'Enter custom width and height pixel values or choose a percentage scale, keeping Aspect Ratio Lock enabled to avoid stretching.',
      'Review the updated output dimensions and live canvas preview.',
      'Click Download Resized Image to export your picture in crisp quality.',
    ],
    keyBenefits:
      'Image Resizer lets you tailor photos for social media posts, website banners, ID portals, and print templates completely offline inside your browser. Your original images stay strictly on your device with zero server uploads, protecting personal privacy and proprietary brand graphics. Instant dimension updates and aspect-ratio locking eliminate guesswork and save time across any screen size.',
  },
  'jpg-to-png': {
    howToUse: [
      'Upload a JPG, JPEG, or WebP image using the drop zone.',
      'Verify the converted image dimensions and preview rendered directly in your browser.',
      'Click Download PNG to save a lossless PNG copy immediately.',
    ],
    keyBenefits:
      'JPG to PNG Converter transforms compressed photographs and WebP assets into lossless PNG files using native HTML5 Canvas processing. Because no remote conversion server is involved, your files remain completely private on your device with zero risk of data retention or third-party leaks. It works in seconds without software installation, watermarks, or daily file limits.',
  },
  'image-enhancer': {
    howToUse: [
      'Upload any dark, dull, or low-contrast photo into the workspace.',
      'Click Auto-Enhance or fine-tune brightness, contrast, saturation, warmth, and sharpness sliders.',
      'Compare the enhanced preview with your original image in real time.',
      'Click Download Enhanced Image to save the polished photo to your device.',
    ],
    keyBenefits:
      'Image Enhancer brings one-click lighting and color correction directly to your browser without requiring heavy desktop software or cloud photo editors. Every pixel adjustment is calculated locally on your device, keeping private family memories and client photography completely confidential. Fast real-time previews help students, creators, and sellers fix lighting issues in seconds.',
  },
  'image-to-pdf': {
    howToUse: [
      'Upload one or multiple images (JPG, PNG, or WebP) that you want to combine into a PDF.',
      'Arrange the page order and choose your preferred page size and orientation.',
      'Generate the document preview inside your browser.',
      'Click Download PDF to save your multi-page, print-ready PDF file.',
    ],
    keyBenefits:
      'Image to PDF converts receipts, handwritten notes, scanned IDs, and photo portfolios into clean PDF documents without uploading sensitive paperwork to the cloud. Processing runs entirely in browser memory, ensuring confidential financial, academic, or personal documents never leave your device. You get instant, watermark-free PDFs ready for printing, sharing, or official submissions.',
  },
  'qr-code-generator': {
    howToUse: [
      'Type or paste any website URL, Wi-Fi text, contact note, or upload a plain text file.',
      'Customize the foreground color, background color, and QR code size to match your branding.',
      'Verify the live scannable QR preview on screen.',
      'Download your code as a crisp PNG image or scalable SVG vector file.',
    ],
    keyBenefits:
      'QR Code Generator builds clean, high-contrast QR codes locally using client-side encoding with zero server tracking or redirect links. Your URLs and text never pass through third-party databases, so generated codes never expire and never inject unwanted tracking redirects. Free PNG and SVG exports make it ideal for menus, flyers, business cards, and classroom handouts.',
  },
  'password-generator': {
    howToUse: [
      'Choose your desired password length and toggle uppercase, lowercase, numbers, and symbol character sets.',
      'Optionally switch to passphrase mode or generate multiple passwords at once.',
      'Check the strength indicator and click Generate to create fresh random credentials.',
      'Copy a password to your clipboard or download the generated list as a text file.',
    ],
    keyBenefits:
      'Password Generator uses your browser’s built-in Web Crypto API (cryptographically secure randomness) to create strong passwords entirely offline on your device. Because passwords are never transmitted over the internet or logged on any server, your account security stays strictly in your own hands. Instant customization helps protect emails, banking logins, and developer accounts from brute-force attacks.',
  },
  'word-counter': {
    howToUse: [
      'Paste your article, essay, or caption into the text box, or upload a TXT, Markdown, or CSV file.',
      'View live counts for words, characters (with and without spaces), sentences, paragraphs, and estimated reading time.',
      'Inspect the top keyword frequency table to review word repetition and SEO balance.',
      'Copy the summary or download a clean text report for your records.',
    ],
    keyBenefits:
      'Word Counter analyzes drafts, homework essays, blog posts, and ad copy instantly in your browser without storing confidential writing on remote servers. Writers, students, and marketers can track character limits and keyword density in real time while keeping unpublished manuscripts 100% private. Zero page reloads and instant stats make editing faster and smoother on any device.',
  },
  'age-calculator': {
    howToUse: [
      'Select your Date of Birth using the date picker.',
      'Optionally adjust the "Calculate Age As Of" target date (defaults to today).',
      'View your exact chronological age in years, months, and days, along with total weeks, days lived, and next birthday countdown.',
      'Copy or download the summary card whenever you need it for forms or records.',
    ],
    keyBenefits:
      'Age Calculator delivers accurate chronological age calculations and milestone counts completely inside your browser with zero personal data collection. Dates you enter stay on your screen and are never saved to any database, making it safe for official applications, school forms, and birthday planning. Fast instant math handles leap years and varying month lengths automatically.',
  },
  'color-picker': {
    howToUse: [
      'Use the interactive color wheel/picker or upload an image to sample colors directly from any pixel.',
      'Click anywhere on your uploaded photo to inspect exact shades and build a palette.',
      'View instant conversions in HEX, RGB, HSL, and CMYK formats.',
      'Copy any color code with one click or download your sampled color palette as a PNG.',
    ],
    keyBenefits:
      'Color Picker helps web designers, developers, and artists extract accurate HEX, RGB, HSL, and CMYK values directly from local photos without uploading design mockups online. Everything happens locally on an HTML5 Canvas, protecting unreleased client artwork and brand assets. Instant multi-format codes and exportable palette swatches speed up CSS styling and graphic design.',
  },
  'unit-converter': {
    howToUse: [
      'Select the measurement category you need, such as Length, Weight, Temperature, Area, Speed, Time, or Digital Storage.',
      'Enter the numeric value and choose your source ("From") and target ("To") units.',
      'Read the instant converted result along with a full comparison table across related units.',
      'Copy the result or export the conversion table as a CSV file.',
    ],
    keyBenefits:
      'Unit Converter handles everyday science, cooking, engineering, travel, and file-size conversions immediately inside your browser without ads cluttering the math or network lag. No values are sent to a backend server, and the full reference table lets you compare multiple units at once. Mobile-friendly controls and CSV export make it handy for students, technicians, and shoppers.',
  },
  'text-to-speech': {
    howToUse: [
      'Type or paste text into the editor, or upload a TXT or Markdown document.',
      'Pick a preferred voice from your browser and operating system’s available voice list.',
      'Adjust speaking speed (rate) and pitch sliders to customize how the audio sounds.',
      'Click Speak to listen right away, and pause, resume, or download your script anytime.',
    ],
    keyBenefits:
      'Text to Speech uses your browser’s native Web Speech API to read notes, study guides, and proofread drafts aloud without transmitting private text to external cloud voice servers. Listening to your writing helps catch awkward phrasing, supports accessibility, and turns reading material into hands-free audio. It works instantly with zero usage caps, subscriptions, or server delays.',
  },
  'video-to-mp3': {
    howToUse: [
      'Upload a video file (MP4, WebM, MOV, or other browser-supported format) into the workspace.',
      'Let the tool decode the audio track and encode it directly into an MP3 file in your browser.',
      'Listen to the extracted audio using the built-in preview player.',
      'Click Download MP3 to save the clean audio file to your device.',
    ],
    keyBenefits:
      'Video to MP3 extracts soundtracks, lectures, podcasts, and voice recordings straight into MP3 format locally without uploading gigabytes of video to slow external servers. Keeping processing inside your browser saves mobile data, protects private recordings, and avoids server queues or file-size paywalls. Clean audio playback and instant MP3 download make it ideal for creators and students.',
  },
  'pdf-merge': {
    howToUse: [
      'Select or drop two or more PDF files into the merge list.',
      'Reorder the documents using the up and down controls to set the exact page sequence.',
      'Click Merge PDFs to combine all pages into a single unified file in browser memory.',
      'Click Download Merged PDF to save the final combined document.',
    ],
    keyBenefits:
      'PDF Merge joins contracts, invoices, academic assignments, and scanned forms locally using client-side PDF assembly, so confidential documents never touch third-party servers. Unlike cloud PDF sites that limit free merges or store uploads temporarily, everything happens safely inside your own browser tab. You get unlimited merges with crisp original formatting and zero watermarks.',
  },
  'video-compressor': {
    howToUse: [
      'Upload a video file you want to shrink for sharing or storage.',
      'Select a target resolution preset and bitrate quality level based on your desired file size.',
      'Click Compress Video and monitor progress as your browser re-encodes the clip.',
      'Preview the compressed video and click Download to save the smaller file.',
    ],
    keyBenefits:
      'Video Compressor reduces oversized video files directly inside your browser, saving you from uploading large clips over slow internet connections to unknown cloud servers. Your personal videos and client footage remain completely private on your device from start to finish. Flexible resolution and bitrate options make it easy to fit email limits, messaging apps, and web uploads.',
  },
  'image-to-text': {
    howToUse: [
      'Upload a screenshot, scanned page, receipt, or photo containing printed text.',
      'Choose the text language if needed and start local OCR recognition.',
      'Wait while the browser engine reads the image and displays the editable extracted text.',
      'Copy the extracted text to your clipboard or download it as a TXT file.',
    ],
    keyBenefits:
      'Image to Text extracts editable text from screenshots, documents, and photos using client-side Optical Character Recognition (OCR) without sending private scans to remote servers. Keeping OCR local ensures invoices, IDs, and study notes stay strictly confidential on your device. It saves hours of manual retyping for students, researchers, and office workflows with zero signups required.',
  },
  'pdf-compressor': {
    howToUse: [
      'Upload the PDF document you need to make smaller for email or portal uploads.',
      'Select a compression level (balanced, high compression, or high clarity) to fit your needs.',
      'Click Compress PDF to optimize pages directly inside your browser.',
      'Compare the original vs. compressed size and click Download Compressed PDF.',
    ],
    keyBenefits:
      'PDF Compressor shrinks bulky PDF documents directly in browser memory so sensitive resumes, bank statements, and legal paperwork never leave your computer or phone. Zero server uploads mean complete data privacy, instant turnaround without queue delays, and no watermarks or page restrictions. Clear before-and-after file size stats help you hit strict upload limits effortlessly.',
  },
};
