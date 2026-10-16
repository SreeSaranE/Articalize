import { Alert } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppSettings, Article, Collection } from '../types';
import { DEFAULT_SETTINGS, sanitizeArticle, sanitizeCollection, StorageService } from '../services/storage';
import { extractArticle, normalizeUrl } from '../services/extractor';
import { GeminiService } from '../services/gemini';

interface Library {
  ready: boolean;
  articles: Article[]; // newest first
  collections: Collection[];
  settings: AppSettings;

  addArticle: (url: string, signal?: AbortSignal) => Promise<Article>;
  updateArticle: (id: string, patch: Partial<Article>) => void;
  toggleBookmark: (id: string) => void;
  toggleRead: (id: string) => void;
  deleteArticle: (id: string) => void;
  summarize: (id: string) => Promise<void>;

  createCollection: (name: string) => Collection;
  renameCollection: (id: string, name: string) => void;
  deleteCollection: (id: string) => void;
  setArticleCollections: (articleId: string, collectionIds: string[]) => void;
  removeFromCollection: (collectionId: string, articleIds: string[]) => void;

  saveSettings: (settings: AppSettings) => Promise<void>;
  deleteOlderThan: (days: number) => number;
  clearAll: () => Promise<void>;
  exportJson: () => Promise<string>;
  importJson: (json: string) => Promise<number>;
}

const LibraryContext = createContext<Library | null>(null);

export const useLibrary = (): Library => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside LibraryProvider');
  return ctx;
};

