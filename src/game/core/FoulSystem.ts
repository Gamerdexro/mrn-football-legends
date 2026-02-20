import { Vector3 } from 'three';
import { PlayerState, CollisionData, FoulData } from '../types/MatchEngineTypes';

interface RefereePersonality {
  strictness: number; // 0-1, how strict they are
  cardTendency: number; // 0-1, likelihood to show cards
  advantageTendency: number; // 0-1, likelihood to play advantage
  positioning: number; // 0-1, how well positioned they are
}

interface PlayerDisciplinaryRecord {
  playerId: string;
  yellowCards: number;
  redCard: boolean;
  foulHistory: Array<{ time: number; severity: number }>;
}

export class FoulSystem {
  private refereePersonality: RefereePersonality;
  private disciplinaryRecords: Map<string, PlayerDisciplinaryRecord> = new Map();
  private lastFoulTime: number = 0;
  private advantageActive: boolean = false;
  private advantageStartTime: number = 0;
  private foulThresholds = {
    light: { minVelocity: 2, minAngle: Math.PI / 6 },
    medium: { minVelocity: 4, minAngle: Math.PI / 4 },
    serious: { minVelocity: 6, minAngle: Math.PI / 3 },
    violent: { minVelocity: 8, minAngle: Math.PI / 2 }
  };

  constructor(strictness: 'lenient' | 'normal' | 'strict' = 'normal') {
    this.refereePersonality = this.generateRefereePersonality(strictness);
  }

  private generateRefereePersonality(strictness: 'lenient' | 'normal' | 'strict'): RefereePersonality {
    const base = {
      lenient: { strictness: 0.3, cardTendency: 0.2, advantageTendency: 0.8, positioning: 0.6 },
      normal: { strictness: 0.5, cardTendency: 0.5, advantageTendency: 0.5, positioning: 0.7 },
      strict: { strictness: 0.8, cardTendency: 0.8, advantageTendency: 0.3, positioning: 0.9 }
    };

    const personality = base[strictness];
    
    // Add some randomness
    return {
      strictness: Math.max(0, Math.min(1, personality.strictness + (Math.random() - 0.5) * 0.2)),
      cardTendency: Math.max(0, Math.min(1, personality.cardTendency + (Math.random() - 0.5) * 0.2)),
      advantageTendency: Math.max(0, Math.min(1, personality.advantageTendency + (Math.random() - 0.5) * 0.2)),
      positioning: Math.max(0, Math.min(1, personality.positioning + (Math.random() - 0.5) * 0.1))
    };
  }

  public analyzeCollision(collision: CollisionData): FoulData | null {
    // Check if referee is in position to see the foul
    const visibility = this.calculateRefereeVisibility(collision);
    if (visibility < 0.3) return null; // Referee didn't see it

    // Determine foul severity
    const severity = this.calculateFoulSeverity(collision);
    if (severity === 'none') return null;

    // Determine foul type
    const foulType = this.determineFoulType(collision, severity);

    // Create foul data
    const foulData: FoulData = {
      severity,
      type: foulType,
      player: collision.player1Id, // Assume player1 is the aggressor
      position: collision.contactPoint,
      time: Date.now()
    };

    // Check for advantage
    if (this.shouldPlayAdvantage(foulData, collision)) {
      this.startAdvantage();
      return null; // Don't call foul yet
    }

    return foulData;
  }

  private calculateRefereeVisibility(collision: CollisionData): number {
    // Simulate referee positioning and line of sight
    const baseVisibility = this.refereePersonality.positioning;
    
    // Distance from collision affects visibility
    const distance = this.getRefereeDistance(collision.contactPoint);
    const distanceFactor = Math.max(0.2, 1 - distance / 50);
    
    // Angle of collision affects visibility
    const angleFactor = Math.abs(Math.cos(collision.angle));
    
    // Player obstruction (other players blocking view)
    const obstructionFactor = 0.9; // Simplified
    
    return baseVisibility * distanceFactor * angleFactor * obstructionFactor;
  }

  private getRefereeDistance(position: Vector3): number {
    // Simplified referee position (would be tracked in real implementation)
    const refereePosition = new Vector3(0, 0, 0);
    return position.distanceTo(refereePosition);
  }

  private calculateFoulSeverity(collision: CollisionData): 'none' | 'light' | 'medium' | 'serious' | 'violent' {
    const { relativeVelocity, angle, ballContactFirst } = collision;
    
    // If ball was contacted first, less likely to be a foul
    if (ballContactFirst && relativeVelocity < 6) {
      return 'none';
    }

    // Check against thresholds
    if (relativeVelocity >= this.foulThresholds.violent.minVelocity && 
        angle >= this.foulThresholds.violent.minAngle) {
      return 'violent';
    }
    
    if (relativeVelocity >= this.foulThresholds.serious.minVelocity && 
        angle >= this.foulThresholds.serious.minAngle) {
      return 'serious';
    }
    
    if (relativeVelocity >= this.foulThresholds.medium.minVelocity && 
        angle >= this.foulThresholds.medium.minAngle) {
      return 'medium';
    }
    
    if (relativeVelocity >= this.foulThresholds.light.minVelocity && 
        angle >= this.foulThresholds.light.minAngle) {
      return 'light';
    }
    
    return 'none';
  }

  private determineFoulType(collision: CollisionData, severity: string): 'trip' | 'aggressive_tackle' | 'dangerous_slide' | 'handball' {
    const { relativeVelocity, angle } = collision;
    
    // Check for handball (would need additional data)
    if (this.isHandball(collision)) {
      return 'handball';
    }
    
    // Determine based on collision characteristics
    if (severity === 'light' || relativeVelocity < 3) {
      return 'trip';
    }
    
    if (angle > Math.PI / 3) { // Wide angle
      return 'dangerous_slide';
    }
    
    return 'aggressive_tackle';
  }

