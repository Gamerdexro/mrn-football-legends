import { Vector3 } from 'three';
import { PlayerState, BallState } from '../types/MatchEngineTypes';

interface MatchTimeConfig {
  matchDuration: number; // in minutes
  stoppageTimeEnabled: boolean;
  extraTimeEnabled: boolean;
  penaltiesEnabled: boolean;
}

interface ControlSwitchConfig {
  autoSwitchEnabled: boolean;
  switchDelay: number; // milliseconds
  ballProximityWeight: number;
  defensiveLinePriority: boolean;
  playerIntentionWeight: number;
}

interface TimeStoppage {
  type: 'foul' | 'injury' | 'substitution' | 'goal' | 'ball_out' | 'half_time' | 'extra_time_start';
  time: number;
  duration: number;
  processed: boolean;
}

export class MatchTimeSystem {
  private config: MatchTimeConfig;
  private controlConfig: ControlSwitchConfig;
  private currentTime: number = 0; // in seconds
  private isRunning: boolean = true;
  private currentPhase: 'first_half' | 'second_half' | 'extra_time' | 'penalty_shootout' | 'finished' = 'first_half';
  private stoppages: TimeStoppage[] = [];
  private stoppageTimeAccumulated: number = 0;
  private lastUpdateTime: number = 0;
  
  // Control switching
  private controlledPlayerId: string | null = null;
  private playerSwitchCooldown: number = 0;
  private autoSwitchTimer: number = 0;
  private players: Map<string, PlayerState> = new Map();

  constructor(matchConfig: MatchTimeConfig, controlConfig: ControlSwitchConfig) {
    this.config = matchConfig;
    this.controlConfig = controlConfig;
  }

  public update(deltaTime: number, ballState: BallState, players: PlayerState[]): void {
    const dt = deltaTime / 1000;
    
    // Update players reference
    this.updatePlayersReference(players);
    
    // Update match time
    if (this.isRunning) {
      this.updateMatchTime(dt);
    }
    
    // Process stoppages
    this.processStoppages();
    
    // Check phase transitions
    this.checkPhaseTransitions();
    
    // Update control switching
    this.updateControlSwitching(dt, ballState, players);
    
    this.lastUpdateTime = Date.now();
  }

  private updatePlayersReference(players: PlayerState[]): void {
    this.players.clear();
    players.forEach(player => {
      this.players.set(player.id, player);
    });
  }

  private updateMatchTime(dt: number): void {
    this.currentTime += dt;
    
    // Add stoppage time if enabled
    if (this.config.stoppageTimeEnabled) {
      this.stoppageTimeAccumulated += this.calculateActiveStoppages() * dt;
    }
  }

  private calculateActiveStoppages(): number {
    return this.stoppages.filter(stoppage => 
      !stoppage.processed && 
      this.currentTime >= stoppage.time && 
      this.currentTime < stoppage.time + stoppage.duration
    ).length;
  }

  private processStoppages(): void {
    this.stoppages.forEach(stoppage => {
      if (!stoppage.processed && this.currentTime >= stoppage.time + stoppage.duration) {
        stoppage.processed = true;
        this.onStoppageComplete(stoppage);
      }
    });
  }

  private onStoppageComplete(stoppage: TimeStoppage): void {
    console.log(`Stoppage complete: ${stoppage.type}, duration: ${stoppage.duration}s`);
  }

  private checkPhaseTransitions(): void {
    const halfDuration = this.config.matchDuration * 60; // Convert to seconds
    const fullDuration = halfDuration * 2;
    
    switch (this.currentPhase) {
      case 'first_half':
        if (this.currentTime >= halfDuration) {
          this.transitionToHalfTime();
        }
        break;
      case 'second_half':
        if (this.currentTime >= fullDuration) {
          if (this.config.extraTimeEnabled && this.shouldGoToExtraTime()) {
            this.transitionToExtraTime();
          } else {
            this.transitionToFullTime();
          }
        }
        break;
      case 'extra_time':
        const extraTimeDuration = halfDuration + 120; // 2 minutes each half
        if (this.currentTime >= extraTimeDuration) {
          if (this.config.penaltiesEnabled && this.shouldGoToPenalties()) {
            this.transitionToPenalties();
          } else {
            this.transitionToFullTime();
          }
        }
        break;
      case 'penalty_shootout':
        // Handled separately
        break;
    }
  }

  private shouldGoToExtraTime(): boolean {
    // Check if scores are level
    // This would need score information from the match state
    return true; // Simplified
  }

  private shouldGoToPenalties(): boolean {
    // Check if scores are still level after extra time
    return true; // Simplified
  }

  private transitionToHalfTime(): void {
    this.currentPhase = 'second_half';
    this.isRunning = false;
    // Half-time is tracked via phase change, not as a stoppage event
    
    setTimeout(() => {
      this.isRunning = true;
    }, 1000); // Resume after 1 second
  }

  private transitionToExtraTime(): void {
    this.currentPhase = 'extra_time';
    // Extra time transition tracked via phase change, not as a stoppage event
  }

  private transitionToPenalties(): void {
    this.currentPhase = 'penalty_shootout';
    this.isRunning = false;
  }

  private transitionToFullTime(): void {
    this.currentPhase = 'finished';
    this.isRunning = false;
  }

