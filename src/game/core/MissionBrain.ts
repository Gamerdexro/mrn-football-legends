import { Vector3 } from 'three';
import { PlayerState } from '../types/MatchEngineTypes';

// Mission profile vector for behavioral intelligence
interface MissionProfileVector {
  possessionRatioPreference: number; // 0-1
  attackStyleVariance: number; // 0-1
  defensiveTimingEfficiency: number; // 0-1
  sessionDurationPatterns: number[]; // hours
  preferredPositions: string[];
  skillLevel: number; // 0-100
  recentActivity: ActivityPattern[];
  fatigueIndex: number; // 0-1
}

interface ActivityPattern {
  date: Date;
  sessionLength: number; // minutes
  matchesPlayed: number;
  winRate: number;
  actionsPerformed: { [action: string]: number };
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly';
  category: 'attacking' | 'defending' | 'possession' | 'skill' | 'tactical';
  objectives: MissionObjective[];
  difficulty: number; // 1-10
  weight: number; // selection probability weight
  behaviorFilter?: string[]; // player behaviors this mission suits
  antiSpam: {
    maxCompletionsPerDay: number;
    completionCooldown: number; // milliseconds
  };
  rewards: MissionReward;
  teachingElement?: string; // subtle mechanic teaching
}

interface MissionObjective {
  id: string;
  description: string;
  metric: string;
  target: number;
  progress: number;
  weight: number; // for scoring
  timeLimit?: number; // minutes
  qualityMultiplier?: boolean; // if performance quality affects completion speed
}

interface MissionReward {
  coins: number;
  forgeMaterials: number;
  cosmeticTokens: number;
  seasonScore: number;
  diamonds?: number;
}

interface ProgressToken {
  missionId: string;
  objectiveId: string;
  progress: number;
  timestamp: number;
  checksum: string;
  quality: number; // 0-1 performance quality
}

export class MissionBrain {
  private playerProfiles: Map<string, MissionProfileVector> = new Map();
  private activeMissions: Map<string, Mission[]> = new Map(); // playerId -> missions
  private missionProgress: Map<string, ProgressToken[]> = new Map();
  private missionPools: Map<string, Mission[]> = new Map();
  private lastReset: Map<string, Date> = new Map();
  private rerollTokens: Map<string, number> = new Map();
  private missionFatigue: Map<string, Map<string, number>> = new Map(); // playerId -> missionType -> fatigue
  
  // Mission generation weights
  private readonly BASE_MISSION_WEIGHTS = {
    attacking: 0.25,
    defending: 0.25,
    possession: 0.2,
    skill: 0.2,
    tactical: 0.1
  };

  constructor() {
    this.initializeMissionPools();
    this.loadMissionTemplates();
  }

  private initializeMissionPools(): void {
    this.missionPools.set('daily', []);
    this.missionPools.set('weekly', []);
  }

