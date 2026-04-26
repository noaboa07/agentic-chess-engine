'use client';

import { createContext, useCallback, useContext, useState } from 'react';
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

  const handleDismiss = useCallback(() => {
    setQueue(q => q.slice(1));
  }, []);

  return (
    <AchievementContext.Provider value={{ awardAchievement }}>
      {children}
      {queue[0] && (
        <AchievementToast
          achievement={queue[0]}
          onDismiss={handleDismiss}
        />
      )}
    </AchievementContext.Provider>
  );
}
