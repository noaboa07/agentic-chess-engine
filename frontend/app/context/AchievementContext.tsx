'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ACHIEVEMENT_MAP, type Achievement } from '../../lib/achievements';
import { unlockAchievement } from '../../lib/db';
import { getSettings } from '../../lib/settings';
import { playSfx } from '../../lib/audio';
import AchievementToast from '../components/AchievementToast';

interface AchievementContextValue {
  awardAchievement: (userId: string | null, achievementId: string, metadata?: Record<string, unknown>) => Promise<void>;
}

const AchievementContext = createContext<AchievementContextValue>({
  awardAchievement: async () => {},
});

export function useAchievements(): AchievementContextValue {
  return useContext(AchievementContext);
}

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const awardAchievement = useCallback(async (
    userId: string | null,
    achievementId: string,
    metadata?: Record<string, unknown>,
  ) => {
    if (!userId) return;
    const achievement = ACHIEVEMENT_MAP[achievementId];
    if (!achievement) return;
    try {
      const isNew = await unlockAchievement(userId, achievementId, metadata);
      if (isNew) {
        const { achievementSoundEnabled } = getSettings();
        playSfx('notify', !achievementSoundEnabled);
        setQueue(q => [...q, achievement]);
      }
    } catch {
      // Achievement unlock is non-fatal
    }
  }, []);

  return (
    <AchievementContext.Provider value={{ awardAchievement }}>
      {children}
      {mounted && queue.length > 0 && createPortal(
        <div className="fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-3 items-end">
          {queue.map((achievement) => (
            <AchievementToast
              key={achievement.id}
              achievement={achievement}
              onDismiss={() => setQueue(q => q.filter(a => a.id !== achievement.id))}
            />
          ))}
        </div>,
        document.body,
      )}
    </AchievementContext.Provider>
  );
}
