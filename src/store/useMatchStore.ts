import { create } from 'zustand';
import { MatchPlayer, Stadium, MatchRules } from '../types/match';

type TeamId = 'HOME' | 'AWAY';
type TeamPhase = 'ATTACK' | 'DEFEND' | 'TRANSITION';

type CelebrationType =
    | 'FIST_PUMP'
    | 'KNEE_SLIDE'
    | 'ARMS_WIDE_RUN'
    | 'CALM_DOWN'
    | 'POINT_BADGE'
    | 'PHONE_CALL'
    | 'MASK_FACE'
    | 'SALUTE'
    | 'SLIDE_POINT'
    | 'JUMP_CHEST_THUMP'
    | 'RUNNING_SPIN'
    | 'SHUSH'
    | 'TEAMMATE_HUG'
    | 'GROUP_HUDDLE'
    | 'BOW'
    | 'SIT_DOWN'
    | 'SLIDE_CAMERA'
    | 'FLEX'
    | 'POINT_SKY'
    | 'SIGNATURE';

interface CelebrationState {
    active: boolean;
    type: CelebrationType | null;
    team: 'HOME' | 'AWAY' | null;
    startedAt: number;
    duration: number;
    comboStep?: number;
    maxSteps?: number;
    sequence?: CelebrationType[];
    windowEndsAt?: number;
    bonusEarned?: boolean;
}

export type MatchPhase = 
    | 'PRELOAD' 
    | 'TEAM_SETUP' 
    | 'STADIUM_LOAD' 
    | 'MATCH_START' 
    | 'LIVE_PLAY' 
    | 'MATCH_END' 
    | 'RESULT_SCREEN'
    | 'in-play'
    | 'countdown'
    | 'half-time'
    | 'full-time'
    | 'penalty';

interface MatchState {
    // Game state
    matchPhase: MatchPhase;
    isLive: boolean;
    isPaused: boolean;
    
    // Scoreboard
    scoreHome: number;
    scoreAway: number;
    homeGoals: number;
    awayGoals: number;
    
    // Time
    matchTime: number;
    currentTime: number;
    
    // Ball state
    ballState: 'IN_PLAY' | 'GOAL' | 'THROW_IN' | 'CORNER' | 'GOAL_KICK';
    ballPosition: [number, number, number];
    ball: { position: [number, number, number] };
    lastTouchTeam: TeamId;
    ballOwnerId: string | null;
    teamInPossession: TeamId | null;
    
    // Teams and players
    homeTeamPlayers: MatchPlayer[];
    awayTeamPlayers: MatchPlayer[];
    selectedPlayer: MatchPlayer | null;
    
    // Team phase
    homeTeamState: TeamPhase;
    awayTeamState: TeamPhase;
    
    // Match stats
    possession: number;
    homePossession: number;
    
    // Gameplay
    pendingShot: { force: [number, number, number], id: number } | null;
    defenderPosition: [number, number, number];
    crowdIntensity: number;
    derbyFlag: boolean;
    matchIntensity: number;
    homeMomentum: number;
    awayMomentum: number;
    activeCelebration: CelebrationState | null;
    celebrationComboBonus: number;
    afkSeconds: number;
    lastInputAt: number;
    
    // Settings
    currentMatch: any;
    currentRules: MatchRules | null;
    currentStadium: Stadium | null;
    
    // Control state
    controlState: {
        moveForward: boolean;
        moveBackward: boolean;
        moveLeft: boolean;
        moveRight: boolean;
        sprint: boolean;
        shoot: boolean;
        pass: boolean;
    };
    
