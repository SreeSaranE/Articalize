export type Article = {
  id: string;
  title: string;
  url: string;
  dateAdded?: string;
};

export const sampleArticles: Article[] = [
  {
    id: '1',  
    title: 'The Rise of Artificial Intelligence',
    url: 'https://www.example.com/article1'
  },
  {
    id: '2',
    title: 'Exploring the Universe',
    url: 'https://www.example.com/article2'
  }
];
