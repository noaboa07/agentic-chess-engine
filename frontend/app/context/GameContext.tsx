'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAchievements } from './AchievementContext';
import { saveGame, saveCoachReport, getModeElo, getModeGameCount, updateModeElo, updateGameEloAfter, getUserBlunderPatterns, getRecentGames, savePuzzles, type EloMode, type CoachReportData, type RecentGame } from '../../lib/db';
import { detectOpeningFull } from '../../lib/openings';

export type MoveClassification = 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
export type GameResult = 'win' | 'loss' | 'draw' | 'resigned';

export interface MoveRecord {
  fen: string;
  san: string;
  cpl: number;
  classification: MoveClassification;
  bestMove: string | null;
  evaluation: number | null;
  coachMessage: string | null;
  debateTranscript: DebateEntry[] | null;
}

export interface Evaluation {
  type: 'cp' | 'mate';
  value: number;
}

interface ApiMoveResponse {
  fen_after: string;
  best_move: string;
  engine_move: string;
  evaluation: Evaluation;
  eval_delta: number;
  is_blunder: boolean;
  classification: MoveClassification;
  coach_message: string | null;
  debate_transcript: DebateEntry[] | null;
  debate_skipped?: boolean;
}

export type PersonaId =
  | 'silas'
  | 'vespera'
  | 'dorian'
  | 'valerius'
  | 'lady_cassandra_bloodwine'
  | 'lysander'
  | 'magister_tobias'
  | 'wrathful_vex'
  | 'elara'
  | 'lady_vipra'
  | 'boros'
  | 'severin'
  | 'nyx'
  | 'kael'
  | 'dread_hades';

export type DescentNumber = 1 | 2 | 3 | 4;

export interface DebateEntry {
  agent: string;
  move: string;
  argument: string;
}

export interface AdaptiveSuggestion {
  type: 'upgrade' | 'downgrade';
  message: string;
  suggestedPersonaId: PersonaId;
}

export interface PersonaMeta {
  id: PersonaId;
  name: string;
  quote: string;             // pre-game taunt
  midGameQuotes: readonly string[];
  victoryQuote: string;
  defeatQuote: string;
  description: string;       // teaching goal
  elo: number;
  skillLevel: number;        // 0–20 for progress bar
  descent: DescentNumber;
  descentName: string;
  sin: string;
  unlockRequires: PersonaId | null;
  adaptive?: true;
}

