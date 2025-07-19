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
  dateAdded?: string;
};

export type Collection = {
  id: string;
  name: string;
  articles: Article[];
};
