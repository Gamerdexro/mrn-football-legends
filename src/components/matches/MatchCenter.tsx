import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { MatchService } from '../../services/matches/MatchService';
import { Match } from '../../types/match';
import { useGameStore } from '../../store/useGameStore';
import allPlayers from '../../data/players.json';

const getSquadOvr = (squad: string[]) => {
    if (!squad?.length) return 0;
    const team = allPlayers.filter(p => squad.includes(p.id));
    if (!team.length) return 0;
    const total = team.reduce((acc, p) => acc + p.ovr, 0);
    return Math.round(total / team.length);
};

export const MatchCenter: React.FC = () => {
    const { user } = useAuthStore();
    const { startFriendMatch } = useGameStore();
    const navigate = useNavigate();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [myHostedMatchId, setMyHostedMatchId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = MatchService.subscribeToLobby((data) => {
            setMatches(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Monitor my hosted match
    useEffect(() => {
        if (!myHostedMatchId) return;
        const unsubscribe = MatchService.subscribeToMatch(myHostedMatchId, (match) => {
            if (match && match.teamB) {
                // Opponent joined!
                startFriendMatch({
                    uid: match.teamB.uid,
                    username: match.teamB.username,
                    squad: match.teamB.squad || []
                });
                setMyHostedMatchId(null);
            }
        });
        return () => unsubscribe();
    }, [myHostedMatchId, startFriendMatch]);

    const handleCreateMatch = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const squad = user.squad || [];
            const ovr = getSquadOvr(squad) || 60; // Default OVR if squad is empty
            
            const matchId = await MatchService.createMatch({
                hostId: user.uid,
                username: user.username || 'Unknown',
                ovr,
                squad
            });
            setMyHostedMatchId(matchId);
        } catch (error) {
            console.error("Failed to create match", error);
            setCreating(false);
        }
    };

    const handleJoinMatch = async (matchId: string) => {
        if (!user) return;
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        try {
            const squad = user.squad || [];
            const ovr = getSquadOvr(squad) || 60;

            await MatchService.joinMatch(matchId, {
                uid: user.uid,
                username: user.username || 'Unknown',
                ovr,
                squad
            });
            
            // Start game against host
            startFriendMatch({
                uid: match.teamA.uid,
                username: match.teamA.username,
                squad: match.teamA.squad || []
            });
        } catch (error) {
            console.error("Failed to join match", error);
        }
    };

    return (
        <div className="relative h-full w-full bg-black/90 text-white overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-900/50 to-black">
                <div>
                    <h1 className="text-2xl font-black italic text-white uppercase tracking-wider">Match Center</h1>
                    <p className="text-sm text-emerald-400">Live Global Fixtures</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-full border border-white/20 text-xs font-bold hover:bg-white/10"
                    >
                        BACK TO MENU
                    </button>
                    <button 
                        onClick={handleCreateMatch}
                        disabled={creating}
                        className="px-6 py-2 rounded-full bg-emerald-500 text-black text-xs font-black uppercase tracking-widest hover:bg-emerald-400 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                        {creating ? 'Creating...' : 'Create Match'}
                    </button>
                </div>
            </div>

            {/* Match List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center text-gray-500 mt-20">Loading fixtures...</div>
                ) : matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                        <div className="text-4xl mb-4">🏟️</div>
                        <h3 className="text-lg font-bold text-gray-300">No Active Matches</h3>
                        <p className="text-sm text-gray-500 mb-6">Be the first to host a game!</p>
                        <button 
                            onClick={handleCreateMatch}
                            className="px-6 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
                        >
                            Create New Fixture
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {matches.map(match => (
                            <div key={match.id} className="group relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl p-4 hover:border-emerald-500/50 transition-all hover:-translate-y-1 hover:shadow-xl">
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        match.status === 'WAITING' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                        match.status === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                                        'bg-gray-800 text-gray-400'
                                    }`}>
                                        {match.status}
                                    </span>
                                </div>
                                
                                <div className="mt-2 flex items-center justify-between mb-6">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-center text-emerald-200 font-bold">
                                            {match.teamA.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-xs font-bold mt-2 text-gray-200">{match.teamA.username}</span>
                                        <span className="text-[10px] text-gray-500">OVR {match.teamA.ovr}</span>
                                    </div>
                                    
                                    <div className="text-center px-4">
                                        <div className="text-2xl font-black text-white/20">VS</div>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        {match.teamB ? (
                                            <>
                                                <div className="w-10 h-10 rounded-full bg-red-900/50 border border-red-500/30 flex items-center justify-center text-red-200 font-bold">
                                                    {match.teamB.username.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold mt-2 text-gray-200">{match.teamB.username}</span>
                                                <span className="text-[10px] text-gray-500">OVR {match.teamB.ovr}</span>
                                            </>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                                <span className="text-white/20 text-lg">?</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {match.status === 'WAITING' && match.hostId !== user?.uid && (
                                    <button 
                                        onClick={() => handleJoinMatch(match.id)}
                                        className="w-full py-2 rounded-lg bg-white/5 border border-white/10 text-emerald-400 font-bold text-xs uppercase hover:bg-emerald-500 hover:text-black transition-colors"
                                    >
                                        Join Match
                                    </button>
                                )}
                                {match.status === 'WAITING' && match.hostId === user?.uid && (
                                    <div className="w-full py-2 text-center text-[10px] text-gray-500 italic animate-pulse">
                                        Waiting for opponent...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
