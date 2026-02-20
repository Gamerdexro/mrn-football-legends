// Transfer Market Self-Correction Logic
// Maintains healthy market dynamics

export interface PlayerMarketListing {
  playerId: string;
  playerMarketValue: number;
  lastSaleTime: number;
  consecutiveTransactions: number;
}

export class MarketSelfCorrectionEngine {
  private playerListings: Map<string, PlayerMarketListing> = new Map();
  private baseDecayMultiplier = 0.97;
  private transactionDecayPercentage = 0.005; // 0.5% increase per transaction in short time

  public processSale(
    playerId: string,
    salePrice: number,
    buyerCoins: number
  ): {
    buyerCoins: number;
    decayedValue: number;
  } {
    // Inject coins to buyer
    const newBuyerCoins = buyerCoins + salePrice;

    // Apply decay to player market value
    let listing = this.playerListings.get(playerId) || {
      playerId,
      playerMarketValue: salePrice,
      lastSaleTime: Date.now(),
      consecutiveTransactions: 0,
    };

    // Calculate time since last sale
    const timeSinceLastSale = Date.now() - listing.lastSaleTime;
    const isShortTermFlip = timeSinceLastSale < 24 * 60 * 60 * 1000; // Within 24 hours

    let decayMultiplier = this.baseDecayMultiplier;

    // Increase decay if multiple transactions in short time
    if (isShortTermFlip) {
      listing.consecutiveTransactions++;
      decayMultiplier -=
        listing.consecutiveTransactions * this.transactionDecayPercentage;
      decayMultiplier = Math.max(decayMultiplier, 0.93); // Floor decay
    } else {
      // Reset transaction counter if enough time has passed
      listing.consecutiveTransactions = 0;
    }

    // Apply decay
    const decayedValue = Math.floor(listing.playerMarketValue * decayMultiplier);

    // Update listing
    listing.playerMarketValue = decayedValue;
    listing.lastSaleTime = Date.now();
    this.playerListings.set(playerId, listing);

    return {
      buyerCoins: newBuyerCoins,
      decayedValue: decayedValue,
    };
  }

  public getPlayerMarketValue(playerId: string): number {
    const listing = this.playerListings.get(playerId);
    return listing ? listing.playerMarketValue : 0;
  }

  public applyNaturalDecay(): void {
    // Called periodically (e.g., hourly) to apply general market decay
    const now = Date.now();
    for (const [_, listing] of this.playerListings) {
      const hoursSinceUpdate = (now - listing.lastSaleTime) / (60 * 60 * 1000);

      // Gentle decay for unstabled players
      if (hoursSinceUpdate > 1) {
        listing.playerMarketValue = Math.floor(
          listing.playerMarketValue * 0.9999
        );
      }
    }
  }

  public getMarketHealth(): {
    avgDecay: number;
    transactionVolume: number;
    healthScore: number;
  } {
    if (this.playerListings.size === 0) {
      return { avgDecay: 0, transactionVolume: 0, healthScore: 1.0 };
    }

    let totalDecay = 0;
    let totalTransactions = 0;

    for (const [_, listing] of this.playerListings) {
      totalDecay += 1 - this.baseDecayMultiplier;
      totalTransactions += listing.consecutiveTransactions;
    }

    const avgDecay = totalDecay / this.playerListings.size;
    const avgTransactions = totalTransactions / this.playerListings.size;

    // Health score: 1.0 is perfect, decreases with high activity
    const healthScore = Math.max(1.0 - avgTransactions * 0.05, 0.7);

    return {
      avgDecay,
      transactionVolume: avgTransactions,
      healthScore,
    };
  }
}