    // Actions
    setMatchPhase: (phase: MatchPhase) => void;
    updateScore: (team: TeamId) => void;
    setBallState: (state: MatchState['ballState']) => void;
    setBallPosition: (position: [number, number, number]) => void;
    setDefenderPosition: (position: [number, number, number]) => void;
    setBallOwnership: (team: TeamId, playerId: string) => void;
    triggerShot: (force: [number, number, number]) => void;
    clearPendingShot: () => void;
    setMatchTime: (time: number) => void;
    updateMatchTime: (time: number) => void;
    startCelebration: (payload: { type: CelebrationType; team: 'HOME' | 'AWAY'; duration?: number }) => void;
    endCelebration: () => void;
    inputCelebrationStep: (key: 'A' | 'B' | 'C') => void;
    applyRemoteState: (remote: {
        scoreHome?: number;
        scoreAway?: number;
        matchTime?: number;
        ballState?: MatchState['ballState'];
    }) => void;
    pushCrowdImpulse: (amount: number) => void;
    decayCrowdEmotion: (deltaSeconds: number) => void;
    setDerbyFlag: (value: boolean) => void;
    setMatchIntensity: (value: number) => void;
    resetMatch: () => void;
    startMatch: () => void;
    endMatch: () => void;
    setSelectedPlayer: (player: MatchPlayer | null) => void;
    setControlState: (state: Partial<MatchState['controlState']>) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
    // Game state
    matchPhase: 'PRELOAD',
    isLive: false,
    isPaused: false,
    
    // Scoreboard
    scoreHome: 0,
    scoreAway: 0,
    homeGoals: 0,
    awayGoals: 0,
    
    // Time
    matchTime: 0,
    currentTime: 0,
    
    // Ball state
    ballState: 'IN_PLAY',
    ballPosition: [0, 0, 0],
    ball: { position: [0, 0, 0] },
    lastTouchTeam: 'HOME',
    ballOwnerId: null,
    teamInPossession: null,
    
    // Teams and players
    homeTeamPlayers: [],
    awayTeamPlayers: [],
    selectedPlayer: null,
    
    // Team phase
    homeTeamState: 'DEFEND',
    awayTeamState: 'DEFEND',
    
    // Match stats
    possession: 50,
    homePossession: 50,
    
    // Gameplay
    pendingShot: null,
    defenderPosition: [10, 1, 0],
    crowdIntensity: 0.5,
    derbyFlag: false,
    matchIntensity: 0.3,
    homeMomentum: 1,
    awayMomentum: 1,
    activeCelebration: null,
    celebrationComboBonus: 0,
    afkSeconds: 0,
    lastInputAt: Date.now(),
    
    // Settings
    currentMatch: null,
    currentRules: null,
    currentStadium: null,
    
    // Control state
    controlState: {
        moveForward: false,
        moveBackward: false,
        moveLeft: false,
        moveRight: false,
        sprint: false,
        shoot: false,
        pass: false,
    },
    
    // Actions
    setMatchPhase: (phase) => set({ matchPhase: phase }),
    
    updateScore: (team) =>
        set((state) => ({
            scoreHome: team === 'HOME' ? state.scoreHome + 1 : state.scoreHome,
            scoreAway: team === 'AWAY' ? state.scoreAway + 1 : state.scoreAway,
            homeGoals: team === 'HOME' ? state.homeGoals + 1 : state.homeGoals,
            awayGoals: team === 'AWAY' ? state.awayGoals + 1 : state.awayGoals,
        })),
    
    setBallState: (state) =>
        set((current) => {
            let teamInPossession = current.teamInPossession;
            let homeTeamState = current.homeTeamState;
            let awayTeamState = current.awayTeamState;
            if (state !== 'IN_PLAY') {
                teamInPossession = null;
                homeTeamState = 'TRANSITION';
                awayTeamState = 'TRANSITION';
            }
            return {
                ballState: state,
                teamInPossession,
                homeTeamState,
                awayTeamState
            };
        }),
    
    setBallPosition: (position) =>
        set(() => ({
            ballPosition: position,
            ball: { position },
        })),
    
    setDefenderPosition: (position) => set({ defenderPosition: position }),
    
