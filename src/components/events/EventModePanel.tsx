import React, { useState, useEffect, useRef } from 'react';

type TaskType = 'GOAL' | 'ASSIST' | 'TACKLE' | 'FORMATION' | 'LONG_SHOT' | 'PLAY_MATCH' | 'SKILL';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface EventReward {
    coins?: number;
    forgeMaterials?: number;
    eventTokens?: number;
}

interface EventTask {
    id: string;
    type: TaskType;
    title: string;
    description: string;
    progress: number;
    target: number;
    rewards: EventReward;
    isDailyFocus?: boolean;
    completed?: boolean;
    tip?: string;
}

const MOCK_TASKS: EventTask[] = [
    {
        id: 't1',
        type: 'PLAY_MATCH',
        title: 'Clean Sheet Command',
        description: 'Win one match without conceding.',
        progress: 0,
        target: 1,
        rewards: { coins: 250, forgeMaterials: 10 },
        isDailyFocus: true,
        tip: 'Drop your line late; do not dive in near the box.'
    },
    {
        id: 't2',
        type: 'GOAL',
        title: 'Wing Supply Line',
        description: 'Score 2 goals created by wingers.',
        progress: 0,
        target: 2,
        rewards: { coins: 200, eventTokens: 10 },
        isDailyFocus: true,
        tip: 'Switch flanks once before crossing or cutting inside.'
    },
    {
        id: 't3',
        type: 'PLAY_MATCH',
        title: 'Keep The Ball',
        description: 'Hold safe possession for one full in-game minute.',
        progress: 0,
        target: 1,
        rewards: { coins: 150 },
        isDailyFocus: false
    },
    {
        id: 't4',
        type: 'SKILL',
        title: 'No Sprint Discipline',
        description: 'Finish one half using minimal sprinting.',
        progress: 0,
        target: 1,
        rewards: { coins: 150, forgeMaterials: 5 },
        isDailyFocus: false,
        tip: 'Use short passes and jockey instead of full sprint.'
    },
    {
        id: 't5',
        type: 'SKILL',
        title: 'Low Stamina Grit',
        description: 'Win while at least 3 starters end below 40 stamina.',
        progress: 0,
        target: 1,
        rewards: { coins: 200, eventTokens: 10 },
        isDailyFocus: false
    },
    {
        id: 't6',
        type: 'PLAY_MATCH',
        title: 'Comeback Chapter',
        description: 'Turn a losing position into a win.',
        progress: 0,
        target: 1,
        rewards: { coins: 300, eventTokens: 15 },
        isDailyFocus: false
    },
    {
        id: 't7',
        type: 'TACKLE',
        title: 'Press Trap',
        description: 'Win the ball back 5 times in the final third.',
        progress: 0,
        target: 5,
        rewards: { coins: 180, forgeMaterials: 10 },
        isDailyFocus: false
    },
    {
        id: 't8',
        type: 'ASSIST',
        title: 'Perfect Switch',
        description: 'Score once after switching wings before the final pass.',
        progress: 0,
        target: 1,
        rewards: { coins: 200 },
        isDailyFocus: false
    },
    {
        id: 't9',
        type: 'GOAL',
        title: 'Long Shot Moment',
        description: 'Score one goal from outside the box.',
        progress: 0,
        target: 1,
        rewards: { coins: 220, forgeMaterials: 10 },
        isDailyFocus: false
    },
    {
        id: 't10',
        type: 'TACKLE',
        title: 'Keeper’s Night',
        description: 'Win 1–0 after your keeper makes key saves.',
        progress: 0,
        target: 1,
        rewards: { coins: 260, eventTokens: 15 },
        isDailyFocus: false
    },
    {
        id: 't11',
        type: 'FORMATION',
        title: 'Final Chapter',
        description: 'Win one deciding match using your current event identity.',
        progress: 0,
        target: 1,
        rewards: { coins: 400, forgeMaterials: 20, eventTokens: 25 },
        isDailyFocus: false
    }
];

const isTaskCompleted = (task: EventTask) => task.completed || task.progress >= task.target;

