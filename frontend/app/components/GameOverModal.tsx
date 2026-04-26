'use client';

import { useGame, type GameResult } from '../context/GameContext';

interface Props {
  result: GameResult;
  reason: string;
  onRematch: () => void;
  onChangeOpponent: () => void;
  onGoHome: () => void;
  onViewReport?: () => void;
}

const CONFIG: Record<GameResult, { label: string; color: string; border: string; bg: string }> = {
  win:      { label: 'Victory!', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/90' },
  loss:     { label: 'Defeat',   color: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-950/90'     },
  draw:     { label: 'Draw',     color: 'text-yellow-300',  border: 'border-yellow-500/40',  bg: 'bg-zinc-900/95'    },
  resigned: { label: 'Resigned', color: 'text-zinc-400',    border: 'border-zinc-500/40',    bg: 'bg-zinc-900/95'    },
};

export default function GameOverModal({ result, reason, onRematch, onChangeOpponent, onGoHome, onViewReport }: Props) {
  const { coachReport, coachReportLoading, adaptiveSuggestion } = useGame();
  const { label, color, border, bg } = CONFIG[result];
  const reportReady = !!coachReport;
  const reportPending = coachReportLoading;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded backdrop-blur-[2px] bg-black/55">
      <div className={`flex flex-col items-center gap-3 rounded-xl border ${border} ${bg} px-10 py-8 shadow-2xl`}>
        <p className={`text-5xl font-bold tracking-tight ${color}`}>{label}</p>
        <p className="text-sm text-zinc-400">{reason}</p>
        {adaptiveSuggestion && (
          <div className={`w-full rounded-lg border px-4 py-2.5 text-center text-xs ${
            adaptiveSuggestion.type === 'upgrade'
              ? 'border-indigo-500/30 bg-indigo-950/50 text-indigo-300'
              : 'border-amber-500/30 bg-amber-950/40 text-amber-300'
          }`}>
            {adaptiveSuggestion.message}
          </div>
        )}
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
        {(reportReady || reportPending) && onViewReport && (
          <button
            onClick={reportReady ? onViewReport : undefined}
            disabled={!reportReady}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/30 px-8 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {reportPending ? (
              <><span className="inline-block w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" /> Generating report…</>
            ) : (
              '📋 View Coach Report'
            )}
          </button>
        )}
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
