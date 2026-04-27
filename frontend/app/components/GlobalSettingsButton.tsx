'use client';

import { useState, useEffect } from 'react';
import { useSettings, type AppSettings } from '../../lib/settings';
import { TIME_CONTROLS } from '../context/GameContext';

// ── Mini sub-components ───────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function GlobalSettingsButton() {
  const [open, setOpen] = useState(false);
  const { settings, update } = useSettings();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const blunderOptions: { label: string; value: AppSettings['blunderConfirmMode'] }[] = [
    { label: 'Off',                 value: 'off' },
    { label: 'Blunders only',       value: 'blunders' },
    { label: 'Mistakes & Blunders', value: 'mistakes' },
  ];

  return (
    <>
      {/* Floating gear button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        className="fixed bottom-6 left-6 z-[185] h-10 w-10 flex items-center justify-center rounded-full bg-zinc-800/90 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors shadow-lg backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
              <h1 className="text-base font-semibold text-white">Settings</h1>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none"
                aria-label="Close settings"
              >
                ×
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

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
              </SectionCard>

              {/* B — Audio */}
              <SectionCard title="Audio">
                <SettingRow label="Achievement unlock sound" description="Play a sound when you earn an achievement.">
                  <Toggle value={settings.achievementSoundEnabled} onChange={v => update('achievementSoundEnabled', v)} />
                </SettingRow>
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
              <div className="text-center pb-2">
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
          </div>
        </div>
      )}
    </>
  );
}
