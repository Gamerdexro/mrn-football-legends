import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { MatchRules, Stadium } from '../../types/match';

interface FriendlyMatchLobbyProps {
  onCreateLobby: (rules: MatchRules, stadium: Stadium) => void;
  onJoinLobby: (lobbyId: string) => void;
  availableLobbies: any[];
  onCancel: () => void;
}

export const FriendlyMatchLobby: React.FC<FriendlyMatchLobbyProps> = ({
  onCreateLobby,
  onJoinLobby,
  availableLobbies,
  onCancel,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [timeLength, setTimeLength] = useState(45);
  const [allowCards, setAllowCards] = useState(true);
  const [allowOffsides, setAllowOffsides] = useState(true);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'normal' | 'hard' | 'expert'>('normal');
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [selectedStadium, setSelectedStadium] = useState<Stadium>({
    id: 'stadium-1',
    name: 'Premier Stadium',
    capacity: 60000,
    grassType: 'natural',
    length: 105,
    width: 68,
    lightingLevel: 100,
    model: 'premier',
  });

  const stadiums: Stadium[] = [
    {
      id: 'stadium-1',
      name: 'Premier Stadium',
      capacity: 60000,
      grassType: 'natural',
      length: 105,
      width: 68,
      lightingLevel: 100,
      model: 'premier',
    },
    {
      id: 'stadium-2',
      name: 'Night Arena',
      capacity: 50000,
      grassType: 'artificial',
      length: 105,
      width: 68,
      lightingLevel: 40,
      model: 'night',
    },
    {
      id: 'stadium-3',
      name: 'Compact Stadium',
      capacity: 30000,
      grassType: 'natural',
      length: 100,
      width: 65,
      lightingLevel: 100,
      model: 'compact',
    },
  ];

  const handleCreateLobby = () => {
    const rules: MatchRules = {
      timeLength,
      allowCards,
      allowOffsides,
      aiDifficulty,
      allowSpectators,
      allowExtraTime: true,
    };
    onCreateLobby(rules, selectedStadium);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Friendly Match</h1>

        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Create Match */}
          <button
            onClick={() => setMode('create')}
            className={`p-6 rounded-lg border-2 transition-all ${
              mode === 'create'
                ? 'bg-blue-600 border-blue-400'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-white">+ Create Match</div>
            <div className="text-gray-300 text-sm mt-2">Host a new friendly match</div>
          </button>

          {/* Join Match */}
          <button
            onClick={() => setMode('join')}
            className={`p-6 rounded-lg border-2 transition-all ${
              mode === 'join'
                ? 'bg-blue-600 border-blue-400'
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl font-bold text-white">🔗 Join Match</div>
            <div className="text-gray-300 text-sm mt-2">Join an existing match lobby</div>
          </button>
        </div>

        {mode === 'create' ? (
          // Create Mode
          <div className="bg-gray-800/50 border border-blue-500 rounded-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Create Friendly Match</h2>

            {/* Time Length */}
            <div>
              <label className="block text-white font-semibold mb-3">Match Duration (per half)</label>
              <div className="flex gap-4">
                {[15, 30, 45, 60, 90].map((time) => (
                  <button
                    key={time}
                    onClick={() => setTimeLength(time)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      timeLength === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {time} min
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty */}
            <div>
              <label className="block text-white font-semibold mb-3">AI Difficulty</label>
              <div className="flex gap-4">
                {(['easy', 'normal', 'hard', 'expert'] as const).map((difficulty) => (
                  <button
                    key={difficulty}
                    onClick={() => setAiDifficulty(difficulty)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                      aiDifficulty === difficulty
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            {/* Stadium Selection */}
            <div>
              <label className="block text-white font-semibold mb-3">Stadium</label>
              <div className="grid grid-cols-3 gap-4">
                {stadiums.map((stadium) => (
                  <button
                    key={stadium.id}
                    onClick={() => setSelectedStadium(stadium)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedStadium.id === stadium.id
                        ? 'bg-blue-600 border-blue-400'
                        : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold text-white">{stadium.name}</div>
                    <div className="text-xs text-gray-300 mt-1">Capacity: {stadium.capacity.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rules Toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCards}
                  onChange={(e) => setAllowCards(e.target.checked)}
                  className="w-5 h-5 bg-gray-700 rounded"
                />
                <span className="text-white">Allow Yellow/Red Cards</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOffsides}
                  onChange={(e) => setAllowOffsides(e.target.checked)}
                  className="w-5 h-5 bg-gray-700 rounded"
                />
                <span className="text-white">Enforce Offside Rule</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSpectators}
                  onChange={(e) => setAllowSpectators(e.target.checked)}
                  className="w-5 h-5 bg-gray-700 rounded"
                />
                <span className="text-white">Allow Spectators</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={handleCreateLobby}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold"
              >
                ✓ Create Lobby
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          // Join Mode
          <div className="bg-gray-800/50 border border-blue-500 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Available Matches</h2>

            {availableLobbies.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">No open lobbies available</div>
                <button
                  onClick={() => setMode('create')}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Create a Match Instead
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableLobbies.map((lobby) => (
                  <div
                    key={lobby.id}
                    className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-all"
                  >
                    <div>
                      <div className="font-semibold text-white">{lobby.hostName}'s Match</div>
                      <div className="text-sm text-gray-300">
                        {lobby.homePlayers.length}/{lobby.maxPlayers} players
                      </div>
                    </div>
                    <button
                      onClick={() => onJoinLobby(lobby.id)}
                      className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-semibold"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onCancel}
              className="w-full mt-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface LobbyWaitingProps {
  lobbyId: string;
  hostName: string;
  homePlayers: string[];
  awayPlayers: string[];
  maxPlayers: number;
  readyPlayers: Set<string>;
  isHost: boolean;
  onReady: () => void;
  onStartMatch: () => void;
  onLeave: () => void;
  currentUserId: string;
}

export const LobbyWaiting: React.FC<LobbyWaitingProps> = ({
  lobbyId,
  hostName,
  homePlayers,
  awayPlayers,
  maxPlayers,
  readyPlayers,
  isHost,
  onReady,
  onStartMatch,
  onLeave,
  currentUserId,
}) => {
  const isPlayerReady = readyPlayers.has(currentUserId);
  const totalPlayers = homePlayers.length + awayPlayers.length;
  const allReady = readyPlayers.size === totalPlayers;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 to-blue-950 flex items-center justify-center p-8">
      <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-8 max-w-2xl w-full space-y-6">
        <h1 className="text-3xl font-bold text-white text-center">Match Lobby</h1>
        <div className="text-center text-gray-300">Host: {hostName}</div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Home Team */}
          <div>
            <h3 className="text-lg font-bold text-blue-400 mb-3">HOME TEAM</h3>
            <div className="space-y-2">
              {homePlayers.map((playerId, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    readyPlayers.has(playerId)
                      ? 'bg-green-900 border border-green-500'
                      : 'bg-gray-700 border border-gray-600'
                  }`}
                >
                  <span className="text-white">Player {idx + 1}</span>
                  <span className="text-sm">{readyPlayers.has(playerId) ? '✓ Ready' : '⏳'}</span>
                </div>
              ))}
              {homePlayers.length < maxPlayers / 2 && (
                <div className="p-3 rounded-lg bg-gray-700 border border-dashed border-gray-600 text-gray-400 flex items-center justify-center">
                  <span>Waiting for players...</span>
                </div>
              )}
            </div>
          </div>

          {/* Away Team */}
          <div>
            <h3 className="text-lg font-bold text-red-400 mb-3">AWAY TEAM</h3>
            <div className="space-y-2">
              {awayPlayers.map((playerId, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    readyPlayers.has(playerId)
                      ? 'bg-green-900 border border-green-500'
                      : 'bg-gray-700 border border-gray-600'
                  }`}
                >
                  <span className="text-white">Player {idx + 1}</span>
                  <span className="text-sm">{readyPlayers.has(playerId) ? '✓ Ready' : '⏳'}</span>
                </div>
              ))}
              {awayPlayers.length < maxPlayers / 2 && (
                <div className="p-3 rounded-lg bg-gray-700 border border-dashed border-gray-600 text-gray-400 flex items-center justify-center">
                  <span>Waiting for players...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center text-gray-300 py-4 border-t border-gray-700">
          {allReady ? (
            <div className="text-green-400 font-bold">✓ All players ready!</div>
          ) : (
            <div>
              {readyPlayers.size} / {totalPlayers} players ready
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          {!isHost && (
            <button
              onClick={onReady}
              className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                isPlayerReady
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isPlayerReady ? '✓ Ready' : 'I\'m Ready'}
            </button>
          )}

          {isHost && allReady && (
            <button
              onClick={onStartMatch}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold"
            >
              ▶ Start Match
            </button>
          )}

          <button
            onClick={onLeave}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-bold"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
