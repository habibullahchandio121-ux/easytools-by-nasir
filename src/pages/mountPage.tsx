import { createRoot } from 'react-dom/client';
import '../index.css';
import type { PageKey } from '../types/tool';
import { StaticPageShell } from './StaticPageShell';

const rootEl = document.getElementById('root');
const pageAttr = rootEl?.dataset.page;
const validPages: Exclude<PageKey, 'home'>[] = ['about', 'privacy', 'contact', 'terms'];
const page: Exclude<PageKey, 'home'> = validPages.includes(
  pageAttr as Exclude<PageKey, 'home'>
)
  ? (pageAttr as Exclude<PageKey, 'home'>)
  : 'about';

if (rootEl) {
  createRoot(rootEl).render(<StaticPageShell page={page} />);
}
