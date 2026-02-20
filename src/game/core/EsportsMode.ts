import { Vector3 } from 'three';
import { PlayerState, MatchState } from '../types/MatchEngineTypes';

interface MMRData {
  rating: number;
  volatility: number;
  wins: number;
  losses: number;
  streak: number;
  lastUpdated: Date;
  performanceHistory: number[];
}

interface RankTier {
  tier: string;
  division: number;
  minMMR: number;
  maxMMR: number;
  promotionBuffer: number;
  relegationBuffer: number;
}

interface MatchResult {
  playerId: string;
  opponentMMR: number;
  expectedOutcome: number;
  actualOutcome: number;
  performanceScore: number;
  timestamp: Date;
  matchId: string;
}

interface TournamentBracket {
  id: string;
  participants: string[];
  currentRound: number;
  pairings: Array<{ player1: string; player2: string; result?: number }>;
  swissScore: Map<string, number>;
}

export class EsportsMode {
  private playerMMR: Map<string, MMRData> = new Map();
  private rankTiers: RankTier[] = [];
  private matchHistory: Map<string, MatchResult[]> = new Map();
  private activeTournaments: Map<string, TournamentBracket> = new Map();
  private antiSmurfData: Map<string, { newAccountPenalty: number; behaviorScore: number }> = new Map();
  
  // Elo constants
  private readonly K_FACTOR_BASE = 32;
  private readonly PERFORMANCE_WEIGHT = 0.15; // Performance modifier weight
  private readonly VOLATILITY_DECAY = 0.95;
  private readonly STREAK_BONUS = 1.2;

  constructor() {
    this.initializeRankTiers();
  }

  private initializeRankTiers(): void {
    this.rankTiers = [
      { tier: 'Bronze', division: 3, minMMR: 0, maxMMR: 400, promotionBuffer: 50, relegationBuffer: 50 },
      { tier: 'Bronze', division: 2, minMMR: 400, maxMMR: 800, promotionBuffer: 50, relegationBuffer: 50 },
      { tier: 'Bronze', division: 1, minMMR: 800, maxMMR: 1200, promotionBuffer: 50, relegationBuffer: 50 },
      { tier: 'Silver', division: 3, minMMR: 1200, maxMMR: 1600, promotionBuffer: 75, relegationBuffer: 75 },
      { tier: 'Silver', division: 2, minMMR: 1600, maxMMR: 2000, promotionBuffer: 75, relegationBuffer: 75 },
      { tier: 'Silver', division: 1, minMMR: 2000, maxMMR: 2400, promotionBuffer: 75, relegationBuffer: 75 },
      { tier: 'Gold', division: 3, minMMR: 2400, maxMMR: 2800, promotionBuffer: 100, relegationBuffer: 100 },
      { tier: 'Gold', division: 2, minMMR: 2800, maxMMR: 3200, promotionBuffer: 100, relegationBuffer: 100 },
      { tier: 'Gold', division: 1, minMMR: 3200, maxMMR: 3600, promotionBuffer: 100, relegationBuffer: 100 },
      { tier: 'Platinum', division: 3, minMMR: 3600, maxMMR: 4000, promotionBuffer: 150, relegationBuffer: 150 },
      { tier: 'Platinum', division: 2, minMMR: 4000, maxMMR: 4400, promotionBuffer: 150, relegationBuffer: 150 },
      { tier: 'Platinum', division: 1, minMMR: 4400, maxMMR: 4800, promotionBuffer: 150, relegationBuffer: 150 },
      { tier: 'Diamond', division: 3, minMMR: 4800, maxMMR: 5200, promotionBuffer: 200, relegationBuffer: 200 },
      { tier: 'Diamond', division: 2, minMMR: 5200, maxMMR: 5600, promotionBuffer: 200, relegationBuffer: 200 },
      { tier: 'Diamond', division: 1, minMMR: 5600, maxMMR: 6000, promotionBuffer: 200, relegationBuffer: 200 },
      { tier: 'Master', division: 1, minMMR: 6000, maxMMR: 9999, promotionBuffer: 0, relegationBuffer: 0 }
    ];
  }

