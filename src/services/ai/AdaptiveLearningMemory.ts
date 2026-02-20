/**
 * ADAPTIVE LEARNING AI MEMORY SYSTEM
 * 
 * Allows AI to learn during the match only without storing long-term unfair advantage.
 * AI learns player pattern metrics:
 * - ShotDirectionHistory
 * - PassPreferenceHeatmap
 * - DribbleDirectionBias
 * - SprintUsageFrequency
 * - SkillMoveUsage
 * 
 * Memory decay: MemoryScore = OldScore × 0.8 + NewObservation × 0.2
 * Max influence of memory: 30%
 * Pattern detection window: Last 10 events
 * Learning resets every match
 */

import type {
  AdaptiveMemorySystem,
  PlayerPattern,
  AIMemoryMetric,
} from '../types/simulation';

const MEMORY_DECAY_FACTOR = 0.8;
const NEW_OBSERVATION_WEIGHT = 0.2;
const PATTERN_CONFIDENCE_THRESHOLD = 4; // 4 consistent events for confidence
const MAX_INFLUENCE_PERCENTAGE = 0.3; // 30% max
const MEMORY_WINDOW_SIZE = 10; // Last 10 events
const EVENT_MEMORY_TTL = 120000; // 2 minutes in milliseconds

export class AdaptiveLearningMemory implements AdaptiveMemorySystem {
  patternMemory: Map<string, PlayerPattern> = new Map();
  recentEvents: AIMemoryMetric[] = [];
  eventMemoryWindow: number = MEMORY_WINDOW_SIZE;
  maxPatternConfidence: number = PATTERN_CONFIDENCE_THRESHOLD;
  memoryDecayFactor: number = MEMORY_DECAY_FACTOR;
  maxInfluencePercentage: number = MAX_INFLUENCE_PERCENTAGE;

  private lastDecayTime: number = Date.now();
  private decayInterval: number = 5000; // Decay every 5 seconds

  /**
   * Record player action and update memory
   */
  recordPlayerAction(playerId: string, metric: AIMemoryMetric): void {
    // Add event to recent events
    this.recentEvents.push(metric);

    // Keep only last N events in memory
    if (this.recentEvents.length > this.eventMemoryWindow) {
      this.recentEvents.shift();
    }

    // Get or create player pattern
    if (!this.patternMemory.has(playerId)) {
      this.patternMemory.set(playerId, this.createEmptyPattern());
    }

    const pattern = this.patternMemory.get(playerId)!;

    // Update pattern based on event type
    switch (metric.eventType) {
      case 'SHOT':
        this.updateShotHistory(pattern, metric);
        break;
      case 'PASS':
        this.updatePassPreference(pattern, metric);
        break;
      case 'DRIBBLE':
        this.updateDribbleBias(pattern, metric);
        break;
      case 'SPRINT':
        this.updateSprintFrequency(pattern, metric);
        break;
      case 'SKILL_MOVE':
        this.updateSkillMoveUsage(pattern, metric);
        break;
      case 'SLIDE':
        this.updateSlideReliability(pattern, metric);
        break;
      case 'SHIELD':
        // Shield spam detection tracked elsewhere
        break;
    }
  }

  /**
   * Update shot direction history
   */
  private updateShotHistory(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    // Direction encoded as value (0-8 for 8 directions, normalized)
    const direction = this.decodeDirection(metric.value);
    const confidence = metric.confidence;

    // Find similar direction in history
    let similarEntry = pattern.shotDirectionHistory.find(h => 
      this.areDirectionsSimilar(h.direction, direction)
    );

    if (similarEntry) {
      // Decay and update existing confidence
        similarEntry.confidence = 
          similarEntry.confidence * this.memoryDecayFactor + 
          confidence * NEW_OBSERVATION_WEIGHT;
    } else {
      // Add new direction to history
      pattern.shotDirectionHistory.push({
        direction,
        confidence,
      });

      // Keep only recent shot patterns
      if (pattern.shotDirectionHistory.length > 5) {
        pattern.shotDirectionHistory.shift();
      }
    }
  }