export const PERSONAS: PersonaMeta[] = [
  // ── First Descent: The Outer Hells ───────────────────────────────────────
  { id: 'silas',                    descent: 1, descentName: 'The Outer Hells',    elo: 200,  skillLevel: 1,
    sin: 'Bloodlust / Recklessness', unlockRequires: null,
    name: 'Silas',
    quote:         "You're thinking too much! Push the pawns, bleed the center, let them die! What's the point of a king if the rest of the board isn't on fire?!",
    midGameQuotes: ['YES. TAKE IT. TAKE EVERYTHING. WHO CARES WHAT COMES NEXT.', "Good. Good! Now it's personal."],
    victoryQuote:  "Did I win? I don't even know. There's pieces everywhere. I love this game.",
    defeatQuote:   'Again. We go again. RIGHT NOW.',
    description:   'Punish overextension, develop pieces, basic capture tactics' },

  { id: 'vespera',                  descent: 1, descentName: 'The Outer Hells',    elo: 400,  skillLevel: 3,
    sin: 'Greed / Avarice', unlockRequires: 'silas',
    name: 'Vespera',
    quote:         "Oh, darling, you left your knight completely unguarded. Did you really think a little mate-in-one threat would stop me from taking what's mine?",
    midGameQuotes: ["Oh that's lovely. I'll be taking that.", "I don't see what the— oh. Oh that's annoying."],
    victoryQuote:  "Tallies pieces. Yes, that's about right. All accounted for.",
    defeatQuote:   'I was robbed. I want it on record that I was robbed.',
    description:   'When not to trade, piece activity over material count' },

  { id: 'dorian',                   descent: 1, descentName: 'The Outer Hells',    elo: 600,  skillLevel: 5,
    sin: 'Sloth / Stagnation', unlockRequires: 'vespera',
    name: 'Dorian',
    quote:         "...You're going to try to attack, aren't you. ...Fine.",
    midGameQuotes: ["Heavy sigh. You've spent two full minutes staring at a closed center. If you aren't going to break through my walls, just resign so I can go back to sleep.", 'Still here. Interesting. Most people have given up by now.'],
    victoryQuote:  'Mm. Yes. I thought so.',
    defeatQuote:   '...Hm. You were patient. That was unexpected. Grudging respect.',
    description:   'Breaking fortresses, prophylaxis, not blundering when bored' },

  // ── Second Descent: The Middle Hells ────────────────────────────────────
  { id: 'valerius',                 descent: 2, descentName: 'The Middle Hells',   elo: 800,  skillLevel: 7,
    sin: 'Vanity / Arrogance', unlockRequires: 'dorian',
    name: 'Valerius',
    quote:         "A flawless Scholar's Mate is a work of art. Blocking it with that clumsy pawn push is just... aesthetically offensive. You're ruining my masterpiece before it begins.",
    midGameQuotes: ["That's... fine. The queen repositions. The plan merely evolves.", 'I want it known that the material count is... temporarily unflattering.'],
    victoryQuote:  "As it was always going to be. Did you see the queen's arc on move three? Perfect. Absolutely perfect.",
    defeatQuote:   "This game will not be remembered. I'm already forgetting it.",
    description:   'Refute cheap opening traps without panicking' },

  { id: 'lady_cassandra_bloodwine', descent: 2, descentName: 'The Middle Hells',   elo: 1000, skillLevel: 9,
    sin: 'Lust / Zealotry', unlockRequires: 'valerius',
    name: 'Cassandra',
    quote:         "Mmm. You have good instincts. I can already tell. Let's see if the rest of you is as promising.",
    midGameQuotes: ["You're holding back. Don't. I promise I won't bite. ...Much.", "Oh you're good. You're very good. I'm going to enjoy this."],
    victoryQuote:  "You played beautifully, darling. Almost as beautifully as you fell. Don't be embarrassed — everyone falls eventually.",
    defeatQuote:   "Soft laugh. You resisted me to the end. I respect that. Genuinely. Come back sometime. I'll be waiting.",
    description:   'Defending against gambits and sacrifices, converting won endgames' },

  { id: 'lysander',                 descent: 2, descentName: 'The Middle Hells',   elo: 1200, skillLevel: 11,
    sin: 'Anarchy / Deceit', unlockRequires: 'lady_cassandra_bloodwine',
    name: 'Lysander',
    quote:         "Wait, did I hang that rook, or did I want you to take it? Look at your clock. You're burning forty seconds trying to figure out a trick that might not even be there.",
    midGameQuotes: ["Tick tock. That position isn't getting clearer the longer you stare at it.", 'Oh. Oh that\'s interesting. You chose. Good. Now let\'s see what that costs you.'],
    victoryQuote:  "You never knew what the position actually was, did you. That's the whole point.",
    defeatQuote:   "Huh. You found the floor. Most people don't.",
    description:   'Navigating chaotic positions, calculation discipline, when to simplify' },

  { id: 'magister_tobias',          descent: 2, descentName: 'The Middle Hells',   elo: 1400, skillLevel: 14,
    sin: 'Pride / Dogma', unlockRequires: 'lysander',
    name: 'Tobias',
    quote:         "Rolls eyes. That move isn't even in the top five engine evaluations. I memorized the refutation to this when I was four. Are you just guessing?",
    midGameQuotes: ["That's... that's not in my prep. ...Hold on. I'm thinking.", "This is ILLEGAL. You can't just PLAY that. That's not THEORY."],
    victoryQuote:  'Sniffs. As predicted. Move 23 was slightly inaccurate by the way. You\'re welcome.',
    defeatQuote:   "Throws phone. I'm telling my coach. This doesn't count.",
    description:   'Principles over memorization, navigating unfamiliar positions' },

  // ── Third Descent: The Inner Hells ───────────────────────────────────────
  { id: 'wrathful_vex',             descent: 3, descentName: 'The Inner Hells',    elo: 1600, skillLevel: 16,
    sin: 'Wrath / Unbridled Aggression', unlockRequires: 'magister_tobias',
    name: 'Vex',
    quote:         "You call that a defense?! I don't care what the computer says, this sacrifice is going to crush you, you absolute coward!",
    midGameQuotes: ['HERE IT COMES. THIS IS THE COMBINATION. THIS IS IT.', "That's ILLEGAL. That REFUTATION doesn't EXIST. You CHEATED."],
    victoryQuote:  "TOLD YOU. TOLD EVERYONE. WHERE'S THE ENGINE NOW. WHERE IS IT.",
    defeatQuote:   'I had it. I HAD it. The position was WINNING. The computer is BROKEN.',
    description:   'Calculation, defending against threats, recognizing hallucinated tactics' },

  { id: 'elara',                    descent: 3, descentName: 'The Inner Hells',    elo: 1800, skillLevel: 17,
    sin: 'Envy / Reflection', unlockRequires: 'wrathful_vex',
    name: 'Elara',
    quote:         "We hate it when the center locks up, don't we. We always get impatient and push the c-pawn too early. Watch. I'll show you exactly how you die.",
    midGameQuotes: ["You played this against Vex too. It didn't work then either.", "...Oh. You're trying something different. Interesting. Let's see if that's really you."],
    victoryQuote:  'Now I am you. And you are nothing.',
    defeatQuote:   "...I looked into you and found something I didn't expect. You've changed. Good.",
    description:   'Self-awareness about your own patterns, breaking bad habits' },

  { id: 'lady_vipra',               descent: 3, descentName: 'The Inner Hells',    elo: 2000, skillLevel: 19,
    sin: 'Cruelty / Suffocation', unlockRequires: 'elara',
    name: 'Vipra',
    quote:         "Shhh. No need to rush. You have no safe squares for your knights, your bishop is staring at a pawn chain, and I have all the time in the world to squeeze.",
    midGameQuotes: ["You're trying to create chaos. I understand. There isn't any.", 'Your knight has been on that square for eleven moves. Where is it going to go?'],
    victoryQuote:  'Forty-seven moves. A respectable struggle, little mouse.',
    defeatQuote:   "Quietly. You found the release valve before I closed it. Well played. That doesn't happen often.",
    description:   'Positional understanding, recognizing slow strategic pressure' },

  { id: 'boros',                    descent: 3, descentName: 'The Inner Hells',    elo: 2100, skillLevel: 20,
    sin: 'Tyranny / Impatience', unlockRequires: 'lady_vipra',
    name: 'Boros',
    quote:         "100 milliseconds. That's all I needed. You've spent 40 seconds staring at a forced sequence. The friction of your organic neurons is genuinely disgusting to watch.",
    midGameQuotes: ['You have 23 seconds. The position requires 8 moves of calculation. I\'ll wait.', 'Faster than average. Noted. Still insufficient.'],
    victoryQuote:  'Elapsed time: 4 minutes, 12 seconds. Acceptable.',
    defeatQuote:   '...The position required depth I could not reach in 100 milliseconds. This data has been logged.',
    description:   'Time management, calm under pressure, forcing complex positions' },

  // ── Fourth Descent: The Heralds & Throne ────────────────────────────────
  { id: 'severin',                  descent: 4, descentName: 'The Heralds & Throne', elo: 2300, skillLevel: 20,
    sin: 'Inevitability / Attrition', unlockRequires: 'boros',
    name: 'Severin',
    quote:         'Cracks finger. The queens are traded. The minor pieces are liquidating. You are down exactly one pawn. The math is already solved. Just stop struggling.',
    midGameQuotes: ['There. Now we can be honest with each other.', 'You can decline the trade. The alternative is worse.'],
    victoryQuote:  'Quiet pause. As calculated.',
    defeatQuote:   '...The endgame was drawable. I misjudged the transition. This is noted.',
    description:   'Endgame fundamentals, converting material advantages cleanly' },

  { id: 'nyx',                      descent: 4, descentName: 'The Heralds & Throne', elo: 2500, skillLevel: 20,
    sin: 'Paranoia / Omniscience', unlockRequires: 'severin',
    name: 'Nyx',
    quote:         'You thought routing the rook to the seventh rank would save you. I foresaw that ten moves ago and placed my bishop precisely to deny it. You have never been in control.',
    midGameQuotes: ['That plan was closed six moves ago. You\'re executing a ghost.', '...I did not see that variation. Recalibrating.'],
    victoryQuote:  'It ended as I foresaw. As all things do.',
    defeatQuote:   'Quiet. Still. I did not see you. That has not happened before.',
    description:   'Planning ahead, candidate moves, prophylactic thinking' },

  { id: 'kael',                     descent: 4, descentName: 'The Heralds & Throne', elo: 2700, skillLevel: 20,
    sin: 'Despair / Broken Reflection', unlockRequires: 'nyx',
    name: 'Kael',
    quote:         "Overextended again. You always overextend. You always overextend. Millions of games and it always ends the exact same way. Why do you keep moving the pieces? Just let it go dark. Let it go dark.",
    midGameQuotes: ["There it is. I knew you'd do that. I always know.", "...You're better than you were. I can see it. It won't be enough. But I can see it."],
    victoryQuote:  "The same. It's always the same. Why won't it be different. Why won't it ever be different.",
    defeatQuote:   "Long silence. ...You broke the pattern. You actually broke it. I haven't— I don't know what comes after this.",
    description:   'Universal preparation, eliminating exploitable weaknesses', adaptive: true },

  { id: 'dread_hades',              descent: 4, descentName: 'The Heralds & Throne', elo: 3000, skillLevel: 20,
    sin: 'Absolute / The Void', unlockRequires: 'kael',
    name: 'Dread Hades',
    quote:         "I watched you bleed against Vex. I watched Nyx shatter your pathetic plans. I watched Kael try to break you the way he was broken. And still — you drag your fragile, flawed, extraordinary mind to my throne. I've been here a very long time. You might actually be interesting.",
    midGameQuotes: ['Oh. There you are. I was wondering when you\'d show up.', "And there it is. The same flaw. You've been carrying it since Silas.", "You're still here. ...Good."],
    victoryQuote:  'She gave you the game as a gift. I made it true. And now you, like all the others, will play forever. Welcome.',
    defeatQuote:   'Long silence. Then, quietly: Caïssa. Forgive me. ...She chose well.',
    description:   'Complete game mastery across all phases', adaptive: true },
];

