import React, { useState } from 'react';
import { Mail } from 'lucide-react';

export const AboutContactSection: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <section
      id="about-contact"
      aria-label="About and Contact"
      className="mx-auto w-full max-w-6xl px-4 sm:px-6"
    >
      <div className="flex flex-col items-center justify-between gap-8 rounded-2xl border border-blue-900/40 bg-slate-900 px-6 py-8 text-white shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:px-10">
        <div className="max-w-xl text-center md:text-left">
          <p className="text-xs font-semibold text-blue-400">About &amp; Contact</p>
          <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white">
            Built for Fast, Private Everyday Work
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">
            EasyTools By Nasir was created by Nasir in Karachi, Pakistan to bring 18 essential image, PDF, audio, video, and text utilities into a single browser-only workspace. Everything runs locally on your device without uploading your files to external servers.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Have a question, suggestion, or found a bug? Reach out anytime by email or visit our{' '}
            <a href="/about.html" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              About Us
            </a>{' '}
            and{' '}
            <a href="/contact.html" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              Contact Us
            </a>{' '}
            pages.
          </p>
        </div>

        <div className="flex w-full max-w-[290px] shrink-0 flex-col items-center rounded-xl border border-blue-800/50 bg-slate-950/70 p-5 text-center">
          {!imgFailed ? (
            <img
              src="/assets/aistudio/nasir.jpg-compressed_619825a7.jpg"
              alt="Nasir"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-24 w-24 rounded-xl border border-blue-700/60 object-cover object-top"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-blue-700/60 bg-blue-950 font-display text-2xl font-bold text-blue-300">
              N
            </div>
          )}

          <p className="mt-3 font-display text-sm font-bold text-white">
            Created by Nasir
          </p>

          <a
            href="mailto:habibullahchandio121@gmail.com"
            className="mt-3 inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">habibullahchandio121@gmail.com</span>
          </a>
        </div>
      </div>
    </section>
  );
};