  private isHandball(collision: CollisionData): boolean {
    // Simplified handball detection
    // In real implementation, would check if hand/arm contacted ball
    return false;
  }

  private shouldPlayAdvantage(foulData: FoulData, collision: CollisionData): boolean {
    // Only play advantage for light/medium fouls
    if (foulData.severity === 'serious' || foulData.severity === 'violent') {
      return false;
    }
    
    // Check if fouled team has advantage
    const hasAdvantage = this.checkTeamAdvantage(collision.player2Id);
    
    // Referee personality affects decision
    const advantageRoll = Math.random();
    const advantageThreshold = this.refereePersonality.advantageTendency;
    
    return hasAdvantage && advantageRoll < advantageThreshold;
  }

  private checkTeamAdvantage(fouledPlayerId: string): boolean {
    // Simplified advantage check
    // In real implementation, would check ball possession, positioning, etc.
    return Math.random() > 0.5;
  }

  private startAdvantage(): void {
    this.advantageActive = true;
    this.advantageStartTime = Date.now();
  }

  public checkAdvantageExpired(): boolean {
    if (!this.advantageActive) return false;
    
    const advantageDuration = 3000; // 3 seconds
    if (Date.now() - this.advantageStartTime > advantageDuration) {
      this.advantageActive = false;
      return true; // Advantage expired, call the foul
    }
    
    return false;
  }

  public cancelAdvantage(): void {
    this.advantageActive = false;
  }

  public determineCard(foulData: FoulData): 'none' | 'yellow' | 'red' {
    const playerRecord = this.getOrCreatePlayerRecord(foulData.player);
    
    // Check for red card offenses
    if (foulData.severity === 'violent') {
      return 'red';
    }
    
    if (foulData.severity === 'serious' && this.isDenyingGoalScoringOpportunity(foulData)) {
      return 'red';
    }
    
    // Check for second yellow
    if (playerRecord.yellowCards >= 1) {
      return 'red';
    }
    
    // Determine yellow card based on severity and referee tendency
    const yellowProbability = this.calculateYellowCardProbability(foulData);
    const cardRoll = Math.random();
    
    if (cardRoll < yellowProbability) {
      return 'yellow';
    }
    
    return 'none';
  }

  private calculateYellowCardProbability(foulData: FoulData): number {
    let probability = 0;
    
    switch (foulData.severity) {
      case 'light':
        probability = 0.1;
        break;
      case 'medium':
        probability = 0.4;
        break;
      case 'serious':
        probability = 0.8;
        break;
      case 'violent':
        probability = 1.0;
        break;
    }
    
    // Adjust based on referee personality
    probability *= this.refereePersonality.cardTendency;
    
    // Adjust based on player's disciplinary record
    const playerRecord = this.getOrCreatePlayerRecord(foulData.player);
    const recentFouls = playerRecord.foulHistory.filter(f => Date.now() - f.time < 300000); // 5 minutes
    probability += recentFouls.length * 0.1;
    
    return Math.min(1.0, probability);
  }

  private isDenyingGoalScoringOpportunity(foulData: FoulData): boolean {
    // Simplified check - would need more sophisticated analysis
    const distanceToGoal = foulData.position.distanceTo(new Vector3(0, 0, 52.5));
    return distanceToGoal < 20;
  }

  private getOrCreatePlayerRecord(playerId: string): PlayerDisciplinaryRecord {
    if (!this.disciplinaryRecords.has(playerId)) {
      this.disciplinaryRecords.set(playerId, {
        playerId,
        yellowCards: 0,
        redCard: false,
        foulHistory: []
      });
    }
    return this.disciplinaryRecords.get(playerId)!;
  }

  public issueCard(playerId: string, cardType: 'yellow' | 'red'): void {
    const record = this.getOrCreatePlayerRecord(playerId);
    
    if (cardType === 'yellow') {
      record.yellowCards++;
    } else if (cardType === 'red') {
      record.redCard = true;
    }
    
    // Add to foul history
    record.foulHistory.push({
      time: Date.now(),
      severity: cardType === 'red' ? 10 : 5
    });
  }

  public isPlayerSentOff(playerId: string): boolean {
    const record = this.disciplinaryRecords.get(playerId);
    return record ? record.redCard || record.yellowCards >= 2 : false;
  }

  public getPlayerRecord(playerId: string): PlayerDisciplinaryRecord | undefined {
    return this.disciplinaryRecords.get(playerId);
  }

  public getAllDisciplinaryRecords(): PlayerDisciplinaryRecord[] {
    return Array.from(this.disciplinaryRecords.values());
  }

  public updateRefereePosition(matchTime: number): void {
    // Simulate referee movement around the pitch
    // In real implementation, would track ball and players to maintain good positioning
  }

  public getRefereeStats(): {
    foulsCalled: number;
    cardsIssued: { yellow: number; red: number };
    advantagesPlayed: number;
  } {
    // Calculate referee statistics
    const records = Array.from(this.disciplinaryRecords.values());
    const yellowCards = records.reduce((sum, record) => sum + record.yellowCards, 0);
    const redCards = records.reduce((sum, record) => sum + (record.redCard ? 1 : 0), 0);
    
    return {
      foulsCalled: records.reduce((sum, record) => sum + record.foulHistory.length, 0),
      cardsIssued: { yellow: yellowCards, red: redCards },
      advantagesPlayed: 0 // Would track this
    };
  }

  public reset(): void {
    this.disciplinaryRecords.clear();
    this.lastFoulTime = 0;
    this.advantageActive = false;
    this.advantageStartTime = 0;
  }

  public dispose(): void {
    this.reset();
  }
}
