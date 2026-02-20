// Performance Index Score (PIS) Engine
// Calculates weighted performance intelligence for season progression

export interface MatchPerformanceMetrics {
  result: 'WIN' | 'DRAW' | 'LOSS';
  matchImportance: number; // 0.5 to 1.5
  shotAccuracy: number; // 0 to 1
  defensiveActions: number;
  possessionBalance: number; // 0 to 1
  cleanTackles: number;
  fouls: number;
  sprintSpamRate: number; // 0 to 1
  longBallSpamRate: number; // 0 to 1
  skillDiversity: number; // 0 to 1
  opponentRank?: number;
  playerRank?: number;
  matchDuration: number; // seconds
}

export class PerformanceIndexScoreEngine {
  private spamPenaltyThreshold = 0.4;

  public calculatePIS(metrics: MatchPerformanceMetrics): number {
    // Step 1: Result weight
    let resultWeight = 1.0;
    if (metrics.result === 'DRAW') resultWeight = 0.6;
    if (metrics.result === 'LOSS') resultWeight = 0.3;

    // Step 2: Performance quality
    let performanceQuality = this.calculatePerformanceQuality(metrics);

    // Step 3: Skill weight (shot accuracy + clean play)
    const skillWeight = metrics.shotAccuracy * 0.5 + performanceQuality * 0.5;

    // Step 4: Rank difference factor
    let rankDifferenceFactor = 1.0;
    if (metrics.opponentRank && metrics.playerRank) {
      const rankGap = metrics.playerRank - metrics.opponentRank;
      if (rankGap > 0) {
        // Player is higher rank, facing weaker opponent
        rankDifferenceFactor = 0.8 + Math.min(rankGap / 5000, 0.1);
      } else if (rankGap < 0) {
        // Player is lower rank, facing stronger opponent
        rankDifferenceFactor = 1.0 + Math.min(Math.abs(rankGap) / 5000, 0.3);
      }
    }

    // Step 5: Event participation weight
    const eventParticipationWeight =
      (metrics.defensiveActions * 0.1 + metrics.cleanTackles * 0.2) / 100 ||
      0;

    // Final PIS formula
    const pis =
      resultWeight * metrics.matchImportance * 100 +
      skillWeight * 50 +
      rankDifferenceFactor * 30 +
      eventParticipationWeight * 20;

    return Math.max(pis, 0);
  }

  private calculatePerformanceQuality(
    metrics: MatchPerformanceMetrics
  ): number {
    let quality = 1.0;

    // Spam penalties
    if (metrics.sprintSpamRate > this.spamPenaltyThreshold) {
      quality *= 0.85;
    }

    if (metrics.longBallSpamRate > this.spamPenaltyThreshold) {
      quality *= 0.9;
    }

    // Foul penalty
    const foulRate = metrics.fouls / Math.max(metrics.matchDuration / 60, 1);
    if (foulRate > 0.5) {
      quality *= 0.88;
    }

    // Skill diversity bonus
    quality *= 0.95 + metrics.skillDiversity * 0.1;

    // Possession balance bonus
    if (Math.abs(metrics.possessionBalance - 0.5) < 0.2) {
      quality *= 1.05;
    }

    return Math.min(quality, 1.0);
  }

  public evaluateCleanPlay(metrics: MatchPerformanceMetrics): number {
    let cleanPlayScore = 1.0;

    // Foul rate evaluation
    const foulRate = metrics.fouls / Math.max(metrics.matchDuration / 60, 1);
    if (foulRate > 1.0) cleanPlayScore *= 0.8;
    else if (foulRate > 0.5) cleanPlayScore *= 0.9;

    // Possession fairness
    if (Math.abs(metrics.possessionBalance - 0.5) > 0.3)
      cleanPlayScore *= 0.95;

    // Tactical diversity
    if (metrics.skillDiversity < 0.3) cleanPlayScore *= 0.85;

    return Math.max(cleanPlayScore, 0.5);
  }
}
