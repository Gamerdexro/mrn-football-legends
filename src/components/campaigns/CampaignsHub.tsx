import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

type CampaignId = 'FOUNDATIONS' | 'SQUAD_DEPTH' | 'LEGENDS_PATH';

type ChapterId =
    | 'FOUNDATIONS_INTRO'
    | 'FOUNDATIONS_PRESSING'
    | 'FOUNDATIONS_FINISHING'
    | 'DEPTH_ROTATIONS'
    | 'DEPTH_FORMATIONS'
    | 'LEGENDS_BIG_GAMES'
    | 'LEGENDS_LATE_WINNERS';

interface ChapterConfig {
    id: ChapterId;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    order: number;
    rewardCoins: number;
    rewardForgeMaterials: number;
}

interface CampaignConfig {
    id: CampaignId;
    title: string;
    subtitle: string;
    chapters: ChapterConfig[];
}

type EventId = 'RARE_DRAFT' | 'MIDFIELD_CONTROL';

interface EventConfig {
    id: EventId;
    title: string;
    description: string;
    expiresAt: number;
    rewardEventTokens: number;
}

type CampaignProgress = Record<CampaignId, { completedChapters: ChapterId[] }>;

type EventProgress = Record<EventId, { attempts: number; completed: boolean }>;

const CAMPAIGNS: CampaignConfig[] = [
    {
        id: 'FOUNDATIONS',
        title: 'Foundations Tour',
        subtitle: 'Learn systems without rank pressure.',
        chapters: [
            {
                id: 'FOUNDATIONS_INTRO',
                title: 'Kickoff Fundamentals',
                description: 'Play a full match in any mode to feel the flow.',
                difficulty: 'EASY',
                order: 1,
                rewardCoins: 100,
                rewardForgeMaterials: 5
            },
            {
                id: 'FOUNDATIONS_PRESSING',
                title: 'Pressing & Shape',
                description: 'Experiment with pressing and basic defensive shape.',
                difficulty: 'EASY',
                order: 2,
                rewardCoins: 150,
                rewardForgeMaterials: 8
            },
            {
                id: 'FOUNDATIONS_FINISHING',
                title: 'Finishing School',
                description: 'Focus on shot selection and timing.',
                difficulty: 'MEDIUM',
                order: 3,
                rewardCoins: 200,
                rewardForgeMaterials: 10
            }
        ]
    },
    {
        id: 'SQUAD_DEPTH',
        title: 'Squad Depth Trials',
        subtitle: 'Rotate and manage squad properly.',
        chapters: [
            {
                id: 'DEPTH_ROTATIONS',
                title: 'Rotation Basics',
                description: 'Play matches swapping different forwards and mids.',
                difficulty: 'MEDIUM',
                order: 1,
                rewardCoins: 250,
                rewardForgeMaterials: 12
            },
            {
                id: 'DEPTH_FORMATIONS',
                title: 'Shape & Roles',
                description: 'Try different formations to understand trade-offs.',
                difficulty: 'MEDIUM',
                order: 2,
                rewardCoins: 300,
                rewardForgeMaterials: 15
            }
        ]
    },
    {
        id: 'LEGENDS_PATH',
        title: 'Legends Path',
        subtitle: 'Big matches and tight wins.',
        chapters: [
            {
                id: 'LEGENDS_BIG_GAMES',
                title: 'Big Game Nerves',
                description: 'Win a match by one goal margin.',
                difficulty: 'HARD',
                order: 1,
                rewardCoins: 350,
                rewardForgeMaterials: 20
            },
            {
                id: 'LEGENDS_LATE_WINNERS',
                title: 'Late Winners',
                description: 'Score after the 70th minute in a match.',
                difficulty: 'HARD',
                order: 2,
                rewardCoins: 400,
                rewardForgeMaterials: 25
            }
        ]
    }
];

const buildSeasonalEvents = (): EventConfig[] => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return [
        {
            id: 'RARE_DRAFT',
            title: 'Rare Draft Cup',
            description: 'Limited squad, rarity restrictions and controlled matchmaking.',
            expiresAt: now + weekMs,
            rewardEventTokens: 5
        },
        {
            id: 'MIDFIELD_CONTROL',
            title: 'Midfield Control Night',
            description: 'Boosted rewards for possession-focused play and passing.',
            expiresAt: now + weekMs * 2,
            rewardEventTokens: 8
        }
    ];
};

const getCampaignStorageKey = (uid: string) => ['mrn_campaign_progress', uid].join('_');
const getEventStorageKey = (uid: string) => ['mrn_event_progress', uid].join('_');

