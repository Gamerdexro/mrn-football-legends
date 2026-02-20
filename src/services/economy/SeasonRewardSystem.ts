// Season Reward Ladder - Milestone-based, 30-day season system

export interface SeasonMetadata {
  season_id: string;
  season_start_timestamp: number;
  season_end_timestamp: number;
  season_hidden_score: number;
  season_rank_modifier: number;
  season_reward_state: 'ACTIVE' | 'CLAIMED' | 'ENDED';
}

export interface MilestoneDefinition {
  id: number;
  baseThreshold: number;
  difficultyScaling: number;
  stageWeight: number;
  rewards: {
    coinsReward: number;
    diamondsReward: number;
    cosmetics?: string[];
  };
}

export class SeasonRewardSystem {
  private currentSeason: SeasonMetadata;
  private milestones: MilestoneDefinition[] = [];
  private SEASON_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(playerRank: number) {
    const now = Date.now();
    this.currentSeason = {
      season_id: `season_${Math.floor(now / this.SEASON_DURATION_MS)}`,
      season_start_timestamp: now,
      season_end_timestamp: now + this.SEASON_DURATION_MS,
      season_hidden_score: 0,
      season_rank_modifier: this.calculateRankModifier(playerRank),
      season_reward_state: 'ACTIVE',
    };
    this.initializeMilestones();
  }

  private calculateRankModifier(playerRank: number): number {
    // Normalize rank (0-100) to modifier 0.8-1.2
    return 0.8 + (playerRank / 10000) * 0.4;
  }

  private initializeMilestones(): void {
    const baseThreshold = 100;
    const maxMilestones = 10;

    for (let i = 1; i <= maxMilestones; i++) {
      // Early milestones have lower weight, late milestones exponential
      const stageWeight = Math.pow(1.5, i - 1);
      const threshold = baseThreshold * (1 + i * 0.3) * stageWeight;

      this.milestones.push({
        id: i,
        baseThreshold: baseThreshold * (1 + i * 0.3),
        difficultyScaling: 1.0,
        stageWeight: stageWeight,
        rewards: {
          coinsReward: 500 * i,
          diamondsReward: Math.floor(50 + i * 10),
          cosmetics: i % 3 === 0 ? [`badge_${i}`] : undefined,
        },
      });
    }
  }

  public addSeasonScore(pis: number): void {
    this.currentSeason.season_hidden_score += pis;
  }

  public getUnlockedMilestones(): MilestoneDefinition[] {
    return this.milestones.filter(
      m => this.currentSeason.season_hidden_score >= this.calculateMilestoneThreshold(m)
    );
  }

  private calculateMilestoneThreshold(milestone: MilestoneDefinition): number {
    return (
      milestone.baseThreshold *
      milestone.difficultyScaling *
      milestone.stageWeight
    );
  }

  public getNearestMilestone(): { milestone: MilestoneDefinition; progress: number } {
    for (const milestone of this.milestones) {
      const threshold = this.calculateMilestoneThreshold(milestone);
      if (this.currentSeason.season_hidden_score < threshold) {
        const progress =
          this.currentSeason.season_hidden_score / threshold;
        return { milestone, progress: Math.min(progress, 1.0) };
      }
    }
    return {
      milestone: this.milestones[this.milestones.length - 1],
      progress: 1.0,
    };
  }

  public isSeasonActive(): boolean {
    return Date.now() < this.currentSeason.season_end_timestamp;
  }

  public getSeasonMetadata(): SeasonMetadata {
    return this.currentSeason;
  }
}