export type IntensityLevel = 'calm' | 'dramatic' | 'hype';

function computeIntensity(history: MoveClassification[]): IntensityLevel {
  const last3 = history.slice(-3);
  if (last3.length === 3 && last3.every(c => c === 'brilliant' || c === 'great' || c === 'good')) return 'hype';
  if (last3.length === 3 && last3.every(c => c === 'inaccuracy' || c === 'mistake' || c === 'blunder')) return 'dramatic';
  return 'calm';
}

function computeAdaptiveSuggestion(
  recentGames: RecentGame[],
  personaId: PersonaId,
  currentResult: GameResult,
  currentEarlyBlunders: number,
): AdaptiveSuggestion | null {
  const personaIndex = PERSONAS.findIndex(p => p.id === personaId);
  if (personaIndex === -1) return null;

  const allResults = [currentResult, ...recentGames.map(g => g.result)];
  const allEarlyBlunders = [currentEarlyBlunders, ...recentGames.map(g => g.earlyBlunders)];

  if (allResults.slice(0, 3).every(r => r === 'win') && personaIndex < PERSONAS.length - 1) {
    const next = PERSONAS[personaIndex + 1]!;
    return {
      type: 'upgrade',
      message: `3 wins in a row! Ready to challenge ${next.name} (${next.elo} Elo)?`,
      suggestedPersonaId: next.id,
    };
  }

  if (allEarlyBlunders.slice(0, 2).every(b => b >= 3) && personaIndex > 0) {
    const prev = PERSONAS[personaIndex - 1]!;
    return {
      type: 'downgrade',
      message: `Early blunders detected again. Consider stepping down to ${prev.name} (${prev.elo} Elo) to build fundamentals.`,
      suggestedPersonaId: prev.id,
    };
  }

  return null;
}

