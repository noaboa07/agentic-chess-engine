'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
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
  description: string;
  elo: number;
  skillLevel: number;
}

export const PERSONAS: PersonaMeta[] = [
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
}

const GameContext = createContext<GameContextValue | null>(null);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [state, setState] = useState<GameState>({
    ...FRESH_GAME_STATE,
    persona: 'clown_noah',
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
          .filter(m => (m.classification === 'blunder' || m.classification === 'mistake') && m.bestMove)
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
