export type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { article: Article };
  PrivacyPolicy: undefined;
  CollectionDetail: { collection: Collection };
  AddToCollection: { article: Article };
};

export type Article = {
  id: string;
  title: string;
  url: string;
  dateAdded: string;  // Changed from optional to required
  content: string;    // Changed from optional to required
  summary: string;    // Changed from optional to required
  excerpt: string;    // Changed from optional to required
};

export type Collection = {
  id: string;
  name: string;
  articles: Article[];
};

// Add this new type for your content extraction results
export type ArticleContent = {
  title: string;
  content: string;
  excerpt: string;
  summary: string;
};