  public updateMMR(playerId: string, opponentId: string, won: boolean, performanceScore: number): void {
    let playerData = this.playerMMR.get(playerId);
    let opponentData = this.playerMMR.get(opponentId);

    if (!playerData) {
      playerData = this.createInitialMMR(playerId);
      this.playerMMR.set(playerId, playerData);
    }

    if (!opponentData) {
      opponentData = this.createInitialMMR(opponentId);
      this.playerMMR.set(opponentId, opponentData);
    }

    // Calculate expected outcome using Elo formula
    const expectedOutcome = 1 / (1 + Math.pow(10, (opponentData.rating - playerData.rating) / 400));
    const actualOutcome = won ? 1 : 0;

    // Calculate K-factor based on volatility and streak
    let kFactor = this.K_FACTOR_BASE;
    
    // Adjust for new accounts (anti-smurf)
    const antiSmurfData = this.antiSmurfData.get(playerId);
    if (antiSmurfData && antiSmurfData.newAccountPenalty > 0) {
      kFactor *= (1 - antiSmurfData.newAccountPenalty);
    }

    // Adjust for streak
    if (playerData.streak >= 3) {
      kFactor *= this.STREAK_BONUS;
    }

    // Apply performance modifier
    const performanceModifier = 1 + (performanceScore - 0.5) * this.PERFORMANCE_WEIGHT;
    kFactor *= performanceModifier;

    // Calculate rating change
    const ratingChange = kFactor * (actualOutcome - expectedOutcome);
    playerData.rating += ratingChange;
    playerData.volatility = Math.min(100, playerData.volatility * this.VOLATILITY_DECAY + Math.abs(ratingChange) * 0.1);

    // Update stats
    if (won) {
      playerData.wins++;
      playerData.streak = Math.max(0, playerData.streak) + 1;
    } else {
      playerData.losses++;
      playerData.streak = Math.min(0, playerData.streak) - 1;
    }

    playerData.lastUpdated = new Date();
    playerData.performanceHistory.push(performanceScore);

    // Keep performance history limited
    if (playerData.performanceHistory.length > 20) {
      playerData.performanceHistory.shift();
    }

    // Record match result
    this.recordMatchResult(playerId, opponentId, expectedOutcome, actualOutcome, performanceScore);

    // Update anti-smurf detection
    this.updateAntiSmurfData(playerId, won, performanceScore);
  }

  private createInitialMMR(playerId: string): MMRData {
    return {
      rating: 1500, // Starting MMR
      volatility: 50,
      wins: 0,
      losses: 0,
      streak: 0,
      lastUpdated: new Date(),
      performanceHistory: []
    };
  }

  private recordMatchResult(playerId: string, opponentId: string, expected: number, actual: number, performance: number): void {
    if (!this.matchHistory.has(playerId)) {
      this.matchHistory.set(playerId, []);
    }

    const history = this.matchHistory.get(playerId)!;
    history.push({
      playerId,
      opponentMMR: this.playerMMR.get(opponentId)?.rating || 1500,
      expectedOutcome: expected,
      actualOutcome: actual,
      performanceScore: performance,
      timestamp: new Date(),
      matchId: `match_${Date.now()}_${Math.random()}`
    });

    // Keep history limited
    if (history.length > 100) {
      history.shift();
    }
  }

  private updateAntiSmurfData(playerId: string, won: boolean, performanceScore: number): void {
    let data = this.antiSmurfData.get(playerId);
    
    if (!data) {
      data = { newAccountPenalty: 0.5, behaviorScore: 0.5 };
      this.antiSmurfData.set(playerId, data);
    }

    // Reduce new account penalty over time
    const playerData = this.playerMMR.get(playerId);
    if (playerData && (playerData.wins + playerData.losses) > 20) {
      data.newAccountPenalty = Math.max(0, data.newAccountPenalty - 0.05);
    }

    // Update behavior score based on performance consistency
    data.behaviorScore = data.behaviorScore * 0.9 + performanceScore * 0.1;

    // Detect abnormal win streak volatility
    if (won && playerData && playerData.streak > 5 && data.behaviorScore > 0.8) {
      // Flag for review
      data.newAccountPenalty = Math.min(0.8, data.newAccountPenalty + 0.1);
    }
  }

  public getCurrentRank(playerId: string): RankTier | null {
    const mmrData = this.playerMMR.get(playerId);
    if (!mmrData) return null;

    for (const tier of this.rankTiers) {
      if (mmrData.rating >= tier.minMMR && mmrData.rating < tier.maxMMR) {
        return tier;
      }
    }

    return this.rankTiers[this.rankTiers.length - 1]; // Master tier
  }

  public getPromotionStatus(playerId: string): { canPromote: boolean; canRelegate: boolean; buffer: number } {
    const mmrData = this.playerMMR.get(playerId);
    const currentRank = this.getCurrentRank(playerId);
    
    if (!mmrData || !currentRank) return { canPromote: false, canRelegate: false, buffer: 0 };

    const mmr = mmrData.rating;
    const canPromote = mmr >= currentRank.maxMMR - currentRank.promotionBuffer;
    const canRelegate = mmr <= currentRank.minMMR + currentRank.relegationBuffer;
    const buffer = canPromote ? 
      (mmr - (currentRank.maxMMR - currentRank.promotionBuffer)) / currentRank.promotionBuffer :
      (mmr - (currentRank.minMMR + currentRank.relegationBuffer)) / currentRank.relegationBuffer;

    return { canPromote, canRelegate, buffer };
  }

