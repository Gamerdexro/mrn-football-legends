import { UserProfile } from '../../types/user';
import playersData from '../../data/players.json';

export interface PackConfig {
    id: string;
    name: string;
    cost: number;
    currency: 'Gems' | 'Coins';
    cardCount: number;
    minOvr: number;
    maxOvr: number;
    guarantees: {
        minRarity: Rarity;
        count: number;
    }[];
    probabilities: {
        [key in Rarity]?: number;
    };
}

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Premium' | 'Premium Legend';

export interface PackResult {
    success: boolean;
    rewards: any[];
    costDeduced: number;
    currencyType: 'Gems' | 'Coins';
    transactionId: string;
    error?: string;
}

export const PREMIUM_PACK_01: PackConfig = {
    id: 'PREMIUM_01',
    name: 'Premium Pack',
    cost: 500,
    currency: 'Gems',
    cardCount: 5,
    minOvr: 75,
    maxOvr: 95,
    guarantees: [
        { minRarity: 'Rare', count: 1 }
    ],
    probabilities: {
        Common: 55,
        Rare: 30,
        Epic: 10,
        Legendary: 4,
        'Premium Legend': 1
    }
};

type PackLuckState = {
    unluckyOpens: number;
    lastHighRarityAt?: number;
};

type LockedPackResult = {
    transactionId: string;
    packId: string;
    rewards: string[];
    currencyType: 'Gems' | 'Coins';
    costDeduced: number;
    createdAt: number;
};

const PACK_LUCK_KEY_PREFIX = 'mrn_pack_luck_';
const PACK_PENDING_KEY_PREFIX = 'mrn_pack_pending_';

export class PackService {

    private static getLuckKey(user: UserProfile, packId: string): string {
        return `${PACK_LUCK_KEY_PREFIX}${user.uid}_${packId}`;
    }

    private static getPendingKey(user: UserProfile): string {
        return `${PACK_PENDING_KEY_PREFIX}${user.uid}`;
    }

