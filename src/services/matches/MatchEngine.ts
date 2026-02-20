import { MatchPlayer, Vector3, BallPhysics, MatchEvent, ControlState } from '../../types/match';

export class MatchPhysicsEngine {
  // Physics constants
  private readonly GRAVITY = -9.81;
  private readonly AIR_RESISTANCE = 0.98;
  private readonly GROUND_FRICTION = 0.95;
  private readonly BALL_BOUNCE_COEFFICIENT = 0.6;
  private readonly PITCH_LENGTH = 105;
  private readonly PITCH_WIDTH = 68;
  private readonly PITCH_HEIGHT = 50;

  // Gravity application
  applyGravity(ball: BallPhysics, deltaTime: number): BallPhysics {
    if (ball.isInAir) {
      const newVelocity = { ...ball.velocity };
      newVelocity.y += this.GRAVITY * deltaTime;

      return {
        ...ball,
        velocity: newVelocity,
      };
    }
    return ball;
  }

  // Air resistance
  applyAirResistance(ball: BallPhysics, deltaTime: number): BallPhysics {
    const dragFactor = Math.pow(this.AIR_RESISTANCE, deltaTime);

    return {
      ...ball,
      velocity: {
        x: ball.velocity.x * dragFactor,
        y: ball.velocity.y * dragFactor,
        z: ball.velocity.z * dragFactor,
      },
    };
  }

  // Update ball position
  updateBallPosition(ball: BallPhysics, deltaTime: number): BallPhysics {
    const newPosition = {
      x: ball.position.x + ball.velocity.x * deltaTime,
      y: ball.position.y + ball.velocity.y * deltaTime,
      z: ball.position.z + ball.velocity.z * deltaTime,
    };

    let isInAir = ball.isInAir;

    // Ground collision
    if (newPosition.y <= 0.22) {
      newPosition.y = 0.22;
      isInAir = false;

      // Apply ground friction
      ball.velocity.x *= this.GROUND_FRICTION;
      ball.velocity.z *= this.GROUND_FRICTION;

      // Bounce
      if (Math.abs(ball.velocity.y) > 0.1) {
        ball.velocity.y *= -this.BALL_BOUNCE_COEFFICIENT;
      } else {
        ball.velocity.y = 0;
      }
    } else {
      isInAir = true;
    }

    // Boundary checks
    if (Math.abs(newPosition.x) > this.PITCH_LENGTH / 2) {
      newPosition.x = Math.sign(newPosition.x) * (this.PITCH_LENGTH / 2);
      ball.velocity.x *= -0.8;
    }

    if (Math.abs(newPosition.z) > this.PITCH_WIDTH / 2) {
      newPosition.z = Math.sign(newPosition.z) * (this.PITCH_WIDTH / 2);
      ball.velocity.z *= -0.8;
    }

    return {
      ...ball,
      position: newPosition,
      isInAir,
    };
  }

  // Calculate shot trajectory
  calculateShotTrajectory(
    shooter: MatchPlayer,
    power: number,
    direction: { x: number; y: number },
    curveAmount: number = 0
  ): Vector3 {
    const baseVel = power * (shooter.stats.shotPower / 100) * 30;
    const curve = curveAmount * 0.5;

    return {
      x: direction.x * baseVel + curve,
      y: direction.y * baseVel * 0.5,
      z: 0,
    };
  }

  // Detect collision between player and ball
  checkPlayerBallCollision(
    player: MatchPlayer,
    ball: BallPhysics,
    collisionRadius: number = 0.5
  ): boolean {
    const dist = this.getDistance(player.position, ball.position);
    return dist <= collisionRadius;
  }

  // Calculate passing lane
  calculatePassingLane(
    passer: MatchPlayer,
    receiver: MatchPlayer
  ): { distance: number; angle: number } {
    const distance = this.getDistance(passer.position, receiver.position);
    const dx = receiver.position.x - passer.position.x;
    const dz = receiver.position.z - passer.position.z;
    const angle = Math.atan2(dz, dx);

    return { distance, angle };
  }