  private loadMissionTemplates(): void {
    // Daily mission templates
    const dailyMissions: Mission[] = [
      {
        id: 'daily_possession_master',
        title: 'Possession Master',
        description: 'Maintain 65% possession in 3 matches',
        type: 'daily',
        category: 'possession',
        objectives: [
          {
            id: 'possession_target',
            description: 'Achieve 65% possession',
            metric: 'possession_percentage',
            target: 65,
            progress: 0,
            weight: 1.0,
            qualityMultiplier: true
          },
          {
            id: 'matches_played',
            description: 'Play 3 matches',
            metric: 'matches_completed',
            target: 3,
            progress: 0,
            weight: 0.5
          }
        ],
        difficulty: 3,
        weight: 1.0,
        behaviorFilter: ['possession_focused'],
        antiSpam: {
          maxCompletionsPerDay: 1,
          completionCooldown: 24 * 60 * 60 * 1000
        },
        rewards: {
          coins: 200,
          forgeMaterials: 10,
          cosmeticTokens: 1,
          seasonScore: 15
        },
        teachingElement: 'possession_retention'
      },
      {
        id: 'daily_clinical_finisher',
        title: 'Clinical Finisher',
        description: 'Achieve 80% shot accuracy in 2 matches',
        type: 'daily',
        category: 'attacking',
        objectives: [
          {
            id: 'shot_accuracy',
            description: '80% shot accuracy',
            metric: 'shot_accuracy',
            target: 80,
            progress: 0,
            weight: 1.0,
            qualityMultiplier: true
          },
          {
            id: 'matches_played',
            description: 'Play 2 matches',
            metric: 'matches_completed',
            target: 2,
            progress: 0,
            weight: 0.3
          }
        ],
        difficulty: 4,
        weight: 0.8,
        behaviorFilter: ['attacking_focused', 'high_accuracy'],
        antiSpam: {
          maxCompletionsPerDay: 1,
          completionCooldown: 24 * 60 * 60 * 1000
        },
        rewards: {
          coins: 250,
          forgeMaterials: 15,
          cosmeticTokens: 1,
          seasonScore: 20
        },
        teachingElement: 'shot_placement'
      },
      {
        id: 'daily_tactical_defender',
        title: 'Tactical Defender',
        description: 'Complete 5 successful tackles with 90% timing',
        type: 'daily',
        category: 'defending',
        objectives: [
          {
            id: 'successful_tackles',
            description: '5 successful tackles',
            metric: 'successful_tackles',
            target: 5,
            progress: 0,
            weight: 0.7
          },
          {
            id: 'tackle_timing',
            description: '90% tackle timing accuracy',
            metric: 'tackle_timing_accuracy',
            target: 90,
            progress: 0,
            weight: 0.5,
            qualityMultiplier: true
          }
        ],
        difficulty: 5,
        weight: 0.9,
        behaviorFilter: ['defensive_focused', 'good_timing'],
        antiSpam: {
          maxCompletionsPerDay: 1,
          completionCooldown: 24 * 60 * 60 * 1000
        },
        rewards: {
          coins: 300,
          forgeMaterials: 20,
          cosmeticTokens: 2,
          seasonScore: 25
        },
        teachingElement: 'tackle_timing'
      }
    ];

    // Weekly mission templates
    const weeklyMissions: Mission[] = [
      {
        id: 'weekly_tactical_consistency',
        title: 'Tactical Consistency',
        description: 'Maintain formation shape 85% across 10 matches',
        type: 'weekly',
        category: 'tactical',
        objectives: [
          {
            id: 'formation_discipline',
            description: '85% formation discipline',
            metric: 'formation_discipline',
            target: 85,
            progress: 0,
            weight: 0.6,
            qualityMultiplier: true
          },
          {
            id: 'matches_played',
            description: 'Complete 10 matches',
            metric: 'matches_completed',
            target: 10,
            progress: 0,
            weight: 0.4
          }
        ],
        difficulty: 6,
        weight: 1.0,
        antiSpam: {
          maxCompletionsPerDay: 2,
          completionCooldown: 12 * 60 * 60 * 1000
        },
        rewards: {
          coins: 800,
          forgeMaterials: 50,
          cosmeticTokens: 5,
          seasonScore: 80,
          diamonds: 10
        }
      },
      {
        id: 'weekly_adaptive_playmaker',
        title: 'Adaptive Playmaker',
        description: 'Create 20 chances with varied attack patterns',
        type: 'weekly',
        category: 'attacking',
        objectives: [
          {
            id: 'chances_created',
            description: '20 chances created',
            metric: 'chances_created',
            target: 20,
            progress: 0,
            weight: 0.5
          },
          {
            id: 'attack_variety',
            description: 'Use 5 different attack patterns',
            metric: 'attack_patterns_used',
            target: 5,
            progress: 0,
            weight: 0.5,
            qualityMultiplier: true
          }
        ],
        difficulty: 7,
        weight: 0.8,
        antiSpam: {
          maxCompletionsPerDay: 3,
          completionCooldown: 8 * 60 * 60 * 1000
        },
        rewards: {
          coins: 1000,
          forgeMaterials: 60,
          cosmeticTokens: 6,
          seasonScore: 100,
          diamonds: 15
        },
        teachingElement: 'tactical_adaptation'
      }
    ];

    this.missionPools.set('daily', dailyMissions);
    this.missionPools.set('weekly', weeklyMissions);
  }

