'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUsername, getUnlockedAchievements, getCampaignProgress, type UserProfile } from '../../lib/db';
import { ACHIEVEMENTS, TIER_COLORS, TIER_BG } from '../../lib/achievements';

const RESULT_STYLES: Record<string, string> = {
  win:      'text-emerald-400',
  loss:     'text-red-400',
  draw:     'text-zinc-400',
  resigned: 'text-amber-400',
};

function formatPersonaName(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const [bossesDefeated, setBossesDefeated] = useState(0);

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.id)
      .then(p => {
        setProfile(p);
        setDraftName(p?.username ?? '');
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
    getUnlockedAchievements(user.id).then(setUnlockedIds).catch(() => {});
    getCampaignProgress(user.id)
      .then(prog => setBossesDefeated(Object.values(prog).filter(s => s === 'complete').length))
      .catch(() => {});
  }, [user]);

  async function handleSaveName() {
    if (!user || !profile || !draftName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateUsername(user.id, draftName.trim());
      setProfile(p => p ? { ...p, username: draftName.trim() } : p);
      setEditing(false);
    } catch {
      setSaveError('Failed to update username. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="h-full overflow-y-auto bg-zinc-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="h-full overflow-y-auto bg-zinc-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Could not load profile.</p>
        <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-all duration-150">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Home
        </Link>
      </main>
    );
  }

  const winRate = profile.totalGames > 0
    ? Math.round((profile.wins / profile.totalGames) * 100)
    : 0;

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-all duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>

        {/* Identity card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-white text-lg font-bold focus:outline-none focus:border-indigo-500 w-44"
                    maxLength={24}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') void handleSaveName(); if (e.key === 'Escape') setEditing(false); }}
                  />
                  <button
                    onClick={() => void handleSaveName()}
                    disabled={saving}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDraftName(profile.username); }}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{profile.username}</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-1.5 py-0.5 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              )}
              {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
              <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-indigo-400">{profile.currentElo}</p>
              <p className="text-xs text-zinc-500">Elo Rating</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: 'Games', value: profile.totalGames, color: 'text-white' },
            { label: 'Wins',  value: profile.wins,       color: 'text-emerald-400' },
            { label: 'Win %', value: `${winRate}%`,      color: 'text-indigo-400' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{profile.losses}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Losses (incl. resigned)</p>
          </div>
          <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{bossesDefeated} / 13</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">Bosses Defeated</p>
          </div>
        </div>

        {/* Recent games */}
        {profile.recentGames.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-3">Recent Games</h2>
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              {profile.recentGames.map((g, i) => (
                <div
                  key={g.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i < profile.recentGames.length - 1 ? 'border-b border-zinc-800' : ''
                  }`}
                >
                  <span className="text-zinc-300 flex-1">{formatPersonaName(g.opponent_id)}</span>
                  <span className={`font-semibold capitalize w-20 text-center ${RESULT_STYLES[g.result] ?? 'text-zinc-400'}`}>
                    {g.result}
                  </span>
                  <span className="text-zinc-600 text-xs w-16 text-center">{g.time_control ?? 'Untimed'}</span>
                  <span className="text-zinc-600 text-xs w-24 text-center">{formatDate(g.played_at)}</span>
                  <Link
                    href={`/replay/${g.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline w-12 text-right transition-colors"
                  >
                    Replay
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Achievements</h2>
            <span className="text-xs text-zinc-600">{unlockedIds.length} / {ACHIEVEMENTS.length} earned</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {ACHIEVEMENTS.map(a => {
              const earned = unlockedIds.includes(a.id);
              return (
                <div
                  key={a.id}
                  title={`${a.title} — ${a.description}`}
                  className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 text-center transition-all ${
                    earned
                      ? `border-zinc-700 ${TIER_BG[a.tier]} bg-opacity-10`
                      : 'border-zinc-800 bg-zinc-900/40 opacity-30'
                  }`}
                >
                  <span className="text-2xl">{a.icon}</span>
                  <p className="text-[10px] font-medium leading-tight text-zinc-300">{a.title}</p>
                  {earned && (
                    <span className={`text-[9px] font-semibold uppercase tracking-wide ${TIER_COLORS[a.tier]}`}>
                      {a.tier}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
