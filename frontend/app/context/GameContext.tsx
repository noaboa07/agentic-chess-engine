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
}

export type PersonaId =
  | 'pawnstorm_petey'
  | 'grizelda_the_greedy'
  | 'brother_oedric'
  | 'sir_vance_the_vain'
  | 'lady_cassandra_bloodwine'
  | 'the_hippomancer'
  | 'magister_tobias'
  | 'wrathful_vex'
  | 'the_mirror_maiden'
  | 'lady_vipra'
  | 'boros'
  | 'the_reaper'
  | 'oracle_nyx'
  | 'the_fallen_champion'
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
  quote: string;        // pre-game taunt
  victoryQuote: string;
  defeatQuote: string;
  description: string;  // teaching goal
  elo: number;
  skillLevel: number;   // 0–20 for progress bar
  descent: DescentNumber;
  descentName: string;
  sin: string;
  unlockRequires: PersonaId | null;
  adaptive?: true;      // TODO: requires player_history module
}

export const PERSONAS: PersonaMeta[] = [
  // ── First Descent: The Outer Hells ───────────────────────────────────────
  { id: 'pawnstorm_petey',         descent: 1, descentName: 'The Outer Hells',    elo: 200,  skillLevel: 1,
    sin: 'Recklessness', unlockRequires: null,
    name: 'Pawnstorm Petey',
    quote:        'I push. That is the whole plan.',
    victoryQuote: 'I won? I WON! WAIT TIL MOMMA HEARS!',
    defeatQuote:  'Aw. Wanna play again?',
    description:  'Punish overextension, develop pieces, basic capture tactics' },

  { id: 'grizelda_the_greedy',     descent: 1, descentName: 'The Outer Hells',    elo: 400,  skillLevel: 3,
    sin: 'Greed', unlockRequires: 'pawnstorm_petey',
    name: 'Grizelda the Greedy',
    quote:        "Take. Take. Take. Why won't you take, ducky?",
    victoryQuote: 'Ohohoho! All your pieces are MINE now, lovey. Mine, mine, mine!',
    defeatQuote:  'You drive a hard bargain... a HARD bargain...',
    description:  'When not to trade, piece activity over material count' },

  { id: 'brother_oedric',          descent: 1, descentName: 'The Outer Hells',    elo: 600,  skillLevel: 5,
    sin: 'Sloth', unlockRequires: 'grizelda_the_greedy',
    name: 'Brother Oedric the Slothful',
    quote:        'I move my pawns to the third rank. Then I rest. Forever.',
    victoryQuote: 'Mmm. Goodnight, child.',
    defeatQuote:  'Wait... is it... my turn...?',
    description:  'How to break down a fortress, prophylaxis, not blundering when bored' },

  // ── Second Descent: The Middle Hells ────────────────────────────────────
  { id: 'sir_vance_the_vain',      descent: 2, descentName: 'The Middle Hells',   elo: 800,  skillLevel: 7,
    sin: 'Vanity', unlockRequires: 'brother_oedric',
    name: 'Sir Vance the Vain',
    quote:        'Wayward Queen, baby. Undefeated since the Battle of Aldermere.',
    victoryQuote: 'Did you SEE that? Did you SEE me? Tell them. Tell EVERYONE.',
    defeatQuote:  'No... they were supposed to remember me for that move...',
    description:  'Refute cheap opening traps without panicking' },

  { id: 'lady_cassandra_bloodwine', descent: 2, descentName: 'The Middle Hells',  elo: 1000, skillLevel: 9,
    sin: 'Lust', unlockRequires: 'sir_vance_the_vain',
    name: 'Lady Cassandra Bloodwine',
    quote:        'My grandfather played this gambit at the docks. Sacrifice everything. Especially yourself.',
    victoryQuote: "Oh darling. You played beautifully. Almost as beautifully as you'll bleed.",
    defeatQuote:  "Mmm. I haven't lost in centuries. How... refreshing.",
    description:  'Defending against sacrifices, converting won endgames' },

  { id: 'the_hippomancer',         descent: 2, descentName: 'The Middle Hells',   elo: 1200, skillLevel: 11,
    sin: 'Stagnation', unlockRequires: 'lady_cassandra_bloodwine',
    name: 'The Hippomancer',
    quote:        'I do not move. The river moves around me.',
    victoryQuote: 'You fought the current. The current always wins.',
    defeatQuote:  'Ah. The river has chosen. Pass, child.',
    description:  'Breaking down advanced fortresses, advanced prophylaxis' },

  { id: 'magister_tobias', descent: 2, descentName: 'The Middle Hells', elo: 1400, skillLevel: 14,
    sin: 'Pride', unlockRequires: 'the_hippomancer',
    name: 'Magister Tobias the Pedant',
    quote:        'Actually, in the Najdorf English Attack, move 17 is...',
    victoryQuote: "As Capablanca demonstrated in 1927, this position is theoretically lost for you. I merely... confirmed it.",
    defeatQuote:  "That's — that's not in any book I've read. That's not — no — that CAN'T be — ",
    description:  'Principles over memorization, navigating unfamiliar positions' },

  // ── Third Descent: The Inner Hells ───────────────────────────────────────
  { id: 'wrathful_vex',            descent: 3, descentName: 'The Inner Hells',    elo: 1600, skillLevel: 16,
    sin: 'Wrath', unlockRequires: 'magister_tobias',
    name: 'Wrathful Vex',
    quote:        "There's always a combination. ALWAYS. SHUT UP.",
    victoryQuote: 'BURN. BURN. BURN. WHAT? WHAT NOW? HUH?',
    defeatQuote:  'I HATE THIS GAME I HATE YOU I HATE EVERYTHING — ',
    description:  'Calculation, defending against threats, recognizing when there is no tactic' },

  { id: 'the_mirror_maiden',       descent: 3, descentName: 'The Inner Hells',    elo: 1800, skillLevel: 17,
    sin: 'Envy', unlockRequires: 'wrathful_vex',
    name: 'The Mirror Maiden',
    quote:        'I have no moves of my own. Only yours.',
    victoryQuote: 'Now... I am you. And you are nothing.',
    defeatQuote:  'I... I will play your moves... in another life...',
    description:  'Self-awareness, breaking your own patterns' },

  { id: 'lady_vipra',   descent: 3, descentName: 'The Inner Hells',    elo: 2000, skillLevel: 19,
    sin: 'Cruelty', unlockRequires: 'the_mirror_maiden',
    name: 'Lady Vipra, the Coiled',
    quote:        'I will squeeze you for fifty moves and you will not know why you are losing.',
    victoryQuote: 'Forty-seven moves. A respectable struggle, little mouse.',
    defeatQuote:  'Sssssso. The mouse has fangs. Interesssssting.',
    description:  'Positional understanding, recognizing slow strategic pressure' },

  { id: 'boros', descent: 3, descentName: 'The Inner Hells',    elo: 2100, skillLevel: 20,
    sin: 'Tyranny', unlockRequires: 'lady_vipra',
    name: 'Boros the Time-Devourer',
    quote:        'Time is the only piece that matters.',
    victoryQuote: 'Sand. Out. Done.',
    defeatQuote:  'I had... more time... than I... thought...',
    description:  'Time management, calm under pressure, punishing speed-induced inaccuracy' },

  // ── Fourth Descent: The Heralds & Throne ────────────────────────────────
  { id: 'the_reaper',     descent: 4, descentName: 'The Heralds & Throne', elo: 2300, skillLevel: 20,
    sin: 'Inevitability', unlockRequires: 'boros',
    name: 'The Reaper of Pawns',
    quote:        'The middlegame is a rumor. Trade queens.',
    victoryQuote: '',
    defeatQuote:  'I will see you again.',
    description:  'Endgame fundamentals' },

  { id: 'oracle_nyx', descent: 4, descentName: 'The Heralds & Throne', elo: 2500, skillLevel: 20,
    sin: 'Paranoia', unlockRequires: 'the_reaper',
    name: 'Oracle Nyx the Paranoid',
    quote:        'I saw that move three of yours ago. I have already prevented it.',
    victoryQuote: 'It ended as I foresaw. As all things do.',
    defeatQuote:  'I... did not see this. I did not see... this...',
    description:  'Planning, candidate moves, playing with a plan instead of reacting' },

  { id: 'the_fallen_champion',     descent: 4, descentName: 'The Heralds & Throne', elo: 2700, skillLevel: 20,
    sin: 'Despair', unlockRequires: 'oracle_nyx',
    name: 'The Fallen Champion',
    quote:        'I played a thousand games before I forgot why.',
    victoryQuote: 'You will join me here. I have seen it.',
    defeatQuote:  'Then... you might actually... finish what I started...',
    description:  'Self-awareness about your own weaknesses', adaptive: true },

  { id: 'dread_hades',             descent: 4, descentName: 'The Heralds & Throne', elo: 3000, skillLevel: 20,
    sin: 'All', unlockRequires: 'the_fallen_champion',
    name: 'Dread Hades, the Chess Devil',
    quote:        'You played a good game. I played a different one.',
    victoryQuote: 'She gave you the game as a cage. I have made it true. And now you, too, will play forever.',
    defeatQuote:  'Then... she chose well. Caïssa... forgive me...',
    description:  "There's no one trick left — you must be a complete player", adaptive: true },
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
    persona: 'pawnstorm_petey',
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
    setState(prev => ({
      ...prev,
      ...FRESH_GAME_STATE,
      persona: id,
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
        setState(prev => ({ ...prev, isAnalyzing: false, rateLimitError: 'Too many requests — please wait a moment before moving.' }));
        return null;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data: ApiMoveResponse = await res.json();

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
        explainMessage: null,
        lastEngineMoveUci: data.engine_move || null,
        fenBeforeEngineMove: data.engine_move ? data.fen_after : null,
        opponentExplanation: null,
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
        setState(prev => ({ ...prev, isAnalyzing: false, rateLimitError: 'Too many requests — please wait a moment.' }));
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
    setState(prev => ({ ...prev, gameOverPending: { result, reason } }));
  }, []);

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

    setState(prev => ({
      ...prev,
      ...FRESH_GAME_STATE,
      gameOverPending: null,
      boardResetToken: prev.boardResetToken + 1,
      playerColor: randomColor(),
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

  // Generate coach report in the background when a game ends (≥5 player moves)
  const reportFetchingRef = useRef(false);
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
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json() as { explanation: string | null };
      setState(prev => ({
        ...prev,
        explainMessage: data.explanation ?? 'This move is close to optimal — no major issues.',
        isExplaining: false,
      }));
    } catch {
      setState(prev => ({ ...prev, isExplaining: false }));
    }
  }, []);

  const explainOpponentMove = useCallback(async (): Promise<void> => {
    const { lastEngineMoveUci: uci, fenBeforeEngineMove: fenBefore, persona } = stateRef.current;
    if (!uci || !fenBefore) return;
    setState(prev => ({ ...prev, isExplainingOpponent: true, opponentExplanation: null }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/explain-opponent-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen_before: fenBefore, engine_move: uci, persona_id: persona }),
      });
      if (res.status === 429) {
        setState(prev => ({ ...prev, isExplainingOpponent: false, rateLimitError: 'Too many requests — please wait a moment.' }));
        return;
      }
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data = await res.json() as { explanation: string };
      setState(prev => ({ ...prev, opponentExplanation: data.explanation, isExplainingOpponent: false }));
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
