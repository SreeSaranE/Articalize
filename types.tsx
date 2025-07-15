export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  ArticleDetail: { article: Article };
  PrivacyPolicy: undefined;
  CollectionDetail: { collection: Collection };
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
