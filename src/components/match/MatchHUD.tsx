import React, { useState, useEffect } from 'react';
import { useMatchStore } from '../../store/useMatchStore';
import { CommentaryEngine } from '../../services/CommentaryEngine';

const commentaryEngine = new CommentaryEngine();

interface MatchHUDProps {
  matchTime: number;
  homeGoals: number;
  awayGoals: number;
  homePossession: number;
  isPaused: boolean;
  onPause: () => void;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  matchTime,
  homeGoals,
  awayGoals,
  homePossession,
  isPaused,
  onPause,
}) => {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [stamina, setStamina] = useState(100);
  const selectedPlayer = useMatchStore((state) => state.selectedPlayer);

  // Format match time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Update stamina display
  useEffect(() => {
    if (selectedPlayer) {
      setStamina(selectedPlayer.stamina);
    }
  }, [selectedPlayer?.stamina]);

  // Update commentary
  useEffect(() => {
    const interval = setInterval(() => {
      setCommentary(commentaryEngine.updateCommentary());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-10">
      {/* Top Score and Time Display */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Score */}
        <div className="flex items-center gap-8 bg-black/50 backdrop-blur px-8 py-4 rounded-lg border border-white/20">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{homeGoals}</div>
            <div className="text-sm text-gray-300">Home</div>
          </div>
          <div className="text-2xl font-bold text-gray-300">{formatTime(matchTime)}</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{awayGoals}</div>
            <div className="text-sm text-gray-300">Away</div>
          </div>
        </div>

        {/* Match Status */}
        <div className="text-sm text-yellow-400 font-semibold">
          {isPaused ? '⏸ PAUSED' : '● LIVE'}
        </div>
      </div>

      {/* Left Panel - Player Info */}
      <div className="absolute left-4 top-20 space-y-3 pointer-events-auto">
        {/* Player Card */}
        {selectedPlayer && (
          <div className="bg-black/70 backdrop-blur border border-blue-500/50 rounded-lg p-3 w-48">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">{selectedPlayer.shortNumber}</span>
              </div>
              <div>
                <div className="text-white font-bold text-sm">{selectedPlayer.name}</div>
                <div className="text-gray-400 text-xs capitalize">{selectedPlayer.role}</div>
              </div>
            </div>

            {/* Stamina Bar */}
            <div className="mb-2">
              <div className="text-xs text-gray-300 mb-1">Stamina</div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    stamina > 70 ? 'bg-green-500' : stamina > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stamina}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{Math.round(stamina)}%</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800/50 p-1 rounded text-center">
                <div className="text-gray-400">Speed</div>
                <div className="text-blue-400 font-bold">{selectedPlayer.stats.speed}</div>
              </div>
              <div className="bg-gray-800/50 p-1 rounded text-center">
                <div className="text-gray-400">Control</div>
                <div className="text-blue-400 font-bold">{selectedPlayer.stats.control}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Possession & Crowd */}
      <div className="absolute right-4 top-20 space-y-3 pointer-events-auto">
        {/* Possession Meter */}
        <div className="bg-black/70 backdrop-blur border border-purple-500/50 rounded-lg p-3 w-48">
          <div className="text-xs text-gray-400 mb-2 font-semibold">POSSESSION</div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden flex">
                <div className="bg-blue-500 h-full" style={{ width: `${homePossession}%` }} />
                <div className="bg-red-500 h-full" style={{ width: `${100 - homePossession}%` }} />
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Home {Math.round(homePossession)}%</span>
            <span>Away {Math.round(100 - homePossession)}%</span>
          </div>
        </div>

        {/* Crowd Intensity */}
        <div className="bg-black/70 backdrop-blur border border-yellow-500/50 rounded-lg p-3 w-48">
          <div className="text-xs text-gray-400 mb-2 font-semibold">🎭 CROWD</div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${i < 3 ? 'bg-yellow-500' : 'bg-gray-600'}`}
              />
            ))}
          </div>
          <div className="text-xs text-yellow-400 mt-2">🔊 Loud Stadium</div>
        </div>
      </div>

      {/* Bottom Center - Commentary */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 max-w-2xl pointer-events-auto">
        {commentary && (
          <div className="bg-black/70 backdrop-blur border border-green-500/50 rounded-lg p-4 text-center">
            <div className="text-gray-200 italic">{commentary}</div>
          </div>
        )}
      </div>

      {/* Bottom Right - Controls Info */}
      <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-auto">
        <div className="bg-black/70 backdrop-blur border border-gray-600 rounded p-2 space-y-1">
          <div><span className="text-blue-400">W</span> / <span className="text-blue-400">SPACE</span> - Move</div>
          <div><span className="text-blue-400">SPACE</span> - Pass / Shoot</div>
          <div><span className="text-blue-400">SHIFT</span> - Sprint</div>
          <div><span className="text-blue-400">F</span> - Switch Player</div>
          <div><span className="text-blue-400">ESC</span> - Pause</div>
        </div>
      </div>

      {/* Pause Menu */}
      {isPaused && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center pointer-events-auto">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-8 text-center space-y-4">
            <h1 className="text-3xl font-bold text-white">MATCH PAUSED</h1>
            <button
              onClick={onPause}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold"
            >
              Resume Match
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
              Exit to Menu
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold">
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchHUD;
