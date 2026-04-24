import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          current_elo: number;
          created_at: string;
          elo_bullet: number;
          elo_blitz: number;
          elo_rapid: number;
          elo_classical: number;
          games_unlimited: number;
          games_bullet: number;
          games_blitz: number;
          games_rapid: number;
          games_classical: number;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          current_elo?: number;
        };
        Update: {
          username?: string;
          current_elo?: number;
          elo_bullet?: number;
          elo_blitz?: number;
          elo_rapid?: number;
          elo_classical?: number;
          games_unlimited?: number;
          games_bullet?: number;
          games_blitz?: number;
          games_rapid?: number;
          games_classical?: number;
        };
      };
      games: {
        Row: {
          id: string;
          user_id: string;
          opponent_id: string;
          opponent_skill: number;
          result: 'win' | 'loss' | 'draw' | 'resigned';
          moves: Json;
          played_at: string;
          time_control: string | null;
        };
        Insert: {
          user_id: string;
          opponent_id: string;
          opponent_skill: number;
          result: 'win' | 'loss' | 'draw' | 'resigned';
          moves: Json;
          time_control?: string | null;
        };
        Update: never;
      };
    };
  };
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Not using the Database generic here — Supabase v2's generated type shape
// requires Relationships/Views/Functions/Enums fields that we'd need the CLI
// to produce correctly. Auth types (User, Session) come from the SDK directly
// and are unaffected. Row types below are used at call sites instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
