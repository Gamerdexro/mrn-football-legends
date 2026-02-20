// 🎮 Free Matchmaking API for MRN Football Legends
// Supports 900+ users on Vercel free tier

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// CORS headers for browser
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Handle OPTIONS requests for CORS
function handleCORS() {
  return new Response(null, { headers });
}

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create new match
async function createMatch(userId, username) {
  try {
    const roomCode = generateRoomCode();
    
    const { data, error } = await supabase
      .from('matches')
      .insert({
        host_id: userId,
        status: 'waiting',
        room_code: roomCode
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      match: data,
      roomCode: roomCode,
      message: 'Match created successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Join existing match
async function joinMatch(roomCode, userId, username) {
  try {
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single();

    if (matchError || !match) {
      return {
        success: false,
        error: 'Match not found or already started'
      };
    }

    const { data, error } = await supabase
      .from('matches')
      .update({
        guest_id: userId,
        status: 'playing'
      })
      .eq('id', match.id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      match: data,
      message: 'Joined match successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Get available matches
async function getAvailableMatches() {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        host:users!matches_host_id_fkey(username),
        guest:users!matches_guest_id_fkey(username)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return {
      success: true,
      matches: data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Main handler
export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCORS();
  }

  try {
    const { method } = req;
    const { action, roomCode, userId, username } = req.body || {};

    let result;

    switch (method) {
      case 'POST':
        switch (action) {
          case 'create':
            result = await createMatch(userId, username);
            break;
          case 'join':
            result = await joinMatch(roomCode, userId, username);
            break;
          default:
            result = { success: false, error: 'Invalid action' };
        }
        break;

      case 'GET':
        result = await getAvailableMatches();
        break;

      default:
        result = { success: false, error: 'Method not allowed' };
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers
    });
  }
}