  private updateControlSwitching(dt: number, ballState: BallState, players: PlayerState[]): void {
    // Update cooldowns
    if (this.playerSwitchCooldown > 0) {
      this.playerSwitchCooldown -= dt * 1000;
    }
    
    if (this.autoSwitchTimer > 0) {
      this.autoSwitchTimer -= dt * 1000;
    }
    
    // Auto switch logic
    if (this.controlConfig.autoSwitchEnabled && this.autoSwitchTimer <= 0) {
      const bestPlayer = this.findBestPlayerToControl(ballState, players);
      if (bestPlayer && bestPlayer.id !== this.controlledPlayerId) {
        this.switchControl(bestPlayer.id);
        this.autoSwitchTimer = this.controlConfig.switchDelay;
      }
    }
  }

  private findBestPlayerToControl(ballState: BallState, players: PlayerState[]): PlayerState | null {
    const controlledTeam = 'home'; // Would be determined by game state
    const teamPlayers = players.filter(p => p.team === controlledTeam && p.role !== 'goalkeeper');
    
    if (teamPlayers.length === 0) return null;
    
    let bestPlayer = null;
    let bestScore = -1;
    
    teamPlayers.forEach(player => {
      const score = this.calculatePlayerControlScore(player, ballState);
      if (score > bestScore) {
        bestScore = score;
        bestPlayer = player;
      }
    });
    
    return bestPlayer;
  }

  private calculatePlayerControlScore(player: PlayerState, ballState: BallState): number {
    let score = 0;
    
    // Ball proximity (most important factor)
    const distanceToBall = player.position.distanceTo(ballState.position);
    const proximityScore = Math.max(0, 1 - distanceToBall / 20) * this.controlConfig.ballProximityWeight;
    score += proximityScore;
    
    // Defensive line priority
    if (this.controlConfig.defensiveLinePriority) {
      const defensiveLineScore = this.calculateDefensiveLineScore(player);
      score += defensiveLineScore * 0.3;
    }
    
    // Player intention (facing ball, moving towards ball)
    const intentionScore = this.calculatePlayerIntentionScore(player, ballState);
    score += intentionScore * this.controlConfig.playerIntentionWeight;
    
    return score;
  }

  private calculateDefensiveLineScore(player: PlayerState): number {
    // Higher score for players in better defensive positions
    const optimalDefensiveLine = player.team === 'home' ? -20 : 20;
    const distanceFromOptimal = Math.abs(player.position.z - optimalDefensiveLine);
    return Math.max(0, 1 - distanceFromOptimal / 30);
  }

  private calculatePlayerIntentionScore(player: PlayerState, ballState: BallState): number {
    // Check if player is facing and moving towards ball
    const toBall = ballState.position.clone().sub(player.position).normalize();
    const playerForward = new Vector3(0, 0, 1).applyEuler(player.rotation);
    
    const facingScore = Math.max(0, toBall.dot(playerForward));
    const movingScore = player.velocity.length() > 0.5 ? 0.5 : 0;
    
    return (facingScore + movingScore) / 2;
  }

  // Public API methods
  public switchControl(playerId: string): boolean {
    if (this.playerSwitchCooldown > 0) {
      return false; // Still on cooldown
    }
    
    const player = this.players.get(playerId);
    if (!player || player.role === 'goalkeeper') {
      return false; // Cannot control goalkeeper
    }
    
    // Remove control from previous player
    if (this.controlledPlayerId) {
      const previousPlayer = this.players.get(this.controlledPlayerId);
      if (previousPlayer) {
        previousPlayer.isControlled = false;
      }
    }
    
    // Give control to new player
    player.isControlled = true;
    this.controlledPlayerId = playerId;
    this.playerSwitchCooldown = 100; // 100ms cooldown
    
    return true;
  }

  public getControlledPlayerId(): string | null {
    return this.controlledPlayerId;
  }

  public addStoppage(type: 'foul' | 'injury' | 'substitution' | 'goal' | 'ball_out', time: number, duration: number): void {
    const stoppage: TimeStoppage = {
      type,
      time,
      duration,
      processed: false
    };
    
    this.stoppages.push(stoppage);
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDisplayTime(): string {
    const minutes = Math.floor(this.currentTime / 60);
    const seconds = Math.floor(this.currentTime % 60);
    const stoppageMinutes = Math.floor(this.stoppageTimeAccumulated / 60);
    
    if (this.config.stoppageTimeEnabled && stoppageMinutes > 0) {
      return `${minutes}+${stoppageMinutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  public getCurrentPhase(): string {
    return this.currentPhase;
  }

  public isMatchRunning(): boolean {
    return this.isRunning;
  }

  public pauseMatch(): void {
    this.isRunning = false;
  }

  public resumeMatch(): void {
    this.isRunning = true;
  }

  public setAutoSwitch(enabled: boolean): void {
    this.controlConfig.autoSwitchEnabled = enabled;
  }

  public setControlConfig(config: Partial<ControlSwitchConfig>): void {
    this.controlConfig = { ...this.controlConfig, ...config };
  }

  public getMatchStats(): {
    totalTime: number;
    stoppageTime: number;
    effectiveTime: number;
    phase: string;
  } {
    return {
      totalTime: this.currentTime,
      stoppageTime: this.stoppageTimeAccumulated,
      effectiveTime: this.currentTime - this.stoppageTimeAccumulated,
      phase: this.currentPhase
    };
  }

  public reset(): void {
    this.currentTime = 0;
    this.isRunning = true;
    this.currentPhase = 'first_half';
    this.stoppages = [];
    this.stoppageTimeAccumulated = 0;
    this.controlledPlayerId = null;
    this.playerSwitchCooldown = 0;
    this.autoSwitchTimer = 0;
  }

  public dispose(): void {
    this.players.clear();
    this.stoppages = [];
    this.reset();
  }
}
