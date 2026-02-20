export interface MatchTeam {
    uid: string;
    username: string;
    ovr: number;
    squad: string[];
    avatar?: string;
}

export type MatchStatus = 'WAITING' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface Match {
    id: string;
    hostId: string;
    teamA: MatchTeam;
    teamB?: MatchTeam;
    status: MatchStatus;
    createdAt: number;
    scheduledFor?: number; // Optional: for future scheduled matches
    score?: {
        teamA: number;
        teamB: number;
    };
    winnerId?: string;
}

export interface CreateMatchDTO {
    hostId: string;
    username: string;
    ovr: number;
    squad: string[];
    scheduledFor?: number;
}

// Extended Match System Types
export type MatchState = 'idle' | 'team-select' | 'countdown' | 'in-play' | 'half-time' | 'full-time' | 'penalty' | 'extra-time';
export type MatchMode = 'friendly' | 'ranked' | 'campaign';
export type TeamFormation = '5-3-2' | '4-3-3' | '4-2-3-1' | '3-5-2' | '5-4-1';
export type StadiumSize = '11v11' | '7v7' | '5v5' | '3v3';
export type PlayerRole = 'goalkeeper' | 'defender' | 'midfielder' | 'attacker';
export type SkillMove = 'step-over' | 'elastico' | 'drag-back' | 'heel-flick' | 'nutmeg' | 'ball-roll' | 'scoop-turn';
export type Celebration = 
  | 'slide-knees'
  | 'arms-spread'
  | 'backflip'
  | 'heart-hands'
  | 'knee-pump'
  | 'jump-turn'
  | 'shush'
  | 'point-sky'
  | 'chest-pound'
  | 'spin-around'
  | 'group-celebration'
  | 'fist-pump'
  | 'corner-run'
  | 'pop-off-dance'
  | 'knee-tap'
  | 'salute'
  | 'shoulder-shimmy'
  | 'slide-flip'
  | 'slow-wink'
  | 'jumping-jacks'
  | 'breakdance'
  | 'statue-pose'
  | 'taunt-shrug'
  | 'wave-crowd'
  | 'flex';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerStats {
  speed: number;
  acceleration: number;
  control: number;
  strength: number;
  shotPower: number;
  passing: number;
  defense: number;
  stamina: number;
  agility: number;
  heading: number;
  dribble: number;
  balance: number;
}

export interface MatchPlayer extends Player {
  role: PlayerRole;
  stats: PlayerStats;
  position: Vector3;
  rotation: number;
  stamina: number;
  maxStamina: number;
  isSelected: boolean;
  team: 'home' | 'away';
  jersey: string;
  shortNumber: number;
  currentAnimation: string;
  velocity: Vector3;
  isSprinting: boolean;
  fatigue: number;
}

export interface BallPhysics {
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  angularVelocity: Vector3;
  isInAir: boolean;
  lastToucher?: string;
  lastTouchTeam?: 'home' | 'away';
  spin: number;
  friction: number;
}

export interface MatchTeamExtended extends MatchTeam {
  formation: TeamFormation;
  logo: string;
  goals: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  tackles: number;
  foulsCommitted: number;
  yellowCards: number;
  redCards: number;
  possession: number;
  playersOnField: MatchPlayer[];
}

export interface MatchEvent {
  id: string;
  type: 'goal' | 'assist' | 'shot' | 'foul' | 'tackle' | 'pass' | 'own-goal' | 'penalty' | 'offside' | 'corner' | 'throw-in' | 'substitution';
  timestamp: number;
  player: string;
  team: 'home' | 'away';
  description: string;
  x?: number;
  y?: number;
  z?: number;
}

export interface MatchRules {
  timeLength: number;
  allowCards: boolean;
  allowOffsides: boolean;
  aiDifficulty: 'easy' | 'normal' | 'hard' | 'expert';
  allowSpectators: boolean;
  allowExtraTime: boolean;
}

export interface Stadium {
  id: string;
  name: string;
  capacity: number;
  grassType: 'natural' | 'artificial';
  length: number;
  width: number;
  lightingLevel: number;
  model: string;
  crowd?: CrowdState;
}

export interface CrowdState {
  mood: 'neutral' | 'excited' | 'angry' | 'disappointed';
  intensity: number;
  noiseLevel: number;
  animationState: string;
}

export interface WeatherState {
  condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'night';
  windSpeed: number;
  visibility: number;
  ballFriction: number;
  playerTraction: number;
}

export interface MatchLobby {
  id: string;
  host: string;
  homePlayers: string[];
  awayPlayers: string[];
  maxPlayers: number;
  status: 'waiting' | 'ready' | 'in-progress' | 'finished';
  createdAt: number;
  startTime?: number;
  readyPlayers: Set<string>;
  rules: MatchRules;
  stadium: Stadium;
}

export interface ControlState {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  sprint: boolean;
  shoot: boolean;
  pass: boolean;
  throughBall: boolean;
  skillMove?: SkillMove;
  switchPlayer: boolean;
  callSupport: boolean;
  celebration?: Celebration;
  shootPower: number;
  shootDirection: { x: number; y: number };
}

export interface MatchStatistics {
  shotsOnTarget: number;
  totalShots: number;
  passes: number;
  tackles: number;
  interceptions: number;
  possessionPercent: number;
  foulsCommitted: number;
  yellowCards: number;
  redCards: number;
  cornerKicks: number;
  throwIns: number;
  saves: number;
}

export interface PenaltyState {
  isActive: boolean;
  round: number;
  maxRounds: number;
  homeGoals: number;
  awayGoals: number;
  currentTaker: 'home' | 'away';
  shooterPlayer: MatchPlayer | null;
  goalkeeperPlayer: MatchPlayer | null;
  shotDirection?: { x: number; power: number };
  result?: 'scored' | 'saved' | 'missed' | 'post';
}

export interface OfflinePlayerAI {
  playerId: string;
  formation: TeamFormation;
  difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  aggressiveness: number;
  defensiveLineHeight: number;
  pressureIntensity: number;
}

interface Player {
  id: string;
  name: string;
}
