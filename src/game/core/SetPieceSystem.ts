import { Vector3, MathUtils } from 'three';
import { SetPieceData, PlayerState, BallState } from '../types/MatchEngineTypes';

interface SetPieceConfig {
  freeKick: {
    wallDistance: number; // 9.15 meters
    minDistance: number;
    maxDistance: number;
  };
  penalty: {
    spotDistance: number; // 11 meters
    goalkeeperLine: number;
  };
  throwIn: {
    maxDistance: number;
    executionTime: number;
  };
  corner: {
    cornerArcRadius: number;
    maxDistance: number;
  };
}

interface SetPieceExecution {
  type: 'free_kick' | 'penalty' | 'throw_in' | 'corner' | 'goal_kick';
  executingPlayer: string;
  targetPosition: Vector3;
  power: number; // 0-1
  spin: Vector3;
  height: number; // 0-1
  executionTime: number;
  isDirect: boolean;
}

export class SetPieceSystem {
  private config: SetPieceConfig;
  private activeSetPiece: SetPieceExecution | null = null;
  private wallPositions: Vector3[] = [];
  private executionStartTime: number = 0;
  private playersInPosition: Set<string> = new Set();

  constructor() {
    this.config = {
      freeKick: {
        wallDistance: 9.15,
        minDistance: 20,
        maxDistance: 40
      },
      penalty: {
        spotDistance: 11,
        goalkeeperLine: 5.5
      },
      throwIn: {
        maxDistance: 30,
        executionTime: 2000
      },
      corner: {
        cornerArcRadius: 1,
        maxDistance: 25
      }
    };
  }

  public initiateSetPiece(setPieceData: SetPieceData): void {
    // Clear any existing set piece
    this.activeSetPiece = null;
    this.wallPositions = [];
    this.playersInPosition.clear();

    // Set up based on type
    switch (setPieceData.type) {
      case 'free_kick':
        this.setupFreeKick(setPieceData);
        break;
      case 'penalty':
        this.setupPenalty(setPieceData);
        break;
      case 'throw_in':
        this.setupThrowIn(setPieceData);
        break;
      case 'corner':
        this.setupCorner(setPieceData);
        break;
      case 'goal_kick':
        this.setupGoalKick(setPieceData);
        break;
    }
  }

  private setupFreeKick(setPieceData: SetPieceData): void {
    // Position wall
    this.positionWall(setPieceData);
    
    // Position attacking players
    this.positionAttackingPlayers(setPieceData);
    
    // Position defending players
    this.positionDefendingPlayers(setPieceData);
  }

  private positionWall(setPieceData: SetPieceData): void {
    const wallDistance = this.config.freeKick.wallDistance;
    const ballPosition = setPieceData.position;
    const goalPosition = new Vector3(0, 0, setPieceData.team === 'home' ? 52.5 : -52.5);
    
    // Calculate wall direction (perpendicular to shot direction)
    const shotDirection = goalPosition.clone().sub(ballPosition).normalize();
    const wallDirection = new Vector3(-shotDirection.z, 0, shotDirection.x).normalize();
    
    // Position wall players
    const wallPlayers = 4; // Typical wall size
    this.wallPositions = [];
    
    for (let i = 0; i < wallPlayers; i++) {
      const offset = (i - wallPlayers / 2 + 0.5) * 1.5; // 1.5m spacing
      const wallPosition = ballPosition.clone()
        .add(shotDirection.clone().multiplyScalar(-wallDistance))
        .add(wallDirection.clone().multiplyScalar(offset));
      
      this.wallPositions.push(wallPosition);
    }
  }

