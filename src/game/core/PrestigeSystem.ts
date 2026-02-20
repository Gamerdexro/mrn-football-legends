import { Vector3 } from 'three';
import { PlayerState } from '../types/MatchEngineTypes';

// Prestige tier definitions
interface PrestigeTier {
  level: number;
  title: string;
  requiredPoints: number;
  visualRewards: VisualReward[];
  uiPrivileges: UIPrivilege[];
  badgeAsset: string;
  stadiumTheme: string;
  crowdChoreography: string;
  kitGlowTrim: string;
  profileAura: string;
}

interface VisualReward {
  type: 'badge' | 'stadium_theme' | 'crowd_choreography' | 'kit_glow' | 'profile_aura' | 'goal_celebration';
  assetId: string;
  unlockCondition: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UIPrivilege {
  type: 'customization' | 'broadcast_overlay' | 'profile_frame' | 'emote_pack';
  description: string;
  assetId: string;
}

interface PrestigeProgress {
  currentPoints: number;
  totalPointsEarned: number;
  currentTier: number;
  progressToNextTier: number; // 0-1
  momentum: number; // progression momentum
  lastActivity: Date;
  consistencyStreak: number;
  fairPlayBonus: number;
}

interface PrestigeStats {
  competitivePerformance: number;
  seasonalMilestones: number;
  fairPlayMetrics: number;
  achievementPoints: number;
  decayResistance: number;
}

export class PrestigeSystem {
  private playerProgress: Map<string, PrestigeProgress> = new Map();
  private prestigeTiers: PrestigeTier[] = [];
  private unlockedRewards: Map<string, Set<string>> = new Map();
  private prestigeHistory: Map<string, PrestigeStats[]> = new Map();
  private validationLogs: Map<string, Array<{ timestamp: number; points: number; reason: string }>> = new Map();
  
  // Non-linear scaling constants
  private readonly BASE_POINTS_PER_TIER = 1000;
  private readonly SCALING_EXPONENT = 1.8; // Non-linear progression
  private readonly DECAY_RATE = 0.95; // Daily decay for momentum
  private readonly CONSISTENCY_BONUS_MULTIPLIER = 1.2;

  constructor() {
    this.initializePrestigeTiers();
  }

