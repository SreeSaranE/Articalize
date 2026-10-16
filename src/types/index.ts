export interface ArticleSummary {
  bullets: string[];
  significance: string;
  model: string;
  at: string;
}

export interface Article {
  id: string;
  url: string;
  title: string;
  source: string;
  description?: string;
  author?: string;
  imageUrl?: string;
  publishedAt?: string;
  savedAt: string;
  // The extracted text is stored separately (see StorageService.getContent) so lists stay light.
  readMinutes: number;
  summary?: ArticleSummary;
  isRead: boolean;
  isBookmarked: boolean;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  articleIds: string[];
}

export interface AppSettings {
  geminiApiKey: string; // kept in SecureStore, not in the settings blob
  geminiModel: string;
  deleteOlderThanDays: number;
}

export const AVAILABLE_MODELS = [
  { label: 'Gemini 3.1 Flash Lite (Recommended)', value: 'gemini-3.1-flash-lite' },
  { label: 'Gemini 3.5 Flash Lite', value: 'gemini-3.5-flash-lite' },
];
