/**
 * ADVANCED GOALKEEPER NEURAL PREDICTION ENGINE
 * 
 * GK uses probabilistic trajectory estimation.
 * When shot triggered, GK calculates PredictedBallPath using 5 future simulation frames.
 * 
 * PredictionConfidence = AngleVisibility × ShotPreparationTime × ShooterBalance
 * 
 * DiveDirectionScore weighted by pattern memory.
 * If shooter always shoots right, RightWeight increases slightly.
 * But never exceeds 25% bias.
 * 
 * Reaction time: ReactionDelay = BaseReaction − AnticipationBonus + FatiguePenalty
 * GK catch decision based on shot power and spin.
 * Parry direction calculated by shot vector reflection.
 */

import type {
  GoalkeeperNeuralEngine as GoalkeeperNeuralEngineContract,
  ShotTrajectory,
  GoalkeeperPrediction,
} from '../types/simulation';

const SIMULATION_FRAMES = 5;
const FRAME_TIME = 0.016; // ~60fps
const BASE_REACTION_TIME = 0.15; // 150ms
const MAX_PATTERN_BIAS = 0.25; // 25% max bias
const BALL_GRAVITY = 0.981; // Standard gravity
const CATCH_POWER_THRESHOLD = 60; // Under 60 kph catchable
const SAFE_SPIN_LIMIT = 0.5; // Spin amount that's safe to catch

interface GKMemoryEntry {
  shooterId: string;
  shotDirection: number; // 0-8 for 8 zones
  timestamp: number;
  confidence: number;
}

export class GoalkeeperNeuralEngine implements GoalkeeperNeuralEngineContract {
  currentPosition: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  personality: 'SAFE_HANDS' | 'ANTICIPATOR' | 'SHOWMAN' = 'SAFE_HANDS';
  reactionTime: number = BASE_REACTION_TIME;
  anticipationBonus: number = 0;
  fatiguePenalty: number = 0;
  patternMemory: Map<string, number> = new Map();
  maxPatternBias: number = MAX_PATTERN_BIAS;

  private shooterHistory: GKMemoryEntry[] = [];
  private maxMemorySize: number = 50;
  private memoryTTL: number = 300000; // 5 minutes

  /**
   * Predict shot trajectory using 5-frame lookahead
   */
  predictShotTrajectory(trajectory: ShotTrajectory, simulationFrames: number = SIMULATION_FRAMES): GoalkeeperPrediction {
    const predictedPath: { x: number; y: number; z: number }[] = [];
    let currentPos = {
      x: trajectory.shooterPos.x,
      y: trajectory.shooterPos.y,
      z: trajectory.shooterPos.z,
    };
    let velocity = {
      x: trajectory.shotVector.x,
      y: trajectory.shotVector.y,
      z: trajectory.shotVector.z,
    };

    // Simulate ball path over N frames
    for (let i = 0; i < simulationFrames; i++) {
      // Apply gravity
      velocity.y -= BALL_GRAVITY * FRAME_TIME;

      // Apply spin drag (simplified)
      velocity.x *= (1 - trajectory.spin.x * 0.01);
      velocity.z *= (1 - trajectory.spin.z * 0.01);

      // Update position
      currentPos.x += velocity.x * FRAME_TIME;
      currentPos.y += velocity.y * FRAME_TIME;
      currentPos.z += velocity.z * FRAME_TIME;

      predictedPath.push({ ...currentPos });

      // Stop if ball hits ground
      if (currentPos.y < 0) break;
    }

    // Calculate prediction confidence
    const predictionConfidence = this.calculatePredictionConfidence(
      trajectory.ballAngleVisibility,
      trajectory.shotPreparationTime,
      trajectory.shooterBalance
    );

    // Calculate dive direction scores
    const diveDirectionScore = this.calculateDiveDirection(trajectory, predictionConfidence);

    // Calculate catch feasibility
    const shotPower = Math.sqrt(
      trajectory.shotVector.x ** 2 + trajectory.shotVector.y ** 2 + trajectory.shotVector.z ** 2
    );
    const spinMagnitude = Math.sqrt(
      trajectory.spin.x ** 2 + trajectory.spin.y ** 2 + trajectory.spin.z ** 2
    );
    const shouldAttemptCatch = shotPower < CATCH_POWER_THRESHOLD && spinMagnitude < SAFE_SPIN_LIMIT;

    // Calculate reaction delay
    const reactionDelay = this.calculateReactionDelay(
      BASE_REACTION_TIME,
      this.getPersonalityAnticipationBonus(),
      this.fatiguePenalty
    );

    // Calculate parry vector
    const parryVector = this.calculateParryVector(trajectory);

    // Calculate optimal position
    const optimalPos = this.calculateOptimalPosition(trajectory.shooterPos.x, 0);

    return {
      predictedBallPath: predictedPath,
      predictionConfidence,
      diveDirectionScore,
      reactionDelay,
      shouldAttemptCatch,
      catchThreshold: CATCH_POWER_THRESHOLD,
      safeSpinLimit: SAFE_SPIN_LIMIT,
      parryVector,
      optimalPosition: optimalPos,
    };
  }

