import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PremiumShopService } from '../../services/shop/PremiumShopService';
import { ShopItem } from '../../types/economy';
import { useAuthStore } from '../../store/useAuthStore';
import players from '../../data/players.json';
import { PackOpener } from './PackOpener';
import { PlayerFace } from '../common/PlayerFace';
import { getBaseDiamondPrice } from '../../data/rarities';
import { AudioManager } from '../../services/audioManager';

type PackMode = 'ALL' | 'ADMIN_ABUSE';

const getPremiumCardClass = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'bg-gradient-to-br from-yellow-900 via-black to-yellow-950 border-yellow-400 shadow-[0_0_35px_rgba(250,204,21,0.85)] hover:border-yellow-300';
        case 'Premium':
            return 'bg-gradient-to-br from-cyan-900 via-slate-900 to-black border-cyan-400 shadow-[0_0_26px_rgba(34,211,238,0.85)] hover:border-cyan-300';
        default:
            return 'bg-gray-800 border-gray-700 hover:border-cyan-500';
    }
};

const getPremiumBadgeClass = (rarity: string | undefined) => {
    switch (rarity) {
        case 'Premium Legend':
            return 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.9)]';
        case 'Premium':
            return 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(34,211,238,0.85)]';
        default:
            return 'bg-gray-700 text-gray-300';
    }
};