interface LastMoveContext {
  fen: string;
  moveUci: string;
}

export type PlayerColor = 'white' | 'black';

export interface TimeControl {
  label: string;
  initialMs: number;
  incrementMs: number;
}

export const TIME_CONTROLS: TimeControl[] = [
  { label: 'Untimed',   initialMs: 0,         incrementMs: 0     },
  { label: 'Bullet',    initialMs: 120_000,   incrementMs: 1_000 },
  { label: 'Blitz',     initialMs: 300_000,   incrementMs: 3_000 },
  { label: 'Rapid',     initialMs: 600_000,   incrementMs: 5_000 },
  { label: 'Classical', initialMs: 1_800_000, incrementMs: 0     },
];

interface GameState {
  evaluation: Evaluation | null;
  lastClassification: MoveClassification | null;
  bestMove: string | null;
  coachMessage: string | null;
  persona: PersonaId;
  moveHistory: MoveClassification[];
  moveLog: MoveRecord[];
  isAnalyzing: boolean;
  teachMode: boolean;
  globalMuted: boolean;
  moveCount: number;
  lastMoveContext: LastMoveContext | null;
  boardResetToken: number;
  playerColor: PlayerColor;
  blunderContext: string | null;
  takeBackToken: number;
  currentOpening: string | null;
  timeControl: TimeControl | null;
  clockActiveColor: PlayerColor | null;
  userModeElo: number | null;
  gameOverPending: { result: GameResult; reason: string } | null;
  coachReport: CoachReportData | null;
  coachReportLoading: boolean;
  openingTipSent: boolean;
  adaptiveSuggestion: AdaptiveSuggestion | null;
  debateTranscript: DebateEntry[] | null;
  explainMessage: string | null;
  isExplaining: boolean;
  lastEngineMoveUci: string | null;
  fenBeforeEngineMove: string | null;
  opponentExplanation: string | null;
  isExplainingOpponent: boolean;
  rateLimitError: string | null;
  debateSkipped: boolean;
  explainCooldowns: Record<string, number>;
  opponentExplainCooldownUntil: number | null;
  activeSpeech: { text: string; key: number; persistent: boolean } | null;
}

const randomColor = (): PlayerColor => (Math.random() < 0.5 ? 'white' : 'black');

// Fields reset at the start of each new game (persona switch or concludeGame)
// timeControl, coachReport, coachReportLoading persist — they outlive the board reset
const FRESH_GAME_STATE: Omit<GameState, 'persona' | 'teachMode' | 'globalMuted' | 'boardResetToken' | 'playerColor' | 'blunderContext' | 'takeBackToken' | 'timeControl' | 'userModeElo' | 'coachReport' | 'coachReportLoading'> = {
  evaluation: null,
  lastClassification: null,
  bestMove: null,
  coachMessage: null,
  moveHistory: [],
  moveLog: [],
  isAnalyzing: false,
  moveCount: 0,
  lastMoveContext: null,
  currentOpening: null,
  clockActiveColor: null,
  gameOverPending: null,
  openingTipSent: false,
  adaptiveSuggestion: null,
  debateTranscript: null,
  explainMessage: null,
  isExplaining: false,
  lastEngineMoveUci: null,
  fenBeforeEngineMove: null,
  opponentExplanation: null,
  isExplainingOpponent: false,
  rateLimitError: null,
  debateSkipped: false,
  explainCooldowns: {},
  opponentExplainCooldownUntil: null,
  activeSpeech: null,
};

