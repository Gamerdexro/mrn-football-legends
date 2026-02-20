export type CurrencyType = 'Coins' | 'Diamonds';

export interface ShopItem {
    id: string;
    type: 'Player' | 'Skill' | 'Icon' | 'Pack';
    contentId: string; // ID of the player/skill/icon
    price: number;
    currency: CurrencyType;
    isPremium: boolean; // True if Diamond exclusive
    stock?: number; // Optional limit
}

export interface PremiumShopState {
    lastReset: number;
    nextReset: number;
    items: ShopItem[];
    // Owner Only Controls
    forceReset?: () => void;
}
