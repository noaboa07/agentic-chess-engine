'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Chessboard = dynamic(
  () => import('react-chessboard').then(m => m.Chessboard),
  { ssr: false },
);

type Tab = 'dashboard' | 'weaknesses' | 'puzzles' | 'replay';

// ── Static demo data ──────────────────────────────────────────────────────────

const ELO_HISTORY = [1050, 1080, 1060, 1110, 1095, 1150, 1140, 1200, 1185, 1250, 1240, 1310, 1290, 1360, 1380];

const WEAKNESS_DATA = [
  { label: 'Brilliant', color: 'bg-cyan-400',    pct: 2  },
  { label: 'Great',     color: 'bg-emerald-400', pct: 8  },
  { label: 'Good',      color: 'bg-green-400',   pct: 38 },
  { label: 'Inaccuracy',color: 'bg-yellow-400',  pct: 27 },
  { label: 'Mistake',   color: 'bg-orange-400',  pct: 16 },
  { label: 'Blunder',   color: 'bg-red-400',     pct: 9  },
];

const TRAINING_RECS = [
  { focus: 'Blunder reduction',    drill: 'Solve 5 puzzles before your next game',         icon: '🎯' },
  { focus: 'Opening preparation',  drill: 'Review the Sicilian main line (B20–B99)',        icon: '📖' },
  { focus: 'Endgame technique',    drill: 'Play vs. Rat Main Noah (endgame specialist)',    icon: '♟️' },
];

const DEMO_MOVES = [
  { n: 1,  san: 'e4',   cls: 'good',       cpl: 0  },
  { n: 2,  san: 'e5',   cls: 'good',       cpl: 5  },
  { n: 3,  san: 'Nf3',  cls: 'great',      cpl: 0  },
  { n: 4,  san: 'Nc6',  cls: 'good',       cpl: 8  },
  { n: 5,  san: 'Bc4',  cls: 'good',       cpl: 0  },
  { n: 6,  san: 'Nf6',  cls: 'inaccuracy', cpl: 45 },
  { n: 7,  san: 'Ng5',  cls: 'great',      cpl: 0  },
  { n: 8,  san: 'd5',   cls: 'mistake',    cpl: 112 },
];

const CLS_COLOR: Record<string, string> = {
  brilliant:  'text-cyan-400',
  great:      'text-emerald-400',
  good:       'text-green-400',
  inaccuracy: 'text-yellow-400',
  mistake:    'text-orange-400',
  blunder:    'text-red-400',
};

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

