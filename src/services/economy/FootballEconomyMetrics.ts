// Football-Specific Economy Metrics
// Tailors economy calculations to football/soccer gameplay

export interface FootballPlayerMetrics {
  playerId: string;
  playerName: string;
  position: string; // GK, DEF, MID, FWD
  currentForm: number; // 0-1 scale
  squadMorale: number; // 0-1 scale
  minutesPlayed: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  tackleMade: number;
  interceptions: number;
  passAccuracy: number; // 0-1
  shotsOnTarget: number;
  foulsCommitted: number;
  cardsReceived: number;
  skillMoveSuccess: number;
  dribbleSuccessRate: number;
}

export interface FootballMatchContext {
  competitionType: 'LEAGUE' | 'CUP' | 'FRIENDLY' | 'RIVALS';
  homeTeamRank: number;
  awayTeamRank: number;
  matchWeek: number; // 1-38 for league
  isRivalry: boolean;
  homeTeamForm: number;
  awayTeamForm: number;
  expectedGoalsDiff: number; // xG difference
}

export class FootballEconomyMetricsEngine {
  // Game-specific performance evaluation
  public evaluatePlayerPerformance(
    metrics: FootballPlayerMetrics,
    matchContext: FootballMatchContext
  ): number {
    let performanceScore = 0;

    // Position-specific weightings
    const positionWeights = {
      GK: { clean_sheet: 0.4, goals_against: 0.3, saves: 0.3 },
      DEF: { tackles: 0.3, interceptions: 0.25, pass_accuracy: 0.25, fouls: 0.2 },
      MID: { passes: 0.25, tackles: 0.15, assists: 0.35, fouls: 0.15, form: 0.1 },
      FWD: { goals: 0.4, shots_on_target: 0.25, dribbles: 0.2, assists: 0.15 },
    };

    const weights = positionWeights[metrics.position as keyof typeof positionWeights] || positionWeights.MID;

    // Clean sheets for defenders/GK
    if (metrics.position === 'GK' || metrics.position === 'DEF') {
      performanceScore += metrics.cleanSheets * 15;
    }

    // Goals for attackers
    if (metrics.position === 'FWD' || metrics.position === 'MID') {
      performanceScore += metrics.goals * 25;
    }

    // Assists for midfielders/strikers
    performanceScore += metrics.assists * 15;

    // Defensive contributions
    performanceScore += metrics.tackleMade * 5;
    performanceScore += metrics.interceptions * 8;

    // Possession and ball control
    performanceScore += metrics.passAccuracy * 10;
    performanceScore += metrics.dribbleSuccessRate * 12;

    // Skill diversity bonus
    performanceScore += metrics.skillMoveSuccess * 5;

    // Form factor
    performanceScore *= 0.8 + metrics.currentForm * 0.4;

    // Squad morale multiplication
    performanceScore *= 0.9 + metrics.squadMorale * 0.2;

    // Rival match bonus
    if (matchContext.isRivalry) {
      performanceScore *= 1.15;
    }

    // Foul penalty
    if (metrics.foulsCommitted > 3) {
      performanceScore *= Math.max(0.7, 1 - metrics.foulsCommitted * 0.1);
    }

    return Math.max(performanceScore, 0);
  }

  // Calculate match importance based on football context
  public calculateFootballMatchImportance(context: FootballMatchContext): number {
    let importance = 1.0;

    // Early season matches less important
    if (context.matchWeek < 5) importance *= 0.8;
    // Late season (title race) more important
    if (context.matchWeek > 30) importance *= 1.3;

    // Cup matches more important
    if (context.competitionType === 'CUP') importance *= 1.4;
    // Rivalry matches boosted
    if (context.isRivalry) importance *= 1.25;

    // Friendly matches less important
    if (context.competitionType === 'FRIENDLY') importance *= 0.6;

    // Rank differential
    const rankGap = Math.abs(context.homeTeamRank - context.awayTeamRank);
    if (rankGap > 1000) importance *= 1.1; // Big mismatch

    return Math.min(importance, 2.0);
  }

  // Squad morale based on recent results
  public calculateSquadMorale(
    recentResults: ('WIN' | 'DRAW' | 'LOSS')[],
    currentStreak: number
  ): number {
    let morale = 0.5; // Neutral base

    const recentScore = recentResults.reduce((sum, result) => {
      if (result === 'WIN') return sum + 1;
      if (result === 'DRAW') return sum + 0.3;
      return sum - 0.5;
    }, 0);

    morale += recentScore / recentResults.length * 0.3;

    // Winning streak bonus
    if (currentStreak > 0) {
      morale += Math.min(currentStreak * 0.05, 0.25);
    }
    // Losing streak penalty
    if (currentStreak < 0) {
      morale -= Math.min(Math.abs(currentStreak) * 0.05, 0.25);
    }

    return Math.max(0, Math.min(morale, 1));
  }

  // Player form based on recent performances
  public calculatePlayerForm(
    recentPerformances: number[],
    minutesPlayedRatio: number
  ): number {
    if (recentPerformances.length === 0) return 0.5;

    // Weighted average favoring recent matches
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < recentPerformances.length; i++) {
      const weight = (i + 1) / recentPerformances.length;
      weightedSum += recentPerformances[i] * weight;
      weightSum += weight;
    }

    let form = weightedSum / weightSum;

    // Playing time factor
    if (minutesPlayedRatio > 0.9) {
      form *= 0.95; // Fatigue penalty for too much play
    } else if (minutesPlayedRatio > 0.5) {
      form *= 1.0; // Optimal
    } else if (minutesPlayedRatio > 0.2) {
      form *= 0.95; // Less match fitness
    } else {
      form *= 0.8; // Bench penalty
    }

    return Math.max(0, Math.min(form, 1));
  }

  // Competition-specific coin multiplier
  public getCompetitionCoinMultiplier(competitionType: string): number {
    const multipliers: Record<string, number> = {
      LEAGUE: 1.0,
      CUP: 1.35,
      RIVALS: 1.5,
      FRIENDLY: 0.6,
    };
    return multipliers[competitionType] || 1.0;
  }

  // Expected Goals influence on performance
  public applyxGInfluence(pis: number, expectedGoalsDiff: number): number {
    // If underperforming xG, reduce PIS slightly
    if (expectedGoalsDiff < -0.5) {
      return pis * 0.9;
    }
    // If outperforming xG, reward
    if (expectedGoalsDiff > 1.0) {
      return pis * 1.15;
    }
    return pis;
  }
}
