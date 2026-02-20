import { MatchPlayer, Vector3 } from '../../types/match';

export class OffsideDetectionService {
  private readonly PITCH_LENGTH = 105;

  // Check if a pass results in offside
  checkOffside(
    passer: MatchPlayer,
    receiver: MatchPlayer,
    defenders: MatchPlayer[],
    passTime: number
  ): { isOffside: boolean; reason: string } {
    // Offside doesn't apply in own half
    if (this.isInOwnHalf(receiver)) {
      return { isOffside: false, reason: 'Receiver in own half' };
    }

    // Find the second-last defender position
    const defenderLine = this.getDefenderLine(defenders, receiver.team === 'home' ? 'away' : 'home');

    // Check if receiver is ahead of second-last defender
    const passLineX = passer.position.x;
    const receiverX = receiver.position.x;
    const defenderX = defenderLine;

    const isReceiverAhead = this.isPlayerAhead(receiverX, defenderX, receiver.team);

    if (isReceiverAhead) {
      return {
        isOffside: true,
        reason: `Player at ${receiverX} ahead of defender line at ${defenderX}`,
      };
    }

    return { isOffside: false, reason: 'Legal pass' };
  }

  // Get the highest defender line position
  private getDefenderLine(defenders: MatchPlayer[], team: 'home' | 'away'): number {
    if (defenders.length === 0) return team === 'home' ? -52 : 52;

    const teamDefenders = defenders.filter((d) => d.team === team);
    if (teamDefenders.length === 0) return team === 'home' ? -52 : 52;

    // Sort defenders by x position and get the second-last
    const sortedByX = teamDefenders.sort((a, b) => a.position.x - b.position.x);
    return sortedByX.length > 1 ? sortedByX[1].position.x : sortedByX[0].position.x;
  }

  private isPlayerAhead(playerX: number, defenderX: number, team: 'home' | 'away'): boolean {
    if (team === 'home') {
      return playerX > defenderX;
    } else {
      return playerX < defenderX;
    }
  }

  private isInOwnHalf(player: MatchPlayer): boolean {
    if (player.team === 'home') {
      return player.position.x < 0;
    } else {
      return player.position.x > 0;
    }
  }

  // Visualize offside line for UI
  getOffsideLinePosition(defenders: MatchPlayer[], team: 'home' | 'away'): number {
    return this.getDefenderLine(defenders, team);
  }
}

export class StaminaSystem {
  private readonly MAX_STAMINA = 100;
  private readonly SPRINT_DRAIN = 8; // per second
  private readonly MOVEMENT_DRAIN = 2;
  private readonly RECOVERY_RATE = 1.5; // per second when idle

  updateStamina(player: MatchPlayer, deltaTime: number, state: { isSprinting: boolean; isMoving: boolean }): number {
    let drainRate = 0;

    if (state.isSprinting && player.stamina > 0) {
      drainRate = this.SPRINT_DRAIN;
    } else if (state.isMoving) {
      drainRate = this.MOVEMENT_DRAIN;
    } else {
      drainRate = -this.RECOVERY_RATE; // Negative = recovery
    }

    const newStamina = player.stamina - drainRate * deltaTime;
    return Math.max(0, Math.min(this.MAX_STAMINA, newStamina));
  }

  // Calculate speed modifier based on stamina
  getSpeedModifier(player: MatchPlayer): number {
    const staminaRatio = player.stamina / this.MAX_STAMINA;

    if (staminaRatio > 0.8) return 1.0;
    if (staminaRatio > 0.5) return 0.95;
    if (staminaRatio > 0.3) return 0.85;
    return 0.7; // Critical stamina
  }

  // Can sprint check
  canSprint(player: MatchPlayer): boolean {
    return player.stamina > 10;
  }

