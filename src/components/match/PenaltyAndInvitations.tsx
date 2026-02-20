import React, { useState, useEffect } from 'react';
import { MatchPlayer } from '../../types/match';

interface PenaltyShootoutProps {
  homeTeam: MatchPlayer[];
  awayTeam: MatchPlayer[];
  onShoot: (direction: 'left' | 'center' | 'right', power: number) => void;
  isPlayerTurn: boolean;
  shooterTeam: 'home' | 'away';
  round: number;
  homeGoals: number;
  awayGoals: number;
  gasKeeperDiving?: boolean;
}

export const PenaltyShootout: React.FC<PenaltyShootoutProps> = ({
  homeTeam,
  awayTeam,
  onShoot,
  isPlayerTurn,
  shooterTeam,
  round,
  homeGoals,
  awayGoals,
  gasKeeperDiving,
}) => {
  const [direction, setDirection] = useState<'left' | 'center' | 'right' | null>(null);
  const [power, setPower] = useState(0.5);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isPlayerTurn || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPlayerTurn, countdown]);

  const handleShoot = () => {
    if (direction && onShoot) {
      onShoot(direction, power);
      setDirection(null);
      setPower(0.5);
      setCountdown(5);
    }
  };

  const team = shooterTeam === 'home' ? homeTeam : awayTeam;
  const shooter = team[round % team.length];
  const goalieTeam = shooterTeam === 'home' ? awayTeam : homeTeam;
  const goalies = goalieTeam.filter((p) => p.role === 'goalkeeper');
  const goalie = goalies[0];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="space-y-8 text-center">
        {/* Penalty Round Indicator */}
        <div className="bg-yellow-900/50 border-2 border-yellow-500 rounded-lg p-6">
          <h1 className="text-3xl font-bold text-yellow-300">PENALTY SHOOTOUT</h1>
          <div className="text-2xl font-bold text-white mt-2">Round {round + 1}</div>
        </div>

        {/* Score Display */}
        <div className="flex gap-8 justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{homeGoals}</div>
            <div className="text-gray-300">Home</div>
          </div>
          <div className="text-4xl font-bold text-gray-500">-</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{awayGoals}</div>
            <div className="text-gray-300">Away</div>
          </div>
        </div>

        {/* Shooter & Goalkeeper */}
        <div className="flex gap-12 justify-center">
          {/* Shooter */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">SHOOTER</div>
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">{shooter?.shortNumber}</span>
            </div>
            <div className="text-white font-bold">{shooter?.name}</div>
          </div>

          {/* VS */}
          <div className="flex items-center">
            <div className="text-3xl font-bold text-gray-500">VS</div>
          </div>

          {/* Goalkeeper */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">GOALKEEPER</div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
              gasKeeperDiving ? 'bg-orange-600 animate-pulse' : 'bg-red-600'
            }`}>
              <span className="text-white font-bold">{goalie?.shortNumber}</span>
            </div>
            <div className="text-white font-bold">{goalie?.name}</div>
          </div>
        </div>

        {/* Controls */}
        {isPlayerTurn ? (
          <div className="bg-blue-900/50 border-2 border-blue-500 rounded-lg p-8 space-y-6">
            <div className="text-xl font-bold text-white">
              Time to shoot! {countdown}
            </div>

            {/* Direction Picker */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Choose Direction:</div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDirection('left')}
                  className={`w-20 h-20 rounded-lg font-bold transition-all ${
                    direction === 'left'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  ← LEFT
                </button>
                <button
                  onClick={() => setDirection('center')}
                  className={`w-20 h-20 rounded-lg font-bold transition-all ${
                    direction === 'center'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  ↑ CENTER
                </button>
                <button
                  onClick={() => setDirection('right')}
                  className={`w-20 h-20 rounded-lg font-bold transition-all ${
                    direction === 'right'
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  RIGHT →
                </button>
              </div>
            </div>

            {/* Power Slider */}
            <div>
              <div className="text-sm text-gray-400 mb-3">Power: {Math.round(power * 100)}%</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={power}
                onChange={(e) => setPower(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Shoot Button */}
            <button
              onClick={handleShoot}
              disabled={!direction}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold"
            >
              🎯 SHOOT!
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 border-2 border-gray-600 rounded-lg p-8">
            <div className="text-xl text-white mb-4">Waiting for opponent...</div>
            <div className="animate-pulse">⏳</div>
          </div>
        )}
      </div>
    </div>
  );
};

interface FriendInvitationProps {
  onSendInvite: (friendId: string) => void;
  onCancel: () => void;
  friends: Array<{ id: string; name: string; isOnline: boolean }>;
}

export const FriendInvitation: React.FC<FriendInvitationProps> = ({
  onSendInvite,
  onCancel,
  friends,
}) => {
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleSendInvites = () => {
    selectedFriends.forEach((friendId) => {
      onSendInvite(friendId);
    });
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-lg max-w-md w-full space-y-6 p-8">
        <h2 className="text-2xl font-bold text-white">Invite Friends</h2>

        {/* Friends List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No friends available</div>
          ) : (
            friends.map((friend) => (
              <label
                key={friend.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={selectedFriends.has(friend.id)}
                  onChange={() => toggleFriendSelection(friend.id)}
                  className="w-4 h-4 bg-gray-700 rounded"
                />
                <div className="flex-1">
                  <div className="text-white font-semibold">{friend.name}</div>
                  <div className={`text-xs ${friend.isOnline ? 'text-green-400' : 'text-gray-500'}`}>
                    {friend.isOnline ? '🟢 Online' : '⚫ Offline'}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={handleSendInvites}
            disabled={selectedFriends.size === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 rounded-lg font-bold"
          >
            Send Invite ({selectedFriends.size})
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface InvitationNotificationProps {
  from: string;
  matchType: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const InvitationNotification: React.FC<InvitationNotificationProps> = ({
  from,
  matchType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg p-6 border-2 border-purple-400 shadow-lg z-40 max-w-sm animate-slide-in">
      <h3 className="text-white font-bold text-lg mb-2">📬 Match Invitation</h3>
      <p className="text-gray-100 mb-4">
        <span className="font-semibold">{from}</span> invited you to a <span className="font-semibold capitalize">{matchType}</span> match!
      </p>
      <div className="flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold"
        >
          Accept
        </button>
        <button
          onClick={onDecline}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold"
        >
          Decline
        </button>
      </div>
    </div>
  );
};
