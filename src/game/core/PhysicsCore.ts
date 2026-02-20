import { Vector3, Euler, MathUtils } from 'three';
import { GameConfig, PlayerState, BallState, PlayerStats, CollisionData, FoulData } from '../types/MatchEngineTypes';

export class PhysicsCore {
  private players: Map<string, PlayerState> = new Map();
  private ballState: BallState;
  private config: GameConfig;
  
  // Ball physics constants (realistic values)
  private readonly BALL_MASS = 0.43; // kg
  private readonly BALL_RADIUS = 0.11; // meters
  private readonly AIR_DRAG_COEFFICIENT = 0.47;
  private readonly AIR_DENSITY = 1.225; // kg/m³
  private readonly GRAVITY = 9.81; // m/s²
  private readonly GROUND_FRICTION = 0.35;
  private readonly BOUNCE_DAMPENING = 0.75;
  private readonly SPIN_DECAY_RATE = 0.98;
  private readonly MAGNUS_COEFFICIENT = 0.25;

  // Pitch dimensions
  private readonly PITCH_LENGTH = 105; // meters
  private readonly PITCH_WIDTH = 68; // meters
  private readonly GOAL_WIDTH = 7.32; // meters
  private readonly GOAL_HEIGHT = 2.44; // meters

  constructor(config: GameConfig) {
    this.config = config;
    this.ballState = {
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      angularVelocity: new Vector3(0, 0, 0),
      spin: new Vector3(0, 0, 0),
      inPossession: false,
      lastTouchedBy: null
    };
  }

  public update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Update ball physics
    this.updateBallPhysics(dt);
    
    // Update player physics
    this.updatePlayerPhysics(dt);
    
    // Check collisions
    this.checkCollisions();
    