function DashboardTab() {
  const minElo = Math.min(...ELO_HISTORY);
  const maxElo = Math.max(...ELO_HISTORY);
  const range  = maxElo - minElo || 1;
  const W = 480;
  const H = 100;
  const pts = ELO_HISTORY.map((e, i) => {
    const x = (i / (ELO_HISTORY.length - 1)) * W;
    const y = H - ((e - minElo) / range) * (H - 12) - 6;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Games Played', value: '47' },
          { label: 'Win Rate',     value: '61%' },
          { label: 'Avg CPL',      value: '42'  },
          { label: 'Blunders/Game',value: '1.3' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Elo chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">Elo History (last 15 games)</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
          <polyline
            points={pts}
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
          <span>{minElo}</span>
          <span>{maxElo}</span>
        </div>
      </div>

      {/* Training plan */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">Personalized Training Plan</p>
        {TRAINING_RECS.map(r => (
          <div key={r.focus} className="flex items-start gap-3">
            <span className="text-lg shrink-0">{r.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{r.focus}</p>
              <p className="text-xs text-zinc-400">{r.drill}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeaknessesTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">Move Quality Breakdown</p>
        {WEAKNESS_DATA.map(d => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-20 text-xs text-zinc-400 shrink-0">{d.label}</span>
            <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.pct}%` }} />
            </div>
            <span className="w-8 text-right text-xs text-zinc-500 shrink-0">{d.pct}%</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
        <p className="text-xs text-zinc-400 uppercase tracking-wide">Key Weaknesses Identified</p>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li className="flex gap-2"><span className="text-orange-400">•</span> Drops pieces in the middlegame (avg move 22)</li>
          <li className="flex gap-2"><span className="text-yellow-400">•</span> Inaccurate pawn structure choices in the opening</li>
          <li className="flex gap-2"><span className="text-red-400">•</span> Blunders spike in time pressure (under 30s)</li>
        </ul>
      </div>
    </div>
  );
}

function PuzzlesTab() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
          answer: 'Ng5',
          label: 'Fried Liver Attack threat — find the aggressive knight move',
        },
        {
          fen: '4k3/8/4K3/4P3/8/8/8/8 w - - 0 1',
          answer: 'e6',
          label: 'King & pawn endgame — advance the pawn to promote',
        },
      ].map((p, i) => (
        <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <p className="text-xs text-zinc-400">{p.label}</p>
          <Chessboard
            position={p.fen}
            boardWidth={200}
            arePiecesDraggable={false}
            customBoardStyle={{ borderRadius: '4px' }}
          />
          <div className="rounded bg-emerald-900/40 border border-emerald-700/30 px-3 py-1.5 text-xs text-emerald-400">
            Best move: <span className="font-mono font-bold">{p.answer}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReplayTab() {
  const [selected, setSelected] = useState(7);
  const move = DEMO_MOVES[selected];
  const fen = 'r1bqk2r/ppp2ppp/2n5/3np3/2B5/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 6';

  return (
    <div className="flex gap-5 items-start">
      <div className="space-y-3">
        <Chessboard
          position={fen}
          boardWidth={280}
          arePiecesDraggable={false}
          customBoardStyle={{ borderRadius: '4px' }}
        />
        {move && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="font-mono font-bold text-white">{move.san}</span>
              <span className={`capitalize ${CLS_COLOR[move.cls] ?? 'text-zinc-400'}`}>{move.cls}</span>
            </div>
            <p className="text-zinc-500">CPL: {move.cpl}</p>
          </div>
        )}
      </div>
      <div className="rounded-xl border border-zinc-800 overflow-hidden flex-1">
        {DEMO_MOVES.map((m, i) => (
          <button
            key={i}
            onClick={() => setSelected(i)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left border-b border-zinc-800 last:border-0 transition-colors ${
              i === selected ? 'bg-zinc-800' : 'hover:bg-zinc-900/50'
            }`}
          >
            <span className="text-zinc-600 text-xs w-5 shrink-0">{m.n}.</span>
            <span className="font-mono flex-1">{m.san}</span>
            <span className={`text-xs capitalize ${CLS_COLOR[m.cls] ?? 'text-zinc-400'}`}>{m.cls}</span>
            <span className="text-xs text-zinc-600 w-10 text-right">{m.cpl > 0 ? `-${m.cpl}` : '—'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: 'dashboard',  label: 'Dashboard'  },
  { id: 'weaknesses', label: 'Weaknesses' },
  { id: 'puzzles',    label: 'Puzzles'    },
  { id: 'replay',     label: 'Replay'     },
];

export default function DemoPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      {/* Demo banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 text-center">
        <p className="text-xs text-amber-400">
          This is demo data.{' '}
          <Link href="/play" className="underline underline-offset-2 hover:text-amber-300">Sign in</Link>
          {' '}to see your real stats and play against all 13 personas.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Demo — Caïssa</h1>
            <p className="text-xs text-zinc-500 mt-0.5">A preview of your coaching dashboard</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-400 hover:text-zinc-100 transition-all duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            Home
          </Link>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'dashboard'  && <DashboardTab  />}
        {tab === 'weaknesses' && <WeaknessesTab />}
        {tab === 'puzzles'    && <PuzzlesTab    />}
        {tab === 'replay'     && <ReplayTab     />}
      </div>
    </main>
  );
}
