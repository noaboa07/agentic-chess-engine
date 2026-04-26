'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BOARD_THEMES, getStoredThemeId, storeThemeId, type BoardTheme } from '../../lib/themes';

function ThemeSwatch({ theme, active, onClick }: { theme: BoardTheme; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all ${
        active
          ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/40'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      {/* Mini checkerboard preview */}
      <div className="mb-2 grid grid-cols-4 overflow-hidden rounded" style={{ gridTemplateRows: 'repeat(2, 1fr)', aspectRatio: '2/1' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{ backgroundColor: (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? theme.light : theme.dark }}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{theme.name}</p>
      <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{theme.description}</p>
      {theme.eloRequired > 0 && (
        <p className="text-[10px] text-amber-500/80 mt-1">Unlock at {theme.eloRequired} Elo</p>
      )}
      {active && <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">✓ Active</p>}
    </button>
  );
}

export default function SettingsPage() {
  const [activeId, setActiveId] = useState<string>(() => getStoredThemeId());

  function selectTheme(theme: BoardTheme) {
    setActiveId(theme.id);
    storeThemeId(theme.id);
  }

  return (
    <main className="min-h-full bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-1">
            Board Theme
          </h2>
          <p className="text-xs text-zinc-500 mb-5">
            Choose your board colors. Premium themes are earned by reaching the required Elo —
            visit the <Link href="/shop" className="text-indigo-400 hover:underline">Shop</Link> to see your progress.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {BOARD_THEMES.map(theme => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                active={activeId === theme.id}
                onClick={() => selectTheme(theme)}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
