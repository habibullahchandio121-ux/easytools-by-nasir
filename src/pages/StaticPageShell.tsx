import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Info,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { PageKey } from '../types/tool';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface StaticPageShellProps {
  page: Exclude<PageKey, 'home'>;
}

const CONTACT_EMAIL = 'habibullahchandio121@gmail.com';

const AboutPageContent: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            About Us - EasyTools By Nasir
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Free, fast, browser-based utilities from Karachi, Pakistan
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
        <p>
          EasyTools By Nasir was created by Nasir to provide free, fast and safe online tools for everyone. We offer 20 free tools including Image Compressor, BG Remover, PDF Merger, Video Compressor, Password Generator, QR Generator, and more.
        </p>
        <p>
          Our mission is simple: No signup, no watermark, no hidden charges. All tools work 100% in your browser, so your files stay private and safe. We are from Karachi, Pakistan and we are continuously adding new tools to help students, creators and business owners.
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center justify-between gap-6 rounded-xl border border-blue-900/40 bg-slate-900 p-6 text-white sm:flex-row">
        <div className="flex items-center gap-4">
          {!imgFailed ? (
            <img
              src="/assets/aistudio/nasir.jpg-compressed_619825a7.jpg"
              alt="Nasir"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-16 w-16 shrink-0 rounded-xl border border-blue-700/60 object-cover object-top"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-blue-700/60 bg-blue-950 font-display text-xl font-bold text-blue-300">
              N
            </div>
          )}
          <div>
            <p className="font-display text-base font-bold text-white">Created by Nasir</p>
            <p className="text-xs text-slate-300">Karachi, Pakistan</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </div>
        </div>

        <a
          href="/"
          className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 whitespace-nowrap"
        >
          Explore All 20 Tools
        </a>
      </div>
    </article>
  );
};

const PrivacyPolicyContent: React.FC = () => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Privacy Policy
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Last Updated: November 15, 2026
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Local Browser Processing
          </h2>
          <p>
            Your files never leave your device. All tools work locally in your browser. We do not upload, store, log or inspect your files on any server. We only save theme preference locally.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Advertising, Analytics &amp; Personal Data
          </h2>
          <p>
            We use Google AdSense. Google uses cookies to show personalized ads based on your visits. You can opt out from{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Google Ads Settings
            </a>
            . We use Google Analytics to see which tools are popular, this data is anonymous. We do not collect name, email or password to use tools. If you have questions contact us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </section>
      </div>
    </article>
  );
};

const ContactPageContent: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [mailtoHref, setMailtoHref] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = `EasyTools By Nasir Contact - ${name.trim()}`;
    const body = `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`;
    const url = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setMailtoHref(url);
    window.location.href = url;
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Contact Us
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            EasyTools By Nasir Support
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
        <p>
          Have a question, suggestion, or found a bug? We would love to hear from you.
        </p>

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Email:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
            We usually reply within 24-48 hours. Please do not share your personal passwords or sensitive documents with us.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Send a Message
        </h2>

        {mailtoHref && (
          <div className="flex flex-col gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 sm:text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Opening your email app to send your message...</span>
            </div>
            <p>
              If your email app did not open automatically,{' '}
              <a
                href={mailtoHref}
                className="font-semibold underline underline-offset-2"
              >
                click here to compose your email
              </a>
              .
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            rows={5}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your question, suggestion, or bug report..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <Send className="h-4 w-4" />
          <span>Open Email App &amp; Send</span>
        </button>
      </form>
    </article>
  );
};

const TermsPageContent: React.FC = () => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            Last Updated: November 15, 2026 · EasyTools By Nasir
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:text-base">
        <p>
          Welcome to EasyTools By Nasir. By accessing or using our website and browser utilities, you agree to the following Terms &amp; Conditions.
        </p>

        <section className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            1. Tools Provided Free &ldquo;As Is&rdquo;
          </h2>
          <p>
            Tools are provided free &ldquo;as is&rdquo; without warranties or guarantees of any kind, whether express or implied. While we strive for fast and accurate processing across all 20 browser tools, we do not guarantee uninterrupted availability or error-free output in every browser or device configuration.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            2. User Responsibility &amp; File Backups
          </h2>
          <p>
            User is responsible for keeping backup of their files. Because all tools run locally inside your browser without storing files on our servers, EasyTools By Nasir cannot recover lost, overwritten, or unsaved files. Always maintain copies of important original documents, images, videos, or audio files before editing or converting them.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            3. Acceptable &amp; Legal Use
          </h2>
          <p>
            Do not use tools for illegal work. You agree not to use EasyTools By Nasir to process, generate, distribute, or modify unlawful, infringing, harmful, or unauthorized content, or in any way that violates applicable local, national, or international laws.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            4. Contact
          </h2>
          <p>
            If you have any questions regarding these Terms &amp; Conditions, please contact us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
};

export const StaticPageShell: React.FC<StaticPageShellProps> = ({ page }) => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('toolbazaar-theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('toolbazaar-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('toolbazaar-theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        activePage={page}
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-5">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to All 20 Tools</span>
          </a>
        </div>

        {page === 'about' && <AboutPageContent />}
        {page === 'privacy' && <PrivacyPolicyContent />}
        {page === 'contact' && <ContactPageContent />}
        {page === 'terms' && <TermsPageContent />}
      </main>

      <Footer activePage={page} />
    </div>
  );
};
