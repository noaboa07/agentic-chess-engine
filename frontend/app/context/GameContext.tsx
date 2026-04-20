'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type MoveClassification = 'brilliant' | 'good' | 'inaccuracy' | 'mistake' | 'blunder';

export interface Evaluation {
  type: 'cp' | 'mate';
  value: number;
}

interface ApiMoveResponse {
  fen_after: string;
  best_move: string;
  evaluation: Evaluation;
  is_blunder: boolean;
  classification: MoveClassification;
  coach_message: string;
}

interface GameState {
  evaluation: Evaluation | null;
  lastClassification: MoveClassification | null;
  bestMove: string | null;
  coachMessage: string | null;
  isAnalyzing: boolean;
}

interface GameContextValue extends GameState {
  submitMove: (fen: string, moveUci: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    evaluation: null,
    lastClassification: null,
    bestMove: null,
    coachMessage: null,
    isAnalyzing: false,
  });

  const submitMove = useCallback(async (fen: string, moveUci: string): Promise<void> => {
    setState(prev => ({ ...prev, isAnalyzing: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/api/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, move: moveUci }),
      });
      if (!res.ok) throw new Error(`Backend error: ${res.status}`);
      const data: ApiMoveResponse = await res.json();
      setState({
        evaluation: data.evaluation,
        lastClassification: data.classification,
        bestMove: data.best_move,
        coachMessage: data.coach_message,
        isAnalyzing: false,
      });
    } catch (err) {
      console.error('Move analysis failed:', err);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  return <GameContext.Provider value={{ ...state, submitMove }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