    // Check boundaries
    this.checkBoundaries();
  }

  private updateBallPhysics(dt: number): void {
    if (this.ballState.inPossession) return;

    // Apply gravity
    this.ballState.velocity.y -= this.GRAVITY * dt;

    // Apply air drag
    const speed = this.ballState.velocity.length();
    if (speed > 0) {
      const dragForce = 0.5 * this.AIR_DRAG_COEFFICIENT * this.AIR_DENSITY * Math.PI * this.BALL_RADIUS * this.BALL_RADIUS * speed * speed;
      const dragAcceleration = dragForce / this.BALL_MASS;
      const dragDirection = this.ballState.velocity.clone().normalize().multiplyScalar(-1);
      this.ballState.velocity.add(dragDirection.multiplyScalar(dragAcceleration * dt));
    }

    // Apply Magnus effect (spin curve)
    if (this.ballState.spin.length() > 0) {
      const magnusForce = this.ballState.spin.clone().cross(this.ballState.velocity).multiplyScalar(this.MAGNUS_COEFFICIENT);
      this.ballState.velocity.add(magnusForce.multiplyScalar(dt));
      
      // Decay spin
      this.ballState.spin.multiplyScalar(this.SPIN_DECAY_RATE);
    }

    // Update position
    this.ballState.position.add(this.ballState.velocity.clone().multiplyScalar(dt));

    // Ground collision
    if (this.ballState.position.y <= this.BALL_RADIUS) {
      this.ballState.position.y = this.BALL_RADIUS;
      
      if (this.ballState.velocity.y < 0) {
        // Bounce
        this.ballState.velocity.y = -this.ballState.velocity.y * this.BOUNCE_DAMPENING;
        
        // Apply ground friction to horizontal velocity
        const horizontalVelocity = new Vector3(this.ballState.velocity.x, 0, this.ballState.velocity.z);
        if (horizontalVelocity.length() > 0) {
          const frictionForce = horizontalVelocity.normalize().multiplyScalar(-this.GROUND_FRICTION * this.BALL_MASS * this.GRAVITY);
          this.ballState.velocity.x += frictionForce.x * dt;
          this.ballState.velocity.z += frictionForce.z * dt;
        }
      }
    }
  }

  private updatePlayerPhysics(dt: number): void {
    this.players.forEach(player => {
      // Apply movement based on input
      if (player.isControlled) {
        // Handle controlled player movement
        this.updateControlledPlayerMovement(player, dt);
      } else {
        // AI movement handled by TacticalAI
      }

      // Update stamina
      if (player.velocity.length() > player.stats.topSpeed * 0.5) {
        const staminaDrain = 0.1 * dt; // Base stamina drain rate
        player.currentStamina = Math.max(0, player.currentStamina - staminaDrain);
      } else {
        // Recover stamina when not sprinting
        player.currentStamina = Math.min(100, player.currentStamina + 0.05 * dt);
      }
    });
  }

  private updateControlledPlayerMovement(player: PlayerState, dt: number): void {
    const maxSpeed = this.calculatePlayerSpeed(player);
    const acceleration = (player.stats.acceleration / 100) * 5; // Convert to m/s²
    
    // Apply acceleration towards target velocity
    const targetVelocity = player.velocity.clone().normalize().multiplyScalar(maxSpeed);
    const velocityDiff = targetVelocity.sub(player.velocity);
    const accelerationVector = velocityDiff.normalize().multiplyScalar(acceleration * dt);
    
    player.velocity.add(accelerationVector);
    
    // Limit to max speed
    if (player.velocity.length() > maxSpeed) {
      player.velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Update position
    player.position.add(player.velocity.clone().multiplyScalar(dt));

    // Update rotation to face movement direction
    if (player.velocity.length() > 0.1) {
      const targetRotation = Math.atan2(player.velocity.x, player.velocity.z);
      player.rotation.y = targetRotation;
    }
  }

  private calculatePlayerSpeed(player: PlayerState): number {
    const baseSpeed = (player.stats.topSpeed / 100) * 9; // Max 9 m/s (32.4 km/h)
    const staminaFactor = player.currentStamina / 100;
    const bodyTypeFactor = player.stats.bodyType === 'light' ? 1.1 : player.stats.bodyType === 'heavy' ? 0.9 : 1;
    
    return baseSpeed * staminaFactor * bodyTypeFactor;
  }

  private checkCollisions(): void {
    // Player-ball collisions
    this.players.forEach(player => {
      const distanceToBall = player.position.distanceTo(this.ballState.position);
      const collisionDistance = this.BALL_RADIUS + 0.5; // Approximate player radius
      
      if (distanceToBall < collisionDistance) {
        this.handlePlayerBallCollision(player);
      }
    });

    // Player-player collisions
    const playerArray = Array.from(this.players.values());
    for (let i = 0; i < playerArray.length; i++) {
      for (let j = i + 1; j < playerArray.length; j++) {
        const distance = playerArray[i].position.distanceTo(playerArray[j].position);
        if (distance < 1.0) { // Approximate player collision radius
          this.handlePlayerPlayerCollision(playerArray[i], playerArray[j]);
        }
      }
    }
  }

  private handlePlayerBallCollision(player: PlayerState): void {
    if (this.ballState.inPossession && this.ballState.lastTouchedBy !== player.id) {
      // Ball is possessed by another player
      return;
    }

    // Calculate kick force based on player stats
    const kickPower = (player.stats.shotPower / 100) * 30; // Max 30 m/s
    const kickDirection = this.ballState.position.clone().sub(player.position).normalize();
    
    // Apply shot accuracy
    const accuracyFactor = player.stats.shotAccuracy / 100;
    const spread = (1 - accuracyFactor) * 0.3; // Max 0.3 radians spread
    const randomAngle = (Math.random() - 0.5) * spread;
    
    // Apply spread to kick direction
    const rotationMatrix = new Euler(0, randomAngle, 0);
    kickDirection.applyEuler(rotationMatrix);
    
    // Set ball velocity
    this.ballState.velocity = kickDirection.multiplyScalar(kickPower);
    this.ballState.lastTouchedBy = player.id;
    this.ballState.inPossession = false;

    // Add spin based on foot angle (simplified)
    const spinAmount = (player.stats.dribble / 100) * 5;
    this.ballState.spin = new Vector3(
      (Math.random() - 0.5) * spinAmount,
      0,
      (Math.random() - 0.5) * spinAmount
    );
  }

  private handlePlayerPlayerCollision(player1: PlayerState, player2: PlayerState): void {
    // Calculate collision data for foul detection
    const relativeVelocity = player1.velocity.clone().sub(player2.velocity).length();
    const collisionPoint = player1.position.clone().add(player2.position).multiplyScalar(0.5);
    
    // Simple collision response
    const collisionNormal = player1.position.clone().sub(player2.position).normalize();
    const separationForce = collisionNormal.multiplyScalar(2);
    
    player1.position.add(separationForce);
    player2.position.sub(separationForce);
    
    // Exchange some velocity
    const velocityExchange = collisionNormal.multiplyScalar(relativeVelocity * 0.3);
    player1.velocity.sub(velocityExchange);
    player2.velocity.add(velocityExchange);

    // Check for potential foul
    if (relativeVelocity > 5) { // High-speed collision
      const foulData: FoulData = {
        severity: relativeVelocity > 8 ? 'serious' : 'medium',
        type: 'aggressive_tackle',
        player: player1.id,
        position: collisionPoint,
        time: Date.now()
      };
      
      // Emit foul event for referee system
      this.emitFoulEvent(foulData);
    }
  }

  private checkBoundaries(): void {
    // Check if ball is out of bounds
    const halfLength = this.PITCH_LENGTH / 2;
    const halfWidth = this.PITCH_WIDTH / 2;
    
    if (Math.abs(this.ballState.position.x) > halfWidth) {
      // Ball out on sideline - throw in
      this.emitOutOfBoundsEvent('throw_in');
    }
    
    if (Math.abs(this.ballState.position.z) > halfLength) {
      // Check if it's a goal
      if (Math.abs(this.ballState.position.x) < this.GOAL_WIDTH / 2 && 
          this.ballState.position.y < this.GOAL_HEIGHT) {
        this.emitGoalEvent();
      } else {
        // Corner or goal kick
        const isCorner = Math.abs(this.ballState.position.x) > this.GOAL_WIDTH / 2;
        this.emitOutOfBoundsEvent(isCorner ? 'corner' : 'goal_kick');
      }
    }
  }

  private emitFoulEvent(foulData: FoulData): void {
    // Event will be handled by TacticalAI and PresentationLayer
    console.log('Foul detected:', foulData);
  }

  private emitOutOfBoundsEvent(type: 'throw_in' | 'corner' | 'goal_kick'): void {
    console.log('Ball out of bounds:', type);
  }

  private emitGoalEvent(): void {
    console.log('GOAL scored by:', this.ballState.lastTouchedBy);
  }

  // Public API methods
  public addPlayer(player: PlayerState): void {
    this.players.set(player.id, player);
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  public setPlayerInput(playerId: string, input: Vector3): void {
    const player = this.players.get(playerId);
    if (player && player.isControlled) {
      player.velocity = input;
    }
  }

  public getBallState(): BallState {
    return { ...this.ballState };
  }

  public getAllPlayerStates(): PlayerState[] {
    return Array.from(this.players.values());
  }

  public getPlayerState(playerId: string): PlayerState | undefined {
    return this.players.get(playerId);
  }

  public dispose(): void {
    this.players.clear();
  }
}
