import React, { useRef, useState } from 'react';
import players from '../../data/players.json';
import { useAuthStore } from '../../store/useAuthStore';
import { PlayerFace } from '../common/PlayerFace';
import { RarityName, getRarityRank } from '../../data/rarities';
import { PackService, PREMIUM_PACK_01 } from '../../services/shop/PackService';
import { AudioManager } from '../../services/audioManager';

export type PackId =
    | 'STANDARD'
    | 'RARE'
    | 'EPIC'
    | 'LEGENDARY'
    | 'ICONIC'
    | 'SEASONAL'
    | 'ADMIN_ABUSE'
    | 'PREMIUM_01';

type PlayerRef = {
    id: string;
    name: string;
    rarity: RarityName;
    position: string;
    ovr: number;
    stats: {
        speed?: number;
        shooting?: number;
        passing?: number;
        dribbling?: number;
    };
};

const allPlayers = players as PlayerRef[];

const PACKS: {
    id: PackId;
    label: string;
    description: string;
    cost: number;
    currency: 'Coins' | 'Gems';
    rarityFilter: (p: PlayerRef) => boolean;
    requiresOwner?: boolean;
}[] = [
    {
        id: 'PREMIUM_01',
        label: PREMIUM_PACK_01.name,
        description: '5 Cards (75-95 OVR). Guaranteed 1 Rare+. 500 Gems.',
        cost: PREMIUM_PACK_01.cost,
        currency: 'Gems',
        rarityFilter: p => p.ovr >= 75 && p.ovr <= 95 // Approximate for display
    },
    {
        id: 'STANDARD',
        label: 'Standard Pack',
        description: '1 Standard player. Entry-level squad depth.',
        cost: 500,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Standard'
    },
    {
        id: 'RARE',
        label: 'Rare Pack',
        description: '1 Rare player. Stronger upgrades.',
        cost: 1500,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Rare'
    },
    {
        id: 'EPIC',
        label: 'Epic Pack',
        description: '1 Epic player. Big impact signings.',
        cost: 4000,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Epic'
    },
    {
        id: 'LEGENDARY',
        label: 'Legendary Pack',
        description: '1 Legendary-tier player if available.',
        cost: 7000,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Legendary'
    },
    {
        id: 'ICONIC',
        label: 'Iconic Pack',
        description: '1 Iconic player from Premium or Premium Legend.',
        cost: 12000,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Premium' || p.rarity === 'Premium Legend'
    },
    {
        id: 'SEASONAL',
        label: 'Seasonal Pack',
        description: '1 player from Rare or Epic pool.',
        cost: 2500,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Rare' || p.rarity === 'Epic'
    },
    {
        id: 'ADMIN_ABUSE',
        label: 'Admin Abuse Pack',
        description: 'Owner-only. Pull from Premium Legend only.',
        cost: 0,
        currency: 'Coins',
        rarityFilter: p => p.rarity === 'Premium Legend',
        requiresOwner: true
    }
];

const CELEBRATION_IDS: string[] = [
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

const getCelebrationLabel = (id: string): string => {
    switch (id) {
        case 'PHONE_CALL': return 'Phone Call';
        case 'MASK_FACE': return 'Mask Celebration';
        case 'SALUTE': return 'Salute';
        case 'SLIDE_POINT': return 'Slide and Point';
        case 'JUMP_CHEST_THUMP': return 'Jump Chest Thump';
        case 'RUNNING_SPIN': return 'Running Spin';
        case 'SHUSH': return 'Shush Crowd';
        case 'TEAMMATE_HUG': return 'Teammate Hug';
        case 'GROUP_HUDDLE': return 'Group Huddle';
        case 'BOW': return 'Bow';
        case 'SIT_DOWN': return 'Sit Down';
        case 'SLIDE_CAMERA': return 'Slide to Camera';
        case 'FLEX': return 'Flex';
        case 'POINT_SKY': return 'Point to Sky';
        case 'SIGNATURE': return 'Signature Pose';
        default: return id;
    }
};

const getRarityCardClass = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'bg-gradient-to-br from-yellow-900 via-black to-yellow-950 border-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.95)]';
        case 'Premium':
            return 'bg-gradient-to-br from-cyan-900 via-slate-900 to-black border-cyan-400 shadow-[0_0_32px_rgba(34,211,238,0.95)]';
        case 'Legendary':
            return 'bg-gradient-to-br from-amber-900 via-black to-amber-950 border-amber-400 shadow-[0_0_32px_rgba(251,191,36,0.9)]';
        case 'Iconic':
            return 'bg-gradient-to-br from-red-900 via-black to-red-950 border-red-500 shadow-[0_0_34px_rgba(248,113,113,0.95)]';
        case 'Epic':
            return 'bg-gradient-to-br from-purple-900 via-black to-indigo-950 border-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.95)]';
        case 'Rare':
            return 'bg-gradient-to-br from-blue-900 via-black to-sky-950 border-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.9)]';
        default:
            return 'bg-gradient-to-br from-gray-800 via-gray-900 to-black border-gray-500 shadow-[0_0_20px_rgba(148,163,184,0.8)]';
    }
};

