import { create } from 'zustand';
import { AuthState, PlayerForgeState } from '../types/user';
import { AuthService } from '../services/authService';
import { PackService } from '../services/shop/PackService';

interface ExtendedAuthState extends AuthState {
    updateCurrency: (coins: number, diamonds: number) => void;
    updateForge: (forgeMaterials: number, forgeState: Record<string, PlayerForgeState>) => void;
    addToSquad: (playerId: string) => void;
    removeFromSquad: (playerId: string) => void;
    unlockCelebration: (celebrationId: string) => void;
    swapSquadPlayers: (aId: string, bId: string) => void;
    setFormation: (formationId: string) => void;
    equipBadge: (badgeId: string) => void;
    autoPickSquad: (starterIds: string[]) => void;
    adminGift: (targetUsername: string, payload: { coins?: number; diamonds?: number; playerIds?: string[] }) => Promise<void>;
    deleteAccount: () => Promise<void>;
    applyMatchRewards: (payload: {
        baseCoins: number;
        baseDiamonds?: number;
        includeFirstMatchBonus?: boolean;
        includeFirstWinBonus?: boolean;
        isWin?: boolean;
        isDraw?: boolean;
        goalsFor?: number;
        goalsAgainst?: number;
        teamOvr?: number;
        isCompetitive?: boolean;
    }) => void;
}

const AUTH_KEY = 'mrn_current_user';
const DEVICE_ACCOUNT_KEY = 'mrn_device_has_account';
const DATA_VERSION_KEY = 'mrn_data_version';
const CURRENT_DATA_VERSION = 'v1_force_reset_2026_02_05'; // Bump this to force global logout

const STARTER_IDS = [
    'PLAYER_001', 'PLAYER_002', 'PLAYER_003', 'PLAYER_004', 'PLAYER_005',
    'PLAYER_006', 'PLAYER_007', 'PLAYER_008', 'PLAYER_009', 'PLAYER_010', 'PLAYER_011'
];

const getInitialAuthState = (): { user: AuthState['user']; isAuthenticated: boolean } => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return { user: null, isAuthenticated: false };
    }
    try {
        // Check Data Version for forced reset
        const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
        if (storedVersion !== CURRENT_DATA_VERSION) {
            console.log('Data version mismatch. Forcing global logout and reset.');
            localStorage.clear();
            localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
            return { user: null, isAuthenticated: false };
        }

        const raw = localStorage.getItem(AUTH_KEY);
        if (!raw) return { user: null, isAuthenticated: false };
        const parsed = JSON.parse(raw);
        if (parsed && parsed.uid && parsed.username) {
            const withPacks = PackService.applyPendingResultsOnBoot(parsed);
            if (withPacks !== parsed) {
                localStorage.setItem(AUTH_KEY, JSON.stringify(withPacks));
            }
            return { user: withPacks, isAuthenticated: true };
        }
        return { user: null, isAuthenticated: false };
    } catch {
        return { user: null, isAuthenticated: false };
    }
};

const persistUser = (user: AuthState['user']) => {
    if (!user) return;
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } catch {
    }
};

