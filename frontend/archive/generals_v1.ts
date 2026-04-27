// Archived 2026-04-26 — replaced by Hells of Caïssa roster. See app/context/GameContext.tsx.

export type GeneralsV1PersonaId =
  | 'pawnstorm_petey'
  | 'sir_trades_a_lot'
  | 'fianchetto_friar'
  | 'scholars_mate_steve'
  | 'coffeehouse_cassandra'
  | 'the_hippo'
  | 'theory_bro_tobias'
  | 'tactics_tommy'
  | 'positional_patricia'
  | 'bullet_demon_boris'
  | 'endgame_executioner'
  | 'the_prophylact'
  | 'magnus_noah';

export type GeneralsV1PersonaTier = 'caveman' | 'medieval' | 'renaissance' | 'modern' | 'ascended';

interface GeneralsV1PersonaMeta {
  id: GeneralsV1PersonaId;
  name: string;
  quote: string;
  description: string;
  elo: number;
  skillLevel: number;
  tier: GeneralsV1PersonaTier;
  adaptive?: true;
}

export const GENERALS_V1_PERSONAS: GeneralsV1PersonaMeta[] = [
  { id: 'pawnstorm_petey',       tier: 'caveman',     elo: 150,  skillLevel: 0,  name: 'Pawnstorm Petey',           quote: 'I push. That is the whole plan.',                                           description: 'Punish overextension, develop pieces, basic capture tactics' },
  { id: 'sir_trades_a_lot',      tier: 'caveman',     elo: 300,  skillLevel: 1,  name: 'Sir Trades-a-Lot',          quote: "Take. Take. Take. Why won't you take?",                                     description: 'When not to trade, piece activity over material count' },
  { id: 'fianchetto_friar',      tier: 'caveman',     elo: 500,  skillLevel: 2,  name: 'The Fianchetto Friar',      quote: 'I have but one bishop, and it shall see God.',                              description: "Opening principles aren't a substitute for a middlegame plan" },
  { id: 'scholars_mate_steve',   tier: 'medieval',    elo: 700,  skillLevel: 4,  name: "Scholar's Mate Steve",      quote: 'Wayward Queen, baby. Undefeated since 2003.',                               description: 'How to refute cheap opening traps without panicking' },
  { id: 'coffeehouse_cassandra', tier: 'medieval',    elo: 900,  skillLevel: 6,  name: 'Coffeehouse Cassandra',     quote: 'My grandfather played this gambit at the docks. Sacrifice everything.',      description: 'Defending against sacrifices, converting won endgames' },
  { id: 'the_hippo',             tier: 'renaissance', elo: 1100, skillLevel: 8,  name: 'The Hippo',                 quote: 'I move my pawns to the third rank. Then I wait.',                           description: 'How to break down a fortress, prophylaxis, patience' },
  { id: 'theory_bro_tobias',     tier: 'renaissance', elo: 1300, skillLevel: 10, name: 'Theory Bro Tobias',         quote: 'Actually, in the Najdorf English Attack, move 17 is…',                     description: 'Principles over memorization, navigating unfamiliar positions' },
  { id: 'tactics_tommy',         tier: 'modern',      elo: 1500, skillLevel: 12, name: 'Tactics Tommy',             quote: "There's always a combination. Always.",                                     description: 'Calculation, defending against threats, recognizing when no tactic exists' },
  { id: 'positional_patricia',   tier: 'modern',      elo: 1700, skillLevel: 14, name: 'Positional Patricia',       quote: 'I will squeeze you for fifty moves and you will not know why you are losing.', description: 'Positional understanding, recognizing slow strategic pressure' },
  { id: 'bullet_demon_boris',    tier: 'modern',      elo: 1900, skillLevel: 16, name: 'Bullet Demon Boris',        quote: 'Time is the only piece that matters.',                                      description: 'Time management, calm under pressure, punishing speed-induced inaccuracy' },
  { id: 'endgame_executioner',   tier: 'ascended',    elo: 2100, skillLevel: 17, name: 'The Endgame Executioner',   quote: 'The middlegame is a rumor. Trade queens.',                                  description: "Endgame fundamentals, why you can't rely on the middlegame" },
  { id: 'the_prophylact',        tier: 'ascended',    elo: 2300, skillLevel: 19, name: 'The Prophylact',            quote: 'I saw that move three of yours ago. I have already prevented it.',          description: 'Planning, candidate moves, playing with a plan instead of reacting' },
  { id: 'magnus_noah',           tier: 'ascended',    elo: 2700, skillLevel: 20, name: 'Magnus Noah, the Architect', quote: 'You played a good game. I played a different one.',                        description: 'Universal — switches style to target your specific weaknesses', adaptive: true },
];