const getOpeningDurationForRewards = (rewards: PlayerRef[]): number => {
    if (!rewards || rewards.length === 0) return 900;
    let maxRank = -1;
    for (const r of rewards) {
        const rank = getRarityRank(r.rarity);
        if (rank > maxRank) {
            maxRank = rank;
        }
    }
    if (maxRank < 0) return 900;
    const base = 900;
    const step = 180;
    const raw = base + maxRank * step;
    const min = 700;
    const max = 2300;
    return Math.max(min, Math.min(max, raw));
};

const getRarityRevealAnimation = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'pack-anim-premium-legend';
        case 'Premium':
            return 'pack-anim-premium';
        case 'Legendary':
            return 'pack-anim-legendary';
        case 'Iconic':
            return 'pack-anim-iconic';
        case 'Epic':
            return 'pack-anim-epic';
        case 'Rare':
            return 'pack-anim-rare';
        default:
            return 'pack-anim-standard';
    }
};

const getRarityOpeningAuraClass = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'from-yellow-500 via-yellow-200 to-yellow-900';
        case 'Premium':
            return 'from-cyan-400 via-cyan-200 to-cyan-900';
        case 'Legendary':
            return 'from-amber-400 via-amber-200 to-amber-900';
        case 'Iconic':
            return 'from-red-500 via-rose-300 to-red-900';
        case 'Epic':
            return 'from-purple-500 via-fuchsia-300 to-indigo-900';
        case 'Rare':
            return 'from-blue-500 via-sky-300 to-blue-900';
        default:
            return 'from-gray-500 via-gray-300 to-gray-900';
    }
};

interface PackOpenerProps {
    defaultPackId?: PackId;
    restrictToAdminAbuse?: boolean;
}

