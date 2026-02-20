import rawPlayers from './players.json';
import { RarityName } from './rarities';

export type KitInfo = {
    number: number;
    country: string;
    primaryColor: string;
};

type PlayerRef = {
    id: string;
    name: string;
    rarity: RarityName;
};

const players = rawPlayers as PlayerRef[];

const teamNames = [
    'Astrix FC',
    'Velmor United',
    'Kaysen Rovers',
    'Zypher Athletic',
    'Nerova SC',
    'Orvion City',
    'Caldris FC',
    'Virex United',
    'Lunaris Athletic',
    'Torvane FC',
    'Helixon SC',
    'Bravex Rovers',
    'Mythra United',
    'Auren City'
];

const teamColors = [
    '#c62828',
    '#fbc02d',
    '#ff8a65',
    '#26c6da',
    '#9e9e9e',
    '#facc15',
    '#5d4037',
    '#f5f5f5',
    '#fb8c00',
    '#7c3aed',
    '#2563eb',
    '#111827',
    '#22c55e',
    '#ec4899'
];

const forbiddenNumbers = new Set([0, 7, 10, 99]);

const allowedLegendaryNumbers: number[] = [];
for (let n = 1; n < 99; n++) {
    if (!forbiddenNumbers.has(n)) {
        allowedLegendaryNumbers.push(n);
    }
}

const legendaryNumberMap: Record<string, number> = {};
const legendaryPlayers = players.filter(p => p.rarity === 'Legendary');
const legendaryMaxRepeat = 2;
const legendaryCounts: Record<number, number> = {};

for (let i = 0; i < legendaryPlayers.length; i++) {
    let index = i % allowedLegendaryNumbers.length;
    let candidate = allowedLegendaryNumbers[index];

    let safety = 0;
    while ((legendaryCounts[candidate] || 0) >= legendaryMaxRepeat && safety < allowedLegendaryNumbers.length) {
        index = (index + 1) % allowedLegendaryNumbers.length;
        candidate = allowedLegendaryNumbers[index];
        safety++;
    }

    legendaryNumberMap[legendaryPlayers[i].id] = candidate;
    legendaryCounts[candidate] = (legendaryCounts[candidate] || 0) + 1;
}

const premiumLegendCustomByName: Record<string, number> = {
    'NOR GT': 107,
    'SREE HARII': 7,
    'NEBU DBX': 10,
    'Joshwel Rocay': 4
};

const premiumLegendNumberMap: Record<string, number> = {};

for (const p of players) {
    if (p.rarity === 'Premium Legend') {
        const custom = premiumLegendCustomByName[p.name];
        if (custom !== undefined) {
            premiumLegendNumberMap[p.id] = custom;
        }
    }
}

const premiumCustomByName: Record<string, number> = {
    Jerry: 99,
    Pradhu: 30
};

const premiumNumberMap: Record<string, number> = {};

for (const p of players) {
    if (p.rarity === 'Premium') {
        const custom = premiumCustomByName[p.name];
        if (custom !== undefined) {
            premiumNumberMap[p.id] = custom;
        }
    }
}

const baseCountries = [
    'Veloria',
    'Norlund',
    'Aurevia',
    'Drakoria',
    'Astranyx',
    'Kaelor',
    'Miranth',
    'Solvar',
    'Kyralis',
    'Thalor'
];

const baseColors = [
    '#d32f2f',
    '#1565c0',
    '#2e7d32',
    '#f9a825',
    '#6a1b9a',
    '#00838f',
    '#c62828',
    '#283593',
    '#2e7d32',
    '#f57c00'
];

const starterOverrides: Record<string, KitInfo> = {
    PLAYER_001: { number: 1, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_002: { number: 2, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_003: { number: 3, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_004: { number: 4, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_005: { number: 5, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_006: { number: 6, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_007: { number: 8, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_008: { number: 9, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_009: { number: 11, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_010: { number: 12, country: 'Veloria', primaryColor: '#ff2f7f' },
    PLAYER_011: { number: 13, country: 'Veloria', primaryColor: '#ff2f7f' }
};

const computeNumber = (seed: number) => {
    let num = (seed % 28) + 1;
    if (num === 0) num = 1;
    while (forbiddenNumbers.has(num) || num === 99) {
        num = ((num + 3) % 98) || 1;
    }
    return num;
};

export const getKitForPlayer = (playerId: string): KitInfo => {
    const override = starterOverrides[playerId];
    if (override) return override;

    const index = players.findIndex(p => p.id === playerId);
    if (index === -1) {
        return { number: 0, country: 'Free Agent', primaryColor: '#424242' };
    }

    const player = players[index];
    let number = computeNumber(index + 1);

    const legendaryOverride = legendaryNumberMap[player.id];
    if (legendaryOverride !== undefined) {
        number = legendaryOverride;
    }

    const premiumLegendOverride = premiumLegendNumberMap[player.id];
    if (premiumLegendOverride !== undefined) {
        number = premiumLegendOverride;
    }

    const premiumOverride = premiumNumberMap[player.id];
    if (premiumOverride !== undefined) {
        number = premiumOverride;
    }

    const teamIndex = Math.floor(index / 18);
    if (teamIndex >= 0 && teamIndex < teamNames.length) {
        const country = teamNames[teamIndex];
        const primaryColor = teamColors[teamIndex] || baseColors[index % baseColors.length];
        return { number, country, primaryColor };
    }

    if (player.rarity === 'Standard') {
        return { number, country: 'Standard XI', primaryColor: '#ff2f7f' };
    }

    if (player.rarity === 'Rare') {
        return { number, country: 'Rare Squad', primaryColor: '#c62828' };
    }

    if (player.rarity === 'Epic') {
        return { number, country: 'Epic Crew', primaryColor: '#1565c0' };
    }

    if (player.rarity === 'Iconic') {
        return { number, country: 'Iconic Legends', primaryColor: '#f9a825' };
    }

    if (player.rarity === 'Legendary') {
        return { number, country: 'Legendary Kings', primaryColor: '#fdd835' };
    }

    if (player.rarity === 'Premium') {
        return { number, country: 'Premium Elite', primaryColor: '#b71c1c' };
    }

    if (player.rarity === 'Premium Legend') {
        return { number, country: 'Premium Legends', primaryColor: '#880e4f' };
    }

    const country = baseCountries[index % baseCountries.length];
    const primaryColor = baseColors[index % baseColors.length];

    return { number, country, primaryColor };
};
