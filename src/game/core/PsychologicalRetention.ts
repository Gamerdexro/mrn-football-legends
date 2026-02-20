import { Vector3 } from 'three';
import { PlayerState } from '../types/MatchEngineTypes';

interface RetentionMetrics {
  playerId: string;
  sessionCount: number;
  totalPlaytime: number; // minutes
  averageSessionLength: number;
  lastSessionDate: Date;
  retentionScore: number; // 0-1
  masteryProgress: number; // 0-1
  satisfactionIndex: number; // 0-1
  burnoutRisk: number; // 0-1
  motivationDrivers: MotivationDriver[];
  churnProbability: number; // 0-1
}

interface MotivationDriver {
  type: 'mastery' | 'social' | 'cosmetic' | 'competition' | 'exploration';
  strength: number; // 0-1
  lastActivated: Date;
}

interface RetentionIntervention {
  type: 'reward_pacing' | 'mastery_feedback' | 'social_connection' | 'variety_injection' | 'break_suggestion';
  trigger: RetentionTrigger;
  intensity: 'low' | 'medium' | 'high';
  cooldown: number; // hours
}

interface RetentionTrigger {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  duration?: number; // hours
}

interface PsychologicalProfile {
  playerId: string;
  playerType: 'achiever' | 'explorer' | 'socializer' | 'killer';
  riskTolerance: number; // 0-1
  lossSensitivity: number; // 0-1
  rewardSensitivity: number; // 0-1
  socialEngagementNeed: number; // 0-1
  masteryDesire: number; // 0-1
  adaptationRate: number; // 0-1
}

export class PsychologicalRetention {
  private retentionMetrics: Map<string, RetentionMetrics> = new Map();
  private psychologicalProfiles: Map<string, PsychologicalProfile> = new Map();
  private interventions: Map<string, RetentionIntervention[]> = new Map();
  private interventionHistory: Map<string, Array<{ type: string; timestamp: number; effectiveness: number }>> = new Map();
  
  // Retention constants
  private readonly OPTIMAL_SESSION_LENGTH = 45; // minutes
  private readonly BURNOUT_THRESHOLD = 180; // minutes per day
  private readonly CHURN_RISK_SESSIONS = 3; // days without playing
  private readonly MASTERY_MILESTONE_INTERVAL = 5; // sessions
  private readonly VARIABLE_REINFORCEMENT_BASE = 0.3; // 30% base chance

  constructor() {
    this.initializeRetentionSystem();
  }

  private initializeRetentionSystem(): void {
    this.setupRetentionInterventions();
    this.initializePsychologicalProfiling();
  }

  private setupRetentionInterventions(): void {
    // Define retention interventions based on psychological triggers
  }

  private initializePsychologicalProfiling(): void {
    // Initialize psychological profiling system
  }

  public updatePlayerSession(playerId: string, sessionData: {
    sessionLength: number; // minutes
    matchesPlayed: number;
    winRate: number;
    actions: { [key: string]: number };
    satisfaction: number; // 0-1
    socialInteractions: number;
  }): void {
    let metrics = this.retentionMetrics.get(playerId);
    
    if (!metrics) {
      metrics = this.createInitialMetrics(playerId);
      this.retentionMetrics.set(playerId, metrics);
    }

    // Update session data
    metrics.sessionCount++;
    metrics.totalPlaytime += sessionData.sessionLength;
    metrics.averageSessionLength = metrics.totalPlaytime / metrics.sessionCount;
    metrics.lastSessionDate = new Date();

    // Update satisfaction index
    metrics.satisfactionIndex = this.calculateSatisfactionIndex(metrics, sessionData);

    // Calculate burnout risk
    metrics.burnoutRisk = this.calculateBurnoutRisk(metrics, sessionData);

    // Update mastery progress
    metrics.masteryProgress = this.calculateMasteryProgress(metrics, sessionData);

    // Update motivation drivers
    this.updateMotivationDrivers(metrics, sessionData);

    // Calculate retention score
    metrics.retentionScore = this.calculateRetentionScore(metrics);

    // Calculate churn probability
    metrics.churnProbability = this.calculateChurnProbability(metrics);

    // Check for intervention triggers
    this.checkInterventionTriggers(playerId, metrics);

    // Update psychological profile
    this.updatePsychologicalProfile(playerId, sessionData);
  }

