import { create } from 'zustand';

interface GameSettings {
    graphicsQuality: 'LOW' | 'MEDIUM' | 'HIGH';
    soundEnabled: boolean;
    musicEnabled: boolean;
    aiDifficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    fpsLimit: 30 | 60;
    masterVolume: number;
    commentaryEnabled: boolean;
    commentaryLanguage: 'en' | 'es' | 'pt' | 'fr' | 'de' | 'it' | 'ar' | 'hi' | 'ja' | 'zh';
    commentaryIntensity: 'CALM' | 'BALANCED' | 'ENERGETIC';
    commentaryFrequency: 'KEY' | 'ALL';
    commentaryExplainBigMoments: boolean;
    commentaryCrowdBalance: number;
    virtualStickEnabled: boolean;
    autoSwitchingEnabled: boolean;
}

type MatchMode = 'KICKOFF' | 'FRIEND_PVP';

interface GameStateOpponent {
    uid: string;
    username: string;
    squad: string[];
}

interface GameState {
    isPlaying: boolean;
    settings: GameSettings;
    mode: MatchMode;
    opponent: GameStateOpponent | null;
    startGame: () => void;
    startFriendMatch: (opponent: GameStateOpponent) => void;
    endGame: () => void;
    updateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const useGameStore = create<GameState>((set) => ({
    isPlaying: false,
    settings: {
        graphicsQuality: 'HIGH',
        soundEnabled: true,
        musicEnabled: true,
        aiDifficulty: 'INTERMEDIATE',
        fpsLimit: 60,
        masterVolume: 0.8,
        commentaryEnabled: true,
        commentaryLanguage: 'en',
        commentaryIntensity: 'BALANCED',
        commentaryFrequency: 'KEY',
        commentaryExplainBigMoments: true,
        commentaryCrowdBalance: 0.5,
        virtualStickEnabled: true,
        autoSwitchingEnabled: true
    },
    mode: 'KICKOFF',
    opponent: null,
    startGame: () => set({
        isPlaying: true,
        mode: 'KICKOFF',
        opponent: null
    }),
    startFriendMatch: (opponent) => set({
        isPlaying: true,
        mode: 'FRIEND_PVP',
        opponent
    }),
    endGame: () => set({
        isPlaying: false,
        mode: 'KICKOFF',
        opponent: null
    }),
    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    }))
}));
