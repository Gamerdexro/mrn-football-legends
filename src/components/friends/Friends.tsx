import React, { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useGameStore } from '../../store/useGameStore';
import players from '../../data/players.json';
import { AuthService, PRIMARY_OWNER_USERNAME } from '../../services/authService';

interface FriendViewModel {
    uid: string;
    username: string;
    status: 'online' | 'offline';
    lastOnline: string;
    teamOvr: number;
    squad: string[];
}

interface FriendSearchResult {
    uid: string;
    username: string;
    teamOvr: number;
    squad: string[];
    isProtected: boolean;
    relationStatus: 'NONE' | 'FRIEND' | 'OUTGOING_PENDING' | 'INCOMING_PENDING';
}

export const Friends: React.FC = () => {
    const { user } = useAuthStore();
    const { startFriendMatch } = useGameStore();
    const [activeTab, setActiveTab] = useState<'LIST' | 'ADD' | 'REQUESTS'>('LIST');
    const [searchId, setSearchId] = useState('');
    const [friends, setFriends] = useState<FriendViewModel[]>([]);
    const [addStatus, setAddStatus] = useState<string | null>(null);
    const [addError, setAddError] = useState<string | null>(null);
    const [searchResult, setSearchResult] = useState<FriendSearchResult | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<FriendViewModel | null>(null);
    const [showSquad, setShowSquad] = useState(false);
    const [incomingRequests, setIncomingRequests] = useState<FriendViewModel[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const computeTeamOvr = (squadIds: string[]) => {
        if (!squadIds || squadIds.length === 0) return 0;
        const squadPlayers = (squadIds.map(id => (players as any[]).find(p => p.id === id)).filter(p => p !== undefined) || []) as any[];
        if (!squadPlayers.length) return 0;
        const gks = squadPlayers.filter(p => p.position === 'GK');
        const fieldPlayers = squadPlayers.filter(p => p.position !== 'GK');
        const sortedGks = [...gks].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const sortedField = [...fieldPlayers].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const starting: any[] = [];
        if (sortedGks.length > 0) {
            starting.push(sortedGks[0]);
        }
        for (const p of sortedField) {
            if (starting.length >= 11) break;
            starting.push(p);
        }
        if (!starting.length) return 0;
        return Math.round(starting.reduce((acc, p) => acc + (p?.ovr || 0), 0) / starting.length);
    };

    const getSquadDetails = (squadIds: string[]) => {
        const all = players as any[];
        const list = squadIds.map(id => all.find(p => p.id === id)).filter(p => p !== undefined) as any[];
        return [...list].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    };

    const currentTeamOvr = useMemo(() => {
        if (!user) return 0;
        return computeTeamOvr(user.squad);
    }, [user]);

    useEffect(() => {
        if (!user) {
            setFriends([]);
            return;
        }
        AuthService.getFriendsForUser(user.uid)
            .then(list => {
                const mapped: FriendViewModel[] = list.map(profile => ({
                    uid: profile.uid,
                    username: profile.username,
                    status: 'offline',
                    lastOnline: 'Unknown',
                    teamOvr: computeTeamOvr(profile.squad),
                    squad: profile.squad || []
                }));
                setFriends(mapped);
            })
            .catch(() => {
                setFriends([]);
            });
    }, [user]);

    const handleSearchFriend = async () => {
        if (!user) return;
        const term = searchId.trim();
        if (!term) return;
        setAddStatus(null);
        setAddError(null);
        setSearchResult(null);
        setSearchLoading(true);
        try {
            let profile: any = null;
            if (/^\d{6,}$/.test(term)) {
                profile = await AuthService.getUserByUid(term);
            }
            if (!profile) {
                profile = await AuthService.getUserByUsername(term);
            }
            if (!profile) {
                setAddError('User not found');
                return;
            }
            if (profile.uid === user.uid) {
                setAddError('You cannot add yourself');
                return;
            }
            const upperName = (profile.username || '').toUpperCase();
            const isProtected =
                upperName === 'SREEHARI' || upperName === PRIMARY_OWNER_USERNAME.toUpperCase();
            const isAlreadyFriend = friends.some(f => f.uid === profile.uid);
            const relation = await AuthService.getFriendRelation(user.uid, profile.uid);
            setSearchResult({
                uid: profile.uid,
                username: profile.username,
                teamOvr: isProtected && !isAlreadyFriend ? 0 : computeTeamOvr(profile.squad),
                squad: isProtected && !isAlreadyFriend ? [] : (profile.squad || []),
                isProtected: isProtected && !isAlreadyFriend,
                relationStatus: relation.relationStatus
            });
        } catch {
            setAddError('Failed to search user');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddFriend = async () => {
        if (!user || !searchResult) return;
        if (searchResult.relationStatus !== 'NONE') return;
        setAddStatus(null);
        setAddError(null);
        const result = await AuthService.addFriend(user, searchResult.username);
        if (result.success) {
            setAddStatus(result.message);
            setSearchId('');
            const updated = result.updatedCurrent;
            if (updated) {
                const list = await AuthService.getFriendsForUser(updated.uid);
                const mapped: FriendViewModel[] = list.map(profile => ({
                    uid: profile.uid,
                    username: profile.username,
                    status: 'offline',
                    lastOnline: 'Unknown',
                    teamOvr: computeTeamOvr(profile.squad),
                    squad: profile.squad || []
                }));
                setFriends(mapped);
                setSearchResult(prev => prev ? { ...prev, relationStatus: 'OUTGOING_PENDING' } : null);
            }
        } else {
            setAddError(result.message);
        }
    };

    const refreshIncomingRequests = async () => {
        if (!user) {
            setIncomingRequests([]);
            return;
        }
        setRequestsLoading(true);
        try {
            const list = await AuthService.getFriendRequestsForUser(user.uid);
            const mapped: FriendViewModel[] = list.map(profile => ({
                uid: profile.uid,
                username: profile.username,
                status: 'offline',
                lastOnline: 'Unknown',
                teamOvr: computeTeamOvr(profile.squad),
                squad: profile.squad || []
            }));
            setIncomingRequests(mapped);
        } catch {
            setIncomingRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'REQUESTS') {
            refreshIncomingRequests();
        }
    }, [activeTab]);

    const handleRespondToRequest = async (requester: FriendViewModel, accept: boolean) => {
        if (!user) return;
        await AuthService.respondToFriendRequest(user.uid, requester.uid, accept);
        await refreshIncomingRequests();
        const list = await AuthService.getFriendsForUser(user.uid);
        const mapped: FriendViewModel[] = list.map(profile => ({
            uid: profile.uid,
            username: profile.username,
            status: 'offline',
            lastOnline: 'Unknown',
            teamOvr: computeTeamOvr(profile.squad),
            squad: profile.squad || []
        }));
        setFriends(mapped);
    };

    return (
        <div className="w-full h-full bg-gray-900 p-8 overflow-y-auto">
             <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8">
                FRIENDS
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8">
                <button 
                    onClick={() => setActiveTab('LIST')}
                    className={`px-6 py-2 rounded font-bold transition-colors ${activeTab === 'LIST' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    My Friends
                </button>
                <button 
                    onClick={() => setActiveTab('ADD')}
                    className={`px-6 py-2 rounded font-bold transition-colors ${activeTab === 'ADD' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    Add Friend
                </button>
                <button 
                    onClick={() => setActiveTab('REQUESTS')}
                    className={`px-6 py-2 rounded font-bold transition-colors ${activeTab === 'REQUESTS' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                >
                    Requests <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{incomingRequests.length}</span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 min-h-[400px]">
                {activeTab === 'LIST' && (
                    <div className="space-y-4">
                        {user && (
                            <div className="flex items-center justify-between p-4 bg-emerald-900/40 rounded-lg border border-emerald-500/40">
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {user.username}
                                        <span className="text-xs text-gray-500 font-mono">#{user.uid}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        You
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider">Team OVR</div>
                                    <div className="font-bold text-emerald-400 text-lg">{currentTeamOvr}</div>
                                </div>
                            </div>
                        )}
                        {friends.map(friend => (
                            <div key={friend.uid} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-colors">
                                <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xl font-bold text-white relative">
                                        {friend.username[0]}
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {friend.username}
                                            <span className="text-xs text-gray-500 font-mono">#{friend.uid}</span>
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {friend.status === 'online' ? 'Online' : `Last seen: ${friend.lastOnline}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right space-y-2">
                                    <div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Team OVR</div>
                                        <div className="font-bold text-emerald-400 text-lg">{friend.teamOvr}</div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setSelectedFriend(friend);
                                                setShowSquad(true);
                                            }}
                                            className="px-3 py-1 rounded text-[11px] font-semibold border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10"
                                        >
                                            Squad
                                        </button>
                                        <button
                                            onClick={() => {
                                                startFriendMatch({
                                                    uid: friend.uid,
                                                    username: friend.username,
                                                    squad: friend.squad
                                                });
                                            }}
                                            className="px-3 py-1 rounded text-[11px] font-semibold border border-yellow-400 text-yellow-300 hover:bg-yellow-500/10"
                                        >
                                            Challenge
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'ADD' && (
                    <div className="max-w-md mx-auto text-center py-12">
                        <h3 className="text-xl font-bold text-white mb-4">Add Friend by Username or ID</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Enter Username or 6 digit ID"
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                onClick={handleSearchFriend}
                                disabled={searchLoading}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 text-white font-bold rounded transition-colors"
                            >
                                {searchLoading ? 'SEARCHING' : 'SEARCH'}
                            </button>
                        </div>
                        {searchResult && (
                            <div className="mt-6 text-left bg-gray-900 border border-gray-700 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {searchResult.username}
                                            {!searchResult.isProtected && (
                                                <span className="text-xs text-gray-500 font-mono">
                                                    #{searchResult.uid.slice(-6)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Potential friend
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase tracking-wider">Team OVR</div>
                                        <div className="font-bold text-emerald-400 text-lg">
                                            {searchResult.isProtected ? 'Hidden' : searchResult.teamOvr}
                                        </div>
                                    </div>
                                </div>
                                {searchResult.isProtected && (
                                    <div className="mt-2 text-[11px] text-yellow-300">
                                        This account is protected. You must be friends to see squad and OVR.
                                    </div>
                                )}
                                <button
                                    onClick={handleAddFriend}
                                    disabled={searchResult.relationStatus !== 'NONE'}
                                    className="mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-bold rounded transition-colors w-full"
                                >
                                    {searchResult.relationStatus === 'FRIEND'
                                        ? 'Already Friends'
                                        : searchResult.relationStatus === 'OUTGOING_PENDING'
                                            ? 'Request Sent'
                                            : searchResult.relationStatus === 'INCOMING_PENDING'
                                                ? 'Incoming Request'
                                                : 'Send Friend Request'}
                                </button>
                            </div>
                        )}
                        {addStatus && (
                            <p className="mt-4 text-sm text-emerald-400">
                                {addStatus}
                            </p>
                        )}
                        {addError && (
                            <p className="mt-4 text-sm text-red-400">
                                {addError}
                            </p>
                        )}
                    </div>
                )}

                {activeTab === 'REQUESTS' && (
                    <div className="py-4">
                        {requestsLoading && (
                            <div className="text-center py-10 text-gray-400">
                                Loading requests...
                            </div>
                        )}
                        {!requestsLoading && incomingRequests.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                No pending friend requests.
                            </div>
                        )}
                        {!requestsLoading && incomingRequests.length > 0 && (
                            <div className="space-y-4">
                                {incomingRequests.map(requester => (
                                    <div
                                        key={requester.uid}
                                        className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-lg font-bold text-white">
                                                {requester.username[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {requester.username}
                                                    <span className="text-xs text-gray-500 font-mono">#{requester.uid}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Team OVR {requester.teamOvr}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRespondToRequest(requester, true)}
                                                className="px-3 py-1 rounded text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleRespondToRequest(requester, false)}
                                                className="px-3 py-1 rounded text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {showSquad && selectedFriend && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="font-bold text-white flex items-center gap-2">
                                    {selectedFriend.username}
                                    <span className="text-xs text-gray-500 font-mono">#{selectedFriend.uid.slice(-6)}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Friend squad
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400 uppercase tracking-wider">Team OVR</div>
                                <div className="font-bold text-emerald-400 text-lg">{selectedFriend.teamOvr}</div>
                            </div>
                        </div>
                        <div className="max-h-72 overflow-y-auto border border-gray-800 rounded-lg">
                            {getSquadDetails(selectedFriend.squad).map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-800 last:border-0">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{p.name}</div>
                                        <div className="text-[11px] text-gray-400">
                                            {p.position} • OVR {p.ovr}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {getSquadDetails(selectedFriend.squad).length === 0 && (
                                <div className="px-3 py-4 text-center text-sm text-gray-400">
                                    No players in squad.
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowSquad(false);
                                    setSelectedFriend(null);
                                }}
                                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-sm font-semibold text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
