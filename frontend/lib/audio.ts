export type SfxName =
  | 'game-start'
  | 'move-self'
  | 'move-opponent'
  | 'capture'
  | 'move-check'
  | 'castle'
  | 'promote'
  | 'illegal'
  | 'premove'
  | 'tenseconds'
  | 'game-end'
  | 'game-draw'
  | 'notify';

const SFX_PATH = '/audio';
const cache = new Map<SfxName, HTMLAudioElement>();

const ALL_SFX: SfxName[] = [
  'game-start', 'move-self', 'move-opponent', 'capture',
  'move-check', 'castle', 'promote', 'illegal', 'premove',
  'tenseconds', 'game-end', 'game-draw', 'notify',
];

function getOrCreate(name: SfxName): HTMLAudioElement {
  let audio = cache.get(name);
  if (!audio) {
    audio = new Audio(`${SFX_PATH}/${name}.mp3`);
    cache.set(name, audio);
  }
  return audio;
}

/** Call once on mount to prime the browser's audio decode cache. */
export function preloadSfx(): void {
  if (typeof window === 'undefined') return;
  for (const name of ALL_SFX) {
    const audio = getOrCreate(name);
    audio.preload = 'auto';
    audio.load();
  }
}

/**
 * Play a sound effect.
 * Resets currentTime so rapid repeat calls don't stack/overlap.
 */
export function playSfx(name: SfxName, muted = false): void {
  if (muted || typeof window === 'undefined') return;
  const audio = getOrCreate(name);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
