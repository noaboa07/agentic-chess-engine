'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserWeaknessProfile, type WeaknessEntry, type WeaknessProfile } from '../../lib/db';

const TREND_STYLES = {
  improving: { label: 'Improving', className: 'text-emerald-400 bg-emerald-400/10' },
  worsening: { label: 'Worsening', className: 'text-red-400 bg-red-400/10' },
  stable:    { label: 'Stable',    className: 'text-zinc-400 bg-zinc-700/50' },
};

function WeaknessRow({ entry }: { entry: WeaknessEntry }) {
  const [expanded, setExpanded] = useState(false);
  const trend = TREND_STYLES[entry.trend];
  return (
    <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-700/30 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-zinc-200 truncate">{entry.category}</span>
          <span className="shrink-0 text-[10px] text-zinc-500">
            {entry.gamesAffected} / 20 games
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${trend.className}`}>
            {trend.label}
          </span>
          <span className="text-zinc-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 flex flex-col gap-1.5 border-t border-zinc-700/40 pt-2">
          <p className="text-[11px] text-zinc-400 leading-relaxed">{entry.description}</p>
          <p className="text-[11px] text-indigo-300 leading-relaxed">
            <span className="text-zinc-500">Fix: </span>{entry.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

export default function WeaknessPanel() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<WeaknessProfile | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserWeaknessProfile(user.id)
      .then(p => setProfile(p))
      .catch(() => {});
  }, [user]);

  if (!profile) return null;

  return (
    <div className="mt-3 rounded-lg border border-zinc-700/50 bg-zinc-900/60 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">Your Weaknesses</span>
          {profile.topWeakness && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
              {profile.topWeakness.category}
            </span>
          )}
        </div>
        <span className="text-zinc-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t border-zinc-700/40 pt-2">
          <p className="text-[10px] text-zinc-500">
            Based on {profile.gamesAnalyzed} recent games
          </p>
          {profile.entries.slice(0, 3).map(entry => (
            <WeaknessRow key={entry.category} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
