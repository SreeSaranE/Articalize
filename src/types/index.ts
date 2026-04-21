export type Article = {
  id: string;
  url: string;
  title: string;
  summary: string;
  description: string;
  dateAdded: string;
};

export type Collection = {
  id: string;
  name: string;
  articleIds: string[];
};