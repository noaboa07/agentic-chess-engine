import { supabase } from './supabase';
import type { MoveRecord, GameResult } from '../app/context/GameContext';

export type EloMode = 'Untimed' | 'Bullet' | 'Blitz' | 'Rapid' | 'Classical';

const ELO_COL: Record<EloMode, string> = {
  Untimed:   'current_elo',
  Bullet:    'elo_bullet',
  Blitz:     'elo_blitz',
  Rapid:     'elo_rapid',
  Classical: 'elo_classical',
};

const GAMES_COL: Record<EloMode, string> = {
  Untimed:   'games_unlimited',
  Bullet:    'games_bullet',
  Blitz:     'games_blitz',
  Rapid:     'games_rapid',
  Classical: 'games_classical',
};

interface SaveGamePayload {
  opponent_id: string;
  opponent_skill: number;
  result: GameResult;
  moves: MoveRecord[];
  time_control?: string | null;
}

export async function saveGame(userId: string, payload: SaveGamePayload): Promise<void> {
  const { error } = await supabase.from('games').insert({
    user_id: userId,
    opponent_id: payload.opponent_id,
    opponent_skill: payload.opponent_skill,
    result: payload.result,
    moves: payload.moves,
    time_control: payload.time_control ?? null,
  });
  if (error) throw error;
}

export async function getModeElo(userId: string, mode: EloMode): Promise<number> {
  const col = ELO_COL[mode];
  const { data, error } = await supabase.from('users').select(col).eq('id', userId).single();
  if (error) throw error;
  return (data as unknown as Record<string, number> | null)?.[col] ?? 400;
}

export async function getModeGameCount(userId: string, mode: EloMode): Promise<number> {
  const col = GAMES_COL[mode];
  const { data, error } = await supabase.from('users').select(col).eq('id', userId).single();
  if (error) throw error;
  return (data as unknown as Record<string, number> | null)?.[col] ?? 0;
}

export async function updateModeElo(
  userId: string,
  mode: EloMode,
  newElo: number,
  newGamesCount: number,
): Promise<void> {
  const { error } = await supabase.from('users').update({
    [ELO_COL[mode]]:   newElo,
    [GAMES_COL[mode]]: newGamesCount,
  }).eq('id', userId);
  if (error) throw error;
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

export interface LeaderboardEntry {
  username: string;
  current_elo: number;
  rank: number;
}

export async function getLeaderboard(mode: EloMode = 'Untimed', limit = 50): Promise<LeaderboardEntry[]> {
  const col = ELO_COL[mode];
  const { data, error } = await supabase
    .from('users')
    .select(`username, ${col}`)
    .order(col, { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row, i) => ({
    username: (row as unknown as Record<string, unknown>).username as string,
    current_elo: ((row as unknown as Record<string, unknown>)[col] as number) ?? 400,
    rank: i + 1,
  }));
}
