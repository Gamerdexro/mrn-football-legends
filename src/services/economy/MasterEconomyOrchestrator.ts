// Master Economy Orchestrator
// Coordinates all economy systems and ensures coherent ecosystem behavior

import { SeasonRewardSystem } from './SeasonRewardSystem';
import { PerformanceIndexScoreEngine, MatchPerformanceMetrics } from './PerformanceIndexScoreEngine';
import { EconomyEngine } from './EconomyEngine';
import { AntiInflationSystem, InflationMetrics } from './AntiInflationSystem';
import { MarketSelfCorrectionEngine } from './MarketSelfCorrectionEngine';
import { OfflineFirstSyncEngine, SyncPacket } from './OfflineFirstSyncEngine';
import { LongTermStabilityModel } from './LongTermStabilityModel';

export interface MatchRewardPackage {
  coins: number;
  diamonds: number;
  seasonProgress: number;
  marketAdjustments: { playerId: string; newValue: number }[];
}

export class MasterEconomyOrchestrator {
  private seasonSystem: SeasonRewardSystem;
  private pisEngine: PerformanceIndexScoreEngine;
  private economyEngine: EconomyEngine;
  private inflationSystem: AntiInflationSystem;
  private marketEngine: MarketSelfCorrectionEngine;
  private syncEngine: OfflineFirstSyncEngine;
  private stabilityModel: LongTermStabilityModel;

  constructor(playerRank: number, startDate?: number) {
    this.seasonSystem = new SeasonRewardSystem(playerRank);
    this.pisEngine = new PerformanceIndexScoreEngine();
    this.economyEngine = new EconomyEngine();
    this.inflationSystem = new AntiInflationSystem();
    this.marketEngine = new MarketSelfCorrectionEngine();
    this.syncEngine = new OfflineFirstSyncEngine();
    this.stabilityModel = new LongTermStabilityModel(startDate);

    // Load offline queue
    this.syncEngine.loadQueueFromLocalStorage();
  }

  // Main entry point: Process match completion
  public processMatchCompletion(
    matchMetrics: MatchPerformanceMetrics,
    playerRank: number,
    difficulty: number,
    isFarmingWeakAI: boolean,
    isFriendly: boolean
  ): MatchRewardPackage {
    const phase = this.stabilityModel.getCurrentPhase();

    // 1. Calculate PIS
    const pis = this.pisEngine.calculatePIS(matchMetrics);

    // 2. Add to season
    this.seasonSystem.addSeasonScore(pis);

    // 3. Calculate coins
    const cleanPlayModifier = this.pisEngine.evaluateCleanPlay(matchMetrics);
    const coins = this.economyEngine.calculateMatchCoins(
      difficulty * phase.resourceAvailability,
      cleanPlayModifier,
      matchMetrics.matchDuration / 60,
      isFarmingWeakAI
    );

    // 4. Calculate diamonds
    const opponentRankGap =
      (matchMetrics.opponentRank || 0) - playerRank;
    const diamonds = this.economyEngine.calculateDiamonds(
      (pis / 100) * 0.5, // Performance factor normalized
      opponentRankGap,
      matchMetrics.matchImportance,
      matchMetrics.matchDuration / 60,
      0, // scoreGap would be calculated
      isFriendly
    );

    // 5. Apply economy adjustments
    const adjustments = this.inflationSystem.getAdjustments();
    const adjustedCoins = Math.floor(coins * adjustments.forgeCostMultiplier);
    const adjustedDiamonds = Math.floor(
      diamonds * adjustments.premiumPackCostMultiplier
    );

    // 6. Update farming multiplier
    this.economyEngine.updateFarmingMultiplier(
      matchMetrics.matchDuration,
      0.5, // Would calculate input variance
      matchMetrics.skillDiversity,
      0 // Session length tracking
    );

    // 7. Queue sync packet
    this.syncEngine.queueAction('MATCH_RESULT', {
      matchMetrics,
      coins: adjustedCoins,
      diamonds: adjustedDiamonds,
      pis,
      timestamp: Date.now(),
    });

    // 8. Apply market corrections (if any players sold)
    const marketAdjustments: { playerId: string; newValue: number }[] = [];

    // 9. Return reward package
    return {
      coins: adjustedCoins,
      diamonds: adjustedDiamonds,
      seasonProgress: pis,
      marketAdjustments,
    };
  }

  // Sync all pending operations when online
  public async syncWhenOnline(isOnline: boolean): Promise<void> {
    if (!isOnline) return;

    const result = await this.syncEngine.syncPendingPackets(() => isOnline);
    console.log(`Synced: ${result.successful}, Failed: ${result.failed}`);
  }

  // Periodic economy evaluation (hourly or daily)
  public evaluateEconomyHealth(
    metrics: InflationMetrics
  ): {
    adjustments: any;
    phase: any;
    recommendations: string[];
  } {
    const adjustments = this.inflationSystem.evaluateAndAdjust(metrics);
    const phase = this.stabilityModel.getCurrentPhase();
    const health = this.stabilityModel.estimateCurrencyHealth();

    const recommendations: string[] = [];

    if (metrics.averageCoinsPerPlayer > 80000) {
      recommendations.push('Monitor coin inflation');
    }

    if (metrics.averageDiamondsPerPlayer < 1500) {
      recommendations.push('Diamond scarcity detected');
    }

    if (!this.stabilityModel.shouldSystemNotCollapse()) {
      recommendations.push('System stability at risk - Intervention needed');
    }

    return { adjustments, phase, recommendations };
  }

  // Get current season progress
  public getSeasonProgress(): {
    currentMilestone: number;
    progress: number;
    metadata: any;
  } {
    const nearest = this.seasonSystem.getNearestMilestone();
    return {
      currentMilestone: nearest.milestone.id,
      progress: nearest.progress,
      metadata: this.seasonSystem.getSeasonMetadata(),
    };
  }

  // Process player market sale
  public processPlayerSale(
    playerId: string,
    salePrice: number,
    buyerCoins: number
  ): { buyerCoins: number; newPlayerValue: number } {
    const result = this.marketEngine.processSale(
      playerId,
      salePrice,
      buyerCoins
    );

    this.syncEngine.queueAction('MARKET_TRANSACTION', {
      playerId,
      salePrice,
      newValue: result.decayedValue,
      timestamp: Date.now(),
    });

    return {
      buyerCoins: result.buyerCoins,
      newPlayerValue: result.decayedValue,
    };
  }

  // Get all pending sync packets (for debugging)
  public getPendingSync(): SyncPacket[] {
    return this.syncEngine.getPendingPackets();
  }

  getAdjustments() {
    return this.inflationSystem.getAdjustments();
  }
}
