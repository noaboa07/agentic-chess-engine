'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useGame, type IntensityLevel, type PersonaId } from '../context/GameContext';

const BG_CLASSES: Record<IntensityLevel, string> = {
  calm:     'bg-zinc-950',
  dramatic: 'bg-red-950',
  hype:     'bg-indigo-950',
};

function getTrack(personaId: PersonaId, intensity: IntensityLevel): string {
  return `/audio/${personaId}/${intensity}.mp3`;
}

function fadeVolume(audio: HTMLAudioElement, target: number, ms = 1500) {
  const start = audio.volume;
  const startTime = Date.now();
  const tick = setInterval(() => {
    const t = Math.min((Date.now() - startTime) / ms, 1);
    audio.volume = start + (target - start) * t;
    if (t >= 1) clearInterval(tick);
  }, 50);
}

type TrackKey = `${PersonaId}:${IntensityLevel}`;

export default function AtmosphereBackground({ children }: { children: ReactNode }) {
  const { intensity, globalMuted, moveCount, activePersona } = useGame();

  // Flat map keyed by "personaId:intensity" so each persona keeps its own Audio objects
  const audioMap = useRef<Map<TrackKey, HTMLAudioElement>>(new Map());
  const activeKey = useRef<TrackKey | null>(null);
  const started = useRef(false);
  const globalMutedRef = useRef(globalMuted);
  useEffect(() => { globalMutedRef.current = globalMuted; }, [globalMuted]);

  function getOrCreate(personaId: PersonaId, level: IntensityLevel): HTMLAudioElement {
    const key: TrackKey = `${personaId}:${level}`;
    if (!audioMap.current.has(key)) {
      const audio = new Audio(getTrack(personaId, level));
      audio.loop = true;
      audio.volume = 0;
      audioMap.current.set(key, audio);
    }
    return audioMap.current.get(key)!;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioMap.current.forEach(a => a.pause());
      audioMap.current.clear();
    };
  }, []);

  // Start music after first user move
  useEffect(() => {
    if (moveCount === 0 || started.current) return;
    started.current = true;
    const key: TrackKey = `${activePersona.id}:${intensity}`;
    activeKey.current = key;
    if (globalMutedRef.current) return;
    const audio = getOrCreate(activePersona.id, intensity);
    void audio.play().catch(() => {});
    fadeVolume(audio, 0.25, 1500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveCount]);

  // Crossfade on intensity change (within same persona)
  useEffect(() => {
    if (!started.current) return;
    const newKey: TrackKey = `${activePersona.id}:${intensity}`;
    if (activeKey.current === newKey) return;

    const prevKey = activeKey.current;
    activeKey.current = newKey;

    if (prevKey) {
      const outAudio = audioMap.current.get(prevKey);
      if (outAudio) fadeVolume(outAudio, 0, 1500);
    }
    if (!globalMutedRef.current) {
      const inAudio = getOrCreate(activePersona.id, intensity);
      inAudio.currentTime = 0;
      void inAudio.play().catch(() => {});
      fadeVolume(inAudio, 0.25, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity]);

  // Crossfade on persona change — reset intensity to calm for the new persona
  useEffect(() => {
    if (!started.current) return;
    const newKey: TrackKey = `${activePersona.id}:calm`;

    const prevKey = activeKey.current;
    if (prevKey === newKey) return;
    activeKey.current = newKey;

    if (prevKey) {
      const outAudio = audioMap.current.get(prevKey);
      if (outAudio) fadeVolume(outAudio, 0, 1500);
    }
    if (!globalMutedRef.current) {
      const inAudio = getOrCreate(activePersona.id, 'calm');
      inAudio.currentTime = 0;
      void inAudio.play().catch(() => {});
      fadeVolume(inAudio, 0.25, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePersona.id]);

  // Global mute / unmute
  useEffect(() => {
    if (!started.current || !activeKey.current) return;
    const current = audioMap.current.get(activeKey.current);
    if (!current) return;
    if (globalMuted) {
      fadeVolume(current, 0, 500);
    } else {
      void current.play().catch(() => {});
      fadeVolume(current, 0.25, 500);
    }
  }, [globalMuted]);

  return (
    <div className={`h-full transition-colors duration-1000 ${BG_CLASSES[intensity]}`}>
      {children}
    </div>
  );
}
