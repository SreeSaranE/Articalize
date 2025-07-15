export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  ArticleDetail: { article: Article };
  PrivacyPolicy: undefined;
};

export type Article = {
  id: string;
  title: string;
  url: string;
  dateAdded?: string;
};