import React from 'react';
import type { PageKey } from '../types/tool';

interface FooterProps {
  onGoHome?: () => void;
  activePage?: PageKey;
}

const FOOTER_LINKS: { key: Exclude<PageKey, 'home'>; label: string; href: string }[] = [
  { key: 'about', label: 'About', href: '/about.html' },
  { key: 'privacy', label: 'Privacy Policy', href: '/privacy-policy.html' },
  { key: 'contact', label: 'Contact', href: '/contact.html' },
  { key: 'terms', label: 'Terms & Conditions', href: '/terms.html' },
];

export const Footer: React.FC<FooterProps> = ({ onGoHome, activePage }) => {
  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      onGoHome &&
      (window.location.pathname === '/' || window.location.pathname === '/index.html')
    ) {
      e.preventDefault();
      onGoHome();
    }
  };

  return (
    <footer className="mt-14 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div>
          <a
            href="/"
            onClick={handleHomeClick}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Easy<span className="text-blue-600 dark:text-blue-400">Tools</span>{' '}
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              By Nasir
            </span>
          </a>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            18 browser-only utilities · Zero uploads to servers · © {new Date().getFullYear()} EasyTools By Nasir
          </p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {FOOTER_LINKS.map((link) => {
            const isActive = activePage === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors hover:text-blue-600 hover:underline underline-offset-4 dark:hover:text-blue-400 ${
                  isActive ? 'font-semibold text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
};
