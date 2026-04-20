import { supabase } from './supabase';
import type { MoveRecord, GameResult } from '../app/context/GameContext';

interface SaveGamePayload {
  opponent_id: string;
  opponent_skill: number;
  result: GameResult;
  moves: MoveRecord[];
}

export async function saveGame(userId: string, payload: SaveGamePayload): Promise<void> {
  const { error } = await supabase.from('games').insert({
    user_id: userId,
    opponent_id: payload.opponent_id,
    opponent_skill: payload.opponent_skill,
    result: payload.result,
    moves: payload.moves,
  });
  if (error) throw error;
}
