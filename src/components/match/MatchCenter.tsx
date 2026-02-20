import React, { useState, useEffect, useCallback } from 'react';
import { useMatchStore } from '../../store/useMatchStore';
import { InputManager } from '../../services/CommentaryEngine';
import { MatchPhysicsEngine, FriendlyMatchService, AIControllerService } from '../../services/matches/MatchEngine';
import { OffsideDetectionService, StaminaSystem, CelebrationSystem } from '../../services/matches/GameRuleServices';
import { MatchHUD } from './MatchHUD';
import { CelebrationMenu, ResultScreen, TeamSelection } from './MatchScreens';
import { FriendlyMatchLobby, LobbyWaiting } from './FriendlyMatchLobby';
import { PenaltyShootout, FriendInvitation } from './PenaltyAndInvitations';
import { MatchPlayer, Match, Stadium, MatchRules, MatchState, Vector3 } from '../../types/match';

interface MatchCenterProps {
  onExit: () => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ onExit }) => {
  // Store
  const {
    matchPhase,
    homeGoals,
    awayGoals,
    matchTime,
    ball,
    selectedPlayer,
    homeTeamPlayers,
    awayTeamPlayers,
    isPaused,
    setMatchPhase,
    startMatch,
    endMatch,
    setControlState,
  } = useMatchStore();

  // Services
  const [physicsEngine] = useState(new MatchPhysicsEngine());
  const [matchService] = useState(new FriendlyMatchService());
  const [aiService] = useState(new AIControllerService());
  const [offsideService] = useState(new OffsideDetectionService());
  const [staminaSystem] = useState(new StaminaSystem());
  const [celebrationSystem] = useState(new CelebrationSystem());
  const [inputManager] = useState(new InputManager());

  // Local state
  const [currentScreen, setCurrentScreen] = useState<'lobby' | 'team-select' | 'in-game' | 'penalty' | 'result'>('lobby');
  const [showCelebrationMenu, setShowCelebrationMenu] = useState(false);
  const [showFriendInvitation, setShowFriendInvitation] = useState(false);
  const [matchStats, setMatchStats] = useState<any>(null);
  const [countdown, setCountdown] = useState(10);
  const [homePossession, setHomePossession] = useState(50);

  // Initialize input manager
  useEffect(() => {
    inputManager.initialize();
    return () => inputManager.destroy();
  }, [inputManager]);

  // Main game loop
  useEffect(() => {
    if (currentScreen !== 'in-game' || matchPhase !== 'in-play' || isPaused) return;

    const gameLoopInterval = setInterval(() => {
      // Update ball physics
      if (ball) {
        const updatedBall = physicsEngine.updateBallPosition(ball as any, 0.016);

        // Update player stamina
        homeTeamPlayers.forEach((player) => {
          const newStamina = Math.max(0, player.stamina - 0.1);
          useMatchStore.setState((state) => ({
            homeTeamPlayers: state.homeTeamPlayers.map((p) =>
              p.id === player.id ? { ...p, stamina: newStamina } : p
            ),
          }));
        });
      }
    }, 1000 / 60); // ~60fps

    return () => clearInterval(gameLoopInterval);
  }, [currentScreen, matchPhase, isPaused, ball, homeTeamPlayers, awayTeamPlayers, physicsEngine]);

  // Countdown for match start
  useEffect(() => {
    if (matchPhase !== 'countdown' || countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
      if (countdown === 1) {
        startMatch();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [matchPhase, countdown, startMatch]);

  // Match time update
  useEffect(() => {
    if (matchPhase !== 'in-play' || isPaused) return;

    const timerInterval = setInterval(() => {
      // Will be updated by the store
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [matchPhase, isPaused]);

  const handleCreateLobby = (rules: MatchRules, stadium: Stadium) => {
    // Initialize friendly match
    const homeTeam: MatchPlayer[] = Array.from({ length: 11 }, (_, i) => ({
      id: `home-player-${i}`,
      name: `Home ${i + 1}`,
      role: ['goalkeeper', 'defender', 'defender', 'defender', 'midfielder', 'midfielder', 'midfielder', 'attacker', 'attacker', 'attacker', 'attacker'][i] as any,
      stats: {
        speed: 75 + Math.random() * 25,
        acceleration: 75 + Math.random() * 25,
        control: 75 + Math.random() * 25,
        strength: 75 + Math.random() * 25,
        shotPower: 75 + Math.random() * 25,
        passing: 75 + Math.random() * 25,
        defense: 75 + Math.random() * 25,
        stamina: 90 + Math.random() * 10,
        agility: 75 + Math.random() * 25,
        heading: 75 + Math.random() * 25,
        dribble: 75 + Math.random() * 25,
        balance: 75 + Math.random() * 25,
      },
      position: { x: 0, y: 0.43, z: 0 },
      rotation: 0,
      stamina: 100,
      maxStamina: 100,
      isSelected: i === 0,
      team: 'home',
      jersey: 'blue',
      shortNumber: i + 1,
      currentAnimation: 'idle',
      velocity: { x: 0, y: 0, z: 0 },
      isSprinting: false,
      fatigue: 0,
    }));

    const awayTeam: MatchPlayer[] = Array.from({ length: 11 }, (_, i) => ({
      id: `away-player-${i}`,
      name: `Away ${i + 1}`,
      role: ['goalkeeper', 'defender', 'defender', 'defender', 'midfielder', 'midfielder', 'midfielder', 'attacker', 'attacker', 'attacker', 'attacker'][i] as any,
      stats: {
        speed: 75 + Math.random() * 25,
        acceleration: 75 + Math.random() * 25,
        control: 75 + Math.random() * 25,
        strength: 75 + Math.random() * 25,
        shotPower: 75 + Math.random() * 25,
        passing: 75 + Math.random() * 25,
        defense: 75 + Math.random() * 25,
        stamina: 90 + Math.random() * 10,
        agility: 75 + Math.random() * 25,
        heading: 75 + Math.random() * 25,
        dribble: 75 + Math.random() * 25,
        balance: 75 + Math.random() * 25,
      },
      position: { x: 0, y: 0.43, z: 0 },
      rotation: 0,
      stamina: 100,
      maxStamina: 100,
      isSelected: false,
      team: 'away',
      jersey: 'red',
      shortNumber: i + 1,
      currentAnimation: 'idle',
      velocity: { x: 0, y: 0, z: 0 },
      isSprinting: false,
      fatigue: 0,
    }));

    useMatchStore.setState({
      homeTeamPlayers: homeTeam,
      awayTeamPlayers: awayTeam,
      selectedPlayer: homeTeam[0],
      currentRules: rules,
      currentStadium: stadium,
    });

    setCurrentScreen('team-select');
  };

  const handleStartMatch = () => {
    useMatchStore.getState().startMatch();
    setCurrentScreen('in-game');
    setCountdown(10);
  };

  const handlePause = () => {
    useMatchStore.setState({ isPaused: !isPaused });
  };

  const handleEndMatch = () => {
    setCurrentScreen('result');
    useMatchStore.getState().endMatch();

    setMatchStats({
      homeShots: Math.floor(Math.random() * 20),
      awayShots: Math.floor(Math.random() * 20),
      homePossession: homePossession,
      awayPossession: 100 - homePossession,
      homePasses: Math.floor(Math.random() * 600),
      awayPasses: Math.floor(Math.random() * 600),
    });
  };

  // Render based on screen state
  if (currentScreen === 'lobby') {
    return (
      <FriendlyMatchLobby
        onCreateLobby={handleCreateLobby}
        onJoinLobby={() => {}}
        availableLobbies={[]}
        onCancel={onExit}
      />
    );
  }

  if (currentScreen === 'team-select') {
    return (
      <TeamSelection
        homeTeamPlayers={homeTeamPlayers}
        awayTeamPlayers={awayTeamPlayers}
        onStartMatch={handleStartMatch}
      />
    );
  }

  if (currentScreen === 'result') {
    return (
      <ResultScreen
        homeGoals={homeGoals}
        awayGoals={awayGoals}
        homeTeamName="Home"
        awayTeamName="Away"
        matchStats={matchStats}
        onRematch={() => {
          setCurrentScreen('lobby');
          useMatchStore.getState().resetMatch();
        }}
        onExit={onExit}
      />
    );
  }

  if (currentScreen === 'in-game') {
    return (
      <div className="w-full h-screen bg-black relative">
        {/* Countdown */}
        {matchPhase === 'countdown' && (
          <div className="fixed inset-0 flex items-center justify-center z-40 bg-black/80">
            <div className="text-9xl font-bold text-yellow-400 animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Game HUD */}
        <MatchHUD
          matchTime={matchTime}
          homeGoals={homeGoals}
          awayGoals={awayGoals}
          homePossession={homePossession}
          isPaused={isPaused}
          onPause={handlePause}
        />

        {/* 3D Game Scene would render here */}
        <div className="w-full h-full flex items-center justify-center text-white text-2xl">
          3D Football Pitch Rendered Here
        </div>

        {/* Celebration Menu */}
        {showCelebrationMenu && selectedPlayer && (
          <CelebrationMenu
            player={selectedPlayer}
            onCelebrationSelect={() => {
              setShowCelebrationMenu(false);
            }}
            onClose={() => setShowCelebrationMenu(false)}
          />
        )}

        {/* Friend Invitation */}
        {showFriendInvitation && (
          <FriendInvitation
            onSendInvite={() => {}}
            onCancel={() => setShowFriendInvitation(false)}
            friends={[
              { id: '1', name: 'Friend 1', isOnline: true },
              { id: '2', name: 'Friend 2', isOnline: true },
            ]}
          />
        )}
      </div>
    );
  }

  return null;
};

export default MatchCenter;
