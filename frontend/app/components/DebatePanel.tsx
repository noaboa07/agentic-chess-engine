'use client';

import { useState } from 'react';
import { useGame, type DebateEntry } from '../context/GameContext';

const AGENT_STYLES: Record<string, { label: string; badge: string; text: string }> = {
  Tactician:       { label: 'Tactician',      badge: 'border-orange-500/30 bg-orange-950/40', text: 'text-orange-300'  },
  Positional:      { label: 'Positional',     badge: 'border-blue-500/30 bg-blue-950/40',     text: 'text-blue-300'    },
  Safety:          { label: 'Safety',         badge: 'border-green-500/30 bg-green-950/40',   text: 'text-green-300'   },
  'Final Arbiter': { label: 'Final Arbiter',  badge: 'border-purple-500/30 bg-purple-950/40', text: 'text-purple-300'  },
};

function AgentCard({ entry }: { entry: DebateEntry }) {
  const style = AGENT_STYLES[entry.agent] ?? {
    label: entry.agent,
    badge: 'border-zinc-600 bg-zinc-800',
    text: 'text-zinc-300',
  };
  return (
    <div className={`rounded border ${style.badge} px-3 py-2`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${style.text}`}>
          {style.label}
        </span>
        {entry.move && (
          <span className="text-[10px] font-mono text-zinc-500">{entry.move}</span>
        )}
      </div>
      <p className="text-xs text-zinc-300 leading-relaxed">{entry.argument}</p>
    </div>
  );
}

export default function DebatePanel() {
  const { debateTranscript } = useGame();
  const [open, setOpen] = useState(false);

  if (!debateTranscript || debateTranscript.length === 0) return null;

  return (
    <div className="rounded-md bg-zinc-800 overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <span className="uppercase tracking-wide font-medium">Agent Debate</span>
        <span className="text-zinc-500">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          {debateTranscript.map((entry, i) => (
            <AgentCard key={i} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