const TaskIcon: React.FC<{ type: TaskType; active: boolean }> = ({ type, active }) => {
        let icon = '⚽';
        let bg = 'bg-gray-700';
        
        // Color mapping: Offensive (Green), Defensive (Blue), Skill (Yellow)
        if (['GOAL', 'ASSIST', 'LONG_SHOT'].includes(type)) {
            bg = 'bg-emerald-600';
            if (type === 'GOAL') icon = '🥅';
            if (type === 'ASSIST') icon = '👟';
            if (type === 'LONG_SHOT') icon = '🚀';
        } else if (['TACKLE', 'FORMATION'].includes(type)) { // Assuming FORMATION fits defensive/tactical or map to Blue as requested? 
            // User said "offensive (green), defensive (blue), skill (yellow)". 
            // Let's put TACKLE in Blue. FORMATION is tactical, maybe Blue or Yellow. Let's stick to TACKLE=Blue.
            bg = 'bg-blue-600';
            if (type === 'TACKLE') icon = '🛡️';
            if (type === 'FORMATION') icon = '📋'; // Let's keep formation here or move to yellow if it's "skill".
        } else {
            // Skill, Play Match, etc -> Yellow
            bg = 'bg-yellow-600';
            if (type === 'SKILL') icon = '✨';
            if (type === 'PLAY_MATCH') icon = '⏱️';
        }

        // Override specific icons if needed, but keeping color logic strict
        
        return (
            <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-2xl shadow-lg relative border-2 border-white/10 ${active ? 'animate-pulse ring-2 ring-yellow-400/50 shadow-yellow-500/20' : ''}`}>
                {icon}
                {active && (
                    <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-20"></div>
                )}
            </div>
        );
    };

const TaskCard: React.FC<{ task: EventTask; index: number }> = ({ task, index }) => {
        const isComplete = isTaskCompleted(task);
        const percent = Math.min(100, Math.round((task.progress / task.target) * 100));
        
        // Color coding for title
        let titleColor = 'text-yellow-300';
        if (['GOAL', 'ASSIST', 'LONG_SHOT'].includes(task.type)) titleColor = 'text-emerald-300';
        else if (['TACKLE', 'FORMATION'].includes(task.type)) titleColor = 'text-blue-300';
        
        // Staggered fade-in animation style
        const style = {
            animationDelay: `${index * 60}ms`, // 40-60ms staggered
            animationFillMode: 'both'
        };

        return (
            <div 
                className={`
                    snap-start
                    group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300
                    ${isComplete 
                        ? 'bg-emerald-900/20 border-emerald-500/50' 
                        : `bg-gray-800/80 border-gray-700 hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg ${task.isDailyFocus ? 'border-yellow-500/40 shadow-yellow-500/10' : 'hover:border-yellow-500/50 hover:shadow-yellow-500/5'}`
                    }
                    animate-fade-in-up
                    min-h-[100px]
                `}
                style={style}
            >
                {/* Daily Badge - Visual Cue for Today's Focus */}
                {task.isDailyFocus && !isComplete && (
                    <div className="absolute -top-1.5 -right-1.5 z-10 animate-bounce-short">
                        <span className="relative flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-gray-900 flex items-center justify-center">
                                <span className="text-[8px] text-black font-bold">★</span>
                            </span>
                        </span>
                    </div>
                )}

                {/* Icon */}
                <div className="flex-shrink-0">
                    <TaskIcon type={task.type} active={!!task.isDailyFocus && !isComplete} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                        <h3 className={`text-sm font-bold truncate tracking-wide ${titleColor}`}>
                            {task.title}
                        </h3>
                        {task.tip && !isComplete && (
                            <span className="text-[10px] text-gray-500 cursor-help bg-gray-900/50 px-1.5 py-0.5 rounded border border-gray-700 hover:text-white transition-colors" title={task.tip}>?</span>
                        )}
                    </div>
                    
                    <p className="text-[11px] text-gray-400 truncate mb-3">{task.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 h-2.5 bg-gray-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                            <div 
                                className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-gray-600 via-yellow-600 to-yellow-400'}`}
                                style={{ width: `${percent}%` }}
                            >
                                {isComplete && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                                {!isComplete && task.isDailyFocus && <div className="absolute inset-0 bg-white/10 animate-pulse"></div>}
                            </div>
                            {/* Micro-markers (1/3, 2/3) */}
                            <div className="absolute inset-0 flex justify-evenly opacity-30">
                                <div className="w-px h-full bg-black"></div>
                                <div className="w-px h-full bg-black"></div>
                            </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 w-12 text-right">
                            {task.progress}/{task.target}
                        </span>
                    </div>
                </div>

                {/* Rewards - Horizontal Stack */}
                <div className="flex flex-row items-center justify-end gap-2 pl-3 border-l border-white/5 ml-2 min-w-[100px]">
                    {task.rewards.coins && (
                        <div className="flex flex-col items-center group/reward">
                            <span className="text-base group-hover/reward:-translate-y-1 transition-transform duration-300">💰</span>
                            <span className="text-[9px] text-yellow-300 font-bold">{task.rewards.coins}</span>
                        </div>
                    )}
                    {task.rewards.forgeMaterials && (
                        <div className="flex flex-col items-center group/reward">
                            <span className="text-base group-hover/reward:-translate-y-1 transition-transform duration-300">⚒️</span>
                            <span className="text-[9px] text-purple-300 font-bold">{task.rewards.forgeMaterials}</span>
                        </div>
                    )}
                    {task.rewards.eventTokens && (
                        <div className="flex flex-col items-center group/reward">
                            <span className="text-base group-hover/reward:-translate-y-1 transition-transform duration-300">🎫</span>
                            <span className="text-[9px] text-emerald-300 font-bold">{task.rewards.eventTokens}</span>
                        </div>
                    )}
                </div>

                {/* Completion Overlay with Spark */}
                {isComplete && (
                    <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-20 animate-fade-in border border-emerald-500/30">
                        <div className="bg-emerald-500 text-white rounded-full p-2 shadow-lg shadow-emerald-500/20 transform scale-100 animate-bounce-short relative overflow-hidden">
                             <div className="absolute inset-0 bg-white/50 animate-ping rounded-full opacity-50"></div>
                            <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        );
    };

const RewardsBar: React.FC<{ 
    totalCoins: number; 
    totalMaterials: number; 
    totalTokens: number;
    premiumProgress: number;
}> = ({ totalCoins, totalMaterials, totalTokens, premiumProgress }) => {
    // Simple ref to trigger animations when values change
    const prevCoins = useRef(totalCoins);
    
    useEffect(() => {
        prevCoins.current = totalCoins;
    }, [totalCoins]);

    return (
        <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 p-4 border-t border-yellow-500/20 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-20 relative">
            {/* Glow line top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>

            {/* Earnings */}
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mb-1">Session Earnings</span>
                    <div className="flex items-center gap-3">
                        <div key={totalCoins} className="flex items-center gap-2 bg-yellow-950/30 px-3 py-1.5 rounded-lg border border-yellow-500/20 hover:bg-yellow-900/20 transition-colors group animate-bounce-short">
                            <span className="text-yellow-400 text-sm group-hover:scale-110 transition-transform">💰</span>
                            <span className="text-yellow-100 font-mono text-sm font-bold">{totalCoins}</span>
                        </div>
                        <div key={totalMaterials} className="flex items-center gap-2 bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-500/20 hover:bg-purple-900/20 transition-colors group animate-bounce-short">
                            <span className="text-purple-400 text-sm group-hover:scale-110 transition-transform">⚒️</span>
                            <span className="text-purple-100 font-mono text-sm font-bold">{totalMaterials}</span>
                        </div>
                        <div key={totalTokens} className="flex items-center gap-2 bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-900/20 transition-colors group animate-bounce-short">
                            <span className="text-emerald-400 text-sm group-hover:scale-110 transition-transform">🎫</span>
                            <span className="text-emerald-100 font-mono text-sm font-bold">{totalTokens}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Progress */}
            <div className="flex-1 ml-12 max-w-xs">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <span className="animate-pulse">🏆</span> Premium Reward
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{Math.round(premiumProgress)}%</span>
                </div>
                <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-1000 ease-out"
                        style={{ width: `${premiumProgress}%` }}
                    ></div>
                    <div 
                        className="absolute top-0 bottom-0 w-1 bg-white blur-[1px] transition-all duration-1000 ease-out z-10"
                        style={{ left: `${premiumProgress}%`, opacity: premiumProgress > 0 ? 1 : 0 }}
                    ></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(148,163,184,0.38),_transparent_60%)] opacity-30 mix-blend-overlay"></div>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

interface EventModePanelProps {
    onClose: () => void;
}

export const EventModePanel: React.FC<EventModePanelProps> = ({ onClose }) => {
    const [tasks] = useState<EventTask[]>(MOCK_TASKS);
    const [timeLeft, setTimeLeft] = useState('12:00:00');
    const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
    const panelRef = useRef<HTMLDivElement>(null);

    const completedCount = tasks.filter(t => isTaskCompleted(t)).length;
    const totalCoins = tasks.reduce((acc, t) => acc + (isTaskCompleted(t) ? (t.rewards.coins || 0) : 0), 0);
    const totalMaterials = tasks.reduce(
        (acc, t) => acc + (isTaskCompleted(t) ? (t.rewards.forgeMaterials || 0) : 0),
        0
    );
    const totalTokens = tasks.reduce(
        (acc, t) => acc + (isTaskCompleted(t) ? (t.rewards.eventTokens || 0) : 0),
        0
    );

    const baseScorePerTask = 120;
    const difficultyMultiplier = difficulty === 'EASY' ? 0.8 : difficulty === 'HARD' ? 1.3 : 1;
    const eventScore = Math.round(completedCount * baseScorePerTask * difficultyMultiplier);
    const journeyProgress = Math.min(100, (eventScore / 1800) * 100);

    const totalPoints = tasks.reduce((acc, t) => acc + (isTaskCompleted(t) ? 100 : 0), 0);
    const premiumProgress = Math.min(100, (totalPoints / 1500) * 100);

    const sortedTasks = [...tasks].sort((a, b) => {
        if (isTaskCompleted(a) !== isTaskCompleted(b)) return isTaskCompleted(a) ? 1 : -1;
        if ((a.isDailyFocus || false) !== (b.isDailyFocus || false)) return a.isDailyFocus ? -1 : 1;
        return 0;
    });

    const nextTask = sortedTasks.find(t => !isTaskCompleted(t)) || sortedTasks[sortedTasks.length - 1];
    const nextTaskPlayable = nextTask ? !isTaskCompleted(nextTask) : false;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date();
            end.setHours(24, 0, 0, 0);
            const diff = end.getTime() - now.getTime();

            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);

            setTimeLeft(
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
                    .toString()
                    .padStart(2, '0')}`
            );
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Overlay */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-[url('/img/menu_bg.jpg')] bg-cover opacity-20 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
                
                {/* Ambient Particles (CSS only for now) */}
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent"></div>
            </div>

            {/* Main Panel */}
            <div 
                ref={panelRef}
                className="
                    relative w-[90%] h-[80%]
                    bg-gray-900/95 rounded-2xl shadow-2xl 
                    border-2 border-yellow-500/60 
                    flex flex-col overflow-hidden
                    animate-slide-in-right
                    backdrop-blur-xl
                    ring-1 ring-white/10
                "
            >
                <div className="absolute inset-0 bg-[url('/img/menu_bg.jpg')] bg-cover opacity-10 mix-blend-overlay pointer-events-none"></div>

                {/* Header */}
                <div className="relative z-20 px-6 py-5 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-white/10 flex justify-between items-center shadow-lg">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-yellow-500 text-xl animate-pulse">⚡</span>
                            <h2 className="text-2xl font-black text-white italic tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Daily Legends Event
                            </h2>
                        </div>
                        <div className="mt-2 flex flex-col gap-1">
                            <div className="text-xs text-gray-400 font-mono flex items-center gap-3">
                                <span className="text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/20">
                                    Day 4/7
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span>
                                    Rotation in{' '}
                                    <span className="text-yellow-200 font-bold tracking-widest">{timeLeft}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                        Event Score
                                    </span>
                                    <span className="text-sm font-bold text-yellow-300 font-mono">
                                        {eventScore.toString().padStart(3, '0')}
                                    </span>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                            Journey
                                        </span>
                                        <span className="text-[10px] text-gray-300 font-mono">
                                            {completedCount}/{tasks.length} chapters
                                        </span>
                                    </div>
                                    <div className="mt-1 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-yellow-200 transition-all duration-700"
                                            style={{ width: `${journeyProgress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                Difficulty
                            </span>
                            <div className="mt-1 flex bg-gray-800 rounded-full p-0.5 border border-gray-700">
                                {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(level => {
                                    const active = difficulty === level;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={[
                                                'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors',
                                                active
                                                    ? 'bg-yellow-400 text-black'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                            ].join(' ')}
                                        >
                                            {level}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-red-900/50 hover:border-red-500/50 transition-colors flex items-center justify-center"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                </div>

                {/* Task Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 scroll-smooth relative no-scrollbar snap-y snap-mandatory overscroll-contain z-10">
                    {/* Top Mask Gradient (for scroll hint) */}
                    <div className="sticky top-0 left-0 right-0 h-6 bg-gradient-to-b from-gray-900 via-gray-900/90 to-transparent z-10 pointer-events-none -mt-4 mb-2"></div>
                    
                    {sortedTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                    ))}

                    {/* Bottom Mask Gradient */}
                    <div className="sticky bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent z-10 pointer-events-none -mb-6 mt-2"></div>
                </div>

                <div className="relative z-20 px-4 md:px-6 py-3 bg-black/85 border-t border-white/10 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                            Next challenge
                        </span>
                        <span className="text-sm font-bold text-white truncate max-w-[260px]">
                            {nextTask ? nextTask.title : 'All tasks complete'}
                        </span>
                        {nextTask && (
                            <span className="text-[10px] text-gray-400 truncate max-w-[260px]">
                                {nextTask.description}
                            </span>
                        )}
                    </div>
                    <button
                        disabled={!nextTaskPlayable}
                        onClick={onClose}
                        className={[
                            'px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest transition-colors',
                            nextTaskPlayable
                                ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                                : 'bg-gray-700 text-gray-400 cursor-default'
                        ].join(' ')}
                    >
                        {nextTaskPlayable ? 'Play Next Challenge' : 'Journey Complete'}
                    </button>
                </div>

                <RewardsBar 
                    totalCoins={totalCoins} 
                    totalMaterials={totalMaterials} 
                    totalTokens={totalTokens}
                    premiumProgress={premiumProgress}
                />
            </div>
        </div>
    );
};
