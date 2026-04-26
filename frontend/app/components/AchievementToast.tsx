'use client';

import { useEffect, useState } from 'react';
import type { Achievement } from '../../lib/achievements';
import { TIER_BG, TIER_COLORS } from '../../lib/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  }, [onDismiss]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] w-72 rounded-xl border p-4 shadow-2xl backdrop-blur-sm animate-in slide-in-from-right-4 fade-in ${TIER_BG[achievement.tier]}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{achievement.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold text-white">Achievement Unlocked</p>
            <span className={`text-[10px] font-semibold uppercase tracking-wide ${TIER_COLORS[achievement.tier]}`}>
              {achievement.tier}
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">{achievement.title}</p>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{achievement.description}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-zinc-500 hover:text-white transition-colors text-lg leading-none -mt-0.5"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="mt-3 h-0.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-zinc-400 rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