  private createInitialMetrics(playerId: string): RetentionMetrics {
    return {
      playerId,
      sessionCount: 0,
      totalPlaytime: 0,
      averageSessionLength: 0,
      lastSessionDate: new Date(),
      retentionScore: 0.5,
      masteryProgress: 0,
      satisfactionIndex: 0.5,
      burnoutRisk: 0,
      motivationDrivers: this.initializeMotivationDrivers(),
      churnProbability: 0.1
    };
  }

  private initializeMotivationDrivers(): MotivationDriver[] {
    return [
      { type: 'mastery', strength: 0.5, lastActivated: new Date() },
      { type: 'social', strength: 0.3, lastActivated: new Date() },
      { type: 'cosmetic', strength: 0.4, lastActivated: new Date() },
      { type: 'competition', strength: 0.6, lastActivated: new Date() },
      { type: 'exploration', strength: 0.2, lastActivated: new Date() }
    ];
  }

  private calculateSatisfactionIndex(metrics: RetentionMetrics, sessionData: any): number {
    // Weighted satisfaction calculation
    let satisfaction = sessionData.satisfaction * 0.4; // Direct feedback weight
    
    // Win rate contribution
    satisfaction += sessionData.winRate * 0.2;
    
    // Session length optimization (not too short, not too long)
    const optimalLengthScore = 1 - Math.abs(sessionData.sessionLength - this.OPTIMAL_SESSION_LENGTH) / this.OPTIMAL_SESSION_LENGTH;
    satisfaction += optimalLengthScore * 0.2;
    
    // Social engagement
    const socialScore = Math.min(1, sessionData.socialInteractions / 5);
    satisfaction += socialScore * 0.1;
    
    // Action variety
    const actionVariety = Object.keys(sessionData.actions).length / 10; // Normalize to 10 actions
    satisfaction += Math.min(1, actionVariety) * 0.1;

    return Math.max(0, Math.min(1, satisfaction));
  }

  private calculateBurnoutRisk(metrics: RetentionMetrics, sessionData: any): number {
    let burnoutRisk = 0;

    // Daily playtime burnout
    const todayPlaytime = this.getTodayPlaytime(metrics.playerId);
    if (todayPlaytime > this.BURNOUT_THRESHOLD) {
      burnoutRisk += (todayPlaytime - this.BURNOUT_THRESHOLD) / this.BURNOUT_THRESHOLD;
    }

    // Session frequency burnout
    const recentSessions = this.getRecentSessionCount(metrics.playerId, 7); // Last 7 days
    if (recentSessions > 14) { // More than 2 sessions per day
      burnoutRisk += (recentSessions - 14) / 14;
    }

    // Frustration burnout (low win rate with high playtime)
    if (sessionData.winRate < 0.3 && sessionData.sessionLength > 60) {
      burnoutRisk += 0.3;
    }

    // Repetitive behavior burnout
    const actionVariance = this.calculateActionVariance(sessionData.actions);
    if (actionVariance < 0.2) {
      burnoutRisk += 0.2;
    }

    return Math.min(1, burnoutRisk);
  }

  private getTodayPlaytime(playerId: string): number {
    // In production, this would query actual playtime data
    // For now, return 0 as placeholder
    return 0;
  }

  private getRecentSessionCount(playerId: string, days: number): number {
    // In production, this would query actual session data
    // For now, return 0 as placeholder
    return 0;
  }

  private calculateActionVariance(actions: { [key: string]: number }): number {
    const totalActions = Object.values(actions).reduce((sum, count) => sum + count, 0);
    if (totalActions === 0) return 0;

    const actionCounts = Object.values(actions);
    const mean = totalActions / actionCounts.length;
    const variance = actionCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / actionCounts.length;
    
    return Math.min(1, variance / (mean * mean));
  }

