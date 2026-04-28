'use client';

import { useEffect, useState } from 'react';

interface Props {
  text: string;
  persistent?: boolean;
  duration?: number;
}

export default function PersonaSpeechBubble({ text, persistent = false, duration = 4000 }: Props) {
  const [opacity, setOpacity] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const fadeIn = setTimeout(() => setOpacity(1), 20);
    if (persistent) return () => clearTimeout(fadeIn);

    const fadeOut = setTimeout(() => setOpacity(0), duration - 600);
    const hide = setTimeout(() => setHidden(true), duration);

    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fadeOut);
      clearTimeout(hide);
    };
  }, [persistent, duration]);

  if (hidden) return null;

  return (
    <div
      style={{ opacity, transition: 'opacity 500ms ease-in-out' }}
      className="absolute bottom-full left-0 mb-3 z-10 w-64 pointer-events-none"
    >
      <div className="relative rounded-xl bg-zinc-800 border border-white/10 px-3 py-2 shadow-xl">
        <p className="text-xs text-zinc-200 leading-relaxed italic">&ldquo;{text}&rdquo;</p>
        <span
          className="absolute top-full left-5"
          style={{
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid rgb(39 39 42)',
          }}
        />
      </div>
    </div>
  );
}
