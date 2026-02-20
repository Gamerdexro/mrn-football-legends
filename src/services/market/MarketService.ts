import players from '../../data/players.json';
import { getBaseCoinValue, getBaseDiamondPrice, normalizeRarity } from '../../data/rarities';

export interface MarketListing {
    id: string;
    sellerId: string; // 'SYSTEM' or userId
    playerId: string;
    price: number; // Coins
    listedAt: number;
    limit?: number; // Optional max buyers
    sold?: number; // How many have bought so far
    basePrice?: number;
    strategy?: 'HIGH' | 'MARKET' | 'LOW';
    demandTag?: 'HIGH' | 'MEDIUM' | 'LOW';
}

let marketListings: MarketListing[] = [];
const priceAdjustmentByPlayer: Record<string, number> = {};

export class MarketService {

    static getListings(): MarketListing[] {
        if (marketListings.length === 0) {
            this.seedMarket();
        }
        return marketListings;
    }

    static getBasePriceForPlayer(playerId: string): number {
        const player = (players as any[]).find(p => p.id === playerId) as any | undefined;
        if (!player) return 0;
        const rarity = String(player.rarity || '');
        const ovr = Number(player.ovr || 0);
        const position = String(player.position || '');
        const baseValue = getBaseCoinValue(ovr, rarity);
        if (!baseValue) return 0;

        const demandMultiplier = this.getDemandMultiplier(position, ovr, rarity);
        const adjustmentKey = String(player.id);
        const adjustment =
            typeof priceAdjustmentByPlayer[adjustmentKey] === 'number'
                ? priceAdjustmentByPlayer[adjustmentKey]
                : 1;

        const price = baseValue * demandMultiplier * adjustment;
        return Math.max(100, Math.round(price));
    }

    // 75% coin refund for normal tradables, 50% diamond refund for Premium tiers
    static getInstantSellValue(playerId: string): { coins: number; diamonds: number } | null {
        const player = (players as any[]).find(p => p.id === playerId) as any | undefined;
        if (!player) return null;

        const rarity = String(player.rarity || '');
               const ovr = Number(player.ovr || 0);
        const normalized = normalizeRarity(rarity);

        if (!normalized || ovr <= 0) return null;

        // Premium / Premium Legend: diamond refund only
        if (normalized === 'Premium' || normalized === 'Premium Legend') {
            const baseDiamonds = getBaseDiamondPrice(ovr, rarity);
            if (!baseDiamonds) return { coins: 0, diamonds: 0 };
            const diamonds = Math.max(1, Math.round(baseDiamonds * 0.5));
            return { coins: 0, diamonds };
        }

        // Coin-based instant sell (75% of base price)
        const basePrice = this.getBasePriceForPlayer(playerId);
        if (!basePrice) return { coins: 0, diamonds: 0 };
        const coins = Math.max(100, Math.round(basePrice * 0.75));
        return { coins, diamonds: 0 };
    }

    static instantSellPlayer(
        playerId: string,
        coins: number,
        diamonds: number
    ): { success: boolean; message: string; newCoins?: number; newDiamonds?: number } {
        const value = this.getInstantSellValue(playerId);
        if (!value) {
            return { success: false, message: 'Unable to calculate instant sell value' };
        }
        if (value.coins <= 0 && value.diamonds <= 0) {
            return { success: false, message: 'This player cannot be instantly sold' };
        }

        const newCoins = coins + value.coins;
        const newDiamonds = diamonds + value.diamonds;

        const rewardLabel =
            value.diamonds > 0
                ? `${value.diamonds.toLocaleString()} Diamonds`
                : `${value.coins.toLocaleString()} Coins`;

        return {
            success: true,
            message: `Instantly sold for ${rewardLabel}`,
            newCoins,
            newDiamonds
        };
    }

    static getSellPriceOptions(playerId: string): { base: number; high: number; market: number; low: number } | null {
        const base = this.getBasePriceForPlayer(playerId);
        if (!base) return null;
        const high = Math.round(base * 1.25);
        const market = base;
        const low = Math.round(base * 0.8);
        return {
            base,
            high,
            market,
            low
        };
    }

    static getListingAnalysis(listing: MarketListing): { deal: 'GOOD' | 'FAIR' | 'OVERPRICED'; highDemand: boolean } {
        const base = listing.basePrice && listing.basePrice > 0 ? listing.basePrice : this.getBasePriceForPlayer(listing.playerId);
        if (!base) {
            return { deal: 'FAIR', highDemand: false };
        }
        const ratio = listing.price / base;
        let deal: 'GOOD' | 'FAIR' | 'OVERPRICED';
        if (ratio <= 0.9) {
            deal = 'GOOD';
        } else if (ratio >= 1.15) {
            deal = 'OVERPRICED';
        } else {
            deal = 'FAIR';
        }
        const player = (players as any[]).find(p => p.id === listing.playerId) as any | undefined;
        const rarity = String(player?.rarity || '');
        const position = String(player?.position || '');
        const ovr = Number(player?.ovr || 0);
        const demandTag = this.getDemandTag(position, ovr, rarity);
        const highDemand = demandTag === 'HIGH';
        return { deal, highDemand };
    }

    private static getDemandMultiplier(position: string, ovr: number, rarity: string): number {
        const pos = (position || '').toUpperCase();
        const isMetaPosition = ['ST', 'CF', 'SS', 'RW', 'LW', 'CAM', 'GK'].includes(pos);
        const isHighOvr = ovr >= 85;
        const isPremium = rarity === 'Premium' || rarity === 'Premium Legend';
        let demand = 1;
        if (isMetaPosition) {
            demand += 0.15;
        }
        if (isHighOvr) {
            demand += 0.2;
        }
        if (isPremium) {
            demand += 0.2;
        }
        return demand;
    }

