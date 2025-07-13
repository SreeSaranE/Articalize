export type Article = {
  id: string;
  title: string;
  author: string;
  summary: string;
  url: string;
};

export const sampleArticles: Article[] = [
  {
    id: '1',  
    title: 'The Rise of Artificial Intelligence',
    author: 'Jane Doe',
    summary: 'Artificial Intelligence is transforming industries.',
    url: 'https://www.example.com/article1'
  },
  {
    id: '2',
    title: 'Exploring the Universe',
    author: 'John Smith',
    summary: 'A journey through space and time.',
    url: 'https://www.example.com/article2'
  }
];
