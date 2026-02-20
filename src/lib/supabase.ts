// 🗄️ Supabase Client - Free Database for MRN Football Legends
import { createClient } from '@supabase/supabase-js';

// Environment variables (add to .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  level: number;
  experience: number;
  coins: number;
  total_matches: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface Match {
  id: string;
  host_id: string;
  guest_id?: string;
  status: 'waiting' | 'playing' | 'finished';
  room_code: string;
  created_at: string;
  finished_at?: string;
  winner_id?: string;
  final_score?: {
    host_score: number;
    guest_score: number;
  };
}

export interface GameSession {
  id: string;
  match_id: string;
  player_data: {
    positions: Array<{
      timestamp: number;
      player_x: number;
      player_y: number;
      ball_x: number;
      ball_y: number;
      action: string;
    }>;
  };
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  level: number;
  experience: number;
  wins: number;
  win_rate: number;
  rank: number;
}

// API functions for database operations
export const DatabaseAPI = {
  // User operations
  async createUser(userData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    return { data, error };
  },

  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  // Match operations
  async createMatch(hostId: string, roomCode: string) {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        host_id: hostId,
        room_code: roomCode,
        status: 'waiting'
      })
      .select()
      .single();
    
    return { data, error };
  },

  async getAvailableMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        host:users!matches_host_id_fkey(username, level, experience),
        guest:users!matches_guest_id_fkey(username, level, experience)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(50);
    
    return { data, error };
  },

  async joinMatch(roomCode: string, guestId: string) {
    // First get the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single();

    if (matchError || !match) {
      return { data: null, error: 'Match not found or already started' };
    }

    // Update the match
    const { data, error } = await supabase
      .from('matches')
      .update({
        guest_id: guestId,
        status: 'playing'
      })
      .eq('id', match.id)
      .select()
      .single();

    return { data, error };
  },

  async finishMatch(matchId: string, winnerId: string, finalScore: { host_score: number; guest_score: number }) {
    const { data, error } = await supabase
      .from('matches')
      .update({
        status: 'finished',
        winner_id: winnerId,
        final_score: finalScore,
        finished_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single();

    return { data, error };
  },

  // Leaderboard operations
  async getLeaderboard(limit: number = 100) {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, level, experience, wins, total_matches, win_rate')
      .order('experience', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Anti-cheat: Store suspicious activity
  async reportSuspiciousActivity(userId: string, reason: string, evidence: any) {
    const { data, error } = await supabase
      .from('suspicious_activity')
      .insert({
        user_id: userId,
        reason,
        evidence,
        created_at: new Date().toISOString()
      });

    return { data, error };
  }
};

export default supabase;
