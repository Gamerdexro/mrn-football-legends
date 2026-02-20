import { Vector3, Euler, MathUtils } from 'three';
import { PlayerState, PlayerStats } from '../types/MatchEngineTypes';

export class PlayerMovementSystem {
  private players: Map<string, PlayerState> = new Map();
  
  // Movement constants
  private readonly MAX_TURN_RATE = Math.PI; // radians per second
  private readonly MOMENTUM_CARRY_FACTOR = 0.8;
  private readonly SPRINT_STAMINA_DRAIN = 2.0; // per second
  private readonly RECOVERY_STAMINA_GAIN = 0.5; // per second
  private readonly DRIBBLE_BASE_RADIUS = 1.5; // meters
  private readonly PRESSURE_SHRINK_FACTOR = 0.5;

  public addPlayer(player: PlayerState): void {
    this.players.set(player.id, player);
  }

  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  public updatePlayerMovement(playerId: string, inputDirection: Vector3, deltaTime: number): void {
    const player = this.players.get(playerId);
    if (!player) return;

    const dt = deltaTime / 1000; // Convert to seconds

    // Calculate target velocity based on input and stats
    const targetVelocity = this.calculateTargetVelocity(player, inputDirection);
    
    // Apply acceleration curve
    this.applyAcceleration(player, targetVelocity, dt);
    
    // Handle turning and balance
    this.handleTurning(player, inputDirection, dt);
    
    // Update stamina
    this.updateStamina(player, dt);
    
    // Handle dribbling
    this.handleDribbling(player, dt);
    
    // Apply momentum carry
    this.applyMomentumCarry(player, dt);
    
    // Update position
    player.position.add(player.velocity.clone().multiplyScalar(dt));
  }

  private calculateTargetVelocity(player: PlayerState, inputDirection: Vector3): Vector3 {
    if (inputDirection.length() === 0) {
      return new Vector3(0, 0, 0);
    }

    // Normalize input direction
    const normalizedInput = inputDirection.normalize();
    
    // Calculate max speed based on stats and stamina
    const maxSpeed = this.calculateMaxSpeed(player);
    
    // Apply speed modifier based on sprint vs normal movement
    const isSprinting = inputDirection.length() > 0.8;
    const speedMultiplier = isSprinting ? 1.0 : 0.7;
    
    return normalizedInput.multiplyScalar(maxSpeed * speedMultiplier);
  }

  private calculateMaxSpeed(player: PlayerState): number {
    const baseSpeed = (player.stats.topSpeed / 100) * 9; // Max 9 m/s
    const staminaFactor = this.getStaminaFactor(player.currentStamina);
    const bodyTypeFactor = this.getBodyTypeSpeedFactor(player.stats.bodyType);
    const fatigueFactor = player.currentStamina < 20 ? 0.6 : 1.0;
    
    return baseSpeed * staminaFactor * bodyTypeFactor * fatigueFactor;
  }

  private getStaminaFactor(stamina: number): number {
    // Stamina affects speed non-linearly
    if (stamina > 80) return 1.0;
    if (stamina > 50) return 0.9;
    if (stamina > 20) return 0.7;
    return 0.5;
  }

  private getBodyTypeSpeedFactor(bodyType: 'light' | 'medium' | 'heavy'): number {
    switch (bodyType) {
      case 'light': return 1.1;
      case 'medium': return 1.0;
      case 'heavy': return 0.9;
    }
  }

  private applyAcceleration(player: PlayerState, targetVelocity: Vector3, dt: number): void {
    const acceleration = this.calculateAcceleration(player);
    const currentSpeed = player.velocity.length();
    const targetSpeed = targetVelocity.length();
    
    if (targetSpeed === 0) {
      // Deceleration
      const deceleration = acceleration * 2; // Decelerate faster than accelerate
      player.velocity.multiplyScalar(Math.max(0, 1 - (deceleration * dt / currentSpeed)));
    } else {
      // Acceleration
      const velocityDiff = targetVelocity.sub(player.velocity);
      const accelerationVector = velocityDiff.normalize().multiplyScalar(acceleration * dt);
      
      player.velocity.add(accelerationVector);
      
      // Clamp to target speed
      if (player.velocity.length() > targetSpeed) {
        player.velocity.normalize().multiplyScalar(targetSpeed);
      }
    }
  }

  private calculateAcceleration(player: PlayerState): number {
    const baseAcceleration = (player.stats.acceleration / 100) * 6; // Max 6 m/s²
    const staminaFactor = this.getStaminaFactor(player.currentStamina);
    const bodyTypeFactor = this.getBodyTypeAccelerationFactor(player.stats.bodyType);
    
    return baseAcceleration * staminaFactor * bodyTypeFactor;
  }

  private getBodyTypeAccelerationFactor(bodyType: 'light' | 'medium' | 'heavy'): number {
    switch (bodyType) {
      case 'light': return 1.2;
      case 'medium': return 1.0;
      case 'heavy': return 0.8;
    }
  }