export const CampaignsHub: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateCurrency } = useAuthStore();
    const [campaignProgress, setCampaignProgress] = useState<CampaignProgress>({} as CampaignProgress);
    const [eventProgress, setEventProgress] = useState<EventProgress>({} as EventProgress);
    const events = useMemo(buildSeasonalEvents, []);

    useEffect(() => {
        if (!user) {
            setCampaignProgress({} as CampaignProgress);
            setEventProgress({} as EventProgress);
            return;
        }
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            const cRaw = localStorage.getItem(getCampaignStorageKey(user.uid));
            if (cRaw) {
                const parsed = JSON.parse(cRaw);
                if (parsed && typeof parsed === 'object') {
                    setCampaignProgress(parsed as CampaignProgress);
                }
            }
        } catch {
        }
        try {
            const eRaw = localStorage.getItem(getEventStorageKey(user.uid));
            if (eRaw) {
                const parsed = JSON.parse(eRaw);
                if (parsed && typeof parsed === 'object') {
                    setEventProgress(parsed as EventProgress);
                }
            }
        } catch {
        }
    }, [user?.uid]);

    if (!user) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black text-white text-sm">
                No profile loaded.
            </div>
        );
    }

    const persistCampaignProgress = (next: CampaignProgress) => {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(getCampaignStorageKey(user.uid), JSON.stringify(next));
        } catch {
        }
    };

    const persistEventProgress = (next: EventProgress) => {
        if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(getEventStorageKey(user.uid), JSON.stringify(next));
        } catch {
        }
    };

    const handleSimulateChapterComplete = (campaignId: CampaignId, chapter: ChapterConfig) => {
        const prev = campaignProgress[campaignId] || { completedChapters: [] };
        if (prev.completedChapters.includes(chapter.id)) {
            return;
        }
        const updatedList = [...prev.completedChapters, chapter.id];
        const next: CampaignProgress = {
            ...campaignProgress,
            [campaignId]: { completedChapters: updatedList }
        };
        setCampaignProgress(next);
        persistCampaignProgress(next);

        const coins = user.coins || 0;
        const materials = user.forgeMaterials || 0;
        if (typeof updateCurrency === 'function') {
            updateCurrency(coins + chapter.rewardCoins, user.diamonds || 0);
        }
        const updatedUser = {
            ...user,
            forgeMaterials: materials + chapter.rewardForgeMaterials
        };
        try {
            localStorage.setItem('mrn_current_user', JSON.stringify(updatedUser));
        } catch {
        }
    };

    const handleSimulateEventRun = (event: EventConfig) => {
        const prev = eventProgress[event.id] || { attempts: 0, completed: false };
        const attempts = prev.attempts + 1;
        const completed = true;
        const nextState = { attempts, completed };
        const next: EventProgress = {
            ...eventProgress,
            [event.id]: nextState
        };
        setEventProgress(next);
        persistEventProgress(next);

        const coins = user.coins || 0;
        const tokens = user.eventTokens || 0;
        if (typeof updateCurrency === 'function') {
            updateCurrency(coins + 200, user.diamonds || 0);
        }
        const updatedUser = {
            ...user,
            eventTokens: tokens + event.rewardEventTokens
        };
        try {
            localStorage.setItem('mrn_current_user', JSON.stringify(updatedUser));
        } catch {
        }
    };

    const now = Date.now();
    const activeEvents = events.filter(e => e.expiresAt > now);

    return (
        <div className="w-full h-screen bg-gradient-to-br from-amber-950 via-slate-950 to-black text-white flex items-center justify-center">
            <div className="w-full max-w-6xl px-4 md:px-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300">
                            Campaigns & Events
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black mt-1">
                            Event Mode Hub
                        </h1>
                        <div className="text-[11px] text-amber-100 mt-1">
                            Structured progression outside rank, with narrative, rewards and seasonal events.
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 text-[11px] font-semibold"
                    >
                        ← Back to Main Menu
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1.4fr] gap-4 md:gap-6 items-stretch">
                    <div className="space-y-4">
                        <div className="menu-card relative rounded-2xl bg-gradient-to-br from-amber-900 via-slate-950 to-black border border-amber-500/70 overflow-hidden p-4 md:p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-amber-200">
                                        Permanent Programs
                                    </div>
                                    <div className="text-lg md:text-xl font-black mt-1">
                                        Campaigns
                                    </div>
                                    <div className="text-[11px] text-amber-100 mt-1">
                                        Always available, linear progress, difficulty fixed per chapter.
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 text-[11px]">
                                {CAMPAIGNS.map(campaign => {
                                    const completed = campaignProgress[campaign.id]?.completedChapters || [];
                                    const total = campaign.chapters.length;
                                    const doneCount = completed.length;
                                    const pct = total > 0 ? Math.max(0, Math.min(100, (doneCount / total) * 100)) : 0;
                                    const nextChapter = campaign.chapters.find(
                                        ch => !completed.includes(ch.id)
                                    );
                                    return (
                                        <div
                                            key={campaign.id}
                                            className="rounded-xl border border-amber-500/60 bg-black/60 px-3 py-3 flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="text-[10px] uppercase tracking-[0.22em] text-amber-200">
                                                        {campaign.title}
                                                    </div>
                                                    <div className="text-[11px] text-amber-50">
                                                        {campaign.subtitle}
                                                    </div>
                                                </div>
                                                <div className="text-right text-[10px] text-amber-200">
                                                    <div>
                                                        {doneCount}/{total} Chapters
                                                    </div>
                                                    <div className="mt-1 w-24 h-1.5 rounded-full bg-amber-950/70 overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-amber-300 via-yellow-300 to-emerald-300"
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                            {nextChapter && (
                                                <div className="mt-1 flex items-center justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-amber-50">
                                                            Next: {nextChapter.title}
                                                        </div>
                                                        <div className="text-[10px] text-amber-100/90">
                                                            {nextChapter.description}
                                                        </div>
                                                        <div className="mt-1 text-[10px] text-amber-200">
                                                            Reward: {nextChapter.rewardCoins} Coins, {nextChapter.rewardForgeMaterials} Forge Materials
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleSimulateChapterComplete(campaign.id, nextChapter)}
                                                        className="px-3 py-1.5 rounded-full bg-amber-400 text-black text-[10px] font-bold uppercase tracking-[0.18em]"
                                                    >
                                                        Complete Chapter
                                                    </button>
                                                </div>
                                            )}
                                            {!nextChapter && (
                                                <div className="mt-1 text-[10px] text-emerald-300">
                                                    Campaign completed. Future chapters can be added without touching rank.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="menu-card relative rounded-2xl bg-gradient-to-br from-sky-900 via-slate-950 to-black border border-sky-500/70 overflow-hidden p-4 md:p-5">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-sky-200">
                                        Time-Limited Events
                                    </div>
                                    <div className="text-lg font-black text-white mt-1">
                                        Seasonal Programs
                                    </div>
                                </div>
                                <div className="text-[10px] text-sky-200">
                                    Event Tokens: <span className="font-semibold">{user.eventTokens || 0}</span>
                                </div>
                            </div>
                            <div className="text-[11px] text-sky-100 mb-3">
                                Special rules, limited squads and modifiers. Rewards include coins, diamonds, forge materials and event tokens.
                            </div>
                            <div className="space-y-3 text-[11px]">
                                {activeEvents.map(event => {
                                    const state = eventProgress[event.id];
                                    const attempts = state?.attempts || 0;
                                    const expiresInMs = event.expiresAt - now;
                                    const expiresInDays = Math.max(0, Math.floor(expiresInMs / (24 * 60 * 60 * 1000)));
                                    return (
                                        <div
                                            key={event.id}
                                            className="rounded-xl border border-sky-500/60 bg-black/65 px-3 py-3 flex flex-col gap-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        {event.title}
                                                    </div>
                                                    <div className="text-[10px] text-sky-100">
                                                        {event.description}
                                                    </div>
                                                </div>
                                                <div className="text-right text-[10px] text-sky-200">
                                                    <div>Attempts: {attempts}</div>
                                                    <div>Reward: {event.rewardEventTokens} Event Tokens</div>
                                                    <div className="mt-0.5 text-[9px] text-sky-300">
                                                        Expires in {expiresInDays}d
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="text-[10px] text-sky-200">
                                                    Uses match attempts, not rank. Seasonal events are the only place for premium-tier rewards.
                                                </div>
                                                <button
                                                    onClick={() => handleSimulateEventRun(event)}
                                                    className="px-3 py-1.5 rounded-full bg-sky-400 text-black text-[10px] font-bold uppercase tracking-[0.18em]"
                                                >
                                                    Simulate Event
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {activeEvents.length === 0 && (
                                    <div className="text-[11px] text-sky-200">
                                        No active events right now. New events will rotate in automatically.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="menu-card relative rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-950 to-black border border-emerald-500/70 overflow-hidden p-4 md:p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-200">
                                        Competitive Separation
                                    </div>
                                    <div className="text-lg font-black text-white mt-1">
                                        Rank System Untouched
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-[11px] text-emerald-100">
                                Campaigns and events never change ranked MMR directly. Rewards are coins, materials and tokens
                                that feed Forge and cosmetics, not rank shortcuts. This keeps competitive play clean.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
