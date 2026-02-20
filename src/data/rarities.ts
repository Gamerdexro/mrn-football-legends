export type RarityName =
    | 'Standard'
    | 'Rare'
    | 'Epic'
    | 'Iconic'
    | 'Legendary'
    | 'Premium'
    | 'Premium Legend';

export const RARITY_ORDER: RarityName[] = [
    'Standard',
    'Rare',
    'Epic',
    'Iconic',
    'Legendary',
    'Premium',
    'Premium Legend'
];

const rarityRankMap: Record<RarityName, number> = {
    Standard: 0,
    Rare: 1,
    Epic: 2,
    Iconic: 3,
    Legendary: 4,
    Premium: 5,
    'Premium Legend': 6
};

const rarityCoinMultiplierMap: Record<RarityName, number> = {
    Standard: 30,
    Rare: 55,
    Epic: 75,
    Iconic: 115,
    Legendary: 145,
    Premium: 0,
    'Premium Legend': 0
};

const rarityDiamondMultiplierMap: Record<RarityName, number> = {
    Standard: 0,
    Rare: 0,
    Epic: 0,
    Iconic: 0,
    Legendary: 0,
    Premium: 3,
    'Premium Legend': 4.5
};

export const normalizeRarity = (rarity: string | undefined): RarityName | undefined => {
    if (!rarity) return undefined;
    const lower = rarity.toLowerCase();
    const match = RARITY_ORDER.find(r => r.toLowerCase() === lower);
    return match;
};

export const getRarityRank = (rarity: string | undefined): number => {
    const key = normalizeRarity(rarity);
    if (!key) return -1;
    return rarityRankMap[key];
};

export const getBaseCoinValue = (ovr: number, rarity: string | undefined): number => {
    const key = normalizeRarity(rarity);
    if (!key || ovr <= 0) return 0;
    const multiplier = rarityCoinMultiplierMap[key];
    return Math.max(0, Math.round(ovr * multiplier));
};

export const getBaseDiamondPrice = (ovr: number, rarity: string | undefined): number => {
    const key = normalizeRarity(rarity);
    if (!key || ovr <= 0) return 0;
    const multiplier = rarityDiamondMultiplierMap[key];
    return Math.max(0, Math.round(ovr * multiplier));
};

