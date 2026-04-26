'use client';

import { useState } from 'react';
import { PERSONAS, TIME_CONTROLS, type PersonaId, type TimeControl } from '../context/GameContext';
import { getSettings } from '../../lib/settings';

interface Props {
  onStartGame: (personaId: PersonaId, timeControl: TimeControl | null, teachMode: boolean) => void;
  onBack?: () => void;
}

export default function LobbyScreen({ onStartGame, onBack }: Props) {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>('clown_noah');
  const [selectedTC, setSelectedTC] = useState<TimeControl | null>(() => {
    const { defaultTimeControlId } = getSettings();
    return TIME_CONTROLS.find(tc => tc.label.toLowerCase() === defaultTimeControlId) ?? null;
  });
  const [teachMode, setTeachMode] = useState(() => getSettings().defaultTeachMode);

  return (
    <div className="min-h-full flex flex-col items-center py-16 px-8 gap-10">
      {/* Header */}
      <div className="w-full max-w-6xl flex items-start">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            Home
          </button>
        )}
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">Choose Your Opponent</h1>
        <p className="text-zinc-400 mt-2">13 AI personas, from pure chaos to omniscient precision</p>
      </div>

      {/* Persona grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full max-w-6xl">
        {PERSONAS.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPersona(p.id)}
            className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
              selectedPersona === p.id
                ? 'border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500'
                : 'border-white/10 bg-zinc-900 hover:border-white/25 hover:bg-zinc-800'
            }`}
          >
            <img
              src={`/avatars/${p.id}.svg`}
              alt={p.name}
              className="h-14 w-14 rounded-full border border-white/20 bg-zinc-800 object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm leading-tight">{p.name}</p>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5 line-clamp-2">{p.description}</p>
            </div>
            <div className="w-full mt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Elo</span>
                <span className="text-xs font-mono text-zinc-300">{p.elo}</span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-700">
                <div
                  className="h-1 rounded-full bg-indigo-500"
                  style={{ width: `${(p.skillLevel / 20) * 100}%` }}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Time control */}
      <div className="flex flex-col items-center gap-3 w-full max-w-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Time Control</p>
        <div className="flex gap-2 w-full">
          {TIME_CONTROLS.map(tc => {
            const isActive = selectedTC?.label === tc.label || (tc.label === 'Untimed' && !selectedTC);
            return (
              <button
                key={tc.label}
                onClick={() => setSelectedTC(tc.label === 'Untimed' ? null : tc)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                }`}
              >
                {tc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Teach mode */}
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 px-6 py-4 w-full max-w-lg">
        <div>
          <p className="text-sm font-medium text-zinc-200">Teach Mode</p>
          <p className="text-xs text-zinc-500 mt-0.5">AI coaching + voice commentary after each move</p>
        </div>
        <button
          onClick={() => setTeachMode(v => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
            teachMode ? 'bg-indigo-600' : 'bg-zinc-600'
          }`}
          role="switch"
          aria-checked={teachMode}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              teachMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Start button */}
      <button
        onClick={() => onStartGame(selectedPersona, selectedTC, teachMode)}
        className="rounded-xl bg-indigo-600 px-14 py-4 text-base font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
      >
        Start Game
      </button>
    </div>
  );
}
