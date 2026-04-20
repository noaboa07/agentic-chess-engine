'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useGame, type IntensityLevel } from '../context/GameContext';

const TRACKS: Record<IntensityLevel, string> = {
  calm:     '/audio/calm.mp3',
  dramatic: '/audio/dramatic.mp3',
  hype:     '/audio/hype.mp3',
};

const BG_CLASSES: Record<IntensityLevel, string> = {
  calm:     'bg-zinc-950',
  dramatic: 'bg-red-950',
  hype:     'bg-indigo-950',
};

function fadeVolume(audio: HTMLAudioElement, target: number, ms = 1500) {
  const start = audio.volume;
  const startTime = Date.now();
  const tick = setInterval(() => {
    const t = Math.min((Date.now() - startTime) / ms, 1);
    audio.volume = start + (target - start) * t;
    if (t >= 1) clearInterval(tick);
  }, 50);
}

export default function AtmosphereBackground({ children }: { children: ReactNode }) {
  const { intensity, globalMuted, moveCount } = useGame();
  const audioRefs = useRef<Partial<Record<IntensityLevel, HTMLAudioElement>>>({});
  const prevIntensity = useRef<IntensityLevel>('calm');
  const started = useRef(false);
  // Keep a ref so crossfade/mute effects can read current muted state without stale closure
  const globalMutedRef = useRef(globalMuted);
  useEffect(() => { globalMutedRef.current = globalMuted; }, [globalMuted]);

  // Init Audio objects once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (Object.keys(TRACKS) as IntensityLevel[]).forEach(level => {
      if (!audioRefs.current[level]) {
        const audio = new Audio(TRACKS[level]);
        audio.loop = true;
        audio.volume = 0;
        audioRefs.current[level] = audio;
      }
    });
    return () => {
      Object.values(audioRefs.current).forEach(a => a?.pause());
    };
  }, []);

  // Start music after first user move — safe for browser autoplay policy
  useEffect(() => {
    if (moveCount === 0 || started.current) return;
    started.current = true;
    prevIntensity.current = intensity;
    if (globalMutedRef.current) return;
    const audio = audioRefs.current[intensity];
    if (audio) {
      void audio.play().catch(() => {});
      fadeVolume(audio, 0.25, 1500);
    }
  // intensity intentionally included so the correct track starts if intensity
  // has already changed before the first move is made
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveCount]);

  // Crossfade when intensity changes (only after music has started)
  useEffect(() => {
    if (!started.current) return;
    const prev = prevIntensity.current;
    if (prev === intensity) return;
    prevIntensity.current = intensity;

    const outAudio = audioRefs.current[prev];
    const inAudio  = audioRefs.current[intensity];
    if (outAudio) fadeVolume(outAudio, 0, 1500);
    if (inAudio && !globalMutedRef.current) {
      inAudio.currentTime = 0;
      void inAudio.play().catch(() => {});
      fadeVolume(inAudio, 0.25, 1500);
    }
  }, [intensity]);

  // Global mute / unmute — fade current track in or out
  useEffect(() => {
    if (!started.current) return;
    const current = audioRefs.current[prevIntensity.current];
    if (!current) return;
    if (globalMuted) {
      fadeVolume(current, 0, 500);
    } else {
      void current.play().catch(() => {});
      fadeVolume(current, 0.25, 500);
    }
  }, [globalMuted]);

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${BG_CLASSES[intensity]}`}>
      {children}
    </div>
  );
}
