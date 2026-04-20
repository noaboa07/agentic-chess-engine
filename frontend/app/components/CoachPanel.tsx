'use client';

import { useEffect, useState } from 'react';
import { useGame, type Evaluation, type MoveClassification } from '../context/GameContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type BackendStatus = 'checking' | 'online' | 'offline';

const classificationStyles: Record<MoveClassification, string> = {
  brilliant: 'text-cyan-400',
  good: 'text-green-400',
  inaccuracy: 'text-yellow-400',
  mistake: 'text-orange-400',
  blunder: 'text-red-400',
};

function EvalDisplay({ evaluation }: { evaluation: Evaluation }) {
  if (evaluation.type === 'mate') {
    return (
      <span className="text-sm font-mono text-purple-400">
        M{Math.abs(evaluation.value)}
      </span>
    );
  }
  const cp = evaluation.value;
  const display = cp > 0 ? `+${(cp / 100).toFixed(2)}` : (cp / 100).toFixed(2);
  const color = cp > 50 ? 'text-white' : cp < -50 ? 'text-zinc-400' : 'text-zinc-300';
  return <span className={`text-sm font-mono ${color}`}>{display}</span>;
}

export default function CoachPanel() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const { evaluation, lastClassification, bestMove, isAnalyzing } = useGame();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
  }, []);

  const statusColor: Record<BackendStatus, string> = {
    checking: 'bg-yellow-500',
    online: 'bg-green-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-full min-h-[560px] w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">AI Coach</h2>
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${statusColor[status]}`} />
          {status === 'checking' ? 'Connecting…' : status === 'online' ? 'Backend online' : 'Backend offline'}
        </span>
      </div>

      {isAnalyzing ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-400 animate-pulse">Analyzing position…</p>
        </div>
      ) : evaluation ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
            <span className="text-xs text-zinc-400 uppercase tracking-wide">Evaluation</span>
            <EvalDisplay evaluation={evaluation} />
          </div>

          {lastClassification && (
            <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">Last Move</span>
              <span className={`text-sm font-medium capitalize ${classificationStyles[lastClassification]}`}>
                {lastClassification}
              </span>
            </div>
          )}

          {bestMove && (
            <div className="flex items-center justify-between rounded-md bg-zinc-800 px-4 py-3">
              <span className="text-xs text-zinc-400 uppercase tracking-wide">Best Move</span>
              <span className="text-sm font-mono text-zinc-200">{bestMove}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-zinc-500 text-center">
            Make a move to see analysis.
          </p>
        </div>
      )}
    </div>
  );
}
