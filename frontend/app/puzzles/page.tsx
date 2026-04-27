'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Square } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { useAchievements } from '../context/AchievementContext';
import { getPuzzles, markPuzzleSolved, type PuzzleRow } from '../../lib/db';
import EmptyState from '../components/EmptyState';

const Chessboard = dynamic(
  () => import('react-chessboard').then(m => m.Chessboard),
  { ssr: false },
);

type PuzzleState = 'idle' | 'correct' | 'revealed';

function formatClass(cls: string) {
  return cls.charAt(0).toUpperCase() + cls.slice(1);
}

export default function PuzzlesPage() {
  const { user } = useAuth();
  const { awardAchievement } = useAchievements();
  const [puzzles, setPuzzles] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('idle');
  const [shownMove, setShownMove] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getPuzzles(user.id)
      .then(setPuzzles)
      .catch(() => setPuzzles([]))
      .finally(() => setLoading(false));
  }, [user]);

  const puzzle = puzzles[index] ?? null;

  const handlePieceDrop = useCallback(
    (src: Square, tgt: Square): boolean => {
      if (!puzzle || puzzleState !== 'idle') return false;
      const attempted = `${src}${tgt}`;
      const isCorrect = puzzle.correct_move.startsWith(attempted) || attempted.startsWith(puzzle.correct_move.slice(0, 4));
      if (isCorrect) {
        setPuzzleState('correct');
        setShownMove(null);
        if (!puzzle.solved && user) {
          markPuzzleSolved(puzzle.id).catch(() => {});
          const solvedBefore = puzzles.filter(p => p.solved).length;
          if (solvedBefore === 0) void awardAchievement(user.id, 'puzzle_solver');
          if (solvedBefore === 9) void awardAchievement(user.id, 'tactic_finder');
          setPuzzles(prev => prev.map((p, i) => i === index ? { ...p, solved: true } : p));
        }
      } else {
        const next = wrongAttempts + 1;
        setWrongAttempts(next);
        if (next >= 3) {
          setShownMove(puzzle.correct_move);
          setPuzzleState('revealed');
        }
      }
      return isCorrect;
    },
    [puzzle, puzzleState, wrongAttempts, index, user, puzzles, awardAchievement],
  );

  const handleNext = useCallback(() => {
    setPuzzleState('idle');
    setShownMove(null);
    setWrongAttempts(0);
    setIndex(i => Math.min(i + 1, puzzles.length - 1));
  }, [puzzles.length]);

  const handlePrev = useCallback(() => {
    setPuzzleState('idle');
    setShownMove(null);
    setWrongAttempts(0);
    setIndex(i => Math.max(i - 1, 0));
  }, []);

  const handleReveal = useCallback(() => {
    if (!puzzle) return;
    setShownMove(puzzle.correct_move);
    setPuzzleState('revealed');
  }, [puzzle]);

  if (loading) {
    return (
      <main className="h-full overflow-y-auto bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-all duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Puzzles</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Generated from your blunders and mistakes</p>
          </div>
        </div>

        {!user && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300">
            Sign in to see your puzzles.
          </div>
        )}

        {user && puzzles.length === 0 && (
          <EmptyState
            icon="🧩"
            title="No puzzles yet"
            body="Puzzles are generated automatically from your blunders after each game. Play a game to get started."
            ctaLabel="Play a Game"
            ctaHref="/play"
          />
        )}

        {puzzle && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Board */}
            <div className="flex flex-col items-center gap-3">
              <Chessboard
                position={puzzle.fen}
                boardWidth={520}
                onPieceDrop={handlePieceDrop}
                arePiecesDraggable={puzzleState === 'idle'}
                customBoardStyle={{ borderRadius: '4px' }}
              />

              {/* Feedback */}
              {puzzleState === 'correct' && (
                <div className="w-full rounded-lg bg-emerald-900/50 border border-emerald-700/40 px-4 py-2 text-center text-sm font-semibold text-emerald-400">
                  Correct!
                </div>
              )}
              {puzzleState === 'idle' && wrongAttempts === 1 && (
                <div className="w-full rounded-lg bg-red-900/50 border border-red-700/40 px-4 py-2 text-center text-sm font-semibold text-red-400">
                  Not quite — try again!
                </div>
              )}
              {puzzleState === 'idle' && wrongAttempts === 2 && (
                <div className="w-full rounded-lg bg-red-900/50 border border-red-700/40 px-4 py-2 text-center text-sm font-semibold text-red-400">
                  Wrong again — one more try!
                </div>
              )}
              {puzzleState === 'revealed' && (
                <div className="w-full rounded-lg bg-red-900/50 border border-red-700/40 px-4 py-2 text-center text-sm font-semibold text-red-400">
                  Best move: <span className="font-mono text-white">{shownMove}</span>
                </div>
              )}
            </div>

            {/* Info + controls */}
            <div className="flex flex-col gap-4 flex-1">
              {/* Puzzle info */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-zinc-200">
                    Puzzle {index + 1} / {puzzles.length}
                  </h2>
                  {puzzle.solved && (
                    <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Solved</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Find the best move from this position.
                </p>
                <div className="mt-3 space-y-1 text-xs text-zinc-500">
                  <p>Type: <span className="text-amber-400 capitalize">{formatClass(puzzle.classification)}</span></p>
                  <p>Move number: <span className="text-zinc-300">{puzzle.move_number}</span></p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleReveal}
                  disabled={puzzleState !== 'idle'}
                  className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                >
                  Give Up
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={index === 0}
                    className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={index >= puzzles.length - 1}
                    className="flex-1 rounded-lg bg-indigo-700 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-600 transition-colors disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                  <span>Solved</span>
                  <span>{puzzles.filter(p => p.solved).length} / {puzzles.length}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(puzzles.filter(p => p.solved).length / puzzles.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
