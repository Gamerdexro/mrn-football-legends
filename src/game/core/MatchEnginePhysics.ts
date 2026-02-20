import { Vector3, Quaternion, Box3, Sphere } from 'three';
import { PlayerState, MatchState } from '../types/MatchEngineTypes';

// Physics constants
interface PhysicsConstants {
  gravity: number; // m/s²
  airDensity: number; // kg/m³
  ballMass: number; // kg
  ballRadius: number; // meters
  dragCoefficient: number; // dimensionless
  magnusCoefficient: number; // dimensionless
  restitution: number; // dimensionless
  frictionCoefficient: number; // dimensionless
  maxPlayerSpeed: number; // m/s
  maxPlayerAcceleration: number; // m/s²
  staminaDrainRate: number; // per second
  staminaRecoveryRate: number; // per second
}

interface PlayerPhysics {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  orientation: Quaternion;
  stamina: number; // 0-1
  mass: number; // kg
  height: number; // meters
  boundingBox: Box3;
  isSprinting: boolean;
  lastAccelerationTime: number;
}

interface BallPhysics {
  position: Vector3;
  velocity: Vector3;
  angularVelocity: Vector3;
  radius: number;
  mass: number;
  boundingSphere: Sphere;
  lastTouchedBy: string;
  spin: Vector3;
}

interface MatchSeed {
  seed: number;
  timestamp: number;
  isValidated: boolean;
}

interface CollisionResult {
  occurred: boolean;
  normal: Vector3;
  penetrationDepth: number;
  relativeVelocity: Vector3;
  impulse: Vector3;
}

export class MatchEnginePhysics {
  private constants!: PhysicsConstants;
  private players: Map<string, PlayerPhysics> = new Map();
  private ball!: BallPhysics;
  private matchSeed!: MatchSeed;
  private deltaTime: number = 0.016; // 60 FPS
  private pitchBounds!: { min: Vector3; max: Vector3 };
  private goalBounds!: { left: Box3; right: Box3 };
  
  // Performance optimization
  private physicsFrame: number = 0;
  private lastUpdateTime: number = 0;

  constructor() {
    this.initializePhysicsConstants();
    this.initializePitchBounds();
    this.initializeBall();
  }

  private initializePhysicsConstants(): void {
    this.constants = {
      gravity: 9.81, // Earth gravity
      airDensity: 1.225, // Sea level air density
      ballMass: 0.43, // FIFA standard ball mass
      ballRadius: 0.11, // FIFA standard ball radius
      dragCoefficient: 0.47, // Sphere drag coefficient
      magnusCoefficient: 0.25, // Magnus effect coefficient
      restitution: 0.7, // Ball bounciness
      frictionCoefficient: 0.3, // Grass friction
      maxPlayerSpeed: 12, // m/s (43.2 km/h)
      maxPlayerAcceleration: 8, // m/s²
      staminaDrainRate: 0.15, // per second when sprinting
      staminaRecoveryRate: 0.05 // per second when resting
    };
  }

  private initializePitchBounds(): void {
    this.pitchBounds = {
      min: new Vector3(-52.5, 0, -35), // Standard pitch dimensions
      max: new Vector3(52.5, 0, 35)
    };

    // Goal dimensions (7.32m x 2.44m)
    this.goalBounds = {
      left: new Box3(
        new Vector3(-52.5, 0, -3.66),
        new Vector3(-51.5, 2.44, 3.66)
      ),
      right: new Box3(
        new Vector3(51.5, 0, -3.66),
        new Vector3(52.5, 2.44, 3.66)
      )
    };
  }

  private initializeBall(): void {
    this.ball = {
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      angularVelocity: new Vector3(0, 0, 0),
      radius: this.constants.ballRadius,
      mass: this.constants.ballMass,
      boundingSphere: new Sphere(new Vector3(0, 0, 0), this.constants.ballRadius),
      lastTouchedBy: '',
      spin: new Vector3(0, 0, 0)
    };
  }

  public initializeMatch(seed: number): void {
    this.matchSeed = {
      seed,
      timestamp: Date.now(),
      isValidated: false
    };
    
    // Reset physics state
    this.ball.position.set(0, 0, 0);
    this.ball.velocity.set(0, 0, 0);
    this.ball.angularVelocity.set(0, 0, 0);
    this.ball.spin.set(0, 0, 0);
    
    this.physicsFrame = 0;
    this.lastUpdateTime = Date.now();
  }

