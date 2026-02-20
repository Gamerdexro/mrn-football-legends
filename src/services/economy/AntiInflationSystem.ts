// Anti-Inflation Auto-Correction System
// Dynamically adjusts economy parameters to maintain balance

export interface InflationMetrics {
  averageCoinsPerPlayer: number;
  averageDiamondsPerPlayer: number;
  forgeSpendRate: number;
  marketVelocity: number;
  timestamp: number;
}

export interface EconomyAdjustments {
  forgeCostMultiplier: number;
  premiumPackCostMultiplier: number;
  recyclerEfficiencyMultiplier: number;
}

export class AntiInflationSystem {
  private targetCoinRange = [50000, 80000]; // Per player average
  private targetDiamondRange = [2000, 3500]; // Per player average
  private adjustments: EconomyAdjustments = {
    forgeCostMultiplier: 1.0,
    premiumPackCostMultiplier: 1.0,
    recyclerEfficiencyMultiplier: 1.0,
  };
  private lastAdjustmentTime = Date.now();
  private adjustmentInterval = 24 * 60 * 60 * 1000; // 24 hours
  private weeklyCapMultiplier = 1.05; // Max 5% per week

  public evaluateAndAdjust(metrics: InflationMetrics): EconomyAdjustments {
    const now = Date.now();
    if (now - this.lastAdjustmentTime < this.adjustmentInterval) {
      return this.adjustments;
    }

    this.lastAdjustmentTime = now;

    // Coin evaluation
    if (metrics.averageCoinsPerPlayer > this.targetCoinRange[1]) {
      const excess =
        (metrics.averageCoinsPerPlayer - this.targetCoinRange[1]) /
        this.targetCoinRange[1];
      const adjustment = 1.0 + Math.min(excess * 0.02, 0.05); // Cap at 5%
      this.adjustments.forgeCostMultiplier = Math.min(
        this.adjustments.forgeCostMultiplier * adjustment,
        this.adjustments.forgeCostMultiplier * this.weeklyCapMultiplier
      );
    }

    // Diamond evaluation
    if (metrics.averageDiamondsPerPlayer > this.targetDiamondRange[1]) {
      const excess =
        (metrics.averageDiamondsPerPlayer - this.targetDiamondRange[1]) /
        this.targetDiamondRange[1];
      const adjustment = 1.0 + Math.min(excess * 0.02, 0.05);
      this.adjustments.premiumPackCostMultiplier = Math.min(
        this.adjustments.premiumPackCostMultiplier * adjustment,
        this.adjustments.premiumPackCostMultiplier * this.weeklyCapMultiplier
      );
      this.adjustments.recyclerEfficiencyMultiplier = Math.max(
        this.adjustments.recyclerEfficiencyMultiplier * (1 - excess * 0.01),
        0.95
      );
    }

    // Market velocity check
    if (metrics.marketVelocity > 0.8) {
      // High trading activity, slight adjustment
      this.adjustments.premiumPackCostMultiplier *= 1.01;
    }

    return this.adjustments;
  }

  public getForgeCostMultiplier(): number {
    return this.adjustments.forgeCostMultiplier;
  }

  public getPremiumPackCostMultiplier(): number {
    return this.adjustments.premiumPackCostMultiplier;
  }

  public getRecyclerEfficiencyMultiplier(): number {
    return this.adjustments.recyclerEfficiencyMultiplier;
  }

  public getAdjustments(): EconomyAdjustments {
    return this.adjustments;
  }

  public resetWeeklyIfNeeded(): void {
    // Optional: Reset adjustments weekly if economy stabilizes
    const targetCoins = (this.targetCoinRange[0] + this.targetCoinRange[1]) / 2;
    const targetDiamonds = (this.targetDiamondRange[0] + this.targetDiamondRange[1]) / 2;
    
    // Slow reversion to baseline if within range
    if (this.adjustments.forgeCostMultiplier > 1.0) {
      this.adjustments.forgeCostMultiplier = Math.max(
        this.adjustments.forgeCostMultiplier * 0.99,
        1.0
      );
    }
  }
}
