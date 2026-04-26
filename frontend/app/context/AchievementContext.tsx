'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { ACHIEVEMENT_MAP, type Achievement } from '../../lib/achievements';
import { unlockAchievement } from '../../lib/db';
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
  const [pending, setPending] = useState<Achievement | null>(null);

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
      if (isNew) setPending(achievement);
    } catch {
      // Achievement unlock is non-fatal
    }
  }, []);

  return (
    <AchievementContext.Provider value={{ awardAchievement }}>
      {children}
      {pending && (
        <AchievementToast
          achievement={pending}
          onDismiss={() => setPending(null)}
        />
      )}
    </AchievementContext.Provider>
  );
}
