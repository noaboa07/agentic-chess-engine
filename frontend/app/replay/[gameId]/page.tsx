'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { getGameById, type GameRow } from '../../../lib/db';
import EvalBar from '../../components/EvalBar';
import type { MoveClassification } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { useAchievements } from '../../context/AchievementContext';

const CLASSIFICATION_COLORS: Record<MoveClassification, string> = {
  brilliant: 'text-cyan-400 bg-cyan-400/10',
  great:     'text-emerald-400 bg-emerald-400/10',
  good:      'text-green-400 bg-green-400/10',
  inaccuracy:'text-yellow-400 bg-yellow-400/10',
  mistake:   'text-orange-400 bg-orange-400/10',
  blunder:   'text-red-400 bg-red-400/10',
};

function formatPersonaName(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const INITIAL_FEN = new Chess().fen();

export default function ReplayPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<GameRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const { user } = useAuth();
  const { awardAchievement } = useAchievements();

  useEffect(() => {
    if (!gameId) return;
    getGameById(gameId)
      .then(g => {
        setGame(g);
        setCurrentIndex(-1);
        if (g && user) void awardAchievement(user.id, 'scholar');
      })
      .catch(() => setGame(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  useEffect(() => {
    if (!isAutoPlaying || !game) return;
    if (currentIndex >= game.moves.length - 1) { setIsAutoPlaying(false); return; }
    const t = setTimeout(() => setCurrentIndex(i => i + 1), 800);
    return () => clearTimeout(t);
  }, [isAutoPlaying, currentIndex, game]);

  const prev = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex(i => Math.max(-1, i - 1));
  }, []);

  const next = useCallback(() => {
    setCurrentIndex(i => game ? Math.min(game.moves.length - 1, i + 1) : i);
  }, [game]);

  const filteredIndices = useMemo(
    () => game?.moves.map((_, i) => i).filter(i => ['mistake', 'blunder'].includes(game.moves[i].classification)) ?? [],
    [game],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === ' ') { e.preventDefault(); setIsAutoPlaying(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  if (loading) {
    return (
      <main className="h-full overflow-y-auto bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
      </main>
    );
  }

  if (!game) {
    return (
      <main className="h-full overflow-y-auto bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Game not found.</p>
        <Link href="/profile" className="text-indigo-400 hover:underline text-sm">← Back to Profile</Link>
      </main>
    );
  }

  const currentMove = currentIndex >= 0 ? (game.moves[currentIndex] ?? null) : null;
  const boardFen = currentMove?.fen ?? INITIAL_FEN;

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link href="/profile" className="text-sm text-zinc-400 hover:text-white transition-colors">← Profile</Link>
          <h1 className="text-xl font-bold">vs {formatPersonaName(game.opponent_id)}</h1>
          <span className={`text-sm font-semibold capitalize px-2 py-0.5 rounded ${
            game.result === 'win'  ? 'bg-emerald-900/50 text-emerald-400' :
            game.result === 'loss' ? 'bg-red-900/50 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>{game.result}</span>
          {game.player_elo_after !== null && (
            <span className="text-xs text-zinc-500">→ {game.player_elo_after} Elo</span>
          )}
        </div>

        <div className="flex gap-6 items-start">
          {/* Board + eval + controls */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2 items-start">
              <EvalBar evaluation={currentMove?.evaluation ?? null} />
              <Chessboard
                position={boardFen}
                boardWidth={460}
                arePiecesDraggable={false}
                customBoardStyle={{ borderRadius: '4px' }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsAutoPlaying(false); setCurrentIndex(-1); }}
                className="rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                title="Jump to start"
              >
                ⏮
              </button>
              <button
                onClick={() => {
                  setIsAutoPlaying(false);
                  if (reviewMode) {
                    const prevIdx = [...filteredIndices].reverse().find(i => i < currentIndex);
                    if (prevIdx !== undefined) setCurrentIndex(prevIdx);
                  } else {
                    prev();
                  }
                }}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setIsAutoPlaying(p => !p)}
                className={`rounded px-4 py-1.5 text-xs font-medium transition-colors ${
                  isAutoPlaying
                    ? 'bg-indigo-700 text-white hover:bg-indigo-600'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {isAutoPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={() => {
                  if (reviewMode) {
                    const nextIdx = filteredIndices.find(i => i > currentIndex);
                    if (nextIdx !== undefined) setCurrentIndex(nextIdx);
                  } else {
                    next();
                  }
                }}
                className="rounded bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Next →
              </button>
              <button
                onClick={() => { setIsAutoPlaying(false); setCurrentIndex(game.moves.length - 1); }}
                className="rounded bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                title="Jump to end"
              >
                ⏭
              </button>
              <button
                onClick={() => setReviewMode(m => !m)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  reviewMode
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-600/40'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
                title="Mistakes Only"
              >
                ⚠ Mistakes
              </button>
            </div>
            <p className="text-xs text-zinc-600">
              {reviewMode
                ? `Mistake ${filteredIndices.indexOf(currentIndex) + 1} / ${filteredIndices.length}`
                : `Move ${Math.max(0, currentIndex + 1)} / ${game.moves.length}`
              }
            </p>
          </div>

          {/* Right panel: details + move list */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Selected move details */}
            {currentMove ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-mono font-bold text-white">{currentMove.san}</span>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${CLASSIFICATION_COLORS[currentMove.classification]}`}>
                    {currentMove.classification}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span>CPL: <span className={currentMove.cpl > 100 ? 'text-red-400' : currentMove.cpl > 40 ? 'text-amber-400' : 'text-zinc-300'}>{currentMove.cpl}</span></span>
                  {currentMove.bestMove && (
                    <span>Best: <span className="font-mono text-emerald-400">{currentMove.bestMove}</span></span>
                  )}
                </div>
                {currentMove.coachMessage && (
                  <p className="text-xs text-zinc-300 leading-relaxed border-t border-zinc-800 pt-2">
                    {currentMove.coachMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs text-zinc-500 text-center">Click a move or press Play to start the replay</p>
              </div>
            )}

            {/* Move list */}
            <div className="rounded-xl border border-zinc-800 overflow-y-auto max-h-80 flex-1">
              {(reviewMode
                ? filteredIndices.map(i => ({ m: game.moves[i], i }))
                : game.moves.map((m, i) => ({ m, i }))
              ).map(({ m, i }) => (
                <button
                  key={i}
                  onClick={() => { setIsAutoPlaying(false); setCurrentIndex(i); }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left border-b border-zinc-800 last:border-0 transition-colors ${
                    i === currentIndex ? 'bg-zinc-800' : 'hover:bg-zinc-900/50'
                  }`}
                >
                  <span className="text-zinc-600 text-xs w-6 shrink-0">{i + 1}.</span>
                  <span className="font-mono font-medium flex-1">{m.san}</span>
                  <span className={`text-xs capitalize shrink-0 ${CLASSIFICATION_COLORS[m.classification]?.split(' ')[0] ?? 'text-zinc-400'}`}>
                    {m.classification}
                  </span>
                  <span className="text-xs text-zinc-600 w-10 text-right shrink-0">
                    {m.cpl > 0 ? `-${m.cpl}` : '—'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
