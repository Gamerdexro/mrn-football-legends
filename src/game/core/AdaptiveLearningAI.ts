import { Vector3 } from 'three';
import { PlayerState } from '../types/MatchEngineTypes';

interface PlayerPattern {
  shotDirectionHistory: Vector3[];
  passPreferenceHeatmap: Map<string, number>;
  dribbleDirectionBias: Vector3;
  sprintUsageFrequency: number;
  skillMoveUsage: number;
  memoryScore: number;
  patternConfidence: number;
  lastUpdated: number;
}

interface AnticipationData {
  goalkeeperNearPostBias: number;
  goalkeeperFarPostBias: number;
  goalkeeperCenterBias: number;
  playerPredictionConfidence: Map<string, number>;
  defensiveHabits: Map<string, string[]>;
}

export class AdaptiveLearningAI {
  private playerPatterns: Map<string, PlayerPattern> = new Map();
  private anticipationData: AnticipationData;
  private matchStartTime: number = 0;
  private maxMemoryInfluence: number = 0.3; // 30% max influence
  private patternDetectionWindow: number = 10; // Last 10 events
  private memoryDecayRate: number = 0.8; // Fading memory rate
  
  constructor() {
    this.anticipationData = {
      goalkeeperNearPostBias: 0.33,
      goalkeeperFarPostBias: 0.33,
      goalkeeperCenterBias: 0.34,
      playerPredictionConfidence: new Map(),
      defensiveHabits: new Map()
    };
  }

  public initializeMatch(): void {
    this.matchStartTime = Date.now();
    this.playerPatterns.clear();
    this.anticipationData.playerPredictionConfidence.clear();
    this.anticipationData.defensiveHabits.clear();
  }

  // Update player pattern after each action
  public updatePlayerPattern(playerId: string, action: string, data: any): void {
    let pattern = this.playerPatterns.get(playerId);
    
    if (!pattern) {
      pattern = this.createInitialPattern();
      this.playerPatterns.set(playerId, pattern);
    }
    
    // Update pattern based on action type
    switch (action) {
      case 'shot':
        this.updateShotPattern(pattern, data);
        break;
      case 'pass':
        this.updatePassPattern(pattern, data);
        break;
      case 'dribble':
        this.updateDribblePattern(pattern, data);
        break;
      case 'sprint':
        this.updateSprintPattern(pattern);
        break;
      case 'skill_move':
        this.updateSkillMovePattern(pattern);
        break;
    }
    
    // Update memory score with fading
    // MemoryScore = OldScore × 0.8 + NewObservation × 0.2
    pattern.memoryScore = pattern.memoryScore * this.memoryDecayRate + 0.2;
    pattern.lastUpdated = Date.now();
    
    // Update pattern confidence after consistent events
    this.updatePatternConfidence(pattern);
  }

  private createInitialPattern(): PlayerPattern {
    return {
      shotDirectionHistory: [],
      passPreferenceHeatmap: new Map(),
      dribbleDirectionBias: new Vector3(0, 0, 0),
      sprintUsageFrequency: 0,
      skillMoveUsage: 0,
      memoryScore: 0,
      patternConfidence: 0,
      lastUpdated: Date.now()
    };
  }

  private updateShotPattern(pattern: PlayerPattern, shotData: { direction: Vector3; position: Vector3 }): void {
    // Add to shot direction history
    pattern.shotDirectionHistory.push(shotData.direction.clone());
    
    // Keep only last patternDetectionWindow shots
    if (pattern.shotDirectionHistory.length > this.patternDetectionWindow) {
      pattern.shotDirectionHistory.shift();
    }
    
    // Update goalkeeper anticipation bias
    this.updateGoalkeeperAnticipation(shotData.direction);
  }

  private updatePassPattern(pattern: PlayerPattern, passData: { targetId: string; position: Vector3 }): void {
    // Update pass preference heatmap
    const zoneKey = this.getZoneKey(passData.position);
    const currentCount = pattern.passPreferenceHeatmap.get(zoneKey) || 0;
    pattern.passPreferenceHeatmap.set(zoneKey, currentCount + 1);
  }