  public updatePlayerProfile(playerId: string, matchData: any): void {
    let profile = this.playerProfiles.get(playerId);
    
    if (!profile) {
      profile = this.createInitialProfile();
      this.playerProfiles.set(playerId, profile);
    }

    // Update profile with new match data
    this.updateProfileMetrics(profile, matchData);
    
    // Track activity patterns
    const activity: ActivityPattern = {
      date: new Date(),
      sessionLength: matchData.sessionLength || 30,
      matchesPlayed: matchData.matchesPlayed || 1,
      winRate: matchData.winRate || 0,
      actionsPerformed: matchData.actions || {}
    };
    
    profile.recentActivity.push(activity);
    
    // Keep only last 30 days of activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    profile.recentActivity = profile.recentActivity.filter(a => a.date > thirtyDaysAgo);
  }

  private createInitialProfile(): MissionProfileVector {
    return {
      possessionRatioPreference: 0.5,
      attackStyleVariance: 0.5,
      defensiveTimingEfficiency: 0.5,
      sessionDurationPatterns: [],
      preferredPositions: [],
      skillLevel: 50,
      recentActivity: [],
      fatigueIndex: 0
    };
  }

  private updateProfileMetrics(profile: MissionProfileVector, matchData: any): void {
    // Update possession preference
    if (matchData.possessionPercentage !== undefined) {
      profile.possessionRatioPreference = 
        profile.possessionRatioPreference * 0.9 + matchData.possessionPercentage * 0.1;
    }

    // Update attack style variance
    if (matchData.attackPatterns) {
      const patternCount = Object.keys(matchData.attackPatterns).length;
      profile.attackStyleVariance = 
        profile.attackStyleVariance * 0.9 + (patternCount / 5) * 0.1;
    }

    // Update defensive timing efficiency
    if (matchData.tackleTimingAccuracy !== undefined) {
      profile.defensiveTimingEfficiency = 
        profile.defensiveTimingEfficiency * 0.9 + matchData.tackleTimingAccuracy * 0.1;
    }

    // Update skill level based on performance
    if (matchData.performanceScore !== undefined) {
      profile.skillLevel = 
        profile.skillLevel * 0.95 + matchData.performanceScore * 0.05;
    }

    // Update session duration patterns
    if (matchData.sessionLength) {
      profile.sessionDurationPatterns.push(matchData.sessionLength);
      if (profile.sessionDurationPatterns.length > 10) {
        profile.sessionDurationPatterns.shift();
      }
    }
  }

  public generateDailyMissions(playerId: string): Mission[] {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return [];

    // Check if missions need reset
    if (this.shouldResetDailyMissions(playerId)) {
      this.resetDailyMissions(playerId);
    }

    const dailyPool = this.missionPools.get('daily') || [];
    const selectedMissions: Mission[] = [];
    const missionCount = 3; // 3 daily missions

    // Filter missions based on player behavior
    const filteredMissions = this.filterMissionsByBehavior(dailyPool, profile);
    
    // Select missions using weighted random
    for (let i = 0; i < missionCount && filteredMissions.length > 0; i++) {
      const mission = this.selectWeightedMission(filteredMissions, profile);
      if (mission && !selectedMissions.includes(mission)) {
        selectedMissions.push(mission);
        filteredMissions.splice(filteredMissions.indexOf(mission), 1);
      }
    }

    this.activeMissions.set(playerId, selectedMissions);
    return selectedMissions;
  }

  public generateWeeklyMissions(playerId: string): Mission[] {
    const profile = this.playerProfiles.get(playerId);
    if (!profile) return [];

    // Check if weekly missions need reset
    if (this.shouldResetWeeklyMissions(playerId)) {
      this.resetWeeklyMissions(playerId);
    }

    const weeklyPool = this.missionPools.get('weekly') || [];
    const selectedMissions: Mission[] = [];
    const missionCount = 2; // 2 weekly missions

    // Apply difficulty scaling based on performance percentile
    const scaledPool = this.scaleMissionDifficulty(weeklyPool, profile);
    
    // Select missions
    for (let i = 0; i < missionCount && scaledPool.length > 0; i++) {
      const mission = this.selectWeightedMission(scaledPool, profile);
      if (mission && !selectedMissions.includes(mission)) {
        selectedMissions.push(mission);
        scaledPool.splice(scaledPool.indexOf(mission), 1);
      }
    }

    // Add to existing missions (don't overwrite daily)
    const existingMissions = this.activeMissions.get(playerId) || [];
    const allMissions = [...existingMissions, ...selectedMissions];
    this.activeMissions.set(playerId, allMissions);

    return selectedMissions;
  }

