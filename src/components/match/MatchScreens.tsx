import React, { useState } from 'react';
import { MatchPlayer, Celebration } from '../../types/match';

interface CelebrationMenuProps {
  player: MatchPlayer;
  onCelebrationSelect: (celebration: Celebration) => void;
  onClose: () => void;
}

export const CelebrationMenu: React.FC<CelebrationMenuProps> = ({
  player,
  onCelebrationSelect,
  onClose,
}) => {
  const celebrations: Celebration[] = [
    'slide-knees',
    'arms-spread',
    'backflip',
    'heart-hands',
    'knee-pump',
    'jump-turn',
    'shush',
    'point-sky',
    'chest-pound',
    'spin-around',
    'group-celebration',
    'fist-pump',
    'corner-run',
    'pop-off-dance',
    'knee-tap',
    'salute',
    'shoulder-shimmy',
    'slide-flip',
    'slow-wink',
    'jumping-jacks',
    'breakdance',
    'statue-pose',
    'taunt-shrug',
    'wave-crowd',
    'flex',
  ];

  const celebrationEmojis: Record<Celebration, string> = {
    'slide-knees': '⛹️',
    'arms-spread': '🙌',
    'backflip': '🤸',
    'heart-hands': '❤️',
    'knee-pump': '🦵',
    'jump-turn': '🔄',
    'shush': '🤐',
    'point-sky': '☝️',
    'chest-pound': '💪',
    'spin-around': '🌀',
    'group-celebration': '👥',
    'fist-pump': '✊',
    'corner-run': '🏃',
    'pop-off-dance': '💃',
    'knee-tap': '🎯',
    'salute': '🫡',
    'shoulder-shimmy': '💃',
    'slide-flip': '🤾',
    'slow-wink': '😉',
    'jumping-jacks': '🤾',
    'breakdance': '🎪',
    'statue-pose': '🗿',
    'taunt-shrug': '🤷',
    'wave-crowd': '👋',
    'flex': '💪',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-2 border-yellow-400 rounded-lg p-8 max-w-4xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Choose Your Celebration, {player.name}!
        </h2>

        <div className="grid grid-cols-5 gap-4 mb-6">
          {celebrations.map((celebration) => (
            <button
              key={celebration}
              onClick={() => {
                onCelebrationSelect(celebration);
                onClose();
              }}
              className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-yellow-600 rounded-lg transition-all transform hover:scale-110"
            >
              <span className="text-4xl">{celebrationEmojis[celebration]}</span>
              <span className="text-xs text-gray-300 capitalize text-center">{celebration.replace(/-/g, ' ')}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-bold"
        >
          Skip Celebration
        </button>
      </div>
    </div>
  );
};

interface ResultScreenProps {
  homeGoals: number;
  awayGoals: number;
  homeTeamName: string;
  awayTeamName: string;
  matchStats: any;
  onRematch: () => void;
  onExit: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  homeGoals,
  awayGoals,
  homeTeamName,
  awayTeamName,
  matchStats,
  onRematch,
  onExit,
}) => {
  const winner =
    homeGoals > awayGoals ? 'Home' : awayGoals > homeGoals ? 'Away' : 'Draw';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center z-50">
      <div className="text-center space-y-8 max-w-2xl">
        {/* Winner Announcement */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-yellow-400 animate-bounce">
            {winner === 'Draw' ? 'DRAW' : `${winner === 'Home' ? homeTeamName : awayTeamName} WINS!`}
          </h1>
          <div className="text-5xl font-bold text-white">
            {homeGoals} - {awayGoals}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-black/50 backdrop-blur border-2 border-blue-500 rounded-lg p-8 space-y-4">
          <h2 className="text-2xl font-bold text-blue-300 mb-4">Match Statistics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-gray-400 text-sm">Shots</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.homeShots || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Shots</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.awayShots || 0}
              </div>
            </div>

            <div className="text-center">
              <div className="text-gray-400 text-sm">Possession</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.homePossession || 50}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Possession</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.awayPossession || 50}%
              </div>
            </div>

            <div className="text-center">
              <div className="text-gray-400 text-sm">Passes</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.homePasses || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">Passes</div>
              <div className="text-2xl font-bold text-white">
                {matchStats?.awayPasses || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRematch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            🔄 Rematch
          </button>
          <button
            onClick={onExit}
            className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            Exit to Menu
          </button>
        </div>

        {/* Good Sportsmanship */}
        <div className="text-gray-300 italic">
          🤝 Good match! Well played both teams!
        </div>
      </div>
    </div>
  );
};

interface TeamSelectionProps {
  homeTeamPlayers: MatchPlayer[];
  awayTeamPlayers: MatchPlayer[];
  onStartMatch: () => void;
}

export const TeamSelection: React.FC<TeamSelectionProps> = ({
  homeTeamPlayers,
  awayTeamPlayers,
  onStartMatch,
}) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-blue-950 p-8 overflow-y-auto">
      <h1 className="text-4xl font-bold text-white text-center mb-8">Team Lineup</h1>

      <div className="grid grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
        {/* Home Team */}
        <div>
          <h2 className="text-2xl font-bold text-blue-400 mb-4">HOME TEAM</h2>
          <div className="bg-gray-800/50 border-l-4 border-blue-500 rounded-lg p-4 space-y-2">
            {homeTeamPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-2 bg-blue-900/30 rounded">
                <span className="font-bold text-blue-300 w-6">{player.shortNumber}</span>
                <span className="flex-1 text-white">{player.name}</span>
                <span className="text-xs text-gray-400 capitalize">{player.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Away Team */}
        <div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">AWAY TEAM</h2>
          <div className="bg-gray-800/50 border-l-4 border-red-500 rounded-lg p-4 space-y-2">
            {awayTeamPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-2 bg-red-900/30 rounded">
                <span className="font-bold text-red-300 w-6">{player.shortNumber}</span>
                <span className="flex-1 text-white">{player.name}</span>
                <span className="text-xs text-gray-400 capitalize">{player.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={onStartMatch}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-12 py-4 rounded-lg font-bold text-xl"
        >
          ▶ START MATCH
        </button>
      </div>
    </div>
  );
};
