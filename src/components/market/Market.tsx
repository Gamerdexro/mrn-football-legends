import React, { useState, useEffect } from 'react';
import { MarketService, MarketListing } from '../../services/market/MarketService';
import { useAuthStore } from '../../store/useAuthStore';
import players from '../../data/players.json';
import { PlayerFace } from '../common/PlayerFace';
import { getBaseDiamondPrice } from '../../data/rarities';
import { AudioManager } from '../../services/audioManager';

const getRarityBadgeClass = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'bg-yellow-700/80 text-yellow-50 border border-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.8)]';
        case 'Premium':
            return 'bg-cyan-700/80 text-cyan-50 border border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]';
        case 'Legendary':
            return 'bg-amber-700/80 text-amber-50 border border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.85)]';
        case 'Iconic':
            return 'bg-red-700/80 text-red-50 border border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.85)]';
        case 'Epic':
            return 'bg-purple-700/80 text-purple-50 border border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.85)]';
        case 'Rare':
            return 'bg-blue-700/80 text-blue-50 border border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]';
        default:
            return 'bg-gray-700/80 text-gray-100 border border-gray-500 shadow-[0_0_6px_rgba(148,163,184,0.7)]';
    }
};

export const Market: React.FC = () => {
    const { user, updateCurrency, addToSquad, removeFromSquad } = useAuthStore(); 
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [filter, setFilter] = useState('ALL');
    const [rarityFilter, setRarityFilter] = useState<string>('ALL');
    const [minOvr, setMinOvr] = useState<string>('');
    const [maxOvr, setMaxOvr] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [selectedSellId, setSelectedSellId] = useState<string | null>(null);
    const [recentBuy, setRecentBuy] = useState<{ playerId: string; listingId: string } | null>(null);

    useEffect(() => {
        setListings(MarketService.getListings());
    }, []);

    const getPlayer = (id: string) => players.find(p => p.id === id);

    const playBuySound = (rarity: string | undefined) => {
        let url = '/audio/market_standard.mp3';
        if (rarity === 'Rare') url = '/audio/market_rare.mp3';
        else if (rarity === 'Epic') url = '/audio/market_epic.mp3';
        else if (rarity === 'Iconic') url = '/audio/market_iconic.mp3';
        else if (rarity === 'Legendary') url = '/audio/market_legendary.mp3';
        AudioManager.loadAndPlay('sfx', url);
    };

    const computeTeamOvr = (squadIds: string[]) => {
        if (!squadIds || squadIds.length === 0) return 0;
        const squadPlayers = (squadIds.map(id => (players as any[]).find(p => p.id === id)).filter(p => p !== undefined) || []) as any[];
        if (!squadPlayers.length) return 0;
        const gks = squadPlayers.filter(p => p.position === 'GK');
        const fieldPlayers = squadPlayers.filter(p => p.position !== 'GK');
        const sortedGks = [...gks].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const sortedField = [...fieldPlayers].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const starting: any[] = [];
        if (sortedGks.length > 0) {
            starting.push(sortedGks[0]);
        }
        for (const p of sortedField) {
            if (starting.length >= 11) break;
            starting.push(p);
        }
        if (!starting.length) return 0;
        return Math.round(starting.reduce((acc, p) => acc + (p?.ovr || 0), 0) / starting.length);
    };

    const currentTeamOvr = user ? computeTeamOvr(user.squad || []) : 0;

    const getProjectedTeamOvr = (playerId: string) => {
        if (!user) return currentTeamOvr;
        if (user.squad.includes(playerId)) return currentTeamOvr;
        const nextIds = [...user.squad, playerId];
        return computeTeamOvr(nextIds);
    };

    const handleSell = (strategy: 'HIGH' | 'MARKET' | 'LOW') => {
        if (!user || !selectedSellId) return;
        const result = MarketService.sellPlayerWithStrategy(selectedSellId, user.uid, strategy);
        if (!result.success) {
            alert(result.message);
            return;
        }
        removeFromSquad(selectedSellId);
        setListings(MarketService.getListings());
        setSelectedSellId(null);
        alert(result.message);
    };

    const handleInstantSell = () => {
        if (!user || !selectedSellId) return;
        const result = MarketService.instantSellPlayer(
            selectedSellId,
            user.coins,
            user.diamonds
        );
        if (!result.success || result.newCoins === undefined || result.newDiamonds === undefined) {
            alert(result.message);
            return;
        }
        updateCurrency(result.newCoins, result.newDiamonds);
        removeFromSquad(selectedSellId);
        setListings(MarketService.getListings());
        setSelectedSellId(null);
        alert(result.message);
    };

    const renderSellOptions = () => {
        if (!selectedSellId) return null;
        const player = getPlayer(selectedSellId) as any | undefined;
        if (!player) return null;
        const rarity = String(player.rarity || '');
        if (rarity === 'Premium' || rarity === 'Premium Legend') {
            const instant = MarketService.getInstantSellValue(selectedSellId);
            const instantDiamonds = instant?.diamonds || 0;
            if (!instant || instantDiamonds <= 0) {
                return (
                    <div className="col-span-3 text-[10px] text-amber-200">
                        Premium and Premium Legend players cannot be listed on the coin market.
                    </div>
                );
            }
            return (
                <>
                    <div className="col-span-3 text-[10px] text-amber-200">
                        Premium and Premium Legend players cannot be listed on the coin market.
                    </div>
                    <button
                        onClick={handleInstantSell}
                        className="flex flex-col items-start px-2 py-2 rounded-lg bg-cyan-700/60 border border-cyan-400/70 text-left hover:bg-cyan-600/70 col-span-3"
                    >
                        <div className="font-bold text-[11px] text-cyan-100">
                            Instant Sell (Diamonds)
                        </div>
                        <div className="text-[11px] text-cyan-200 font-semibold">
                            {instantDiamonds.toLocaleString()} 💎
                        </div>
                        <div className="text-[9px] text-cyan-100/80 mt-1">
                            Immediate refund, reduced from premium shop value.
                        </div>
                    </button>
                </>
            );
        }
        const opts = MarketService.getSellPriceOptions(selectedSellId);
        const instant = MarketService.getInstantSellValue(selectedSellId);
        const instantCoins = instant?.coins || 0;
        const ovr = player?.ovr || 0;
        const rarityKey = player?.rarity as string | undefined;
        const diamondValue =
            rarityKey && (rarityKey === 'Premium' || rarityKey === 'Premium Legend')
                ? getBaseDiamondPrice(ovr, rarityKey)
                : 0;
        if (!opts) {
            return (
                <div className="col-span-3 text-[10px] text-red-300">
                    Unable to price this player.
                </div>
            );
        }
        const projected = getProjectedTeamOvr(selectedSellId);
        const ovrDelta = projected - currentTeamOvr;
        return (
            <>
                <button
                    onClick={() => handleSell('HIGH')}
                    className="flex flex-col items-start px-2 py-2 rounded-lg bg-amber-700/60 border border-amber-400/70 text-left hover:bg-amber-600/70"
                >
                    <div className="font-bold text-[11px] text-amber-100">High Price</div>
                    <div className="text-[11px] text-yellow-200 font-semibold">
                        {opts.high.toLocaleString()} 🪙
                    </div>
                    {diamondValue > 0 && (
                        <div className="text-[9px] text-amber-200/80">
                            Above premium value (~{diamondValue.toLocaleString()} 💎)
                        </div>
                    )}
                    <div className="text-[9px] text-amber-100/80 mt-1">Slow • Max profit</div>
                </button>
                <button
                    onClick={() => handleSell('MARKET')}
                    className="flex flex-col items-start px-2 py-2 rounded-lg bg-emerald-700/60 border border-emerald-400/70 text-left hover:bg-emerald-600/70"
                >
                    <div className="font-bold text-[11px] text-emerald-100">Market Price</div>
                    <div className="text-[11px] text-emerald-200 font-semibold">
                        {opts.market.toLocaleString()} 🪙
                    </div>
                    <div className="text-[9px] text-emerald-100/80 mt-1">Balanced • Reliable sale</div>
                </button>
                <button
                    onClick={() => handleSell('LOW')}
                    className="flex flex-col items-start px-2 py-2 rounded-lg bg-sky-700/60 border border-sky-400/70 text-left hover:bg-sky-600/70"
                >
                    <div className="font-bold text-[11px] text-sky-100">Low Price</div>
                    <div className="text-[11px] text-sky-200 font-semibold">
                        {opts.low.toLocaleString()} 🪙
                    </div>
                    <div className="text-[9px] text-sky-100/80 mt-1">Fast • Emergency coins</div>
                </button>
                <button
                    onClick={handleInstantSell}
                    className="flex flex-col items-start px-2 py-2 rounded-lg bg-red-700/70 border border-red-400/80 text-left hover:bg-red-600/80 col-span-3"
                >
                    <div className="font-bold text-[11px] text-red-100">Instant Sell (75%)</div>
                    <div className="text-[11px] text-red-200 font-semibold">
                        {instantCoins.toLocaleString()} 🪙
                    </div>
                    <div className="text-[9px] text-red-100/80 mt-1">
                        Immediate coins, skips market listing at reduced value.
                    </div>
                </button>
                <div className="col-span-3 mt-2 text-[9px] text-gray-300 flex justify-between">
                    <span>
                        Team OVR after sale: {projected} ({ovrDelta >= 0 ? '+' : ''}{ovrDelta})
                    </span>
                    <span className="text-gray-400">Chemistry: stable (identity only)</span>
                </div>
            </>
        );
    };

    const handleBuy = (listing: MarketListing) => {
        if (!user) return;
        
        if (user.squad.includes(listing.playerId)) {
            alert("You already own this player!");
            return;
        }

        if (listing.sellerId === user.uid) {
            alert("You cannot buy your own listing.");
            return;
        }

        const result = MarketService.buyPlayer(listing.id, user.coins);
        
        if (result.success && result.newCoins !== undefined) {
            updateCurrency(result.newCoins, user.diamonds);
            addToSquad(listing.playerId);
            setRecentBuy({ playerId: listing.playerId, listingId: listing.id });
            const p = getPlayer(listing.playerId) as any | undefined;
            if (p) {
                playBuySound(p.rarity as string | undefined);
            }
            
            // Refresh listings from service (handles limits & sold out)
            setListings(MarketService.getListings());
            
            alert(result.message);
        } else {
            alert(result.message);
        }
    };

    const recentPlayer = recentBuy ? (getPlayer(recentBuy.playerId) as any | undefined) : null;

    return (
        <div className="w-full h-full bg-gray-900 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        TRANSFER MARKET
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Buy and Sell Players with{' '}
                        <span className="text-yellow-400 font-bold">Coins</span>
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {user && (
                        <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col items-end">
                                <div className="flex items-center text-yellow-400 font-bold">
                                    <span className="text-[18px] mr-1">🪙</span>
                                    <span className="text-[18px]">
                                        {user.coins.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                                    Coins
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center text-cyan-400 font-bold">
                                    <span className="text-[18px] mr-1">💎</span>
                                    <span className="text-[18px]">
                                        {user.diamonds.toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[9px] text-gray-400 uppercase tracking-wider">
                                    Diamonds
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        {[
                            { key: 'ALL', label: 'All' },
                            { key: 'GK', label: 'Goalkeeper' },
                            { key: 'DEF', label: 'Defenders' },
                            { key: 'MID', label: 'Midfielders' },
                            { key: 'ATT', label: 'Attackers' }
                        ].map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded font-bold text-sm ${
                                    filter === f.key
                                        ? 'bg-yellow-500 text-black'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1.3fr] gap-4 mb-4">
                <div className="flex flex-wrap items-center gap-3 bg-gray-800/60 border border-gray-700/70 rounded-xl px-4 py-3">
                    <span className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
                        Browse
                    </span>
                    <select
                        value={rarityFilter}
                        onChange={(e) => setRarityFilter(e.target.value)}
                        className="bg-gray-900/80 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    >
                        <option value="ALL">All Rarities</option>
                        <option value="Standard">Standard</option>
                        <option value="Rare">Rare</option>
                        <option value="Epic">Epic</option>
                        <option value="Iconic">Iconic</option>
                        <option value="Legendary">Legendary</option>
                        <option value="Premium">Premium</option>
                        <option value="Premium Legend">Premium Legend</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Min OVR"
                        value={minOvr}
                        onChange={(e) => setMinOvr(e.target.value)}
                        className="w-20 bg-gray-900/80 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    />
                    <input
                        type="number"
                        placeholder="Max OVR"
                        value={maxOvr}
                        onChange={(e) => setMaxOvr(e.target.value)}
                        className="w-20 bg-gray-900/80 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    />
                    <input
                        type="number"
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-28 bg-gray-900/80 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                    />
                </div>

                {user && (
                    <div className="bg-gray-800/70 border border-gray-700/80 rounded-xl px-4 py-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-[11px] uppercase tracking-[0.24em] text-yellow-300">
                                    Sell Player
                                </div>
                                <div className="text-xs text-gray-300">
                                    List squad players for coins with risk choices.
                                </div>
                            </div>
                            <div className="text-right text-[11px] text-gray-400">
                                <div>Team OVR</div>
                                <div className="font-bold text-emerald-400 text-base">
                                    {currentTeamOvr}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <select
                                value={selectedSellId || ''}
                                onChange={(e) => setSelectedSellId(e.target.value || null)}
                                className="flex-1 bg-gray-900/80 border border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-200"
                            >
                                <option value="">Select player to sell</option>
                                {(user.squad || []).map((id) => {
                                    const p = getPlayer(id) as any | undefined;
                                    if (!p) return null;
                                    return (
                                        <option key={id} value={id}>
                                            {p.name} • {p.position} • OVR {p.ovr}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {selectedSellId && (
                            <div className="mt-1 grid grid-cols-3 gap-2 text-[10px]">
                                {renderSellOptions()}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-12 text-xs text-gray-500 font-bold uppercase tracking-wider px-4 pb-2 border-b border-gray-800">
                    <div className="col-span-4">Player</div>
                    <div className="col-span-2">OVR</div>
                    <div className="col-span-2">Pos</div>
                    <div className="col-span-2">Rarity</div>
                    <div className="col-span-2 text-right">Price / Tags</div>
                </div>

                {listings.map((listing) => {
                    const player = getPlayer(listing.playerId);
                    if (!player) return null;

                    if (filter !== 'ALL') {
                        const pos = (player.position || '').toUpperCase();
                        if (filter === 'GK' && pos !== 'GK') return null;
                        if (filter === 'DEF' && !['RB', 'CB', 'LB'].includes(pos)) return null;
                        if (
                            filter === 'MID' &&
                            ![
                                'DMF',
                                'CMF',
                                'AMF',
                                'LMF',
                                'RMF',
                                'CDM',
                                'CM',
                                'CAM',
                                'RM',
                                'LM'
                            ].includes(pos)
                        ) {
                            return null;
                        }
                        if (
                            filter === 'ATT' &&
                            !['RWF', 'LWF', 'CF', 'SS', 'RW', 'LW', 'ST'].includes(pos)
                        ) {
                            return null;
                        }
                    }

                    if (rarityFilter !== 'ALL' && String(player.rarity) !== rarityFilter) {
                        return null;
                    }

                    const minO = parseInt(minOvr || '0', 10) || 0;
                    const maxO = parseInt(maxOvr || '0', 10) || 0;
                    const maxP = parseInt(maxPrice || '0', 10) || 0;

                    if (minO > 0 && player.ovr < minO) return null;
                    if (maxO > 0 && player.ovr > maxO) return null;
                    if (maxP > 0 && listing.price > maxP) return null;

                    const analysis = MarketService.getListingAnalysis(listing);
                    const isPremium =
                        player.rarity === 'Premium' || player.rarity === 'Premium Legend';
                    const diamondValue = isPremium
                        ? getBaseDiamondPrice(
                              player.ovr,
                              player.rarity as string | undefined
                          )
                        : 0;
                    const projectedOvr = user ? getProjectedTeamOvr(listing.playerId) : 0;
                    const ovrDelta = user ? projectedOvr - currentTeamOvr : 0;

                    return (
                        <div
                            key={listing.id}
                            className="grid grid-cols-12 items-center bg-gray-800/50 hover:bg-gray-800 p-3 rounded-lg border border-gray-700/50 transition-colors group"
                        >
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <PlayerFace
                                        playerId={listing.playerId}
                                        size="sm"
                                        className="shadow-[0_0_10px_rgba(15,23,42,0.9)]"
                                    />
                                </div>
                                <span className="font-bold text-white group-hover:text-yellow-400 transition-colors">
                                    {player.name}
                                </span>
                            </div>
                            <div className="col-span-2 font-black text-lg text-gray-300">
                                {player.ovr}
                            </div>
                            <div className="col-span-2 text-sm text-gray-400">
                                {player.position}
                            </div>
                            <div className="col-span-2">
                                <span
                                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase inline-flex items-center justify-center min-w-[72px] ${getRarityBadgeClass(
                                        player.rarity as string | undefined
                                    )}`}
                                >
                                    {player.rarity}
                                </span>
                            </div>
                            <div className="col-span-2 text-right flex items-center justify-end gap-2">
                                <div className="flex flex-col items-end mr-1">
                                    <div className="flex items-center gap-1 text-[9px]">
                                        {analysis.deal === 'GOOD' && (
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-700/70 text-emerald-200 font-semibold">
                                                Good Deal
                                            </span>
                                        )}
                                        {analysis.deal === 'OVERPRICED' && (
                                            <span className="px-2 py-0.5 rounded-full bg-red-800/70 text-red-200 font-semibold">
                                                Overpriced
                                            </span>
                                        )}
                                        {analysis.deal === 'FAIR' && (
                                            <span className="px-2 py-0.5 rounded-full bg-gray-700/70 text-gray-200 font-semibold">
                                                Fair Price
                                            </span>
                                        )}
                                        {analysis.highDemand && (
                                            <span className="px-2 py-0.5 rounded-full bg-yellow-700/70 text-yellow-100 font-semibold">
                                                High Demand
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[9px] text-gray-300 mt-1">
                                        {diamondValue > 0 && (
                                            <span className="mr-2">
                                                Premium value ~
                                                {diamondValue.toLocaleString()} 💎
                                            </span>
                                        )}
                                        {user && (
                                            <span>
                                                Team OVR {currentTeamOvr}
                                                {ovrDelta !== 0 &&
                                                    ` → ${projectedOvr} (${
                                                        ovrDelta > 0 ? '+' : ''
                                                    }${ovrDelta})`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {typeof listing.limit === 'number' && (
                                    <div className="text-[10px] text-gray-300 text-right">
                                        Left:{' '}
                                        {Math.max(
                                            0,
                                            listing.limit - (listing.sold || 0)
                                        )}{' '}
                                        / {listing.limit}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleBuy(listing)}
                                    className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={!user || listing.sellerId === user.uid}
                                >
                                    {listing.price.toLocaleString()} 🪙
                                </button>
                                {user?.role === 'Owner' && (
                                    <button
                                        onClick={() => {
                                            const priceRaw =
                                                window.prompt(
                                                    'New coin price',
                                                    String(listing.price)
                                                ) || '';
                                            const limitRaw =
                                                window.prompt(
                                                    'New max buyers (empty to keep current, 0 to remove limit)',
                                                    typeof listing.limit === 'number'
                                                        ? String(listing.limit)
                                                        : ''
                                                ) || '';
                                            const newPrice =
                                                parseInt(priceRaw || '0', 10) || 0;
                                            if (newPrice <= 0) {
                                                alert('Price must be greater than 0');
                                                return;
                                            }
                                            let newLimit: number | undefined =
                                                listing.limit;
                                            if (limitRaw.trim() === '0') {
                                                newLimit = undefined;
                                            } else if (limitRaw.trim() !== '') {
                                                const parsed =
                                                    parseInt(limitRaw || '0', 10) || 0;
                                                newLimit =
                                                    parsed > 0 ? parsed : undefined;
                                            }
                                            const updated =
                                                MarketService.updateListing(
                                                    listing.id,
                                                    newPrice,
                                                    newLimit
                                                );
                                            setListings(updated);
                                        }}
                                        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-200 font-semibold"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {recentPlayer && (
                <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
                    <div className="purchase-anim-overlay relative">
                        <div className="purchase-anim-card relative w-48 h-[260px] rounded-2xl border-2 mx-auto p-4 flex flex-col items-center justify-between bg-gray-900 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                            <div className="w-full flex items-center justify-between">
                                <div className="text-2xl font-black text-white">
                                    {recentPlayer.ovr}
                                </div>
                                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-200">
                                    {recentPlayer.position}
                                </div>
                            </div>
                            <div className="mt-2 mb-2 flex items-center justify-center">
                                <PlayerFace playerId={recentPlayer.id} size="lg" className="shadow-[0_0_16px_rgba(15,23,42,0.95)]" />
                            </div>
                            <div className="w-full text-center">
                                <div className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                                    Purchased
                                </div>
                                <div className="text-sm font-black text-white truncate px-1">
                                    {recentPlayer.name}
                                </div>
                            </div>
                            <div className="purchase-anim-coins" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
