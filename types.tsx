export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  ArticleDetail: { article: { title: string; url: string, id?: string, dateAdded?: string } };
  PrivacyPolicy: undefined;
};

export type Article = {
  id: string;
  title: string;
  url: string;
  dateAdded?: string;
};