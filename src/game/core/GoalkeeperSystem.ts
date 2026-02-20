import { Vector3, MathUtils } from 'three';
import { PlayerState, BallState, GoalkeeperAction, PlayerStats } from '../types/MatchEngineTypes';

interface ShotPrediction {
  targetPosition: Vector3;
  timeToGoal: number;
  shotPower: number;
  spin: Vector3;
  trajectory: Vector3[];
  isHighShot: boolean;
  isWideShot: boolean;
}

interface GoalkeeperMemory {
  shooterPattern: Map<string, Array<{ corner: string; time: number }>>;
  lastShotDirection: Vector3;
  reactionHistory: Array<{ success: boolean; time: number }>;
}

export class GoalkeeperSystem {
  private goalkeeper: PlayerState | null = null;
  private memory: GoalkeeperMemory;
  private currentAction: GoalkeeperAction | null = null;
  private actionStartTime: number = 0;
  private reactionDelay: number = 0;
  
  // GK constants
  private readonly REACTION_BASE_TIME = 200; // milliseconds
  private readonly DIVE_SPEED = 8; // m/s
  private readonly MAX_DIVE_DISTANCE = 3; // meters
  private readonly GOAL_WIDTH = 7.32; // meters
  private readonly GOAL_HEIGHT = 2.44; // meters
  private readonly PENALTY_SPOT_DISTANCE = 11; // meters

  constructor() {
    this.memory = {
      shooterPattern: new Map(),
      lastShotDirection: new Vector3(0, 0, 0),
      reactionHistory: []
    };
  }

  public setGoalkeeper(player: PlayerState): void {
    this.goalkeeper = player;
  }

  public update(ballState: BallState, deltaTime: number): GoalkeeperAction | null {
    if (!this.goalkeeper) return null;

    const dt = deltaTime / 1000;
    
    // Check if there's a shot on goal
    const shotPrediction = this.predictShot(ballState);
    
    if (shotPrediction && this.isShotOnTarget(shotPrediction)) {
      // Calculate reaction time
      const reactionTime = this.calculateReactionTime(shotPrediction);
      
      if (Date.now() - this.actionStartTime > this.reactionDelay) {
        // Make decision
        const action = this.makeGoalkeeperDecision(shotPrediction);
        
        if (action) {
          this.currentAction = action;
          this.actionStartTime = Date.now();
          this.reactionDelay = reactionTime;
          
          return action;
        }
      }
    }

    // Update current action if active
    if (this.currentAction) {
      this.updateCurrentAction(dt);
    }

    return null;
  }

  private predictShot(ballState: BallState): ShotPrediction | null {
    if (ballState.velocity.length() < 5) return null; // Not a shot
    
    const position = ballState.position;
    const velocity = ballState.velocity;
    
    // Check if ball is moving towards goal
    const goalPosition = new Vector3(0, 0, this.goalkeeper?.team === 'home' ? 52.5 : -52.5);
    const toGoal = goalPosition.clone().sub(position);
    const direction = velocity.clone().normalize();
    
    if (direction.dot(toGoal.normalize()) < 0.5) return null; // Not towards goal
    
    // Calculate trajectory
    const trajectory: Vector3[] = [];
    const timeSteps = 30;
    const dt = 0.1;
    
    let currentPos = position.clone();
    let currentVel = velocity.clone();
    
    for (let i = 0; i < timeSteps; i++) {
      trajectory.push(currentPos.clone());
      
      // Apply physics
      currentVel.y -= 9.81 * dt; // Gravity
      currentPos.add(currentVel.clone().multiplyScalar(dt));
      
      // Check if reached goal line
      if (Math.abs(currentPos.z - goalPosition.z) < 1) {
        break;
      }
    }
    
    const finalPosition = trajectory[trajectory.length - 1];
    const timeToGoal = trajectory.length * dt;
    
    return {
      targetPosition: finalPosition,
      timeToGoal,
      shotPower: velocity.length(),
      spin: ballState.spin,
      trajectory,
      isHighShot: finalPosition.y > 1.5,
      isWideShot: Math.abs(finalPosition.x) > this.GOAL_WIDTH / 2
    };
  }

  private isShotOnTarget(prediction: ShotPrediction): boolean {
    return !prediction.isWideShot && prediction.targetPosition.y < this.GOAL_HEIGHT;
  }

