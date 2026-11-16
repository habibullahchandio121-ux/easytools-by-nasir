import { useEffect, useMemo, useState } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { TOOLS, TOOL_CATEGORIES } from './data/tools';
import type { ToolCategory, ToolId } from './types/tool';
import { Header } from './components/Header';
import { AboutContactSection } from './components/AboutContactSection';
import { Footer } from './components/Footer';
import { ToolWorkspace } from './components/ToolWorkspace';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('toolbazaar-theme') === 'dark';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('All');
  const [activeToolId, setActiveToolId] = useState<ToolId | null>(null);

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

  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TOOLS.filter((tool) => {
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
      const matchesQuery =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const activeTool = useMemo(
    () => TOOLS.find((t) => t.id === activeToolId) || null,
    [activeToolId]
  );

  const handleOpenTool = (id: ToolId) => {
    setActiveToolId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setActiveToolId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onGoHome={handleGoHome}
        activePage="home"
      />

      <main className="flex-1 space-y-6 pt-5">
        {activeTool ? (
          <ToolWorkspace
            tool={activeTool}
            onBack={handleGoHome}
            onSelectTool={handleOpenTool}
          />
        ) : (
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            {/* Hero & Search Bar */}
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:px-10 sm:py-10">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {TOOLS.length} Free Browser Utilities · Zero Server Uploads
              </p>
              <h1
                className="mx-auto mt-2 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                style={{ textWrap: 'balance' }}
              >
                Every Everyday Tool in One Clean Workspace
              </h1>
              <p className="mx-auto mt-2.5 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
                Edit images, merge or compress PDFs, convert video to MP3, extract text, and run quick calculations directly in your browser.
              </p>

              {/* Prominent Top Search Bar */}
              <div className="mx-auto mt-6 max-w-xl">
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${TOOLS.length} tools (e.g. BG Remover, PDF Merge, Video to MP3)...`}
                    aria-label="Search tools"
                    className="min-h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pr-10 pl-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      className="absolute right-3 rounded-md p-1 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Controls */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
                {TOOL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* 20 Tools Grid */}
            <section aria-label="Available tools" className="mt-7">
              <div className="mb-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {activeCategory === 'All' ? 'All Tools' : activeCategory}
                </h2>
                <span className="font-mono tabular-nums">
                  {filteredTools.length} of {TOOLS.length} tools
                </span>
              </div>

              {filteredTools.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No tools matched &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Try clearing your search or switching back to All categories.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('All');
                    }}
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 dark:bg-blue-500"
                  >
                    Show All {TOOLS.length} Tools
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleOpenTool(tool.id)}
                        className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
                      >
                        <div>
                          <div className="mb-3.5 flex items-center justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/70 dark:text-blue-400 dark:group-hover:bg-blue-500 dark:group-hover:text-white">
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {tool.category}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {tool.name}
                          </h3>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                            {tool.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-85 transition-opacity group-hover:opacity-100 dark:text-blue-400">
                          <span>Open tool</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <AboutContactSection />
      </main>

      <Footer
        onGoHome={handleGoHome}
        activePage="home"
      />
    </div>
  );
}
