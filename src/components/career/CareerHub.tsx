import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface LeagueTeam {
    id: string;
    name: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gd: number;
    points: number;
}

const MOCK_TABLE: LeagueTeam[] = [
    { id: '1', name: 'Manchester City', played: 12, won: 10, drawn: 1, lost: 1, gd: 25, points: 31 },
    { id: '2', name: 'Liverpool', played: 12, won: 9, drawn: 2, lost: 1, gd: 18, points: 29 },
    { id: '3', name: 'Arsenal', played: 12, won: 8, drawn: 3, lost: 1, gd: 15, points: 27 },
    { id: 'user', name: 'MRN Legends (You)', played: 12, won: 7, drawn: 2, lost: 3, gd: 8, points: 23 },
    { id: '5', name: 'Chelsea', played: 12, won: 6, drawn: 3, lost: 3, gd: 5, points: 21 },
    { id: '6', name: 'Spurs', played: 12, won: 5, drawn: 2, lost: 5, gd: 2, points: 17 },
];

export const CareerHub: React.FC = () => {
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'LEAGUE' | 'CUP' | 'OBJECTIVES'>('LEAGUE');

    return (
        <div className="w-full h-full bg-slate-900 p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        CAREER MODE
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-bold border border-blue-500/30">SEASON 1</span>
                        <span>•</span>
                        <span>Division 10</span>
                        <span>•</span>
                        <span className="text-yellow-400 font-bold">Next Match: vs Chelsea</span>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-lg border border-teal-500/50">
                        <span className="material-icons text-teal-400 text-sm">calendar_month</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-teal-300 uppercase font-bold tracking-wider">Season Tokens</span>
                            <span className="text-sm font-bold text-teal-200">{user?.seasonTokens ?? 0}</span>
                        </div>
                    </div>
                    <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded shadow-lg shadow-blue-900/50 transition-all transform hover:scale-105">
                        PLAY NEXT MATCH
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg w-fit mb-6">
                {(['LEAGUE', 'CUP', 'OBJECTIVES'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded font-bold text-sm transition-colors ${
                            activeTab === tab 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Content (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'LEAGUE' && (
                        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                            <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-slate-200">League Table</h3>
                                <span className="text-xs text-slate-500 uppercase font-bold">Division 10</span>
                            </div>
                            <div className="p-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-500 border-b border-slate-700/50">
                                            <th className="text-left py-2 font-bold w-10">#</th>
                                            <th className="text-left py-2 font-bold">Team</th>
                                            <th className="text-center py-2 font-bold w-10">P</th>
                                            <th className="text-center py-2 font-bold w-10">W</th>
                                            <th className="text-center py-2 font-bold w-10">D</th>
                                            <th className="text-center py-2 font-bold w-10">L</th>
                                            <th className="text-center py-2 font-bold w-10">GD</th>
                                            <th className="text-center py-2 font-bold w-12 text-white">PTS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_TABLE.map((team, idx) => (
                                            <tr 
                                                key={team.id} 
                                                className={`border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors ${
                                                    team.id === 'user' ? 'bg-blue-900/20' : ''
                                                }`}
                                            >
                                                <td className={`py-3 pl-2 font-bold ${idx < 3 ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {idx + 1}
                                                </td>
                                                <td className="py-3 font-semibold text-slate-200">
                                                    {team.name}
                                                    {team.id === 'user' && <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 rounded">YOU</span>}
                                                </td>
                                                <td className="text-center text-slate-400">{team.played}</td>
                                                <td className="text-center text-slate-400">{team.won}</td>
                                                <td className="text-center text-slate-400">{team.drawn}</td>
                                                <td className="text-center text-slate-400">{team.lost}</td>
                                                <td className="text-center text-slate-400">{team.gd}</td>
                                                <td className="text-center font-bold text-white">{team.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CUP' && (
                        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-8 flex flex-col items-center justify-center min-h-[300px]">
                            <span className="text-6xl mb-4">🏆</span>
                            <h3 className="text-xl font-bold text-white mb-2">Legends Cup</h3>
                            <p className="text-slate-400 text-center max-w-md">
                                The cup competition starts in Week 5 of the season. 
                                Keep playing league matches to qualify!
                            </p>
                        </div>
                    )}

                    {activeTab === 'OBJECTIVES' && (
                        <div className="space-y-3">
                            {[
                                { title: 'Score 50 Goals', progress: 34, total: 50, reward: '5,000 Coins' },
                                { title: 'Win the League', progress: 23, total: 31, reward: 'Premium Pack', type: 'points' },
                                { title: 'Clean Sheets (5)', progress: 2, total: 5, reward: '100 Diamonds' },
                            ].map((obj, i) => (
                                <div key={i} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-200">{obj.title}</h4>
                                        <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden">
                                            <div 
                                                className="bg-green-500 h-full rounded-full" 
                                                style={{ width: `${(obj.progress / obj.total) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{obj.progress} / {obj.total} {obj.type === 'points' ? 'Points' : ''}</p>
                                    </div>
                                    <div className="ml-6 text-right">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider">Reward</div>
                                        <div className="font-bold text-yellow-400">{obj.reward}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Info (1/3 width) */}
                <div className="space-y-6">
                    {/* Manager Status */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-3xl">
                                👔
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">Manager Rating</h3>
                                <div className="text-green-400 font-bold text-xl">8.5/10</div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            The board is satisfied with your current performance. Secure a top 4 finish to guarantee your contract extension.
                        </p>
                    </div>

                    {/* Season Rewards */}
                    <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50">
                        <h3 className="font-bold text-slate-300 mb-4 text-sm uppercase tracking-wider">Season Rewards</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30">
                                <div className="w-10 h-10 bg-yellow-500/20 rounded flex items-center justify-center text-xl">🥇</div>
                                <div>
                                    <div className="font-bold text-white text-sm">Title Winner</div>
                                    <div className="text-xs text-yellow-400">100,000 Coins + Icon</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-700/30 opacity-50">
                                <div className="w-10 h-10 bg-slate-600/20 rounded flex items-center justify-center text-xl">🥈</div>
                                <div>
                                    <div className="font-bold text-white text-sm">Runner Up</div>
                                    <div className="text-xs text-slate-400">50,000 Coins</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