    private static loadLuckState(user: UserProfile, packId: string): PackLuckState {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return { unluckyOpens: 0 };
        }
        try {
            const raw = localStorage.getItem(this.getLuckKey(user, packId));
            if (!raw) {
                return { unluckyOpens: 0 };
            }
            const parsed = JSON.parse(raw) as PackLuckState;
            if (!parsed || typeof parsed.unluckyOpens !== 'number') {
                return { unluckyOpens: 0 };
            }
            return parsed;
        } catch {
            return { unluckyOpens: 0 };
        }
    }

    private static saveLuckState(user: UserProfile, packId: string, state: PackLuckState): void {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.getLuckKey(user, packId), JSON.stringify(state));
        } catch {
        }
    }

    static getForgeValueForPlayerId(playerId: string): number {
        const players = playersData as any[];
        const found = players.find(p => p.id === playerId);
        if (!found || !found.rarity) {
            return 2;
        }
        const rarity = String(found.rarity);
        if (rarity === 'Common' || rarity === 'Standard') return 2;
        if (rarity === 'Rare') return 4;
        if (rarity === 'Epic') return 8;
        if (rarity === 'Legendary') return 12;
        return 16;
    }

    private static loadPendingResults(user: UserProfile): LockedPackResult[] {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return [];
        }
        try {
            const raw = localStorage.getItem(this.getPendingKey(user));
            if (!raw) {
                return [];
            }
            const parsed = JSON.parse(raw) as LockedPackResult[];
            if (!Array.isArray(parsed)) {
                return [];
            }
            return parsed;
        } catch {
            return [];
        }
    }

    private static savePendingResults(user: UserProfile, results: LockedPackResult[]): void {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.getPendingKey(user), JSON.stringify(results));
        } catch {
        }
    }

    private static addPendingResult(user: UserProfile, payload: LockedPackResult): void {
        const current = this.loadPendingResults(user);
        const next = [...current, payload].slice(-20);
        this.savePendingResults(user, next);
    }

    static clearPendingResult(user: UserProfile, transactionId: string): void {
        const current = this.loadPendingResults(user);
        if (!current.length) {
            return;
        }
        const next = current.filter(r => r.transactionId !== transactionId);
        this.savePendingResults(user, next);
    }

    static applyPendingResultsOnBoot(user: UserProfile): UserProfile {
        const pending = this.loadPendingResults(user);
        if (!pending.length) {
            return user;
        }
        let updated = { ...user };
        let coins = updated.coins || 0;
        let diamonds = updated.diamonds || 0;
        let forgeMaterials = updated.forgeMaterials || 0;
        const forgeState = updated.forgeState || {};
        const squad = [...updated.squad];

        for (const result of pending) {
            if (result.currencyType === 'Gems') {
                diamonds = Math.max(0, diamonds - result.costDeduced);
            } else {
                coins = Math.max(0, coins - result.costDeduced);
            }
            for (const playerId of result.rewards) {
                if (squad.includes(playerId)) {
                    forgeMaterials += this.getForgeValueForPlayerId(playerId);
                } else {
                    squad.push(playerId);
                }
            }
        }

        updated = {
            ...updated,
            coins,
            diamonds,
            forgeMaterials,
            forgeState,
            squad
        };

        this.savePendingResults(user, []);
        return updated;
    }

    private static getDynamicProbabilities(base: PackConfig['probabilities'], luck: PackLuckState): PackConfig['probabilities'] {
        const streak = Math.min(Math.max(luck.unluckyOpens || 0, 0), 8);
        if (streak <= 0) {
            return base;
        }
        const order: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Premium', 'Premium Legend'];
        const working: { [key in Rarity]?: number } = {};
        order.forEach(r => {
            const value = base[r];
            if (typeof value === 'number') {
                working[r] = value;
            }
        });
        const boostEpic = 0.8 * streak;
        const boostLegendary = 0.45 * streak;
        const boostPremiumLegend = 0.25 * streak;
        const totalBoost = boostEpic + boostLegendary + boostPremiumLegend;
        const commonBase = working.Common || 0;
        const rareBase = working.Rare || 0;
        let commonPenalty = Math.min(commonBase - 5, totalBoost * 0.7);
        if (commonPenalty < 0) {
            commonPenalty = 0;
        }
        let rarePenalty = totalBoost - commonPenalty;
        const maxRarePenalty = Math.max(0, rareBase - 5);
        if (rarePenalty > maxRarePenalty) {
            rarePenalty = maxRarePenalty;
        }
        working.Common = commonBase - commonPenalty;
        working.Rare = rareBase - rarePenalty;
        working.Epic = (working.Epic || 0) + boostEpic;
        working.Legendary = (working.Legendary || 0) + boostLegendary;
        working['Premium Legend'] = (working['Premium Legend'] || 0) + boostPremiumLegend;
        let sum = 0;
        order.forEach(r => {
            sum += working[r] || 0;
        });
        if (sum <= 0) {
            return base;
        }
        const normalized: { [key in Rarity]?: number } = {};
        order.forEach(r => {
            const value = working[r];
            if (typeof value === 'number' && value > 0) {
                normalized[r] = (value / sum) * 100;
            }
        });
        return normalized;
    }

    private static getSeededRandom(seed: string): number {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        const x = Math.sin(hash) * 10000;
        return x - Math.floor(x);
    }

    static openPack(user: UserProfile, packId: string): PackResult {
        const config = packId === 'PREMIUM_01' ? PREMIUM_PACK_01 : null;
        
        if (!config) {
            return { success: false, rewards: [], costDeduced: 0, currencyType: 'Coins', transactionId: '', error: 'Invalid Pack ID' };
        }

        const userGems = user.gems || user.diamonds || 0;
        if (config.currency === 'Gems' && userGems < config.cost) {
             return { success: false, rewards: [], costDeduced: 0, currencyType: 'Gems', transactionId: '', error: 'Insufficient Gems' };
        }
        // Add Coin check if needed

        const timestamp = Date.now();
        const transactionId = `${user.uid}_${packId}_${timestamp}`;
        const seedBase = `${user.uid}_${timestamp}_${packId}`;

        const rewards: any[] = [];
        const pool = (playersData as any[]).filter(p => 
            p.ovr >= config.minOvr && p.ovr <= config.maxOvr
        );

        const luckState = this.loadLuckState(user, packId);

        const pickByRarity = (targetRarity: Rarity | string, iterSeed: string): any => {
            let candidates = pool;
            if (targetRarity !== 'ANY') {
                 const rarityValue = (r: string) => {
                     if (r === 'Common') return 1;
                     if (r === 'Rare') return 2;
                     if (r === 'Epic') return 3;
                     if (r === 'Legendary') return 4;
                     if (r === 'Premium') return 5;
                     if (r === 'Premium Legend') return 6;
                     return 0;
                 };
                 const targetVal = rarityValue(targetRarity);
                 candidates = pool.filter(p => rarityValue(p.rarity) >= targetVal);
            }

            if (candidates.length === 0) return pool[0];

            const rng = this.getSeededRandom(iterSeed);
            const index = Math.floor(rng * candidates.length);
            return candidates[index];
        };

        const rollRarity = (iterSeed: string): Rarity => {
            const dynamicProbabilities = this.getDynamicProbabilities(config.probabilities, luckState);
            const rng = this.getSeededRandom(iterSeed + '_rarity');
            const p = dynamicProbabilities;
            let sum = 0;
            
            if (rng < (sum += (p.Common || 0) / 100)) return 'Common';
            if (rng < (sum += (p.Rare || 0) / 100)) return 'Rare';
            if (rng < (sum += (p.Epic || 0) / 100)) return 'Epic';
            if (rng < (sum += (p.Legendary || 0) / 100)) return 'Legendary';
            return 'Premium Legend';
        };

        for (let i = 0; i < config.cardCount; i++) {
            const cardSeed = `${seedBase}_card_${i}`;
            
            let selectedPlayer;

            if (i < config.guarantees.length) {
                const guarantee = config.guarantees[i];
                selectedPlayer = pickByRarity(guarantee.minRarity, cardSeed);
            } else {
                const rolledRarity = rollRarity(cardSeed);
                const candidates = pool.filter(p => p.rarity === rolledRarity || (rolledRarity === 'Premium Legend' && p.rarity === 'Premium'));
                
                if (candidates.length > 0) {
                     const rng = this.getSeededRandom(cardSeed + '_pick');
                     selectedPlayer = candidates[Math.floor(rng * candidates.length)];
                } else {
                    selectedPlayer = pool[0];
                }
            }
            
            if (!selectedPlayer) selectedPlayer = pool[0];
            rewards.push(selectedPlayer);
        }

        const rarityRank = (value: string): number => {
            if (value === 'Common') return 1;
            if (value === 'Rare') return 2;
            if (value === 'Epic') return 3;
            if (value === 'Legendary') return 4;
            if (value === 'Premium') return 5;
            if (value === 'Premium Legend') return 6;
            return 0;
        };

        let highestRank = 0;
        for (let i = 0; i < rewards.length; i++) {
            const r = rewards[i];
            if (r && typeof r.rarity === 'string') {
                const rank = rarityRank(r.rarity);
                if (rank > highestRank) {
                    highestRank = rank;
                }
            }
        }

        const epicRank = rarityRank('Epic');
        const nextLuckState: PackLuckState =
            highestRank >= epicRank
                ? { unluckyOpens: 0, lastHighRarityAt: timestamp }
                : { unluckyOpens: (luckState.unluckyOpens || 0) + 1, lastHighRarityAt: luckState.lastHighRarityAt };

        this.saveLuckState(user, packId, nextLuckState);

        const locked: LockedPackResult = {
            transactionId,
            packId,
            rewards: rewards.map(p => p.id),
            currencyType: config.currency,
            costDeduced: config.cost,
            createdAt: timestamp
        };

        this.addPendingResult(user, locked);

        return {
            success: true,
            rewards,
            costDeduced: config.cost,
            currencyType: config.currency,
            transactionId
        };
    }
}