  // Get distance between two points
  private getDistance(p1: Vector3, p2: Vector3): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Check if ball is out of bounds
  isBallOutOfBounds(ball: BallPhysics): 'in-bounds' | 'goal-line' | 'side-line' {
    if (Math.abs(ball.position.x) > this.PITCH_LENGTH / 2 - 0.5) {
      return 'goal-line';
    }
    if (Math.abs(ball.position.z) > this.PITCH_WIDTH / 2 - 0.5) {
      return 'side-line';
    }
    return 'in-bounds';
  }

  // Calculate pass accuracy based on stamina and control
  calculatePassAccuracy(player: MatchPlayer, distance: number): number {
    const controlFactor = player.stats.control / 100;
    const staminaFactor = player.stamina / player.maxStamina;
    const distancePenalty = Math.min(distance / 50, 1);

    return Math.max(
      0,
      (controlFactor * 0.6 + staminaFactor * 0.3 - distancePenalty * 0.1) * 100
    );
  }

  // Calculate shot power decay over distance
  calculateShotPowerDecay(distance: number): number {
    return Math.max(0, 1 - distance / 100);
  }
}

export class FriendlyMatchService {
  private physicsEngine = new MatchPhysicsEngine();

  // Initialize friendly match
  initializeFriendlyMatch(homeTeam: MatchPlayer[], awayTeam: MatchPlayer[]) {
    return {
      homeTeam: homeTeam.map((p) => ({
        ...p,
        position: this.getFormationPosition(p.role, 'home', 0),
      })),
      awayTeam: awayTeam.map((p) => ({
        ...p,
        position: this.getFormationPosition(p.role, 'away', 0),
      })),
    };
  }

  // Get player position based on formation
  private getFormationPosition(
    role: string,
    team: 'home' | 'away',
    offset: number
  ): Vector3 {
    const direction = team === 'home' ? 1 : -1;
    const baseX = direction * 40;

    switch (role) {
      case 'goalkeeper':
        return { x: direction * 52, y: 0.43, z: 0 };
      case 'defender':
        return {
          x: baseX,
          y: 0.43,
          z: -20 + offset * 15,
        };
      case 'midfielder':
        return {
          x: baseX * 0.5,
          y: 0.43,
          z: -15 + offset * 15,
        };
      case 'attacker':
        return {
          x: baseX * 0.2,
          y: 0.43,
          z: -10 + offset * 20,
        };
      default:
        return { x: 0, y: 0.43, z: 0 };
    }
  }

  // Update match simulation tick
  tickMatchSimulation(
    players: MatchPlayer[],
    ball: BallPhysics,
    deltaTime: number = 0.016 // ~60fps
  ): { players: MatchPlayer[]; ball: BallPhysics } {
    // Apply physics
    let updatedBall = this.physicsEngine.applyGravity(ball, deltaTime);
    updatedBall = this.physicsEngine.applyAirResistance(updatedBall, deltaTime);
    updatedBall = this.physicsEngine.updateBallPosition(updatedBall, deltaTime);

    // Update player stamina
    const updatedPlayers = players.map((p) => this.updatePlayerStamina(p, deltaTime));

    return { players: updatedPlayers, ball: updatedBall };
  }

  private updatePlayerStamina(player: MatchPlayer, deltaTime: number): MatchPlayer {
    let staminaDrain = 0;

    if (player.isSprinting) {
      staminaDrain = 8 * deltaTime;
    } else if (player.velocity.x !== 0 || player.velocity.z !== 0) {
      staminaDrain = 2 * deltaTime;
    } else {
      staminaDrain = -1 * deltaTime; // Regenerate
    }

    return {
      ...player,
      stamina: Math.max(0, Math.min(player.maxStamina, player.stamina - staminaDrain)),
    };
  }