export const PremiumShop: React.FC = () => {
    const { user, updateCurrency, addToSquad, unlockCelebration } = useAuthStore();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [timeLeft, setTimeLeft] = useState('');
    const [showPack, setShowPack] = useState(false);
    const [packMode, setPackMode] = useState<PackMode>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [addSearch, setAddSearch] = useState('');
    const [selectedAddPlayerId, setSelectedAddPlayerId] = useState('');
    const [addPrice, setAddPrice] = useState('');
    const [addLimit, setAddLimit] = useState('');
    const location = useLocation();
    const [recentPurchase, setRecentPurchase] = useState<ShopItem | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const hasPacks = params.get('packs') === '1';
        if (hasPacks) {
            setShowPack(true);
            setPackMode(params.get('admin_abuse') === '1' ? 'ADMIN_ABUSE' : 'ALL');
        } else {
            setShowPack(false);
            setPackMode('ALL');
        }
    }, [location.search]);

    useEffect(() => {
        const state = PremiumShopService.getShopState();
        setItems(state.items);

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = state.nextReset - now;
            
            if (diff <= 0) {
                const newState = PremiumShopService.getShopState();
                setItems(newState.items);
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft(`${days}d ${hours}h`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const allPlayers = players as any[];
    const premiumPlayers = allPlayers.filter(p => {
        const rarity = String((p as any).rarity || '');
        return rarity === 'Premium' || rarity === 'Premium Legend';
    });

    const filteredPremiumPlayers = premiumPlayers.filter(p => {
        const term = addSearch.trim().toLowerCase();
        if (!term) return true;
        const name = String((p as any).name || '').toLowerCase();
        const id = String((p as any).id || '').toLowerCase();
        return name.includes(term) || id.includes(term);
    });

    const selectedAddPlayer = premiumPlayers.find(p => (p as any).id === selectedAddPlayerId);
    const selectedRarity = selectedAddPlayer ? String((selectedAddPlayer as any).rarity || '') : '';
    const selectedOvr = selectedAddPlayer ? Number((selectedAddPlayer as any).ovr || 0) : 0;
    const suggestedPrice = getBaseDiamondPrice(selectedOvr, selectedRarity);
    const existingShopItem = selectedAddPlayer
        ? items.find(i => i.type === 'Player' && i.contentId === (selectedAddPlayer as any).id)
        : undefined;

    const playPremiumSound = (rarity: string | undefined) => {
        let url = '/audio/premium_standard.mp3';
        if (rarity === 'Premium') url = '/audio/premium_premium.mp3';
        else if (rarity === 'Premium Legend') url = '/audio/premium_legend.mp3';
        AudioManager.loadAndPlay('sfx', url);
    };

    const handleBuy = (item: ShopItem) => {
        if (!user) return;

        if (item.type === 'Player' && user.squad.includes(item.contentId)) {
            alert('You already own this player!');
            return;
        }
        if (item.type === 'Skill') {
            const owned = user.ownedCelebrations || [];
            if (owned.includes(item.contentId)) {
                alert('You already own this celebration!');
                return;
            }
        }

        if (item.type === 'Player' && user.squad.includes(item.contentId)) {
            alert('You already own this player!');
            return;
        }

        const usesDiamonds = item.currency === 'Diamonds';
        const priceLabel = usesDiamonds ? 'Diamonds' : 'Coins';
        const hasEnoughCurrency = usesDiamonds ? user.diamonds >= item.price : user.coins >= item.price;

        if (!hasEnoughCurrency) {
            alert(`Not enough ${priceLabel}!`);
            return;
        }

        if (confirm(`Purchase ${item.type === 'Skill' ? 'celebration' : item.contentId} for ${item.price} ${priceLabel}?`)) {
            const nextCoins = usesDiamonds ? user.coins : user.coins - item.price;
            const nextDiamonds = usesDiamonds ? user.diamonds - item.price : user.diamonds;
            updateCurrency(nextCoins, nextDiamonds);

            if (item.type === 'Player') {
                addToSquad(item.contentId);
                const p = allPlayers.find(x => (x as any).id === item.contentId) as any | undefined;
                if (p) {
                    playPremiumSound(p.rarity as string | undefined);
                }
            } else if (item.type === 'Skill') {
                unlockCelebration(item.contentId);
            }

            const updatedState = PremiumShopService.registerPurchase(item.id);
            setItems(updatedState.items);

            setRecentPurchase(item);
            alert('Purchase Successful!');
        }
    };

    const getPlayerDetails = (id: string) => players.find(p => p.id === id);

    const getCelebrationLabel = (id: string) => {
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

    if (showPack) {
        return (
            <div className="relative w-full h-full">
                <button
                    onClick={() => setShowPack(false)}
                    className="absolute top-4 left-4 z-50 px-4 py-2 bg-gray-800 rounded text-white font-bold hover:bg-gray-700"
                >
                    ← Back
                </button>
                <PackOpener
                    defaultPackId={packMode === 'ADMIN_ABUSE' ? 'ADMIN_ABUSE' : 'STANDARD'}
                    restrictToAdminAbuse={packMode === 'ADMIN_ABUSE'}
                />
            </div>
        );
    }

    const recentPlayer = recentPurchase && recentPurchase.type === 'Player'
        ? (allPlayers.find(p => (p as any).id === recentPurchase.contentId) as any | undefined)
        : null;

    return (
        <div className="w-full min-h-[420px] bg-gray-900 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                        PREMIUM SHOP
                    </h1>
                    <p className="text-gray-400 text-sm">Server Reset In: <span className="text-yellow-400 font-mono">{timeLeft}</span></p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-stretch justify-end">
                    <div className="menu-card relative rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-slate-900 border border-purple-400/70 overflow-hidden shadow-lg shadow-purple-500/30">
                        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,_#ffffff,_transparent_60%)]"></div>
                        <div className="relative flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-200 via-purple-400 to-fuchsia-500 flex items-center justify-center border border-white/40">
                                <span className="text-xl text-slate-900">📦</span>
                            </div>
                            <div className="flex flex-col">
                                <div className="text-[10px] uppercase tracking-[0.25em] text-purple-100">
                                    Packs
                                </div>
                                <button
                                    onClick={() => setShowPack(true)}
                                    className="mt-1 px-3 py-1 rounded-full bg-purple-500 hover:bg-purple-400 text-[11px] font-bold text-white tracking-wide"
                                >
                                    Open Packs
                                </button>
                            </div>
                        </div>
                    </div>

                    {user && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border border-yellow-500/60">
                                <span className="text-sm">💎</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-yellow-300 uppercase font-bold tracking-wider">Diamonds</span>
                                    <span className="text-sm font-bold text-yellow-100">{user.diamonds.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-black/40 rounded-lg border border-yellow-400/80">
                                <span className="text-sm">👑</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-yellow-200 uppercase font-bold tracking-wider">Legend Tokens</span>
                                    <span className="text-sm font-bold text-yellow-100">{user.legendTokens ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.role === 'Owner' && (
                        <div className="flex flex-col gap-2 items-end">
                            <button 
                                onClick={() => {
                                    const newState = PremiumShopService.forceReset();
                                    setItems(newState.items);
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded text-xs uppercase"
                            >
                                Force Reset (Owner)
                            </button>
                            <button
                                onClick={() => {
                                    if (premiumPlayers.length === 0) {
                                        alert('No Premium or Premium Legend players found');
                                        return;
                                    }
                                    const first = premiumPlayers[0] as any;
                                    const rarity = String(first.rarity || '');
                                    const ovr = Number(first.ovr || 0);
                                    const base = getBaseDiamondPrice(ovr, rarity);
                                    const existing = items.find(i => i.type === 'Player' && i.contentId === first.id);
                                    const startingPrice = existing ? existing.price : base;
                                    setSelectedAddPlayerId(first.id);
                                    setAddPrice(startingPrice > 0 ? String(startingPrice) : '');
                                    setAddLimit('');
                                    setAddSearch('');
                                    setShowAddModal(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs uppercase"
                            >
                                Add Premium Player
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map(item => {
                    const player = item.type === 'Player' ? getPlayerDetails(item.contentId) : null;
                    const rarity = player?.rarity as string | undefined;

                    return (
                        <div
                            key={item.id}
                            className={`relative rounded-xl overflow-hidden border-2 group hover:scale-[1.02] transition-transform ${getPremiumCardClass(rarity)}`}
                        >
                            {rarity === 'Premium Legend' && <div className="absolute inset-0 bg-yellow-500/10 animate-pulse"></div>}

                            <div className="p-4 relative z-10">
                                {item.type === 'Player' && player ? (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getPremiumBadgeClass(rarity)}`}>
                                                {player.rarity}
                                            </span>
                                            <span className="text-2xl font-black text-white">{player.ovr}</span>
                                        </div>
                                        <div className="h-32 flex items-center justify-center bg-gray-900/60 rounded-lg mb-4">
                                            <PlayerFace
                                                playerId={player.id}
                                                size="lg"
                                                className="shadow-[0_0_18px_rgba(15,23,42,0.95)]"
                                            />
                                        </div>
                                        <h3 className="text-lg font-bold text-white truncate">{player.name}</h3>
                                        <p className="text-sm text-gray-400">{player.position}</p>
                                    </>
                                ) : null}

                                {item.type === 'Skill' && (
                                    <div className="h-40 flex flex-col items-center justify-center text-center text-gray-200">
                                        <div className="text-sm font-semibold text-cyan-300 mb-1">
                                            Celebration Unlock
                                        </div>
                                        <div className="text-lg font-bold text-white">
                                            {getCelebrationLabel(item.contentId)}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400">
                                            Unlocks a new goal celebration animation.
                                        </div>
                                    </div>
                                )}

                                {item.type !== 'Player' && item.type !== 'Skill' && (
                                    <div className="h-40 flex items-center justify-center text-gray-500">
                                        {item.type} Item
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-900/80 border-t border-gray-700 flex items-center justify-between gap-2">
                                {typeof item.stock === 'number' && (
                                    <div className="text-[10px] text-gray-300">
                                        Left: {item.stock}
                                    </div>
                                )}
                                <button
                                    onClick={() => handleBuy(item)}
                                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center justify-center gap-2"
                                >
                                    <span>{item.currency === 'Diamonds' ? '💎' : '🪙'}</span>
                                    {item.price.toLocaleString()}
                                </button>
                                {user?.role === 'Owner' && (
                                    <button
                                        onClick={() => {
                                            const priceRaw = window.prompt('New Diamond price', String(item.price)) || '';
                                            const limitRaw = window.prompt('New max buyers (empty to keep current, 0 to remove limit)', typeof item.stock === 'number' ? String(item.stock) : '') || '';
                                            const newPrice = parseInt(priceRaw || '0', 10) || 0;
                                            if (newPrice <= 0) {
                                                alert('Price must be greater than 0');
                                                return;
                                            }
                                            let newStock: number | undefined = item.stock;
                                            if (limitRaw.trim() === '0') {
                                                newStock = undefined;
                                            } else if (limitRaw.trim() !== '') {
                                                const parsed = parseInt(limitRaw || '0', 10) || 0;
                                                newStock = parsed > 0 ? parsed : undefined;
                                            }
                                            const newState = PremiumShopService.updateItemPriceAndStock(item.id, newPrice, newStock);
                                            setItems(newState.items);
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
                        <div className="purchase-anim-card relative w-56 h-[280px] rounded-2xl border-2 mx-auto p-4 flex flex-col items-center justify-between bg-gradient-to-br from-cyan-900 via-slate-900 to-black border-cyan-400 shadow-[0_0_36px_rgba(34,211,238,0.85)]">
                            <div className="w-full flex items-center justify-between">
                                <div className="text-3xl font-black text-white">
                                    {recentPlayer.ovr}
                                </div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                                    {recentPlayer.position}
                                </div>
                            </div>
                            <div className="mt-3 mb-3 flex items-center justify-center">
                                <PlayerFace playerId={recentPlayer.id} size="lg" className="shadow-[0_0_22px_rgba(15,23,42,0.95)]" />
                            </div>
                            <div className="w-full text-center">
                                <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                                    Premium Purchase
                                </div>
                                <div className="text-base font-black text-white truncate px-1">
                                    {recentPlayer.name}
                                </div>
                            </div>
                            <div className={recentPurchase?.currency === 'Diamonds' ? 'purchase-anim-diamonds' : 'purchase-anim-coins'} />
                        </div>
                    </div>
                </div>
            )}

            {user?.role === 'Owner' && showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
                    <div className="w-full max-w-lg bg-gray-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Add Premium Player</div>
                                <div className="text-[11px] text-gray-400">Select a Premium or Premium Legend and set price and limit</div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                }}
                                className="text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="block text-gray-300 text-xs font-semibold uppercase">Search Player</label>
                                <input
                                    type="text"
                                    value={addSearch}
                                    onChange={(e) => setAddSearch(e.target.value)}
                                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                    placeholder="Type name or ID"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-gray-300 text-xs font-semibold uppercase">Player</label>
                                <select
                                    value={selectedAddPlayerId}
                                    onChange={(e) => {
                                        const id = e.target.value;
                                        setSelectedAddPlayerId(id);
                                        const p = premiumPlayers.find(x => (x as any).id === id) as any | undefined;
                                        if (p) {
                                            const rarity = String(p.rarity || '');
                                            const ovr = Number(p.ovr || 0);
                                            const base = getBaseDiamondPrice(ovr, rarity);
                                            const existing = items.find(i => i.type === 'Player' && i.contentId === p.id);
                                            const startingPrice = existing ? existing.price : base;
                                            setAddPrice(startingPrice > 0 ? String(startingPrice) : '');
                                        }
                                    }}
                                    className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                >
                                    {filteredPremiumPlayers.map(p => {
                                        const anyP = p as any;
                                        return (
                                            <option key={anyP.id} value={anyP.id}>
                                                {anyP.name} ({anyP.rarity}) • OVR {anyP.ovr}
                                            </option>
                                        );
                                    })}
                                    {filteredPremiumPlayers.length === 0 && (
                                        <option value="">No players match this search</option>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="block text-gray-300 text-xs font-semibold uppercase">Price (Diamonds)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addPrice}
                                        onChange={(e) => setAddPrice(e.target.value)}
                                        className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                        placeholder={suggestedPrice > 0 ? String(suggestedPrice) : '0'}
                                    />
                                    <div className="text-[10px] text-gray-400">
                                        {existingShopItem
                                            ? `Current shop price: ${existingShopItem.price.toLocaleString()} 💎`
                                            : suggestedPrice > 0
                                                ? `Suggested price from stats: ${suggestedPrice.toLocaleString()} 💎`
                                                : 'Enter a Diamond price for this player'}
                                    </div>
                                    {addPrice && (
                                        <div className="text-[10px] text-emerald-300">
                                            New price: {Number(addPrice || '0').toLocaleString()} 💎
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-gray-300 text-xs font-semibold uppercase">Limit (Max buyers)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={addLimit}
                                        onChange={(e) => setAddLimit(e.target.value)}
                                        className="w-full bg-gray-900/70 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="Empty = unlimited"
                                    />
                                    <div className="text-[10px] text-gray-400">
                                        Leave empty for unlimited. Use 100 to limit to 100 buyers, etc.
                                    </div>
                                </div>
                            </div>

                            {selectedAddPlayer && (
                                <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-[11px] text-gray-200 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">
                                            {(selectedAddPlayer as any).name} ({selectedRarity || 'Premium'})
                                        </div>
                                        <div className="text-gray-400">
                                            OVR {selectedOvr} • ID {(selectedAddPlayer as any).id}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 rounded-lg border border-gray-600 text-sm text-gray-200 hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedAddPlayerId) {
                                        alert('Select a player');
                                        return;
                                    }
                                    const price = parseInt(addPrice || '0', 10) || 0;
                                    if (price <= 0) {
                                        alert('Price must be greater than 0');
                                        return;
                                    }
                                    let stock: number | undefined = undefined;
                                    if (addLimit.trim() !== '') {
                                        const limitParsed = parseInt(addLimit || '0', 10) || 0;
                                        if (limitParsed > 0) {
                                            stock = limitParsed;
                                        }
                                    }
                                    try {
                                        const newState = PremiumShopService.addManualPlayerItem(selectedAddPlayerId, price, stock);
                                        setItems(newState.items);
                                        setShowAddModal(false);
                                    } catch (e: any) {
                                        alert(e?.message || 'Failed to add player');
                                    }
                                }}
                                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-black tracking-wide"
                            >
                                Add to Premium Shop
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
