import { MatchPlayer, Vector3 } from '../../types/match';

/**
 * LAYERED AI SYSTEM
 * 
 * Layer 1: Formation Positioning
 * Layer 2: Ball Awareness
 * Layer 3: Tactical Decision Making
 * Layer 4: Reactive Behavior (tackles, blocks)
 */

export interface AIDecision {
  action: 'move' | 'pass' | 'shoot' | 'tackle' | 'block' | 'cover';
  targetPosition?: Vector3;
  targetPlayer?: string;
  urgency: 0 | 1 | 2 | 3; // 0=low, 3=critical
  confidence: number; // 0-1
}

export class LayeredAISystem {
  /**
   * LAYER 1: Formation Positioning
   * Maintains defensive/offensive shape
   */
  private Layer1_FormationPositioning(player: MatchPlayer, teammates: MatchPlayer[]): Vector3 {
    const role = player.role;
    const isAttacking = player.team === 'home'; // Simplified

    // Get base position for role
    const baseFormation = this.getFormationPosition(role, isAttacking);

    // Adjust based on ball position
    const ballInfluence = this.getFormationAdjustmentFromBall(baseFormation, player);

    return {
      x: baseFormation.x + ballInfluence.x * 0.1,
      y: 0.43,
      z: baseFormation.z + ballInfluence.z * 0.1,
    };
  }

  private getFormationPosition(role: string, isAttacking: boolean): Vector3 {
    const formations: Record<string, Vector3> = {
      goalkeeper: { x: 0, y: 0.43, z: -52 },
      defender: { x: isAttacking ? 30 : -30, y: 0.43, z: 0 },
      midfielder: { x: isAttacking ? 15 : -15, y: 0.43, z: 0 },
      attacker: { x: isAttacking ? 40 : -40, y: 0.43, z: 0 },
    };

    return formations[role] || { x: 0, y: 0.43, z: 0 };
  }

