import { ShopItem, PremiumShopState } from '../../types/economy';
import players from '../../data/players.json';

// Mock Server State
let shopState: PremiumShopState = {
    lastReset: Date.now(),
    nextReset: Date.now() + (4 * 24 * 60 * 60 * 1000), // 4 Days
    items: []
};

export class PremiumShopService {
    
    // Server-Side Logic Simulation
    static generateShopRotation() {
        const rotation: ShopItem[] = [];
        const TOTAL_SLOTS = 5;

        const legends = players.filter(p => p.rarity === 'Premium Legend');
        if (legends.length > 0 && Math.random() < 0.001) {
            const legend = legends[Math.floor(Math.random() * legends.length)];
            const legendPrice = Math.round(legend.ovr * 120);
            rotation.push({
                id: `shop_legend_${Date.now()}`,
                type: 'Player',
                contentId: legend.id,
                price: legendPrice,
                currency: 'Diamonds',
                isPremium: true,
                stock: 5
            });
        }

        const premiumPool = players.filter(p => p.rarity === 'Premium');
        const usedIds = new Set<string>();

        while (rotation.length < TOTAL_SLOTS && premiumPool.length > 0) {
            const p = premiumPool[Math.floor(Math.random() * premiumPool.length)];
            if (usedIds.has(p.id)) continue;
            usedIds.add(p.id);
            const price = Math.round(p.ovr * 40);
            rotation.push({
                id: `shop_premium_${p.id}_${rotation.length}`,
                type: 'Player',
                contentId: p.id,
                price,
                currency: 'Diamonds',
                isPremium: true,
                stock: 20
            });
        }

        const celebrationIds = [
            'PHONE_CALL',
            'MASK_FACE',
            'SALUTE',
            'SLIDE_POINT',
            'JUMP_CHEST_THUMP',
            'RUNNING_SPIN',
            'SHUSH',
            'TEAMMATE_HUG',
            'GROUP_HUDDLE',
            'BOW',
            'SIT_DOWN',
            'SLIDE_CAMERA',
            'FLEX',
            'POINT_SKY',
            'SIGNATURE'
        ];
        const celebrationPrice = 300;
        for (let i = 0; i < 2 && i < celebrationIds.length; i++) {
            const celebrationId = celebrationIds[Math.floor(Math.random() * celebrationIds.length)];
            rotation.push({
                id: `shop_cele_${celebrationId}_${i}`,
                type: 'Skill',
                contentId: celebrationId,
                price: celebrationPrice,
                currency: 'Diamonds',
                isPremium: true,
                stock: 50
            });
        }

        shopState.items = rotation;
        shopState.lastReset = Date.now();
        shopState.nextReset = Date.now() + (4 * 24 * 60 * 60 * 1000);
        
        return shopState;
    }

    static addManualPlayerItem(playerId: string, price: number, stock?: number): PremiumShopState {
        const player = (players as any[]).find(p => p.id === playerId);
        if (!player) {
            throw new Error('Player not found');
        }
        const rarity = String(player.rarity || '');
        if (rarity !== 'Premium' && rarity !== 'Premium Legend') {
            throw new Error('Only Premium or Premium Legend players can be added');
        }
        const item: ShopItem = {
            id: `shop_manual_${playerId}_${Date.now()}`,
            type: 'Player',
            contentId: playerId,
            price,
            currency: 'Diamonds',
            isPremium: true,
            stock: stock && stock > 0 ? stock : undefined
        };
        shopState.items = [...shopState.items, item];
        return shopState;
    }

    static updateItemPriceAndStock(itemId: string, price: number, stock?: number): PremiumShopState {
        shopState.items = shopState.items.map(item => {
            if (item.id !== itemId) return item;
            return {
                ...item,
                price,
                stock: stock && stock > 0 ? stock : undefined
            };
        });
        return shopState;
    }

    static registerPurchase(itemId: string): PremiumShopState {
        shopState.items = shopState.items.map(item => {
            if (item.id !== itemId) return item;
            if (typeof item.stock !== 'number') return item;
            const nextStock = item.stock - 1;
            if (nextStock <= 0) {
                return { ...item, stock: 0 };
            }
            return { ...item, stock: nextStock };
        }).filter(item => {
            if (typeof item.stock !== 'number') return true;
            return item.stock > 0;
        });
        return shopState;
    }

    static getShopState(): PremiumShopState {
        // Check if reset is needed
        if (Date.now() >= shopState.nextReset) {
            return this.generateShopRotation();
        }
        
        // Initial generation if empty
        if (shopState.items.length === 0) {
            return this.generateShopRotation();
        }

        return shopState;
    }

    // Owner Action
    static forceReset() {
        return this.generateShopRotation();
    }
}
