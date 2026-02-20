import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface GameEvent {
    id: string;
    title: string;
    description: string;
    type: 'DAILY' | 'WEEKLY' | 'SPECIAL';
    progress: number;
    total: number;
    reward: string;
    timeLeft: string;
    imageColor: string;
}

const EVENTS: GameEvent[] = [
    {
        id: '1',
        title: 'Midweek Madness',
        description: 'Win 3 matches with a full Premier League squad.',
        type: 'DAILY',
        progress: 1,
        total: 3,
        reward: 'Rare Player Pack',
        timeLeft: '4h 23m',
        imageColor: 'from-orange-500 to-red-600'
    },
    {
        id: '2',
        title: 'Icon Journey',
        description: 'Score 50 goals in any mode to unlock the Icon Chapter.',
        type: 'SPECIAL',
        progress: 42,
        total: 50,
        reward: 'Icon Token',
        timeLeft: '12d 5h',
        imageColor: 'from-purple-600 to-indigo-700'
    },
    {
        id: '3',
        title: 'Weekend League',
        description: 'Qualify for the weekend finals by earning 2000 points.',
        type: 'WEEKLY',
        progress: 1450,
        total: 2000,
        reward: 'Qualification',
        timeLeft: '2d 10h',
        imageColor: 'from-blue-500 to-cyan-500'
    }
];

export const EventsHub: React.FC = () => {
    const { user } = useAuthStore();
    return (
        <div className="w-full h-full bg-slate-900 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                        LIVE EVENTS
                    </h1>
                    <p className="text-slate-400 mt-1">Complete limited-time challenges for exclusive rewards</p>
                </div>
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-orange-500/60 flex items-center gap-2">
                    <span className="material-icons text-orange-400 text-base">local_activity</span>
                    <span className="text-[10px] text-orange-300 uppercase font-bold mr-1 tracking-wider">Event Tokens</span>
                    <span className="text-xl font-bold text-orange-400">{user?.eventTokens ?? 0}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {EVENTS.map(event => (
                    <div key={event.id} className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 group hover:border-slate-500 transition-colors shadow-lg">
                        {/* Event Banner */}
                        <div className={`h-32 bg-gradient-to-br ${event.imageColor} relative p-6 flex flex-col justify-between`}>
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <span className="material-icons text-6xl">event</span>
                            </div>
                            <div className="relative z-10">
                                <span className="bg-black/30 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                    {event.type}
                                </span>
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs font-bold">
                                <span className="material-icons text-sm">schedule</span>
                                {event.timeLeft} Left
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">
                                {event.title}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6 h-10 line-clamp-2">
                                {event.description}
                            </p>

                            {/* Progress */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="text-slate-300 font-bold">Progress</span>
                                    <span className="text-slate-400">{event.progress} / {event.total}</span>
                                </div>
                                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                                    <div 
                                        className={`h-full rounded-full bg-gradient-to-r ${event.imageColor}`} 
                                        style={{ width: `${(event.progress / event.total) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold">Reward</span>
                                    <span className="text-sm font-bold text-yellow-400">{event.reward}</span>
                                </div>
                                <button className="px-6 py-2 bg-white text-slate-900 font-bold rounded-full hover:bg-slate-200 transition-colors text-sm">
                                    PLAY
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
