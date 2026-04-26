'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { getModeElo } from '../../lib/db';
import { BOARD_THEMES, getStoredThemeId, storeThemeId, type BoardTheme } from '../../lib/themes';

function LockIcon() {
  return (
    <svg className="inline-block w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

function ThemeCard({
  theme,
  unlocked,
  active,
  onSelect,
}: {
  theme: BoardTheme;
  unlocked: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-2 transition-all ${
        active
          ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40'
          : unlocked
          ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 cursor-pointer'
          : 'border-zinc-800 bg-zinc-900/50 opacity-60'
      }`}
      onClick={unlocked ? onSelect : undefined}
    >
      {/* Checkerboard preview */}
      <div className="grid grid-cols-4 overflow-hidden rounded-sm" style={{ gridTemplateRows: 'repeat(3, 1fr)', aspectRatio: '4/3' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{ backgroundColor: (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? theme.light : theme.dark }}
          />
        ))}
      </div>

      <div>
        <p className="font-semibold text-sm text-white">{theme.name}</p>
        <p className="text-[11px] text-zinc-400">{theme.description}</p>
      </div>

      {theme.eloRequired === 0 ? (
        <span className="text-[10px] text-emerald-400 font-medium">Free</span>
      ) : unlocked ? (
        <span className="text-[10px] text-emerald-400 font-medium">✓ Unlocked</span>
      ) : (
        <span className="text-[10px] text-amber-500">
          <LockIcon />
          Reach {theme.eloRequired} Elo
        </span>
      )}

      {active && (
        <span className="text-[10px] text-indigo-400 font-medium">✓ Active</span>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { user } = useAuth();
  const [userElo, setUserElo] = useState<number>(0);
  const [activeId, setActiveId] = useState<string>(() => getStoredThemeId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getModeElo(user.id, 'Untimed')
      .then(setUserElo)
      .catch(() => setUserElo(0))
      .finally(() => setLoading(false));
  }, [user]);

  function handleSelect(theme: BoardTheme) {
    setActiveId(theme.id);
    storeThemeId(theme.id);
  }

  return (
    <main className="min-h-full bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-2 flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Shop</h1>
        </div>
        <p className="text-sm text-zinc-400 mb-2">
          Earn board themes by climbing the Elo ladder. No purchases needed — just play.
        </p>
        {!loading && (
          <p className="text-sm text-zinc-300 mb-6">
            Your Elo: <span className="font-bold text-indigo-400">{userElo}</span>
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-200" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {BOARD_THEMES.map(theme => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                unlocked={userElo >= theme.eloRequired}
                active={activeId === theme.id}
                onSelect={() => handleSelect(theme)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
