import { Vector3 } from 'three';
import { PlayerState, MatchState } from '../types/MatchEngineTypes';

// Event configuration structure
interface EventConfig {
  eventId: string;
  activationWindow: { start: Date; end: Date };
  objectiveRules: EventObjective[];
  scoringWeights: { [key: string]: number };
  participationLimiters: ParticipationLimiter[];
  rewardMapping: RewardMapping;
  economyImpactFlag: boolean;
  eventType: 'competitive' | 'skill_challenge' | 'tactical_simulation' | 'narrative_campaign';
  difficultyTier: number;
}

interface EventObjective {
  id: string;
  description: string;
  metric: string;
  target: number;
  weight: number;
  timeLimit?: number;
}

interface ParticipationLimiter {
  type: 'daily' | 'weekly' | 'event';
  limit: number;
  resetInterval: number;
}

interface RewardMapping {
  percentileBrackets: { [percentile: number]: RewardPackage };
  participationReward: RewardPackage;
  milestoneRewards: { [milestone: number]: RewardPackage };
}

interface RewardPackage {
  coins: number;
  diamonds: number;
  cosmetics: string[];
  forgeTokens: number;
  seasonScore: number;
}

interface EventPacket {
  eventId: string;
  playerId: string;
  timestamp: number;
  action: string;
  metrics: { [key: string]: number };
  checksum: string;
  matchId: string;
}

interface LeaderboardEntry {
  playerId: string;
  score: number;
  rank: number;
  percentile: number;
  verified: boolean;
}

export class EventArchitecture {
  private activeEvents: Map<string, EventConfig> = new Map();
  private eventPackets: Map<string, EventPacket[]> = new Map();
  private leaderboards: Map<string, LeaderboardEntry[]> = new Map();
  private playerParticipation: Map<string, Map<string, number>> = new Map();
  private eventEconomyMonitor: EconomyMonitor;
  private configCache: Map<string, EventConfig> = new Map();
  
  // Event scoring weights
  private readonly SCORING_WEIGHTS = {
    competitive: {
      winRate: 0.3,
      cleanPlayIndex: 0.25,
      efficiency: 0.25,
      difficultyMultiplier: 0.2
    },
    skill_challenge: {
      accuracy: 0.4,
      timing: 0.3,
      consistency: 0.2,
      speed: 0.1
    },
    tactical_simulation: {
      comebackEfficiency: 0.35,
      tacticalDiscipline: 0.3,
      adaptation: 0.2,
      execution: 0.15
    },
    narrative_campaign: {
      objectiveCompletion: 0.5,
      storyProgress: 0.3,
      exploration: 0.1,
      bonusChallenges: 0.1
    }
  };

  constructor() {
    this.eventEconomyMonitor = new EconomyMonitor();
    this.initializeEventCache();
  }

  private initializeEventCache(): void {
    // Load cached event configurations
    // In production, this would fetch from remote config
    this.loadDefaultEvents();
  }