  private positionAttackingPlayers(setPieceData: SetPieceData): void {
    // Position players for various set piece strategies
    const strategies = ['direct_shot', 'cross', 'pass', 'dummy_run'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    switch (strategy) {
      case 'direct_shot':
        this.positionForDirectShot(setPieceData);
        break;
      case 'cross':
        this.positionForCross(setPieceData);
        break;
      case 'pass':
        this.positionForPass(setPieceData);
        break;
      case 'dummy_run':
        this.positionForDummyRun(setPieceData);
        break;
    }
  }

  private positionForDirectShot(setPieceData: SetPieceData): void {
    // Position players around the box for rebounds
    const ballPosition = setPieceData.position;
    const goalPosition = new Vector3(0, 0, setPieceData.team === 'home' ? 52.5 : -52.5);
    
    // Players positioned for rebounds
    const reboundPositions = [
      new Vector3(5, 0, 40),
      new Vector3(-5, 0, 40),
      new Vector3(8, 0, 35),
      new Vector3(-8, 0, 35),
      new Vector3(0, 0, 30)
    ];
    
    // Adjust based on set piece position
    reboundPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  private positionForCross(setPieceData: SetPieceData): void {
    // Position players in the box for a cross
    const crossingPositions = [
      new Vector3(3, 0, 45),
      new Vector3(-3, 0, 45),
      new Vector3(6, 0, 48),
      new Vector3(-6, 0, 48),
      new Vector3(0, 0, 50)
    ];
    
    // Adjust based on team
    crossingPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  private positionForPass(setPieceData: SetPieceData): void {
    // Position players for a quick pass
    const passPositions = [
      new Vector3(5, 0, 30),
      new Vector3(-5, 0, 30),
      new Vector3(0, 0, 25)
    ];
    
    // Adjust based on team
    passPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  private positionForDummyRun(setPieceData: SetPieceData): void {
    // Position players for dummy runs and over the ball
    const dummyRunPositions = [
      new Vector3(2, 0, 35),
      new Vector3(-2, 0, 35),
      new Vector3(4, 0, 40)
    ];
    
    // Adjust based on team
    dummyRunPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  private positionDefendingPlayers(setPieceData: SetPieceData): void {
    // Position defending players to mark attackers and defend the goal
    const defensiveLine = setPieceData.team === 'home' ? 35 : -35;
    
    // Mark dangerous areas
    const markingPositions = [
      new Vector3(0, 0, defensiveLine),
      new Vector3(5, 0, defensiveLine),
      new Vector3(-5, 0, defensiveLine),
      new Vector3(8, 0, defensiveLine - 5),
      new Vector3(-8, 0, defensiveLine - 5)
    ];
  }

  private setupPenalty(setPieceData: SetPieceData): void {
    const penaltySpot = new Vector3(0, 0, setPieceData.team === 'home' ? 39 : -39);
    
    // Position goalkeeper on the line
    const goalkeeperPosition = new Vector3(0, 0, setPieceData.team === 'home' ? 50.5 : -50.5);
    
    // Position other players outside the box
    const outsideBoxPositions = [
      new Vector3(12, 0, 30),
      new Vector3(-12, 0, 30),
      new Vector3(15, 0, 25),
      new Vector3(-15, 0, 25)
    ];
    
    // Adjust based on team
    outsideBoxPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  private setupThrowIn(setPieceData: SetPieceData): void {
    // Position players for throw-in
    const throwInPosition = setPieceData.position;
    
    // Find nearby teammates
    const teammatePositions = [
      throwInPosition.clone().add(new Vector3(5, 0, 0)),
      throwInPosition.clone().add(new Vector3(-5, 0, 0)),
      throwInPosition.clone().add(new Vector3(0, 0, 5)),
      throwInPosition.clone().add(new Vector3(0, 0, -5))
    ];
    
    // Position opponents to mark
    const markingPositions = teammatePositions.map(pos => 
      pos.clone().add(new Vector3(2, 0, 2))
    );
  }

  private setupCorner(setPieceData: SetPieceData): void {
    const cornerPosition = setPieceData.position;
    const nearPost = new Vector3(3.66, 0, setPieceData.team === 'home' ? 52.5 : -52.5);
    const farPost = new Vector3(-3.66, 0, setPieceData.team === 'home' ? 52.5 : -52.5);
    
    // Position players in the box
    const cornerPositions = [
      nearPost,
      farPost,
      new Vector3(0, 0, setPieceData.team === 'home' ? 48 : -48),
      new Vector3(6, 0, setPieceData.team === 'home' ? 50 : -50),
      new Vector3(-6, 0, setPieceData.team === 'home' ? 50 : -50),
      new Vector3(0, 0, setPieceData.team === 'home' ? 45 : -45) // Edge of box
    ];
    
    // Position defenders
    const defensivePositions = [
      new Vector3(0, 0, setPieceData.team === 'home' ? 40 : -40),
      new Vector3(4, 0, setPieceData.team === 'home' ? 42 : -42),
      new Vector3(-4, 0, setPieceData.team === 'home' ? 42 : -42),
      new Vector3(8, 0, setPieceData.team === 'home' ? 45 : -45),
      new Vector3(-8, 0, setPieceData.team === 'home' ? 45 : -45)
    ];
  }

  private setupGoalKick(setPieceData: SetPieceData): void {
    const goalKickPosition = new Vector3(setPieceData.position.x, 0, setPieceData.position.z);
    
    // Position players for goal kick
    const attackingPositions = [
      new Vector3(10, 0, 30),
      new Vector3(-10, 0, 30),
      new Vector3(0, 0, 35),
      new Vector3(15, 0, 25),
      new Vector3(-15, 0, 25)
    ];
    
    // Adjust based on team
    attackingPositions.forEach(pos => {
      if (setPieceData.team === 'away') {
        pos.z = -pos.z;
      }
    });
  }

  public executeSetPiece(execution: SetPieceExecution): void {
    this.activeSetPiece = execution;
    this.executionStartTime = Date.now();
    
    // Apply physics based on set piece type
    this.applySetPiecePhysics(execution);
  }

  private applySetPiecePhysics(execution: SetPieceExecution): void {
    switch (execution.type) {
      case 'free_kick':
        this.applyFreeKickPhysics(execution);
        break;
      case 'penalty':
        this.applyPenaltyPhysics(execution);
        break;
      case 'throw_in':
        this.applyThrowInPhysics(execution);
        break;
      case 'corner':
        this.applyCornerPhysics(execution);
        break;
      case 'goal_kick':
        this.applyGoalKickPhysics(execution);
        break;
    }
  }

  private applyFreeKickPhysics(execution: SetPieceExecution): void {
    // Calculate shot trajectory
    const direction = execution.targetPosition.clone().sub(new Vector3(0, 0, 0)).normalize();
    const power = execution.power * 25; // Max 25 m/s
    const height = execution.height * 15; // Max 15m height
    
    const velocity = direction.multiplyScalar(power);
    velocity.y = height;
    
    // Apply spin for curve
    velocity.add(execution.spin);
    
    // Check for wall collision
    this.checkWallCollision(velocity);
  }

  private applyPenaltyPhysics(execution: SetPieceExecution): void {
    // Penalty shot - direct at goal with some accuracy variation
    const goalPosition = new Vector3(0, 0, 52.5);
    const direction = goalPosition.clone().sub(new Vector3(0, 0, 0)).normalize();
    
    // Add accuracy variation based on player composure
    const accuracyVariation = (1 - execution.power) * 0.3; // Less power = less accurate
    const randomAngle = (Math.random() - 0.5) * accuracyVariation;
    
    const rotatedDirection = direction.clone();
    rotatedDirection.x += Math.sin(randomAngle) * 2;
    rotatedDirection.z += Math.cos(randomAngle) * 2;
    rotatedDirection.normalize();
    
    const power = execution.power * 20; // Max 20 m/s for penalty
    const velocity = rotatedDirection.multiplyScalar(power);
    velocity.y = 2; // Low shot for penalty
  }

  private applyThrowInPhysics(execution: SetPieceExecution): void {
    // Throw-in - limited power and height
    const direction = execution.targetPosition.clone().sub(new Vector3(0, 0, 0)).normalize();
    const power = execution.power * 15; // Max 15 m/s for throw-in
    const height = execution.height * 8; // Max 8m height for throw-in
    
    const velocity = direction.multiplyScalar(power);
    velocity.y = height;
  }

  private applyCornerPhysics(execution: SetPieceExecution): void {
    // Corner - high arc towards goal area
    const targetArea = new Vector3(0, 0, 45); // Target the 6-yard box
    const direction = targetArea.clone().sub(new Vector3(0, 0, 0)).normalize();
    
    const power = execution.power * 20; // Max 20 m/s
    const height = execution.height * 20; // Max 20m height for corner
    
    const velocity = direction.multiplyScalar(power);
    velocity.y = height;
    
    // Add some spin for curl
    velocity.add(execution.spin);
  }

  private applyGoalKickPhysics(execution: SetPieceExecution): void {
    // Goal kick - long, high ball
    const direction = execution.targetPosition.clone().sub(new Vector3(0, 0, 0)).normalize();
    const power = execution.power * 30; // Max 30 m/s for goal kick
    const height = execution.height * 25; // Max 25m height
    
    const velocity = direction.multiplyScalar(power);
    velocity.y = height;
  }

  private checkWallCollision(velocity: Vector3): boolean {
    // Check if shot will hit wall
    for (const wallPosition of this.wallPositions) {
      const distanceToWall = wallPosition.distanceTo(new Vector3(0, 0, 0));
      const timeToWall = distanceToWall / velocity.length();
      
      if (timeToWall < 1) { // Will reach wall within 1 second
        const ballPositionAtWall = velocity.clone().multiplyScalar(timeToWall);
        const wallDistance = ballPositionAtWall.distanceTo(wallPosition);
        
        if (wallDistance < 2) { // Will hit wall
          return true;
        }
      }
    }
    
    return false;
  }

  public getWallPositions(): Vector3[] {
    return this.wallPositions;
  }

  public getActiveSetPiece(): SetPieceExecution | null {
    return this.activeSetPiece;
  }

  public isSetPieceActive(): boolean {
    return this.activeSetPiece !== null;
  }

  public completeSetPiece(): void {
    this.activeSetPiece = null;
    this.wallPositions = [];
    this.playersInPosition.clear();
  }

  public update(deltaTime: number): void {
    if (this.activeSetPiece) {
      // Update set piece execution
      const executionTime = Date.now() - this.executionStartTime;
      
      // Check if execution is complete
      const maxExecutionTime = this.getMaxExecutionTime(this.activeSetPiece.type);
      if (executionTime > maxExecutionTime) {
        this.completeSetPiece();
      }
    }
  }

  private getMaxExecutionTime(setPieceType: string): number {
    switch (setPieceType) {
      case 'free_kick':
        return 3000;
      case 'penalty':
        return 2000;
      case 'throw_in':
        return this.config.throwIn.executionTime;
      case 'corner':
        return 3000;
      case 'goal_kick':
        return 3000;
      default:
        return 2000;
    }
  }

  public dispose(): void {
    this.activeSetPiece = null;
    this.wallPositions = [];
    this.playersInPosition.clear();
  }
}
