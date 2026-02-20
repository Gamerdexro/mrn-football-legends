import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { UserProfile } from '../../types/user';
import players from '../../data/players.json';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const Settings: React.FC = () => {
    const { settings, updateSettings } = useGameStore();
    const { user } = useAuthStore();

    const [creatorUsers, setCreatorUsers] = useState<UserProfile[]>([]);
    const [creatorLoading, setCreatorLoading] = useState(false);

    const isCreatorOwner = !!user && (user.username === 'ThariqNoR' || user.username === 'SREEHARI' || user.role === 'Owner');

    useEffect(() => {
        if (!isCreatorOwner) return;
        setCreatorLoading(true);
        const unsub = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const list: UserProfile[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data() as UserProfile;
                    return {
                        ...data,
                        uid: data.uid || docSnap.id
                    };
                });
                setCreatorUsers(list);
                setCreatorLoading(false);
            },
            () => {
                setCreatorLoading(false);
            }
        );
        return () => {
            unsub();
        };
    }, [isCreatorOwner]);

    const computeUserOvr = (profile: UserProfile): number => {
        if (!profile.squad || profile.squad.length === 0) return 0;
        const squadPlayers = profile.squad
            .slice(0, 11)
            .map((id) => (players as any[]).find((p) => (p as any).id === id))
            .filter(Boolean) as any[];
        if (squadPlayers.length === 0) return 0;
        const total = squadPlayers.reduce((sum, p) => sum + (p.ovr || 0), 0);
        return Math.round(total / squadPlayers.length);
    };

    return (
        <div className="w-full min-h-[420px] bg-gray-900 p-8 overflow-y-auto">
             <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 mb-8">
                SETTINGS
            </h1>

            <div className="max-w-2xl space-y-8">
                {isCreatorOwner && (
                    <section className="bg-gray-800 p-6 rounded-xl border border-indigo-600">
                        <h2 className="text-xl font-bold text-white mb-4">
                            Creator Panel: User Overview
                        </h2>
                        <p className="text-sm text-gray-400 mb-4">
                            Read-only view of all users for MRN balancing: username, email, id, OVR, and squad size.
                        </p>
                        <div className="mt-2 max-h-72 overflow-y-auto border border-gray-700 rounded-lg">
                            <table className="min-w-full text-left text-xs text-gray-300">
                                <thead className="bg-gray-900 text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-3 py-2">Username</th>
                                        <th className="px-3 py-2">Gmail</th>
                                        <th className="px-3 py-2">User ID</th>
                                        <th className="px-3 py-2">OVR</th>
                                        <th className="px-3 py-2">Squad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {creatorLoading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                                                Loading users...
                                            </td>
                                        </tr>
                                    ) : (
                                        creatorUsers.map((u) => (
                                            <tr key={u.uid} className="hover:bg-gray-900/60">
                                                <td className="px-3 py-2 font-semibold text-white">
                                                    {u.username}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {u.email}
                                                </td>
                                                <td className="px-3 py-2 font-mono text-[11px]">
                                                    {u.uid}
                                                </td>
                                                <td className="px-3 py-2 text-yellow-300">
                                                    {computeUserOvr(u)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {u.squad ? u.squad.length : 0}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🖥️</span> GRAPHICS
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-white font-bold">Quality Preset</div>
                                <div className="text-sm text-gray-400">Affects performance & battery</div>
                            </div>
                            <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                                {(['LOW', 'MEDIUM', 'HIGH'] as const).map(quality => (
                                    <button
                                        key={quality}
                                        onClick={() => updateSettings({ graphicsQuality: quality })}
                                        className={`px-4 py-2 rounded text-sm font-bold transition-colors ${settings.graphicsQuality === quality ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {quality}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gameplay / AI Section */}
                <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🎮</span> GAMEPLAY
                    </h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <div className="text-white font-bold">AI Difficulty</div>
                                <div className="text-sm text-gray-400">Affects reaction, not stats</div>
                            </div>
                            <div className="flex gap-2 bg-gray-900 p-1 rounded-lg">
                                {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => updateSettings({ aiDifficulty: level })}
                                        className={`px-3 py-2 rounded text-xs font-bold transition-colors ${
                                            settings.aiDifficulty === level
                                                ? 'bg-red-600 text-white shadow'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Audio Section */}
                <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>🔊</span> AUDIO
                    </h2>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold">Sound Effects</span>
                            <button 
                                onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.soundEnabled ? 'bg-emerald-600' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${settings.soundEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-white font-bold">Music</span>
                            <button 
                                onClick={() => updateSettings({ musicEnabled: !settings.musicEnabled })}
                                className={`w-14 h-8 rounded-full transition-colors relative ${settings.musicEnabled ? 'bg-emerald-600' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${settings.musicEnabled ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>👤</span> ACCOUNT
                    </h2>
                    
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between p-3 bg-gray-900 rounded">
                            <span className="text-gray-400">Username</span>
                            <span className="font-bold text-white uppercase">
                                {user?.username || user?.displayName || 'Legend'}
                            </span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-900 rounded">
                            <span className="text-gray-400">Level</span>
                            <span className="font-bold text-yellow-400">{user?.level || 1}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-900 rounded">
                            <span className="text-gray-400">User ID</span>
                            <span className="font-mono text-white">{user?.uid}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-900 rounded">
                            <span className="text-gray-400">Role</span>
                            <span className={`font-bold ${user?.role === 'Owner' ? 'text-red-400' : 'text-white'}`}>{user?.role}</span>
                        </div>
                        <div className="flex justify-between p-3 bg-gray-900 rounded">
                            <span className="text-gray-400">Cloud Sync</span>
                            <span className="text-emerald-400 flex items-center gap-1">
                                ● Connected
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
                        <button 
                            onClick={() => useAuthStore.getState().logout()}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-sm">logout</span>
                            Logout
                        </button>
                        
                        <button 
                            onClick={() => {
                                if (window.confirm('ARE YOU SURE? This will PERMANENTLY DELETE your account, squad, and progress. This action cannot be undone.')) {
                                    useAuthStore.getState().deleteAccount();
                                }
                            }}
                            className="w-full py-2 bg-transparent border border-red-900/50 hover:bg-red-900/20 text-red-500 font-bold uppercase tracking-wider rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
                        >
                            <span className="material-icons text-[10px]">delete_forever</span>
                            Delete Account
                        </button>
                    </div>
                </section>

                 <div className="text-center text-xs text-gray-500 mt-8">
                    <p>MRN FOOTBALL LEGENDS v0.0.1</p>
                    <p>© 2026 GTB_STUDIO. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};