    setBallOwnership: (team, playerId) =>
        set(() => {
            const teamInPossession: TeamId | null = team;
            const homeTeamState: TeamPhase = team === 'HOME' ? 'ATTACK' : 'DEFEND';
            const awayTeamState: TeamPhase = team === 'AWAY' ? 'ATTACK' : 'DEFEND';
            return {
                lastTouchTeam: team,
                ballOwnerId: playerId,
                teamInPossession,
                homeTeamState,
                awayTeamState
            };
        }),
    
    triggerShot: (force) => set({ pendingShot: { force, id: Date.now() } }),
    clearPendingShot: () => set({ pendingShot: null }),
    
    setMatchTime: (time) => set({ matchTime: time, currentTime: time }),
    updateMatchTime: (time) => set((state) => ({
        matchTime: state.matchTime + time,
        currentTime: state.currentTime + time,
    })),
    
    startCelebration: (payload) =>
        set((state) => {
            const baseDuration = 4;
            const duration = payload.duration ?? baseDuration;
            let crowdBoost = 0;
            let homeMomentum = state.homeMomentum;
            let awayMomentum = state.awayMomentum;
            const scoringTeam = payload.team;
            
            if (['FIST_PUMP', 'ARMS_WIDE_RUN', 'JUMP_CHEST_THUMP', 'RUNNING_SPIN', 'FLEX'].includes(payload.type)) {
                crowdBoost = 0.08;
                if (scoringTeam === 'HOME') {
                    homeMomentum += 0.12;
                } else {
                    awayMomentum += 0.12;
                }
            } else if (['KNEE_SLIDE', 'SLIDE_POINT', 'SLIDE_CAMERA'].includes(payload.type)) {
                crowdBoost = 0.1;
                if (scoringTeam === 'HOME') {
                    homeMomentum += 0.1;
                } else {
                    awayMomentum += 0.1;
                }
            } else if (['CALM_DOWN', 'SHUSH'].includes(payload.type)) {
                crowdBoost = 0.05;
                if (scoringTeam === 'HOME') {
                    awayMomentum -= 0.12;
                } else {
                    homeMomentum -= 0.12;
                }
            } else if (['POINT_BADGE', 'TEAMMATE_HUG', 'GROUP_HUDDLE'].includes(payload.type)) {
                crowdBoost = 0.06;
                if (scoringTeam === 'HOME') {
                    homeMomentum += 0.14;
                } else {
                    awayMomentum += 0.14;
                }
            } else if (['MASK_FACE', 'POINT_SKY'].includes(payload.type)) {
                crowdBoost = 0.09;
            } else if (['SALUTE', 'BOW', 'SIT_DOWN'].includes(payload.type)) {
                crowdBoost = 0.04;
            } else if (['PHONE_CALL', 'SIGNATURE'].includes(payload.type)) {
                crowdBoost = 0.07;
            }
            
            homeMomentum = Math.max(0.6, Math.min(1.6, homeMomentum));
            awayMomentum = Math.max(0.6, Math.min(1.6, awayMomentum));
            
            const nextCrowd = Math.max(0, Math.min(1, state.crowdIntensity + crowdBoost));
            const now = Date.now();
            const maxSteps = 3;
            
            return {
                crowdIntensity: nextCrowd,
                homeMomentum,
                awayMomentum,
                activeCelebration: {
                    active: true,
                    type: payload.type,
                    team: payload.team,
                    startedAt: state.matchTime,
                    duration,
                    comboStep: 1,
                    maxSteps,
                    sequence: [payload.type],
                    windowEndsAt: now + 3500,
                    bonusEarned: false
                }
            };
        }),
    
    endCelebration: () => set({ activeCelebration: null }),
    
