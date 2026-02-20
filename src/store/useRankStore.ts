import { create } from 'zustand';

type RankTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'ELITE' | 'LEGEND';

type DivisionId = 1 | 2 | 3 | 4 | 5;

type MatchResult = 'WIN' | 'DRAW' | 'LOSS';

interface RankSnapshot {
    tier: RankTier;
    division: DivisionId;
    points: number;
}

interface RankState {
    accountLevel: number;
    accountXp: number;
    seasonId: string;
    tier: RankTier;
    division: DivisionId;
    points: number;
    vsAttackPoints: number;
    lastChange: number;
    lastSnapshot: RankSnapshot | null;
    promotionStatus: 'NONE' | 'PENDING_MATCH' | 'IN_MATCH'; // PENDING_MATCH: Reached points, needs to play. IN_MATCH: Currently playing decisive game (handled in UI context mostly, but state helps)
    relegationProtection: number; // Matches remaining
    addAccountXp: (amount: number) => void;
    applyMatchResult: (payload: {
        mode: 'KICKOFF' | 'RIVALS_H2H' | 'VS_ATTACK';
        result: MatchResult;
        performanceScore: number;
        expectedScore: number;
        opponentTier?: RankTier;
        opponentDivision?: DivisionId;
        fairPlayScore?: number;
    }) => void;
    applySeasonReset: (seasonId: string) => void;
}

const getTierIndex = (tier: RankTier): number => {
    switch (tier) {
        case 'BRONZE':
            return 0;
        case 'SILVER':
            return 1;
        case 'GOLD':
            return 2;
        case 'ELITE':
            return 3;
        case 'LEGEND':
            return 4;
        default:
            return 0;
    }
};

const getTierFromIndex = (index: number): RankTier => {
    if (index <= 0) return 'BRONZE';
    if (index === 1) return 'SILVER';
    if (index === 2) return 'GOLD';
    if (index === 3) return 'ELITE';
    return 'LEGEND';
};

const MAX_DIVISION: DivisionId = 5;
const DIVISION_POINTS = 100;
const RELEGATION_PROTECTION_MATCHES = 3;

