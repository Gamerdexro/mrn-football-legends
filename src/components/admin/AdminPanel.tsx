import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthService } from '../../services/authService';
import { AdminService } from '../../services/admin/AdminService';
import { UserProfile } from '../../types/user';
import { db } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export const AdminPanel: React.FC = () => {
    const { user, adminGift } = useAuthStore();
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [giftAmount, setGiftAmount] = useState({ coins: 0, diamonds: 0 });
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [playerGiftUsername, setPlayerGiftUsername] = useState('');
    const [playerGiftId, setPlayerGiftId] = useState('');
    const [playerGiftStatus, setPlayerGiftStatus] = useState<string | null>(null);

    const isSuperOwner = user?.username === 'ThariqNoR' || user?.username === 'SREEHARI';
    const canAdmin = isSuperOwner || user?.role === 'Owner' || user?.role === 'Admin';

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const users = await AuthService.getAllUsers();
            setAllUsers(users);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!canAdmin) return;
        setLoading(true);
        const unsub = onSnapshot(
            collection(db, 'users'),
            (snapshot) => {
                const users: UserProfile[] = snapshot.docs.map((docSnap) => {
                    const data = docSnap.data() as UserProfile;
                    return {
                        ...data,
                        uid: data.uid || docSnap.id
                    };
                });
                setAllUsers(users);
                setLoading(false);
            },
            () => {
                setLoading(false);
            }
        );
        return () => {
            unsub();
        };
    }, [canAdmin]);

    const handleGift = async (targetUsername: string) => {
        if (giftAmount.coins === 0 && giftAmount.diamonds === 0) return;
        try {
            await adminGift(targetUsername, { coins: giftAmount.coins, diamonds: giftAmount.diamonds });
            alert(`Gift sent to ${targetUsername}`);
            setGiftAmount({ coins: 0, diamonds: 0 });
            fetchUsers(); // Refresh to show updated values if any
        } catch (e) {
            alert('Error sending gift');
        }
    };

    const handlePlayerGift = async () => {
        if (!user) return;
        const username = playerGiftUsername.trim();
        const playerId = playerGiftId.trim();
        if (!username || !playerId) {
            setPlayerGiftStatus('Enter username and player ID');
            return;
        }
        setPlayerGiftStatus('Sending player...');
        try {
            const result = await AdminService.giftPlayer(user, username, playerId);
            setPlayerGiftStatus(result.message);
            setPlayerGiftId('');
        } catch (e: any) {
            const msg = e?.message || 'Error gifting player';
            setPlayerGiftStatus(msg);
        }
    };

    if (!canAdmin) {
        return <div className="p-10 text-white text-center">Access Denied</div>;
    }

    return (
        <div className="w-full h-full bg-slate-900 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-black italic text-red-500">ADMIN CONTROL PANEL</h1>
                <button 
                    onClick={fetchUsers}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                >
                    Refresh List
                </button>
            </div>

            <div className="mb-6 bg-slate-800 rounded-xl border border-red-500/40 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-white">Gift Player By Username</h2>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Target Username"
                        className="min-w-[160px] bg-black/60 border border-slate-600 rounded px-3 py-2 text-sm text-white"
                        value={playerGiftUsername}
                        onChange={(e) => setPlayerGiftUsername(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Player ID"
                        className="min-w-[140px] bg-black/60 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
                        value={playerGiftId}
                        onChange={(e) => setPlayerGiftId(e.target.value)}
                    />
                    <button
                        onClick={handlePlayerGift}
                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold"
                    >
                        Send Player
                    </button>
                    {playerGiftStatus && (
                        <span className="text-xs text-slate-300">
                            {playerGiftStatus}
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-x-auto border border-slate-700">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase">
                        <tr>
                            <th className="p-4">Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Level</th>
                            <th className="p-4">Coins</th>
                            <th className="p-4">Diamonds</th>
                            <th className="p-4">Squad Size</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {loading ? (
                            <tr><td colSpan={7} className="p-10 text-center">Loading users...</td></tr>
                        ) : allUsers.map((u) => (
                            <tr key={u.uid} className="hover:bg-slate-700/50">
                                <td className="p-4 font-bold text-white">
                                    {u.username}
                                    {u.uid === user.uid && <span className="ml-2 text-[10px] bg-blue-600 px-1 rounded">YOU</span>}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        u.role === 'Owner' ? 'bg-red-500/20 text-red-400' : 
                                        u.role === 'Admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-600/20 text-slate-400'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4">{u.level || 1}</td>
                                <td className="p-4 text-yellow-400">{u.coins?.toLocaleString() || 0}</td>
                                <td className="p-4 text-blue-400">{u.diamonds?.toLocaleString() || 0}</td>
                                <td className="p-4">{u.squad?.length || 0}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setSelectedUser(selectedUser === u.username ? null : u.username)}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold"
                                        >
                                            Gift
                                        </button>
                                    </div>
                                    {selectedUser === u.username && (
                                        <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-700 flex gap-2 items-center animate-fadeIn">
                                            <input 
                                                type="number" 
                                                placeholder="Coins" 
                                                className="w-20 bg-black/50 border border-slate-600 rounded px-2 py-1 text-xs"
                                                value={giftAmount.coins || ''}
                                                onChange={(e) => setGiftAmount(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                                            />
                                            <input 
                                                type="number" 
                                                placeholder="Gems" 
                                                className="w-20 bg-black/50 border border-slate-600 rounded px-2 py-1 text-xs"
                                                value={giftAmount.diamonds || ''}
                                                onChange={(e) => setGiftAmount(prev => ({ ...prev, diamonds: parseInt(e.target.value) || 0 }))}
                                            />
                                            <button 
                                                onClick={() => handleGift(u.username)}
                                                className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
