import { supabase } from './supabase';
import type { MoveRecord, GameResult } from '../app/context/GameContext';

export function isLoss(result: GameResult): boolean {
  return result === 'loss' || result === 'resigned';
}

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

export async function saveGame(userId: string, payload: SaveGamePayload): Promise<string> {
  const { data, error } = await supabase.from('games').insert({
    user_id: userId,
    opponent_id: payload.opponent_id,
    opponent_skill: payload.opponent_skill,
    result: payload.result,
    moves: payload.moves,
    time_control: payload.time_control ?? null,
  }).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export async function updateGameEloAfter(gameId: string, playerEloAfter: number): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ player_elo_after: playerEloAfter })
    .eq('id', gameId);
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

// ── Weakness Tracking ─────────────────────────────────────────────────────────

type WeaknessKey = 'hanging' | 'opening' | 'middlegame' | 'endgame' | 'queen';

function _getMoveNumber(fen: string): number {
  return parseInt(fen.split(' ')[5] ?? '1', 10);
}

function _getNonKingPieceCount(fen: string): number {
  return (fen.split(' ')[0]?.match(/[nbrqpNBRQP]/g) ?? []).length;
}

const WEAKNESS_META: Record<WeaknessKey, { category: string; description: string; recommendation: string }> = {
  hanging:    { category: 'Hanging Pieces',      description: 'Leaving pieces undefended or moving into attacked squares',       recommendation: 'Before every move, ask: "Can my opponent take something for free?"' },
  opening:    { category: 'Opening Mistakes',    description: 'Blundering in the first 10 moves before development is complete', recommendation: 'Drill the first 10 moves of your main openings — know your lines cold.' },
  middlegame: { category: 'Missed Tactics',      description: 'Missing or falling victim to tactical shots in the middlegame',   recommendation: 'Solve 5 tactical puzzles daily — forks, pins, skewers, discovered attacks.' },
  endgame:    { category: 'Endgame Technique',   description: 'Poor technique when material is simplified',                      recommendation: 'Study basic endgames: K+P, K+R vs K, opposition, and triangulation.' },
  queen:      { category: 'Queen Overextension', description: 'Moving the queen early or to exposed squares where it gets chased', recommendation: 'Develop minor pieces first — delay queen activation until move 10+.' },
};

export interface WeaknessEntry {
  category: string;
  description: string;
  count: number;
  gamesAffected: number;
  trend: 'improving' | 'worsening' | 'stable';
  recommendation: string;
}

export interface WeaknessProfile {
  topWeakness: WeaknessEntry | null;
  entries: WeaknessEntry[];
  gamesAnalyzed: number;
}

function _classifyMoves(moves: MoveRecord[], counts: Record<WeaknessKey, number>, affectedSet?: Set<WeaknessKey>) {
  for (const move of moves) {
    if (move.classification !== 'blunder' && move.classification !== 'mistake') continue;
    const moveNum = _getMoveNumber(move.fen);
    const pieceCount = _getNonKingPieceCount(move.fen);
    const san = move.san ?? '';

    if (move.cpl > 250)                                          { counts.hanging++;    affectedSet?.add('hanging'); }
    if (moveNum <= 10)                                           { counts.opening++;    affectedSet?.add('opening'); }
    if (move.classification === 'blunder' && moveNum >= 11 && moveNum <= 30) { counts.middlegame++; affectedSet?.add('middlegame'); }
    if (pieceCount <= 8)                                         { counts.endgame++;    affectedSet?.add('endgame'); }
    if (san.startsWith('Q') && moveNum < 20)                     { counts.queen++;      affectedSet?.add('queen'); }
  }
}

function _zeroCounts(): Record<WeaknessKey, number> {
  return { hanging: 0, opening: 0, middlegame: 0, endgame: 0, queen: 0 };
}

