import { Object3D, Scene, Vector3, AnimationMixer, Euler } from 'three';
import { PlayerState, PlayerStats } from '../types/MatchEngineTypes';
import { PlayerIdentity, PlayerIdentityManager, GameplayAttributes, MovementStyle, EmotionalExpression } from './PlayerIdentity';
import { PlayerRenderer } from './PlayerRenderer';

export class PlayerSystem {
  private scene: Scene;
  private identityManager: PlayerIdentityManager;
  private renderers: Map<string, PlayerRenderer> = new Map();
  private activePlayers: Map<string, PlayerState> = new Map();
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.identityManager = new PlayerIdentityManager();
  }

  public createPlayer(config: any): PlayerState {
    // Create Player identity with all three layers
    const identity = this.identityManager.createIdentity(config);
    
    // Create Player state for gameplay
    const playerState = this.createPlayerState(identity);
    
    // Create visual renderer
    const renderer = new PlayerRenderer(identity, this.scene);
    this.renderers.set(playerState.id, renderer);
    
    // Store active player
    this.activePlayers.set(playerState.id, playerState);
    
    return playerState;
  }

  private createPlayerState(identity: PlayerIdentity): PlayerState {
    // Convert identity to player state for gameplay
    const attrs = identity.gameplayAttributes;
    
    return {
      id: identity.id,
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      rotation: new Euler(0, 0, 0),
      stats: this.convertIdentityToStats(identity),
      currentStamina: 100,
      hasBall: false,
      isControlled: false,
      team: identity.position === 'GK' ? 'home' : 'away', // Simplified
      role: identity.position === 'GK' ? 'goalkeeper' : 'player'
    };
  }

  private convertIdentityToStats(identity: PlayerIdentity): PlayerStats {
    // Convert gameplay attributes to PlayerStats
    const attrs = identity.gameplayAttributes;
    
    return {
      acceleration: attrs.acceleration,
      topSpeed: attrs.speed,
      turnRadius: this.calculateTurnRadius(identity.movementStyle),
      balance: this.calculateBalance(identity.personalityTraits),
      reaction: attrs.mentality,
      stamina: attrs.stamina,
      dribble: attrs.ballControl,
      shotPower: attrs.shooting,
      shotAccuracy: attrs.passing, // Simplified
      positioning: attrs.defending,
      jump: attrs.physicality * 0.7, // Simplified
      strength: attrs.strength,
      composure: attrs.mentality,
      bodyType: this.getBodyType(identity.bodyStructure)
    };
  }

  private calculateTurnRadius(movementStyle: MovementStyle): number {
    // Convert movement style to turn radius
    switch (movementStyle.turnStyle) {
      case 'smooth': return 0.8; // Tighter turns
      case 'sharp': return 0.4; // Very tight turns
      case 'powerful': return 0.6; // Moderate turns
      case 'technical': return 0.7; // Good turns
      default: return 0.5;
    }
  }

  private calculateBalance(personality: any): number {
    // Convert personality traits to balance
    return (personality.confidence + personality.temperament) / 2 * 100;
  }

  private getBodyType(bodyStructure: any): 'light' | 'medium' | 'heavy' {
    // Convert body structure to body type
    const shoulderWidth = bodyStructure.shoulderWidth;
    const thighStrength = bodyStructure.thighStrength;
    
    if (shoulderWidth > 0.7 && thighStrength > 0.7) {
      return 'heavy';
    } else if (shoulderWidth > 0.4 && thighStrength > 0.4) {
      return 'medium';
    } else {
      return 'light';
    }
  }

  public updatePlayer(playerId: string, deltaTime: number): void {
    const player = this.activePlayers.get(playerId);
    const renderer = this.renderers.get(playerId);
    
    if (!player || !renderer) return;
    
    // Update visual renderer
    renderer.update(deltaTime);
    
    // Update Player state based on performance
    this.updatePlayerPerformance(player, deltaTime);
    
    // Update emotional expressions
    this.updateEmotionalState(player, renderer);
  }

  private updatePlayerPerformance(player: PlayerState, deltaTime: number): void {
    const identity = this.identityManager.getActivePlayer(player.id);
    if (!identity) return;
    
    // Update stamina based on movement
    const speed = player.velocity.length();
    const maxSpeed = player.stats.topSpeed;
    const speedRatio = speed / maxSpeed;
    
    if (speedRatio > 0.7) {
      // Sprinting - drain stamina
      player.currentStamina = Math.max(0, player.currentStamina - deltaTime * 0.001);
    } else if (speedRatio < 0.3) {
      // Resting - recover stamina
      player.currentStamina = Math.min(100, player.currentStamina + deltaTime * 0.0005);
    }
    
    // Apply movement style modifications
    this.applyMovementStyle(player, identity.movementStyle, speedRatio);
  }

  private applyMovementStyle(player: PlayerState, movementStyle: MovementStyle, speedRatio: number): void {
    // Apply different movement styles based on player type
    switch (movementStyle.stepPattern) {
      case 'light':
        // Lighter steps for fast players
        player.velocity.multiplyScalar(1.1);
        break;
      case 'heavy':
        // Heavier grounded movement for defenders
        player.velocity.multiplyScalar(0.9);
        player.position.y = Math.max(0, player.position.y - 0.02); // Lower center of gravity
        break;
      case 'balanced':
        // Balanced movement
        // No modification
        break;
      case 'explosive':
        // Explosive first step
        if (speedRatio > 0.8) {
          player.velocity.multiplyScalar(1.2);
        }
        break;
    }
    
    // Apply turn style
    this.applyTurnStyle(player, movementStyle.turnStyle);
  }

  private applyTurnStyle(player: PlayerState, turnStyle: string): void {
    // Apply different turning animations
    console.log(`Applying turn style: ${turnStyle}`);
  }

  private updateEmotionalState(player: PlayerState, renderer: PlayerRenderer): void {
    const identity = this.identityManager.getActivePlayer(player.id);
    if (!identity) return;
    
    // Update emotional expressions based on game state
    const emotional = identity.emotionalExpression;
    
    // Apply facial expressions
    this.updateFacialExpression(renderer, emotional.facialExpression);
    
    // Update body language
    this.updateBodyLanguage(player, emotional);
  }

  private updateFacialExpression(renderer: PlayerRenderer, expression: string): void {
    // Set facial expression on renderer
    console.log(`Setting facial expression: ${expression}`);
  }

  private updateBodyLanguage(player: PlayerState, emotional: any): void {
    // Update body language based on emotional state
    const renderer = this.renderers.get(player.id);
    if (!renderer) return;
    
    switch (emotional.facialExpression) {
      case 'confident':
        // Confident stance
        player.position.y = 0.1;
        break;
      case 'focused':
        // Focused stance
        player.position.y = 0.05;
        break;
      case 'relaxed':
        // Relaxed stance
        player.position.y = 0;
        break;
      case 'aggressive':
        // Aggressive stance
        player.position.y = 0.02;
        break;
    }
  }

  public triggerCelebration(playerId: string): void {
    const player = this.activePlayers.get(playerId);
    const renderer = this.renderers.get(playerId);
    const identity = this.identityManager.getActivePlayer(playerId);
    
    if (!player || !renderer || !identity) return;
    
    // Play signature celebration
    const celebration = identity.emotionalExpression.celebrationAnimation;
    console.log(`Playing celebration: ${celebration}`);
    
    // Update emotional state
    this.updateFacialExpression(renderer, 'joyful');
  }

  public triggerGoalReaction(playerId: string): void {
    const player = this.activePlayers.get(playerId);
    const renderer = this.renderers.get(playerId);
    const identity = this.identityManager.getActivePlayer(playerId);
    
    if (!player || !renderer || !identity) return;
    
    // Apply goal reaction facial expression
    this.updateFacialExpression(renderer, identity.emotionalExpression.goalReaction);
    
    // Play goal reaction voice
    this.playVoiceReaction(identity.emotionalExpression.voiceReaction);
  }

  public triggerMissReaction(playerId: string): void {
    const player = this.activePlayers.get(playerId);
    const renderer = this.renderers.get(playerId);
    const identity = this.identityManager.getActivePlayer(playerId);
    
    if (!player || !renderer || !identity) return;
    
    // Apply miss reaction facial expression
    this.updateFacialExpression(renderer, identity.emotionalExpression.missReaction);
    
    // Play miss reaction voice
    this.playVoiceReaction('miss_frustration');
  }

  private playVoiceReaction(voiceId: string): void {
    // Play voice reaction sound
    console.log(`Playing voice reaction: ${voiceId}`);
  }

  public getPlayerModel(playerId: string): Object3D | null {
    const renderer = this.renderers.get(playerId);
    return renderer ? renderer.getModel() : null;
  }

  public getPlayerIdentity(playerId: string): PlayerIdentity | undefined {
    return this.identityManager.getActivePlayer(playerId);
  }

  public updatePlayerPosition(playerId: string, position: Vector3): void {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.position.copy(position);
    }
  }

  public setPlayerControl(playerId: string, controlled: boolean): void {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.isControlled = controlled;
    }
  }

  public getPlayersInRadius(center: Vector3, radius: number): PlayerState[] {
    const players: PlayerState[] = [];
    
    this.activePlayers.forEach(player => {
      const distance = player.position.distanceTo(center);
      if (distance <= radius) {
        players.push(player);
      }
    });
    
    return players;
  }

  public updateAllPlayers(deltaTime: number): void {
    this.activePlayers.forEach((player, playerId) => {
      this.updatePlayer(playerId, deltaTime);
    });
  }

  public getPlayerStats(playerId: string): PlayerStats | undefined {
    const player = this.activePlayers.get(playerId);
    return player ? player.stats : undefined;
  }

  public updatePlayerStats(playerId: string, stats: Partial<PlayerStats>): void {
    const player = this.activePlayers.get(playerId);
    if (player) {
      player.stats = { ...player.stats, ...stats };
    }
  }

  public removePlayer(playerId: string): void {
    // Remove from active players
    this.activePlayers.delete(playerId);
    
    // Remove renderer
    const renderer = this.renderers.get(playerId);
    if (renderer) {
      renderer.dispose();
      this.renderers.delete(playerId);
    }
    
    // Deactivate from identity manager
    this.identityManager.deactivatePlayer(playerId);
  }

  public getActivePlayers(): PlayerState[] {
    return Array.from(this.activePlayers.values());
  }

  public getActivePlayerIdentities(): PlayerIdentity[] {
    return this.identityManager.getAllActivePlayers();
  }

  public createUniquePlayer(baseConfig: any): PlayerState {
    // Generate unique features for player
    const uniqueIdentity = this.identityManager.generateUniqueFeatures(baseConfig);
    return this.createPlayer(uniqueIdentity);
  }

  public dispose(): void {
    // Dispose all renderers
    this.renderers.forEach(renderer => {
      renderer.dispose();
    });
    this.renderers.clear();
    
    // Clear active players
    this.activePlayers.clear();
    
    // Dispose identity manager
    this.identityManager.dispose();
  }
}
