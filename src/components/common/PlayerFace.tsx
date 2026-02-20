import React, { useMemo } from 'react';
import { getKitForPlayer } from '../../data/jerseys';
import rawPlayers from '../../data/players.json';

interface PlayerFaceProps {
    playerId: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const COLORS = {
    skin: ['#f8d9ce', '#f2c4b5', '#e0ac96', '#c68674', '#8d5524', '#523424', '#3c241b'],
    hair: ['#090806', '#2c222b', '#71635a', '#b7a69e', '#d6c4c2', '#cabfb1', '#dcd0ba', '#fff5e1', '#e6cea8', '#a56b46', '#533d32', '#71635a'],
    shirt: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ffffff', '#000000']
};

type PlayerMeta = {
    id: string;
    name: string;
    rarity?: string;
};

const players = rawPlayers as PlayerMeta[];

const playerIndex: Record<string, PlayerMeta> = {};

for (const p of players) {
    playerIndex[p.id] = p;
}

const BASE_HAIR_VARIANTS = 12;
const PREMIUM_LEGEND_HAIR_VARIANTS = 3;

const getHairVariant = (playerId: string, seed: number) => {
    const meta = playerIndex[playerId];
    if (meta && meta.rarity === 'Premium Legend') {
        if (meta.name === 'NOR GT') {
            return { sheet: 'premiumLegend' as const, index: 0 };
        }
        if (meta.name === 'NEBU DBX') {
            return { sheet: 'premiumLegend' as const, index: 1 };
        }
        if (meta.name === 'SREE HARII') {
            return { sheet: 'premiumLegend' as const, index: 2 };
        }
        return {
            sheet: 'premiumLegend' as const,
            index: Math.abs(seed) % PREMIUM_LEGEND_HAIR_VARIANTS
        };
    }
    return {
        sheet: 'base' as const,
        index: Math.abs(seed) % BASE_HAIR_VARIANTS
    };
};

export const PlayerFace: React.FC<PlayerFaceProps> = ({ playerId, size = 'md', className = '' }) => {
    const seed = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < playerId.length; i++) {
            hash = playerId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }, [playerId]);

    const getSize = () => {
        switch (size) {
            case 'sm': return 32;
            case 'md': return 48;
            case 'lg': return 64;
            case 'xl': return 128;
            default: return 48;
        }
    };

    const px = getSize();
    const kit = getKitForPlayer(playerId);

    const skinColor = COLORS.skin[seed % COLORS.skin.length];
    const hairColor = COLORS.hair[(seed >> 2) % COLORS.hair.length];
    const shirtColor = kit.primaryColor || COLORS.shirt[(seed >> 4) % COLORS.shirt.length];
    const mouthType = (seed >> 8) % 3;

    const hairVariant = getHairVariant(playerId, seed);
    const hairSheet =
        hairVariant.sheet === 'premiumLegend'
            ? '/img/hair_premium_legends.png'
            : '/img/hair_base.png';
    const cols = hairVariant.sheet === 'premiumLegend' ? 3 : 4;
    const rows = hairVariant.sheet === 'premiumLegend' ? 1 : 3;
    const col = hairVariant.index % cols;
    const row = Math.floor(hairVariant.index / cols);
    const colFrac = cols > 1 ? col / (cols - 1) : 0;
    const rowFrac = rows > 1 ? row / (rows - 1) : 0;

    return (
        <div 
            className={`relative overflow-hidden rounded-full border-2 border-white/20 bg-sky-200 ${className}`}
            style={{ width: px, height: px }}
        >
            {/* Body/Shirt */}
            <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-xl"
                style={{ 
                    width: '70%', 
                    height: '35%', 
                    backgroundColor: shirtColor 
                }}
            />

            {/* Neck */}
            <div 
                className="absolute bottom-[30%] left-1/2 -translate-x-1/2"
                style={{ 
                    width: '30%', 
                    height: '15%', 
                    backgroundColor: skinColor,
                    filter: 'brightness(0.9)'
                }}
            />

            {/* Head */}
            <div 
                className="absolute top-[15%] left-1/2 -translate-x-1/2 rounded-xl"
                style={{ 
                    width: '50%', 
                    height: '55%', 
                    backgroundColor: skinColor 
                }}
            >
                {/* Eyes */}
                <div className="absolute top-[40%] left-[20%] w-[15%] h-[15%] bg-black rounded-full" />
                <div className="absolute top-[40%] right-[20%] w-[15%] h-[15%] bg-black rounded-full" />
                
                {/* Mouth */}
                <div 
                    className="absolute bottom-[15%] left-1/2 -translate-x-1/2 bg-rose-400/50"
                    style={{
                        width: '40%',
                        height: mouthType === 0 ? '10%' : '5%',
                        borderRadius: mouthType === 0 ? '0 0 10px 10px' : '2px'
                    }}
                />
            </div>

            <div 
                className="absolute top-[10%] left-1/2 -translate-x-1/2 rounded-t-xl"
                style={{ 
                    width: '56%', 
                    height: '20%', 
                    backgroundColor: hairColor,
                    borderRadius: '50% 50% 0 0'
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    top: px ? px * 0.02 : 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    height: '90%',
                    backgroundImage: `url(${hairSheet})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${cols * 100}% ${rows * 100}%`,
                    backgroundPosition: `${colFrac * 100}% ${rowFrac * 100}%`
                }}
            />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white drop-shadow">
                {kit.number !== 0 ? kit.number : ''}
            </div>
        </div>
    );
};
