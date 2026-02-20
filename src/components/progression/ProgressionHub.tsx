import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuthStore } from '../../store/useAuthStore';
// import { useGameStore } from '../../store/useGameStore';

// Mock data for Hub Level
// const HUB_LEVEL_MAX = 50;

type HubSection = {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    color: string;
    icon: string;
    path: string;
    locked?: boolean;
    levelReq?: number;
    badge?: string;
};

export const ProgressionHub: React.FC = () => {
    const navigate = useNavigate();
    // const { user } = useAuthStore();
    const [hubLevel] = useState(12); // Mock level
    const [xpProgress] = useState(75); // Mock XP %

    // Determine today's story (Stormy Derby logic)
    // const todayStory = useMemo(() => {
    //     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    //     const day = days[new Date().getDay()];
    //     return {
    //         title: 'Stormy Derby',
    //         condition: 'Rain • Hard AI • One Chance',
    //         opponent: 'Rival Legends FC'
    //     };
    // }, []);


    const sections: HubSection[] = [
        {
            id: 'story',
            title: 'Stormy Derby',
            subtitle: 'Daily Story Match',
            description: 'Face the elements. One chance only.',
            color: 'from-slate-700 via-slate-800 to-black border-slate-500',
            icon: '⛈️',
            path: '/kickoff?mode=story',
            badge: 'DAILY'
        },
        {
            id: 'journey',
            title: 'Star Journey',
            subtitle: 'Episodes',
            description: 'Branching career. Permanent traits.',
            color: 'from-amber-700 via-amber-900 to-black border-amber-500',
            icon: '⭐',
            path: '/kickoff?mode=journey'
        },
        {
            id: 'training',
            title: 'Training',
            subtitle: 'Mini-Games',
            description: 'Master skills. Earn XP.',
            color: 'from-emerald-800 via-emerald-950 to-black border-emerald-500',
            icon: '⚽',
            path: '/kickoff?mode=training'
        },
        {
            id: 'trophies',
            title: 'Trophies',
            subtitle: 'Replay Walls',
            description: 'Your legacy. Your moments.',
            color: 'from-gray-400 via-gray-600 to-black border-gray-300',
            icon: '🏆',
            path: '/profile?tab=trophies'
        },
        {
            id: 'celebrations',
            title: 'Celebrations',
            subtitle: 'Custom Chains',
            description: 'Crowd reaction. Signature moves.',
            color: 'from-purple-800 via-purple-950 to-black border-purple-500',
            icon: '🕺',
            path: '/shop?tab=celebrations'
        },
        {
            id: 'packs',
            title: 'Packs',
            subtitle: 'Tunnel & Boosts',
            description: 'Match rewards. Contract risks.',
            color: 'from-blue-800 via-blue-950 to-black border-blue-500',
            icon: '🎁',
            path: '/shop?tab=packs'
        }
    ];

    return (
        <div className="w-full h-full bg-slate-950 relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[url('/img/menu_bg.jpg')] bg-cover bg-center opacity-40"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-10 px-6 py-4 md:px-12 md:py-8 flex justify-between items-start">
                <div className="animate-fade-in-down">
                    <div className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-emerald-400 mb-1">
                        Progression Core
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 drop-shadow-lg">
                        LEGENDS JOURNEY HUB
                    </h1>
                </div>

                {/* Hub Level Indicator */}
                <div className="flex flex-col items-end animate-fade-in-down delay-100">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-gray-400">Hub Level</div>
                            <div className="text-3xl font-black text-yellow-400 leading-none">{hubLevel}</div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-yellow-500/50 flex items-center justify-center bg-yellow-900/20 relative">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-800" />
                                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="none" className="text-yellow-500" strokeDasharray={`${xpProgress * 1.38} 138`} />
                            </svg>
                            <span className="text-lg">👑</span>
                        </div>
                    </div>
                    <div className="mt-1 text-[10px] text-gray-500 font-mono">
                        {xpProgress}% to Level {hubLevel + 1}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="relative z-10 flex-1 px-4 md:px-12 pb-8 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                    {sections.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => navigate(section.path)}
                            className={`
                                group relative h-48 md:h-56 rounded-3xl overflow-hidden border border-opacity-40
                                bg-gradient-to-br ${section.color}
                                transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-${section.color.split('-')[1]}-500/20
                                animate-fade-in-up
                            `}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Card Background & Overlay */}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500"></div>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_60%)]"></div>
                            
                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        {section.icon}
                                    </div>
                                    {section.badge && (
                                        <span className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold tracking-wider animate-pulse">
                                            {section.badge}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-1 group-hover:text-white/90 transition-colors">
                                        {section.subtitle}
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2 leading-none group-hover:translate-x-1 transition-transform">
                                        {section.title}
                                    </h3>
                                    <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white transition-colors">
                                        {section.description}
                                    </p>
                                </div>
                            </div>

                            {/* Hover Effect Line */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="relative z-20 p-6 flex justify-center">
                <button
                    onClick={() => navigate('/')}
                    className="px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold hover:bg-white/20 transition-all flex items-center gap-2 group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Main Menu
                </button>
            </div>
        </div>
    );
};