  private calculateReactionTime(prediction: ShotPrediction): number {
    if (!this.goalkeeper) return this.REACTION_BASE_TIME;
    
    const baseReaction = this.REACTION_BASE_TIME;
    const reactionStat = this.goalkeeper.stats.reaction;
    const fatigueFactor = this.goalkeeper.currentStamina / 100;
    
    // Distance-based reaction modifier
    const distance = prediction.targetPosition.distanceTo(this.goalkeeper.position);
    const distanceModifier = Math.max(0.5, Math.min(1.5, distance / 20));
    
    // Shot speed modifier
    const speedModifier = Math.max(0.7, Math.min(1.3, prediction.shotPower / 20));
    
    const reactionTime = baseReaction * (100 / reactionStat) * (2 - fatigueFactor) * distanceModifier * speedModifier;
    
    return reactionTime;
  }

  private makeGoalkeeperDecision(prediction: ShotPrediction): GoalkeeperAction | null {
    if (!this.goalkeeper) return null;
    
    const distanceToTarget = this.goalkeeper.position.distanceTo(prediction.targetPosition);
    const timeAvailable = prediction.timeToGoal;
    const reactionTime = this.calculateReactionTime(prediction);
    
    // Check if we can reach the ball
    const timeToReach = distanceToTarget / this.DIVE_SPEED;
    
    if (timeToReach > timeAvailable - reactionTime / 1000) {
      // Can't reach - best effort position
      return this.makeBestEffortSave(prediction);
    }
    
    // Analyze shot characteristics
    const isCloseRange = distanceToTarget < 5;
    const isPowerful = prediction.shotPower > 20;
    const hasSpin = prediction.spin.length() > 2;
    
    // Decision tree based on shot type
    if (isCloseRange) {
      return this.makeCloseRangeDecision(prediction);
    } else if (isPowerful) {
      return this.makePowerfulShotDecision(prediction);
    } else if (hasSpin) {
      return this.makeSpinShotDecision(prediction);
    } else {
      return this.makeStandardSaveDecision(prediction);
    }
  }

  private makeCloseRangeDecision(prediction: ShotPrediction): GoalkeeperAction {
    // Close range - quick reaction, less time to think
    const direction = this.calculateDiveDirection(prediction);
    
    return {
      type: prediction.isHighShot ? 'punch' : 'catch',
      direction,
      timing: 0.8, // High urgency
      power: 0.9
    };
  }

  private makePowerfulShotDecision(prediction: ShotPrediction): GoalkeeperAction {
    // Powerful shot - prioritize safety
    const direction = this.calculateDiveDirection(prediction);
    
    // If very powerful and central, parry wide
    if (prediction.shotPower > 25 && Math.abs(prediction.targetPosition.x) < 2) {
      return {
        type: 'parry_wide',
        direction,
        timing: 0.7,
        power: 1.0
      };
    }
    
    return {
      type: 'punch',
      direction,
      timing: 0.75,
      power: 0.8
    };
  }

  private makeSpinShotDecision(prediction: ShotPrediction): GoalkeeperAction {
    // Spin shot - account for curve
    const adjustedDirection = this.adjustForSpin(prediction);
    
    return {
      type: 'catch',
      direction: adjustedDirection,
      timing: 0.7,
      power: 0.6
    };
  }

  private makeStandardSaveDecision(prediction: ShotPrediction): GoalkeeperAction {
    const direction = this.calculateDiveDirection(prediction);
    const distance = this.goalkeeper!.position.distanceTo(prediction.targetPosition);
    
    // Decide action type based on distance and height
    if (distance < 1) {
      return {
        type: 'catch',
        direction,
        timing: 0.9,
        power: 0.5
      };
    } else if (distance < 2) {
      return {
        type: 'parry_wide',
        direction,
        timing: 0.8,
        power: 0.7
      };
    } else {
      return {
        type: prediction.isHighShot ? 'dive_center' : 'dive_left',
        direction,
        timing: 0.7,
        power: 0.9
      };
    }
  }

  private makeBestEffortSave(prediction: ShotPrediction): GoalkeeperAction {
    // Can't reach the ball - make best effort
    const direction = prediction.targetPosition.clone().sub(this.goalkeeper!.position).normalize();
    
    return {
      type: 'stay',
      direction: direction.multiplyScalar(0.5), // Limited movement
      timing: 0.5,
      power: 0.3
    };
  }