  /**
   * Update pass preference heatmap
   */
  private updatePassPreference(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    const direction = metric.value.toString(); // Direction as key
    const currentValue = pattern.passPreferenceHeatmap.get(direction) || 0;
    
    const newValue = 
      currentValue * this.memoryDecayFactor + 
      metric.confidence * NEW_OBSERVATION_WEIGHT;
    
    pattern.passPreferenceHeatmap.set(direction, Math.min(newValue, 1.0));

    // Trim old preferences
    if (pattern.passPreferenceHeatmap.size > 8) {
      // Remove lowest confidence
      let minKey = Array.from(pattern.passPreferenceHeatmap.entries())[0][0];
      let minVal = pattern.passPreferenceHeatmap.get(minKey)!;
      
      pattern.passPreferenceHeatmap.forEach((val: number, key: string) => {
        if (val < minVal) {
          minVal = val;
          minKey = key;
        }
      });
      
      pattern.passPreferenceHeatmap.delete(minKey);
    }
  }

  /**
   * Update dribble direction bias
   */
  private updateDribbleBias(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    const direction = this.decodeDirection(metric.value);
    
    // Apply exponential moving average to bias
    pattern.dribbleDirectionBias.x = 
      pattern.dribbleDirectionBias.x * this.memoryDecayFactor + 
      direction.x * NEW_OBSERVATION_WEIGHT;
    
    pattern.dribbleDirectionBias.z = 
      pattern.dribbleDirectionBias.z * this.memoryDecayFactor + 
      direction.z * NEW_OBSERVATION_WEIGHT;
  }

  /**
   * Update sprint usage frequency
   */
  private updateSprintFrequency(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    // Binary: 1 for sprint, 0 for no sprint
    pattern.sprintUsageFrequency = 
      pattern.sprintUsageFrequency * this.memoryDecayFactor + 
      metric.value * NEW_OBSERVATION_WEIGHT;
  }

  /**
   * Update skill move usage
   */
  private updateSkillMoveUsage(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    const skillType = metric.value.toString();
    const currentCount = pattern.skillMoveUsage.get(skillType) || 0;
    
    pattern.skillMoveUsage.set(skillType, currentCount + 1);
  }

  /**
   * Update slide tackle reliability
   */
  private updateSlideReliability(pattern: PlayerPattern, metric: AIMemoryMetric): void {
    // metric.value: 1 for successful slide, 0 for failed/punished
    pattern.slideReliability = 
      pattern.slideReliability * this.memoryDecayFactor + 
      metric.value * NEW_OBSERVATION_WEIGHT;
  }

  /**
   * Get player pattern (creates if doesn't exist)
   */
  getPlayerPattern(playerId: string): PlayerPattern {
    if (!this.patternMemory.has(playerId)) {
      this.patternMemory.set(playerId, this.createEmptyPattern());
    }
    return this.patternMemory.get(playerId)!;
  }

  /**
   * Calculate anticipation bias for goalkeeper
   * AnticipationWeight = PatternConfidence × 0.4
   */
  calculateAnticipationBias(playerId: string, action: string): number {
    const pattern = this.getPlayerPattern(playerId);
    let confidence = 0;

    if (action === 'SHOT' && pattern.shotDirectionHistory.length > 0) {
      // Average confidence of shot patterns
      const avgConfidence = pattern.shotDirectionHistory.reduce((sum, h) => sum + h.confidence, 0) 
        / pattern.shotDirectionHistory.length;
      confidence = avgConfidence > this.maxPatternConfidence ? Math.min(avgConfidence * 0.4, this.maxInfluencePercentage) : 0;
    }

    return confidence;
  }

