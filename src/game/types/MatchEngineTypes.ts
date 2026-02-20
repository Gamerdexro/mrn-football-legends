import { Vector3, Euler } from 'three';

export interface GameConfig {
  matchDuration: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard';
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  stadiumType: 'day' | 'night' | 'wet';
}

export interface PlayerStats {
  pace?: number; // 0-100 (legacy)
  shooting?: number; // 0-100 (legacy)
  passing?: number; // 0-100 (legacy)
  dribbling?: number; // 0-100 (legacy)
  defending?: number; // 0-100 (legacy)
  physical?: number; // 0-100 (legacy)
  tackling?: number; // 0-100 (legacy)
  shotPower: number; // 0-100
  shotAccuracy: number; // 0-100
  reaction: number; // 0-100
  positioning: number; // 0-100
  jump: number; // 0-100
  strength: number; // 0-100
  composure: number; // 0-100
  topSpeed: number; // meters/second
  acceleration: number; // meters/second²
  dribble: number; // 0-100
  balance: number; // 0-100
  turnRadius?: number; // legacy tuning hook
  stamina?: number; // legacy tuning hook
  bodyType: 'light' | 'medium' | 'heavy';
}

export interface BallState {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  spin: Vector3;
  inPossession: boolean;
  lastTouchedBy: string | null;
}

export interface PlayerState {
  id: string;
  position: Vector3;
  velocity: Vector3;
  rotation: Euler;
  stats: PlayerStats;
  currentStamina: number;
  hasBall: boolean;
  isControlled: boolean;
  team: 'home' | 'away';
  role: 'player' | 'goalkeeper';
}

export interface MatchState {
  ballState: BallState;
  players: PlayerState[];
  matchTime: number;
  score: { home: number; away: number };
  gamePhase: 'first_half' | 'second_half' | 'extra_time' | 'penalty_shootout' | 'finished';
}

export interface AIInput {
  playerId: string;
  action: 'none' | 'shoot' | 'pass' | 'tackle' | 'slide' | 'dribble' | 'clear' | 'hold_ball' | 'move_to_space';
  targetPosition: Vector3;
  targetPlayer?: string;
  power: number; // 0-1
  direction: Vector3;
  timestamp: number;
}

export interface CollisionData {
  player1Id: string;
  player2Id: string;
  contactPoint: Vector3;
  relativeVelocity: number;
  angle: number;
  ballContactFirst: boolean;
}

export interface FoulData {
  severity: 'light' | 'medium' | 'serious' | 'violent';
  type: 'trip' | 'aggressive_tackle' | 'dangerous_slide' | 'handball';
  player: string;
  position: Vector3;
  time: number;
}

export interface SetPieceData {
  type: 'free_kick' | 'penalty' | 'throw_in' | 'corner' | 'goal_kick';
  position: Vector3;
  team: 'home' | 'away';
  wallDistance?: number;
}

export interface GoalkeeperAction {
  type: 'dive_left' | 'dive_right' | 'dive_center' | 'stay' | 'punch' | 'catch' | 'parry' | 'parry_wide';
  direction: Vector3;
  timing: number; // 0-1 (0 = early, 1 = perfect)
  power: number; // 0-1
}