  private shouldResetDailyMissions(playerId: string): boolean {
    const lastReset = this.lastReset.get(`${playerId}_daily`);
    if (!lastReset) return true;

    const now = new Date();
    const lastResetDate = new Date(lastReset);
    
    return now.getDate() !== lastResetDate.getDate() ||
           now.getMonth() !== lastResetDate.getMonth() ||
           now.getFullYear() !== lastResetDate.getFullYear();
  }

  private shouldResetWeeklyMissions(playerId: string): boolean {
    const lastReset = this.lastReset.get(`${playerId}_weekly`);
    if (!lastReset) return true;

    const now = new Date();
    const lastResetDate = new Date(lastReset);
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    
    return lastResetDate < weekStart;
  }

  private resetDailyMissions(playerId: string): void {
    // Remove completed daily missions
    const existingMissions = this.activeMissions.get(playerId) || [];
    const filteredMissions = existingMissions.filter(m => m.type !== 'daily');
    this.activeMissions.set(playerId, filteredMissions);
    
    this.lastReset.set(`${playerId}_daily`, new Date());
  }

  private resetWeeklyMissions(playerId: string): void {
    // Remove completed weekly missions
    const existingMissions = this.activeMissions.get(playerId) || [];
    const filteredMissions = existingMissions.filter(m => m.type !== 'weekly');
    this.activeMissions.set(playerId, filteredMissions);
    
    this.lastReset.set(`${playerId}_weekly`, new Date());
  }

  private filterMissionsByBehavior(missions: Mission[], profile: MissionProfileVector): Mission[] {
    return missions.filter(mission => {
      if (!mission.behaviorFilter) return true;

      // Check if mission suits player behavior
      for (const behavior of mission.behaviorFilter) {
        switch (behavior) {
          case 'possession_focused':
            return profile.possessionRatioPreference > 0.6;
          case 'attacking_focused':
            return profile.attackStyleVariance > 0.5;
          case 'defensive_focused':
            return profile.defensiveTimingEfficiency > 0.7;
          case 'high_accuracy':
            return profile.skillLevel > 60;
          case 'good_timing':
            return profile.defensiveTimingEfficiency > 0.6;
        }
      }

      return true;
    });
  }

  private scaleMissionDifficulty(missions: Mission[], profile: MissionProfileVector): Mission[] {
    return missions.map(mission => {
      const scaledMission = { ...mission };
      
      // Scale difficulty based on performance percentile
      const performancePercentile = profile.skillLevel / 100;
      const difficultyAdjustment = 1 + (performancePercentile - 0.5) * 0.4;
      
      scaledMission.difficulty = Math.max(1, Math.min(10, 
        Math.round(mission.difficulty * difficultyAdjustment)));
      
      return scaledMission;
    });
  }