  public addPlayer(playerId: string, initialState: PlayerState): void {
    const playerPhysics: PlayerPhysics = {
      position: initialState.position.clone(),
      velocity: new Vector3(0, 0, 0),
      acceleration: new Vector3(0, 0, 0),
      orientation: new Quaternion(),
      stamina: 1.0,
      mass: 75, // Average player mass in kg
      height: 1.8, // Average player height in meters
      boundingBox: new Box3(),
      isSprinting: false,
      lastAccelerationTime: 0
    };

    // Update bounding box based on player dimensions
    const halfWidth = 0.3;
    const halfHeight = playerPhysics.height / 2;
    const halfDepth = 0.3;
    
    playerPhysics.boundingBox.setFromCenterAndSize(
      playerPhysics.position,
      new Vector3(halfWidth * 2, halfHeight * 2, halfDepth * 2)
    );

    this.players.set(playerId, playerPhysics);
  }

  public updatePhysics(currentTime: number): void {
    // Calculate delta time
    const actualDeltaTime = (currentTime - this.lastUpdateTime) / 1000;
    this.deltaTime = Math.min(actualDeltaTime, 0.033); // Cap at 30 FPS minimum
    
    this.lastUpdateTime = currentTime;
    this.physicsFrame++;

    // Update player physics
    for (const [playerId, player] of this.players.entries()) {
      this.updatePlayerPhysics(playerId, player);
    }

    // Update ball physics
    this.updateBallPhysics();

    // Check collisions
    this.checkCollisions();

    // Validate physics integrity
    if (this.physicsFrame % 60 === 0) { // Every second
      this.validatePhysicsIntegrity();
    }
  }

  private updatePlayerPhysics(playerId: string, player: PlayerPhysics): void {
    // Apply acceleration to velocity
    player.velocity.add(player.acceleration.clone().multiplyScalar(this.deltaTime));

    // Apply friction
    const frictionForce = player.velocity.clone().multiplyScalar(-this.constants.frictionCoefficient);
    player.velocity.add(frictionForce.multiplyScalar(this.deltaTime));

    // Limit to max speed
    const currentSpeed = player.velocity.length();
    const maxSpeed = this.getMaxSpeed(player);
    
    if (currentSpeed > maxSpeed) {
      player.velocity.normalize().multiplyScalar(maxSpeed);
    }

    // Update position
    player.position.add(player.velocity.clone().multiplyScalar(this.deltaTime));

    // Update stamina
    this.updateStamina(player);

    // Update bounding box
    player.boundingBox.setFromCenterAndSize(
      player.position,
      new Vector3(0.6, player.height, 0.6)
    );

    // Keep player in pitch bounds
    this.constrainToPitch(player);

    // Reset acceleration for next frame
    player.acceleration.set(0, 0, 0);
  }

  private getMaxSpeed(player: PlayerPhysics): number {
    const staminaFactor = 0.5 + player.stamina * 0.5; // 50% to 100% speed based on stamina
    return this.constants.maxPlayerSpeed * staminaFactor;
  }

  private updateStamina(player: PlayerPhysics): void {
    if (player.isSprinting) {
      // Drain stamina when sprinting
      player.stamina = Math.max(0, player.stamina - this.constants.staminaDrainRate * this.deltaTime);
    } else {
      // Recover stamina when not sprinting
      const isMoving = player.velocity.length() > 0.1;
      const recoveryRate = isMoving ? 
        this.constants.staminaRecoveryRate * 0.5 : // Half recovery when moving
        this.constants.staminaRecoveryRate; // Full recovery when standing
      
      player.stamina = Math.min(1, player.stamina + recoveryRate * this.deltaTime);
    }
  }

  private constrainToPitch(player: PlayerPhysics): void {
    // Keep player within pitch bounds
    player.position.x = Math.max(this.pitchBounds.min.x, Math.min(this.pitchBounds.max.x, player.position.x));
    player.position.z = Math.max(this.pitchBounds.min.z, Math.min(this.pitchBounds.max.z, player.position.z));
    player.position.y = Math.max(0, player.position.y); // Keep on ground
  }

