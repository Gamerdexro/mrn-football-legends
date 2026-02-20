import { MatchPlayer, Vector3, Stadium, MatchRules, Celebration } from '../types/match';

/**
 * Utility functions for match system
 */

export class MatchUtilities {
  /**
   * Create a default stadium
   */
  static createDefaultStadium(): Stadium {
    return {
      id: 'default-stadium',
      name: 'Default Stadium',
      capacity: 60000,
      grassType: 'natural',
      length: 105,
      width: 68,
      lightingLevel: 100,
      model: 'default',
    };
  }

  /**
   * Create default match rules
   */
  static createDefaultRules(): MatchRules {
    return {
      timeLength: 45,
      allowCards: true,
      allowOffsides: true,
      aiDifficulty: 'normal',
      allowSpectators: true,
      allowExtraTime: true,
    };
  }

  /**
   * Generate random player
   */
  static generateRandomPlayer(team: 'home' | 'away', index: number, role: string): MatchPlayer {
    return {
      id: `${team}-player-${index}`,
      name: `${team === 'home' ? 'Home' : 'Away'} Player ${index + 1}`,
      role: role as any,
      stats: {
        speed: 60 + Math.floor(Math.random() * 40),
        acceleration: 60 + Math.floor(Math.random() * 40),
        control: 60 + Math.floor(Math.random() * 40),
        strength: 60 + Math.floor(Math.random() * 40),
        shotPower: 60 + Math.floor(Math.random() * 40),
        passing: 60 + Math.floor(Math.random() * 40),
        defense: 60 + Math.floor(Math.random() * 40),
        stamina: 80 + Math.floor(Math.random() * 20),
        agility: 60 + Math.floor(Math.random() * 40),
        heading: 60 + Math.floor(Math.random() * 40),
        dribble: 60 + Math.floor(Math.random() * 40),
        balance: 60 + Math.floor(Math.random() * 40),
      },
      position: { x: 0, y: 0.43, z: 0 },
      rotation: 0,
      stamina: 100,
      maxStamina: 100,
      isSelected: index === 0 && team === 'home',
      team,
      jersey: team === 'home' ? 'blue' : 'red',
      shortNumber: index + 1,
      currentAnimation: 'idle',
      velocity: { x: 0, y: 0, z: 0 },
      isSprinting: false,
      fatigue: 0,
    };
  }

  /**
   * Get player position name
   */
  static getPositionName(role: string): string {
    const positionNames: Record<string, string> = {
      goalkeeper: 'GK',
      defender: 'DEF',
      midfielder: 'MID',
      attacker: 'ATT',
    };
    return positionNames[role] || 'N/A';
  }

  /**
   * Calculate distance between two points
   */
  static getDistance(p1: Vector3, p2: Vector3): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calculate angle between two points
   */
  static getAngle(from: Vector3, to: Vector3): number {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    return Math.atan2(dz, dx);
  }

  /**
   * Clamp value between min and max
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Get celebration emoji
   */
  static getCelebrationEmoji(celebration: Celebration): string {
    const emojiMap: Record<Celebration, string> = {
      'slide-knees': '⛹️',
      'arms-spread': '🙌',
      'backflip': '🤸',
      'heart-hands': '❤️',
      'knee-pump': '🦵',
      'jump-turn': '🔄',
      'shush': '🤐',
      'point-sky': '☝️',
      'chest-pound': '💪',
      'spin-around': '🌀',
      'group-celebration': '👥',
      'fist-pump': '✊',
      'corner-run': '🏃',
      'pop-off-dance': '💃',
      'knee-tap': '🎯',
      'salute': '🫡',
      'shoulder-shimmy': '💃',
      'slide-flip': '🤾',
      'slow-wink': '😉',
      'jumping-jacks': '🤾',
      'breakdance': '🎪',
      'statue-pose': '🗿',
      'taunt-shrug': '🤷',
      'wave-crowd': '👋',
      'flex': '💪',
    };
    return emojiMap[celebration] || '🎉';
  }

  /**
   * Format match time as MM:SS
   */
  static formatMatchTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Get team color class
   */
  static getTeamColorClass(team: 'home' | 'away'): string {
    return team === 'home' ? 'text-blue-500' : 'text-red-500';
  }

  /**
   * Get team background class
   */
  static getTeamBgClass(team: 'home' | 'away'): string {
    return team === 'home' ? 'bg-blue-600' : 'bg-red-600';
  }
}

