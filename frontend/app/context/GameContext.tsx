'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveGame, getModeElo, getModeGameCount, updateModeElo, getUserBlunderPatterns, type EloMode } from '../../lib/db';
import { detectOpening } from '../../lib/openings';

export type MoveClassification = 'brilliant' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';
export type GameResult = 'win' | 'loss' | 'draw' | 'resigned';

export interface MoveRecord {
  fen: string;
  san: string;
  cpl: number;
  classification: MoveClassification;
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
}

const randomColor = (): PlayerColor => (Math.random() < 0.5 ? 'white' : 'black');

// Fields reset at the start of each new game (persona switch or concludeGame)
// timeControl persists — user keeps their selected format between games
const FRESH_GAME_STATE: Omit<GameState, 'persona' | 'teachMode' | 'globalMuted' | 'boardResetToken' | 'playerColor' | 'blunderContext' | 'takeBackToken' | 'timeControl' | 'userModeElo'> = {
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
};

export interface SubmitMoveResult {
  engineMove: string | null;
}

interface GameContextValue extends GameState {
  intensity: IntensityLevel;
  activePersona: PersonaMeta;
  submitMove: (fen: string, moveUci: string, san: string) => Promise<SubmitMoveResult | null>;
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
  ): Promise<SubmitMoveResult | null> => {
    setState(prev => ({
      ...prev,
      isAnalyzing: true,
      lastMoveContext: { fen, moveUci },
      moveCount: prev.moveCount + 1,
    }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fen,
          move: moveUci,
          persona: state.persona,
          move_number: state.moveCount + 1,
          teach_mode: state.teachMode,
          hint_requested: false,
          blunder_context: state.blunderContext,
        }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data: ApiMoveResponse = await res.json();

      const cpl = Math.max(0, -data.eval_delta);
      const record: MoveRecord = { fen, san, cpl, classification: data.classification };

      setState(prev => ({
        ...prev,
        evaluation: data.evaluation,
        lastClassification: data.classification,
        bestMove: data.best_move,
        coachMessage: data.coach_message,
        moveHistory: [...prev.moveHistory, data.classification].slice(-5),
        moveLog: [...prev.moveLog, record],
        isAnalyzing: false,
        currentOpening: detectOpening(data.fen_after) ?? prev.currentOpening,
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
        await saveGame(user.id, {
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
          await updateModeElo(user.id, mode, new_elo, gamesPlayed + 1);
        }
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