export async function getUserWeaknessProfile(userId: string): Promise<WeaknessProfile | null> {
  const { data, error } = await supabase
    .from('games')
    .select('moves, played_at')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(20);

  if (error || !data || data.length < 3) return null;

  const recentGames = data.slice(0, 10);
  const olderGames  = data.slice(10);

  const recentCounts = _zeroCounts();
  const olderCounts  = _zeroCounts();
  const gamesAffected = _zeroCounts();

  for (const game of data) {
    const affected = new Set<WeaknessKey>();
    _classifyMoves(game.moves as MoveRecord[], _zeroCounts(), affected);
    Array.from(affected).forEach(k => { gamesAffected[k]++; });
  }
  for (const game of recentGames) _classifyMoves(game.moves as MoveRecord[], recentCounts);
  for (const game of olderGames)  _classifyMoves(game.moves as MoveRecord[], olderCounts);

  const entries: WeaknessEntry[] = (Object.keys(WEAKNESS_META) as WeaknessKey[])
    .map(key => {
      const total = recentCounts[key] + olderCounts[key];
      let trend: WeaknessEntry['trend'] = 'stable';
      if (olderGames.length >= 5) {
        const rRate = recentCounts[key] / Math.max(1, recentGames.length);
        const oRate = olderCounts[key]  / Math.max(1, olderGames.length);
        if (rRate < oRate * 0.75) trend = 'improving';
        else if (rRate > oRate * 1.25) trend = 'worsening';
      }
      return { ...WEAKNESS_META[key], count: total, gamesAffected: gamesAffected[key], trend };
    })
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count);

  if (entries.length === 0) return null;
  return { topWeakness: entries[0] ?? null, entries, gamesAnalyzed: data.length };
}

export interface CoachReportData {
  game_summary: string;
  opening_played: string;
  critical_mistakes: Array<{ move: string; issue: string }>;
  best_move_missed: string;
  recurring_weakness: string;
  tactical_theme: string;
  recommended_practice: string;
  estimated_performance_rating: number;
}

// Supabase table required:
// CREATE TABLE public.coach_reports (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
//   report JSONB NOT NULL,
//   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// ALTER TABLE public.coach_reports ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "coach_reports_select_own" ON public.coach_reports FOR SELECT USING (auth.uid() = user_id);
// CREATE POLICY "coach_reports_insert_own" ON public.coach_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
export async function saveCoachReport(userId: string, report: CoachReportData): Promise<void> {
  const { error } = await supabase.from('coach_reports').insert({ user_id: userId, report });
  if (error) throw error;
}

export interface RecentGame {
  result: GameResult;
  earlyBlunders: number;
}

export async function getRecentGames(userId: string, personaId: string, n: number): Promise<RecentGame[]> {
  const { data, error } = await supabase
    .from('games')
    .select('result, moves')
    .eq('user_id', userId)
    .eq('opponent_id', personaId)
    .order('played_at', { ascending: false })
    .limit(n);

  if (error || !data) return [];

  return data.map(row => {
    const moves = row.moves as MoveRecord[];
    const earlyBlunders = moves.filter(
      m => m.classification === 'blunder' && parseInt(m.fen.split(' ')[5] ?? '1', 10) <= 10,
    ).length;
    return { result: row.result as GameResult, earlyBlunders };
  });
}