  private updateBallPhysics(): void {
    // Apply gravity
    this.ball.velocity.y -= this.constants.gravity * this.deltaTime;

    // Apply air resistance (drag)
    const dragForce = this.calculateDragForce();
    this.ball.velocity.add(dragForce.multiplyScalar(this.deltaTime / this.ball.mass));

    // Apply Magnus effect (spin)
    const magnusForce = this.calculateMagnusForce();
    this.ball.velocity.add(magnusForce.multiplyScalar(this.deltaTime / this.ball.mass));

    // Update position
    this.ball.position.add(this.ball.velocity.clone().multiplyScalar(this.deltaTime));

    // Update angular velocity
    this.ball.angularVelocity.add(this.ball.spin.clone().multiplyScalar(this.deltaTime));

    // Apply spin decay
    this.ball.spin.multiplyScalar(0.99); // Gradual spin reduction

    // Update bounding sphere
    this.ball.boundingSphere.center.copy(this.ball.position);

    // Check pitch boundaries
    this.checkBallBoundaries();
  }

  private calculateDragForce(): Vector3 {
    const velocityMagnitude = this.ball.velocity.length();
    if (velocityMagnitude === 0) return new Vector3(0, 0, 0);

    // Drag force: F_d = 0.5 * ρ * v² * C_d * A
    const crossSectionalArea = Math.PI * this.ball.radius * this.ball.radius;
    const dragMagnitude = 0.5 * this.constants.airDensity * velocityMagnitude * velocityMagnitude * 
                         this.constants.dragCoefficient * crossSectionalArea;

    // Apply in opposite direction of velocity
    const dragDirection = this.ball.velocity.clone().normalize().multiplyScalar(-1);
    return dragDirection.multiplyScalar(dragMagnitude);
  }

  private calculateMagnusForce(): Vector3 {
    // Magnus effect: F_m = S × v (spin cross velocity)
    const magnusForce = this.ball.angularVelocity.clone().cross(this.ball.velocity);
    magnusForce.multiplyScalar(this.constants.magnusCoefficient * this.ball.mass);
    return magnusForce;
  }

  private checkBallBoundaries(): void {
    // Check side lines
    if (Math.abs(this.ball.position.x) > this.pitchBounds.max.x) {
      this.ball.position.x = Math.sign(this.ball.position.x) * this.pitchBounds.max.x;
      this.ball.velocity.x *= -this.constants.restitution;
    }

    // Check goal lines
    if (Math.abs(this.ball.position.z) > this.pitchBounds.max.z) {
      this.ball.position.z = Math.sign(this.ball.position.z) * this.pitchBounds.max.z;
      this.ball.velocity.z *= -this.constants.restitution;
    }

    // Check ground collision
    if (this.ball.position.y <= this.ball.radius) {
      this.ball.position.y = this.ball.radius;
      
      // Apply bounce with restitution
      if (this.ball.velocity.y < 0) {
        this.ball.velocity.y *= -this.constants.restitution;
        
        // Apply ground friction to horizontal velocity
        this.ball.velocity.x *= (1 - this.constants.frictionCoefficient);
        this.ball.velocity.z *= (1 - this.constants.frictionCoefficient);
      }
    }

    // Check goals
    this.checkGoalCollision();
  }

  private checkGoalCollision(): void {
    // Check left goal
    if (this.goalBounds.left.containsPoint(this.ball.position)) {
      // Goal scored on left side
      this.handleGoal('left');
    }

    // Check right goal
    if (this.goalBounds.right.containsPoint(this.ball.position)) {
      // Goal scored on right side
      this.handleGoal('right');
    }
  }

  private handleGoal(side: string): void {
    // Reset ball position
    this.ball.position.set(0, this.ball.radius, 0);
    this.ball.velocity.set(0, 0, 0);
    this.ball.angularVelocity.set(0, 0, 0);
    this.ball.spin.set(0, 0, 0);
    
    // In production, this would trigger goal celebration and score update
  }

