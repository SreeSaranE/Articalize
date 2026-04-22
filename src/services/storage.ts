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
  const all = await getArticles();
  await saveArticles([article, ...all]);
}

export async function deleteArticle(id: string) {
  const all = await getArticles();
  await saveArticles(all.filter(x => x.id !== id));
}

export async function getCollections(): Promise<Collection[]> {
  const raw = await AsyncStorage.getItem(CKEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveCollections(data: Collection[]) {
  await AsyncStorage.setItem(CKEY, JSON.stringify(data));
}

export async function addCollection(name: string) {
  const all = await getCollections();

  const item: Collection = {
    id: Date.now().toString(),
    name,
    articleIds: []
  };

  await saveCollections([item, ...all]);
}

export async function deleteCollection(id: string) {
  const all = await getCollections();
  await saveCollections(all.filter(x => x.id !== id));
}

export async function addArticleToCollection(
  articleId: string,
  collectionId: string
) {
  const all = await getCollections();

  const updated = all.map(c =>
    c.id === collectionId &&
    !c.articleIds.includes(articleId)
      ? {
          ...c,
          articleIds: [...c.articleIds, articleId]
        }
      : c
  );

  await saveCollections(updated);
}