  private initializePrestigeTiers(): void {
    this.prestigeTiers = [
      {
        level: 1,
        title: 'Rising Star',
        requiredPoints: 0,
        visualRewards: [
          {
            type: 'badge',
            assetId: 'bronze_star_badge',
            unlockCondition: 'Entry Level',
            rarity: 'common'
          }
        ],
        uiPrivileges: [
          {
            type: 'profile_frame',
            description: 'Bronze profile frame',
            assetId: 'bronze_frame'
          }
        ],
        badgeAsset: 'bronze_star_badge',
        stadiumTheme: 'default',
        crowdChoreography: 'basic_waves',
        kitGlowTrim: 'none',
        profileAura: 'subtle_glow'
      },
      {
        level: 2,
        title: 'Emerging Talent',
        requiredPoints: this.calculateTierRequirement(2),
        visualRewards: [
          {
            type: 'badge',
            assetId: 'silver_star_badge',
            unlockCondition: 'Tier 2 Achievement',
            rarity: 'common'
          },
          {
            type: 'stadium_theme',
            assetId: 'modern_stadium_night',
            unlockCondition: 'Tier 2 Prestige',
            rarity: 'rare'
          }
        ],
        uiPrivileges: [
          {
            type: 'customization',
            description: 'Custom goal celebration',
            assetId: 'goal_celebration_pack_1'
          }
        ],
        badgeAsset: 'silver_star_badge',
        stadiumTheme: 'modern_stadium_night',
        crowdChoreography: 'coordinated_chants',
        kitGlowTrim: 'silver_trim',
        profileAura: 'gentle_aura'
      },
      {
        level: 3,
        title: 'Professional Elite',
        requiredPoints: this.calculateTierRequirement(3),
        visualRewards: [
          {
            type: 'badge',
            assetId: 'gold_star_badge',
            unlockCondition: 'Tier 3 Excellence',
            rarity: 'rare'
          },
          {
            type: 'crowd_choreography',
            assetId: 'choreographed_card_display',
            unlockCondition: 'Elite Status',
            rarity: 'epic'
          },
          {
            type: 'kit_glow',
            assetId: 'golden_aura_kit',
            unlockCondition: 'Professional Recognition',
            rarity: 'epic'
          }
        ],
        uiPrivileges: [
          {
            type: 'broadcast_overlay',
            description: 'Elite broadcast graphics',
            assetId: 'elite_overlay_pack'
          },
          {
            type: 'emote_pack',
            description: 'Elite emote collection',
            assetId: 'elite_emotes'
          }
        ],
        badgeAsset: 'gold_star_badge',
        stadiumTheme: 'elite_stadium_day',
        crowdChoreography: 'choreographed_card_display',
        kitGlowTrim: 'golden_trim',
        profileAura: 'radiant_aura'
      },
      {
        level: 4,
        title: 'Legendary Master',
        requiredPoints: this.calculateTierRequirement(4),
        visualRewards: [
          {
            type: 'badge',
            assetId: 'diamond_star_badge',
            unlockCondition: 'Legendary Status',
            rarity: 'legendary'
          },
          {
            type: 'stadium_theme',
            assetId: 'legendary_crystal_stadium',
            unlockCondition: 'Master Achievement',
            rarity: 'legendary'
          },
          {
            type: 'goal_celebration',
            assetId: 'legendary_cinematic_celebration',
            unlockCondition: 'Legendary Moments',
            rarity: 'legendary'
          }
        ],
        uiPrivileges: [
          {
            type: 'customization',
            description: 'Legendary customization suite',
            assetId: 'legendary_custom_pack'
          },
          {
            type: 'broadcast_overlay',
            description: 'Legendary broadcast experience',
            assetId: 'legendary_broadcast'
          }
        ],
        badgeAsset: 'diamond_star_badge',
        stadiumTheme: 'legendary_crystal_stadium',
        crowdChoreography: 'legendary_pyrotechnics',
        kitGlowTrim: 'diamond_trim',
        profileAura: 'legendary_aura'
      },
      {
        level: 5,
        title: 'Hall of Fame',
        requiredPoints: this.calculateTierRequirement(5),
        visualRewards: [
          {
            type: 'badge',
            assetId: 'hof_immortal_badge',
            unlockCondition: 'Hall of Fame Induction',
            rarity: 'legendary'
          },
          {
            type: 'profile_aura',
            assetId: 'immortal_aura',
            unlockCondition: 'Immortal Status',
            rarity: 'legendary'
          }
        ],
        uiPrivileges: [
          {
            type: 'customization',
            description: 'Hall of Fame exclusive customization',
            assetId: 'hof_exclusive_pack'
          }
        ],
        badgeAsset: 'hof_immortal_badge',
        stadiumTheme: 'hof_eternal_stadium',
        crowdChoreography: 'hof_immortal_choreography',
        kitGlowTrim: 'immortal_trim',
        profileAura: 'immortal_aura'
      }
    ];
  }

  private calculateTierRequirement(tier: number): number {
    // Non-linear scaling: higher tiers require exponential consistency
    return Math.round(this.BASE_POINTS_PER_TIER * Math.pow(tier - 1, this.SCALING_EXPONENT));
  }