  /**
   * Calculate prediction confidence
   * PredictionConfidence = AngleVisibility × ShotPreparationTime × ShooterBalance
   */
  calculatePredictionConfidence(
    angleVisibility: number,
    prepTime: number,
    shooterBalance: number
  ): number {
    // Normalize inputs to 0-1
    const visibility = Math.min(angleVisibility / 180, 1.0); // Convert degrees to 0-1
    const prep = Math.min(prepTime / 0.5, 1.0); // 500ms = full prep
    const balance = shooterBalance; // Should already be 0-1

    return visibility * 0.4 + prep * 0.35 + balance * 0.25;
  }

  /**
   * Calculate dive direction scores
   */
  private calculateDiveDirection(trajectory: ShotTrajectory, confidence: number): GoalkeeperPrediction['diveDirectionScore'] {
    const goalWidth = 7.32; // Standard goal width
    const ballZ = trajectory.shooterPos.z + trajectory.shotVector.z;

    // Base weights for shot zones
    let nearPostWeight = 0.3;
    let farPostWeight = 0.3;
    let centerWeight = 0.4;

    // Adjust based on ball trajectory
    if (ballZ < -goalWidth / 4) {
      nearPostWeight = 0.6;
      farPostWeight = 0.1;
      centerWeight = 0.3;
    } else if (ballZ > goalWidth / 4) {
      nearPostWeight = 0.1;
      farPostWeight = 0.6;
      centerWeight = 0.3;
    }

    // Apply pattern memory bias (max 25%)
    const shooterId = this.getShooterIdFromTrajectory(trajectory);
    const patternBias = this.patternMemory.get(shooterId) || 0;
    
    if (patternBias > 0.1) {
      // Increase bias toward learned direction
      if (ballZ < 0) {
        nearPostWeight = Math.min(nearPostWeight + patternBias * 0.25, nearPostWeight + MAX_PATTERN_BIAS);
      } else {
        farPostWeight = Math.min(farPostWeight + patternBias * 0.25, farPostWeight + MAX_PATTERN_BIAS);
      }
    }

    // Determine selected zone
    let selectedZone: 'NEAR' | 'FAR' | 'CENTER' | 'HIGH' | 'LOW' = 'CENTER';
    if (nearPostWeight > farPostWeight && nearPostWeight > centerWeight) {
      selectedZone = 'NEAR';
    } else if (farPostWeight > nearPostWeight && farPostWeight > centerWeight) {
      selectedZone = 'FAR';
    } else if (trajectory.shotVector.y > 0.5) {
      selectedZone = 'HIGH';
    } else if (trajectory.shotVector.y < -0.3) {
      selectedZone = 'LOW';
    }

    return {
      nearPostWeight,
      farPostWeight,
      centerWeight,
      selectedZone,
    };
  }

  /**
   * Calculate reaction delay
   * ReactionDelay = BaseReaction − AnticipationBonus + FatiguePenalty
   */
  calculateReactionDelay(baseReaction: number, anticipationBonus: number, fatigue: number): number {
    return baseReaction - anticipationBonus + fatigue;
  }

  /**
   * Calculate optimal position for GK
   * PositionX = GoalCenter + (BallXOffset × PositioningFactor)
   */
  calculateOptimalPosition(ballX: number, goalCenter: number): { x: number; y: number; z: number } {
    const positioningFactor = 0.3; // How much to move based on ball position
    const optimalX = goalCenter + Math.max(ballX * positioningFactor, -5); // Don't go too far forward
    
    // Stay on goal line
    const optimalZ = goalCenter;
    const optimalY = 1.2; // Keeper height

    return { x: optimalX, y: optimalY, z: optimalZ };
  }