export const PackOpener: React.FC<PackOpenerProps> = ({ defaultPackId = 'STANDARD', restrictToAdminAbuse = false }) => {
    const { user, updateCurrency, addToSquad, unlockCelebration, updateForge } = useAuthStore();
    const [isOpening, setIsOpening] = useState(false);
    const [revealedPlayers, setRevealedPlayers] = useState<PlayerRef[]>([]);
    const [revealedCelebration, setRevealedCelebration] = useState<string | null>(null);
    const [activePack, setActivePack] = useState<PackId>(defaultPackId);
    
    // Pending State (for Animation)
    const [pendingPlayers, setPendingPlayers] = useState<PlayerRef[]>([]);
    const [pendingCelebration, setPendingCelebration] = useState<string | null>(null);
    const openTimeoutRef = useRef<number | null>(null);

    const playRaritySound = (rarity: string | undefined) => {
        let url = '/audio/pack_standard.mp3';
        if (rarity === 'Rare') url = '/audio/pack_rare.mp3';
        else if (rarity === 'Epic') url = '/audio/pack_epic.mp3';
        else if (rarity === 'Iconic') url = '/audio/pack_iconic.mp3';
        else if (rarity === 'Legendary') url = '/audio/pack_legendary.mp3';
        else if (rarity === 'Premium') url = '/audio/pack_premium.mp3';
        else if (rarity === 'Premium Legend') url = '/audio/pack_premium_legend.mp3';
        AudioManager.loadAndPlay('sfx', url);
    };

    const completeReveal = () => {
        if (!user || pendingPlayers.length === 0) {
            setIsOpening(false);
            return;
        }
        
        const first = pendingPlayers[0];
        if (first) {
            playRaritySound(first.rarity);
        }
        setRevealedPlayers(pendingPlayers);
        setRevealedCelebration(pendingCelebration);
        
        setPendingPlayers([]);
        setPendingCelebration(null);
        setIsOpening(false);
        if (openTimeoutRef.current !== null) {
            window.clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = null;
        }
    };

    const openPack = (packId: PackId) => {
        if (isOpening || !user) return;

        const config = PACKS.find(p => p.id === packId);
        if (!config) return;

        if (config.requiresOwner && user.role !== 'Owner') return;

        let rewards: PlayerRef[] = [];
        let celebrationId: string | null = null;

        if (packId === 'PREMIUM_01') {
             const result = PackService.openPack(user, packId);
             if (!result.success) {
                 alert(result.error);
                 return;
             }
             rewards = result.rewards;
             celebrationId = CELEBRATION_IDS[Math.floor(Math.random() * CELEBRATION_IDS.length)];

             const currentGems = user.gems || user.diamonds || 0;
             updateCurrency(user.coins, currentGems - result.costDeduced);
            const currentSquad = user.squad || [];
            let forgeGain = 0;
            rewards.forEach(p => {
                if (currentSquad.includes(p.id)) {
                    forgeGain += PackService['getForgeValueForPlayerId'](p.id);
                } else {
                    addToSquad(p.id);
                }
            });
            if (forgeGain > 0) {
                const currentForgeMaterials = user.forgeMaterials || 0;
                const nextForgeMaterials = currentForgeMaterials + forgeGain;
                const forgeState = user.forgeState || {};
                updateForge(nextForgeMaterials, forgeState);
            }
             if (celebrationId) unlockCelebration(celebrationId);
             PackService.clearPendingResult(user, result.transactionId);

        } else {
             const userCoins = user.coins;
             if (config.currency === 'Coins' && userCoins < config.cost) {
                 alert('Insufficient Coins!');
                 return;
             }
             updateCurrency(userCoins - config.cost, user.diamonds);

             let pool = allPlayers.filter(config.rarityFilter);
             if (pool.length === 0) pool = allPlayers.filter(p => p.rarity === 'Standard');
             
             const pulled = pool[Math.floor(Math.random() * pool.length)];
             rewards = [pulled];
             celebrationId = CELEBRATION_IDS[Math.floor(Math.random() * CELEBRATION_IDS.length)];

             const hasPlayer = user.squad.includes(pulled.id);
             if (hasPlayer) {
                 const gain = PackService['getForgeValueForPlayerId'](pulled.id);
                 const currentForgeMaterials = user.forgeMaterials || 0;
                 const nextForgeMaterials = currentForgeMaterials + gain;
                 const forgeState = user.forgeState || {};
                 updateForge(nextForgeMaterials, forgeState);
             } else {
                 addToSquad(pulled.id);
             }
             unlockCelebration(celebrationId);
        }

        // 2. Start Animation (Rewards already safe)
        setIsOpening(true);
        setRevealedPlayers([]);
        setRevealedCelebration(null);
        setPendingPlayers(rewards);
        setPendingCelebration(celebrationId);

        if (openTimeoutRef.current !== null) {
            window.clearTimeout(openTimeoutRef.current);
        }
        const openingDuration = getOpeningDurationForRewards(rewards);
        openTimeoutRef.current = window.setTimeout(() => {
            completeReveal();
        }, openingDuration);
    };

    const handleSkip = () => {
        if (!isOpening) return;
        completeReveal();
    };

    return (
        <div className="w-full min-h-[420px] flex flex-col items-center justify-center bg-black/90 text-white p-8">
            {!revealedPlayers.length && !isOpening && (
                <div className="w-full max-w-5xl mx-auto">
                    <h2 className="text-4xl font-black mb-6 italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 text-center">
                        PLAYER PACKS
                    </h2>
                    <p className="text-center text-gray-400 mb-8 text-sm">
                        Choose a pack based on the rarity you want. Each pack contains 1 player and 1 celebration skill.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {(restrictToAdminAbuse ? PACKS.filter(p => p.id === 'ADMIN_ABUSE') : PACKS).map(pack => {
                            const isOwnerOnly = pack.requiresOwner && user?.role !== 'Owner';
                            const userBalance = pack.currency === 'Gems' ? (user?.gems || user?.diamonds || 0) : (user?.coins || 0);
                            const disabled = isOwnerOnly || !user || (pack.cost > 0 && userBalance < pack.cost);

                            return (
                                <div
                                    key={pack.id}
                                    className={`bg-gradient-to-br from-gray-900 to-black border ${pack.id === 'PREMIUM_01' ? 'border-emerald-500' : 'border-purple-700/40'} rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_25px_rgba(168,85,247,0.24)]`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-lg font-bold">{pack.label}</div>
                                            <span className={`text-xs ${pack.currency === 'Gems' ? 'text-emerald-400' : 'text-gray-400'}`}>
                                                {pack.cost} {pack.currency}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mb-4">
                                            {pack.description}
                                        </p>
                                        {pack.id === activePack && (
                                            <div className="text-[10px] text-emerald-400 uppercase tracking-widest mb-1">
                                                Selected
                                            </div>
                                        )}
                                        {isOwnerOnly && (
                                            <div className="text-[10px] text-red-400 uppercase tracking-widest mb-1">
                                                Owner Only
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setActivePack(pack.id);
                                            openPack(pack.id);
                                        }}
                                        disabled={disabled}
                                        className={`mt-4 w-full py-2 rounded font-bold text-sm transition-colors ${
                                            disabled
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : pack.id === 'PREMIUM_01' 
                                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-black' 
                                                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                                        }`}
                                    >
                                        {isOwnerOnly && user?.role !== 'Owner'
                                            ? 'Owner Only'
                                            : 'Open Pack'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {isOpening && (
                <div className="flex flex-col items-center justify-center">
                    <div
                        className={`relative w-64 h-64 rounded-full flex items-center justify-center bg-gradient-to-br pack-opening-pulse ${getRarityOpeningAuraClass(
                            pendingPlayers[0]?.rarity
                        )} shadow-[0_0_45px_rgba(0,0,0,0.9)] border border-white/30`}
                    >
                        <div className="absolute inset-[-20%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_65%)] opacity-70" />
                        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-black/70 border border-white/40">
                            <div className="w-20 h-20 rounded-full border-2 border-white/70 flex items-center justify-center animate-spin">
                                <span className="text-3xl">⚽</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 text-lg text-gray-200 font-semibold tracking-[0.35em] uppercase">
                        Opening Pack...
                    </div>
                    <button
                        onClick={handleSkip}
                        className="mt-4 px-6 py-2 rounded-full bg-white/10 border border-white/40 text-[11px] uppercase tracking-[0.3em] text-gray-100 hover:bg-white/20"
                    >
                        Skip Animation
                    </button>
                </div>
            )}

            {revealedPlayers.length > 0 && (
                <div className="relative flex flex-col items-center justify-center w-full max-w-6xl mx-auto py-8">
                    <div className="absolute inset-0 stadium-lights pointer-events-none opacity-60" />
                    {activePack === 'SEASONAL' && (
                        <div className="absolute inset-0 seasonal-spotlight-bg pointer-events-none" />
                    )}
                    {activePack === 'ADMIN_ABUSE' && (
                        <div className="absolute inset-0 admin-abuse-confetti pointer-events-none" />
                    )}
                    
                    <div className="relative text-center w-full z-10">
                        <div className="mb-8 text-xl font-black uppercase tracking-[0.4em] text-yellow-300 drop-shadow-md animate-fade-in-down">
                            Pack Rewards
                        </div>

                        <div className="flex flex-wrap justify-center gap-6 md:gap-8 px-4">
                            {revealedPlayers.map((player, index) => (
                                <div 
                                    key={`${player.id}-${index}`}
                                    className="animate-fade-in-up"
                                    style={{ animationDelay: `${index * 150}ms` }}
                                >
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-yellow-200">
                                        {player.rarity}
                                    </div>
                                    <div
                                        className={`relative w-48 h-[280px] md:w-56 md:h-[340px] rounded-2xl border-2 mx-auto p-4 flex flex-col items-center justify-between transition-transform hover:scale-105 ${getRarityCardClass(
                                            player.rarity
                                        )} ${getRarityRevealAnimation(player.rarity)} ${
                                            activePack === 'SEASONAL' ? 'seasonal-spotlight-card' : ''
                                        } ${
                                            activePack === 'ADMIN_ABUSE' ? 'admin-abuse-card-cluster' : ''
                                        }`}
                                    >
                                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-white/10 opacity-60" />
                                        
                                        <div className="relative w-full flex items-center justify-between">
                                            <div className="text-3xl font-black text-white drop-shadow-lg">
                                                {player.ovr}
                                            </div>
                                            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-200">
                                                {player.position}
                                            </div>
                                        </div>
                                        
                                        <div className="relative mt-2 mb-2 flex items-center justify-center">
                                            <PlayerFace
                                                playerId={player.id}
                                                size="lg"
                                                className="shadow-[0_0_20px_rgba(15,23,42,0.8)]"
                                            />
                                        </div>
                                        
                                        <div className="relative w-full text-center">
                                            <h3 className="text-lg font-black uppercase tracking-wide text-white truncate px-1">
                                                {player.name}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-1 mt-2 text-[9px] font-mono text-gray-100 opacity-80">
                                                <div>SPD: {player.stats?.speed ?? '--'}</div>
                                                <div>SHT: {player.stats?.shooting ?? '--'}</div>
                                                <div>PAS: {player.stats?.passing ?? '--'}</div>
                                                <div>DRI: {player.stats?.dribbling ?? '--'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {revealedCelebration && (
                            <div className="mt-8 p-4 bg-black/60 backdrop-blur-sm rounded-xl border border-emerald-500/30 inline-block animate-bounce-in">
                                <div className="text-xs text-gray-300 uppercase tracking-widest mb-1">Bonus Unlocked</div>
                                <div className="text-lg font-bold text-emerald-400">
                                    {getCelebrationLabel(revealedCelebration)} Celebration
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                setRevealedPlayers([]);
                                setRevealedCelebration(null);
                            }}
                            className="mt-10 px-10 py-3 bg-white text-black font-black text-sm tracking-widest uppercase rounded-full hover:bg-gray-200 hover:scale-105 transition-all shadow-lg shadow-white/20"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