  private calculateMasteryProgress(metrics: RetentionMetrics, sessionData: any): number {
    // Mastery based on skill improvement and consistency
    let masteryScore = 0;

    // Session-based mastery (learning over time)
    const sessionMastery = Math.min(1, metrics.sessionCount / this.MASTERY_MILESTONE_INTERVAL);
    masteryScore += sessionMastery * 0.3;

    // Performance-based mastery
    const performanceMastery = sessionData.winRate;
    masteryScore += performanceMastery * 0.4;

    // Skill variety mastery
    const skillVariety = Object.keys(sessionData.actions).length / 10;
    masteryScore += Math.min(1, skillVariety) * 0.3;

    return Math.min(1, masteryScore);
  }

  private updateMotivationDrivers(metrics: RetentionMetrics, sessionData: any): void {
    for (const driver of metrics.motivationDrivers) {
      switch (driver.type) {
        case 'mastery':
          driver.strength = this.calculateMasteryMotivation(sessionData);
          break;
        case 'social':
          driver.strength = Math.min(1, sessionData.socialInteractions / 5);
          break;
        case 'cosmetic':
          driver.strength = this.calculateCosmeticMotivation(sessionData);
          break;
        case 'competition':
          driver.strength = sessionData.winRate > 0.5 ? 0.8 : 0.4;
          break;
        case 'exploration':
          driver.strength = this.calculateExplorationMotivation(sessionData);
          break;
      }
      driver.lastActivated = new Date();
    }
  }

  private calculateMasteryMotivation(sessionData: any): number {
    // High skill variety and improvement indicate mastery motivation
    const skillVariety = Object.keys(sessionData.actions).length / 10;
    const performanceImprovement = sessionData.winRate > 0.6 ? 0.8 : 0.4;
    return Math.min(1, (skillVariety + performanceImprovement) / 2);
  }

  private calculateCosmeticMotivation(sessionData: any): number {
    // Check for cosmetic-related actions
    const cosmeticActions = sessionData.actions['cosmetic_unlock'] || 0;
    const customizationActions = sessionData.actions['customization'] || 0;
    return Math.min(1, (cosmeticActions + customizationActions) / 5);
  }

  private calculateExplorationMotivation(sessionData: any): number {
    // Check for exploration of different game modes/features
    const explorationActions = sessionData.actions['new_mode_try'] || 0;
    const featureDiscovery = sessionData.actions['feature_discovery'] || 0;
    return Math.min(1, (explorationActions + featureDiscovery) / 3);
  }

  private calculateRetentionScore(metrics: RetentionMetrics): number {
    // Comprehensive retention score calculation
    let score = 0;

    // Session regularity (30%)
    const sessionRegularity = this.calculateSessionRegularity(metrics);
    score += sessionRegularity * 0.3;

    // Satisfaction (25%)
    score += metrics.satisfactionIndex * 0.25;

    // Mastery progress (20%)
    score += metrics.masteryProgress * 0.2;

    // Social engagement (15%)
    const socialDriver = metrics.motivationDrivers.find(d => d.type === 'social');
    score += (socialDriver?.strength || 0) * 0.15;

    // Low burnout risk (10%)
    score += (1 - metrics.burnoutRisk) * 0.1;

    return Math.max(0, Math.min(1, score));
  }

  private calculateSessionRegularity(metrics: RetentionMetrics): number {
    // Calculate how regularly the player plays
    const daysSinceFirstSession = (Date.now() - metrics.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24);
    const expectedSessions = daysSinceFirstSession / 1; // 1 session per day expected
    const regularity = Math.min(1, metrics.sessionCount / Math.max(1, expectedSessions));
    return regularity;
  }

