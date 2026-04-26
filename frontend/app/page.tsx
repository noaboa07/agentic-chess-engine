import Link from 'next/link';
import ChessBoardHero from './components/landing/ChessBoardHero';
import PersonaLadder from './components/landing/PersonaLadder';
import LandingNav from './components/landing/LandingNav';

// ── Feature rows data ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'AI Coaching & Teach Mode',
    body: 'Every move classified as Brilliant through Blunder via Stockfish centipawn loss. The coach speaks in the persona\'s voice, injects your historical weakness patterns, and explains any move on demand — all gated behind real CPL thresholds so the LLM only fires when it matters.',
    spec: 'STOCKFISH MULTIPV=3 · GROQ LLAMA-3.3-70B · LRU CACHE 512',
    visual: (
      <div className="flex flex-col gap-2">
        {[
          { label: 'BRILLIANT', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
          { label: 'GOOD',      color: 'text-chess-win border-chess-win/30 bg-chess-win/10' },
          { label: 'INACCURACY',color: 'text-chess-warn border-chess-warn/30 bg-chess-warn/10' },
          { label: 'BLUNDER',   color: 'text-chess-loss border-chess-loss/30 bg-chess-loss/10' },
        ].map(b => (
          <div key={b.label} className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded border ${b.color} w-fit`}>
            {b.label}
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Three-Agent Move Debate',
    body: 'When you blunder (CPL > 50), three internal agents argue the position using Stockfish MultiPV candidates. Tactician argues material gain. Positional argues structure. Safety argues king exposure. A Final Arbiter synthesizes one verdict — one Groq call, zero redundancy.',
    spec: '3 AGENTS · 1 GROQ SYNTHESIS CALL PER MOVE · CPL > 50 GATE',
    visual: (
      <div className="font-mono text-[12px] space-y-2 border border-board-border rounded-xl p-4 bg-board-surface">
        {[
          { agent: 'Tactician', line: 'Nf3 wins the exchange.' },
          { agent: 'Positional', line: 'Nd4 dominates the center.' },
          { agent: 'Safety', line: 'Stay solid — Ke2 first.' },
        ].map(a => (
          <div key={a.agent} className="flex gap-2 text-ink-secondary">
            <span className="text-ink-tertiary shrink-0">{a.agent}</span>
            <span className="text-ink-tertiary">/</span>
            <span>{a.line}</span>
          </div>
        ))}
        <div className="pt-2 border-t border-board-border text-gold flex gap-2">
          <span>Arbiter</span>
          <span className="text-ink-tertiary">/</span>
          <span className="text-ink-secondary">Tactician wins.</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Replay & Weakness Tracking',
    body: 'Every completed game is saved with a full move record — FEN, SAN, CPL, classification, best move, eval, and coach commentary. Step through any game on a live board, scrub the eval bar, and toggle "Mistakes Only" to jump between your errors. Your weakness profile surfaces recurring patterns across your last 20 games.',
    spec: 'CPL TRACKING · EVAL BAR · WEAKNESS HEATMAP · KEYBOARD NAV',
    visual: (
      <div className="font-mono text-[12px] border border-board-border rounded-xl overflow-hidden bg-board-surface">
        {[
          { n: 14, san: 'Nxe5', cls: 'BLUNDER',    cpl: 210, color: 'text-chess-loss' },
          { n: 15, san: 'Qd4',  cls: 'INACCURACY', cpl: 55,  color: 'text-chess-warn' },
          { n: 18, san: 'O-O',  cls: 'GOOD',        cpl: 8,   color: 'text-chess-win'  },
        ].map(m => (
          <div key={m.n} className="flex items-center gap-3 px-4 py-2.5 border-b border-board-border last:border-0">
            <span className="text-ink-tertiary w-5 shrink-0">{m.n}.</span>
            <span className="text-ink-primary flex-1">{m.san}</span>
            <span className={`text-[10px] uppercase ${m.color}`}>{m.cls}</span>
            <span className="text-ink-tertiary w-8 text-right">-{m.cpl}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: 'Campaign Progression',
    body: 'Thirteen bosses, five named tiers, linear unlock logic. Win to advance. Each boss fight opens with a pre-fight briefing — lesson focus, tactical warning, and a taunt. Campaign games auto-enable Teach Mode so the coach is always active as you climb.',
    spec: '13 BOSSES · 5 TIERS · TEACH MODE AUTO-ENABLED · SUPABASE RLS',
    visual: (
      <div className="font-mono text-[11px] space-y-0">
        {[
          'Beginner Chaos',
          'Fundamentals',
          'Tactical Arena',
          'Positional Masters',
          'Final Bosses',
        ].map((tier, i) => (
          <div key={tier} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`h-2 w-2 rounded-full ${i < 3 ? 'bg-gold' : 'bg-board-border'}`} />
              {i < 4 && <div className={`w-px h-6 ${i < 2 ? 'bg-gold/40' : 'bg-board-border'}`} />}
            </div>
            <span className={i < 3 ? 'text-gold' : 'text-ink-tertiary'}>
              {tier}
            </span>
          </div>
        ))}
      </div>
    ),
  },
] as const;

// ── Architecture ASCII ────────────────────────────────────────────────────────

const ARCH_LINES = [
  '┌─────────────────────────────────────────────────────────────────────┐',
  '│                             Browser                                  │',
  '│  Next.js 14 App Router                                               │',
  '│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │',
  '│  │  Lobby   │ │ChessBoard │ │CoachPanel│ │Dashboard │ │Campaign  │ │',
  '│  └──────────┘ └───────────┘ └──────────┘ └──────────┘ └──────────┘ │',
  '│     GameContext · AchievementContext · AuthContext                    │',
  '└──────────────────────────┬──────────────────────────────────────────┘',
  '                           │ HTTP REST (rate-limited · slowapi)',
  '┌──────────────────────────▼──────────────────────────────────────────┐',
  '│                     FastAPI (Python 3.11)                            │',
  '│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  │',
  '│  │ Stockfish  │  │  coach.py   │  │debate.py │  │  cache.py    │  │',
  '│  │  depth=15  │  │  (Groq LLM) │  │(3-agent) │  │  (LRU 512)  │  │',
  '│  └────────────┘  └─────────────┘  └──────────┘  └──────────────┘  │',
  '└──────────────────────────┬──────────────────────────────────────────┘',
  '                           │',
  '              ┌────────────▼────────────┐',
  '              │         Supabase         │',
  '              │  users · games · puzzles │',
  '              │  campaign_progress       │',
  '              │  user_achievements       │',
  '              │  RLS on all tables       │',
  '              └──────────────────────────┘',
];

const GOLD_WORDS = ['Stockfish', 'Groq', 'Supabase', 'FastAPI', 'Next.js'];

function highlightArch(line: string): React.ReactNode {
  let remaining = line;
  const parts: React.ReactNode[] = [];
  let key = 0;

  while (remaining.length > 0) {
    let earliest = -1;
    let matchedWord = '';
    for (const word of GOLD_WORDS) {
      const idx = remaining.indexOf(word);
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
        matchedWord = word;
      }
    }
    if (earliest === -1) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
    if (earliest > 0) parts.push(<span key={key++}>{remaining.slice(0, earliest)}</span>);
    parts.push(<span key={key++} className="text-gold">{matchedWord}</span>);
    remaining = remaining.slice(earliest + matchedWord.length);
  }
  return <>{parts}</>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-board-bg text-ink-primary">

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <LandingNav />

      <main className="mx-auto max-w-6xl px-6 lg:px-10">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-28 grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <p className="font-mono text-[11px] text-ink-tertiary uppercase tracking-widest mb-6">
              v1.0 · Built with Stockfish 16
            </p>
            <h1 className="font-serif text-[62px] sm:text-[72px] leading-[1.04] font-medium text-ink-primary">
              Thirteen opponents.<br />
              <em>One engine.</em>
            </h1>
            <p className="text-[16px] text-ink-secondary max-w-[520px] leading-relaxed mt-6">
              An AI chess platform where every opponent is a fully autonomous agent — calibrated Elo, distinct personality, real-time coaching. From a 150-rated Roomba to a 2700-rated god.
            </p>
            <div className="flex items-center gap-3 mt-8 flex-wrap">
              <Link
                href="/campaign"
                className="bg-gold text-board-bg px-6 py-3 rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors"
              >
                Start Campaign
              </Link>
              <Link
                href="/play"
                className="border border-board-border text-ink-secondary px-6 py-3 rounded-lg text-sm hover:text-ink-primary hover:border-ink-secondary transition-colors"
              >
                Free Play
              </Link>
              <Link
                href="/demo"
                className="text-sm text-ink-tertiary hover:text-ink-secondary transition-colors underline underline-offset-2"
              >
                View Demo
              </Link>
            </div>
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mt-4">
              No sign-in required · Guest mode available
            </p>
          </div>

          {/* Right — terminal hero */}
          <div className="lg:col-span-2 order-1 lg:order-2 flex justify-center lg:justify-end">
            <ChessBoardHero />
          </div>
        </section>

        {/* ── Persona Ladder ────────────────────────────────────────────── */}
        <section className="py-16 border-t border-board-border">
          <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest">
            The Ladder
          </p>
          <h2 className="font-serif text-2xl font-medium text-ink-primary mt-1 mb-8">
            From chaos to god, in thirteen steps.
          </h2>
          <PersonaLadder />
        </section>

        {/* ── Feature rows ──────────────────────────────────────────────── */}
        <section className="py-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="grid lg:grid-cols-2 gap-12 items-center py-14 border-t border-board-border"
            >
              {/* Text side */}
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <h3 className="font-serif text-xl font-medium text-ink-primary leading-snug">
                  {f.title}
                </h3>
                <p className="text-[15px] text-ink-secondary leading-relaxed mt-3">
                  {f.body}
                </p>
                <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mt-4">
                  {f.spec}
                </p>
              </div>

              {/* Visual side */}
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                {f.visual}
              </div>
            </div>
          ))}
        </section>

        {/* ── Architecture ──────────────────────────────────────────────── */}
      </main>

      <section className="bg-board-surface border-y border-board-border py-16 mt-8">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mb-6">
            Architecture
          </p>
          <pre className="font-mono text-[11px] text-ink-secondary leading-relaxed overflow-x-auto">
            {ARCH_LINES.map((line, i) => (
              <div key={i}>{highlightArch(line)}</div>
            ))}
          </pre>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10 pt-8 border-t border-board-border">
            {[
              { n: '13',    label: 'Personas' },
              { n: '15',    label: 'Achievements' },
              { n: '10',    label: 'Board Themes' },
              { n: '520ms', label: 'p95 Latency' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-mono text-2xl font-semibold text-gold">{s.n}</p>
                <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mt-6">
            Row Level Security · Rate Limited · Guest Mode · Demo Route · TypeScript + Python
          </p>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 flex flex-col items-center gap-6">
        <h2 className="font-serif text-3xl font-medium text-ink-primary text-center">
          Ready to lose to a Roomba?
        </h2>
        <Link
          href="/campaign"
          className="bg-gold text-board-bg px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-gold/90 transition-colors"
        >
          Start Campaign
        </Link>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-board-border py-10">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mb-3">Product</p>
            <div className="flex flex-col gap-2">
              <Link href="/campaign" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Campaign</Link>
              <Link href="/demo"     className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Demo</Link>
              <Link href="/play"     className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Quick Play</Link>
              <Link href="/settings" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Settings</Link>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mb-3">Stack</p>
            <div className="flex flex-col gap-2 text-sm text-ink-tertiary">
              <span>Next.js 14 · TypeScript</span>
              <span>FastAPI · Python 3.11</span>
              <span>Stockfish · Groq LLM</span>
              <span>Supabase · Tailwind CSS</span>
            </div>
          </div>
          <div>
            <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mb-3">Author</p>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/noaboa07"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
              >
                GitHub — noaboa07
              </a>
              <a
                href="https://github.com/noaboa07/agentic-chess-engine"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
              >
                Repository
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6 lg:px-10 mt-8 pt-6 border-t border-board-border">
          <p className="font-mono text-[10px] text-ink-tertiary">
            MIT © Noah Russell · Built with TypeScript, Python, and an unhealthy obsession with chess.
          </p>
        </div>
      </footer>

    </div>
  );
}