export const useRankStore = create<RankState>((set) => ({
    accountLevel: 1,
    accountXp: 0,
    seasonId: 'S1',
    tier: 'BRONZE',
    division: 5,
    points: 0,
    vsAttackPoints: 0,
    lastChange: 0,
    lastSnapshot: null,
    promotionStatus: 'NONE',
    relegationProtection: 0,
    addAccountXp: (amount) =>
        set((state) => {
            const rawXp = state.accountXp + Math.max(0, amount);
            const levelSize = 100;
            let level = state.accountLevel;
            let xp = rawXp;
            while (xp >= levelSize) {
                xp -= levelSize;
                level += 1;
            }
            return {
                accountLevel: level,
                accountXp: xp
            };
        }),
    applyMatchResult: (payload) =>
        set((state) => {
            const isVsAttack = payload.mode === 'VS_ATTACK';

            // 1. Dual Progression: Account Level handled separately via addAccountXp call in GameScene.
            // This function focuses on Competitive Rank.

            // 7. Final Rank Resolution Function: Blending Logic
            
            // Base Result
            let baseDelta = 0;
            if (!isVsAttack) {
                if (payload.result === 'WIN') baseDelta = 25; // Strong push
                else if (payload.result === 'DRAW') baseDelta = 5; // Minor progress
                else baseDelta = -15; // Softened loss
            } else {
                // 9. VS Attack Ranking: Efficiency Focus
                if (payload.result === 'WIN') baseDelta = 20;
                else if (payload.result === 'DRAW') baseDelta = 5;
                else baseDelta = -10;
            }

            // 4. Decision-Based Performance (Core Skill Engine) influence
            const perfDiffRaw = payload.performanceScore - payload.expectedScore; 
            const perfClamp = Math.max(-0.5, Math.min(0.5, perfDiffRaw));
            // Performance can swing result by +/- 15 points
            const perfBonus = Math.round(perfClamp * 30); 

            // 6. Fair Play & Anti-Abuse
            let fair = payload.fairPlayScore;
            if (typeof fair !== 'number') fair = 1;
            if (fair < 0) fair = 0;
            if (fair > 1.2) fair = 1.2;
            
            // Fair play acts as a multiplier. Abuse reduces gains significantly.
            // 0.5 score -> 50% points. 1.0 -> 100%.
            // "Repeated abuse slowly reduces rank rewards"
            
            // 5. Opponent Strength Adjustment
            let difficultyBonus = 0;
            if (!isVsAttack && payload.opponentTier && payload.opponentDivision) {
                const selfTierIndex = getTierIndex(state.tier);
                const oppTierIndex = getTierIndex(payload.opponentTier);
                const tierGap = oppTierIndex - selfTierIndex;
                // Lower div number is better? Usually Div 1 is best.
                // Assuming Div 1 is top, Div 5 is bottom.
                // If I am Div 5, Opponent Div 1 -> Stronger. 
                // Gap = 1 - 5 = -4. Wait.
                // Let's standardise: Rank Score = TierIndex * 1000 + (5 - Division) * 100 + Points.
                // Simplified relative calculation:
                // If opponent is Higher Tier: Bonus for Win, Reduced Penalty for Loss.
                
                // Let's use simple Tier comparison for now
                if (tierGap > 0) {
                    // Stronger opponent
                    if (payload.result === 'WIN') difficultyBonus += 10;
                    if (payload.result === 'LOSS') difficultyBonus += 5; // Mitigate loss
                } else if (tierGap < 0) {
                    // Weaker opponent
                    if (payload.result === 'WIN') difficultyBonus -= 5; // Less gain
                    if (payload.result === 'LOSS') difficultyBonus -= 10; // Punish loss to weaker
                }
            }

            // Calculate Final Delta
            let totalDelta = (baseDelta + perfBonus + difficultyBonus) * fair;
            totalDelta = Math.round(totalDelta);

            // 8. Promotion & Relegation Logic
            let nextTier = state.tier;
            let nextDivision = state.division;
            let nextPoints = state.points;
            let nextVsAttackPoints = state.vsAttackPoints;
            let nextPromotionStatus = state.promotionStatus;
            let nextRelegationProtection = state.relegationProtection;

            const snapshot: RankSnapshot = {
                tier: state.tier,
                division: state.division,
                points: state.points
            };

            if (!isVsAttack) {
                // Handling Promotion Match
                if (state.promotionStatus === 'PENDING_MATCH') {
                    if (payload.result === 'WIN') {
                        // Promotion Successful!
                        nextPoints = 10; // Start with buffer
                        // Move up tier/division
                        if (nextDivision > 1) {
                            nextDivision = (nextDivision - 1) as DivisionId;
                        } else {
                            let tIndex = getTierIndex(nextTier);
                            if (tIndex < 4) {
                                nextTier = getTierFromIndex(tIndex + 1);
                                nextDivision = MAX_DIVISION;
                            }
                        }
                        nextPromotionStatus = 'NONE';
                        nextRelegationProtection = RELEGATION_PROTECTION_MATCHES;
                    } else if (payload.result === 'LOSS') {
                        // Promotion Failed
                        nextPoints = 80; // Drop back a bit
                        nextPromotionStatus = 'NONE';
                    } else {
                         // Draw - Retain chance? Or slight penalty? 
                         // "Promotion requires ... winning a decisive match"
                         // Let's say Draw keeps you there but maybe slight point drop if we were tracking series points.
                         // Simple version: Draw = Try Again.
                    }
                } else {
                    // Normal Progression
                    nextPoints += totalDelta;
                    
                    // Cap points at 100 for Promotion Check
                    if (nextPoints >= DIVISION_POINTS) {
                         nextPoints = DIVISION_POINTS;
                         nextPromotionStatus = 'PENDING_MATCH';
                    } else {
                        nextPromotionStatus = 'NONE';
                    }

                    // Relegation Check
                    if (nextPoints < 0) {
                        if (nextRelegationProtection > 0) {
                            // Protected
                            nextPoints = 0;
                            nextRelegationProtection -= 1;
                        } else {
                            // Relegate
                            if (nextDivision < MAX_DIVISION) {
                                nextDivision = (nextDivision + 1) as DivisionId;
                                nextPoints = 50; // Reset to mid
                            } else {
                                let tIndex = getTierIndex(nextTier);
                                if (tIndex > 0) {
                                    nextTier = getTierFromIndex(tIndex - 1);
                                    nextDivision = 1;
                                    nextPoints = 50;
                                } else {
                                    nextPoints = 0; // Floor at Bronze 5
                                }
                            }
                        }
                    } else {
                        // If points > 0, decrement protection if it exists? 
                        // Usually protection is for N matches after promotion.
                        if (nextRelegationProtection > 0) nextRelegationProtection -= 1;
                    }
                }
            } else {
                // VS Attack Logic (Simplified for now)
                nextVsAttackPoints += totalDelta;
                if (nextVsAttackPoints < 0) nextVsAttackPoints = 0;
            }

            return {
                tier: nextTier,
                division: nextDivision,
                points: nextPoints,
                vsAttackPoints: nextVsAttackPoints,
                lastChange: totalDelta,
                lastSnapshot: snapshot,
                promotionStatus: nextPromotionStatus as any,
                relegationProtection: nextRelegationProtection
            };
        }),
    applySeasonReset: (seasonId) =>
        set((state) => {
            const tierIndex = getTierIndex(state.tier);
            const reducedTierIndex = Math.max(0, tierIndex - 1);
            const preservedDivision: DivisionId = state.division === 1 ? 2 : state.division;
            return {
                seasonId,
                tier: getTierFromIndex(reducedTierIndex),
                division: preservedDivision,
                points: 0
            };
        })
}));
