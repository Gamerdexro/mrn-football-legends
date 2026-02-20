import React, { useState } from 'react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  reward: { type: 'COINS' | 'GEMS' | 'PACK'; value: number | string };
  completed: boolean;
  category: 'CAREER' | 'SKILL' | 'COLLECTION';
}

export const AchievementsPanel: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'CAREER' | 'SKILL' | 'COLLECTION'>('ALL');

  const achievements: Achievement[] = [
    { id: 'a1', title: 'First Steps', description: 'Win your first match', current: 1, target: 1, reward: { type: 'COINS', value: 500 }, completed: true, category: 'CAREER' },
    { id: 'a2', title: 'Goal Machine', description: 'Score 50 goals', current: 34, target: 50, reward: { type: 'GEMS', value: 100 }, completed: false, category: 'SKILL' },
    { id: 'a3', title: 'Squad Builder', description: 'Reach 80 OVR Team Rating', current: 78, target: 80, reward: { type: 'PACK', value: 'Gold Pack' }, completed: false, category: 'COLLECTION' },
    { id: 'a4', title: 'Invincible', description: 'Win 10 matches in a row', current: 4, target: 10, reward: { type: 'GEMS', value: 500 }, completed: false, category: 'CAREER' },
  ];

  const filtered = filter === 'ALL' ? achievements : achievements.filter(a => a.category === filter);

  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur-md text-white flex flex-col animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-600/20">
            <span className="material-icons text-3xl">emoji_events</span>
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Achievements</h2>
            <p className="text-slate-400 text-sm">Track your milestones and earn rewards</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {['ALL', 'CAREER', 'SKILL', 'COLLECTION'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`
              px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all border
              ${filter === f 
                ? 'bg-white text-slate-900 border-white' 
                : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'}
            `}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.map((ach) => (
          <div 
            key={ach.id}
            className={`
              relative overflow-hidden rounded-xl border p-4 transition-all
              ${ach.completed 
                ? 'bg-slate-800/50 border-slate-700 opacity-70' 
                : 'bg-slate-800 border-white/10 hover:border-purple-500/50'}
            `}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{ach.title}</h3>
              {ach.completed ? (
                <span className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase bg-green-500/10 px-2 py-1 rounded">
                  <span className="material-icons text-sm">check_circle</span>
                  Completed
                </span>
              ) : (
                <div className="flex items-center gap-1 text-purple-400 text-xs font-bold uppercase bg-purple-500/10 px-2 py-1 rounded">
                  <span className="material-icons text-sm">card_giftcard</span>
                  {ach.reward.type === 'PACK' ? ach.reward.value : `${ach.reward.value} ${ach.reward.type}`}
                </div>
              )}
            </div>
            
            <p className="text-slate-400 text-sm mb-3">{ach.description}</p>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${ach.completed ? 'bg-green-500' : 'bg-purple-500'}`}
                style={{ width: `${Math.min((ach.current / ach.target) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-xs text-slate-500 font-mono">{ach.current} / {ach.target}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