  private loadDefaultEvents(): void {
    // Sample competitive event
    const competitiveEvent: EventConfig = {
      eventId: 'competitive_weekend_2024_01',
      activationWindow: {
        start: new Date('2024-01-12T00:00:00Z'),
        end: new Date('2024-01-14T23:59:59Z')
      },
      objectiveRules: [
        {
          id: 'win_matches',
          description: 'Win competitive matches',
          metric: 'wins',
          target: 5,
          weight: 0.4
        },
        {
          id: 'clean_play',
          description: 'Maintain clean play index',
          metric: 'cleanPlayIndex',
          target: 0.8,
          weight: 0.3
        },
        {
          id: 'efficiency',
          description: 'Achieve high efficiency rating',
          metric: 'efficiency',
          target: 0.75,
          weight: 0.3
        }
      ],
      scoringWeights: this.SCORING_WEIGHTS.competitive,
      participationLimiters: [
        {
          type: 'daily',
          limit: 10,
          resetInterval: 24 * 60 * 60 * 1000 // 24 hours
        }
      ],
      rewardMapping: {
        percentileBrackets: {
          90: { coins: 1000, diamonds: 50, cosmetics: ['elite_badge'], forgeTokens: 5, seasonScore: 100 },
          75: { coins: 750, diamonds: 30, cosmetics: ['gold_badge'], forgeTokens: 3, seasonScore: 75 },
          50: { coins: 500, diamonds: 15, cosmetics: ['silver_badge'], forgeTokens: 2, seasonScore: 50 },
          25: { coins: 250, diamonds: 5, cosmetics: ['bronze_badge'], forgeTokens: 1, seasonScore: 25 }
        },
        participationReward: { coins: 100, diamonds: 2, cosmetics: [], forgeTokens: 0, seasonScore: 10 },
        milestoneRewards: {
          5: { coins: 500, diamonds: 10, cosmetics: ['milestone_5'], forgeTokens: 2, seasonScore: 50 },
          10: { coins: 1000, diamonds: 25, cosmetics: ['milestone_10'], forgeTokens: 5, seasonScore: 100 }
        }
      },
      economyImpactFlag: true,
      eventType: 'competitive',
      difficultyTier: 2
    };

    this.activeEvents.set(competitiveEvent.eventId, competitiveEvent);
    this.configCache.set(competitiveEvent.eventId, competitiveEvent);
  }

  public participateInEvent(playerId: string, eventId: string): boolean {
    const event = this.activeEvents.get(eventId);
    if (!event) return false;

    // Check participation limits
    if (!this.checkParticipationLimit(playerId, event)) {
      return false;
    }

    // Initialize player participation tracking
    if (!this.playerParticipation.has(playerId)) {
      this.playerParticipation.set(playerId, new Map());
    }

    const playerEvents = this.playerParticipation.get(playerId)!;
    const currentCount = playerEvents.get(eventId) || 0;
    playerEvents.set(eventId, currentCount + 1);

    return true;
  }

  private checkParticipationLimit(playerId: string, event: EventConfig): boolean {
    const playerEvents = this.playerParticipation.get(playerId);
    if (!playerEvents) return true;

    for (const limiter of event.participationLimiters) {
      const currentCount = playerEvents.get(event.eventId) || 0;
      if (currentCount >= limiter.limit) {
        return false;
      }
    }

    return true;
  }

  public recordEventAction(playerId: string, eventId: string, action: string, metrics: { [key: string]: number }, matchId: string): void {
    const packet: EventPacket = {
      eventId,
      playerId,
      timestamp: Date.now(),
      action,
      metrics,
      checksum: this.calculateChecksum(playerId, action, metrics),
      matchId
    };

    // Store packet locally
    if (!this.eventPackets.has(playerId)) {
      this.eventPackets.set(playerId, []);
    }
    this.eventPackets.get(playerId)!.push(packet);

    // Update economy monitor
    this.eventEconomyMonitor.recordAction(eventId, metrics);
  }

  private calculateChecksum(playerId: string, action: string, metrics: { [key: string]: number }): string {
    // Simple checksum for integrity validation
    const data = `${playerId}${action}${JSON.stringify(metrics)}${Date.now()}`;
    return btoa(data).slice(0, 16);
  }

  public calculateEventScore(playerId: string, eventId: string): number {
    const event = this.activeEvents.get(eventId);
    if (!event) return 0;

    const packets = this.eventPackets.get(playerId)?.filter(p => p.eventId === eventId) || [];
    const weights = event.scoringWeights;

    let totalScore = 0;

    // Calculate weighted efficiency score
    for (const objective of event.objectiveRules) {
      const metricValue = this.calculateMetricValue(packets, objective.metric);
      const efficiency = Math.min(1, metricValue / objective.target);
      const weightedScore = efficiency * objective.weight;
      totalScore += weightedScore;
    }

    // Apply difficulty multiplier
    const difficultyMultiplier = 1 + (event.difficultyTier * 0.1);
    totalScore *= difficultyMultiplier;

    // Apply time efficiency (performance quality / time invested)
    const timeEfficiency = this.calculateTimeEfficiency(packets);
    totalScore *= timeEfficiency;

    return Math.round(totalScore * 1000); // Scale for leaderboard
  }

