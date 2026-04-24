'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { saveGame, getUserElo, updateElo, getUserBlunderPatterns } from '../../lib/db';

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
}

const randomColor = (): PlayerColor => (Math.random() < 0.5 ? 'white' : 'black');

// Fields reset at the start of each new game (persona switch or concludeGame)
const FRESH_GAME_STATE: Omit<GameState, 'persona' | 'teachMode' | 'globalMuted' | 'boardResetToken' | 'playerColor' | 'blunderContext' | 'takeBackToken'> = {
  evaluation: null,
  lastClassification: null,
  bestMove: null,
  coachMessage: null,
  moveHistory: [],
  moveLog: [],
  isAnalyzing: false,
  moveCount: 0,
  lastMoveContext: null,
};

export interface SubmitMoveResult {
  engineMove: string | null;
}

interface GameContextValue extends GameState {
  intensity: IntensityLevel;
  activePersona: PersonaMeta;
  submitMove: (fen: string, moveUci: string, san: string) => Promise<SubmitMoveResult | null>;
  requestHint: () => Promise<void>;
  concludeGame: (result: GameResult) => Promise<void>;
  resignGame: () => Promise<void>;
  setPersona: (id: PersonaId) => void;
  setTeachMode: (v: boolean) => void;
  setGlobalMuted: (v: boolean) => void;
  flipPlayerColor: () => void;
  takeBack: () => void;
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
      return { ...prev, playerColor: prev.playerColor === 'white' ? 'black' : 'white' };
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

  const concludeGame = useCallback(async (result: GameResult): Promise<void> => {
    if (user && state.moveLog.length > 0) {
      const persona = PERSONAS.find(p => p.id === state.persona)!;
      try {
        await saveGame(user.id, {
          opponent_id: state.persona,
          opponent_skill: persona.skillLevel,
          result,
          moves: state.moveLog,
        });
        const currentElo = await getUserElo(user.id);
        if (currentElo !== null) {
          const delta = result === 'win' ? 15 : result === 'loss' || result === 'resigned' ? -15 : 0;
          await updateElo(user.id, Math.max(100, currentElo + delta));
        }
      } catch (err) {
        console.error('Failed to save game:', err);
      }
    }
    setState(prev => ({
      ...prev,
      ...FRESH_GAME_STATE,
      boardResetToken: prev.boardResetToken + 1,
      playerColor: randomColor(),
    }));
  }, [user, state.persona, state.moveLog]);

  const resignGame = useCallback(async (): Promise<void> => {
    await concludeGame('resigned');
  }, [concludeGame]);

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
      resignGame,
      setPersona,
      setTeachMode,
      setGlobalMuted,
      flipPlayerColor,
      takeBack,
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
