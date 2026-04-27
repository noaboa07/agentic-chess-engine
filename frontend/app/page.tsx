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
    body: 'Fifteen generals across four Descents, linear unlock logic. Win to advance. Each boss fight opens with a pre-fight briefing — lesson focus, tactical warning, and an in-character taunt. Use Free Play with Teach Mode to prepare — then bring what you learned into the Campaign.',
    spec: '15 GENERALS · 4 DESCENTS · LINEAR UNLOCK · SUPABASE RLS',
    visual: (
      <div className="font-mono text-[11px] space-y-0">
        {[
          'The Outer Hells',
          'The Middle Hells',
          'The Inner Hells',
          'Heralds & Throne',
        ].map((descent, i) => (
          <div key={descent} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`h-2 w-2 rounded-full ${i < 2 ? 'bg-gold' : 'bg-board-border'}`} />
              {i < 3 && <div className={`w-px h-6 ${i < 1 ? 'bg-gold/40' : 'bg-board-border'}`} />}
            </div>
            <span className={i < 2 ? 'text-gold' : 'text-ink-tertiary'}>
              {descent}
            </span>
          </div>
        ))}
      </div>
    ),
  },
] as const;

// ── Quick Access links ────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    href: '/campaign',
    title: 'Campaign',
    description: 'Descend through the 64 Hells and defeat 15 Generals.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
        <path d="M4 22h16"/>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
      </svg>
    ),
  },
  {
    href: '/play',
    title: 'Free Play',
    description: 'Pick any persona and play at your own pace.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
  },
  {
    href: '/dashboard',
    title: 'Dashboard',
    description: 'Track your Elo history, CPL trends, and win rate.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    href: '/puzzles',
    title: 'Puzzles',
    description: 'Train on blunders pulled from your own games.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/shop',
    title: 'Shop',
    description: 'Unlock board themes as your Elo grows.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    href: '/profile',
    title: 'Profile',
    description: 'Your stats, achievements, and full game history.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];


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
              Fifteen generals.<br />
              <em>One descent.</em>
            </h1>
            <p className="text-[16px] text-ink-secondary max-w-[520px] leading-relaxed mt-6">
              An AI chess platform where every opponent is a fully autonomous agent — calibrated Elo, distinct personality, real-time coaching. Descend through the Hells of Caïssa, from Pawnstorm Petey to Dread Hades.
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

        {/* ── Quick Access ──────────────────────────────────────────────── */}
        <section className="py-16 border-t border-board-border">
          <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mb-2">
            Explore
          </p>
          <h2 className="font-serif text-2xl font-medium text-ink-primary mb-8">
            Everything in one place.
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col gap-3 p-5 rounded-xl border border-board-border bg-board-surface hover:bg-board-surface-elevated hover:border-gold/40 transition-all duration-200"
              >
                <div className="text-gold">{link.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary group-hover:text-gold transition-colors leading-snug">
                    {link.title}
                  </p>
                  <p className="text-[13px] text-ink-tertiary mt-1 leading-snug">
                    {link.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Persona Ladder ────────────────────────────────────────────── */}
        <section className="py-16 border-t border-board-border">
          <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest">
            The Ladder
          </p>
          <h2 className="font-serif text-2xl font-medium text-ink-primary mt-1 mb-8">
            From chaos to the Abyss, in fifteen steps.
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


      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 flex flex-col items-center gap-6">
        <h2 className="font-serif text-3xl font-medium text-ink-primary text-center">
          Ready to descend into the 64 Hells?
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
              <Link href="/campaign"  className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Campaign</Link>
              <Link href="/play"      className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Free Play</Link>
              <Link href="/dashboard" className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Dashboard</Link>
              <Link href="/puzzles"   className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Puzzles</Link>
              <Link href="/shop"      className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Shop</Link>
              <Link href="/profile"   className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Profile</Link>
              <Link href="/demo"      className="text-sm text-ink-secondary hover:text-ink-primary transition-colors">Demo</Link>
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
