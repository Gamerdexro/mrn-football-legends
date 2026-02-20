import React from 'react';

export const ReplayViewer: React.FC = () => {
  return (
    <div className="w-full h-full bg-slate-900/95 backdrop-blur-md text-white flex flex-col animate-fadeIn">
      <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-600/20">
            <span className="material-icons text-3xl">movie</span>
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Replay Theater</h2>
            <p className="text-slate-400 text-sm">Watch highlights from your recent matches</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
          <span className="material-icons text-4xl text-slate-600">videocam_off</span>
        </div>
        <h3 className="text-xl font-bold mb-2">No Replays Available</h3>
        <p className="text-slate-400 max-w-md">
          Highlights are automatically saved after matches. Play a match to see your best goals and saves here!
        </p>
      </div>
    </div>
  );
};
