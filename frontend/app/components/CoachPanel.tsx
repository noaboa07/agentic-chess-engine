'use client';

import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

type BackendStatus = 'checking' | 'online' | 'offline';

export default function CoachPanel() {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(3000) });
        setStatus(res.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };
    check();
  }, []);

  const statusColor: Record<BackendStatus, string> = {
    checking: 'bg-yellow-500',
    online: 'bg-green-500',
    offline: 'bg-red-500',
  };

  return (
    <div className="flex flex-col h-full min-h-[560px] w-full max-w-sm rounded-lg border border-white/10 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">AI Coach</h2>
        <span className="flex items-center gap-2 text-xs text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${statusColor[status]}`} />
          {status === 'checking' ? 'Connecting…' : status === 'online' ? 'Backend online' : 'Backend offline'}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500 text-center">
          Analysis and coaching will appear here once the AI engine is connected.
        </p>
      </div>
    </div>
  );
}
