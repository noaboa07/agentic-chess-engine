import Link from 'next/link';
import LogoutButton from './components/LogoutButton';

export default function LandingPage() {
  return (
    <main className="h-full flex flex-col items-center justify-center gap-8 bg-zinc-950">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-white tracking-tight">The Noah Verse</h1>
        <p className="mt-3 text-lg text-zinc-400">13 AI personas. One board. Zero mercy.</p>
      </div>

      <div className="flex flex-col gap-3 w-52">
        <Link
          href="/play"
          className="rounded-xl bg-indigo-600 px-8 py-4 text-center text-lg font-bold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-900/40"
        >
          Play
        </Link>
        <Link
          href="/settings"
          className="rounded-xl border border-white/10 bg-zinc-900 px-8 py-3 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Settings
        </Link>
        <Link
          href="/shop"
          className="rounded-xl border border-white/10 bg-zinc-900 px-8 py-3 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Shop
        </Link>
      </div>
      <LogoutButton />
    </main>
  );
}
