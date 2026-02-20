import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Sky } from '@react-three/drei';
import { useLocation } from 'react-router-dom';
import { Vector3 } from 'three';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { PlayerFace } from '../components/common/PlayerFace';
import players from '../data/players.json';
import { getKitForPlayer } from '../data/jerseys';
import { Ball } from './components/Ball';
import { Pitch } from './components/Pitch';
import { Player } from './components/Player';
import { AIPlayer } from './components/AIPlayer';
import { Stadium } from './components/Stadium';
import { Goalkeeper } from './components/Goalkeeper';
import { useKeyboardControls, useGamepadControls } from './controls/InputManager';
import { TouchControls } from './controls/TouchControls';
import { useMatchStore } from '../store/useMatchStore';
import { useRankStore } from '../store/useRankStore';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useControlStore } from './controls/useControlStore';
import { AdminAbuseEventState, AdminAbuseService } from '../services/adminAbuseService';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { activeMatchMonitor } from '../services/rank/PerformanceMonitor';
import { AudioManager } from '../services/audioManager';
import { subscribeToMatchEvents, selectCommentaryLine, subscribeToCommentaryImpact } from './commentary/CommentaryEngine';
import type { KeeperPersonality, MatchEventToken } from './commentary/CommentaryEngine';

const ThirdPersonCamera = ({ target }: { target: [number, number, number] | null }) => {
    const { camera, gl } = useThree();
    const ballState = useMatchStore(state => state.ballState);
    const activeCelebration = useMatchStore(state => state.activeCelebration);
    const teamInPossession = useMatchStore(state => state.teamInPossession);
    const cameraX = useControlStore(state => state.input.cameraX);
    const currentPosition = useRef(new Vector3(0, 14, 18));
    const lookAtTarget = useRef(new Vector3(0, 0, 0));
    const yaw = useRef(0);
    const dragging = useRef(false);
    const lastX = useRef(0);
    const replayMode = useRef(false);
    const replayTimer = useRef(0);
    const replayPhase = useRef(0);
    const lastBallState = useRef<'IN_PLAY' | 'GOAL' | 'THROW_IN' | 'CORNER' | 'GOAL_KICK'>('IN_PLAY');
    const lastHighlightEvent = useRef<MatchEventToken | null>(null);

    useEffect(() => {
        const element = gl.domElement;

        const handleDown = (e: PointerEvent) => {
            if (e.pointerType === 'mouse') {
                if (e.button !== 2) return;
            } else if (e.pointerType === 'touch') {
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
                if (e.clientY > viewportHeight * 0.6) return;
            } else {
                return;
            }
            dragging.current = true;
            lastX.current = e.clientX;
        };

        const handleMove = (e: PointerEvent) => {
            if (!dragging.current) return;
            const dx = e.clientX - lastX.current;
            lastX.current = e.clientX;
            const limit = Math.PI / 3;
            yaw.current -= dx * 0.005;
            if (yaw.current > limit) yaw.current = limit;
            if (yaw.current < -limit) yaw.current = -limit;
        };

        const handleUp = () => {
            dragging.current = false;
        };

        element.addEventListener('pointerdown', handleDown);
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);

        return () => {
            element.removeEventListener('pointerdown', handleDown);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [gl]);

    useEffect(() => {
        const unsubscribe = subscribeToMatchEvents(event => {
            if (event.kind === 'GOAL') {
                lastHighlightEvent.current = event;
            } else if (event.kind === 'KEEPER_DECISION' && event.importance >= 0.7) {
                lastHighlightEvent.current = event;
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    useFrame((_, delta) => {
        if (!target) return;
        const hasGoalSequence = ballState === 'GOAL' || (activeCelebration && activeCelebration.active);
        const currentState = ballState;
        if (lastBallState.current !== currentState && currentState === 'GOAL') {
            replayMode.current = true;
            replayTimer.current = 0;
            replayPhase.current = 0;
        }
        lastBallState.current = currentState;
        if (!hasGoalSequence && replayMode.current) {
            replayMode.current = false;
            replayTimer.current = 0;
            replayPhase.current = 0;
        }

        let radius = 18;
        let height = 8;
        let angle = yaw.current;

        if (cameraX !== 0) {
            yaw.current -= cameraX * 1.2 * delta;
        }

        if (replayMode.current && hasGoalSequence) {
            replayTimer.current += delta;
            const phaseDuration = 1.8;
            const maxPhases = 3;
            const rawPhase = Math.floor(replayTimer.current / phaseDuration);
            const phase = rawPhase >= maxPhases ? maxPhases - 1 : rawPhase;
            replayPhase.current = phase;
            if (phase === 0) {
                radius = 16;
                height = 6;
            } else if (phase === 1) {
                radius = 12;
                height = 4;
                angle = yaw.current + Math.PI / 3;
            } else {
                radius = 24;
                height = 12;
            }
            const highlight = lastHighlightEvent.current;
            if (
                highlight &&
                highlight.kind === 'GOAL' &&
                (highlight.importance >= 0.7 || (highlight.shotDifficulty || 0) > 0.5)
            ) {
                radius *= 0.9;
                height *= 0.9;
            }
        } else {
            if (teamInPossession === 'HOME') {
                radius = 20;
                height = 8.5;
            } else if (teamInPossession === 'AWAY') {
                radius = 22;
                height = 7;
            }
        }

        const desired = new Vector3(
            target[0] + radius * Math.sin(angle),
            target[1] + height,
            target[2] + radius * Math.cos(angle)
        );
        currentPosition.current.lerp(desired, 0.12);
        camera.position.copy(currentPosition.current);

        lookAtTarget.current.set(target[0], target[1] + 1.5, target[2]);
        camera.lookAt(lookAtTarget.current);
    });

    return null;
};

const mapToKeeperPersonality = (playerId: string): KeeperPersonality => {
    const digits = playerId.replace(/\D+/g, '');
    const num = parseInt(digits, 10);
    const value = Number.isNaN(num) ? 0 : num;
    const mod = value % 4;
    if (mod === 0) return 'ANTICIPATOR';
    if (mod === 1) return 'COMMANDER';
    if (mod === 2) return 'SAFE_HANDS';
    return 'SHOWMAN';
};

export const GameScene = () => {
    const { endGame, settings, mode, opponent } = useGameStore();
    const { user, updateCurrency, applyMatchRewards } = useAuthStore() as any;
    const location = useLocation();
    const allPlayers = players as any[];
    const matchId = 'demo-match';
    const scoreHome = useMatchStore(state => state.scoreHome);
    const scoreAway = useMatchStore(state => state.scoreAway);
    const matchTime = useMatchStore(state => state.matchTime);
    const ballState = useMatchStore(state => state.ballState);
    const crowdIntensity = useMatchStore(state => state.crowdIntensity);
    const activeCelebration = useMatchStore(state => state.activeCelebration);
    const endCelebration = useMatchStore(state => state.endCelebration);
    const applyRemoteState = useMatchStore(state => state.applyRemoteState);
    const celebrationComboBonus = useMatchStore(state => state.celebrationComboBonus);
    const matchAfkSeconds = useMatchStore(state => state.afkSeconds);
    const matchPhase = useMatchStore(state => state.matchPhase);
    const setMatchPhase = useMatchStore(state => state.setMatchPhase);
    const setMatchTime = useMatchStore(state => state.setMatchTime);
    const teamInPossession = useMatchStore(state => state.teamInPossession);
    const lastTouchTeam = useMatchStore(state => state.lastTouchTeam);
    const setDerbyFlag = useMatchStore(state => state.setDerbyFlag);
    const setMatchIntensity = useMatchStore(state => state.setMatchIntensity);
    const setControlContext = useControlStore(state => state.setContext);
    const [clockSegment, setClockSegment] = useState<'IDLE' | 'NORMAL' | 'EXTRA' | 'FINISHED'>('IDLE');
    const clockRef = useRef<{ real: number; last: number }>({ real: 0, last: 0 });
    const matchFinishedRef = useRef(false);
    const [isRivalMatch, setIsRivalMatch] = useState(false);
    const [showRivalIntro, setShowRivalIntro] = useState(false);
    const [benchReaction, setBenchReaction] = useState<{
        team: 'HOME' | 'AWAY';
        key: string;
        late: boolean;
    } | null>(null);
    const [varState, setVarState] = useState<{
        step: 'IDLE' | 'CHECKING' | 'DECISION';
        decision: 'GOAL_CONFIRMED';
    }>({
        step: 'IDLE',
        decision: 'GOAL_CONFIRMED'
    });
    const [fanHype, setFanHype] = useState(30);
    const [adminEventState, setAdminEventState] = useState<AdminAbuseEventState>({
        active: false,
        startedAt: null,
        startedByName: null,
        label: null
    });
    const [showFanIntro, setShowFanIntro] = useState(false);
    const [storyIntro, setStoryIntro] = useState<null | {
        id: string;
        title: string;
        subtitle: string;
    }>(null);
    const [isStoryDerbyMatch, setIsStoryDerbyMatch] = useState(false);
    const [commentaryLine, setCommentaryLine] = useState<string | null>(null);
    const commentaryTimerRef = useRef<number | null>(null);
    const pushCrowdImpulse = useMatchStore(state => state.pushCrowdImpulse);
    const emotionDecayTimerRef = useRef<number | null>(null);

    useEffect(() => {
        useMatchStore.getState().resetMatch();
        activeMatchMonitor.reset();
        clockRef.current.real = 0;
        clockRef.current.last = 0;
        setClockSegment('IDLE');
        matchFinishedRef.current = false;
        AudioManager.loadAndPlay('music', '/audio/match_entry.mp3');
    }, []);

    useEffect(() => {
        const unsubImpact = subscribeToCommentaryImpact((event, weight) => {
            const teamFactor = event.team === 'HOME' ? 1 : 0.6;
            const lateFactor = event.minute >= 80 ? 1.15 : 1;
            const current = useMatchStore.getState().crowdIntensity;
            const crowdMultiplier = 0.7 + current * 0.6;
            const scaled = weight * teamFactor * lateFactor * crowdMultiplier;
            pushCrowdImpulse(scaled);
        });
        return () => {
            unsubImpact();
        };
    }, [pushCrowdImpulse]);

    useEffect(() => {
        let lastTime = performance.now();
        const step = () => {
            const now = performance.now();
            const delta = (now - lastTime) / 1000;
            lastTime = now;
            useMatchStore.getState().decayCrowdEmotion(delta);
            emotionDecayTimerRef.current = window.requestAnimationFrame(step);
        };
        emotionDecayTimerRef.current = window.requestAnimationFrame(step);
        return () => {
            if (emotionDecayTimerRef.current !== null) {
                window.cancelAnimationFrame(emotionDecayTimerRef.current);
            }
        };
    }, []);

    const buildBestSquad = (ids: string[]) => {
        const squadPlayers = (ids.map(id => allPlayers.find(p => p.id === id)).filter(p => p !== undefined) || []) as any[];
        if (!squadPlayers.length) {
            return { startingXI: [] as any[], bench: [] as any[] };
        }
        const sorted = [...squadPlayers].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const slots: { name: string; preferred: string[] }[] = [
            { name: 'GK', preferred: ['GK'] },
            { name: 'RB', preferred: ['RB', 'RWB'] },
            { name: 'CB1', preferred: ['CB'] },
            { name: 'CB2', preferred: ['CB'] },
            { name: 'LB', preferred: ['LB', 'LWB'] },
            { name: 'DMF', preferred: ['DMF', 'CMF'] },
            { name: 'CMF1', preferred: ['CMF', 'DMF', 'AMF'] },
            { name: 'CMF2', preferred: ['CMF', 'DMF', 'AMF'] },
            { name: 'AMF', preferred: ['AMF', 'CF'] },
            { name: 'ST1', preferred: ['ST', 'CF', 'SS', 'RWF', 'LWF'] },
            { name: 'ST2', preferred: ['ST', 'CF', 'SS', 'RWF', 'LWF'] }
        ];
        const remaining = [...sorted];
        const starting: any[] = [];
        for (const slot of slots) {
            if (!remaining.length || starting.length >= 11) {
                break;
            }
            let index = remaining.findIndex(p => slot.preferred.includes(p.position));
            if (index === -1) {
                index = 0;
            }
            const chosen = remaining.splice(index, 1)[0];
            starting.push(chosen);
        }
        while (starting.length < 11 && remaining.length) {
            starting.push(remaining.shift());
        }
        const selectedIds = new Set(starting.map(p => p.id));
        const bench = squadPlayers.filter(p => !selectedIds.has(p.id));
        return { startingXI: starting, bench };
    };

    const userSquadIds = user?.squad || [];
    const { startingXI, bench } = buildBestSquad(userSquadIds);
    const initialPlayerId = startingXI[0]?.id || allPlayers[0].id;
    const keeperSource =
        startingXI.find(p => p.position === 'GK') ||
        startingXI[0] ||
        allPlayers.find((p: any) => p.position === 'GK') ||
        allPlayers[0];
    const keeperPersonality = mapToKeeperPersonality(keeperSource.id);

    const [playerPosition, setPlayerPosition] = useState<[number, number, number] | null>(null);
    const [activePlayerId, setActivePlayerId] = useState<string>(initialPlayerId);
    const [benchIds, setBenchIds] = useState<string[]>(bench.map(p => p.id));
    const [subsUsed, setSubsUsed] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const maxSubs = 5;
    useKeyboardControls();
    useGamepadControls();

    useEffect(() => {
        const ids = user?.squad || [];
        const { startingXI: sx, bench: b } = buildBestSquad(ids);
        const firstId = sx[0]?.id || allPlayers[0].id;
        setActivePlayerId(firstId);
        setBenchIds(b.map(p => p.id));
        setSubsUsed(0);
    }, [user]);

    useEffect(() => {
        if (!user || !opponent || mode !== 'FRIEND_PVP') return;
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        const key = ['mrn_rivalry', user.uid, opponent.uid].sort().join('_');
        let previous = 0;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed) && parsed > 0) {
                    previous = parsed;
                }
            }
        } catch {
        }
        const next = previous + 1;
        try {
            localStorage.setItem(key, String(next));
        } catch {
        }
        const rivalNow = previous >= 2;
        setIsRivalMatch(rivalNow);
        if (rivalNow) {
            setShowRivalIntro(true);
            const timer = setTimeout(() => {
                setShowRivalIntro(false);
            }, 3500);
            return () => {
                clearTimeout(timer);
            };
        }
    }, [user, opponent, mode]);

    useEffect(() => {
        if (!user) return;
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        const key = ['mrn_fan_hype', user.uid].join('_');
        let stored = 30;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed)) {
                    stored = parsed;
                }
            }
        } catch {
        }
        setFanHype(stored);
        const tierHigh = stored >= 70;
        const tierMid = stored >= 40 && stored < 70;
        if (tierHigh || tierMid) {
            setShowFanIntro(true);
            const t = setTimeout(() => {
                setShowFanIntro(false);
            }, 3200);
            return () => {
                clearTimeout(t);
            };
        }
    }, [user]);

    useEffect(() => {
        if (mode !== 'FRIEND_PVP') {
            return;
        }
        const matchRef = doc(db, 'matches', matchId);

        let unsubscribe: (() => void) | undefined;
        let mounted = true;

        const setup = async () => {
            try {
                await setDoc(
                    matchRef,
                    {
                        scoreHome: 0,
                        scoreAway: 0,
                        matchTime: 0,
                        ballState: 'IN_PLAY'
                    },
                    { merge: true }
                );
            } catch {
            }
            
            if (!mounted) return;

            unsubscribe = onSnapshot(matchRef, snapshot => {
                const data = snapshot.data() as
                    | {
                          scoreHome?: number;
                          scoreAway?: number;
                          matchTime?: number;
                          ballState?: string;
                      }
                    | undefined;
                if (!data) return;
                const current = useMatchStore.getState();
                const remote: {
                    scoreHome?: number;
                    scoreAway?: number;
                    matchTime?: number;
                    ballState?: 'IN_PLAY' | 'GOAL' | 'THROW_IN' | 'CORNER' | 'GOAL_KICK';
                } = {};
                if (typeof data.scoreHome === 'number' && data.scoreHome !== current.scoreHome) {
                    remote.scoreHome = data.scoreHome;
                }
                if (typeof data.scoreAway === 'number' && data.scoreAway !== current.scoreAway) {
                    remote.scoreAway = data.scoreAway;
                }
                if (typeof data.matchTime === 'number' && data.matchTime !== current.matchTime) {
                    remote.matchTime = data.matchTime;
                }
                if (typeof data.ballState === 'string' && data.ballState !== current.ballState) {
                    if (
                        data.ballState === 'IN_PLAY' ||
                        data.ballState === 'GOAL' ||
                        data.ballState === 'THROW_IN' ||
                        data.ballState === 'CORNER' ||
                        data.ballState === 'GOAL_KICK'
                    ) {
                        remote.ballState = data.ballState;
                    }
                }
                if (Object.keys(remote).length > 0) {
                    applyRemoteState(remote);
                }
            });
        };

        setup();

        return () => {
            mounted = false;
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [matchId, applyRemoteState, mode]);

    useEffect(() => {
        if (mode !== 'FRIEND_PVP') {
            return;
        }
        const matchRef = doc(db, 'matches', matchId);
        setDoc(
            matchRef,
            {
                scoreHome,
                scoreAway,
                ballState
            },
            { merge: true }
        );
    }, [matchId, scoreHome, scoreAway, ballState, mode]);

    const currentPlayer = allPlayers.find(p => p.id === activePlayerId) || allPlayers[0];
    const currentKit = getKitForPlayer(currentPlayer.id);

    const homeTeamName = (user?.username || 'HOME TEAM').toUpperCase();
    const awayTeamName =
        mode === 'FRIEND_PVP' && opponent
            ? opponent.username.toUpperCase()
            : 'AI TEAM';

    const searchParams = new URLSearchParams(location.search);
    const hasStory = searchParams.get('story') === '1';

    const handleExitClick = () => {
        if (mode === 'FRIEND_PVP') {
            setShowSummary(true);
            return;
        }
        endGame();
    };

    const handleCollectRewards = () => {
        if (!user) {
            endGame();
            return;
        }

        const isWin = scoreHome > scoreAway;
        const isDraw = scoreHome === scoreAway;

        let reward = 600;
        if (celebrationComboBonus > 0) {
            reward += celebrationComboBonus;
        }

        if (adminEventState.active) {
            reward = Math.round(reward * 1.5);
        }

        const shouldUseMatchRewards =
            typeof applyMatchRewards === 'function' && reward > 0;
        if (shouldUseMatchRewards) {
            const isCompetitiveMatch = mode === 'FRIEND_PVP';
            applyMatchRewards({
                baseCoins: reward,
                baseDiamonds: 0,
                includeFirstMatchBonus: hasStory,
                includeFirstWinBonus: isWin,
                isWin,
                isDraw,
                goalsFor: scoreHome,
                goalsAgainst: scoreAway,
                teamOvr: user?.squad?.length
                    ? Math.round(
                          (user.squad || [])
                              .map((id: string) => {
                                  const p = allPlayers.find((ap: any) => ap.id === id) as any | undefined;
                                  return p?.ovr || 0;
                              })
                              .reduce((a: number, b: number) => a + b, 0) / (user.squad || []).length
                      )
                    : 0,
                isCompetitive: isCompetitiveMatch
            });
        } else if (typeof updateCurrency === 'function' && reward > 0) {
            const currentCoins = user.coins || 0;
            const currentDiamonds = user.diamonds || 0;
            updateCurrency(currentCoins + reward, currentDiamonds);
        }

        if (user) {
            let nextHype = fanHype;
            if (isWin) {
                nextHype += 7;
            } else if (isDraw) {
                nextHype += 3;
            } else {
                nextHype -= 4;
            }
            if (nextHype < 0) nextHype = 0;
            if (nextHype > 100) nextHype = 100;
            setFanHype(nextHype);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                const key = ['mrn_fan_hype', user.uid].join('_');
                try {
                    localStorage.setItem(key, String(nextHype));
                } catch {
                }
            }
        }

        // 4. Decision-Based Performance & 6. Fair Play
        // We use the monitor to get the real calculated scores
        const performanceScore = activeMatchMonitor.calculatePerformanceScore();
        let fairPlayScore = activeMatchMonitor.calculateFairPlayScore();
        if (matchAfkSeconds > 10) {
            fairPlayScore -= Math.min(0.6, (matchAfkSeconds - 10) * 0.02);
        }
        fairPlayScore = Math.max(0.1, Math.min(1.2, fairPlayScore));
        const goalDiff = scoreHome - scoreAway;
        const expectedScore = Math.max(0.35, Math.min(0.65, 0.5 + goalDiff * 0.05));

        const rankMode =
            mode === 'FRIEND_PVP'
                ? 'RIVALS_H2H'
                : 'KICKOFF';

        useRankStore.getState().addAccountXp(20);
        useRankStore.getState().applyMatchResult({
            mode: rankMode,
            result: isWin ? 'WIN' : isDraw ? 'DRAW' : 'LOSS',
            performanceScore,
            expectedScore,
            fairPlayScore
        });

        setShowSummary(false);
        endGame();
    };

    useEffect(() => {
        if (ballState === 'IN_PLAY') {
            if (teamInPossession === 'HOME') {
                setControlContext('ATTACKING');
            } else if (teamInPossession === 'AWAY') {
                setControlContext('DEFENDING');
            }
        } else if (ballState === 'THROW_IN') {
            const owner = lastTouchTeam === 'HOME' ? 'AWAY' : 'HOME';
            if (owner === 'HOME') {
                setControlContext('THROW_IN');
            } else {
                setControlContext('DEFENDING');
            }
        } else {
            if (teamInPossession === 'HOME') {
                setControlContext('ATTACKING');
            } else if (teamInPossession === 'AWAY') {
                setControlContext('DEFENDING');
            }
        }
    }, [ballState, teamInPossession, lastTouchTeam, setControlContext]);

    useEffect(() => {
        if (matchPhase === 'MATCH_START') {
            clockRef.current.real = 0;
            clockRef.current.last = 0;
            matchFinishedRef.current = false;
            setMatchTime(0);
            setClockSegment('NORMAL');
            setMatchPhase('LIVE_PLAY');
        }
        if (matchPhase === 'MATCH_END') {
            setClockSegment('FINISHED');
            setShowSummary(true);
        }
    }, [matchPhase, setMatchPhase, setMatchTime]);

    useEffect(() => {
        if (clockSegment !== 'NORMAL' && clockSegment !== 'EXTRA') {
            return;
        }
        let frame: number;
        const normalLimit = 90;
        const extraLimit = 105;
        const scale = 0.25;
        const tick = (timestamp: number) => {
            if (clockSegment !== 'NORMAL' && clockSegment !== 'EXTRA') {
                return;
            }
            if (!clockRef.current.last) {
                clockRef.current.last = timestamp;
            }
            const delta = (timestamp - clockRef.current.last) / 1000;
            clockRef.current.last = timestamp;
            clockRef.current.real += delta;
            const baseMinutes = clockSegment === 'NORMAL' ? 0 : normalLimit;
            const footballMinutes = baseMinutes + clockRef.current.real * scale;
            const target = clockSegment === 'NORMAL' ? normalLimit : extraLimit;
            const clamped = footballMinutes > target ? target : footballMinutes;
            setMatchTime(clamped);
            const modeNow = useGameStore.getState().mode;
            const isKnockout = modeNow === 'FRIEND_PVP';
            const state = useMatchStore.getState();
            if (clockSegment === 'NORMAL' && footballMinutes >= normalLimit) {
                if (isKnockout && state.scoreHome === state.scoreAway) {
                    clockRef.current.real = 0;
                    clockRef.current.last = timestamp;
                    setClockSegment('EXTRA');
                } else if (!matchFinishedRef.current) {
                    matchFinishedRef.current = true;
                    setClockSegment('FINISHED');
                    state.setMatchPhase('MATCH_END');
                }
            } else if (clockSegment === 'EXTRA' && footballMinutes >= extraLimit && !matchFinishedRef.current) {
                matchFinishedRef.current = true;
                setClockSegment('FINISHED');
                state.setMatchPhase('MATCH_END');
            }
            frame = window.requestAnimationFrame(tick);
        };
        frame = window.requestAnimationFrame(tick);
        return () => {
            if (frame) {
                window.cancelAnimationFrame(frame);
            }
            clockRef.current.last = 0;
        };
    }, [clockSegment, setMatchTime]);

    const { isMobile, isTablet } = useDeviceDetection();

    // Match Flow State Management
    useEffect(() => {
        if (matchPhase === 'PRELOAD') {
            const t = setTimeout(() => setMatchPhase('TEAM_SETUP'), 1000);
            return () => clearTimeout(t);
        }
        if (matchPhase === 'TEAM_SETUP') {
             const t = setTimeout(() => setMatchPhase('STADIUM_LOAD'), 1500);
             return () => clearTimeout(t);
        }
        if (matchPhase === 'STADIUM_LOAD') {
            const t = setTimeout(() => setMatchPhase('MATCH_START'), 2000);
            return () => clearTimeout(t);
        }
    }, [matchPhase, setMatchPhase]);

    // Camera Logic
    const getCameraConfig = () => {
        if (isMobile) {
            // Mobile: Elevated, Fixed Angle, No Tilt (Performance + Clarity)
            return {
                fov: 55,
                position: [0, 25, 20], // Higher up
                zoom: 0.8
            };
        }
        // PC: Dynamic, Closer, Cinematic
        return {
            fov: 45,
            position: [0, 18, 22],
            zoom: 1
        };
    };

    const camConfig = getCameraConfig();

    const [showMobileWarning, setShowMobileWarning] = useState(false);
    const [loadStage, setLoadStage] = useState(0); // 0: Init, 1: Pitch/Ball, 2: Stadium, 3: Players
    const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

    // ... (rest of the file)

    useEffect(() => {
        // Simulate streaming pipeline for WebGL memory management
        const t1 = setTimeout(() => setLoadStage(1), 100);
        const t2 = setTimeout(() => setLoadStage(2), 300);
        const t3 = setTimeout(() => setLoadStage(3), 600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, []);

    useEffect(() => {
        if (isMobile || isTablet) {
            const hasSeenWarning = localStorage.getItem('mrn_mobile_warning_seen');
            if (!hasSeenWarning) {
                setShowMobileWarning(true);
            }
        }
    }, [isMobile, isTablet]);

    const handleDismissMobileWarning = () => {
        setShowMobileWarning(false);
        try {
            localStorage.setItem('mrn_mobile_warning_seen', 'true');
        } catch {}
    };

    const handleSwitchTo2D = () => {
        setShowMobileWarning(false);
        setViewMode('2D');
    };

    const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const screenWidth = typeof window !== 'undefined' && window.screen ? window.screen.width : 0;
    const isHighEndMobile = (isMobile || isTablet) && (devicePixelRatio >= 2.5 || screenWidth >= 1080);

    let canvasDpr: [number, number];
    let enableShadows: boolean;

    if (isMobile) {
        // Mobile Optimization: Aggressive reductions for stability
        if (settings.graphicsQuality === 'HIGH' && isHighEndMobile) {
            canvasDpr = [0.9, 1.1]; // Reduced from [1.1, 1.5]
            enableShadows = false; // Force shadows off on mobile for stability
        } else if (settings.graphicsQuality === 'MEDIUM') {
            canvasDpr = [0.7, 0.9]; // Reduced from [0.9, 1.25]
            enableShadows = false;
        } else {
            canvasDpr = [0.5, 0.75]; // Very low res for low-end mobile
            enableShadows = false;
        }
    } else if (isTablet) {
         // Tablet Optimization: Better than mobile, but conservative
         if (settings.graphicsQuality === 'HIGH') {
            canvasDpr = [1.0, 1.3];
            enableShadows = true;
        } else {
            canvasDpr = [0.8, 1.0];
            enableShadows = false;
        }
    } else {
        if (settings.graphicsQuality === 'HIGH') {
            canvasDpr = [1.4, 1.8];
            enableShadows = true;
        } else if (settings.graphicsQuality === 'LOW') {
            canvasDpr = [0.85, 1.1];
            enableShadows = false;
        } else {
            canvasDpr = [1.1, 1.5];
            enableShadows = true;
        }
    }

    if (settings.fpsLimit === 30) {
        canvasDpr = [canvasDpr[0] * 0.8, canvasDpr[1] * 0.8];
    }

    useEffect(() => {
        const id = window.setInterval(() => {
            const state = useMatchStore.getState();
            const now = Date.now();
            const elapsed = (now - state.lastInputAt) / 1000;
            if (elapsed >= 0) {
                const clamped = Math.min(elapsed, 60);
                useMatchStore.setState({
                    afkSeconds: clamped
                });
            }
        }, 500);
        return () => {
            window.clearInterval(id);
        };
    }, []);

    useEffect(() => {
        const unsub = AdminAbuseService.subscribeEventState(setAdminEventState);
        return () => {
            unsub();
        };
    }, []);

    useEffect(() => {
        if (!user) return;
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        const key = ['mrn_fan_hype', user.uid].join('_');
        let stored = 30;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = parseInt(raw, 10);
                if (!isNaN(parsed)) {
                    stored = parsed;
                }
            }
        } catch {
        }
        setFanHype(stored);
        const tierHigh = stored >= 70;
        const tierMid = stored >= 40 && stored < 70;
        if (settings.graphicsQuality === 'LOW') {
            return;
        }
        if (tierHigh || tierMid) {
            setShowFanIntro(true);
            const t = setTimeout(() => {
                setShowFanIntro(false);
            }, 3200);
            return () => {
                clearTimeout(t);
            };
        }
    }, [user, settings.graphicsQuality]);

    useEffect(() => {
        if (!hasStory) {
            setStoryIntro(null);
            return;
        }
        if (settings.graphicsQuality === 'LOW') {
            setStoryIntro(null);
            return;
        }
        let storyId = 'stormy_derby';
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem('mrn_active_story');
                if (raw) {
                    storyId = raw;
                }
            } catch {
            }
        }
        let title = 'Stormy Derby';
        let subtitle = 'Heavy rain, sliding tackles and late drama.';
        if (storyId === 'legends_farewell') {
            title = 'Legend\'s Farewell';
            subtitle = 'Honor a legend in one last home match.';
        } else if (storyId === 'midnight_cup') {
            title = 'Midnight Cup';
            subtitle = 'Floodlights, night crowd and knockout tension.';
        }
        setStoryIntro({
            id: storyId,
            title,
            subtitle
        });
        setIsStoryDerbyMatch(storyId === 'stormy_derby');
        const t = setTimeout(() => {
            setStoryIntro(null);
        }, 3800);
        return () => {
            clearTimeout(t);
        };
    }, [hasStory, settings.graphicsQuality]);

    useEffect(() => {
        if (!settings.commentaryEnabled) {
            setCommentaryLine(null);
            return;
        }
        const unsubscribe = subscribeToMatchEvents(event => {
            const line = selectCommentaryLine(event, {
                enabled: settings.commentaryEnabled,
                language: settings.commentaryLanguage,
                intensity: settings.commentaryIntensity,
                frequency: settings.commentaryFrequency,
                explainBigMoments: settings.commentaryExplainBigMoments,
                derby: isRivalMatch || isStoryDerbyMatch
            });
            if (!line) {
                return;
            }
            setCommentaryLine(line);
        });
        return () => {
            unsubscribe();
        };
    }, [
        settings.commentaryEnabled,
        settings.commentaryLanguage,
        settings.commentaryIntensity,
        settings.commentaryFrequency,
        settings.commentaryExplainBigMoments,
        isRivalMatch,
        isStoryDerbyMatch
    ]);

    useEffect(() => {
        const derby = isRivalMatch || isStoryDerbyMatch;
        setDerbyFlag(derby);
    }, [isRivalMatch, isStoryDerbyMatch, setDerbyFlag]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const compute = () => {
            const state = useMatchStore.getState();
            const derby = state.derbyFlag;
            const minuteNorm = Math.max(0, Math.min(1, state.matchTime / 90));
            const scoreDiff = Math.abs(state.scoreHome - state.scoreAway);
            const closeness = 1 - Math.max(0, Math.min(1, scoreDiff / 3));
            const minutePressure = Math.max(0, Math.min(1, 0.15 + minuteNorm * 0.6 + closeness * 0.25));
            const crowdBase = 0.3 + state.crowdIntensity * 0.5;
            const derbyOffset = derby ? 0.15 : 0;
            const intensity = Math.max(
                0,
                Math.min(1, crowdBase * 0.35 + minutePressure * 0.45 + derbyOffset)
            );
            setMatchIntensity(intensity);
            AudioManager.setMatchState({
                intensity,
                derby
            });
        };
        compute();
        const id = window.setInterval(compute, 1000);
        return () => {
            window.clearInterval(id);
        };
    }, [setMatchIntensity]);

    useEffect(() => {
        if (!commentaryLine) {
            return;
        }
        if (commentaryTimerRef.current) {
            window.clearTimeout(commentaryTimerRef.current);
        }
        const id = window.setTimeout(() => {
            setCommentaryLine(null);
            commentaryTimerRef.current = null;
        }, 3800);
        commentaryTimerRef.current = id;
        return () => {
            window.clearTimeout(id);
        };
    }, [commentaryLine]);

    useEffect(() => {
        if (!activeCelebration || !activeCelebration.active) return;
        const timer = setInterval(() => {
            const state = useMatchStore.getState();
            const c = state.activeCelebration;
            if (!c || !c.active) {
                clearInterval(timer);
                return;
            }
            const elapsed = state.matchTime - c.startedAt;
            if (elapsed >= c.duration) {
                endCelebration();
                clearInterval(timer);
            }
        }, 100);
        return () => {
            clearInterval(timer);
        };
    }, [activeCelebration, endCelebration]);

    useEffect(() => {
        if (!activeCelebration || !activeCelebration.active) return;
        const team = activeCelebration.team || 'HOME';
        const isLate = matchTime >= 80;
        const key = `${team}_${isLate ? 'LATE' : 'NORMAL'}`;
        setBenchReaction({
            team,
            key,
            late: isLate
        });
        const timer = setTimeout(() => {
            setBenchReaction(null);
        }, 2600);
        return () => {
            clearTimeout(timer);
        };
    }, [activeCelebration, matchTime]);

    useEffect(() => {
        if (ballState !== 'GOAL') return;
        const chance = Math.random();
        if (chance > 0.55) return;
        setVarState({
            step: 'CHECKING',
            decision: 'GOAL_CONFIRMED'
        });
        const t1 = setTimeout(() => {
            setVarState({
                step: 'DECISION',
                decision: 'GOAL_CONFIRMED'
            });
        }, 1600);
        const t2 = setTimeout(() => {
            setVarState({
                step: 'IDLE',
                decision: 'GOAL_CONFIRMED'
            });
        }, 3600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [ballState]);

    const fanTier = fanHype >= 70 ? 'HIGH' : fanHype >= 40 ? 'MEDIUM' : 'LOW';

    // Match Flow UI Overlays
    if (matchPhase === 'PRELOAD' || matchPhase === 'TEAM_SETUP' || matchPhase === 'STADIUM_LOAD') {
         return (
             <div className="absolute inset-0 bg-black text-white flex flex-col items-center justify-center z-50">
                 <div className="text-3xl font-black italic tracking-tighter mb-4 animate-pulse">
                     {matchPhase.replace('_', ' ')}
                 </div>
                 <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 animate-[width_2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                 </div>
                 <div className="mt-2 text-xs text-gray-500 font-mono">
                     {isMobile ? 'OPTIMIZING FOR MOBILE' : 'LOADING ASSETS'}
                 </div>
             </div>
         );
    }

    return (
        <div className="w-full h-screen bg-black relative select-none overflow-hidden">
            {(!showMobileWarning && viewMode === '3D') ? (
            <Canvas 
                shadows={enableShadows} 
                dpr={canvasDpr} 
                camera={{ 
                    position: [camConfig.position[0], camConfig.position[1], camConfig.position[2]] as any, 
                    fov: camConfig.fov,
                    zoom: camConfig.zoom
                }}
                gl={{ 
                    antialias: true, 
                    powerPreference: 'high-performance',
                    // Use Gamma (sRGB) encoding by default in R3F (linear={false})
                    // This matches "Color Space: Gamma" requirement
                }}
            >
                {!isMobile && settings.graphicsQuality !== 'LOW' && <Sky sunPosition={[100, 20, 100]} />}
                
                {/* Lighting Strategy: One Directional + One Ambient (Performance First) */}
                <ambientLight
                    intensity={
                        (isMobile ? 0.5 : 0.6) *
                        (settings.graphicsQuality === 'LOW' ? 0.7 : 0.8 + crowdIntensity * 0.4)
                    }
                />
                <directionalLight
                    position={[50, 50, 25]}
                    castShadow={enableShadows}
                    intensity={
                        (isMobile ? 0.8 : 1.2) *
                        (settings.graphicsQuality === 'LOW' ? 0.75 : 0.85 + crowdIntensity * 0.3)
                    }
                    shadow-mapSize={[1024, 1024]}
                    shadow-camera-left={-50}
                    shadow-camera-right={50}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                />
                
                <Physics gravity={[0, -9.81, 0]}>
                    {loadStage >= 2 && <Stadium />}
                    {loadStage >= 1 && <Pitch />}
                    {loadStage >= 1 && <Ball />}
                    {loadStage >= 3 && (
                        <>
                            <Player playerId={currentPlayer.id} onPositionChange={setPlayerPosition} />
                            <AIPlayer startPos={[10, 1, 0]} />
                            <Goalkeeper
                                difficulty={
                                    settings.aiDifficulty === 'BEGINNER'
                                        ? 'EASY'
                                        : settings.aiDifficulty === 'ADVANCED'
                                        ? 'HARD'
                                        : 'MEDIUM'
                                }
                                personality={keeperPersonality}
                            />
                        </>
                    )}
                </Physics>

                <ThirdPersonCamera target={playerPosition} />
                
                {/* <OrbitControls /> Disable orbit controls to use game controls */}
            </Canvas>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white relative">
                    <div className="absolute inset-0 bg-black/50 z-0"></div>
                    {viewMode === '2D' && (
                        <div className="z-10 text-center p-8 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10">
                            <div className="text-4xl mb-4">📋</div>
                            <h2 className="text-2xl font-bold mb-2">2D Tactical View</h2>
                            <p className="text-gray-400 mb-6">Simplified match simulation running...</p>
                            <div className="text-sm text-emerald-400 font-mono text-xl font-bold mb-4">
                                {scoreHome} - {scoreAway} <span className="text-white/50 text-sm font-normal">({Math.floor(matchTime)}')</span>
                            </div>
                            <button 
                                onClick={handleExitClick}
                                className="mt-2 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-bold transition-colors"
                            >
                                Exit Match
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {isMobile && viewMode === '3D' && !showMobileWarning && settings.virtualStickEnabled && <TouchControls />}

            {showMobileWarning && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 px-6 backdrop-blur-sm">
                    <div className="max-w-sm w-full bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
                        <div className="text-3xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-white mb-2">Mobile Browser Detected</h2>
                        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            WebGL 3D graphics may be unstable or slow on mobile browsers.
                            <br /><br />
                            For the best experience (smooth 60 FPS & no crashes), please use a <strong>Desktop PC</strong> or wait for our upcoming <strong>Native App (Android/iOS)</strong>.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDismissMobileWarning}
                                className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                            >
                                Continue with 3D (Experimental)
                            </button>
                            <button 
                                onClick={handleSwitchTo2D}
                                className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-sm hover:bg-emerald-500/20 transition-colors"
                            >
                                Switch to 2D Simulation
                            </button>
                            <button 
                                disabled
                                className="w-full py-3 rounded-xl bg-white/5 text-white/40 font-semibold text-xs border border-white/5 cursor-not-allowed"
                            >
                                Download Native App (Coming Soon)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isRivalMatch && showRivalIntro && mode === 'FRIEND_PVP' && opponent && (
                <div className="absolute inset-0 bg-black/85 flex items-center justify-center pointer-events-none">
                    <div className="px-6 py-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-950 to-black border border-emerald-400/70 text-center max-w-md mx-4">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-emerald-300 mb-1">
                            Rivalry Match
                        </div>
                        <div className="text-2xl font-black text-white">
                            {homeTeamName} vs {awayTeamName}
                        </div>
                        <div className="mt-3 text-xs text-emerald-100">
                            Tunnel stare-down. No handshakes. Crowd already on their feet.
                        </div>
                        <div className="mt-3 text-[11px] text-white/70">
                            Frequent opponents detected. This fixture is officially marked as a rivalry.
                        </div>
                    </div>
                </div>
            )}

            {storyIntro && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-none">
                    <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-sky-900 via-slate-950 to-black border border-sky-400/70 text-center max-w-md mx-4">
                        <div className="text-[11px] uppercase tracking-[0.3em] text-sky-200 mb-1">
                            Story Match
                        </div>
                        <div className="text-2xl font-black text-white">
                            {storyIntro.title}
                        </div>
                        <div className="mt-2 text-xs text-sky-100">
                            {storyIntro.subtitle}
                        </div>
                    </div>
                </div>
            )}

            {showFanIntro && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center pointer-events-none">
                    <div className="px-6 py-4 rounded-2xl bg-gradient-to-br from-emerald-800 via-slate-950 to-black border border-emerald-400/70 text-center max-w-md mx-4">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300 mb-1">
                            Fan Hype
                        </div>
                        {fanTier === 'HIGH' && (
                            <div className="text-sm text-emerald-50">
                                Massive tifo and full-stadium choreo as your team walks out.
                            </div>
                        )}
                        {fanTier === 'MEDIUM' && (
                            <div className="text-sm text-emerald-50">
                                Crowd buzzing with flags and chants ready for kick-off.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {varState.step !== 'IDLE' && (
                <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="px-6 py-2 rounded-xl bg-black/85 border border-yellow-400/70 shadow-lg shadow-black/60 flex items-center gap-3">
                        <div className="px-3 py-1 rounded bg-yellow-400 text-black text-[11px] font-black tracking-[0.25em]">
                            VAR
                        </div>
                        {varState.step === 'CHECKING' && (
                            <div className="text-xs text-yellow-100 font-semibold">
                                Checking goal... Ref at pitchside monitor
                            </div>
                        )}
                        {varState.step === 'DECISION' && (
                            <div className="text-xs text-emerald-200 font-semibold">
                                GOAL CONFIRMED – players and crowd erupt
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute top-3 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                <div className="pointer-events-auto">
                    <button 
                        onClick={handleExitClick}
                        className="px-3 py-1.5 rounded bg-black/70 hover:bg-black/90 text-[11px] font-semibold text-white border border-white/20"
                    >
                        ← Exit Match
                    </button>
                </div>
                <div className="flex flex-col items-center pointer-events-none">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/80 border border-white/15 shadow-lg shadow-black/60">
                        <span className="text-[10px] font-semibold text-white/70 tracking-[0.18em] uppercase max-w-[120px] truncate">
                            {homeTeamName}
                        </span>
                        <span className="text-sm font-black text-white bg-white/10 px-3 py-0.5 rounded-full min-w-[64px] text-center">
                            {scoreHome} : {scoreAway}
                        </span>
                        <span className="text-[10px] font-semibold text-white/70 tracking-[0.18em] uppercase max-w-[120px] truncate text-right">
                            {awayTeamName}
                        </span>
                    </div>
                    {adminEventState.active && (
                        <div className="mt-1 px-3 py-0.5 rounded-full bg-red-700/80 border border-red-400/70 text-[9px] font-semibold text-red-50 uppercase tracking-[0.18em]">
                            {adminEventState.label || 'Admin Abuse Live'} · Boosted Rewards
                        </div>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                        <div className="text-[10px] text-white/70 bg-black/70 px-2 py-0.5 rounded-full">
                            {Math.floor(matchTime)}'
                        </div>
                        <div className="text-[10px] text-white/60 bg-black/60 px-2 py-0.5 rounded-full">
                            {ballState}
                        </div>
                        {isRivalMatch && mode === 'FRIEND_PVP' && (
                            <div className="text-[9px] text-emerald-300 bg-emerald-900/80 border border-emerald-400/70 px-2 py-0.5 rounded-full uppercase tracking-[0.22em]">
                                Rivalry
                            </div>
                        )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <div className="text-[9px] text-white/70 bg-black/60 px-2 py-0.5 rounded-full">
                            Fan Hype
                        </div>
                        <div className="w-24 h-2 rounded-full bg-black/60 overflow-hidden border border-white/10">
                            <div
                                className={`h-full ${
                                    fanTier === 'HIGH'
                                        ? 'bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-700'
                                        : fanTier === 'MEDIUM'
                                        ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500'
                                        : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600'
                                }`}
                                style={{ width: `${fanHype}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white pointer-events-none">
                <PlayerFace playerId={currentPlayer.id} size="lg" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">{currentPlayer.name}</span>
                    <span className="text-xs text-white/70">
                        OVR {currentPlayer.ovr} • {currentPlayer.position} • {currentKit.country}
                    </span>
                </div>
            </div>

            {benchReaction && (
                <div className="absolute bottom-24 left-4 pointer-events-none">
                    <div className="px-4 py-2 rounded-xl bg-black/80 border border-white/20 text-xs max-w-xs">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-300 mb-1">
                            Bench & Coach
                        </div>
                        <div className="text-white/90">
                            {benchReaction.team === 'HOME' && !benchReaction.late && 'Home bench jumps up, coach claps and points to tactics board.'}
                            {benchReaction.team === 'HOME' && benchReaction.late && 'Late winner – substitutes sprint to warm up, coach throws bottles in joy.'}
                            {benchReaction.team === 'AWAY' && !benchReaction.late && 'Home coach shouts at defence, assistants slam tactical board.'}
                            {benchReaction.team === 'AWAY' && benchReaction.late && 'Conceded late – bench looks shocked, staff kick water bottles on the touchline.'}
                        </div>
                    </div>
                </div>
            )}

            {commentaryLine && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none">
                    <div className="px-4 py-2 rounded-2xl bg-black/85 border border-white/25 text-xs text-white/90 max-w-md">
                        {commentaryLine}
                    </div>
                </div>
            )}

            {activeCelebration && activeCelebration.active && (
                <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-16">
                    <div className="px-6 py-3 rounded-2xl bg-black/80 border border-white/20 text-center min-w-[260px]">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">
                            Celebration
                        </div>
                        <div className="text-sm font-semibold text-white mt-1">
                            {activeCelebration.type === 'FIST_PUMP' && 'Fist Pump'}
                            {activeCelebration.type === 'KNEE_SLIDE' && 'Knee Slide'}
                            {activeCelebration.type === 'ARMS_WIDE_RUN' && 'Arms Wide Run'}
                            {activeCelebration.type === 'CALM_DOWN' && 'Calm Down'}
                            {activeCelebration.type === 'POINT_BADGE' && 'Point To Badge'}
                            {activeCelebration.type === 'PHONE_CALL' && 'Phone Call Gesture'}
                            {activeCelebration.type === 'MASK_FACE' && 'Mask Celebration'}
                            {activeCelebration.type === 'SALUTE' && 'Salute'}
                            {activeCelebration.type === 'SLIDE_POINT' && 'Slide And Point'}
                            {activeCelebration.type === 'JUMP_CHEST_THUMP' && 'Jump And Chest Thump'}
                            {activeCelebration.type === 'RUNNING_SPIN' && 'Running Spin'}
                            {activeCelebration.type === 'SHUSH' && 'Shush'}
                            {activeCelebration.type === 'TEAMMATE_HUG' && 'Teammate Hug'}
                            {activeCelebration.type === 'GROUP_HUDDLE' && 'Group Huddle'}
                            {activeCelebration.type === 'BOW' && 'Bow'}
                            {activeCelebration.type === 'SIT_DOWN' && 'Sit Down Pose'}
                            {activeCelebration.type === 'SLIDE_CAMERA' && 'Slide Into Camera'}
                            {activeCelebration.type === 'FLEX' && 'Flex Muscles'}
                            {activeCelebration.type === 'POINT_SKY' && 'Point To Sky'}
                            {activeCelebration.type === 'SIGNATURE' && 'Signature Celebration'}
                        </div>
                        <div className="mt-2 text-[10px] text-white/70">
                            Press Z, X, C quickly to chain moves
                        </div>
                        {activeCelebration.sequence && activeCelebration.sequence.length > 0 && (
                            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-white/80 flex-wrap">
                                {activeCelebration.sequence.map((step, index) => (
                                    <div
                                        key={`${step}-${index}`}
                                        className="px-2 py-1 rounded-full bg-white/10 border border-white/20 max-w-[80px] truncate"
                                    >
                                        {index + 1}.
                                        {step === 'FIST_PUMP' && ' Fist'}
                                        {step === 'KNEE_SLIDE' && ' Slide'}
                                        {step === 'ARMS_WIDE_RUN' && ' Arms Wide'}
                                        {step === 'CALM_DOWN' && ' Calm'}
                                        {step === 'POINT_BADGE' && ' Badge'}
                                        {step === 'PHONE_CALL' && ' Phone'}
                                        {step === 'MASK_FACE' && ' Mask'}
                                        {step === 'SALUTE' && ' Salute'}
                                        {step === 'SLIDE_POINT' && ' Slide+Point'}
                                        {step === 'JUMP_CHEST_THUMP' && ' Jump+Chest'}
                                        {step === 'RUNNING_SPIN' && ' Spin'}
                                        {step === 'SHUSH' && ' Shush'}
                                        {step === 'TEAMMATE_HUG' && ' Hug'}
                                        {step === 'GROUP_HUDDLE' && ' Huddle'}
                                        {step === 'BOW' && ' Bow'}
                                        {step === 'SIT_DOWN' && ' Sit'}
                                        {step === 'SLIDE_CAMERA' && ' SlideCam'}
                                        {step === 'FLEX' && ' Flex'}
                                        {step === 'POINT_SKY' && ' Sky'}
                                        {step === 'SIGNATURE' && ' Signature'}
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeCelebration.bonusEarned && (
                            <div className="mt-2 text-[10px] font-semibold text-emerald-300">
                                Perfect chain: bonus coins added
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 right-4 text-xs text-white/80 bg-black/60 px-3 py-2 rounded pointer-events-auto max-w-xs">
                <div className="font-semibold text-white mb-1">
                    Substitutions {subsUsed}/{maxSubs}
                </div>
                {benchIds.length === 0 && (
                    <div className="text-[10px] text-gray-400">
                        No reserves available. Add more players to your squad.
                    </div>
                )}
                {benchIds.map(id => {
                    const p = allPlayers.find(pl => pl.id === id);
                    if (!p) return null;
                    const disabled = subsUsed >= maxSubs;
                    return (
                        <div key={id} className="flex items-center justify-between py-1 border-b border-white/10 last:border-0">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold">{p.name}</span>
                                <span className="text-[10px] text-gray-400">
                                    {p.position} • OVR {p.ovr}
                                </span>
                            </div>
                            <button
                                disabled={disabled}
                                onClick={() => {
                                    if (disabled) return;
                                    setSubsUsed(prev => prev + 1);
                                    setBenchIds(prev => prev.filter(x => x !== id).concat(currentPlayer.id));
                                    setActivePlayerId(id);
                                }}
                                className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-400 text-emerald-300 disabled:opacity-50 disabled:border-gray-500 disabled:text-gray-400"
                            >
                                SUB
                            </button>
                        </div>
                    );
                })}
            </div>

            {!isMobile && (
                <div className="absolute top-4 right-4 text-xs text-white/80 bg-black/40 px-3 py-2 rounded pointer-events-none space-y-1">
                    <div className="font-semibold text-white">PC Controls</div>
                    <div>Move: WASD / Arrow Keys</div>
                    <div>Sprint: Shift / Space</div>
                    <div>Pass: Z</div>
                    <div>Shoot: X</div>
                    <div>Skill: C</div>
                    <div>Tackle / Slide: V</div>
                    <div>Switch Player: Q</div>
                    <div className="mt-1 text-[11px] text-white/70">
                        Controller: LS Move, RS Camera, A Pass, B Shoot, X Skill, Y Switch, LB/RB Sprint, LT/RT Tackle
                    </div>
                </div>
            )}
            {showSummary && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm text-center space-y-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
                            Match Finished
                        </div>
                        <div className="text-2xl font-black text-white">
                            {scoreHome} - {scoreAway}
                        </div>
                        <div className="text-sm text-gray-300">
                            {scoreHome > scoreAway && 'You won against your friend!'}
                            {scoreHome === scoreAway && 'Draw vs your friend.'}
                            {scoreHome < scoreAway && 'You lost this match.'}
                        </div>
                        {isRivalMatch && (
                            <div className="text-xs text-emerald-300">
                                Rivalry chapter updated. This fixture just got even hotter.
                            </div>
                        )}
                        <div className="text-sm text-yellow-300 font-semibold">
                            {scoreHome > scoreAway && '+75 Coins'}
                            {scoreHome === scoreAway && '+40 Coins'}
                            {scoreHome < scoreAway && '+20 Coins'}
                        </div>
                        {celebrationComboBonus > 0 && (
                            <div className="text-xs text-emerald-300">
                                +{celebrationComboBonus} Celebration Bonus
                            </div>
                        )}
                        <button
                            onClick={handleCollectRewards}
                            className="mt-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white w-full"
                        >
                            Collect Rewards & Exit
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

class GameErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: any) {
        console.error('GameScene error', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center text-center text-white px-6">
                    <div className="max-w-sm space-y-3">
                        <div className="text-[11px] uppercase tracking-[0.28em] text-red-400">
                            Match Error
                        </div>
                        <div className="text-2xl font-black">
                            Something went wrong in this match
                        </div>
                        <div className="text-sm text-gray-300">
                            Reload the page or go back to the main menu and try again. If this keeps
                            happening on a low-end device, lower the graphics preset in Settings.
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const GameSceneWithBoundary = () => (
    <GameErrorBoundary>
        <GameScene />
    </GameErrorBoundary>
);

export default GameSceneWithBoundary;
