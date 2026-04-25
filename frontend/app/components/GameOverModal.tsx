'use client';

import type { GameResult } from '../context/GameContext';

interface Props {
  result: GameResult;
  reason: string;
  onRematch: () => void;
  onChangeOpponent: () => void;
  onGoHome: () => void;
}

const CONFIG: Record<GameResult, { label: string; color: string; border: string; bg: string }> = {
  win:      { label: 'Victory!', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/90' },
  loss:     { label: 'Defeat',   color: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-950/90'     },
  draw:     { label: 'Draw',     color: 'text-yellow-300',  border: 'border-yellow-500/40',  bg: 'bg-zinc-900/95'    },
  resigned: { label: 'Resigned', color: 'text-zinc-400',    border: 'border-zinc-500/40',    bg: 'bg-zinc-900/95'    },
};

export default function GameOverModal({ result, reason, onRematch, onChangeOpponent, onGoHome }: Props) {
  const { label, color, border, bg } = CONFIG[result];
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded backdrop-blur-[2px] bg-black/55">
      <div className={`flex flex-col items-center gap-3 rounded-xl border ${border} ${bg} px-10 py-8 shadow-2xl`}>
        <p className={`text-5xl font-bold tracking-tight ${color}`}>{label}</p>
        <p className="text-sm text-zinc-400">{reason}</p>
        <button
          onClick={onRematch}
          className="mt-2 rounded-lg bg-white px-8 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 active:scale-95 transition-all"
        >
          Rematch
        </button>
        <button
          onClick={onChangeOpponent}
          className="rounded-lg border border-white/20 px-8 py-2 text-sm font-medium text-zinc-300 hover:bg-white/10 active:scale-95 transition-all"
        >
          Change Opponent
        </button>
        <button
          onClick={onGoHome}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
