import React, { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import type { PageKey } from '../types/tool';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onGoHome?: () => void;
  activePage?: PageKey;
}

const NAV_LINKS: { key: PageKey; label: string; href: string }[] = [
  { key: 'home', label: 'All Tools', href: '/' },
  { key: 'about', label: 'About', href: '/about.html' },
  { key: 'privacy', label: 'Privacy Policy', href: '/privacy-policy.html' },
  { key: 'contact', label: 'Contact', href: '/contact.html' },
  { key: 'terms', label: 'Terms', href: '/terms.html' },
];

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onGoHome,
  activePage = 'home',
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onGoHome && window.location.pathname === '/') {
      e.preventDefault();
      onGoHome();
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <a
          href="/"
          onClick={handleHomeClick}
          className="flex flex-col items-start text-left whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-md group"
        >
          <span className="font-display text-xl font-bold leading-none tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            Easy<span className="text-blue-600 dark:text-blue-400">Tools</span>
          </span>
          <span className="mt-0.5 text-[11px] font-semibold leading-none tracking-wide text-slate-500 dark:text-slate-400">
            By Nasir
          </span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {NAV_LINKS.map((link) => {
            const isActive = activePage === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                onClick={link.key === 'home' ? handleHomeClick : undefined}
                aria-current={isActive ? 'page' : undefined}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 hover:underline underline-offset-4 dark:hover:text-blue-400 ${
                  isActive
                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                    : ''
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 whitespace-nowrap shrink-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-800 dark:hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            {darkMode ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-blue-600" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = activePage === link.key;
              return (
                <a
                  key={link.key}
                  href={link.href}
                  onClick={link.key === 'home' ? handleHomeClick : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};
