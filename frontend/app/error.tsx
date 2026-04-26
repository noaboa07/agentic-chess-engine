'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="h-full flex flex-col items-center justify-center gap-6 bg-zinc-950 p-8">
      <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-zinc-900 p-8 text-center">
        <p className="text-2xl font-bold text-red-400 mb-2">Something went wrong</p>
        <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
          {error.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