  /**
   * Calculate parry vector (reflection of shot)
   */
  private calculateParryVector(trajectory: ShotTrajectory): { x: number; y: number; z: number } {
    // Reflect shot vector with slight randomness
    const palmAngle = Math.random() * 0.2 - 0.1; // Small variation
    const clearanceBias = 0.15; // Bias toward clearing away

    return {
      x: -trajectory.shotVector.x * (0.7 + Math.random() * 0.3) + palmAngle,
      y: Math.abs(trajectory.shotVector.y) * 0.5 + clearanceBias,
      z: -trajectory.shotVector.z * (0.7 + Math.random() * 0.3) + palmAngle,
    };
  }

  /**
   * Update shooter pattern memory
   */
  updateShooterPattern(shooterId: string, shotDirection: { x: number; z: number }): void {
    // Determine which zone (0-8)
    const angle = Math.atan2(shotDirection.z, shotDirection.x);
    const zone = Math.round((angle + Math.PI) / (Math.PI * 2 / 8)) % 8;

    // Add to history
    this.shooterHistory.push({
      shooterId,
      shotDirection: zone,
      timestamp: Date.now(),
      confidence: 0.8,
    });

    // Keep only recent history
    if (this.shooterHistory.length > this.maxMemorySize) {
      this.shooterHistory.shift();
    }

    // Update pattern memory (max 25% bias)
    const shooterShots = this.shooterHistory.filter(h => h.shooterId === shooterId);
    if (shooterShots.length >= 3) {
      // Find most common direction
      const directionCounts = new Map<number, number>();
      shooterShots.forEach(shot => {
        directionCounts.set(shot.shotDirection, (directionCounts.get(shot.shotDirection) || 0) + 1);
      });

      let maxCount = 0;
      let maxDirection = 0;
      directionCounts.forEach((count, dir) => {
        if (count > maxCount) {
          maxCount = count;
          maxDirection = dir;
        }
      });

      // Calculate bias (0 to 25%)
      const bias = Math.min((maxCount / shooterShots.length) * 0.5, MAX_PATTERN_BIAS);
      this.patternMemory.set(shooterId, bias);
    }

    // Clean old memory
    this.cleanMemory();
  }

  /**
   * Clean expired memory entries
   */
  private cleanMemory(): void {
    const now = Date.now();
    this.shooterHistory = this.shooterHistory.filter(entry => now - entry.timestamp < this.memoryTTL);

    // Also clean pattern memory that's old
    this.patternMemory.forEach((_, shooterId) => {
      const recentShots = this.shooterHistory.filter(h => h.shooterId === shooterId);
      if (recentShots.length === 0) {
        this.patternMemory.delete(shooterId);
      }
    });
  }

  /**
   * Get personality-based anticipation bonus
   */
  private getPersonalityAnticipationBonus(): number {
    switch (this.personality) {
      case 'ANTICIPATOR':
        return 0.05; // 50ms faster
      case 'SHOWMAN':
        return -0.02; // 20ms slower but more spectacular
      case 'SAFE_HANDS':
      default:
        return 0.02; // 20ms faster
    }
  }

  /**
   * Placeholder for getting shooter ID from trajectory
   */
  private getShooterIdFromTrajectory(trajectory: ShotTrajectory): string {
    // In real implementation, would encode shooter ID in trajectory
    return `shooter_${Math.floor(trajectory.shooterPos.x)}_${Math.floor(trajectory.shooterPos.z)}`;
  }

  /**
   * Reset memory (match end)
   */
  resetMemory(): void {
    this.patternMemory.clear();
    this.shooterHistory = [];
  }

  /**
   * Set personality
   */
  setPersonality(personality: 'SAFE_HANDS' | 'ANTICIPATOR' | 'SHOWMAN'): void {
    this.personality = personality;
  }

  /**
   * Get pattern analysis for debugging
   */
  getPatternAnalysis(): Record<string, any> {
    return {
      personality: this.personality,
      reactionTime: this.reactionTime,
      patternMemorySize: this.patternMemory.size,
      shooterHistorySize: this.shooterHistory.length,
      patterns: Object.fromEntries(this.patternMemory),
    };
  }
}
