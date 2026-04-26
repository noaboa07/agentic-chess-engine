'use client';

import type { CoachReportData } from '../../lib/db';

interface Props {
  report: CoachReportData;
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">{title}</p>
      {children}
    </div>
  );
}

export default function CoachReportModal({ report, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-900 border-b border-zinc-800 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Coach Report</p>
            <p className="text-lg font-bold text-white mt-0.5">Game Analysis</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close report"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          {/* Performance + Opening row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-4 py-3 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Performance</p>
              <p className="text-2xl font-bold text-indigo-400">{report.estimated_performance_rating}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">estimated Elo</p>
            </div>
            <div className="rounded-xl bg-zinc-800/60 border border-zinc-700/50 px-4 py-3 text-center">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Opening</p>
              <p className="text-sm font-semibold text-white leading-tight">{report.opening_played}</p>
            </div>
          </div>

          {/* Game Summary */}
          <Section title="Game Summary">
            <p className="text-sm text-zinc-300 leading-relaxed">{report.game_summary}</p>
          </Section>

          {/* Critical Mistakes */}
          <Section title="Critical Mistakes">
            <div className="flex flex-col gap-2">
              {report.critical_mistakes.slice(0, 3).map((m, i) => (
                <div key={i} className="flex gap-3 rounded-lg bg-red-950/40 border border-red-500/20 px-3 py-2">
                  <span className="mt-0.5 shrink-0 rounded-md bg-red-500/20 px-2 py-0.5 font-mono text-xs font-bold text-red-400">
                    {m.move}
                  </span>
                  <p className="text-xs text-zinc-300">{m.issue}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Best Move Missed */}
          <Section title="Best Move Missed">
            <p className="text-sm text-zinc-300 leading-relaxed">{report.best_move_missed}</p>
          </Section>

          {/* Two-col: Weakness + Tactical Theme */}
          <div className="grid grid-cols-2 gap-3">
            <Section title="Recurring Weakness">
              <p className="text-sm text-amber-300/90 leading-relaxed">{report.recurring_weakness}</p>
            </Section>
            <Section title="Tactical Theme">
              <p className="text-sm text-emerald-300/90 leading-relaxed">{report.tactical_theme}</p>
            </Section>
          </div>

          {/* Recommended Practice */}
          <Section title="Recommended Practice">
            <div className="rounded-xl bg-indigo-950/50 border border-indigo-500/20 px-4 py-3">
              <p className="text-sm text-indigo-200 leading-relaxed">{report.recommended_practice}</p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
