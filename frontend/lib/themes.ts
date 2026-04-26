export interface BoardTheme {
  id: string;
  name: string;
  description: string;
  light: string;
  dark: string;
  eloRequired: number;
}

export const BOARD_THEMES: readonly BoardTheme[] = [
  { id: 'classic',  name: 'Classic',   description: 'The timeless wooden look',          light: '#f0d9b5', dark: '#b58863', eloRequired: 0    },
  { id: 'ocean',    name: 'Ocean',     description: 'Cool blue coastal tones',           light: '#d6e8f0', dark: '#4a8fa8', eloRequired: 0    },
  { id: 'forest',   name: 'Forest',    description: 'Earthy greens of the deep wood',    light: '#e2f0d9', dark: '#4a7c59', eloRequired: 400  },
  { id: 'slate',    name: 'Slate',     description: 'Clean minimal gray tones',          light: '#dde3ea', dark: '#5a6a7a', eloRequired: 600  },
  { id: 'rose',     name: 'Rose',      description: 'Warm blush and deep crimson',       light: '#fce4ec', dark: '#b5485a', eloRequired: 800  },
  { id: 'gold',     name: 'Gold Rush', description: 'Rich amber and burnished gold',     light: '#fff8e1', dark: '#c8860a', eloRequired: 1000 },
  { id: 'ice',      name: 'Ice',       description: 'Arctic frost and glacial teal',     light: '#e0f7fa', dark: '#5b9ea0', eloRequired: 1200 },
  { id: 'royal',    name: 'Royal',     description: 'Regal purple for true aristocrats', light: '#ede7f6', dark: '#7c4dbc', eloRequired: 1500 },
  { id: 'obsidian', name: 'Obsidian',  description: 'Dark volcanic glass',               light: '#546e7a', dark: '#263238', eloRequired: 1800 },
  { id: 'inferno',  name: 'Inferno',   description: 'Forged in hellfire',                light: '#fbe9e7', dark: '#bf360c', eloRequired: 2100 },
] as const;

const STORAGE_KEY = 'noahverse_board_theme';

export function getStoredThemeId(): string {
  if (typeof window === 'undefined') return 'classic';
  return localStorage.getItem(STORAGE_KEY) ?? 'classic';
}

export function storeThemeId(id: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, id);
}

export function getThemeById(id: string): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) ?? (BOARD_THEMES[0] as BoardTheme);
}
