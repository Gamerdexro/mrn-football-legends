// 🏈 Supabase Match Service - Free
import { supabase, Match } from '../../lib/supabase';

export class MatchService {
  // Create new match
  static async createMatch(hostId: string, roomCode: string) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          host_id: hostId,
          room_code: roomCode,
          status: 'waiting'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, match: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get available matches
  static async getAvailableMatches() {
    try {
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

      if (error) throw error;
      return { success: true, matches: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Join existing match
  static async joinMatch(roomCode: string, guestId: string) {
    try {
      // First get the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('room_code', roomCode)
        .eq('status', 'waiting')
        .single();

      if (matchError || !match) {
        return { success: false, error: 'Match not found or already started' };
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

      if (error) throw error;
      return { success: true, match: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Finish match
  static async finishMatch(matchId: string, winnerId: string, finalScore: { host_score: number; guest_score: number }) {
    try {
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

      if (error) throw error;
      return { success: true, match: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Get match by room code
  static async getMatchByRoomCode(roomCode: string) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          host:users!matches_host_id_fkey(username, level, experience),
          guest:users!matches_guest_id_fkey(username, level, experience)
        `)
        .eq('room_code', roomCode)
        .single();

      if (error) throw error;
      return { success: true, match: data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Listen to match changes
  static subscribeToMatch(matchId: string, callback: (match: Match) => void) {
    return supabase
      .channel(`match-${matchId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          callback(payload.new as Match);
        }
      )
      .subscribe();
  }
}