  private calculateDiveDirection(prediction: ShotPrediction): Vector3 {
    const target = prediction.targetPosition;
    const gkPosition = this.goalkeeper!.position;
    
    // Calculate optimal dive direction
    const rawDirection = target.clone().sub(gkPosition).normalize();
    
    // Consider shooter pattern memory
    const patternAdjustment = this.getPatternAdjustment(prediction);
    rawDirection.add(patternAdjustment);
    
    // Limit to reasonable dive angles
    const maxAngle = Math.PI / 3; // 60 degrees max
    const currentAngle = Math.atan2(rawDirection.x, rawDirection.z);
    const limitedAngle = Math.max(-maxAngle, Math.min(maxAngle, currentAngle));
    
    return new Vector3(Math.sin(limitedAngle), rawDirection.y, Math.cos(limitedAngle)).normalize();
  }

  private adjustForSpin(prediction: ShotPrediction): Vector3 {
    const baseDirection = this.calculateDiveDirection(prediction);
    const spinEffect = prediction.spin.clone().multiplyScalar(0.1);
    
    return baseDirection.add(spinEffect).normalize();
  }

  private getPatternAdjustment(prediction: ShotPrediction): Vector3 {
    // Analyze shooter's previous patterns
    const shooterId = "unknown"; // Would be passed from ball state
    const pattern = this.memory.shooterPattern.get(shooterId);
    
    if (!pattern || pattern.length < 2) {
      return new Vector3(0, 0, 0);
    }
    
    // Analyze recent shots
    const recentShots = pattern.slice(-5);
    const cornerFrequency = new Map<string, number>();
    
    recentShots.forEach(shot => {
      cornerFrequency.set(shot.corner, (cornerFrequency.get(shot.corner) || 0) + 1);
    });
    
    // Predict likely corner
    let mostLikelyCorner = '';
    let maxCount = 0;
    
    cornerFrequency.forEach((count, corner) => {
      if (count > maxCount) {
        maxCount = count;
        mostLikelyCorner = corner;
      }
    });
    
    // Adjust direction based on pattern
    const adjustment = new Vector3(0, 0, 0);
    
    switch (mostLikelyCorner) {
      case 'left':
        adjustment.x = -0.2;
        break;
      case 'right':
        adjustment.x = 0.2;
        break;
      case 'center':
        adjustment.x = 0;
        break;
    }
    
    return adjustment;
  }

  private updateCurrentAction(dt: number): void {
    if (!this.currentAction || !this.goalkeeper) return;
    
    // Update goalkeeper position based on action
    const moveSpeed = this.DIVE_SPEED * this.currentAction.power;
    const movement = this.currentAction.direction.clone().multiplyScalar(moveSpeed * dt);
    
    this.goalkeeper.position.add(movement);
    
    // Check if action is complete
    const actionDuration = this.getActionDuration(this.currentAction.type);
    if (Date.now() - this.actionStartTime > actionDuration) {
      this.currentAction = null;
    }
  }

  private getActionDuration(actionType: string): number {
    switch (actionType) {
      case 'dive_left':
      case 'dive_right':
      case 'dive_center':
        return 800; // milliseconds
      case 'catch':
        return 500;
      case 'punch':
        return 400;
      case 'parry_wide':
        return 600;
      default:
        return 300;
    }
  }

  public recordShotResult(shooterId: string, corner: string, success: boolean): void {
    // Update shooter pattern
    if (!this.memory.shooterPattern.has(shooterId)) {
      this.memory.shooterPattern.set(shooterId, []);
    }
    
    const pattern = this.memory.shooterPattern.get(shooterId)!;
    pattern.push({ corner, time: Date.now() });
    
    // Keep only recent shots
    if (pattern.length > 10) {
      pattern.shift();
    }
    
    // Update reaction history
    this.memory.reactionHistory.push({ success, time: Date.now() });
    
    if (this.memory.reactionHistory.length > 20) {
      this.memory.reactionHistory.shift();
    }
  }

  public getCurrentAction(): GoalkeeperAction | null {
    return this.currentAction;
  }

  public getReactionTime(): number {
    return this.reactionDelay;
  }

  public dispose(): void {
    this.goalkeeper = null;
    this.currentAction = null;
    this.memory.shooterPattern.clear();
    this.memory.reactionHistory = [];
  }
}
