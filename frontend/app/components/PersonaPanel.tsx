'use client';

import { useGame } from '../context/GameContext';

export default function PersonaPanel() {
  const { activePersona, userModeElo, timeControl } = useGame();
  const modeLabel = timeControl?.label ?? 'Untimed';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-zinc-900 px-4 py-3 w-full max-w-[560px]">
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-white/20 bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/avatars/${activePersona.id}.svg`}
          alt={activePersona.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white leading-tight">{activePersona.name}</p>
        <p className="text-xs text-zinc-400 leading-tight">{activePersona.description}</p>
      </div>
      <div className="ml-auto flex-shrink-0 flex flex-col items-end gap-1">
        <div className="rounded-md bg-zinc-800 px-3 py-1">
          <p className="text-xs font-mono text-zinc-300">{activePersona.elo} Elo</p>
        </div>
        {userModeElo !== null && (
          <div className="rounded-md bg-indigo-900/50 border border-indigo-500/20 px-3 py-1">
            <p className="text-xs font-mono text-indigo-300">You: {userModeElo} <span className="text-indigo-500">{modeLabel}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