  /**
   * Calculate decision variation to prevent perfect prediction
   * AdjustedUtility = BaseUtility × (1 − PlayerPredictionConfidence × 0.3)
   */
  calculateDecisionVariation(baseUtility: number, playerPredictionConfidence: number): number {
    const confidenceInfluence = Math.min(playerPredictionConfidence * 0.3, this.maxInfluencePercentage);
    return baseUtility * (1 - confidenceInfluence);
  }

  /**
   * Decay memory over time to ensure fadeout
   */
  decayMemory(): void {
    const now = Date.now();
    
    if (now - this.lastDecayTime < this.decayInterval) {
      return; // Not time to decay yet
    }

    this.lastDecayTime = now;

    // Remove expired events
    this.recentEvents = this.recentEvents.filter(event => 
      now - event.timestamp < EVENT_MEMORY_TTL
    );

    // Decay all pattern confidences
    this.patternMemory.forEach((pattern: PlayerPattern) => {
      // Decay shot history
      pattern.shotDirectionHistory.forEach((shot: {confidence: number}) => {
        shot.confidence *= this.memoryDecayFactor;
      });
      pattern.shotDirectionHistory = pattern.shotDirectionHistory.filter((s: {confidence: number}) => s.confidence > 0.05);

      // Decay pass preferences
      pattern.passPreferenceHeatmap.forEach((val: number, key: string) => {
        const newVal = val * this.memoryDecayFactor;
        if (newVal > 0.05) {
          pattern.passPreferenceHeatmap.set(key, newVal);
        } else {
          pattern.passPreferenceHeatmap.delete(key);
        }
      });

      // Decay sprint and slide metrics
      pattern.sprintUsageFrequency *= this.memoryDecayFactor;
      pattern.slideReliability *= this.memoryDecayFactor;

      // Decay dribble bias
      pattern.dribbleDirectionBias.x *= this.memoryDecayFactor;
      pattern.dribbleDirectionBias.z *= this.memoryDecayFactor;
    });
  }

  /**
   * Reset player memory (called at match end)
   */
  resetPlayerMemory(playerId: string): void {
    this.patternMemory.delete(playerId);
  }

  /**
   * Clear all memory (new match)
   */
  clearAllMemory(): void {
    this.patternMemory.clear();
    this.recentEvents = [];
    this.lastDecayTime = Date.now();
  }

  /**
   * Create empty pattern structure
   */
  private createEmptyPattern(): PlayerPattern {
    return {
      shotDirectionHistory: [],
      passPreferenceHeatmap: new Map(),
      dribbleDirectionBias: { x: 0, y: 0, z: 0 },
      sprintUsageFrequency: 0,
      skillMoveUsage: new Map(),
      slideReliability: 0.5, // Start neutral
    };
  }

  /**
   * Decode direction from numeric value
   */
  private decodeDirection(value: number): { x: number; y: number; z: number } {
    const angle = (value / 8) * Math.PI * 2;
    return {
      x: Math.cos(angle),
      y: 0,
      z: Math.sin(angle),
    };
  }

  /**
   * Check if two directions are similar (within 45 degrees)
   */
  private areDirectionsSimilar(d1: { x: number; z: number }, d2: { x: number; z: number }): boolean {
    const dot = d1.x * d2.x + d1.z * d2.z;
    return dot > 0.7; // ~45 degree threshold
  }

  /**
   * Get pattern analysis for debugging
   */
  getPatternAnalysis(playerId: string): any {
    const pattern = this.getPlayerPattern(playerId);
    return {
      playerId,
      shotDirectionConfidence: pattern.shotDirectionHistory.map((h: {confidence: number}) => h.confidence),
      passPreferences: Object.fromEntries(pattern.passPreferenceHeatmap),
      dribbleBias: pattern.dribbleDirectionBias,
      sprintFrequency: pattern.sprintUsageFrequency,
      skillMoveUsage: Object.fromEntries(pattern.skillMoveUsage),
      slideReliability: pattern.slideReliability,
    };
  }
}