  // Create match event
  createMatchEvent(
    type: MatchEvent['type'],
    timestamp: number,
    player: string,
    team: 'home' | 'away',
    description: string
  ): MatchEvent {
    return {
      id: `event-${Date.now()}-${Math.random()}`,
      type,
      timestamp,
      player,
      team,
      description,
    };
  }

  // Calculate possession percentage
  calculatePossession(homeEvents: number, awayEvents: number): number {
    const total = homeEvents + awayEvents;
    return total === 0 ? 50 : (homeEvents / total) * 100;
  }

  // Check match time for state changes
  checkMatchStateTransition(
    currentTime: number,
    timeLength: number
  ): 'in-play' | 'half-time' | 'full-time' | null {
    const halfTime = (timeLength * 60) / 2;
    const fullTime = timeLength * 60;

    if (currentTime === halfTime) return 'half-time';
    if (currentTime >= fullTime) return 'full-time';
    return null;
  }
}

export class AIControllerService {
  // Get best receiver for a pass
  findBestReceiver(passer: MatchPlayer, teammates: MatchPlayer[]): MatchPlayer | null {
    let bestReceiver: MatchPlayer | null = null;
    let bestScore = -Infinity;

    teammates.forEach((teammate) => {
      if (teammate.id === passer.id) return;

      const distance = this.getDistance(passer.position, teammate.position);
      const angleScore = this.calculateAngleScore(passer, teammate);
      const staminaScore = teammate.stamina / teammate.maxStamina;

      const totalScore = angleScore * 0.5 + (1 - Math.min(distance / 50, 1)) * 0.3 + staminaScore * 0.2;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestReceiver = teammate;
      }
    });

    return bestReceiver;
  }

  // AI decision making for next action
  decideNextAction(
    player: MatchPlayer,
    teammates: MatchPlayer[],
    opponents: MatchPlayer[],
    ball: BallPhysics
  ): 'pass' | 'shoot' | 'dribble' | 'defend' {
    const distanceToBall = this.getDistance(player.position, ball.position);

    if (distanceToBall > 10) return 'defend';

    const shootDistance = this.getDistance(player.position, { x: 52, y: 0.43, z: 0 });
    if (shootDistance < 20 && player.stats.shotPower > 60) {
      return 'shoot';
    }

    const receiver = this.findBestReceiver(player, teammates);
    if (receiver && this.isPassingSafe(player, receiver, opponents)) {
      return 'pass';
    }

    return 'dribble';
  }

  private isPassingSafe(passer: MatchPlayer, receiver: MatchPlayer, opponents: MatchPlayer[]): boolean {
    // Check if any opponent is between passer and receiver
    const passLine = {
      start: passer.position,
      end: receiver.position,
    };

    for (const opponent of opponents) {
      const distanceToLine = this.pointToLineDistance(opponent.position, passLine);
      if (distanceToLine < 2) {
        return false;
      }
    }

    return true;
  }

  private pointToLineDistance(point: Vector3, line: { start: Vector3; end: Vector3 }): number {
    const dx = line.end.x - line.start.x;
    const dz = line.end.z - line.start.z;
    const t = Math.max(0, Math.min(1, ((point.x - line.start.x) * dx + (point.z - line.start.z) * dz) / (dx * dx + dz * dz)));

    const closestX = line.start.x + t * dx;
    const closestZ = line.start.z + t * dz;

    return Math.sqrt((point.x - closestX) ** 2 + (point.z - closestZ) ** 2);
  }

  private calculateAngleScore(player1: MatchPlayer, player2: MatchPlayer): number {
    const dx = player2.position.x - player1.position.x;
    const dz = player2.position.z - player1.position.z;
    const angle = Math.atan2(dz, dx);
    const forwardAngle = player1.rotation;
    const angleDiff = Math.abs(angle - forwardAngle);

    return 1 - angleDiff / Math.PI;
  }

  private getDistance(p1: Vector3, p2: Vector3): number {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