  private calculateChurnProbability(metrics: RetentionMetrics): number {
    let churnRisk = 0;

    // Inactivity risk
    const daysSinceLastSession = (Date.now() - metrics.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSession > this.CHURN_RISK_SESSIONS) {
      churnRisk += 0.4;
    }

    // Low satisfaction risk
    if (metrics.satisfactionIndex < 0.3) {
      churnRisk += 0.3;
    }

    // High burnout risk
    churnRisk += metrics.burnoutRisk * 0.2;

    // Low mastery progress
    if (metrics.masteryProgress < 0.2 && metrics.sessionCount > 10) {
      churnRisk += 0.1;
    }

    return Math.min(1, churnRisk);
  }

  private checkInterventionTriggers(playerId: string, metrics: RetentionMetrics): void {
    const playerInterventions = this.interventions.get(playerId) || [];
    
    // Check for high churn risk
    if (metrics.churnProbability > 0.7) {
      this.triggerIntervention(playerId, 'reward_pacing', 'high');
    }

    // Check for burnout
    if (metrics.burnoutRisk > 0.6) {
      this.triggerIntervention(playerId, 'break_suggestion', 'medium');
    }

    // Check for low mastery
    if (metrics.masteryProgress < 0.3 && metrics.sessionCount > 5) {
      this.triggerIntervention(playerId, 'mastery_feedback', 'medium');
    }

    // Check for low social engagement
    const socialDriver = metrics.motivationDrivers.find(d => d.type === 'social');
    if (socialDriver && socialDriver.strength < 0.2) {
      this.triggerIntervention(playerId, 'social_connection', 'low');
    }

    // Check for repetitive behavior
    if (this.isBehaviorRepetitive(playerId)) {
      this.triggerIntervention(playerId, 'variety_injection', 'medium');
    }
  }

  private triggerIntervention(playerId: string, type: string, intensity: 'low' | 'medium' | 'high'): void {
    // Check cooldown
    if (this.isInterventionOnCooldown(playerId, type)) {
      return;
    }

    // Record intervention
    if (!this.interventionHistory.has(playerId)) {
      this.interventionHistory.set(playerId, []);
    }

    const history = this.interventionHistory.get(playerId)!;
    history.push({
      type,
      timestamp: Date.now(),
      effectiveness: 0 // Will be updated later
    });

    // Apply intervention based on type
    this.applyIntervention(playerId, type, intensity);
  }

  private isInterventionOnCooldown(playerId: string, type: string): boolean {
    const history = this.interventionHistory.get(playerId);
    if (!history) return false;

    const lastIntervention = history
      .filter(h => h.type === type)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastIntervention) return false;