  // Get stamina color for UI
  getStaminaColor(stamina: number): string {
    if (stamina > 70) return '#10b981'; // green
    if (stamina > 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }
}

export class CelebrationSystem {
  private readonly CELEBRATION_DURATIONS: Record<string, number> = {
    'slide-knees': 3,
    'arms-spread': 2.5,
    'backflip': 3.5,
    'heart-hands': 2,
    'knee-pump': 1.5,
    'jump-turn': 2,
    'shush': 2.5,
    'point-sky': 2,
    'chest-pound': 1.5,
    'spin-around': 2,
    'group-celebration': 4,
    'fist-pump': 1.5,
    'corner-run': 3,
    'pop-off-dance': 3,
    'knee-tap': 1.5,
    'salute': 2,
    'shoulder-shimmy': 2.5,
    'slide-flip': 3,
    'slow-wink': 2,
    'jumping-jacks': 2,
    'breakdance': 4,
    'statue-pose': 2.5,
    'taunt-shrug': 1.5,
    'wave-crowd': 2,
    'flex': 2,
  };

  private readonly CROWD_REACTIONS: Record<string, number> = {
    'slide-knees': 0.9,
    'arms-spread': 0.8,
    'backflip': 0.85,
    'heart-hands': 0.7,
    'group-celebration': 0.95,
    'flex': 0.75,
  };

  // Get celebration duration
  getDuration(celebrationType: string): number {
    return this.CELEBRATION_DURATIONS[celebrationType] || 2.5;
  }

  // Get crowd reaction intensity
  getCrowdReaction(celebrationType: string): number {
    return this.CROWD_REACTIONS[celebrationType] || 0.5;
  }

  // Get celebration animation name
  getAnimationName(celebrationType: string): string {
    const animationMap: Record<string, string> = {
      'slide-knees': 'celebration_slide',
      'arms-spread': 'celebration_arms_wide',
      'backflip': 'celebration_backflip',
      'heart-hands': 'celebration_heart',
      'group-celebration': 'celebration_group_hug',
    };

    return animationMap[celebrationType] || 'celebration_default';
  }

  // Apply momentum boost from celebration
  getMomentumBoost(celebrationType: string): number {
    const impactfulCelebrations = ['group-celebration', 'flex', 'backflip', 'arms-spread'];
    return impactfulCelebrations.includes(celebrationType) ? 0.15 : 0.05;
  }
}

export class PenaltyShootoutService {
  // Calculate goalkeeper dive direction
  calculateGoalkeeperDive(
    shooterBias: { left: number; center: number; right: number },
    difficulty: 'easy' | 'normal' | 'hard' | 'expert'
  ): 'left' | 'center' | 'right' {
    const random = Math.random();
    const difficultyMultiplier = {
      easy: 0.3,
      normal: 0.5,
      hard: 0.7,
      expert: 0.85,
    }[difficulty];

    // On higher difficulty, GK guesses better
    if (random < 0.4 * difficultyMultiplier) {
      return shooterBias.left > shooterBias.right ? 'left' : 'right';
    }

    return 'center';
  }

  // Determine if penalty is scored
  scoresPenalty(
    shotDirection: 'left' | 'center' | 'right',
    shotPower: number,
    playerAccuracy: number,
    gkDiveDirection: 'left' | 'center' | 'right',
    gkReflexes: number
  ): boolean {
    // Base score chance on shot accuracy
    let scoreChance = playerAccuracy / 100;

    // Power affects accuracy (too much power = less accurate)
    if (shotPower > 0.9) {
      scoreChance *= 0.85;
    }

    // If GK guesses right, reduce score chance significantly
    if (shotDirection === gkDiveDirection) {
      const saveChance = (gkReflexes / 100) * 0.7;
      scoreChance *= 1 - saveChance;
    }

    return Math.random() < scoreChance;
  }

  // Calculate penalty kick height
  getKickHeight(power: number): number {
    // Power 0-1, height affects if GK can reach
    return power * 2.44; // Goal height
  }
}
