import { SITE_NAME } from '../data/seoMeta';

interface ApplySeoOptions {
  title: string;
  description: string;
  url?: string;
  appName?: string;
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonicalLink(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertJsonLd(name: string, description: string, url: string) {
  const scriptId = 'easytools-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    description,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  });
}

export function applySeoMeta({ title, description, url, appName }: ApplySeoOptions) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const currentUrl =
    url || window.location.origin + window.location.pathname + window.location.search;

  document.title = title;

  upsertMetaTag('name', 'description', description);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:site_name', SITE_NAME);
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', description);
  upsertMetaTag('property', 'og:url', currentUrl);

  upsertMetaTag('name', 'twitter:card', 'summary_large_image');
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', description);

  upsertCanonicalLink(currentUrl);
  upsertJsonLd(appName || title, description, currentUrl);
}
