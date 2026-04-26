'use client';

import Link from 'next/link';
import { BOARD_THEMES, getStoredThemeId, storeThemeId, type BoardTheme } from '../../lib/themes';
import { useSettings, type AppSettings } from '../../lib/settings';
import { TIME_CONTROLS } from '../context/GameContext';

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{title}</h2>
      {children}
    </section>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-indigo-600' : 'bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

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
      <div className="mb-2 grid grid-cols-4 overflow-hidden rounded" style={{ gridTemplateRows: 'repeat(2, 1fr)', aspectRatio: '2/1' }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ backgroundColor: (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? theme.light : theme.dark }} />
        ))}
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{theme.name}</p>
      <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{theme.description}</p>
      {theme.eloRequired > 0 && <p className="text-[10px] text-amber-500/80 mt-1">Unlock at {theme.eloRequired} Elo</p>}
      {active && <p className="text-[10px] text-indigo-400 mt-0.5 font-medium">✓ Active</p>}
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, update } = useSettings();
  const activeThemeId = (() => {
    if (typeof window !== 'undefined') return getStoredThemeId();
    return 'classic';
  })();

  function selectTheme(theme: BoardTheme) {
    storeThemeId(theme.id);
    // force a re-render by updating a separate key if needed; theme is read on board init
    window.location.reload();
  }

  const blunderOptions: { label: string; value: AppSettings['blunderConfirmMode'] }[] = [
    { label: 'Off',                  value: 'off' },
    { label: 'Blunders only',        value: 'blunders' },
    { label: 'Mistakes & Blunders',  value: 'mistakes' },
  ];

  return (
    <main className="h-full overflow-y-auto text-white">
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">← Back</Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* A — Board & Visuals */}
        <SectionCard title="Board & Visuals">
          <div className="space-y-3 pb-3 border-b border-zinc-800">
            <SettingRow label="Show legal move dots" description="Highlight squares where your piece can move.">
              <Toggle value={settings.showLegalMoves} onChange={v => update('showLegalMoves', v)} />
            </SettingRow>
            <SettingRow label="Show hint arrows" description="Display arrows for candidate moves and hints.">
              <Toggle value={settings.showArrows} onChange={v => update('showArrows', v)} />
            </SettingRow>
            <SettingRow label="Auto-queen promotion" description="Automatically promote pawns to queen.">
              <Toggle value={settings.autoQueenPromotion} onChange={v => update('autoQueenPromotion', v)} />
            </SettingRow>
            <SettingRow label="Reduced motion" description="Disable glow pulses and non-essential animations.">
              <Toggle value={settings.reducedMotion} onChange={v => update('reducedMotion', v)} />
            </SettingRow>
          </div>

          {/* Board theme sub-section */}
          <div>
            <p className="text-xs text-zinc-500 mb-3">
              Board theme — premium themes unlock via the{' '}
              <Link href="/shop" className="text-indigo-400 hover:underline">Shop</Link>.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BOARD_THEMES.map(theme => (
                <ThemeSwatch
                  key={theme.id}
                  theme={theme}
                  active={activeThemeId === theme.id}
                  onClick={() => selectTheme(theme)}
                />
              ))}
            </div>
          </div>
        </SectionCard>

        {/* B — Audio */}
        <SectionCard title="Audio">
          <SettingRow label="Achievement unlock sound" description="Play a sound when you earn an achievement.">
            <Toggle value={settings.achievementSoundEnabled} onChange={v => update('achievementSoundEnabled', v)} />
          </SettingRow>
          <p className="text-xs text-zinc-600 -mt-2">
            In-game sound effects and music volume are controlled by the mute button in the coach panel during play.
          </p>
        </SectionCard>

        {/* C — Coaching */}
        <SectionCard title="Coaching">
          <SettingRow label="Default Teach Mode" description="Pre-enable Teach Mode whenever you start a new game.">
            <Toggle value={settings.defaultTeachMode} onChange={v => update('defaultTeachMode', v)} />
          </SettingRow>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-200">Pre-move blunder warning</p>
            <p className="text-xs text-zinc-500">Show a warning before you commit a bad move.</p>
            <div className="flex flex-col gap-1.5">
              {blunderOptions.map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                    settings.blunderConfirmMode === opt.value
                      ? 'border-indigo-500 bg-indigo-500'
                      : 'border-zinc-600 group-hover:border-zinc-400'
                  }`}>
                    {settings.blunderConfirmMode === opt.value && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm text-zinc-300" onClick={() => update('blunderConfirmMode', opt.value)}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* D — Gameplay */}
        <SectionCard title="Gameplay">
          <SettingRow label="Confirm before resign" description="Show a confirmation dialog before resigning a game.">
            <Toggle value={settings.confirmResign} onChange={v => update('confirmResign', v)} />
          </SettingRow>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-200">Default time control</p>
            <p className="text-xs text-zinc-500">Pre-select this time control in the lobby.</p>
            <div className="flex flex-wrap gap-2">
              {[{ label: 'Untimed', id: 'untimed' }, ...TIME_CONTROLS.map(tc => ({ label: tc.label, id: tc.label.toLowerCase() }))].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => update('defaultTimeControlId', opt.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    settings.defaultTimeControlId === opt.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Reset */}
        <div className="text-center pb-4">
          <button
            onClick={() => {
              localStorage.removeItem('noahverse_settings');
              localStorage.removeItem('noahverse_onboarded');
              window.location.reload();
            }}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors underline underline-offset-2"
          >
            Reset all settings & re-run onboarding
          </button>
        </div>

      </div>
    </main>
  );
}
