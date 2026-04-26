'use client';

interface BlunderConfirmModalProps {
  cpl: number;
  bestMove: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BlunderConfirmModal({ cpl, bestMove, onConfirm, onCancel }: BlunderConfirmModalProps) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 rounded">
      <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-6 max-w-[300px] mx-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <h3 className="text-base font-semibold text-amber-400">Potential Blunder</h3>
        </div>
        <p className="text-sm text-zinc-300 mb-2">
          This move loses{' '}
          <span className="font-semibold text-red-400">{cpl} centipawns</span>.
        </p>
        {bestMove && (
          <p className="text-xs text-zinc-400 mb-4">
            Better:{' '}
            <span className="font-mono text-emerald-400">{bestMove}</span>
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-600 transition-colors"
          >
            Take it back
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-amber-600/80 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
          >
            Play anyway
          </button>
        </div>
      </div>
    </div>
  );
}