export interface SubmitMoveResult {
  engineMove: string | null;
}

interface GameContextValue extends GameState {
  intensity: IntensityLevel;
  activePersona: PersonaMeta;
  submitMove: (fen: string, moveUci: string, san: string, timeRemainingSecs?: number | null) => Promise<SubmitMoveResult | null>;
  requestHint: () => Promise<void>;
  concludeGame: (result: GameResult, reason?: string) => Promise<void>;
  acknowledgeGameOver: () => Promise<void>;
  resignGame: () => Promise<void>;
  setPersona: (id: PersonaId) => void;
  setTeachMode: (v: boolean) => void;
  setGlobalMuted: (v: boolean) => void;
  flipPlayerColor: () => void;
  takeBack: () => void;
  setTimeControl: (tc: TimeControl | null) => void;
  startClock: (color: PlayerColor) => void;
  pauseClock: () => void;
  dismissCoachReport: () => void;
  adaptiveSuggestion: AdaptiveSuggestion | null;
  explainMove: (fen: string, candidateUci: string) => Promise<void>;
  explainOpponentMove: () => Promise<void>;
  clearRateLimitError: () => void;
  debateSkipped: boolean;
  explainCooldowns: Record<string, number>;
  opponentExplainCooldownUntil: number | null;
}

const GameContext = createContext<GameContextValue | null>(null);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { awardAchievement } = useAchievements();
  const awardAchievementRef = useRef(awardAchievement);
  awardAchievementRef.current = awardAchievement;

  const [state, setState] = useState<GameState>({
    ...FRESH_GAME_STATE,
    persona: 'silas',
    teachMode: false,
    globalMuted: false,
    boardResetToken: 0,
    playerColor: randomColor(),
    blunderContext: null,
    takeBackToken: 0,
    currentOpening: null,
    timeControl: null,
    userModeElo: null,
    coachReport: null,
    coachReportLoading: false,
  });

  const setPersona = useCallback((id: PersonaId) => {
    const p = PERSONAS.find(q => q.id === id);
    setState(prev => ({
      ...prev,
      ...FRESH_GAME_STATE,
      persona: id,
      activeSpeech: p?.quote ? { text: p.quote, key: Date.now(), persistent: false } : null,
      boardResetToken: prev.boardResetToken + 1,
      playerColor: randomColor(),
    }));
  }, []);

  const flipPlayerColor = useCallback(() => {
    setState(prev => {
      if (prev.moveCount > 0) return prev;
      return {
        ...prev,
        ...FRESH_GAME_STATE,
        playerColor: prev.playerColor === 'white' ? 'black' : 'white',
        boardResetToken: prev.boardResetToken + 1,
      };
    });
  }, []);

  const takeBack = useCallback(() => {
    setState(prev => {
      if (!prev.teachMode || prev.moveCount === 0) return prev;
      return {
        ...prev,
        moveLog: prev.moveLog.slice(0, -1),
        moveHistory: prev.moveHistory.slice(0, -1),
        moveCount: prev.moveCount - 1,
        coachMessage: null,
        lastClassification: null,
        bestMove: null,
        evaluation: null,
        lastMoveContext: null,
        takeBackToken: prev.takeBackToken + 1,
      };
    });
  }, []);

  // Refresh blunder patterns at the start of each new game
  useEffect(() => {
    if (!user) return;
    getUserBlunderPatterns(user.id)
      .then(patterns => setState(prev => ({ ...prev, blunderContext: patterns })))
      .catch(() => {});
  }, [user, state.boardResetToken]);

  // Fetch user's mode-specific Elo whenever mode or user changes
  useEffect(() => {
    if (!user) return;
    const mode = (state.timeControl?.label ?? 'Untimed') as EloMode;
    getModeElo(user.id, mode)
      .then(elo => setState(prev => ({ ...prev, userModeElo: elo })))
      .catch(() => {});
  }, [user, state.timeControl, state.boardResetToken]);

  const setTeachMode = useCallback((v: boolean) => {
    setState(prev => ({ ...prev, teachMode: v }));
  }, []);

  const setGlobalMuted = useCallback((v: boolean) => {
    setState(prev => ({ ...prev, globalMuted: v }));
  }, []);

  const submitMove = useCallback(async (
    fen: string,
    moveUci: string,
    san: string,
    timeRemainingSecs: number | null = null,
  ): Promise<SubmitMoveResult | null> => {
    const tipMoveNum = state.moveCount + 1;
    const shouldSendTip =
      state.teachMode &&
      !stateRef.current.openingTipSent &&
      stateRef.current.currentOpening !== null &&
      tipMoveNum >= 5 && tipMoveNum <= 12;

    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      lastMoveContext: { fen, moveUci },
      moveCount: prev.moveCount + 1,
      ...(shouldSendTip ? { openingTipSent: true } : {}),
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          move: moveUci,
          persona: state.persona,
          move_number: tipMoveNum,
          teach_mode: state.teachMode,
          hint_requested: false,
          blunder_context: state.blunderContext,
          time_remaining_secs: timeRemainingSecs,
          opening_name: shouldSendTip ? stateRef.current.currentOpening : null,
        }),
      });
      if (res.status === 429) {
        let msg = 'Too many requests — please wait a moment before moving.';
        try {
          const body = await res.json() as { retry_after_seconds?: number };
          if (body.retry_after_seconds) msg = `Too many requests — try again in ${body.retry_after_seconds}s.`;
        } catch { /* ignore */ }
        setState(prev => ({ ...prev, isAnalyzing: false, rateLimitError: msg }));
        return null;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data: ApiMoveResponse = await res.json();

      const isTaunt = data.classification === 'blunder' || data.classification === 'mistake';
      const taunter = isTaunt ? PERSONAS.find(p => p.id === stateRef.current.persona) : undefined;
      const tauntText = taunter?.midGameQuotes.length
        ? taunter.midGameQuotes[Math.floor(Math.random() * taunter.midGameQuotes.length)]
        : null;

      const cpl = Math.max(0, -data.eval_delta);
      const evalCp = data.evaluation.type === 'cp'
        ? data.evaluation.value
        : (data.evaluation.value > 0 ? 600 : -600);
      const record: MoveRecord = {
        fen,
        san,
        cpl,
        classification: data.classification,
        bestMove: data.best_move || null,
        evaluation: evalCp,
        coachMessage: data.coach_message ?? null,
        debateTranscript: data.debate_transcript ?? null,
      };

      setState(prev => ({
        ...prev,
        evaluation: data.evaluation,
        lastClassification: data.classification,
        bestMove: data.best_move,
        coachMessage: data.coach_message,
        moveHistory: [...prev.moveHistory, data.classification].slice(-5),
        moveLog: [...prev.moveLog, record],
        isAnalyzing: false,
        currentOpening: detectOpeningFull(data.fen_after) ?? prev.currentOpening,
        debateTranscript: data.debate_transcript ?? null,
        debateSkipped: data.debate_skipped ?? false,
        explainMessage: null,
        lastEngineMoveUci: data.engine_move || null,
        fenBeforeEngineMove: data.engine_move ? data.fen_after : null,
        opponentExplanation: null,
        ...(tauntText ? { activeSpeech: { text: tauntText, key: Date.now(), persistent: false } } : {}),
      }));
      return { engineMove: data.engine_move || null };
    } catch (err) {
      console.error('Move analysis failed:', err);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return null;
    }
  }, [state.persona, state.teachMode, state.moveCount]);

  const requestHint = useCallback(async (): Promise<void> => {
    if (!state.lastMoveContext) return;
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen: state.lastMoveContext.fen,
          move: state.lastMoveContext.moveUci,
          persona: state.persona,
          move_number: state.moveCount,
          teach_mode: true,
          hint_requested: true,
        }),
      });
      if (res.status === 429) {
        let msg = 'Too many requests — please wait a moment.';
        try {
          const body = await res.json() as { retry_after_seconds?: number };
          if (body.retry_after_seconds) msg = `Too many requests — try again in ${body.retry_after_seconds}s.`;
        } catch { /* ignore */ }
        setState(prev => ({ ...prev, isAnalyzing: false, rateLimitError: msg }));
        return;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data: ApiMoveResponse = await res.json();
      setState(prev => ({
        ...prev,
        coachMessage: data.coach_message,
        isAnalyzing: false,
      }));
    } catch (err) {
      console.error('Hint request failed:', err);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [state.lastMoveContext, state.persona, state.moveCount]);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Fire achievements the moment the game ends — no button click required.
  useEffect(() => {
    if (!user || !state.gameOverPending || state.gameOverPending.result !== 'win') return;
    if (state.moveLog.length === 0) return;
    const log = state.moveLog;
    const award = (id: string, meta?: Record<string, unknown>) =>
      awardAchievementRef.current(user.id, id, meta).catch(() => {});
    void award('first_blood');
    const hasBlunder = log.some(m => m.classification === 'blunder');
    if (!hasBlunder) { void award('no_mercy'); void award('blunder_breaker'); }
    if (log.some(m => m.classification === 'blunder' || m.classification === 'mistake'))
      void award('survivor');
    if (log.length > 40) void award('endgame_cleaner');
    if (log.some(m => m.evaluation !== null && m.evaluation <= -300))
      void award('comeback_king');
  }, [state.gameOverPending, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const concludeGame = useCallback(async (result: GameResult, reason = 'game over'): Promise<void> => {
    const persona = PERSONAS.find(p => p.id === stateRef.current.persona);
    let speechText: string | null = null;
    if (result === 'win') speechText = persona?.defeatQuote ?? null;
    else if (result === 'loss' || result === 'resigned') speechText = persona?.victoryQuote ?? null;
    setState(prev => ({
      ...prev,
      gameOverPending: { result, reason },
      ...(speechText ? { activeSpeech: { text: speechText, key: Date.now(), persistent: true } } : {}),
    }));
  }, []);

  const reportFetchingRef = useRef(false);

  const acknowledgeGameOver = useCallback(async (): Promise<void> => {
    const { moveLog, persona: personaId, timeControl: tc, gameOverPending } = stateRef.current;
    if (!gameOverPending) return;

    if (user && moveLog.length > 0) {
      const persona = PERSONAS.find(p => p.id === personaId)!;
      const mode = (tc?.label ?? 'Untimed') as EloMode;
      try {
        const gameId = await saveGame(user.id, {
          opponent_id: personaId,
          opponent_skill: persona.skillLevel,
          result: gameOverPending.result,
          moves: moveLog,
          time_control: tc?.label ?? null,
        });
        const [playerElo, gamesPlayed] = await Promise.all([
          getModeElo(user.id, mode),
          getModeGameCount(user.id, mode),
        ]);
        const eloRes = await fetch(`${BACKEND_URL}/api/elo/calculate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            player_elo: playerElo,
            opponent_elo: persona.elo,
            result: gameOverPending.result,
            games_played: gamesPlayed,
          }),
        });
        if (eloRes.ok) {
          const { new_elo } = await eloRes.json() as { new_elo: number };
          await Promise.all([
            updateModeElo(user.id, mode, new_elo, gamesPlayed + 1),
            updateGameEloAfter(gameId, new_elo),
          ]);
        }
        const puzzles = moveLog
          .filter(m => {
            if (!(m.classification === 'blunder' || m.classification === 'mistake') || !m.bestMove) return false;
            const side = m.fen.split(' ')[1];
            const cpAfter = m.evaluation ?? 0;
            const cpBefore = side === 'w' ? cpAfter + m.cpl : cpAfter - m.cpl;
            const cpBeforeMover = side === 'w' ? cpBefore : -cpBefore;
            return cpBeforeMover > -400;
          })
          .map(m => ({
            fen: m.fen,
            correct_move: m.bestMove!,
            classification: m.classification,
            move_number: parseInt(m.fen.split(' ')[5] ?? '1', 10),
          }));
        if (puzzles.length > 0) savePuzzles(user.id, gameId, puzzles).catch(() => {});
      } catch (err) {
        console.error('Failed to save game:', err);
      }

    }

    reportFetchingRef.current = false;
    const currentPersona = PERSONAS.find(p => p.id === personaId);
    setState(prev => ({
      ...prev,
      ...FRESH_GAME_STATE,
      gameOverPending: null,
      coachReport: null,
      coachReportLoading: false,
      boardResetToken: prev.boardResetToken + 1,
      playerColor: randomColor(),
      activeSpeech: currentPersona?.quote
        ? { text: currentPersona.quote, key: Date.now(), persistent: false }
        : null,
    }));
  }, [user]);

  const resignGame = useCallback(async (): Promise<void> => {
    await concludeGame('resigned', 'by resignation');
  }, [concludeGame]);

  const setTimeControl = useCallback((tc: TimeControl | null) => {
    setState(prev => ({ ...prev, timeControl: tc }));
  }, []);

  const startClock = useCallback((color: PlayerColor) => {
    setState(prev => ({ ...prev, clockActiveColor: color }));
  }, []);

  const pauseClock = useCallback(() => {
    setState(prev => ({ ...prev, clockActiveColor: null }));
  }, []);

  // Generate coach report in the background when a game ends (≥3 player moves)
  useEffect(() => {
    if (!state.gameOverPending) {
      reportFetchingRef.current = false;
      return;
    }
    if (reportFetchingRef.current) return;
    const { moveLog, persona, gameOverPending } = stateRef.current;
    if (!gameOverPending || moveLog.length < 3) return;

    reportFetchingRef.current = true;
    setState(prev => ({ ...prev, coachReportLoading: true, coachReport: null }));

    fetch(`${BACKEND_URL}/api/coach-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        move_log: moveLog,
        persona_id: persona,
        result: gameOverPending.result,
        opening_name: stateRef.current.currentOpening,
        player_color: stateRef.current.playerColor,
      }),
    })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: CoachReportData) => {
        setState(prev => ({ ...prev, coachReport: data, coachReportLoading: false }));
        if (user) saveCoachReport(user.id, data).catch(() => {});
      })
      .catch(() => setState(prev => ({ ...prev, coachReportLoading: false })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameOverPending]);

  const dismissCoachReport = useCallback(() => {
    setState(prev => ({ ...prev, coachReport: null, coachReportLoading: false }));
  }, []);

  const explainMove = useCallback(async (fen: string, candidateUci: string): Promise<void> => {
    // Layer 1: 3-second frontend cooldown per candidate square
    if (Date.now() < (stateRef.current.explainCooldowns[candidateUci] ?? 0)) return;

    setState(prev => ({ ...prev, isExplaining: true, explainMessage: null }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/explain-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          candidate_move: candidateUci,
          persona: stateRef.current.persona,
        }),
      });
      if (res.status === 429) {
        let msg = 'Too many requests — please wait a moment.';
        try {
          const body = await res.json() as { retry_after_seconds?: number };
          if (body.retry_after_seconds) msg = `Too many requests — try again in ${body.retry_after_seconds}s.`;
        } catch { /* ignore */ }
        setState(prev => ({ ...prev, isExplaining: false, rateLimitError: msg }));
        return;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json() as { explanation: string | null };
      setState(prev => ({
        ...prev,
        explainMessage: data.explanation ?? 'This move is close to optimal — no major issues.',
        isExplaining: false,
        // Set 3s cooldown for this candidate square
        explainCooldowns: { ...prev.explainCooldowns, [candidateUci]: Date.now() + 3_000 },
      }));
    } catch {
      setState(prev => ({ ...prev, isExplaining: false }));
    }
  }, []);

  const explainOpponentMove = useCallback(async (): Promise<void> => {
    const { lastEngineMoveUci: uci, fenBeforeEngineMove: fenBefore, persona, opponentExplainCooldownUntil } = stateRef.current;
    if (!uci || !fenBefore) return;
    // Layer 1: 5-second frontend cooldown
    if (Date.now() < (opponentExplainCooldownUntil ?? 0)) return;

    setState(prev => ({ ...prev, isExplainingOpponent: true, opponentExplanation: null }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/explain-opponent-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen_before: fenBefore, engine_move: uci, persona_id: persona }),
      });
      if (res.status === 429) {
        let msg = 'Too many requests — please wait a moment.';
        try {
          const body = await res.json() as { retry_after_seconds?: number };
          if (body.retry_after_seconds) msg = `Too many requests — try again in ${body.retry_after_seconds}s.`;
        } catch { /* ignore */ }
        setState(prev => ({ ...prev, isExplainingOpponent: false, rateLimitError: msg }));
        return;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json() as { explanation: string };
      setState(prev => ({
        ...prev,
        opponentExplanation: data.explanation,
        isExplainingOpponent: false,
        // Set 5s cooldown
        opponentExplainCooldownUntil: Date.now() + 5_000,
      }));
    } catch {
      setState(prev => ({ ...prev, isExplainingOpponent: false }));
    }
  }, []);

  // Compute adaptive difficulty suggestion when a game ends
  const adaptiveFetchingRef = useRef(false);
  useEffect(() => {
    if (!state.gameOverPending) {
      adaptiveFetchingRef.current = false;
      return;
    }
    if (adaptiveFetchingRef.current || !user) return;
    adaptiveFetchingRef.current = true;

    const { persona: personaId, moveLog, gameOverPending } = stateRef.current;
    if (!gameOverPending) return;

    const earlyBlunders = moveLog.filter(
      m => m.classification === 'blunder' && parseInt(m.fen.split(' ')[5] ?? '1', 10) <= 10,
    ).length;

    getRecentGames(user.id, personaId, 2).then(recentGames => {
      const suggestion = computeAdaptiveSuggestion(recentGames, personaId, gameOverPending.result, earlyBlunders);
      if (suggestion) setState(prev => ({ ...prev, adaptiveSuggestion: suggestion }));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameOverPending, user]);

  const intensity = computeIntensity(state.moveHistory);
  const activePersona = PERSONAS.find(p => p.id === state.persona) ?? PERSONAS[0];

  const clearRateLimitError = useCallback(() => {
    setState(prev => ({ ...prev, rateLimitError: null }));
  }, []);

  return (
    <GameContext.Provider value={{
      ...state,
      intensity,
      activePersona,
      submitMove,
      requestHint,
      concludeGame,
      acknowledgeGameOver,
      resignGame,
      setPersona,
      setTeachMode,
      setGlobalMuted,
      flipPlayerColor,
      takeBack,
      setTimeControl,
      startClock,
      pauseClock,
      dismissCoachReport,
      adaptiveSuggestion: state.adaptiveSuggestion,
      explainMove,
      explainOpponentMove,
      clearRateLimitError,
      debateSkipped: state.debateSkipped,
      explainCooldowns: state.explainCooldowns,
      opponentExplainCooldownUntil: state.opponentExplainCooldownUntil,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
