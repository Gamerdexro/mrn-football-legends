// Economy Engine - Coins and Diamond Distribution

export interface RewardPacket {
  coins: number;
  diamonds: number;
  timestamp: number;
  matchId: string;
  difficulty: number;
}

export class EconomyEngine {
  private baseMatchCoins = 150;
  private baseDiamond = 100;
  private forgeSpendRate = 0; // Track spending
  private farmingDiamondMultiplier = 1.0;

  public calculateMatchCoins(
    difficulty: number,
    cleanPlayModifier: number,
    matchLengthMinutes: number,
    isFarmingWeakAI: boolean
  ): number {
    let difficultyMultiplier = difficulty;

    // Farming detection: gradually trend toward 1.0
    if (isFarmingWeakAI) {
      difficultyMultiplier *= 0.98; // Gradual reduction
    }

    const matchLengthFactor = Math.min(matchLengthMinutes / 90, 1.5);
    const coins =
      this.baseMatchCoins *
      difficultyMultiplier *
      cleanPlayModifier *
      matchLengthFactor;

    return Math.floor(coins);
  }

  public calculateDiamonds(
    performanceFactor: number,
    opponentRankGap: number,
    matchImportance: number,
    matchTime: number,
    scoreGap: number,
    isFriendly: boolean
  ): number {
    if (isFriendly) return 0;

    let diamonds = this.baseDiamond;

    // Performance bonus (0-50)
    const performanceBonus = performanceFactor * 50;
    diamonds += performanceBonus;

    // Rank gap adjustment
    let rankAdjustment = 0;
    if (opponentRankGap < 0) {
      // Defeating stronger opponent
      rankAdjustment = Math.min(Math.abs(opponentRankGap) / 1000, 20);
    }
    diamonds += rankAdjustment;

    // Match importance bonus
    let importanceBonus = 0;
    if (matchTime > 75 && scoreGap <= 1) {
      importanceBonus = matchImportance * 15;
    }
    diamonds += importanceBonus;

    // Apply anti-farm multiplier
    diamonds *= this.farmingDiamondMultiplier;

    // Clamp between 100 and 200
    return Math.floor(Math.max(100, Math.min(diamonds, 200)));
  }

  public updateFarmingMultiplier(
    matchDuration: number,
    inputVariance: number,
    actionDiversity: number,
    sessionLength: number
  ): void {
    // If suspicious behavior detected
    const suspiciousScore = this.calculateSuspiciousScore(
      matchDuration,
      inputVariance,
      actionDiversity,
      sessionLength
    );

    if (suspiciousScore > 0.7) {
      this.farmingDiamondMultiplier = Math.max(
        this.farmingDiamondMultiplier * 0.95,
        0.75
      );
    } else if (suspiciousScore < 0.3) {
      // Reset if behavior normalizes
      this.farmingDiamondMultiplier = Math.min(
        this.farmingDiamondMultiplier * 1.02,
        1.0
      );
    }
  }

  private calculateSuspiciousScore(
    matchDuration: number,
    inputVariance: number,
    actionDiversity: number,
    sessionLength: number
  ): number {
    let score = 0;

    // Very short matches (farming indicator)
    if (matchDuration < 30 * 60) score += 0.2;

    // Low input variance (repeating same actions)
    if (inputVariance < 0.3) score += 0.25;

    // Low action diversity
    if (actionDiversity < 0.4) score += 0.25;

    // Abnormally long sessions
    if (sessionLength > 6 * 60 * 60) score += 0.1;

    return Math.min(score, 1.0);
  }

  public trackForgeSpend(amount: number): void {
    this.forgeSpendRate += amount;
  }

  public getFarmingMultiplier(): number {
    return this.farmingDiamondMultiplier;
  }
}
