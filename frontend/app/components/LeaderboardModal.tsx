'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, type LeaderboardEntry, type EloMode } from '../../lib/db';

const MODES: EloMode[] = ['Untimed', 'Bullet', 'Blitz', 'Rapid', 'Classical'];

interface Props {
  onClose: () => void;
}

export default function LeaderboardModal({ onClose }: Props) {
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<EloMode>('Untimed');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLeaderboard(activeMode)
      .then(setEntries)
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, [activeMode]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-semibold text-white">Global Leaderboard</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-white/10 px-6">
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              className={`pb-2 pt-3 mr-4 text-xs font-semibold border-b-2 transition-colors ${
                activeMode === mode
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[380px] overflow-y-auto px-6 py-4">
          {loading && (
            <p className="text-center text-sm text-zinc-400 animate-pulse py-8">Loading…</p>
          )}
          {error && (
            <p className="text-center text-sm text-red-400 py-8">{error}</p>
          )}
          {!loading && !error && entries.length === 0 && (
            <p className="text-center text-sm text-zinc-500 py-8">No players yet.</p>
          )}
          {!loading && !error && entries.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 font-medium">Player</th>
                  <th className="pb-2 text-right font-medium">Elo</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const isMe = user?.email === entry.username || false;
                  return (
                    <tr
                      key={entry.rank}
                      className={`border-t border-white/5 ${isMe ? 'bg-indigo-600/20' : ''}`}
                    >
                      <td className="py-2 pr-4 text-zinc-500 tabular-nums">{entry.rank}</td>
                      <td className={`py-2 font-medium ${isMe ? 'text-indigo-300' : 'text-zinc-200'}`}>
                        {entry.username}
                        {isMe && <span className="ml-2 text-[10px] text-indigo-400">(you)</span>}
                      </td>
                      <td className="py-2 text-right font-mono text-zinc-300 tabular-nums">
                        {entry.current_elo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
