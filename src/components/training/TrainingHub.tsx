import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

interface Drill {
  id: string;
  name: string;
  type: 'ATTACK' | 'DEFENSE' | 'PHYSICAL' | 'TACTICAL';
  cost: number;
  reward: string;
  cooldown: number; // in minutes
  img?: string;
}

export const TrainingHub: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'DRILLS' | 'SKILLS' | 'FORM'>('DRILLS');

  const drills: Drill[] = [
    { id: 'd1', name: 'Shooting Practice', type: 'ATTACK', cost: 10, reward: '+1 SHO', cooldown: 30 },
    { id: 'd2', name: 'Defensive Positioning', type: 'DEFENSE', cost: 10, reward: '+1 DEF', cooldown: 30 },
    { id: 'd3', name: 'Sprints & Stamina', type: 'PHYSICAL', cost: 15, reward: '+1 PAC', cooldown: 60 },
    { id: 'd4', name: 'Pass & Move', type: 'TACTICAL', cost: 12, reward: '+1 PAS', cooldown: 45 },
  ];

  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur-md text-white flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <span className="material-icons text-3xl">fitness_center</span>
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Training Center</h2>
            <p className="text-slate-400 text-sm">Improve your squad attributes</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-emerald-600">
            <span className="material-icons text-emerald-400">arrow_upward</span>
            <span className="font-bold text-xl text-emerald-300">{user?.trainingPoints ?? 0}</span>
            <span className="text-xs text-emerald-400 uppercase font-bold">Training Pts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-4">
        {['DRILLS', 'SKILLS', 'FORM'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`
              flex-1 py-3 px-6 rounded-lg font-bold text-sm uppercase tracking-wider transition-all
              ${activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'DRILLS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {drills.map((drill) => (
              <div 
                key={drill.id}
                className="group relative overflow-hidden bg-slate-800 rounded-xl border border-white/5 hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-900/20"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-5 relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`
                      px-2 py-1 rounded text-[10px] font-bold uppercase
                      ${drill.type === 'ATTACK' ? 'bg-red-500/20 text-red-400' : 
                        drill.type === 'DEFENSE' ? 'bg-green-500/20 text-green-400' :
                        drill.type === 'PHYSICAL' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'}
                    `}>
                      {drill.type}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <span className="material-icons text-[14px]">schedule</span>
                      {drill.cooldown}m
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-1">{drill.name}</h3>
                  <p className="text-slate-400 text-xs mb-6">Boosts specific stats for your active lineup.</p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Reward</span>
                      <span className="font-bold text-blue-400">{drill.reward}</span>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-sm transition-colors flex items-center gap-2">
                      <span>Start</span>
                      <div className="w-px h-3 bg-white/20" />
                      <span className="text-xs opacity-80">{drill.cost} Pts</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SKILLS' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="material-icons text-6xl mb-4 opacity-20">stars</span>
            <p>Skill moves unlock at Level 10</p>
          </div>
        )}

        {activeTab === 'FORM' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <span className="material-icons text-6xl mb-4 opacity-20">trending_up</span>
            <p>Form boosts available before matches</p>
          </div>
        )}
      </div>
    </div>
  );
};