  private checkCollisions(): void {
    // Check player-ball collisions
    for (const [playerId, player] of this.players.entries()) {
      const collision = this.checkPlayerBallCollision(player);
      if (collision.occurred) {
        this.resolvePlayerBallCollision(playerId, player, collision);
      }
    }

    // Check player-player collisions
    const playerIds = Array.from(this.players.keys());
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const player1 = this.players.get(playerIds[i])!;
        const player2 = this.players.get(playerIds[j])!;
        
        const collision = this.checkPlayerPlayerCollision(player1, player2);
        if (collision.occurred) {
          this.resolvePlayerPlayerCollision(playerIds[i], playerIds[j], player1, player2, collision);
        }
      }
    }
  }

  private checkPlayerBallCollision(player: PlayerPhysics): CollisionResult {
    const distance = player.position.distanceTo(this.ball.position);
    const collisionDistance = player.height / 2 + this.ball.radius;

    if (distance < collisionDistance) {
      const normal = this.ball.position.clone().sub(player.position).normalize();
      const penetrationDepth = collisionDistance - distance;
      const relativeVelocity = this.ball.velocity.clone().sub(player.velocity);

      return {
        occurred: true,
        normal,
        penetrationDepth,
        relativeVelocity,
        impulse: new Vector3(0, 0, 0) // Will be calculated in resolution
      };
    }

    return {
      occurred: false,
      normal: new Vector3(0, 0, 0),
      penetrationDepth: 0,
      relativeVelocity: new Vector3(0, 0, 0),
      impulse: new Vector3(0, 0, 0)
    };
  }

  private resolvePlayerBallCollision(playerId: string, player: PlayerPhysics, collision: CollisionResult): void {
    // Separate objects
    const separation = collision.normal.clone().multiplyScalar(collision.penetrationDepth);
    this.ball.position.add(separation);

    // Calculate impulse
    const relativeVelocity = collision.relativeVelocity;
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);

    if (velocityAlongNormal > 0) return; // Objects moving apart

    const restitution = this.constants.restitution;
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal;
    const impulse = collision.normal.clone().multiplyScalar(impulseMagnitude);

    // Apply impulse to ball
    this.ball.velocity.add(impulse);

    // Update last touched by
    this.ball.lastTouchedBy = playerId;

    // Add some spin based on player movement
    const tangentVelocity = player.velocity.clone().sub(collision.normal.clone().multiplyScalar(player.velocity.dot(collision.normal)));
    this.ball.spin.add(tangentVelocity.multiplyScalar(0.1));
  }

  private checkPlayerPlayerCollision(player1: PlayerPhysics, player2: PlayerPhysics): CollisionResult {
    const distance = player1.position.distanceTo(player2.position);
    const collisionDistance = (player1.height + player2.height) / 4; // Simplified collision

    if (distance < collisionDistance) {
      const normal = player2.position.clone().sub(player1.position).normalize();
      const penetrationDepth = collisionDistance - distance;
      const relativeVelocity = player2.velocity.clone().sub(player1.velocity);

      return {
        occurred: true,
        normal,
        penetrationDepth,
        relativeVelocity,
        impulse: new Vector3(0, 0, 0)
      };
    }

    return {
      occurred: false,
      normal: new Vector3(0, 0, 0),
      penetrationDepth: 0,
      relativeVelocity: new Vector3(0, 0, 0),
      impulse: new Vector3(0, 0, 0)
    };
  }

  private resolvePlayerPlayerCollision(playerId1: string, playerId2: string, player1: PlayerPhysics, player2: PlayerPhysics, collision: CollisionResult): void {
    // Separate players
    const separation = collision.normal.clone().multiplyScalar(collision.penetrationDepth * 0.5);
    player1.position.sub(separation);
    player2.position.add(separation);

    // Calculate impulse for elastic collision
    const relativeVelocity = collision.relativeVelocity;
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);

    if (velocityAlongNormal > 0) return; // Players moving apart

    const restitution = 0.5; // Lower restitution for player collisions
    const impulseMagnitude = -(1 + restitution) * velocityAlongNormal / 2; // Divide by 2 for equal mass
    const impulse = collision.normal.clone().multiplyScalar(impulseMagnitude);

    // Apply impulses
    player1.velocity.sub(impulse);
    player2.velocity.add(impulse);

    // In production, this would also handle foul detection
  }

  public applyPlayerInput(playerId: string, input: {
    direction: Vector3;
    power: number;
    isSprinting: boolean;
    action?: 'shoot' | 'pass' | 'tackle' | 'slide';
  }): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Update sprint state
    player.isSprinting = input.isSprinting;

    // Apply movement force
    const maxAcceleration = this.constants.maxPlayerAcceleration;
    const accelerationFactor = input.power;
    
    const force = input.direction.clone().multiplyScalar(maxAcceleration * accelerationFactor);
    player.acceleration.add(force);

    // Handle actions
    if (input.action) {
      this.handlePlayerAction(playerId, player, input.action, input.direction, input.power);
    }
  }

  private handlePlayerAction(playerId: string, player: PlayerPhysics, action: string, direction: Vector3, power: number): void {
    switch (action) {
      case 'shoot':
        this.performShoot(playerId, player, direction, power);
        break;
      case 'pass':
        this.performPass(playerId, player, direction, power);
        break;
      case 'tackle':
        this.performTackle(playerId, player, direction, power);
        break;
      case 'slide':
        this.performSlide(playerId, player, direction, power);
        break;
    }
  }

  private performShoot(playerId: string, player: PlayerPhysics, direction: Vector3, power: number): void {
    // Check if player is near ball
    const distanceToBall = player.position.distanceTo(this.ball.position);
    if (distanceToBall > 2) return; // Too far from ball

    // Calculate shot power based on player stats and input
    const shotPower = power * 25; // Max 25 m/s shot speed
    
    // Apply shot to ball
    this.ball.velocity = direction.clone().multiplyScalar(shotPower);
    
    // Add spin for curve shots
    const spinAmount = power * 10; // Max 10 rad/s spin
    this.ball.spin = new Vector3(
      (Math.random() - 0.5) * spinAmount,
      0,
      (Math.random() - 0.5) * spinAmount
    );

    this.ball.lastTouchedBy = playerId;
  }

  private performPass(playerId: string, player: PlayerPhysics, direction: Vector3, power: number): void {
    // Similar to shoot but with lower power and higher accuracy
    const passPower = power * 15; // Max 15 m/s pass speed
    
    this.ball.velocity = direction.clone().multiplyScalar(passPower);
    this.ball.spin.set(0, 0, 0); // No spin for passes

    this.ball.lastTouchedBy = playerId;
  }

  private performTackle(playerId: string, player: PlayerPhysics, direction: Vector3, power: number): void {
    // Tackle affects player movement and can result in collision
    const tackleForce = direction.clone().multiplyScalar(power * 10);
    player.acceleration.add(tackleForce);
    
    // In production, this would check for successful tackle and ball possession change
  }

  private performSlide(playerId: string, player: PlayerPhysics, direction: Vector3, power: number): void {
    // Slide tackle - longer reach but higher risk
    const slideForce = direction.clone().multiplyScalar(power * 15);
    player.acceleration.add(slideForce);
    
    // In production, this would check for foul and potential card
  }

  private validatePhysicsIntegrity(): void {
    // Validate ball position is within reasonable bounds
    if (Math.abs(this.ball.position.x) > 100 || Math.abs(this.ball.position.z) > 100) {
      // Reset ball if it goes out of bounds
      this.ball.position.set(0, this.ball.radius, 0);
      this.ball.velocity.set(0, 0, 0);
    }

    // Validate player positions
    for (const [playerId, player] of this.players.entries()) {
      if (Math.abs(player.position.x) > 100 || Math.abs(player.position.z) > 100) {
        // Reset player position
        player.position.set(0, 0, 0);
        player.velocity.set(0, 0, 0);
      }
    }

    // Validate velocities are within reasonable limits
    const maxVelocity = 50; // m/s
    if (this.ball.velocity.length() > maxVelocity) {
      this.ball.velocity.normalize().multiplyScalar(maxVelocity);
    }
  }

  public getPhysicsState(): {
    ball: BallPhysics;
    players: Map<string, PlayerPhysics>;
    frame: number;
    seed: MatchSeed;
  } {
    return {
      ball: { ...this.ball },
      players: new Map(this.players),
      frame: this.physicsFrame,
      seed: { ...this.matchSeed }
    };
  }

  public getChecksum(): string {
    // Generate checksum for physics state validation
    const state = this.getPhysicsState();
    const stateString = JSON.stringify({
      ballPosition: state.ball.position,
      ballVelocity: state.ball.velocity,
      frame: state.frame,
      seed: state.seed.seed
    });
    return btoa(stateString).slice(0, 32);
  }

  public dispose(): void {
    this.players.clear();
    this.ball = null as any;
  }
}
