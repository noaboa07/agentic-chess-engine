import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="h-full overflow-y-auto bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 flex flex-col items-center gap-12">

        {/* Hero */}
        <div className="text-center space-y-3">
          <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400">AI Chess Coaching Platform</p>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            The Noah Verse
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto">
            13 hand-crafted AI personas. Real-time Stockfish analysis. A coach that explains every move.
          </p>
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
            <span className="text-2xl">🏆</span>
            <h2 className="font-semibold text-sm">Campaign</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">Climb 13 AI opponents from Roomba to God. Unlock the next boss when you win.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
            <span className="text-2xl">📊</span>
            <h2 className="font-semibold text-sm">Analysis</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">Every move gets a centipawn score, classification, and a coaching comment in your opponent&apos;s voice.</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
            <span className="text-2xl">🧩</span>
            <h2 className="font-semibold text-sm">Puzzles</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">Auto-generated from your own blunders. Fix the mistakes you actually make.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 w-56">
          <Link
            href="/campaign"
            className="w-full rounded-xl bg-indigo-600 px-8 py-4 text-center text-base font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
          >
            Start Campaign
          </Link>
          <Link
            href="/play"
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-8 py-3 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Quick Play
          </Link>
          <Link
            href="/demo"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
          >
            View Demo (no sign-in required)
          </Link>
          <p className="text-[11px] text-zinc-600 text-center">
            No account?{' '}
            <Link href="/play" className="text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2">
              Play as guest
            </Link>
          </p>
        </div>

        {/* Nav strip */}
        <nav className="flex items-center gap-6 text-xs text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
          <Link href="/profile"   className="hover:text-zinc-300 transition-colors">Profile</Link>
          <Link href="/puzzles"   className="hover:text-zinc-300 transition-colors">Puzzles</Link>
          <Link href="/shop"      className="hover:text-zinc-300 transition-colors">Shop</Link>
          <Link href="/settings"  className="hover:text-zinc-300 transition-colors">Settings</Link>
        </nav>

      </div>
    </main>
  );
}
