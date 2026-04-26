'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'info' | 'success';
  onDismiss: () => void;
}

const STYLES = {
  error:   'border-red-700/50 bg-red-950/80 text-red-300',
  info:    'border-zinc-700 bg-zinc-800/90 text-zinc-200',
  success: 'border-emerald-700/50 bg-emerald-950/80 text-emerald-300',
};

const ICONS = { error: '⚠️', info: 'ℹ️', success: '✓' };

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm text-sm max-w-sm ${STYLES[type]}`}>
      <span>{ICONS[type]}</span>
      <p className="flex-1">{message}</p>
      <button onClick={onDismiss} className="shrink-0 text-xs opacity-60 hover:opacity-100 transition-opacity">✕</button>
    </div>
  );
}