  public updatePrestigePoints(playerId: string, performanceData: {
    competitivePerformance: number;
    fairPlayMetrics: number;
    seasonalMilestones: number;
    consistency: number;
    exploitFlags?: number;
  }): void {
    let progress = this.playerProgress.get(playerId);
    
    if (!progress) {
      progress = this.createInitialProgress();
      this.playerProgress.set(playerId, progress);
    }

    // Calculate points based on performance
    let pointsEarned = 0;
    
    // Competitive performance (40% weight)
    pointsEarned += performanceData.competitivePerformance * 0.4;
    
    // Fair play metrics (25% weight)
    pointsEarned += performanceData.fairPlayMetrics * 0.25;
    
    // Seasonal milestones (25% weight)
    pointsEarned += performanceData.seasonalMilestones * 0.25;
    
    // Consistency bonus (10% weight)
    const consistencyBonus = performanceData.consistency * this.CONSISTENCY_BONUS_MULTIPLIER;
    pointsEarned += consistencyBonus;

    // Apply exploit penalty
    if (performanceData.exploitFlags && performanceData.exploitFlags > 0) {
      pointsEarned *= Math.max(0.1, 1 - (performanceData.exploitFlags * 0.2));
    }

    // Apply momentum multiplier
    pointsEarned *= (1 + progress.momentum * 0.2);

    // Update progress
    progress.currentPoints += pointsEarned;
    progress.totalPointsEarned += pointsEarned;
    progress.lastActivity = new Date();
    
    // Update consistency streak
    if (performanceData.consistency > 0.8) {
      progress.consistencyStreak++;
    } else {
      progress.consistencyStreak = Math.max(0, progress.consistencyStreak - 1);
    }

    // Update momentum
    progress.momentum = this.calculateMomentum(progress, performanceData);

    // Check for tier advancement
    this.checkTierAdvancement(playerId, progress);

    // Log for validation
    this.logPrestigeUpdate(playerId, pointsEarned, 'performance_update');
  }

  private createInitialProgress(): PrestigeProgress {
    return {
      currentPoints: 0,
      totalPointsEarned: 0,
      currentTier: 1,
      progressToNextTier: 0,
      momentum: 0,
      lastActivity: new Date(),
      consistencyStreak: 0,
      fairPlayBonus: 0
    };
  }