  private calculateMetricValue(packets: EventPacket[], metric: string): number {
    switch (metric) {
      case 'wins':
        return packets.filter(p => p.action === 'match_win').length;
      case 'cleanPlayIndex':
        return this.calculateCleanPlayIndex(packets);
      case 'efficiency':
        return this.calculateEfficiency(packets);
      case 'accuracy':
        return this.calculateAccuracy(packets);
      case 'timing':
        return this.calculateTiming(packets);
      default:
        return 0;
    }
  }

  private calculateCleanPlayIndex(packets: EventPacket[]): number {
    const totalActions = packets.length;
    const foulActions = packets.filter(p => p.action.includes('foul')).length;
    return Math.max(0, 1 - (foulActions / totalActions));
  }

  private calculateEfficiency(packets: EventPacket[]): number {
    const wins = packets.filter(p => p.action === 'match_win').length;
    const totalMatches = packets.filter(p => p.action === 'match_complete').length;
    return totalMatches > 0 ? wins / totalMatches : 0;
  }

  private calculateAccuracy(packets: EventPacket[]): number {
    const shots = packets.filter(p => p.action === 'shot');
    const goals = packets.filter(p => p.action === 'goal');
    return shots.length > 0 ? goals.length / shots.length : 0;
  }

  private calculateTiming(packets: EventPacket[]): number {
    // Calculate average timing efficiency for skill challenges
    const timingActions = packets.filter(p => p.metrics.timing);
    if (timingActions.length === 0) return 0;

    const avgTiming = timingActions.reduce((sum, p) => sum + p.metrics.timing, 0) / timingActions.length;
    return Math.max(0, 1 - (avgTiming / 1000)); // Normalize to 0-1
  }

  private calculateTimeEfficiency(packets: EventPacket[]): number {
    if (packets.length === 0) return 1;

    const startTime = Math.min(...packets.map(p => p.timestamp));
    const endTime = Math.max(...packets.map(p => p.timestamp));
    const duration = (endTime - startTime) / (1000 * 60); // minutes

    // Efficiency decreases with excessive time
    return Math.max(0.1, 1 - (duration / 60)); // 1 hour = 0 efficiency
  }

