'use client';

import Image from 'next/image';
import { PERSONAS } from '../../context/GameContext';

export default function PersonaLadder() {
  return (
    <>
      {/* Desktop grid */}
      <div className="hidden sm:grid grid-cols-7 border border-board-border rounded-xl overflow-hidden">
        {PERSONAS.map((p, i) => (
          <div
            key={p.id}
            className={`group flex flex-col items-center gap-2 p-4 text-center transition-colors hover:bg-board-surface-elevated cursor-default ${
              i < PERSONAS.length - 1 ? 'border-r border-board-border' : ''
            }`}
          >
            <Image
              src={`/avatars/${p.id}.svg`}
              alt={p.name}
              width={48}
              height={48}
              className="rounded-full border border-board-border bg-board-surface"
            />
            <div className="min-w-0 w-full">
              <p className="font-serif text-xs font-medium text-ink-primary leading-tight group-hover:text-gold transition-colors truncate">
                {p.name}
              </p>
              <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest group-hover:text-gold transition-colors mt-0.5">
                {p.elo}
              </p>
              <p className="text-[10px] text-ink-tertiary leading-snug mt-1 hidden lg:block">
                {p.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile horizontal scroll */}
      <div className="sm:hidden flex overflow-x-auto snap-x snap-mandatory gap-0 border border-board-border rounded-xl">
        {PERSONAS.map((p, i) => (
          <div
            key={p.id}
            className={`snap-start shrink-0 w-36 flex flex-col items-center gap-2 p-4 text-center ${
              i < PERSONAS.length - 1 ? 'border-r border-board-border' : ''
            }`}
          >
            <Image
              src={`/avatars/${p.id}.svg`}
              alt={p.name}
              width={44}
              height={44}
              className="rounded-full border border-board-border bg-board-surface"
            />
            <div className="min-w-0 w-full">
              <p className="font-serif text-xs font-medium text-ink-primary leading-tight truncate">
                {p.name}
              </p>
              <p className="font-mono text-[10px] text-ink-tertiary uppercase tracking-widest mt-0.5">
                {p.elo}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
