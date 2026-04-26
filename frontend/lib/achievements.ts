export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementConditionType = 'game' | 'puzzle' | 'campaign' | 'feature' | 'milestone';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  conditionType: AchievementConditionType;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Win your first game against an AI opponent.',
    icon: '🩸',
    tier: 'bronze',
    conditionType: 'game',
  },
  {
    id: 'no_mercy',
    title: 'No Mercy',
    description: 'Win a game without making a single blunder.',
    icon: '⚔️',
    tier: 'silver',
    conditionType: 'game',
  },
  {
    id: 'survivor',
    title: 'Survivor',
    description: 'Win a game after making at least one mistake or blunder.',
    icon: '🛡️',
    tier: 'bronze',
    conditionType: 'game',
  },
  {
    id: 'blunder_breaker',
    title: 'Blunder Breaker',
    description: 'Win a game with zero blunders (mistakes are allowed).',
    icon: '💎',
    tier: 'silver',
    conditionType: 'game',
  },
  {
    id: 'endgame_cleaner',
    title: 'Endgame Cleaner',
    description: 'Win a game that lasted more than 40 moves.',
    icon: '♟️',
    tier: 'silver',
    conditionType: 'game',
  },
  {
    id: 'comeback_king',
    title: 'Comeback King',
    description: 'Win after your position was evaluated at −300 cp or worse.',
    icon: '👑',
    tier: 'gold',
    conditionType: 'game',
  },
  {
    id: 'time_survivor',
    title: 'Time Survivor',
    description: 'Win a timed game with under 10 seconds remaining on your clock.',
    icon: '⏱️',
    tier: 'gold',
    conditionType: 'game',
  },
  {
    id: 'puzzle_solver',
    title: 'Puzzle Solver',
    description: 'Solve your first generated puzzle.',
    icon: '🧩',
    tier: 'bronze',
    conditionType: 'puzzle',
  },
  {
    id: 'tactic_finder',
    title: 'Tactic Finder',
    description: 'Solve 10 puzzles generated from your own games.',
    icon: '🔭',
    tier: 'silver',
    conditionType: 'puzzle',
  },
  {
    id: 'boss_slayer',
    title: 'Boss Slayer',
    description: 'Defeat a campaign boss for the first time.',
    icon: '🏆',
    tier: 'silver',
    conditionType: 'campaign',
  },
  {
    id: 'ladder_climber',
    title: 'Ladder Climber',
    description: 'Defeat 5 campaign bosses.',
    icon: '🪜',
    tier: 'gold',
    conditionType: 'campaign',
  },
  {
    id: 'god_slayer',
    title: 'God Slayer',
    description: 'Defeat God Noah — the final boss at 2700 Elo.',
    icon: '⚡',
    tier: 'platinum',
    conditionType: 'campaign',
  },
  {
    id: 'scholar',
    title: 'Scholar',
    description: 'Watch a full game replay from your history.',
    icon: '📚',
    tier: 'bronze',
    conditionType: 'feature',
  },
  {
    id: 'opening_student',
    title: 'Opening Student',
    description: 'Open the Opening Explorer during a game.',
    icon: '📖',
    tier: 'bronze',
    conditionType: 'feature',
  },
  {
    id: 'coachable',
    title: 'Coachable',
    description: 'Use the coach explain features (Why? / Explain Why Not) 5 times.',
    icon: '🎓',
    tier: 'silver',
    conditionType: 'feature',
  },
];

export const ACHIEVEMENT_MAP: Record<string, Achievement> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.id, a]),
);

export const TIER_COLORS: Record<AchievementTier, string> = {
  bronze:   'text-amber-600',
  silver:   'text-zinc-300',
  gold:     'text-yellow-400',
  platinum: 'text-cyan-400',
};

export const TIER_BG: Record<AchievementTier, string> = {
  bronze:   'bg-amber-900/30 border-amber-700/40',
  silver:   'bg-zinc-800/60 border-zinc-600/40',
  gold:     'bg-yellow-900/30 border-yellow-700/40',
  platinum: 'bg-cyan-900/30 border-cyan-600/40',
};
