// Game Economy Integration Service
// Bridges the economy orchestrator with the game and auth systems

import {
  MasterEconomyOrchestrator,
  MatchRewardPackage,
} from './MasterEconomyOrchestrator';
import type { MatchPerformanceMetrics } from './PerformanceIndexScoreEngine';

export class GameEconomyService {
  private orchestrator: MasterEconomyOrchestrator | null = null;
  private playerRank: number = 0;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncWhenOnline();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public initialize(playerRank: number, seasonStartDate?: number): void {
    this.playerRank = playerRank;
    this.orchestrator = new MasterEconomyOrchestrator(playerRank, seasonStartDate);
  }

  public processMatchEnd(
    matchMetrics: MatchPerformanceMetrics,
    difficulty: number,
    isFarmingWeakAI: boolean,
    isFriendly: boolean
  ): MatchRewardPackage | null {
    if (!this.orchestrator) {
      console.warn('Economy not initialized');
      return null;
    }

    return this.orchestrator.processMatchCompletion(
      matchMetrics,
      this.playerRank,
      difficulty,
      isFarmingWeakAI,
      isFriendly
    );
  }

  public async syncWhenOnline(): Promise<void> {
    if (!this.orchestrator) return;
    await this.orchestrator.syncWhenOnline(this.isOnline);
  }

  public getSeasonProgress() {
    if (!this.orchestrator) return null;
    return this.orchestrator.getSeasonProgress();
  }

  public evaluateEconomyHealth(metrics: any) {
    if (!this.orchestrator) return null;
    return this.orchestrator.evaluateEconomyHealth(metrics);
  }

  public processPlayerSale(
    playerId: string,
    salePrice: number,
    buyerCoins: number
  ) {
    if (!this.orchestrator) return null;
    return this.orchestrator.processPlayerSale(
      playerId,
      salePrice,
      buyerCoins
    );
  }

  public getPendingSync() {
    if (!this.orchestrator) return [];
    return this.orchestrator.getPendingSync();
  }

  public updateRank(newRank: number): void {
    this.playerRank = newRank;
    // Optionally reinitialize if rank changes significantly
  }
}

// Singleton instance
export const gameEconomyService = new GameEconomyService();