  public updateLeaderboard(eventId: string): void {
    const event = this.activeEvents.get(eventId);
    if (!event) return;

    const entries: LeaderboardEntry[] = [];

    // Calculate scores for all participants
    for (const [playerId, packets] of this.eventPackets.entries()) {
      const playerPackets = packets.filter(p => p.eventId === eventId);
      if (playerPackets.length === 0) continue;

      const score = this.calculateEventScore(playerId, eventId);
      entries.push({
        playerId,
        score,
        rank: 0, // Will be calculated after sorting
        percentile: 0, // Will be calculated after sorting
        verified: this.verifyPackets(playerPackets)
      });
    }

    // Sort by score
    entries.sort((a, b) => b.score - a.score);

    // Calculate ranks and percentiles
    const totalParticipants = entries.length;
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.percentile = ((totalParticipants - index) / totalParticipants) * 100;
    });

    this.leaderboards.set(eventId, entries);
  }

  private verifyPackets(packets: EventPacket[]): boolean {
    // Verify packet integrity using checksums
    for (const packet of packets) {
      const expectedChecksum = this.calculateChecksum(
        packet.playerId,
        packet.action,
        packet.metrics
      );
      
      if (packet.checksum !== expectedChecksum) {
        return false;
      }
    }
    return true;
  }

  public getEventRewards(playerId: string, eventId: string): RewardPackage | null {
    const leaderboard = this.leaderboards.get(eventId);
    if (!leaderboard) return null;

    const entry = leaderboard.find(e => e.playerId === playerId);
    if (!entry || !entry.verified) return null;

    const event = this.activeEvents.get(eventId);
    if (!event) return null;

    // Find percentile bracket
    const percentile = entry.percentile;
    let reward = event.rewardMapping.participationReward;

    for (const [bracketPercentile, bracketReward] of Object.entries(event.rewardMapping.percentileBrackets)) {
      if (percentile >= parseFloat(bracketPercentile)) {
        reward = bracketReward;
        break;
      }
    }

    return reward;
  }

  public getEventConfig(eventId: string): EventConfig | null {
    return this.activeEvents.get(eventId) || this.configCache.get(eventId) || null;
  }

  public getLeaderboard(eventId: string, limit: number = 100): LeaderboardEntry[] {
    const leaderboard = this.leaderboards.get(eventId) || [];
    return leaderboard.slice(0, limit);
  }

  public getPlayerEventHistory(playerId: string, eventId: string): EventPacket[] {
    const packets = this.eventPackets.get(playerId) || [];
    return packets.filter(p => p.eventId === eventId);
  }

  // Economy monitoring
  public getEconomyMetrics(): {
    totalDiamondsEmitted: number;
    averageRewardPerPlayer: number;
    inflationIndex: number;
  } {
    return this.eventEconomyMonitor.getMetrics();
  }

  // Event management
  public activateEvent(eventConfig: EventConfig): void {
    this.activeEvents.set(eventConfig.eventId, eventConfig);
    this.configCache.set(eventConfig.eventId, eventConfig);
  }

  public deactivateEvent(eventId: string): void {
    this.activeEvents.delete(eventId);
    
    // Clean up temporary data
    this.cleanupEventData(eventId);
  }

  private cleanupEventData(eventId: string): void {
    // Remove expired packets and temporary modifiers
    for (const [playerId, packets] of this.eventPackets.entries()) {
      const filteredPackets = packets.filter(p => p.eventId !== eventId);
      this.eventPackets.set(playerId, filteredPackets);
    }

    this.leaderboards.delete(eventId);
  }

  public getActiveEvents(): EventConfig[] {
    return Array.from(this.activeEvents.values());
  }

  public dispose(): void {
    this.activeEvents.clear();
    this.eventPackets.clear();
    this.leaderboards.clear();
    this.playerParticipation.clear();
    this.configCache.clear();
    this.eventEconomyMonitor.dispose();
  }
}

// Economy monitoring class
class EconomyMonitor {
  private totalDiamondsEmitted: number = 0;
  private playerRewards: Map<string, number> = new Map();
  private rewardHistory: Array<{ timestamp: number; diamonds: number }> = [];

  public recordAction(eventId: string, metrics: { [key: string]: number }): void {
    // Track economy impact
    if (metrics.diamonds) {
      this.totalDiamondsEmitted += metrics.diamonds;
      this.rewardHistory.push({
        timestamp: Date.now(),
        diamonds: metrics.diamonds
      });
    }
  }

  public getMetrics(): {
    totalDiamondsEmitted: number;
    averageRewardPerPlayer: number;
    inflationIndex: number;
  } {
    const averageRewardPerPlayer = this.playerRewards.size > 0 ?
      this.totalDiamondsEmitted / this.playerRewards.size : 0;

    // Calculate inflation index based on recent reward history
    const recentRewards = this.rewardHistory.slice(-100); // Last 100 rewards
    const averageRecent = recentRewards.length > 0 ?
      recentRewards.reduce((sum, r) => sum + r.diamonds, 0) / recentRewards.length : 0;
    const inflationIndex = averageRecent > 0 ? averageRewardPerPlayer / averageRecent : 1;

    return {
      totalDiamondsEmitted: this.totalDiamondsEmitted,
      averageRewardPerPlayer,
      inflationIndex
    };
  }

  public dispose(): void {
    this.totalDiamondsEmitted = 0;
    this.playerRewards.clear();
    this.rewardHistory = [];
  }
}
