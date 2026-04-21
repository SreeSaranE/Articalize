import AsyncStorage from '@react-native-async-storage/async-storage';
import { Article, Collection } from '../types';

const AKEY = 'ARTICLES';
const CKEY = 'COLLECTIONS';

export async function getArticles(): Promise<Article[]> {
  const raw = await AsyncStorage.getItem(AKEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveArticles(data: Article[]) {
  await AsyncStorage.setItem(AKEY, JSON.stringify(data));
}

export async function addArticle(article: Article) {
  const current = await getArticles();
  await saveArticles([article, ...current]);
}

export async function getCollections(): Promise<Collection[]> {
  const raw = await AsyncStorage.getItem(CKEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCollections(data: Collection[]) {
  await AsyncStorage.setItem(CKEY, JSON.stringify(data));
}

export async function addCollection(name: string) {
  const current = await getCollections();

  const item: Collection = {
    id: Date.now().toString(),
    name,
    articleIds: []
  };

  await saveCollections([item, ...current]);
}

export async function deleteCollection(id: string) {
  const current = await getCollections();
  await saveCollections(current.filter(x => x.id !== id));
}

export async function addArticleToCollection(
  articleId: string,
  collectionId: string
) {
  const current = await getCollections();

  const updated = current.map(c => {
    if (c.id !== collectionId) return c;

    if (c.articleIds.includes(articleId)) return c;

    return {
      ...c,
      articleIds: [...c.articleIds, articleId]
    };
  });

  await saveCollections(updated);
}

export async function removeArticleFromCollection(
  articleId: string,
  collectionId: string
) {
  const current = await getCollections();

  const updated = current.map(c => {
    if (c.id !== collectionId) return c;

    return {
      ...c,
      articleIds: c.articleIds.filter(id => id !== articleId)
    };
  });

  await saveCollections(updated);
}

export async function deleteArticle(id: string) {
  const current = await getArticles();

  await saveArticles(
    current.filter(a => a.id !== id)
  );
}