    inputCelebrationStep: (key) =>
        set((state) => {
            const current = state.activeCelebration;
            if (!current || !current.active) return state;
            
            const now = Date.now();
            if (!current.windowEndsAt || now > current.windowEndsAt) {
                return state;
            }
            
            const step = current.comboStep ?? 1;
            const maxSteps = current.maxSteps ?? 3;
            
            if (step >= maxSteps) return state;
            
            const poolA: CelebrationType[] = ['FIST_PUMP', 'JUMP_CHEST_THUMP', 'POINT_BADGE'];
            const poolB: CelebrationType[] = ['KNEE_SLIDE', 'SLIDE_POINT'];
            const poolC: CelebrationType[] = ['ARMS_WIDE_RUN', 'RUNNING_SPIN', 'SIGNATURE'];
            
            const pool = key === 'A' ? poolA : key === 'B' ? poolB : poolC;
            const used = current.sequence || [];
            const available = pool.filter((t) => !used.includes(t));
            const baseChoices = available.length > 0 ? available : pool;
            const chosen = baseChoices[Math.floor(Math.random() * baseChoices.length)];
            const nextSequence = [...used, chosen];
            const bonusEarned = step + 1 === maxSteps;
            const extraBoost = bonusEarned ? 0.05 : 0.03;
            const scoringTeam = current.team;
            
            let homeMomentum = state.homeMomentum;
            let awayMomentum = state.awayMomentum;
            
            if (scoringTeam === 'HOME') {
                homeMomentum = Math.min(1.6, homeMomentum + extraBoost * 1.2);
            } else if (scoringTeam === 'AWAY') {
                awayMomentum = Math.min(1.6, awayMomentum + extraBoost * 1.2);
            }
            
            const nextCrowd = Math.max(0, Math.min(1, state.crowdIntensity + extraBoost));
            let comboBonus = state.celebrationComboBonus;
            
            if (bonusEarned && !current.bonusEarned) {
                comboBonus += 5;
            }
            
            const windowExtension = bonusEarned ? 800 : 900;
            
            return {
                crowdIntensity: nextCrowd,
                homeMomentum,
                awayMomentum,
                celebrationComboBonus: comboBonus,
                activeCelebration: {
                    ...current,
                    type: chosen,
                    comboStep: step + 1,
                    sequence: nextSequence,
                    windowEndsAt: now + windowExtension,
                    bonusEarned: current.bonusEarned || bonusEarned
                }
            };
        }),
    
    applyRemoteState: (remote) =>
        set((state) => ({
            scoreHome: remote.scoreHome ?? state.scoreHome,
            scoreAway: remote.scoreAway ?? state.scoreAway,
            matchTime: remote.matchTime ?? state.matchTime,
            ballState: remote.ballState ?? state.ballState,
        })),
    
    pushCrowdImpulse: (amount) =>
        set((state) => ({
            crowdIntensity: Math.max(0, Math.min(1, state.crowdIntensity + amount)),
        })),
    
    decayCrowdEmotion: (deltaSeconds) =>
        set((state) => ({
            crowdIntensity: Math.max(0.3, state.crowdIntensity - deltaSeconds * 0.05),
        })),
    
    setDerbyFlag: (value) => set({ derbyFlag: value }),
    setMatchIntensity: (value) => set({ matchIntensity: Math.max(0, Math.min(1, value)) }),
    resetMatch: () =>
        set({
            matchPhase: 'PRELOAD',
            isLive: false,
            isPaused: false,
            scoreHome: 0,
            scoreAway: 0,
            homeGoals: 0,
            awayGoals: 0,
            matchTime: 0,
            currentTime: 0,
            ballState: 'IN_PLAY',
            ballPosition: [0, 0, 0],
            ball: { position: [0, 0, 0] },
            homeTeamPlayers: [],
            awayTeamPlayers: [],
            selectedPlayer: null,
            possession: 50,
            homePossession: 50,
        }),
    
    startMatch: () => set({
        matchPhase: 'in-play' as MatchPhase,
        isLive: true,
        isPaused: false,
    }),
    
    endMatch: () => set({
        matchPhase: 'full-time' as MatchPhase,
        isLive: false,
    }),
    
    setSelectedPlayer: (player) => set({ selectedPlayer: player }),
    
    setControlState: (state) =>
        set((current) => ({
            controlState: {
                ...current.controlState,
                ...state,
            },
        })),
}));
