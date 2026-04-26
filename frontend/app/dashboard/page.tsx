'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getDashboardGames, type DashboardGame } from '../../lib/db';
import type { MoveClassification } from '../context/GameContext';

// ── Simple SVG line chart ────────────────────────────────────────────────────

function LineChart({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <p className="text-xs text-zinc-600 italic">Not enough data yet</p>;
  }
  const W = 280;
  const H = 64;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const toX = (i: number) => (i / (values.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / range) * (H - 12) - 6;
  const points = values.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

// ── Classification bar chart ─────────────────────────────────────────────────

const CLASS_ORDER: MoveClassification[] = ['brilliant', 'great', 'good', 'inaccuracy', 'mistake', 'blunder'];
const CLASS_COLOR: Record<MoveClassification, string> = {
  brilliant: '#22d3ee', great: '#34d399', good: '#4ade80',
  inaccuracy: '#facc15', mistake: '#f97316', blunder: '#f87171',
};

function ClassBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  if (total === 0) return <p className="text-xs text-zinc-600 italic">No moves recorded</p>;
  return (
    <div className="space-y-1.5">
      {CLASS_ORDER.map(cls => {
        const n = counts[cls] ?? 0;
        const pct = total > 0 ? (n / total) * 100 : 0;
        return (
          <div key={cls} className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 w-20 capitalize">{cls}</span>
            <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: CLASS_COLOR[cls] }}
              />
            </div>
            <span className="text-[11px] text-zinc-500 w-6 text-right">{n}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Training plan ────────────────────────────────────────────────────────────

interface TrainingRec { focus: string; drill: string }

function generateTrainingPlan(avgCpl: number, blundersPerGame: number, totalGames: number): TrainingRec[] {
  const recs: TrainingRec[] = [];
  if (totalGames < 3) {
    recs.push({ focus: 'Keep playing', drill: 'Complete at least 5 games to unlock personalized recommendations.' });
    return recs;
  }
  if (avgCpl > 80) recs.push({ focus: 'Slow down — move quality is low', drill: 'Switch to Rapid (10+0) and pause before every capture.' });
  if (blundersPerGame > 2) recs.push({ focus: 'Blunder reduction', drill: 'Solve 5 puzzles before each session — visit the Puzzles page.' });
  if (avgCpl > 40) recs.push({ focus: 'Move accuracy', drill: 'Enable Teach Mode and review every inaccuracy with the coach.' });
  if (avgCpl <= 40 && blundersPerGame <= 1) recs.push({ focus: 'Push your limits', drill: 'Challenge the next persona on the Campaign ladder.' });
  if (recs.length < 2) recs.push({ focus: 'Opening prep', drill: 'Study your most-played opening in the Opening Explorer.' });
  return recs.slice(0, 4);
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function formatPersona(id: string) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [games, setGames] = useState<DashboardGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getDashboardGames(user.id, 50)
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    if (games.length === 0) return null;

    // Rating history (games in chronological order)
    const ratingHistory = games
      .slice()
      .reverse()
      .map(g => g.player_elo_after)
      .filter((e): e is number => e !== null);

    // Per-game CPL and blunders
    const gameCpls = games.map(g => {
      const moves = g.moves ?? [];
      if (moves.length === 0) return 0;
      return Math.round(moves.reduce((s, m) => s + (m.cpl ?? 0), 0) / moves.length);
    });
    const gameBlunders = games.map(g =>
      (g.moves ?? []).filter(m => m.classification === 'blunder').length,
    );

    const avgCpl = gameCpls.length > 0 ? Math.round(gameCpls.reduce((a, b) => a + b, 0) / gameCpls.length) : 0;
    const avgBlunders = gameBlunders.length > 0
      ? Math.round((gameBlunders.reduce((a, b) => a + b, 0) / gameBlunders.length) * 10) / 10
      : 0;

    // Last 10 games CPL trend (chronological)
    const cplTrend = gameCpls.slice(0, 10).reverse();

    // Classification breakdown
    const classCounts: Record<string, number> = {};
    let totalMoves = 0;
    for (const g of games) {
      for (const m of g.moves ?? []) {
        classCounts[m.classification] = (classCounts[m.classification] ?? 0) + 1;
        totalMoves++;
      }
    }

    // Win rate by persona
    const personaStats: Record<string, { wins: number; total: number }> = {};
    for (const g of games) {
      const pid = g.opponent_id;
      if (!personaStats[pid]) personaStats[pid] = { wins: 0, total: 0 };
      personaStats[pid].total++;
      if (g.result === 'win') personaStats[pid].wins++;
    }

    const wins = games.filter(g => g.result === 'win').length;
    const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0;

    return { ratingHistory, cplTrend, avgCpl, avgBlunders, classCounts, totalMoves, personaStats, winRate, totalGames: games.length, wins };
  }, [games]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>

        {!user && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-300 mb-6">
            Sign in to see your stats.
          </div>
        )}

        {!stats ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
            <p className="text-zinc-400 text-sm">No games recorded yet.</p>
            <Link href="/play" className="mt-3 inline-block text-indigo-400 hover:underline text-sm">Play your first game →</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard label="Games" value={stats.totalGames} />
              <StatCard label="Win Rate" value={`${stats.winRate}%`} />
              <StatCard label="Avg CPL" value={stats.avgCpl} sub="lower is better" />
              <StatCard label="Blunders/Game" value={stats.avgBlunders} />
            </div>

            {/* Rating history */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Rating History</h2>
              {stats.ratingHistory.length >= 2 ? (
                <LineChart values={stats.ratingHistory} color="#818cf8" />
              ) : (
                <p className="text-xs text-zinc-600 italic">Play at least 2 rated games to see your rating trend.</p>
              )}
            </div>

            {/* CPL trend */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Avg CPL — Last 10 Games</h2>
              <LineChart values={stats.cplTrend} color="#f97316" />
              <p className="text-[11px] text-zinc-600 mt-2">Lower centipawn loss = better move quality</p>
            </div>

            {/* Classification breakdown */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Move Quality Breakdown</h2>
              <ClassBar counts={stats.classCounts} total={stats.totalMoves} />
            </div>

            {/* Win rate by persona */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="text-sm font-semibold text-zinc-300 mb-3">Win Rate by Opponent</h2>
              <div className="space-y-1">
                {Object.entries(stats.personaStats)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([pid, s]) => (
                    <div key={pid} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                      <span className="text-sm text-zinc-300">{formatPersona(pid)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{s.total} games</span>
                        <span className={`text-sm font-semibold ${s.wins / s.total >= 0.5 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Math.round((s.wins / s.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Training plan (Phase G) */}
            <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/30 p-5">
              <h2 className="text-sm font-semibold text-indigo-300 mb-3">Personalized Training Plan</h2>
              <div className="space-y-3">
                {generateTrainingPlan(stats.avgCpl, stats.avgBlunders, stats.totalGames).map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-indigo-500 text-sm font-bold shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{rec.focus}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">{rec.drill}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