    const cooldownPeriod = this.getInterventionCooldown(type);
    return (Date.now() - lastIntervention.timestamp) < cooldownPeriod;
  }

  private getInterventionCooldown(type: string): number {
    const cooldowns = {
      reward_pacing: 24 * 60 * 60 * 1000, // 24 hours
      mastery_feedback: 12 * 60 * 60 * 1000, // 12 hours
      social_connection: 48 * 60 * 60 * 1000, // 48 hours
      variety_injection: 6 * 60 * 60 * 1000, // 6 hours
      break_suggestion: 24 * 60 * 60 * 1000 // 24 hours
    };

    return cooldowns[type as keyof typeof cooldowns] || 24 * 60 * 60 * 1000;
  }

  private applyIntervention(playerId: string, type: string, intensity: 'low' | 'medium' | 'high'): void {
    switch (type) {
      case 'reward_pacing':
        this.applyRewardPacing(playerId, intensity);
        break;
      case 'mastery_feedback':
        this.applyMasteryFeedback(playerId, intensity);
        break;
      case 'social_connection':
        this.applySocialConnection(playerId, intensity);
        break;
      case 'variety_injection':
        this.applyVarietyInjection(playerId, intensity);
        break;
      case 'break_suggestion':
        this.applyBreakSuggestion(playerId, intensity);
        break;
    }
  }

  private applyRewardPacing(playerId: string, intensity: 'low' | 'medium' | 'high'): void {
    // Adjust reward pacing to increase engagement
    const multiplier = intensity === 'high' ? 1.5 : intensity === 'medium' ? 1.2 : 1.1;
    // In production, this would interface with the reward system
  }

  private applyMasteryFeedback(playerId: string, intensity: 'low' | 'medium' | 'high'): void {
    // Provide enhanced mastery feedback
    // In production, this would trigger tutorial or hint systems
  }

  private applySocialConnection(playerId: string, intensity: 'low' | 'medium' | 'high'): void {
    // Encourage social interactions
    // In production, this could suggest team play or friend features
  }

  private applyVarietyInjection(playerId: string, intensity: 'low' | 'medium' | 'high'): void {
    // Suggest new game modes or features
    // In production, this would recommend content
  }

  private applyBreakSuggestion(playerId: string, intensity: 'low' | 'medium' | 'high'): void {
    // Suggest taking a break to prevent burnout
    // In production, this would show break reminders
  }

  private isBehaviorRepetitive(playerId: string): boolean {
    // Check if player behavior is too repetitive
    // In production, this would analyze actual behavior patterns
    return false;
  }

  private updatePsychologicalProfile(playerId: string, sessionData: any): void {
    let profile = this.psychologicalProfiles.get(playerId);
    
    if (!profile) {
      profile = this.createPsychologicalProfile(playerId);
      this.psychologicalProfiles.set(playerId, profile);
    }

    // Update profile based on session data
    profile.adaptationRate = this.calculateAdaptationRate(profile, sessionData);
    profile.lossSensitivity = this.calculateLossSensitivity(profile, sessionData);
    profile.rewardSensitivity = this.calculateRewardSensitivity(profile, sessionData);
  }

  private createPsychologicalProfile(playerId: string): PsychologicalProfile {
    return {
      playerId,
      playerType: 'achiever', // Default type
      riskTolerance: 0.5,
      lossSensitivity: 0.5,
      rewardSensitivity: 0.5,
      socialEngagementNeed: 0.5,
      masteryDesire: 0.5,
      adaptationRate: 0.5
    };
  }

  private calculateAdaptationRate(profile: PsychologicalProfile, sessionData: any): number {
    // How quickly player adapts to new content/challenges
    return Math.min(1, profile.adaptationRate * 0.9 + (sessionData.winRate > 0.5 ? 0.1 : 0.05));
  }

  private calculateLossSensitivity(profile: PsychologicalProfile, sessionData: any): number {
    // How sensitive player is to losses
    return Math.min(1, profile.lossSensitivity * 0.9 + (sessionData.winRate < 0.3 ? 0.1 : 0.05));
  }

  private calculateRewardSensitivity(profile: PsychologicalProfile, sessionData: any): number {
    // How sensitive player is to rewards
    const rewardActions = (sessionData.actions['reward_claim'] || 0) + (sessionData.actions['achievement_unlock'] || 0);
    return Math.min(1, profile.rewardSensitivity * 0.9 + Math.min(0.1, rewardActions / 10));
  }

  public getRetentionMetrics(playerId: string): RetentionMetrics | null {
    return this.retentionMetrics.get(playerId) || null;
  }

  public getPsychologicalProfile(playerId: string): PsychologicalProfile | null {
    return this.psychologicalProfiles.get(playerId) || null;
  }

  public getInterventionHistory(playerId: string): Array<{ type: string; timestamp: number; effectiveness: number }> {
    return this.interventionHistory.get(playerId) || [];
  }

  public updateInterventionEffectiveness(playerId: string, interventionType: string, effectiveness: number): void {
    const history = this.interventionHistory.get(playerId);
    if (!history) return;

    const lastIntervention = history
      .filter(h => h.type === interventionType)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (lastIntervention) {
      lastIntervention.effectiveness = effectiveness;
    }
  }

  public dispose(): void {
    this.retentionMetrics.clear();
    this.psychologicalProfiles.clear();
    this.interventions.clear();
    this.interventionHistory.clear();
  }
}
