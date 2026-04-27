const LINES = [
  {
    fn:    'stockfish.eval()',
    args:  'depth=15',
    arrow: '→',
    value: '+0.32 (White)',
  },
  {
    fn:    'coach.generate()',
    args:  'persona="oracle_nyx_the_paranoid"',
    arrow: '→',
    value: '"You walked right into that."',
  },
  {
    fn:    'debate.synthesize()',
    args:  null,
    arrow: '→',
    value: 'Tactician wins · line 14',
  },
] as const;

export default function ChessBoardHero() {
  return (
    <div className="w-full max-w-[440px] rounded-xl border border-board-border bg-board-surface p-5 font-mono text-[13px] leading-7 select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-chess-loss/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-chess-warn/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-chess-win/60" />
        <span className="ml-3 text-[10px] text-ink-tertiary uppercase tracking-widest">
          caissa · engine output
        </span>
      </div>

      {/* Log lines */}
      <div className="space-y-1">
        {LINES.map((line, i) => (
          <div key={i} className="flex flex-wrap items-baseline gap-x-1.5 text-ink-secondary">
            <span className="text-ink-tertiary shrink-0">►</span>
            <span className="text-gold shrink-0">{line.fn}</span>
            {line.args && (
              <span className="text-ink-tertiary shrink-0">{line.args}</span>
            )}
            <span className="text-ink-tertiary shrink-0">{line.arrow}</span>
            <span className="text-ink-primary">{line.value}</span>
          </div>
        ))}

        {/* Blinking cursor on last line */}
        <div className="flex items-center gap-x-1.5 mt-1">
          <span className="text-ink-tertiary">►</span>
          <span className="inline-block h-[14px] w-[7px] rounded-sm bg-chess-win animate-pulse" />
        </div>
      </div>

      {/* Footer badge */}
      <div className="mt-5 pt-4 border-t border-board-border flex items-center gap-4 text-[10px] text-ink-tertiary uppercase tracking-widest">
        <span>Stockfish 16</span>
        <span>·</span>
        <span>Groq llama-3.3-70b</span>
        <span>·</span>
        <span>depth=15</span>
      </div>
    </div>
  );
}
