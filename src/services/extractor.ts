import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { Article } from '../types';
import { fetchTextWithTimeout } from './http';

export type Extracted = Omit<Article, 'id' | 'savedAt' | 'isRead' | 'isBookmarked' | 'summary'> & {
  content: string;
};

// Wikimedia blocks requests without a descriptive User-Agent (it answers 403).
const USER_AGENT = 'Articalize/1.0 (personal reading app; Expo/React Native)';
const API_HEADERS = { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT, Accept: 'application/json' };

const MAX_HTML_CHARS = 1_500_000;
// AsyncStorage is capped (~6MB on Android) and rewritten whole, so keep each article modest.
const MAX_CONTENT_CHARS = 30_000;

export function normalizeUrl(input: string): string | null {
  let text = input.trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  try {
    const u = new URL(text);
    if (!u.hostname.includes('.')) return null;
    // Android blocks plain-http requests in release builds, and tracking params defeat duplicate detection.
    if (u.protocol === 'http:') u.protocol = 'https:';
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_[ce]id$|ref$|ref_src$)/i.test(key)) u.searchParams.delete(key);
    }
    return u.toString();
  } catch {
    return null;
  }
}

export function extractUrlFromText(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/https?:\/\/[^\s"'<>]+/i);
  if (match) {
    const candidate = match[0].replace(/[)"'>}\].,;!]+$/, '');
    return normalizeUrl(candidate);
  }
  const words = raw.trim().split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/^[("'<{[]+/, '').replace(/[)"'>}\].,;!]+$/, '');
    const normalized = normalizeUrl(cleanWord);
    if (normalized) return normalized;
  }
  return null;
}

const readMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 220));
const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

// Wikipedia has a clean API, so use it instead of scraping the page.
async function fromWikipedia(url: URL, signal?: AbortSignal): Promise<Extracted | null> {
  const match = url.pathname.match(/^\/wiki\/(.+)$/);
  if (!match) return null;
  const title = decodeURIComponent(match[1]);
  const api = `https://${url.hostname}`;
  const [summaryRes, extractRes] = await Promise.all([
    fetchTextWithTimeout(`${api}/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
      headers: API_HEADERS,
      signal,
    }),
    fetchTextWithTimeout(
      `${api}/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`,
      { headers: API_HEADERS, signal }
    ),
  ]);
  if (!summaryRes.ok || !extractRes.ok) return null;
  const summary = JSON.parse(summaryRes.text);
  const pages = JSON.parse(extractRes.text)?.query?.pages ?? {};
  const extract: string = (Object.values(pages)[0] as { extract?: string })?.extract ?? '';
  const content = extract
    .replace(/\n=+\s*(.*?)\s*=+\n/g, '\n\n$1\n\n')
    .trim()
    .slice(0, MAX_CONTENT_CHARS);
  if (!content) return null;
  return {
    url: url.toString(),
    title: summary.title ?? title.replace(/_/g, ' '),
    source: 'Wikipedia',
    description: summary.description,
    imageUrl: summary.thumbnail?.source ?? summary.originalimage?.source,
    publishedAt: summary.timestamp,
    content,
    readMinutes: readMinutes(content),
  };
}

function meta(doc: Document, ...names: string[]): string | undefined {
  for (const name of names) {
    const el = doc.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    const value = el?.getAttribute('content');
    if (value && value.trim()) return clean(value);
  }
  return undefined;
}

const BLOCK_SELECTOR = 'p, h1, h2, h3, h4, li, blockquote, pre';

// Readability's HTML back to plain paragraphs.
function toParagraphs(html: string, fallback: string): string {
  try {
    const { document } = parseHTML(`<div>${html}</div>`);
    const parts: string[] = [];
    document.querySelectorAll(BLOCK_SELECTOR).forEach((el: Element) => {
      if (el.querySelector(BLOCK_SELECTOR)) return; // only leaf blocks
      const text = clean(el.textContent ?? '');
      if (text) parts.push(text);
    });
    if (parts.length) return parts.join('\n\n');
  } catch {
    // fall through
  }
  return fallback;
}

async function fromHtml(url: URL, signal?: AbortSignal): Promise<Extracted> {
  const res = await fetchTextWithTimeout(
    url.toString(),
    { headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': USER_AGENT }, signal },
    20000
  );
  if (!res.ok) throw new Error(`The site responded with status ${res.status}`);

  const { document } = parseHTML(res.text.slice(0, MAX_HTML_CHARS));

  // Metadata first: Readability mutates the document.
  const title =
    meta(document, 'og:title', 'twitter:title') ?? clean(document.querySelector('title')?.textContent ?? '');
  const source =
    meta(document, 'og:site_name', 'application-name') ?? url.hostname.replace(/^www\./, '');
  const description = meta(document, 'og:description', 'twitter:description', 'description');
  const author = meta(document, 'author', 'article:author', 'twitter:creator');
  const publishedAt = meta(document, 'article:published_time', 'date', 'og:article:published_time');
  const rawImage = meta(document, 'og:image', 'twitter:image');
  let imageUrl: string | undefined;
  try {
    imageUrl = rawImage ? new URL(rawImage, url).toString() : undefined;
  } catch {
    imageUrl = undefined;
  }

  let content = '';
  try {
    const parsed = new Readability(document as unknown as Document).parse();
    if (parsed) content = toParagraphs(parsed.content ?? '', clean(parsed.textContent ?? ''));
  } catch {
    // fall back below
  }
  if (!content) content = description ?? '';
  content = content.slice(0, MAX_CONTENT_CHARS);
  if (!title && !content) throw new Error('Could not read this page');

  return {
    url: url.toString(),
    title: title || url.hostname,
    source,
    description,
    author,
    imageUrl,
    publishedAt,
    content,
    readMinutes: readMinutes(content),
  };
}

export async function extractArticle(rawUrl: string, signal?: AbortSignal): Promise<Extracted> {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) throw new Error('That does not look like a valid link');
  const url = new URL(normalized);
  if (url.hostname.endsWith('wikipedia.org')) {
    try {
      const wiki = await fromWikipedia(url, signal);
      if (wiki) return wiki;
    } catch {
      if (signal?.aborted) throw new Error('Cancelled');
      // fall back to generic extraction
    }
  }
  return fromHtml(url, signal);
}