  public findMatch(playerId: string): string | null {
    const playerMMRData = this.playerMMR.get(playerId);
    if (!playerMMRData) return null;

    // Find opponent with closest MMR (within ±200)
    let bestMatch: string | null = null;
    let smallestDiff = Infinity;

    for (const [candidateId, candidateData] of this.playerMMR.entries()) {
      if (candidateId === playerId) continue;

      const mmrDiff = Math.abs(playerMMRData.rating - candidateData.rating);
      if (mmrDiff < smallestDiff && mmrDiff <= 200) {
        smallestDiff = mmrDiff;
        bestMatch = candidateId;
      }
    }

    return bestMatch;
  }

  public createTournament(playerIds: string[]): TournamentBracket {
    const tournamentId = `tournament_${Date.now()}`;
    const bracket: TournamentBracket = {
      id: tournamentId,
      participants: [...playerIds],
      currentRound: 1,
      pairings: [],
      swissScore: new Map()
    };

    // Initialize Swiss scores
    playerIds.forEach(id => bracket.swissScore.set(id, 0));

    // Generate initial pairings using Swiss system
    this.generateSwissPairings(bracket);

    this.activeTournaments.set(tournamentId, bracket);
    return bracket;
  }

  private generateSwissPairings(bracket: TournamentBracket): void {
    const participants = [...bracket.participants];
    
    // Sort by Swiss score
    participants.sort((a, b) => {
      const scoreA = bracket.swissScore.get(a) || 0;
      const scoreB = bracket.swissScore.get(b) || 0;
      return scoreB - scoreA;
    });

    // Pair players with similar scores
    const pairings: Array<{ player1: string; player2: string }> = [];
    
    for (let i = 0; i < participants.length - 1; i += 2) {
      if (i + 1 < participants.length) {
        pairings.push({
          player1: participants[i],
          player2: participants[i + 1]
        });
      }
    }

    bracket.pairings = pairings;
  }

  public updateTournamentResult(tournamentId: string, player1: string, player2: string, result: number): void {
    const bracket = this.activeTournaments.get(tournamentId);
    if (!bracket) return;

    // Update pairing result
    const pairing = bracket.pairings.find(p => 
      (p.player1 === player1 && p.player2 === player2) ||
      (p.player1 === player2 && p.player2 === player1)
    );

    if (pairing) {
      pairing.result = result;
    }

    // Update Swiss scores
    if (result === 1) { // Player 1 won
      bracket.swissScore.set(player1, (bracket.swissScore.get(player1) || 0) + 1);
    } else if (result === 2) { // Player 2 won
      bracket.swissScore.set(player2, (bracket.swissScore.get(player2) || 0) + 1);
    }

    // Check if round is complete
    const completedPairings = bracket.pairings.filter(p => p.result !== undefined).length;
    if (completedPairings === bracket.pairings.length) {
      bracket.currentRound++;
      if (bracket.currentRound <= 5) { // Max 5 rounds
        this.generateSwissPairings(bracket);
      }
    }
  }

  public getTournamentStandings(tournamentId: string): Array<{ playerId: string; score: number; rank: number }> {
    const bracket = this.activeTournaments.get(tournamentId);
    if (!bracket) return [];

    const standings = Array.from(bracket.swissScore.entries())
      .map(([playerId, score]) => ({ playerId, score, rank: 0 }))
      .sort((a, b) => b.score - a.score);

    // Assign ranks
    standings.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return standings;
  }

  public getMMR(playerId: string): number | null {
    const data = this.playerMMR.get(playerId);
    return data ? data.rating : null;
  }

  public getMatchHistory(playerId: string, limit: number = 10): MatchResult[] {
    const history = this.matchHistory.get(playerId) || [];
    return history.slice(-limit);
  }

  public applySeasonalDecay(playerId: string): void {
    const data = this.playerMMR.get(playerId);
    if (!data) return;

    // Soft reset with decay
    data.rating = data.rating * 0.75 + 1500 * 0.25; // 25% decay
    data.volatility = Math.min(100, data.volatility + 20);
    data.wins = 0;
    data.losses = 0;
    data.streak = 0;
  }

  public getCompetitiveStats(playerId: string): {
    winRate: number;
    averagePerformance: number;
    currentStreak: number;
    rank: RankTier | null;
  } | null {
    const data = this.playerMMR.get(playerId);
    if (!data) return null;

    const totalMatches = data.wins + data.losses;
    const winRate = totalMatches > 0 ? data.wins / totalMatches : 0;
    const averagePerformance = data.performanceHistory.length > 0 ?
      data.performanceHistory.reduce((sum, p) => sum + p, 0) / data.performanceHistory.length : 0.5;

    return {
      winRate,
      averagePerformance,
      currentStreak: data.streak,
      rank: this.getCurrentRank(playerId)
    };
  }

  public dispose(): void {
    this.playerMMR.clear();
    this.matchHistory.clear();
    this.activeTournaments.clear();
    this.antiSmurfData.clear();
  }
}
