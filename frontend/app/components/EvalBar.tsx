'use client';

interface EvalBarProps {
  evaluation: number | null;
}

export default function EvalBar({ evaluation }: EvalBarProps) {
  const cp = evaluation ?? 0;
  const capped = Math.max(-600, Math.min(600, cp));
  const whitePct = Math.round(50 + (capped / 600) * 40);
  const blackPct = 100 - whitePct;

  const label = Math.abs(capped) < 10
    ? '='
    : capped > 0
    ? `+${(capped / 100).toFixed(1)}`
    : (capped / 100).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex flex-col w-4 h-48 rounded overflow-hidden border border-zinc-700">
        <div className="bg-zinc-800 transition-all duration-300" style={{ height: `${blackPct}%` }} />
        <div className="bg-zinc-100 transition-all duration-300" style={{ height: `${whitePct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-zinc-400">{label}</span>
    </div>
  );
}
