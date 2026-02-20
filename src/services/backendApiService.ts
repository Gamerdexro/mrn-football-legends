/**
 * Backend API Service
 * Connects to the MRN Football Legends backend on Render
 * Handles authentication, match results, and player data
 */

// Change this URL after you deploy to Render
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const API = {
  REGISTER: `${BACKEND_URL}/api/register`,
  LOGIN: `${BACKEND_URL}/api/login`,
  PLAYER: (id: string) => `${BACKEND_URL}/api/player/${id}`,
  MATCH_RESULT: `${BACKEND_URL}/api/match-result`,
  LEADERBOARD: `${BACKEND_URL}/api/leaderboard`,
  ADD_COINS: `${BACKEND_URL}/api/add-coins`,
  HEALTH: `${BACKEND_URL}/health`,
};

// Get token from localStorage
export function getToken(): string | null {
  return localStorage.getItem('gameToken');
}

// Save token to localStorage
export function saveToken(token: string): void {
  localStorage.setItem('gameToken', token);
}

// Clear token on logout
export function clearToken(): void {
  localStorage.removeItem('gameToken');
  localStorage.removeItem('userId');
}

// Register new user with backend
export async function registerWithBackend(
  username: string,
  email: string,
  password: string
): Promise<{ token: string; user: any }> {
  const response = await fetch(API.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  const data = await response.json();
  saveToken(data.token);
  localStorage.setItem('userId', data.user.id);
  return data;
}

// Login with backend
export async function loginWithBackend(
  username: string,
  password: string
): Promise<{ token: string; user: any }> {
  const response = await fetch(API.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  saveToken(data.token);
  localStorage.setItem('userId', data.user.id);
  return data;
}

// Get player profile from backend
export async function getPlayerProfile(playerId: string): Promise<any> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(API.PLAYER(playerId), {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch player profile');
  }

  return response.json();
}

// Record match result on backend
export async function recordMatchResult(
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number,
  matchType: 'friendly' | 'ranked' | 'campaign' = 'friendly'
): Promise<any> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(API.MATCH_RESULT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      player1Id,
      player2Id,
      player1Score,
      player2Score,
      matchType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to record match');
  }

  return response.json();
}

// Get leaderboard from backend
export async function getLeaderboard(): Promise<any[]> {
  const response = await fetch(API.LEADERBOARD);

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
}

// Add coins to player
export async function addCoins(amount: number): Promise<any> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(API.ADD_COINS, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });

  if (!response.ok) {
    throw new Error('Failed to add coins');
  }

  return response.json();
}

// Check backend health
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(API.HEALTH);
    return response.ok;
  } catch {
    return false;
  }
}