export interface UserProfile {
  username: string;
  currentElo: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  recentGames: Array<{
    id: string;
    opponent_id: string;
    result: string;
    played_at: string;
    time_control: string | null;
  }>;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [profileResult, gamesResult] = await Promise.all([
    supabase.from('users').select('username, current_elo').eq('id', userId).single(),
    supabase.from('games')
      .select('id, opponent_id, result, played_at, time_control')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error || !profileResult.data) return null;
  const row = profileResult.data as unknown as { username: string; current_elo: number };
  const games = (gamesResult.data ?? []) as Array<{
    id: string;
    opponent_id: string;
    result: string;
    played_at: string;
    time_control: string | null;
  }>;

  return {
    username: row.username,
    currentElo: row.current_elo,
    totalGames: games.length,
    wins:   games.filter(g => g.result === 'win').length,
    losses: games.filter(g => isLoss(g.result as GameResult)).length,
    draws:  games.filter(g => g.result === 'draw').length,
    recentGames: games.slice(0, 10),
  };
}

export async function updateUsername(userId: string, username: string): Promise<void> {
  const { error } = await supabase.from('users').update({ username }).eq('id', userId);
  if (error) throw error;
}

export interface GameRow {
  id: string;
  opponent_id: string;
  result: GameResult;
  moves: MoveRecord[];
  played_at: string;
  player_elo_after: number | null;
  time_control: string | null;
}

export async function getGameById(gameId: string): Promise<GameRow | null> {
  const { data, error } = await supabase
    .from('games')
    .select('id, opponent_id, result, moves, played_at, player_elo_after, time_control')
    .eq('id', gameId)
    .single();
  if (error || !data) return null;
  return data as unknown as GameRow;
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

// ── Campaign Progress ─────────────────────────────────────────────────────────

export type CampaignStatus = 'locked' | 'available' | 'complete';

export async function getCampaignProgress(userId: string): Promise<Record<string, CampaignStatus>> {
  const { data, error } = await supabase
    .from('campaign_progress')
    .select('persona_id, status')
    .eq('user_id', userId);
  if (error) throw error;
  const result: Record<string, CampaignStatus> = {};
  for (const row of data ?? []) {
    result[(row as { persona_id: string; status: string }).persona_id] =
      (row as { persona_id: string; status: string }).status as CampaignStatus;
  }
  return result;
}

export async function unlockPersona(userId: string, personaId: string): Promise<void> {
  const { error } = await supabase.from('campaign_progress').upsert({
    user_id: userId,
    persona_id: personaId,
    status: 'available',
    unlocked_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function completePersona(userId: string, personaId: string): Promise<void> {
  const { error } = await supabase
    .from('campaign_progress')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('persona_id', personaId);
  if (error) throw error;
}

// ── Puzzles ───────────────────────────────────────────────────────────────────

export interface PuzzleInsert {
  fen: string;
  correct_move: string;
  classification: string;
  move_number: number;
}

export interface PuzzleRow {
  id: string;
  game_id: string;
  fen: string;
  correct_move: string;
  classification: string;
  move_number: number;
  solved: boolean;
  solved_at: string | null;
  created_at: string;
}

export async function savePuzzles(userId: string, gameId: string, puzzles: PuzzleInsert[]): Promise<void> {
  if (puzzles.length === 0) return;
  const rows = puzzles.map(p => ({ user_id: userId, game_id: gameId, ...p }));
  const { error } = await supabase.from('puzzles').insert(rows);
  if (error) throw error;
}

export async function getPuzzles(userId: string): Promise<PuzzleRow[]> {
  const { data, error } = await supabase
    .from('puzzles')
    .select('id, game_id, fen, correct_move, classification, move_number, solved, solved_at, created_at')
    .eq('user_id', userId)
    .order('solved', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PuzzleRow[];
}

export async function markPuzzleSolved(puzzleId: string): Promise<void> {
  const { error } = await supabase
    .from('puzzles')
    .update({ solved: true, solved_at: new Date().toISOString() })
    .eq('id', puzzleId);
  if (error) throw error;
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export interface DashboardGame {
  result: GameResult;
  opponent_id: string;
  moves: MoveRecord[];
  played_at: string;
  player_elo_after: number | null;
  time_control: string | null;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export async function getUnlockedAchievements(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: { achievement_id: string }) => r.achievement_id);
}

export async function unlockAchievement(
  userId: string,
  achievementId: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  const { error, count } = await supabase
    .from('user_achievements')
    .upsert(
      { user_id: userId, achievement_id: achievementId, metadata: metadata ?? null },
      { onConflict: 'user_id,achievement_id', ignoreDuplicates: true },
    )
    .select();
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getDashboardGames(userId: string, limit = 50): Promise<DashboardGame[]> {
  const { data, error } = await supabase
    .from('games')
    .select('result, opponent_id, moves, played_at, player_elo_after, time_control')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DashboardGame[];
}