  private getFormationAdjustmentFromBall(basePos: Vector3, player: MatchPlayer): Vector3 {
    // Compact formation when defending, spread when attacking
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * LAYER 2: Ball Awareness
   * React to ball proximity and possession
   */
  private Layer2_BallAwareness(
    player: MatchPlayer,
    ball: Vector3,
    teammates: MatchPlayer[],
    opponents: MatchPlayer[]
  ): AIDecision {
    const distanceToBall = this.getDistance(player.position, ball);

    // If very close to ball, make tactical decision
    if (distanceToBall < 5) {
      return this.Layer3_TacticalDecisionMaking(player, ball, teammates, opponents);
    }

    // If moderately close, move towards ball
    if (distanceToBall < 15) {
      return {
        action: 'move',
        targetPosition: ball,
        urgency: 1,
        confidence: 0.7,
      };
    }

    // If far from ball, maintain formation
    return {
      action: 'move',
      targetPosition: this.Layer1_FormationPositioning(player, teammates),
      urgency: 0,
      confidence: 0.9,
    };
  }

  /**
   * LAYER 3: Tactical Decision Making
   * Decides best action: pass, shoot, tackle, cover
   */
  private Layer3_TacticalDecisionMaking(
    player: MatchPlayer,
    ball: Vector3,
    teammates: MatchPlayer[],
    opponents: MatchPlayer[]
  ): AIDecision {
    // If can shoot
    const distanceToGoal = Math.abs(ball.x - (player.team === 'home' ? 52 : -52));
    if (
      distanceToGoal < 25 &&
      player.role === 'attacker' &&
      player.stats.shotPower > 70 &&
      this.isOpenShot(player, opponents)
    ) {
      return {
        action: 'shoot',
        urgency: 2,
        confidence: player.stats.shotPower / 100,
      };
    }

    // If can pass to open teammate
    const bestReceiver = this.findBestReceiver(player, teammates, opponents);
    if (bestReceiver && this.isPassingSafe(player, bestReceiver, opponents)) {
      return {
        action: 'pass',
        targetPlayer: bestReceiver.id,
        urgency: 1,
        confidence: 0.8,
      };
    }

    // If defender and opponent close, tackle
    if (player.role === 'defender') {
      const closestOpponent = this.findClosestOpponent(player, opponents);
      if (closestOpponent && this.getDistance(player.position, closestOpponent.position) < 3) {
        return {
          action: 'tackle',
          targetPlayer: closestOpponent.id,
          urgency: 2,
          confidence: player.stats.defense / 100,
        };
      }
    }

    // Default: dribble
    return {
      action: 'move',
      targetPosition: this.calculateDribblePosition(player, opponents),
      urgency: 1,
      confidence: 0.5,
    };
  }

  /**
   * LAYER 4: Reactive Behavior
   * Immediate reactions to threats
   */
  private Layer4_ReactiveBehavior(
    player: MatchPlayer,
    opponents: MatchPlayer[],
    ball: Vector3
  ): AIDecision | null {
    // If opponent too close, block or cover
    const threateningOpponent = opponents.find(
      (opp) => this.getDistance(player.position, opp.position) < 2 && opp.role !== 'goalkeeper'
    );

    if (threateningOpponent) {
      return {
        action: 'block',
        targetPlayer: threateningOpponent.id,
        urgency: 3,
        confidence: 0.7,
      };
    }

    // If goalkeeper and ball heading to goal
    if (player.role === 'goalkeeper') {
      const ballVelocityToGoal = ball.x > 0 ? ball.x + 50 : ball.x - 50;
      if (Math.abs(ballVelocityToGoal) < 10) {
        return {
          action: 'move',
          targetPosition: ball,
          urgency: 3,
          confidence: 0.9,
        };
      }
    }

    return null;
  }

  /**
   * COMBINED DECISION ENGINE
   * Runs all layers and returns best decision
   */
  public makeDecision(
    player: MatchPlayer,
    ball: Vector3,
    teammates: MatchPlayer[],
    opponents: MatchPlayer[]
  ): AIDecision {
    // Layer 4 (Reactive) has highest priority
    const reactiveDecision = this.Layer4_ReactiveBehavior(player, opponents, ball);
    if (reactiveDecision) return reactiveDecision;

    // Layer 2/3 (Ball Awareness + Tactics)
    const ballAwarenessDecision = this.Layer2_BallAwareness(player, ball, teammates, opponents);

    return ballAwarenessDecision;
  }

  // Helper methods
  private findBestReceiver(player: MatchPlayer, teammates: MatchPlayer[], opponents: MatchPlayer[]): MatchPlayer | null {
    let bestReceiver: MatchPlayer | null = null;
    let bestScore = -Infinity;

    teammates.forEach((teammate) => {
      if (teammate.id === player.id || teammate.stamina < 10) return;

      const distance = this.getDistance(player.position, teammate.position);
      const forwardPass = teammate.position.x > player.position.x ? 1 : 0.5;
      const openness = this.isPlayerOpen(teammate, opponents) ? 1 : 0.3;
      const staminaBonus = teammate.stamina / 100;

      const score = forwardPass * 0.4 + openness * 0.4 + (1 - Math.min(distance / 60, 1)) * 0.2;

      if (score > bestScore) {
        bestScore = score;
        bestReceiver = teammate;
      }
    });

    return bestReceiver;
  }

  private isPassingSafe(passer: MatchPlayer, receiver: MatchPlayer, opponents: MatchPlayer[]): boolean {
    // Check if any opponent is in passing lane
    const passLine = { start: passer.position, end: receiver.position };

    for (const opponent of opponents) {
      const distanceToLine = this.pointToLineDistance(opponent.position, passLine);
      if (distanceToLine < 2) {
        return false;
      }
    }

    return true;
  }

  private isPlayerOpen(player: MatchPlayer, opponents: MatchPlayer[]): boolean {
    // Player is open if no opponent within marking distance
    return !opponents.some((opp) => this.getDistance(player.position, opp.position) < 3);
  }

  private isOpenShot(player: MatchPlayer, opponents: MatchPlayer[]): boolean {
    // Check if goalkeeper is out of position or player has time
    const shotAngle = Math.abs(player.position.z) / 7.32; // Goal height
    return shotAngle < 0.5 || !this.hasTimeToShoot(player, opponents);
  }

  private hasTimeToShoot(player: MatchPlayer, opponents: MatchPlayer[]): boolean {
    const closestOpponent = this.findClosestOpponent(player, opponents);
    if (!closestOpponent) return true;

    const distance = this.getDistance(player.position, closestOpponent.position);
    return distance > 1.5; // At least 1.5m away
  }

  private calculateDribblePosition(player: MatchPlayer, opponents: MatchPlayer[]): Vector3 {
    // Move away from nearest opponent towards goal
    const closestOpponent = this.findClosestOpponent(player, opponents);

    if (!closestOpponent) {
      // Move forward
      return { x: player.position.x + 5, y: 0.43, z: player.position.z };
    }

    // Dribble away from opponent
    const away = {
      x: player.position.x - closestOpponent.position.x,
      z: player.position.z - closestOpponent.position.z,
    };

    const length = Math.sqrt(away.x ** 2 + away.z ** 2);
    return {
      x: player.position.x + (away.x / length) * 5,
      y: 0.43,
      z: player.position.z + (away.z / length) * 5,
    };
  }

  private findClosestOpponent(player: MatchPlayer, opponents: MatchPlayer[]): MatchPlayer | undefined {
    let closest: MatchPlayer | undefined;
    let minDistance = Infinity;

    opponents.forEach((opp) => {
      const distance = this.getDistance(player.position, opp.position);
      if (distance < minDistance) {
        minDistance = distance;
        closest = opp;
      }
    });

    return closest;
  }

  private getDistance(p1: Vector3, p2: Vector3): number {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  private pointToLineDistance(
    point: Vector3,
    line: { start: Vector3; end: Vector3 }
  ): number {
    const dx = line.end.x - line.start.x;
    const dz = line.end.z - line.start.z;
    const t = Math.max(0, Math.min(1, ((point.x - line.start.x) * dx + (point.z - line.start.z) * dz) / (dx * dx + dz * dz)));

    const closestX = line.start.x + t * dx;
    const closestZ = line.start.z + t * dz;

    return Math.sqrt((point.x - closestX) ** 2 + (point.z - closestZ) ** 2);
  }
}

/**
 * Formation Manager
 */
export class FormationManager {
  private formation: string = '4-3-3';

  public getFormation(): string {
    return this.formation;
  }

  public setFormation(formation: string): void {
    if (['5-3-2', '4-3-3', '4-2-3-1', '3-5-2', '5-4-1'].includes(formation)) {
      this.formation = formation;
    }
  }

  /**
   * Get ideal positions for all outfield players in formation
   */
   public getFormationPositions(isHome: boolean): Vector3[] {
    const direction = isHome ? 1 : -1;

    const positions: Record<string, Record<string, Vector3[]>> = {
      '4-3-3': {
        home: [
          { x: -50 * direction, y: 0.43, z: 0 }, // GK
          { x: -30 * direction, y: 0.43, z: -15 },
          { x: -30 * direction, y: 0.43, z: -5 },
          { x: -30 * direction, y: 0.43, z: 5 },
          { x: -30 * direction, y: 0.43, z: 15 },
          { x: 0, y: 0.43, z: -10 },
          { x: 0, y: 0.43, z: 0 },
          { x: 0, y: 0.43, z: 10 },
          { x: 30 * direction, y: 0.43, z: -8 },
          { x: 30 * direction, y: 0.43, z: 0 },
          { x: 30 * direction, y: 0.43, z: 8 },
        ],
        away: [
          { x: 50 * direction, y: 0.43, z: 0 }, // GK
          { x: 30 * direction, y: 0.43, z: -15 },
          { x: 30 * direction, y: 0.43, z: -5 },
          { x: 30 * direction, y: 0.43, z: 5 },
          { x: 30 * direction, y: 0.43, z: 15 },
          { x: 0, y: 0.43, z: -10 },
          { x: 0, y: 0.43, z: 0 },
          { x: 0, y: 0.43, z: 10 },
          { x: -30 * direction, y: 0.43, z: -8 },
          { x: -30 * direction, y: 0.43, z: 0 },
          { x: -30 * direction, y: 0.43, z: 8 },
        ],
      },
      '3-5-2': {
        home: [
          { x: -50 * direction, y: 0.43, z: 0 },
          { x: -25 * direction, y: 0.43, z: -20 },
          { x: -25 * direction, y: 0.43, z: 0 },
          { x: -25 * direction, y: 0.43, z: 20 },
          { x: 0, y: 0.43, z: -15 },
          { x: 0, y: 0.43, z: -5 },
          { x: 0, y: 0.43, z: 5 },
          { x: 0, y: 0.43, z: 15 },
          { x: 25 * direction, y: 0.43, z: -6 },
          { x: 25 * direction, y: 0.43, z: 6 },
        ],
        away: [
          { x: 50 * direction, y: 0.43, z: 0 },
          { x: 25 * direction, y: 0.43, z: -20 },
          { x: 25 * direction, y: 0.43, z: 0 },
          { x: 25 * direction, y: 0.43, z: 20 },
          { x: 0, y: 0.43, z: -15 },
          { x: 0, y: 0.43, z: -5 },
          { x: 0, y: 0.43, z: 5 },
          { x: 0, y: 0.43, z: 15 },
          { x: -25 * direction, y: 0.43, z: -6 },
          { x: -25 * direction, y: 0.43, z: 6 },
        ],
      },
    };

    return positions[this.formation]?.[isHome ? 'home' : 'away'] || positions['4-3-3']?.[isHome ? 'home' : 'away'] || [];
  }
}
