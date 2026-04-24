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

export async function getUserElo(userId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('users')
    .select('current_elo')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.current_elo ?? null;
}

const PIECE_NAMES: Record<string, string> = {
  N: 'knights', B: 'bishops', R: 'rooks', Q: 'queens', K: 'kings', pawn: 'pawns',
};

export async function getUserBlunderPatterns(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('games')
    .select('moves')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(20);

  if (error || !data || data.length < 3) return null;

  const phaseCounts: Record<string, number> = {};
  const pieceCounts: Record<string, number> = {};
  let totalBlunders = 0;

  for (const game of data) {
    const moves = game.moves as MoveRecord[];
    for (const move of moves) {
      if (move.classification !== 'blunder' && move.classification !== 'mistake') continue;
      totalBlunders++;

      const fullMove = parseInt(move.fen.split(' ')[5] ?? '1', 10);
      const phase = fullMove <= 10 ? 'opening' : fullMove <= 25 ? 'middlegame' : 'endgame';
      phaseCounts[phase] = (phaseCounts[phase] ?? 0) + 1;

      const firstChar = move.san[0];
      const piece = /[NBRQK]/.test(firstChar) ? firstChar : 'pawn';
      pieceCounts[piece] = (pieceCounts[piece] ?? 0) + 1;
    }
  }

  if (totalBlunders < 3) return null;

  const topPhase = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0];
  const topPiece = Object.entries(pieceCounts).sort((a, b) => b[1] - a[1])[0];

  const parts: string[] = [];
  if (topPhase) parts.push(`blunders most in the ${topPhase[0]} (${topPhase[1]} of ${totalBlunders} mistakes)`);
  if (topPiece) parts.push(`frequently hangs their ${PIECE_NAMES[topPiece[0]] ?? topPiece[0]} (${topPiece[1]} times)`);

  return parts.length > 0 ? parts.join('; ') : null;
}

export async function updateElo(userId: string, newElo: number): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ current_elo: newElo })
    .eq('id', userId);
  if (error) throw error;
}
