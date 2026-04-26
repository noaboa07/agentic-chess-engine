import { useState, useCallback } from 'react';

export interface AppSettings {
  showLegalMoves: boolean;
  showArrows: boolean;
  autoQueenPromotion: boolean;
  blunderConfirmMode: 'off' | 'blunders' | 'mistakes';
  defaultTeachMode: boolean;
  defaultTimeControlId: string;
  confirmResign: boolean;
  achievementSoundEnabled: boolean;
  reducedMotion: boolean;
}

const DEFAULTS: AppSettings = {
  showLegalMoves: true,
  showArrows: true,
  autoQueenPromotion: true,
  blunderConfirmMode: 'blunders',
  defaultTeachMode: false,
  defaultTimeControlId: 'untimed',
  confirmResign: true,
  achievementSoundEnabled: true,
  reducedMotion: false,
};

const STORAGE_KEY = 'noahverse_settings';

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  try {
    const current = getSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, [key]: value }));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function useSettings(): { settings: AppSettings; update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void } {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());

  const update = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return { settings, update };
}