    private static getDemandTag(position: string, ovr: number, rarity: string): 'HIGH' | 'MEDIUM' | 'LOW' {
        const demandMultiplier = this.getDemandMultiplier(position, ovr, rarity);
        if (demandMultiplier >= 1.3) return 'HIGH';
        if (demandMultiplier <= 0.9) return 'LOW';
        return 'MEDIUM';
    }

    static seedMarket() {
        const allowedRarities = ['Standard', 'Rare', 'Epic', 'Iconic', 'Legendary'];
        const sellablePlayers = (players as any[]).filter(p => allowedRarities.includes(p.rarity as string));
        marketListings = [];
        sellablePlayers.forEach((p, index) => {
            const basePrice = this.getBasePriceForPlayer(p.id);
            if (!basePrice) {
                return;
            }
            const variance = 0.8 + Math.random() * 0.5;
            const price = Math.max(100, Math.round(basePrice * variance));
            const demandTag = this.getDemandTag(String(p.position || ''), Number(p.ovr || 0), String(p.rarity || ''));
            marketListings.push({
                id: `market_${p.id}_${index}`,
                sellerId: 'SYSTEM',
                playerId: p.id,
                price,
                listedAt: Date.now() - Math.floor(Math.random() * 10000000),
                basePrice,
                strategy: 'MARKET',
                demandTag
            });
        });
    }

    static buyPlayer(listingId: string, buyerCoins: number): { success: boolean; message: string; newCoins?: number } {
        const listingIndex = marketListings.findIndex(l => l.id === listingId);
        if (listingIndex === -1) return { success: false, message: 'Listing not found' };

        const listing = marketListings[listingIndex];

        if (buyerCoins < listing.price) {
            return { success: false, message: 'Insufficient Coins' };
        }

        const limit = typeof listing.limit === 'number' ? listing.limit : undefined;
        const sold = listing.sold || 0;
        const nextSold = sold + 1;

        if (limit && nextSold >= limit) {
            marketListings.splice(listingIndex, 1);
        } else if (limit) {
            marketListings[listingIndex] = {
                ...listing,
                sold: nextSold
            };
        } else {
            marketListings.splice(listingIndex, 1);
        }

        return {
            success: true,
            message: 'Purchase Successful!',
            newCoins: buyerCoins - listing.price
        };
    }

    static sellPlayer(playerId: string, sellerId: string, price: number, limit?: number) {
        const player = (players as any[]).find(p => p.id === playerId) as any | undefined;
        const basePrice = this.getBasePriceForPlayer(playerId);
        const rarity = String(player?.rarity || '');
        const ovr = Number(player?.ovr || 0);
        const position = String(player?.position || '');
        const demandTag = this.getDemandTag(position, ovr, rarity);
        const listing: MarketListing = {
            id: `market_${Date.now()}_new`,
            sellerId,
            playerId,
            price,
            listedAt: Date.now(),
            basePrice,
            demandTag
        };
        if (limit && limit > 0) {
            listing.limit = limit;
            listing.sold = 0;
        }
        marketListings.unshift(listing);
        this.applyGlobalPriceAdjustment(playerId, rarity);
        return { success: true, message: 'Player Listed' };
    }

    static sellPlayerWithStrategy(playerId: string, sellerId: string, strategy: 'HIGH' | 'MARKET' | 'LOW') {
        const options = this.getSellPriceOptions(playerId);
        if (!options) {
            return { success: false, message: 'Unable to price this player' };
        }
        let price = options.market;
        if (strategy === 'HIGH') {
            price = options.high;
        } else if (strategy === 'LOW') {
            price = options.low;
        }
        const player = (players as any[]).find(p => p.id === playerId) as any | undefined;
        const rarity = String(player?.rarity || '');
        const ovr = Number(player?.ovr || 0);
        const position = String(player?.position || '');
        const demandTag = this.getDemandTag(position, ovr, rarity);
        const listing: MarketListing = {
            id: `market_${Date.now()}_new`,
            sellerId,
            playerId,
            price,
            listedAt: Date.now(),
            basePrice: options.base,
            strategy,
            demandTag
        };
        marketListings.unshift(listing);
        this.applyGlobalPriceAdjustment(playerId, rarity);
        return { success: true, message: 'Player Listed', listing };
    }

    static updateListing(listingId: string, price: number, limit?: number): MarketListing[] {
        marketListings = marketListings.map(listing => {
            if (listing.id !== listingId) return listing;
            const updated: MarketListing = {
                ...listing,
                price
            };
            if (limit && limit > 0) {
                updated.limit = limit;
                if (typeof updated.sold !== 'number') {
                    updated.sold = 0;
                }
            } else {
                delete updated.limit;
                delete updated.sold;
            }
            return updated;
        });
        return marketListings;
    }

    private static applyGlobalPriceAdjustment(playerId: string, rarity: string) {
        const key = String(playerId);
        const normalized = normalizeRarity(rarity);
        if (!normalized) return;
        let reduction = 0.05;
        if (normalized === 'Rare' || normalized === 'Epic') {
            reduction = 0.1;
        } else if (normalized === 'Iconic' || normalized === 'Legendary') {
            reduction = 0.15;
        }
        const current = typeof priceAdjustmentByPlayer[key] === 'number' ? priceAdjustmentByPlayer[key] : 1;
        const next = Math.max(0.4, current * (1 - reduction));
        priceAdjustmentByPlayer[key] = next;
    }
}
