// Archived 2026-04-26 — replaced by Generals roster. See app/context/GameContext.tsx.

export type LegacyPersonaId =
  | 'roomba_noah'
  | 'clown_noah'
  | 'tilted_noah'
  | 'sleep_deprived_noah'
  | 'gym_bro_noah'
  | 'coffee_shop_noah'
  | 'tech_bro_noah'
  | 'rat_main_noah'
  | 'grandmaster_twitch_noah'
  | 'gpa_noah'
  | 'devil_noah'
  | 'angel_noah'
  | 'god_noah';

interface LegacyPersonaMeta {
  id: LegacyPersonaId;
  name: string;
  description: string;
  elo: number;
  skillLevel: number;
}

export const LEGACY_PERSONAS: LegacyPersonaMeta[] = [
  { id: 'roomba_noah',              name: 'Roomba Noah',             description: 'Bumbles blindly around the board',          elo: 150,  skillLevel: 0  },
  { id: 'clown_noah',               name: 'Clown Noah',              description: 'Absolute chaos agent',                      elo: 300,  skillLevel: 0  },
  { id: 'tilted_noah',              name: 'Tilted Noah',             description: '15-game losing streak, emotionally broken', elo: 500,  skillLevel: 1  },
  { id: 'sleep_deprived_noah',      name: 'Sleep-Deprived Noah',     description: 'Grad student, 40hrs no sleep',              elo: 700,  skillLevel: 2  },
  { id: 'gym_bro_noah',             name: 'Gym Bro Noah',            description: 'Chess is a physical sport, obviously',      elo: 900,  skillLevel: 3  },
  { id: 'coffee_shop_noah',         name: 'Coffee Shop Noah',        description: 'Iced latte, AirPods in, vaguely present',   elo: 1100, skillLevel: 5  },
  { id: 'tech_bro_noah',            name: 'Tech Bro Noah',           description: '$1k board, Python script, Scholar\'s Mate', elo: 1300, skillLevel: 7  },
  { id: 'rat_main_noah',            name: 'Rat Main Noah',           description: 'Toxic streamer, blames lag',                elo: 1500, skillLevel: 9  },
  { id: 'grandmaster_twitch_noah',  name: 'Grandmaster Twitch Noah', description: '300 APM, bullet brain in classical',        elo: 1700, skillLevel: 11 },
  { id: 'gpa_noah',                 name: '4.0 GPA Noah',            description: 'Academic, zero intuition',                  elo: 1900, skillLevel: 13 },
  { id: 'devil_noah',               name: 'Devil Noah',              description: 'Ruthless gatekeeper, wants you to quit',    elo: 2100, skillLevel: 15 },
  { id: 'angel_noah',               name: 'Angel Noah',              description: 'Condescending saint, toxically positive',   elo: 2300, skillLevel: 17 },
  { id: 'god_noah',                 name: 'God Noah',                description: 'Omniscient AI Architect, solves chess',     elo: 2700, skillLevel: 20 },
];