  private handleTurning(player: PlayerState, inputDirection: Vector3, dt: number): void {
    if (inputDirection.length() === 0) return;

    const currentDirection = new Vector3(player.velocity.x, 0, player.velocity.z).normalize();
    const targetDirection = inputDirection.normalize();
    
    // Calculate angle between current and target direction
    const angle = Math.atan2(
      currentDirection.cross(targetDirection).y,
      currentDirection.dot(targetDirection)
    );
    
    // Calculate turn rate based on stats and current speed
    const turnRate = this.calculateTurnRate(player);
    const maxTurnAngle = turnRate * dt;
    
    // Apply turn with balance check
    if (Math.abs(angle) > maxTurnAngle) {
      // Sharp turn - check balance
      const balanceCheck = this.checkBalance(player, Math.abs(angle));
      
      if (!balanceCheck.successful) {
        // Player stumbles or loses balance
        this.applyBalancePenalty(player, balanceCheck.severity);
      }
      
      // Limit turn angle
      const limitedAngle = Math.sign(angle) * maxTurnAngle;
      const rotation = new Euler(0, limitedAngle, 0);
      player.velocity.applyEuler(rotation);
    }
    
    // Update player rotation to face movement direction
    if (player.velocity.length() > 0.1) {
      const targetRotation = Math.atan2(player.velocity.x, player.velocity.z);
      player.rotation.y = targetRotation;
    }
  }

  private calculateTurnRate(player: PlayerState): number {
    const baseTurnRate = this.MAX_TURN_RATE;
    const speedFactor = Math.max(0.3, 1 - (player.velocity.length() / this.calculateMaxSpeed(player)));
    const balanceFactor = player.stats.balance / 100;
    const staminaFactor = this.getStaminaFactor(player.currentStamina);
    
    return baseTurnRate * speedFactor * balanceFactor * staminaFactor;
  }

  private checkBalance(player: PlayerState, turnAngle: number): { successful: boolean; severity: 'light' | 'medium' | 'heavy' } {
    const balanceThreshold = (player.stats.balance / 100) * Math.PI / 2; // Convert to radians
    const speedFactor = player.velocity.length() / this.calculateMaxSpeed(player);
    const adjustedThreshold = balanceThreshold * (1 - speedFactor * 0.5);
    
    if (turnAngle <= adjustedThreshold) {
      return { successful: true, severity: 'light' };
    }
    
    const severity = turnAngle > adjustedThreshold * 2 ? 'heavy' : 'medium';
    return { successful: false, severity };
  }

  private applyBalancePenalty(player: PlayerState, severity: 'light' | 'medium' | 'heavy'): void {
    switch (severity) {
      case 'light':
        player.velocity.multiplyScalar(0.8);
        break;
      case 'medium':
        player.velocity.multiplyScalar(0.6);
        // Small stumble animation trigger
        break;
      case 'heavy':
        player.velocity.multiplyScalar(0.3);
        // Major stumble/fall animation trigger
        break;
    }
  }

  private updateStamina(player: PlayerState, dt: number): void {
    const currentSpeed = player.velocity.length();
    const maxSpeed = this.calculateMaxSpeed(player);
    const speedRatio = currentSpeed / maxSpeed;
    
    if (speedRatio > 0.7) {
      // Sprinting - drain stamina
      const drainRate = this.SPRINT_STAMINA_DRAIN * speedRatio;
      player.currentStamina = Math.max(0, player.currentStamina - drainRate * dt);
    } else if (speedRatio < 0.3) {
      // Resting - recover stamina
      player.currentStamina = Math.min(100, player.currentStamina + this.RECOVERY_STAMINA_GAIN * dt);
    }
  }

  private handleDribbling(player: PlayerState, dt: number): void {
    // Calculate dribble control radius
    const baseControlRadius = this.DRIBBLE_BASE_RADIUS;
    const dribbleStatFactor = player.stats.dribble / 100;
    const speedFactor = Math.max(0.5, 1 - (player.velocity.length() / this.calculateMaxSpeed(player)));
    const staminaFactor = this.getStaminaFactor(player.currentStamina);
    
    // Check for nearby pressure (opponents)
    const pressureFactor = this.calculatePressureFactor(player);
    
    const controlRadius = baseControlRadius * dribbleStatFactor * speedFactor * staminaFactor * pressureFactor;
    
    // Store dribble control radius for ball physics system
    (player as any).dribbleControlRadius = controlRadius;
  }

  private calculatePressureFactor(player: PlayerState): number {
    let pressureLevel = 0;
    
    // Check nearby opponents
    this.players.forEach(otherPlayer => {
      if (otherPlayer.team !== player.team) {
        const distance = player.position.distanceTo(otherPlayer.position);
        if (distance < 3) { // Within pressure range
          pressureLevel += (3 - distance) / 3;
        }
      }
    });
    
    // Clamp pressure level and apply shrink factor
    pressureLevel = Math.min(1, pressureLevel);
    return 1 - (pressureLevel * this.PRESSURE_SHRINK_FACTOR);
  }

  private applyMomentumCarry(player: PlayerState, dt: number): void {
    // Apply inertia and momentum carry
    const momentumFactor = this.MOMENTUM_CARRY_FACTOR;
    player.velocity.multiplyScalar(Math.pow(momentumFactor, dt));
    
    // Stop very slow movement
    if (player.velocity.length() < 0.1) {
      player.velocity.set(0, 0, 0);
    }
  }

  public getPlayerState(playerId: string): PlayerState | undefined {
    return this.players.get(playerId);
  }

  public getAllPlayers(): PlayerState[] {
    return Array.from(this.players.values());
  }

  public dispose(): void {
    this.players.clear();
  }
}