// Persisting is fire-and-forget; tell the user once if it keeps failing (e.g. storage full).
let warnedAboutStorage = false;
const reportSaveFailure = () => {
  if (warnedAboutStorage) return;
  warnedAboutStorage = true;
  Alert.alert(
    'Could not save changes',
    'Your device storage may be full. Recent changes might be lost when the app closes. Try deleting old articles in Settings > Data.'
  );
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Latest values for use inside async callbacks and for persisting.
  const articlesRef = useRef(articles);
  const collectionsRef = useRef(collections);
  const settingsRef = useRef(settings);
  // Resolves once saved data is loaded, so an early action can never overwrite it with an empty list.
  const loaded = useRef<Promise<void>>(Promise.resolve());
  const inFlight = useRef(new Map<string, Promise<void>>());

  const commitArticles = useCallback((next: Article[]) => {
    articlesRef.current = next;
    setArticles(next);
    StorageService.saveArticles(next).catch(reportSaveFailure);
  }, []);
  const commitCollections = useCallback((next: Collection[]) => {
    collectionsRef.current = next;
    setCollections(next);
    StorageService.saveCollections(next).catch(reportSaveFailure);
  }, []);

  useEffect(() => {
    loaded.current = (async () => {
      const [a, c, s] = await Promise.all([
        StorageService.getArticles(),
        StorageService.getCollections(),
        StorageService.getSettings(),
      ]);
      articlesRef.current = a;
      collectionsRef.current = c;
      settingsRef.current = s;
      setArticles(a);
      setCollections(c);
      setSettings(s);
      setReady(true);
    })();
    loaded.current.catch(() => setReady(true));
  }, []);

  const updateArticle = useCallback(
    (id: string, patch: Partial<Article>) =>
      commitArticles(articlesRef.current.map(a => (a.id === id ? { ...a, ...patch } : a))),
    [commitArticles]
  );

  const addArticle = useCallback(
    async (rawUrl: string, signal?: AbortSignal) => {
      await loaded.current;
      const normalized = normalizeUrl(rawUrl);
      if (!normalized) throw new Error('That does not look like a valid link');
      if (articlesRef.current.some(a => a.url === normalized)) throw new Error('This article is already saved');
      const { content, ...extracted } = await extractArticle(normalized, signal);
      if (signal?.aborted) throw new Error('Cancelled');
      if (articlesRef.current.some(a => a.url === extracted.url)) throw new Error('This article is already saved');
      const article: Article = {
        ...extracted,
        id: newId(),
        savedAt: new Date().toISOString(),
        isRead: false,
        isBookmarked: false,
      };
      try {
        await StorageService.saveContents({ [article.id]: content });
      } catch {
        throw new Error('Could not save: device storage may be full');
      }
      commitArticles([article, ...articlesRef.current]);
      return article;
    },
    [commitArticles]
  );

  const toggleBookmark = useCallback(
    (id: string) => {
      const a = articlesRef.current.find(x => x.id === id);
      if (a) updateArticle(id, { isBookmarked: !a.isBookmarked });
    },
    [updateArticle]
  );
  const toggleRead = useCallback(
    (id: string) => {
      const a = articlesRef.current.find(x => x.id === id);
      if (a) updateArticle(id, { isRead: !a.isRead });
    },
    [updateArticle]
  );

  const deleteArticle = useCallback(
    (id: string) => {
      commitArticles(articlesRef.current.filter(a => a.id !== id));
      commitCollections(
        collectionsRef.current.map(c => ({ ...c, articleIds: c.articleIds.filter(x => x !== id) }))
      );
      StorageService.removeContents([id]).catch(() => undefined);
    },
    [commitArticles, commitCollections]
  );

  const summarize = useCallback(
    async (id: string) => {
      const article = articlesRef.current.find(a => a.id === id);
      if (!article) return;
      // A second request for the same article waits for the first instead of being dropped.
      const pending = inFlight.current.get(id);
      if (pending) return pending;
      const { geminiApiKey, geminiModel } = settingsRef.current;
      if (!geminiApiKey) throw new Error('Add your Gemini API key in Settings first');
      const run = StorageService.getContent(id)
        .then(content => GeminiService.summarize(article, content, geminiApiKey, geminiModel))
        .then(summary => updateArticle(id, { summary }))
        .finally(() => inFlight.current.delete(id));
      inFlight.current.set(id, run);
      return run;
    },
    [updateArticle]
  );

  const createCollection = useCallback(
    (name: string) => {
      const collection: Collection = {
        id: newId(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        articleIds: [],
      };
      commitCollections([collection, ...collectionsRef.current]);
      return collection;
    },
    [commitCollections]
  );
  const renameCollection = useCallback(
    (id: string, name: string) =>
      commitCollections(collectionsRef.current.map(c => (c.id === id ? { ...c, name: name.trim() } : c))),
    [commitCollections]
  );
  const deleteCollection = useCallback(
    (id: string) => commitCollections(collectionsRef.current.filter(c => c.id !== id)),
    [commitCollections]
  );
  const setArticleCollections = useCallback(
    (articleId: string, collectionIds: string[]) =>
      commitCollections(
        collectionsRef.current.map(c => {
          const has = c.articleIds.includes(articleId);
          const want = collectionIds.includes(c.id);
          if (has === want) return c;
          return {
            ...c,
            articleIds: want ? [articleId, ...c.articleIds] : c.articleIds.filter(x => x !== articleId),
          };
        })
      ),
    [commitCollections]
  );
  const removeFromCollection = useCallback(
    (collectionId: string, articleIds: string[]) =>
      commitCollections(
        collectionsRef.current.map(c =>
          c.id === collectionId ? { ...c, articleIds: c.articleIds.filter(x => !articleIds.includes(x)) } : c
        )
      ),
    [commitCollections]
  );

  const saveSettings = useCallback(async (next: AppSettings) => {
    settingsRef.current = next;
    setSettings(next);
    await StorageService.saveSettings(next);
  }, []);

  const deleteOlderThan = useCallback(
    (days: number) => {
      const cutoff = Date.now() - days * 86_400_000;
      const stale = articlesRef.current.filter(
        a => !a.isBookmarked && new Date(a.savedAt).getTime() < cutoff
      );
      if (stale.length === 0) return 0;
      const ids = new Set(stale.map(a => a.id));
      commitArticles(articlesRef.current.filter(a => !ids.has(a.id)));
      commitCollections(
        collectionsRef.current.map(c => ({ ...c, articleIds: c.articleIds.filter(x => !ids.has(x)) }))
      );
      StorageService.removeContents([...ids]).catch(() => undefined);
      return stale.length;
    },
    [commitArticles, commitCollections]
  );

  const clearAll = useCallback(async () => {
    articlesRef.current = [];
    collectionsRef.current = [];
    setArticles([]);
    setCollections([]);
    await StorageService.clearAll();
  }, []);

  const exportJson = useCallback(async () => {
    const contents = await StorageService.getContents(articlesRef.current.map(a => a.id));
    return JSON.stringify({
      app: 'articalize',
      version: 1,
      articles: articlesRef.current.map(a => ({ ...a, content: contents[a.id] ?? '' })),
      collections: collectionsRef.current,
    });
  }, []);

  // Merges: existing items win, so importing never overwrites local changes.
  const importJson = useCallback(
    async (json: string) => {
      await loaded.current;
      const data = JSON.parse(json);
      if (data?.app !== 'articalize' || !Array.isArray(data.articles)) {
        throw new Error('This is not an Articalize export');
      }
      const known = new Set(articlesRef.current.map(a => a.id));
      const incoming: Article[] = [];
      const incomingContent: Record<string, string> = {};
      for (const raw of data.articles) {
        const a = sanitizeArticle(raw);
        if (a && !known.has(a.id)) {
          known.add(a.id);
          incoming.push(a);
          const text = (raw as { content?: unknown }).content;
          if (typeof text === 'string') incomingContent[a.id] = text.slice(0, 30_000);
        }
      }
      await StorageService.saveContents(incomingContent);
      commitArticles(
        [...articlesRef.current, ...incoming].sort((x, y) => y.savedAt.localeCompare(x.savedAt))
      );
      const knownCollections = new Set(collectionsRef.current.map(c => c.id));
      const incomingCollections: Collection[] = [];
      for (const raw of Array.isArray(data.collections) ? data.collections : []) {
        const c = sanitizeCollection(raw);
        if (c && !knownCollections.has(c.id)) {
          knownCollections.add(c.id);
          incomingCollections.push(c);
        }
      }
      commitCollections([...collectionsRef.current, ...incomingCollections]);
      return incoming.length;
    },
    [commitArticles, commitCollections]
  );

  const value = useMemo<Library>(
    () => ({
      ready,
      articles,
      collections,
      settings,
      addArticle,
      updateArticle,
      toggleBookmark,
      toggleRead,
      deleteArticle,
      summarize,
      createCollection,
      renameCollection,
      deleteCollection,
      setArticleCollections,
      removeFromCollection,
      saveSettings,
      deleteOlderThan,
      clearAll,
      exportJson,
      importJson,
    }),
    [
      ready, articles, collections, settings, addArticle, updateArticle, toggleBookmark, toggleRead,
      deleteArticle, summarize, createCollection, renameCollection, deleteCollection,
      setArticleCollections, removeFromCollection, saveSettings, deleteOlderThan, clearAll,
      exportJson, importJson,
    ]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
