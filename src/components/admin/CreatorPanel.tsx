import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/authService';
import { UserProfile } from '../../types/user';
import { useAuthStore } from '../../store/useAuthStore';

export const CreatorPanel: React.FC = () => {
    const { adminGift } = useAuthStore();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [giftAmount, setGiftAmount] = useState({ coins: 0, diamonds: 0 });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const allUsers = await AuthService.getAllUsers();
            // Sort by creation date (newest first)
            setUsers(allUsers.sort((a, b) => b.createdAt - a.createdAt));
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGift = async () => {
        if (!selectedUser) return;
        try {
            await adminGift(selectedUser, { 
                coins: giftAmount.coins, 
                diamonds: giftAmount.diamonds 
            });
            alert(`Gift sent to ${selectedUser}!`);
            loadUsers(); // Refresh to see updated balances
            setGiftAmount({ coins: 0, diamonds: 0 });
            setSelectedUser(null);
        } catch (error) {
            alert('Failed to send gift: ' + error);
        }
    };

    if (loading) {
        return <div className="text-white text-center p-10">Loading Creator Panel...</div>;
    }

    return (
        <div className="w-full h-full bg-slate-900 p-6 overflow-y-auto">
            <h1 className="text-3xl font-black text-red-500 mb-6 uppercase tracking-wider border-b border-red-500/30 pb-4">
                Creator Control Room
            </h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase font-bold">Total Users</div>
                    <div className="text-2xl font-bold text-white">{users.length}</div>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <div className="text-slate-400 text-xs uppercase font-bold">New Today</div>
                    <div className="text-2xl font-bold text-green-400">
                        {users.filter(u => Date.now() - u.createdAt < 86400000).length}
                    </div>
                </div>
            </div>

            {/* Gift Section */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Send Gift</h3>
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-slate-400 block mb-1">Target Username</label>
                        <select 
                            value={selectedUser || ''}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700"
                        >
                            <option value="">Select User...</option>
                            {users.map(u => (
                                <option key={u.uid} value={u.username}>{u.username} (Lvl {u.level || 1})</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="text-xs text-slate-400 block mb-1">Coins</label>
                        <input 
                            type="number" 
                            value={giftAmount.coins}
                            onChange={(e) => setGiftAmount(prev => ({ ...prev, coins: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700"
                        />
                    </div>
                    <div className="w-32">
                        <label className="text-xs text-slate-400 block mb-1">Diamonds</label>
                        <input 
                            type="number" 
                            value={giftAmount.diamonds}
                            onChange={(e) => setGiftAmount(prev => ({ ...prev, diamonds: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700"
                        />
                    </div>
                    <button 
                        onClick={handleGift}
                        disabled={!selectedUser || (giftAmount.coins === 0 && giftAmount.diamonds === 0)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        SEND
                    </button>
                </div>
            </div>

            {/* User List */}
            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Level</th>
                            <th className="px-6 py-3">Coins</th>
                            <th className="px-6 py-3">Diamonds</th>
                            <th className="px-6 py-3">Created</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {users.map(user => (
                            <tr key={user.uid} className="hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-3 font-bold text-white">
                                    {user.username}
                                    {user.displayName && user.displayName !== user.username && (
                                        <span className="text-xs text-slate-500 ml-2">({user.displayName})</span>
                                    )}
                                </td>
                                <td className="px-6 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        user.role === 'Owner' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                                        user.role === 'Admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-600/20 text-slate-400'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-300">{user.level || 1}</td>
                                <td className="px-6 py-3 text-yellow-400 font-mono">{user.coins?.toLocaleString()}</td>
                                <td className="px-6 py-3 text-blue-400 font-mono">{user.diamonds?.toLocaleString()}</td>
                                <td className="px-6 py-3 text-slate-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