  private selectWeightedMission(missions: Mission[], profile: MissionProfileVector): Mission | null {
    if (missions.length === 0) return null;

    // Calculate weights based on player profile and mission fatigue
    const weights = missions.map(mission => {
      let weight = mission.weight;

      // Apply fatigue reduction
      const fatigue = this.getMissionFatigue(profile, mission.category);
      weight *= (1 - fatigue * 0.5);

      // Apply behavior preference bonus
      if (mission.behaviorFilter) {
        for (const behavior of mission.behaviorFilter) {
          if (this.behaviorMatchesProfile(behavior, profile)) {
            weight *= 1.5;
          }
        }
      }

      return weight;
    });

    // Weighted random selection
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < missions.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return missions[i];
      }
    }

    return missions[missions.length - 1];
  }

  private behaviorMatchesProfile(behavior: string, profile: MissionProfileVector): boolean {
    switch (behavior) {
      case 'possession_focused':
        return profile.possessionRatioPreference > 0.6;
      case 'attacking_focused':
        return profile.attackStyleVariance > 0.5;
      case 'defensive_focused':
        return profile.defensiveTimingEfficiency > 0.7;
      default:
        return false;
    }
  }

  private getMissionFatigue(profile: MissionProfileVector, category: string): number {
    // Simple fatigue calculation - in production would be more sophisticated
    return profile.fatigueIndex;
  }

  public updateMissionProgress(playerId: string, missionId: string, objectiveId: string, progress: number, quality: number = 0.5): void {
    const token: ProgressToken = {
      missionId,
      objectiveId,
      progress,
      timestamp: Date.now(),
      checksum: this.calculateProgressChecksum(playerId, missionId, objectiveId, progress),
      quality
    };

    if (!this.missionProgress.has(playerId)) {
      this.missionProgress.set(playerId, []);
    }

    const playerProgress = this.missionProgress.get(playerId)!;
    
    // Remove existing progress for this objective
    const existingIndex = playerProgress.findIndex(t => 
      t.missionId === missionId && t.objectiveId === objectiveId);
    
    if (existingIndex >= 0) {
      playerProgress[existingIndex] = token;
    } else {
      playerProgress.push(token);
    }

    // Update mission objectives
    const missions = this.activeMissions.get(playerId) || [];
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      const objective = mission.objectives.find(o => o.id === objectiveId);
      if (objective) {
        objective.progress = progress;
        
        // Apply quality multiplier for completion speed
        if (objective.qualityMultiplier && quality > 0.8) {
          objective.progress *= 1.2; // 20% speed bonus for high quality
        }
      }
    }
  }

  private calculateProgressChecksum(playerId: string, missionId: string, objectiveId: string, progress: number): string {
    const data = `${playerId}${missionId}${objectiveId}${progress}${Date.now()}`;
    return btoa(data).slice(0, 16);
  }

  public getMissionCompletionStatus(playerId: string): {
    completed: Mission[];
    inProgress: Mission[];
    rewards: MissionReward[];
  } {
    const missions = this.activeMissions.get(playerId) || [];
    const progress = this.missionProgress.get(playerId) || [];
    
    const completed: Mission[] = [];
    const inProgress: Mission[] = [];
    const rewards: MissionReward[] = [];

    for (const mission of missions) {
      let allObjectivesComplete = true;
      
      for (const objective of mission.objectives) {
        const progressToken = progress.find(t => 
          t.missionId === mission.id && t.objectiveId === objective.id);
        
        if (progressToken && progressToken.progress >= objective.target) {
          // Objective complete
        } else {
          allObjectivesComplete = false;
          break;
        }
      }

      if (allObjectivesComplete) {
        completed.push(mission);
        rewards.push(mission.rewards);
      } else {
        inProgress.push(mission);
      }
    }

    return { completed, inProgress, rewards };
  }

  public rerollMission(playerId: string, missionId: string): boolean {
    const tokens = this.rerollTokens.get(playerId) || 0;
    if (tokens <= 0) return false;

    // Check if player has enough coins (cost 100 coins)
    // In production, this would check player's coin balance
    
    // Remove mission and generate new one
    const missions = this.activeMissions.get(playerId) || [];
    const missionIndex = missions.findIndex(m => m.id === missionId);
    
    if (missionIndex >= 0) {
      missions.splice(missionIndex, 1);
      
      // Generate replacement mission
      const profile = this.playerProfiles.get(playerId);
      if (profile) {
        const pool = missionId.includes('weekly') ? 
          this.missionPools.get('weekly') || [] : 
          this.missionPools.get('daily') || [];
        
        const newMission = this.selectWeightedMission(pool, profile);
        if (newMission) {
          missions.push(newMission);
        }
      }
      
      this.rerollTokens.set(playerId, tokens - 1);
      return true;
    }

    return false;
  }

  public grantRerollToken(playerId: string): void {
    const tokens = this.rerollTokens.get(playerId) || 0;
    this.rerollTokens.set(playerId, tokens + 1);
  }

  public getActiveMissions(playerId: string): Mission[] {
    return this.activeMissions.get(playerId) || [];
  }

  public getMissionProgress(playerId: string): ProgressToken[] {
    return this.missionProgress.get(playerId) || [];
  }

  public getPlayerProfile(playerId: string): MissionProfileVector | null {
    return this.playerProfiles.get(playerId) || null;
  }

  public dispose(): void {
    this.playerProfiles.clear();
    this.activeMissions.clear();
    this.missionProgress.clear();
    this.missionPools.clear();
    this.lastReset.clear();
    this.rerollTokens.clear();
    this.missionFatigue.clear();
  }
}