  private calculateMomentum(progress: PrestigeProgress, performanceData: any): number {
    // Momentum based on recent activity and consistency
    const daysSinceLastActivity = (Date.now() - progress.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const activityFactor = Math.max(0, 1 - daysSinceLastActivity * 0.2);
    
    const consistencyFactor = progress.consistencyStreak * 0.1;
    
    // Apply decay
    let momentum = progress.momentum * this.DECAY_RATE;
    
    // Add new momentum
    momentum += activityFactor * 0.3 + consistencyFactor;
    
    return Math.max(0, Math.min(1, momentum));
  }

  private checkTierAdvancement(playerId: string, progress: PrestigeProgress): void {
    const newTier = this.getCurrentTierByPoints(progress.currentPoints);
    
    if (newTier > progress.currentTier) {
      // Tier advancement
      progress.currentTier = newTier;
      this.unlockTierRewards(playerId, newTier);
      this.logPrestigeUpdate(playerId, 0, `tier_advancement_${newTier}`);
    }

    // Update progress to next tier
    const currentTier = this.prestigeTiers.find(t => t.level === progress.currentTier);
    const nextTier = this.prestigeTiers.find(t => t.level === progress.currentTier + 1);
    
    if (currentTier && nextTier) {
      const pointsInCurrentTier = progress.currentPoints - currentTier.requiredPoints;
      const pointsNeededForNext = nextTier.requiredPoints - currentTier.requiredPoints;
      progress.progressToNextTier = Math.min(1, pointsInCurrentTier / pointsNeededForNext);
    } else {
      progress.progressToNextTier = 1; // Max tier
    }
  }

  private getCurrentTierByPoints(points: number): number {
    for (let i = this.prestigeTiers.length - 1; i >= 0; i--) {
      if (points >= this.prestigeTiers[i].requiredPoints) {
        return this.prestigeTiers[i].level;
      }
    }
    return 1;
  }

  private unlockTierRewards(playerId: string, tier: number): void {
    const tierData = this.prestigeTiers.find(t => t.level === tier);
    if (!tierData) return;

    if (!this.unlockedRewards.has(playerId)) {
      this.unlockedRewards.set(playerId, new Set());
    }

    const playerRewards = this.unlockedRewards.get(playerId)!;

    // Unlock visual rewards
    tierData.visualRewards.forEach(reward => {
      playerRewards.add(reward.assetId);
    });

    // Unlock UI privileges
    tierData.uiPrivileges.forEach(privilege => {
      playerRewards.add(privilege.assetId);
    });
  }

  private logPrestigeUpdate(playerId: string, points: number, reason: string): void {
    if (!this.validationLogs.has(playerId)) {
      this.validationLogs.set(playerId, []);
    }

    const logs = this.validationLogs.get(playerId)!;
    logs.push({
      timestamp: Date.now(),
      points,
      reason
    });

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
  }

  public getPrestigeProgress(playerId: string): PrestigeProgress | null {
    return this.playerProgress.get(playerId) || null;
  }

  public getCurrentTier(playerId: string): PrestigeTier | null {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return null;

    return this.prestigeTiers.find(t => t.level === progress.currentTier) || null;
  }

  public getUnlockedRewards(playerId: string): Set<string> {
    return this.unlockedRewards.get(playerId) || new Set();
  }

  public isRewardUnlocked(playerId: string, assetId: string): boolean {
    const rewards = this.unlockedRewards.get(playerId);
    return rewards ? rewards.has(assetId) : false;
  }

  public getEventParticipationMultiplier(playerId: string): number {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return 1.0;

    // Higher prestige tiers get cosmetic-only multipliers for events
    const tierMultiplier = 1 + (progress.currentTier - 1) * 0.05; // 5% per tier
    return Math.min(1.25, tierMultiplier); // Max 25% bonus
  }

  public getBroadcastOverlay(playerId: string): string {
    const tier = this.getCurrentTier(playerId);
    return tier?.stadiumTheme || 'default';
  }

  public getGoalCelebrationAssets(playerId: string): string[] {
    const rewards = this.getUnlockedRewards(playerId);
    const celebrations: string[] = [];

    rewards.forEach(assetId => {
      if (assetId.includes('celebration')) {
        celebrations.push(assetId);
      }
    });

    return celebrations;
  }

  public applyDecayResistance(playerId: string): void {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return;

    // Inactivity reduces momentum but never removes earned tiers
    const daysSinceLastActivity = (Date.now() - progress.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 7) { // 7 days inactive
      progress.momentum *= Math.pow(this.DECAY_RATE, daysSinceLastActivity - 7);
      progress.momentum = Math.max(0, progress.momentum);
    }
  }

  public getSeasonArchiveAccess(playerId: string): number {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return 0;

    // Higher tiers unlock historical season archives
    return Math.min(progress.currentTier - 1, 5); // Max 5 historical seasons
  }

  public getValidationLogs(playerId: string): Array<{ timestamp: number; points: number; reason: string }> {
    return this.validationLogs.get(playerId) || [];
  }

  public getPrestigeStats(playerId: string): PrestigeStats | null {
    const progress = this.playerProgress.get(playerId);
    if (!progress) return null;

    // Calculate comprehensive stats
    const stats: PrestigeStats = {
      competitivePerformance: progress.currentPoints * 0.4,
      seasonalMilestones: progress.totalPointsEarned * 0.25,
      fairPlayMetrics: progress.fairPlayBonus,
      achievementPoints: progress.consistencyStreak * 100,
      decayResistance: progress.momentum
    };

    // Store in history
    if (!this.prestigeHistory.has(playerId)) {
      this.prestigeHistory.set(playerId, []);
    }
    
    const history = this.prestigeHistory.get(playerId)!;
    history.push(stats);
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }

    return stats;
  }

  public setPrestigeVisibility(playerId: string, visible: boolean): void {
    // Store player preference for prestige visibility in matchmaking
    // In production, this would be saved to player preferences
  }

  public getSeasonalTheme(playerId: string): string {
    const tier = this.getCurrentTier(playerId);
    return tier?.stadiumTheme || 'default';
  }

  public getProfileAura(playerId: string): string {
    const tier = this.getCurrentTier(playerId);
    return tier?.profileAura || 'none';
  }

  public getKitGlowTrim(playerId: string): string {
    const tier = this.getCurrentTier(playerId);
    return tier?.kitGlowTrim || 'none';
  }

  public getCrowdChoreography(playerId: string): string {
    const tier = this.getCurrentTier(playerId);
    return tier?.crowdChoreography || 'basic_waves';
  }

  public dispose(): void {
    this.playerProgress.clear();
    this.unlockedRewards.clear();
    this.prestigeHistory.clear();
    this.validationLogs.clear();
  }
}
