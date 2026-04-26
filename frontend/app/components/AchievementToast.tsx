'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Achievement, AchievementTier } from '../../lib/achievements';
import { TIER_COLORS } from '../../lib/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

const TIER_GLOW: Record<AchievementTier, string> = {
  bronze:   '0 0 24px rgba(180,120,60,0.45), 0 0 48px rgba(180,120,60,0.15)',
  silver:   '0 0 24px rgba(160,170,190,0.45), 0 0 48px rgba(160,170,190,0.15)',
  gold:     '0 0 28px rgba(250,200,0,0.5),   0 0 56px rgba(250,200,0,0.15)',
  platinum: '0 0 32px rgba(167,139,250,0.6), 0 0 64px rgba(167,139,250,0.2)',
};

const TIER_BAR: Record<AchievementTier, string> = {
  bronze:   'bg-amber-600',
  silver:   'bg-slate-300',
  gold:     'bg-yellow-400',
  platinum: 'bg-violet-400',
};

const TIER_BORDER: Record<AchievementTier, string> = {
  bronze:   'border-amber-700/50',
  silver:   'border-slate-500/50',
  gold:     'border-yellow-500/50',
  platinum: 'border-violet-500/60',
};

export default function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  const dismiss = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(onDismiss, 280);
  };

  const handleNavigate = () => {
    dismiss();
    router.push('/profile');
  };

  useEffect(() => {
    const start = Date.now();
    const duration = 4200;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        dismiss();
      }
    }, 50);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] w-80 rounded-xl border shadow-2xl backdrop-blur-md ${TIER_BORDER[achievement.tier]} bg-zinc-900/90 ${
        exiting
          ? 'animate-[slideDownFadeOut_0.28s_ease-in_forwards]'
          : 'animate-[slideUpFadeIn_0.3s_ease-out]'
      }`}
      style={{ boxShadow: TIER_GLOW[achievement.tier] }}
      role="alert"
    >
      {/* Clickable content area */}
      <button
        onClick={handleNavigate}
        className="w-full text-left p-4 group"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none mt-0.5 shrink-0">{achievement.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[11px] font-bold text-zinc-300">✨ Achievement Unlocked</p>
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${TIER_COLORS[achievement.tier]}`}>
                {achievement.tier}
              </span>
            </div>
            <p className="text-sm font-bold text-white leading-tight">{achievement.title}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{achievement.description}</p>
            <p className="text-[10px] text-zinc-600 mt-1 group-hover:text-zinc-400 transition-colors">
              Tap to view all achievements →
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); dismiss(); }}
            className="text-zinc-600 hover:text-zinc-300 transition-colors text-base leading-none -mt-0.5 shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </button>

      {/* Progress bar */}
      <div className="mx-4 mb-3 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-none ${TIER_BAR[achievement.tier]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