/**
 * Match event builders
 */
export const EventBuilders = {
  createGoalEvent: (timestamp: number, playerId: string, team: 'home' | 'away', playerName: string) => ({
    id: `goal-${Date.now()}`,
    type: 'goal' as const,
    timestamp,
    player: playerId,
    team,
    description: `${playerName} scores!`,
  }),

  createAssistEvent: (timestamp: number, playerId: string, team: 'home' | 'away', playerName: string) => ({
    id: `assist-${Date.now()}`,
    type: 'assist' as const,
    timestamp,
    player: playerId,
    team,
    description: `${playerName} with the assist`,
  }),

  createFoulEvent: (timestamp: number, playerId: string, team: 'home' | 'away', playerName: string) => ({
    id: `foul-${Date.now()}`,
    type: 'foul' as const,
    timestamp,
    player: playerId,
    team,
    description: `${playerName} commits a foul`,
  }),

  createShotEvent: (timestamp: number, playerId: string, team: 'home' | 'away', playerName: string, onTarget: boolean) => ({
    id: `shot-${Date.now()}`,
    type: 'shot' as const,
    timestamp,
    player: playerId,
    team,
    description: `${playerName} takes a shot ${onTarget ? '(on target)' : '(wide)'}`,
  }),

  createOffsideEvent: (timestamp: number, playerId: string, team: 'home' | 'away', playerName: string) => ({
    id: `offside-${Date.now()}`,
    type: 'offside' as const,
    timestamp,
    player: playerId,
    team,
    description: `${playerName} is in an offside position`,
  }),

  createCornerEvent: (timestamp: number, team: 'home' | 'away') => ({
    id: `corner-${Date.now()}`,
    type: 'corner' as const,
    timestamp,
    player: '',
    team,
    description: `Corner kick awarded to ${team === 'home' ? 'Home' : 'Away'}`,
  }),
};

/**
 * Match validators
 */
export const MatchValidators = {
  isValidPlayer: (player: MatchPlayer): boolean => {
    return (
      player.id !== '' &&
      player.name !== '' &&
      player.team !== null &&
      player.shortNumber > 0 &&
      player.stats.speed >= 0 &&
      player.stats.speed <= 100
    );
  },

  isValidFormation: (formation: string): boolean => {
    const validFormations = ['5-3-2', '4-3-3', '4-2-3-1', '3-5-2', '5-4-1'];
    return validFormations.includes(formation);
  },

  isValidRole: (role: string): boolean => {
    const validRoles = ['goalkeeper', 'defender', 'midfielder', 'attacker'];
    return validRoles.includes(role);
  },

  canStartMatch: (homeTeam: MatchPlayer[], awayTeam: MatchPlayer[]): boolean => {
    return (
      homeTeam.length === 11 &&
      awayTeam.length === 11 &&
      homeTeam.some((p) => p.role === 'goalkeeper') &&
      awayTeam.some((p) => p.role === 'goalkeeper')
    );
  },
};

/**
 * Analytics helpers
 */
export const MatchAnalytics = {
  calculatePlayerRating: (player: MatchPlayer): number => {
    const stats = player.stats;
    return (
      stats.speed +
      stats.acceleration +
      stats.control +
      stats.strength +
      stats.shotPower +
      stats.passing +
      stats.defense +
      stats.stamina +
      stats.agility +
      stats.heading
    ) / 10;
  },

  getPlayerFormationPosition: (role: string): { x: number; z: number } => {
    const positions: Record<string, { x: number; z: number }> = {
      goalkeeper: { x: 0, z: -50 },
      defender: { x: -30, z: 0 },
      midfielder: { x: 0, z: 0 },
      attacker: { x: 30, z: 0 },
    };
    return positions[role] || { x: 0, z: 0 };
  },

  estimateMatchDuration: (timeLength: number, stoppageTime: number = 5): number => {
    return timeLength * 2 + stoppageTime;
  },
};

/**
 * Performance helpers
 */
export const PerformanceOptimizations = {
  // Debounce function calls
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // Throttle function calls
  throttle: <T extends (...args: any[]) => any>(fn: T, limit: number) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Request animation frame helper
  scheduleAnimationFrame: (callback: FrameRequestCallback): number => {
    return requestAnimationFrame(callback);
  },

  cancelAnimationFrame: (id: number): void => {
    cancelAnimationFrame(id);
  },
};