export const useAuthStore = create<ExtendedAuthState>((set, get) => {
    const initial = getInitialAuthState();
    return {
        user: initial.user,
        isAuthenticated: initial.isAuthenticated,
        isLoading: false,

        login: async (email, password) => {
            set({ isLoading: true });
            try {
                const baseUser = await AuthService.login(email, password);
                let user = baseUser;
                if (!baseUser.firstLoginRewardClaimed) {
                    const coins = (baseUser.coins || 0) + 15000;
                    const diamonds = (baseUser.diamonds || 0) + 25;
                    user = {
                        ...baseUser,
                        coins,
                        diamonds,
                        firstLoginRewardClaimed: true
                    };
                    AuthService.updateUserProfile(user).catch(() => {});
                }
                set({ user, isAuthenticated: true, isLoading: false });
                persistUser(user);
            } catch (error) {
                set({ isLoading: false });
                throw error;
            }
        },

        signup: async (email, password, username) => {
            set({ isLoading: true });
            try {
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                    const flag = localStorage.getItem(DEVICE_ACCOUNT_KEY);
                    if (flag === '1') {
                        set({ isLoading: false });
                        throw new Error('This device already has an account');
                    }
                }
                const baseUser = await AuthService.signup(email, password, username);
                const coins = (baseUser.coins || 0) + 15000;
                const diamonds = (baseUser.diamonds || 0) + 25;
                const user = {
                    ...baseUser,
                    coins,
                    diamonds,
                    firstLoginRewardClaimed: true
                };
                AuthService.updateUserProfile(user).catch(() => {});
                set({ user, isAuthenticated: true, isLoading: false });
                persistUser(user);
                if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                    localStorage.setItem(DEVICE_ACCOUNT_KEY, '1');
                }
            } catch (error) {
                set({ isLoading: false });
                throw error;
            }
        },

        logout: () => {
            AuthService.logout();
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                localStorage.removeItem(AUTH_KEY);
            }
            set({ user: null, isAuthenticated: false });
        },

        updateCurrency: (coins, diamonds) => {
            set((state) => {
                if (!state.user) return state;
                const updated = {
                    ...state.user,
                    coins,
                    diamonds
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        updateForge: (forgeMaterials, forgeState) => {
            set((state) => {
                if (!state.user) return state;
                const updated = {
                    ...state.user,
                    forgeMaterials,
                    forgeState
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        addToSquad: (playerId) => {
            set((state) => {
                if (!state.user) return state;
                if (state.user.squad.includes(playerId)) {
                    return state;
                }
                const updated = {
                    ...state.user,
                    squad: [...state.user.squad, playerId]
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        unlockCelebration: (celebrationId) => {
            set((state) => {
                if (!state.user) return state;
                const owned = state.user.ownedCelebrations || [];
                if (owned.includes(celebrationId)) {
                    return state;
                }
                const updated = {
                    ...state.user,
                    ownedCelebrations: [...owned, celebrationId]
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        removeFromSquad: (playerId) => {
            set((state) => {
                if (!state.user) return state;
                if (STARTER_IDS.includes(playerId)) {
                    return state;
                }
                const updated = {
                    ...state.user,
                    squad: state.user.squad.filter(id => id !== playerId)
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        swapSquadPlayers: (aId, bId) => {
            set((state) => {
                if (!state.user) return state;
                const squad = [...state.user.squad];
                const idxA = squad.indexOf(aId);
                const idxB = squad.indexOf(bId);
                if (idxA === -1 || idxB === -1) {
                    return state;
                }
                const next = [...squad];
                const temp = next[idxA];
                next[idxA] = next[idxB];
                next[idxB] = temp;
                const updated = {
                    ...state.user,
                    squad: next
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        setFormation: (formationId) => {
            set((state) => {
                if (!state.user) return state;
                const updated = {
                    ...state.user,
                    selectedFormationId: formationId
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        equipBadge: (badgeId) => {
            set((state) => {
                if (!state.user) return state;
                const updated = {
                    ...state.user,
                    equippedBadgeId: badgeId
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        applyMatchRewards: (payload) => {
            set((state) => {
                if (!state.user) return state;
                const currentCoins = state.user.coins || 0;
                const currentDiamonds = state.user.diamonds || 0;
                const baseCoins = payload.baseCoins;
                const baseDiamonds = payload.baseDiamonds || 0;
                let coinsFromMatch = 0;
                let diamondsFromMatch = 0;
                let firstMatchRewardClaimed = state.user.firstMatchRewardClaimed || false;
                let firstWinRewardClaimed = state.user.firstWinRewardClaimed || false;
                const isWin = !!payload.isWin;
                const isDraw = !!payload.isDraw;
                const goalsFor = typeof payload.goalsFor === 'number' ? payload.goalsFor : 0;
                const goalsAgainst = typeof payload.goalsAgainst === 'number' ? payload.goalsAgainst : 0;
                const teamOvr = typeof payload.teamOvr === 'number' ? payload.teamOvr : 0;
                const isCompetitive = !!payload.isCompetitive;

                const winBonus = isWin ? 100 : isDraw ? 60 : 30;
                const goalBonus = goalsFor * 35;
                const cleanSheetBonus = goalsAgainst === 0 ? 40 : 0;
                const defenseBonus = goalsAgainst <= 1 ? 20 : 0;
                const ovrMultiplier = teamOvr > 0 ? 1 + Math.min(0.25, (teamOvr - 80) * 0.005) : 1;

                coinsFromMatch = Math.round((baseCoins + winBonus + goalBonus + cleanSheetBonus + defenseBonus) * ovrMultiplier);

                const now = Date.now();
                let winStreak = state.user.winStreak || 0;
                if (isWin) {
                    winStreak += 1;
                } else if (!isDraw) {
                    winStreak = 0;
                }

                if (isCompetitive) {
                    const streakBonusChance = Math.min(0.2, winStreak * 0.03);
                    const baseDiamondChance = isWin ? 0.15 : isDraw ? 0.08 : 0.03;
                    const chance = baseDiamondChance + streakBonusChance;
                    const roll = Math.random();
                    if (roll < chance) {
                        const minDiamonds = 100;
                        const maxDiamonds = 200;
                        diamondsFromMatch = minDiamonds + Math.floor(Math.random() * (maxDiamonds - minDiamonds + 1));
                    }
                }

                if (payload.includeFirstMatchBonus && !firstMatchRewardClaimed) {
                    coinsFromMatch += 5000;
                    diamondsFromMatch += 10;
                    firstMatchRewardClaimed = true;
                }
                if (payload.includeFirstWinBonus && !firstWinRewardClaimed) {
                    diamondsFromMatch += 5;
                    firstWinRewardClaimed = true;
                }
                const updated = {
                    ...state.user,
                    coins: currentCoins + baseCoins + coinsFromMatch,
                    diamonds: currentDiamonds + baseDiamonds + diamondsFromMatch,
                    firstMatchRewardClaimed,
                    firstWinRewardClaimed,
                    winStreak,
                    lastMatchResultAt: now
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        autoPickSquad: (starterIds) => {
            set((state) => {
                if (!state.user) return state;
                // Move starterIds to the front of the squad array
                const currentSquad = [...state.user.squad];
                const newSquad = [...starterIds];
                
                // Add remaining players who aren't in the new starters
                for (const id of currentSquad) {
                    if (!newSquad.includes(id)) {
                        newSquad.push(id);
                    }
                }

                const updated = {
                    ...state.user,
                    squad: newSquad
                };
                persistUser(updated);
                AuthService.updateUserProfile(updated).catch(() => {});
                return {
                    user: updated
                };
            });
        },

        adminGift: async (targetUsername, payload) => {
            const state = get();
            if (!state.user) {
                throw new Error('Not authenticated');
            }
            const updated = await AuthService.giftToUser(state.user, targetUsername, payload);
            if (updated.username.toLowerCase() === state.user.username.toLowerCase()) {
                persistUser(updated);
                set({ user: updated });
            }
        },

        loginWithGoogle: async () => {
            set({ isLoading: true });
            try {
                const result = await AuthService.loginWithGoogle();
                if (result.success && result.user) {
                    set({ user: result.user, isAuthenticated: true, isLoading: false });
                    persistUser(result.user);
                } else {
                    set({ isLoading: false });
                    throw new Error(result.error || 'Google login failed');
                }
            } catch (error) {
                set({ isLoading: false });
                throw error;
            }
        },

        resetPassword: async (email) => {
            set({ isLoading: true });
            try {
                await AuthService.resetPassword(email);
                set({ isLoading: false });
            } catch (error) {
                set({ isLoading: false });
                throw error;
            }
        },

        deleteAccount: async () => {
            set({ isLoading: true });
            try {
                const state = get();
                if (state.user) {
                    await AuthService.deleteAccount(state.user.uid);
                    // Clear local storage completely to allow fresh signup
                    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                        localStorage.removeItem(DEVICE_ACCOUNT_KEY);
                        localStorage.removeItem(AUTH_KEY);
                    }
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            } catch (error) {
                set({ isLoading: false });
                throw error;
            }
        }
    };
});
