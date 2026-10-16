import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppSettings, Article, AVAILABLE_MODELS, Collection } from '../types';

const KEYS = {
  ARTICLES: '@articalize_articles_v1',
  COLLECTIONS: '@articalize_collections_v1',
  SETTINGS: '@articalize_settings_v1',
  CONTENT: '@articalize_content_v1_', // + article id: one entry per article text
};
const API_KEY_STORE = 'gemini_api_key';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  geminiModel: AVAILABLE_MODELS[0].value,
  deleteOlderThanDays: 30,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const optText = (v: unknown) => (typeof v === 'string' && v ? v : undefined);

// Stored or imported data must always be safe to render: coerce every field, drop what is unusable.
export function sanitizeArticle(raw: unknown): Article | null {
  const a = raw as Partial<Article> | null;
  if (!a || typeof a !== 'object' || typeof a.id !== 'string' || typeof a.url !== 'string' || !a.id || !a.url) {
    return null;
  }
  const s = a.summary;
  const bullets = Array.isArray(s?.bullets) ? s.bullets.filter((b): b is string => typeof b === 'string' && !!b) : [];
  return {
    id: a.id,
    url: a.url,
    title: text(a.title) || a.url,
    source: text(a.source),
    description: optText(a.description),
    author: optText(a.author),
    imageUrl: optText(a.imageUrl),
    publishedAt: optText(a.publishedAt),
    savedAt: text(a.savedAt) || new Date(0).toISOString(),
    readMinutes: Number.isFinite(a.readMinutes) ? Math.max(1, Number(a.readMinutes)) : 1,
    summary:
      s && bullets.length
        ? { bullets, significance: text(s.significance), model: text(s.model), at: text(s.at) }
        : undefined,
    isRead: !!a.isRead,
    isBookmarked: !!a.isBookmarked,
  };
}

export function sanitizeCollection(raw: unknown): Collection | null {
  const c = raw as Partial<Collection> | null;
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id) return null;
  return {
    id: c.id,
    name: text(c.name) || 'Untitled',
    createdAt: text(c.createdAt) || new Date(0).toISOString(),
    articleIds: Array.isArray(c.articleIds) ? c.articleIds.filter((x): x is string => typeof x === 'string') : [],
  };
}

const sanitizeList = <T,>(raw: unknown, fn: (x: unknown) => T | null): T[] =>
  Array.isArray(raw) ? raw.map(fn).filter((x): x is T => x !== null) : [];

export const StorageService = {
  async getArticles(): Promise<Article[]> {
    const raw = await readJson<unknown>(KEYS.ARTICLES, []);
    const list: unknown[] = Array.isArray(raw) ? raw : [];
    const articles = sanitizeList(list, sanitizeArticle);

    // Migrate the first version, which kept every article's text inside the list.
    const legacy = list.filter(
      (r): r is { id: string; content: string } =>
        typeof (r as { id?: unknown })?.id === 'string' &&
        typeof (r as { content?: unknown })?.content === 'string' &&
        !!(r as { content: string }).content
    );
    if (legacy.length) {
      try {
        await AsyncStorage.multiSet(legacy.map(r => [KEYS.CONTENT + r.id, r.content] as [string, string]));
        await AsyncStorage.setItem(KEYS.ARTICLES, JSON.stringify(articles));
      } catch {
        // keep the old blob; migration is retried on the next launch
      }
    }
    return articles;
  },
  getCollections: async () => sanitizeList(await readJson<unknown>(KEYS.COLLECTIONS, []), sanitizeCollection),

  async getContent(id: string): Promise<string> {
    try {
      return (await AsyncStorage.getItem(KEYS.CONTENT + id)) ?? '';
    } catch {
      return '';
    }
  },
  async getContents(ids: string[]): Promise<Record<string, string>> {
    try {
      const pairs = await AsyncStorage.multiGet(ids.map(id => KEYS.CONTENT + id));
      return Object.fromEntries(pairs.map(([k, v]) => [k.slice(KEYS.CONTENT.length), v ?? '']));
    } catch {
      return {};
    }
  },
  async saveContents(entries: Record<string, string>) {
    const pairs = Object.entries(entries).filter(([, v]) => v);
    if (pairs.length) await AsyncStorage.multiSet(pairs.map(([id, v]) => [KEYS.CONTENT + id, v] as [string, string]));
  },
  async removeContents(ids: string[]) {
    if (ids.length) await AsyncStorage.multiRemove(ids.map(id => KEYS.CONTENT + id));
  },

  async saveArticles(articles: Article[]) {
    await AsyncStorage.setItem(KEYS.ARTICLES, JSON.stringify(articles));
  },
  async saveCollections(collections: Collection[]) {
    await AsyncStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
  },

  // The API key lives in the platform keystore, the rest in AsyncStorage.
  async getSettings(): Promise<AppSettings> {
    const stored = await readJson<Partial<AppSettings>>(KEYS.SETTINGS, {});
    const apiKey = (await SecureStore.getItemAsync(API_KEY_STORE).catch(() => null)) ?? '';
    const settings = { ...DEFAULT_SETTINGS, ...stored, geminiApiKey: apiKey };
    if (!AVAILABLE_MODELS.some(m => m.value === settings.geminiModel)) {
      settings.geminiModel = DEFAULT_SETTINGS.geminiModel;
    }
    return settings;
  },
  async saveSettings(settings: AppSettings) {
    const { geminiApiKey, ...rest } = settings;
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(rest));
    try {
      if (geminiApiKey) await SecureStore.setItemAsync(API_KEY_STORE, geminiApiKey);
      else await SecureStore.deleteItemAsync(API_KEY_STORE);
    } catch {
      // keystore unavailable: the key just isn't persisted
    }
  },

  async clearAll() {
    const keys = (await AsyncStorage.getAllKeys()).filter(k => k.startsWith(KEYS.CONTENT));
    await AsyncStorage.multiRemove([KEYS.ARTICLES, KEYS.COLLECTIONS, ...keys]);
  },
};
