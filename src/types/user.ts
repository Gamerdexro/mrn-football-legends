export type UserRole = 'Owner' | 'Admin' | 'Player';

export interface PlayerForgeState {
    level: number;
    skillRefinement?: 'LONG_SHOTS' | 'TACKLING' | 'SKILL_WINDOW' | null;
    traits?: string[];
}

export interface UserProfile {
    uid: string;
    email: string;
    username: string;
    displayName?: string;
    role: UserRole;
    coins: number;
    diamonds: number;
    gems?: number; // Legacy alias for diamonds
    level?: number;
    createdAt: number;
    squad: string[];
    friends?: string[];
    ownedCelebrations?: string[];
    friendRequestsSent?: string[];
    friendRequestsReceived?: string[];
    deviceId?: string;
    goals?: number;
    wins?: number;
    matchesPlayed?: number;
    weeklyGoals?: number;
    weeklyWins?: number;
    weeklyMatches?: number;
    forgeMaterials?: number;
    // Currencies
    trainingPoints?: number;
    eventTokens?: number;
    seasonTokens?: number;
    skillTokens?: number;
    rankPoints?: number;
    legendTokens?: number;
    forgeState?: Record<string, PlayerForgeState>;
    selectedFormationId?: string;
    equippedBadgeId?: string;
    firstLoginRewardClaimed?: boolean;
    firstMatchRewardClaimed?: boolean;
    firstWinRewardClaimed?: boolean;
    winStreak?: number;
    lastMatchResultAt?: number;
}

export interface AuthState {
    user: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, username: string) => Promise<void>;
    logout: () => void;
    loginWithGoogle?: () => Promise<void>;
    resetPassword?: (email: string) => Promise<void>;
}
