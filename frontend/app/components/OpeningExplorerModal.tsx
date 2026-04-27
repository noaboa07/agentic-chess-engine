'use client';

import { useEffect, useRef } from 'react';
import type { OpeningExplorerEntry } from '../../lib/openings-explorer';

interface OpeningExplorerModalProps {
  entry: OpeningExplorerEntry;
  onClose: () => void;
}

export default function OpeningExplorerModal({ entry, onClose }: OpeningExplorerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-mono text-zinc-500">{entry.eco}</span>
            <h2 className="text-base font-bold text-white leading-tight">{entry.name}</h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none ml-2">×</button>
        </div>

        {/* Main line */}
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1.5">Main Line</p>
          <div className="flex flex-wrap gap-1.5">
            {entry.mainLine.map((san, i) => (
              <span key={i} className="font-mono text-xs bg-zinc-800 text-zinc-200 px-2 py-0.5 rounded">
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''} {san}
              </span>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">White&apos;s Plan</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{entry.whitePlan}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Black&apos;s Plan</p>
            <p className="text-xs text-zinc-300 leading-relaxed">{entry.blackPlan}</p>
          </div>
          <div className="rounded-lg bg-amber-900/30 border border-amber-700/30 px-3 py-2">
            <p className="text-[10px] text-amber-500 uppercase tracking-wide mb-1">Watch Out</p>
            <p className="text-xs text-amber-200 leading-relaxed">{entry.watchOut}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