  private updateDribblePattern(pattern: PlayerPattern, dribbleData: { direction: Vector3 }): void {
    // Update dribble direction bias
    pattern.dribbleDirectionBias.add(dribbleData.direction.multiplyScalar(0.1));
    
    // Normalize to prevent bias from growing too large
    if (pattern.dribbleDirectionBias.length() > 1) {
      pattern.dribbleDirectionBias.normalize();
    }
  }

  private updateSprintPattern(pattern: PlayerPattern): void {
    pattern.sprintUsageFrequency++;
  }

  private updateSkillMovePattern(pattern: PlayerPattern): void {
    pattern.skillMoveUsage++;
  }

  private updateGoalkeeperAnticipation(shotDirection: Vector3): void {
    // Calculate which post area the shot is aimed at
    const angle = Math.atan2(shotDirection.x, shotDirection.z);
    
    if (angle > -Math.PI / 6 && angle < Math.PI / 6) {
      // Center shot
      this.anticipationData.goalkeeperCenterBias = Math.min(0.5, 
        this.anticipationData.goalkeeperCenterBias + 0.02);
    } else if (angle < 0) {
      // Left post (from GK perspective)
      this.anticipationData.goalkeeperNearPostBias = Math.min(0.5, 
        this.anticipationData.goalkeeperNearPostBias + 0.02);
    } else {
      // Right post (from GK perspective)
      this.anticipationData.goalkeeperFarPostBias = Math.min(0.5, 
        this.anticipationData.goalkeeperFarPostBias + 0.02);
    }
    
    // Normalize biases
    const total = this.anticipationData.goalkeeperNearPostBias + 
                  this.anticipationData.goalkeeperFarPostBias + 
                  this.anticipationData.goalkeeperCenterBias;
    
    this.anticipationData.goalkeeperNearPostBias /= total;
    this.anticipationData.goalkeeperFarPostBias /= total;
    this.anticipationData.goalkeeperCenterBias /= total;
  }

  private getZoneKey(position: Vector3): string {
    // Divide pitch into zones for heatmap
    const zoneX = Math.floor((position.x + 52.5) / 17.5);
    const zoneZ = Math.floor((position.z + 35) / 17.5);
    return `${zoneX},${zoneZ}`;
  }

  private updatePatternConfidence(pattern: PlayerPattern): void {
    // PatternConfidence increases only after 4 consistent events
    const totalEvents = pattern.shotDirectionHistory.length + 
                      pattern.passPreferenceHeatmap.size + 
                      pattern.skillMoveUsage;
    
    if (totalEvents >= 4) {
      pattern.patternConfidence = Math.min(1, totalEvents / this.patternDetectionWindow);
    }
  }

  // Get adjusted utility based on player prediction
  public getAdjustedUtility(baseUtility: number, playerId: string, action: string): number {
    const predictionConfidence = this.anticipationData.playerPredictionConfidence.get(playerId) || 0;
    
    // AdjustedUtility = BaseUtility × (1 − PlayerPredictionConfidence × 0.3)
    const adjustedUtility = baseUtility * (1 - predictionConfidence * 0.3);
    
    return Math.max(0, adjustedUtility);
  }

  // Get goalkeeper anticipation for shot direction
  public getGoalkeeperAnticipation(): { nearPost: number; farPost: number; center: number } {
    return {
      nearPost: this.anticipationData.goalkeeperNearPostBias,
      farPost: this.anticipationData.goalkeeperFarPostBias,
      center: this.anticipationData.goalkeeperCenterBias
    };
  }

