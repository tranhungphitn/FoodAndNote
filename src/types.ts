export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
  isPinned: boolean;
}

export interface Dish {
  id: string;
  name: string;
  ingredients: string; // Stored as a raw text containing newlines or lists for simplicity of user editing
  instructions: string; // Cooking steps as a raw text
  imageUrl: string;
  category: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export type ThemeMode = 'light' | 'dark';
