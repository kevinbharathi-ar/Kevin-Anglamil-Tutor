export enum AppTab {
  CHAT = 'CHAT',
  TRANSLATE = 'TRANSLATE',
  LEARN = 'LEARN',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isLoading?: boolean;
  isError?: boolean;
  tamilTranslation?: string; // Optional field for translated text
}

export interface TranslationResult {
  original: string;
  translated: string;
  pronunciation?: string; // Phonetic or explanation
  grammarNotes?: string;
}

export interface DailyWord {
  word: string;
  tamilMeaning: string;
  exampleSentence: string;
  exampleTamil: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  tamilMeaning: string;
  exampleSentence: string;
  exampleTamil: string;
}