  // Get predicted player behavior
  public predictPlayerBehavior(playerId: string): {
    likelyShotDirection: Vector3;
    likelyPassZones: string[];
    likelyDribbleDirection: Vector3;
    confidence: number;
  } {
    const pattern = this.playerPatterns.get(playerId);
    if (!pattern || pattern.patternConfidence < 0.5) {
      return {
        likelyShotDirection: new Vector3(0, 0, 1),
        likelyPassZones: [],
        likelyDribbleDirection: new Vector3(0, 0, 1),
        confidence: 0
      };
    }
    
    // Calculate likely shot direction from history
    let likelyShotDirection = new Vector3(0, 0, 1);
    if (pattern.shotDirectionHistory.length > 0) {
      likelyShotDirection = pattern.shotDirectionHistory.reduce((sum, dir) => 
        sum.add(dir), new Vector3(0, 0, 0)).normalize();
    }
    
    // Get most likely pass zones
    const likelyPassZones = Array.from(pattern.passPreferenceHeatmap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
    
    return {
      likelyShotDirection,
      likelyPassZones,
      likelyDribbleDirection: pattern.dribbleDirectionBias.clone(),
      confidence: pattern.patternConfidence
    };
  }

  // Update defensive habits tracking
  public updateDefensiveHabits(playerId: string, defensiveAction: string): void {
    const habits = this.anticipationData.defensiveHabits.get(playerId) || [];
    habits.push(defensiveAction);
    
    // Keep only last 10 defensive actions
    if (habits.length > this.patternDetectionWindow) {
      habits.shift();
    }
    
    this.anticipationData.defensiveHabits.set(playerId, habits);
  }

  // Check if player has defensive pattern
  public hasDefensivePattern(playerId: string, action: string): boolean {
    const habits = this.anticipationData.defensiveHabits.get(playerId) || [];
    if (habits.length < 4) return false;
    
    // Check if player uses this action frequently
    const actionCount = habits.filter(h => h === action).length;
    return actionCount >= habits.length * 0.6; // 60% or more
  }

  // Get sprint abuse detection
  public getSprintAbuseMultiplier(playerId: string): number {
    const pattern = this.playerPatterns.get(playerId);
    if (!pattern) return 1;
    
    const matchDuration = (Date.now() - this.matchStartTime) / 1000; // seconds
    const sprintFrequency = pattern.sprintUsageFrequency / matchDuration;
    
    // If toggles > threshold in 5 seconds, stamina drain multiplier activates
    if (sprintFrequency > 2) { // More than 2 sprints per second
      return 1 + (sprintFrequency * 0.05);
    }
    
    return 1;
  }

  // Get player pattern confidence for prediction
  public getPlayerPredictionConfidence(playerId: string): number {
    const pattern = this.playerPatterns.get(playerId);
    if (!pattern) return 0;
    
    // AnticipationWeight = PatternConfidence × 0.4
    return Math.min(this.maxMemoryInfluence, pattern.patternConfidence * 0.4);
  }

  // Clean up old patterns to prevent memory leaks
  public cleanup(): void {
    const currentTime = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    this.playerPatterns.forEach((pattern, playerId) => {
      if (currentTime - pattern.lastUpdated > maxAge) {
        this.playerPatterns.delete(playerId);
        this.anticipationData.playerPredictionConfidence.delete(playerId);
        this.anticipationData.defensiveHabits.delete(playerId);
      }
    });
  }

  // Get learning statistics for debugging
  public getLearningStats(): {
    totalPlayersTracked: number;
    averageConfidence: number;
    memoryInfluence: number;
  } {
    const patterns = Array.from(this.playerPatterns.values());
    const totalPlayersTracked = patterns.length;
    const averageConfidence = patterns.length > 0 ? 
      patterns.reduce((sum, p) => sum + p.patternConfidence, 0) / patterns.length : 0;
    
    return {
      totalPlayersTracked,
      averageConfidence,
      memoryInfluence: this.maxMemoryInfluence
    };
  }

  public dispose(): void {
    this.playerPatterns.clear();
    this.anticipationData.playerPredictionConfidence.clear();
    this.anticipationData.defensiveHabits.clear();
  }
}
