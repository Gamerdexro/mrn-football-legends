import { Vector3 } from 'three';
import { GameConfig, PlayerState, BallState, AIInput, PlayerStats } from '../types/MatchEngineTypes';

interface AIPersonality {
  riskTolerance: number; // 0-1
  aggression: number; // 0-1
  positioningIntelligence: number; // 0-1
  decisionDelay: number; // milliseconds
  tacticalPreference: 'possession' | 'counter_attack' | 'balanced';
  strictnessLevel: number; // 0.8-1.2 for referee personality
  predictionDepth: number; // 1-3 actions ahead
  positionErrorMargin: number; // meters
}

interface PerceptionData {
  ballPosition: Vector3;
  ballVelocity: Vector3;
  ballTrajectory: Vector3[];
  nearbyTeammates: PlayerState[];
  nearbyOpponents: PlayerState[];
  openSpace: Vector3[];
  passingLanes: Array<{ from: Vector3; to: Vector3; safety: number }>;
  defensiveGaps: Vector3[];
  goalPosition: Vector3;
  opponentGoalPosition: Vector3;
}

export class TacticalAI {
  private aiPlayers: Map<string, PlayerState> = new Map();
  private personalities: Map<string, AIPersonality> = new Map();
  private perceptionData: Map<string, PerceptionData> = new Map();
  private decisionTimers: Map<string, number> = new Map();
  private config: GameConfig;
  
  // AI difficulty modifiers - EXACT FORMULAS
  private readonly DIFFICULTY_MODIFIERS = {
    easy: {
      decisionDelay: 350, // BaseDelay - (Easy × ReactionStat)
      reactionTime: 0.7,
      riskTolerance: 0.3,
      positioningIntelligence: 0.5,
      positionErrorMargin: 3.0, // ±3 meters
      predictionDepth: 1 // 1 pass ahead
    },
    medium: {
      decisionDelay: 200,
      reactionTime: 0.85,
      riskTolerance: 0.5,
      positioningIntelligence: 0.7,
      positionErrorMargin: 1.5, // ±1.5 meters
      predictionDepth: 2 // 2 actions ahead
    },
    hard: {
      decisionDelay: 120,
      reactionTime: 1.0,
      riskTolerance: 0.7,
      positioningIntelligence: 0.9,
      positionErrorMargin: 0.5, // ±0.5 meter
      predictionDepth: 3 // 3 actions ahead
    },
    legendary: {
      decisionDelay: 80, // 80ms delay
      reactionTime: 1.2,
      riskTolerance: 0.8,
      positioningIntelligence: 1.0,
      positionErrorMargin: 0.2, // ±0.2 meter
      predictionDepth: 4 // 4 actions ahead
    }
  };

  constructor(config: GameConfig) {
    this.config = config;
  }

  public addAIPlayer(player: PlayerState): void {
    this.aiPlayers.set(player.id, player);
    this.personalities.set(player.id, this.generatePersonality(player));
    this.decisionTimers.set(player.id, 0);
  }

  public removeAIPlayer(playerId: string): void {
    this.aiPlayers.delete(playerId);
    this.personalities.delete(playerId);
    this.perceptionData.delete(playerId);
    this.decisionTimers.delete(playerId);
  }

  private generatePersonality(player: PlayerState): AIPersonality {
    const basePersonality = player.stats.positioning > 70 ? {
      riskTolerance: 0.6,
      aggression: 0.4,
      positioningIntelligence: 0.8,
      decisionDelay: 100,
      tacticalPreference: 'balanced' as const,
      strictnessLevel: 1.0,
      predictionDepth: 2,
      positionErrorMargin: 1.0
    } : {
      riskTolerance: 0.4,
      aggression: 0.6,
      positioningIntelligence: 0.6,
      decisionDelay: 150,
      tacticalPreference: 'counter_attack' as const,
      strictnessLevel: 0.9,
      predictionDepth: 1,
      positionErrorMargin: 2.0
    };

    // Add some randomness
    return {
      ...basePersonality,
      riskTolerance: Math.max(0, Math.min(1, basePersonality.riskTolerance + (Math.random() - 0.5) * 0.2)),
      aggression: Math.max(0, Math.min(1, basePersonality.aggression + (Math.random() - 0.5) * 0.2))
    };
  }

  private updatePerception(player: PlayerState): void {
    const perception: PerceptionData = {
      ballPosition: this.getBallPosition(),
      ballVelocity: this.getBallVelocity(),
      ballTrajectory: this.predictBallTrajectory(2), // 2 seconds ahead
      nearbyTeammates: this.getNearbyPlayers(player, 15, player.team),
      nearbyOpponents: this.getNearbyPlayers(player, 15, player.team === 'home' ? 'away' : 'home'),
      openSpace: this.findOpenSpace(player),
      passingLanes: this.analyzePassingLanes(player),
      defensiveGaps: this.findDefensiveGaps(player),
      goalPosition: player.team === 'home' ? new Vector3(0, 0, -52.5) : new Vector3(0, 0, 52.5),
      opponentGoalPosition: player.team === 'home' ? new Vector3(0, 0, 52.5) : new Vector3(0, 0, -52.5)
    };
    
    this.perceptionData.set(player.id, perception);
  }

  private getBallPosition(): Vector3 {
    // Simplified - would get from match state
    return new Vector3(0, 0, 0);
  }

  private getBallVelocity(): Vector3 {
    // Simplified - would get from match state
    return new Vector3(0, 0, 0);
  }

  private predictBallTrajectory(seconds: number): Vector3[] {
    const trajectory: Vector3[] = [];
    const ballPos = this.getBallPosition();
    const ballVel = this.getBallVelocity();
    
    for (let i = 0; i < seconds * 10; i++) {
      const t = i * 0.1;
      const pos = ballPos.clone().add(ballVel.clone().multiplyScalar(t));
      trajectory.push(pos);
    }
    
    return trajectory;
  }

  private getNearbyPlayers(player: PlayerState, radius: number, team: 'home' | 'away'): PlayerState[] {
    const nearby: PlayerState[] = [];
    
    this.aiPlayers.forEach(otherPlayer => {
      if (otherPlayer.team === team && otherPlayer.id !== player.id) {
        const distance = player.position.distanceTo(otherPlayer.position);
        if (distance <= radius) {
          nearby.push(otherPlayer);
        }
      }
    });
    
    return nearby.sort((a, b) => player.position.distanceTo(a.position) - player.position.distanceTo(b.position));
  }

  private findOpenSpace(player: PlayerState): Vector3[] {
    const openSpaces: Vector3[] = [];
    const checkRadius = 20;
    const gridSize = 5;
    
    for (let x = -checkRadius; x <= checkRadius; x += gridSize) {
      for (let z = -checkRadius; z <= checkRadius; z += gridSize) {
        const testPos = player.position.clone().add(new Vector3(x, 0, z));
        
        // Check if position is clear of opponents
        const nearbyOpponents = this.getNearbyPlayers(player, 10, player.team === 'home' ? 'away' : 'home');
        const isClear = nearbyOpponents.every(opponent => opponent.position.distanceTo(testPos) > 5);
        
        if (isClear) {
          openSpaces.push(testPos);
        }
      }
    }
    
    return openSpaces;
  }

  private analyzePassingLanes(player: PlayerState): Array<{ from: Vector3; to: Vector3; safety: number }> {
    const lanes: Array<{ from: Vector3; to: Vector3; safety: number }> = [];
    const perception = this.perceptionData.get(player.id)!;
    
    perception.nearbyTeammates.forEach(teammate => {
      const safety = this.calculatePassingLaneSafety(player.position, teammate.position, perception.nearbyOpponents);
      lanes.push({
        from: player.position,
        to: teammate.position,
        safety
      });
    });
    
    return lanes.sort((a, b) => b.safety - a.safety);
  }

  private calculatePassingLaneSafety(from: Vector3, to: Vector3, opponents: PlayerState[]): number {
    let safety = 1.0;
    
    opponents.forEach(opponent => {
      const distance = this.pointToLineDistance(opponent.position, from, to);
      if (distance < 5) {
        safety *= 0.5; // Reduce safety if opponent is close to passing lane
      }
    });
    
    return safety;
  }

  private pointToLineDistance(point: Vector3, lineStart: Vector3, lineEnd: Vector3): number {
    const line = lineEnd.clone().sub(lineStart);
    const pointToStart = point.clone().sub(lineStart);
    const projection = pointToStart.dot(line) / line.dot(line);
    const closestPoint = lineStart.clone().add(line.multiplyScalar(Math.max(0, Math.min(1, projection))));
    
    return point.distanceTo(closestPoint);
  }

  private findDefensiveGaps(player: PlayerState): Vector3[] {
    // Simplified defensive gap detection
    const gaps: Vector3[] = [];
    const goalPosition = player.team === 'home' ? new Vector3(0, 0, -52.5) : new Vector3(0, 0, 52.5);
    
    // Check areas in front of goal that are poorly defended
    for (let x = -15; x <= 15; x += 5) {
      for (let z = 5; z <= 20; z += 5) {
        const testPos = goalPosition.clone().add(new Vector3(x, 0, z * (player.team === 'home' ? 1 : -1)));
        
        const nearbyDefenders = this.getNearbyPlayers(player, 10, player.team);
        const isGap = nearbyDefenders.length < 2;
        
        if (isGap) {
          gaps.push(testPos);
        }
      }
    }
    
    return gaps;
  }

  // EXACT UTILITY-BASED DECISION SYSTEM
  private makeDecision(player: PlayerState): AIInput {
    const perception = this.perceptionData.get(player.id)!;
    const personality = this.personalities.get(player.id)!;
    const modifier = this.DIFFICULTY_MODIFIERS[this.config.difficulty];
    
    // Available actions
    const actions = ['shoot', 'pass', 'dribble', 'clear', 'tackle', 'hold_ball', 'move_to_space'];
    
    // Calculate utility for each action
    let bestAction = 'hold_ball';
    let bestUtility = 0;
    
    actions.forEach(action => {
      const utility = this.calculateUtility(action, player, perception, personality, modifier);
      if (utility > bestUtility) {
        bestUtility = utility;
        bestAction = action;
      }
    });
    
    // Return AI input based on best action
    return this.executeAction(bestAction, player, perception, personality);
  }
  
  // UTILITY SCORE FORMULA: Utility(Action) = W1×PositionScore + W2×SuccessProbability + W3×TacticalNeed + W4×RiskFactor + W5×FatigueModifier + W6×PersonalityBias
  private calculateUtility(action: string, player: PlayerState, perception: PerceptionData, personality: AIPersonality, modifier: any): number {
    const weights = {
      positionScore: 0.25,
      successProbability: 0.30,
      tacticalNeed: 0.20,
      riskFactor: 0.15,
      fatigueModifier: 0.05,
      personalityBias: 0.05
    };
    
    const positionScore = this.calculatePositionScore(action, player, perception);
    const successProbability = this.calculateSuccessProbability(action, player, perception);
    const tacticalNeed = this.calculateTacticalNeed(action, player, perception);
    const riskFactor = this.calculateRiskFactor(action, player, perception);
    const fatigueModifier = this.calculateFatigueModifier(action, player);
    const personalityBias = this.calculatePersonalityBias(action, personality);
    
    return (
      weights.positionScore * positionScore +
      weights.successProbability * successProbability +
      weights.tacticalNeed * tacticalNeed +
      weights.riskFactor * riskFactor +
      weights.fatigueModifier * fatigueModifier +
      weights.personalityBias * personalityBias
    );
  }
  
  // SUCCESS PROBABILITY FORMULAS
  private calculateSuccessProbability(action: string, player: PlayerState, perception: PerceptionData): number {
    switch (action) {
      case 'pass':
        return this.calculatePassSuccess(player, perception);
      case 'shoot':
        return this.calculateShotSuccess(player, perception);
      case 'dribble':
        return this.calculateDribbleSuccess(player, perception);
      case 'tackle':
        return this.calculateTackleSuccess(player, perception);
      default:
        return 0.5;
    }
  }
  
  // PASS SUCCESS: PassSuccess = 1 − (DistanceFactor × PressureFactor × InterceptionRisk)
  private calculatePassSuccess(player: PlayerState, perception: PerceptionData): number {
    const maxSafeDistance = 30;
    const passDistance = this.getBestPassDistance(player, perception);
    const distanceFactor = passDistance / maxSafeDistance;
    
    const defendersWithinRadius = perception.nearbyOpponents.filter(op => 
      op.position.distanceTo(player.position) < 10
    ).length;
    const pressureFactor = defendersWithinRadius / 5;
    
    const interceptionRisk = this.calculateInterceptionRisk(player, perception);
    
    return Math.max(0, 1 - (distanceFactor * pressureFactor * interceptionRisk));
  }
  
  // SHOT SUCCESS: ShotSuccess = (ShotAccuracy × AngleFactor × BalanceFactor × TimingPrecision) / (GKPositioning × DefensivePressure)
  private calculateShotSuccess(player: PlayerState, perception: PerceptionData): number {
    const shotAccuracy = (player.stats.shooting ?? player.stats.shotAccuracy ?? 50) / 100;
    const angleFactor = this.calculateAngleFromGoal(player.position, perception.opponentGoalPosition);
    const balanceFactor = player.currentStamina > 50 ? 1.0 : 0.7;
    const timingPrecision = 0.9; // Simplified
    
    const gkPositioning = 0.8; // Simplified
    const defensivePressure = Math.max(0.5, 1 - (perception.nearbyOpponents.length * 0.1));
    
    return (shotAccuracy * angleFactor * balanceFactor * timingPrecision) / (gkPositioning * defensivePressure);
  }
  
  private calculateDribbleSuccess(player: PlayerState, perception: PerceptionData): number {
    const dribblingSkill = (player.stats.dribbling ?? player.stats.dribble ?? 50) / 100;
    const pressureFactor = Math.max(0.3, 1 - (perception.nearbyOpponents.length * 0.15));
    const staminaFactor = player.currentStamina / 100;
    
    return dribblingSkill * pressureFactor * staminaFactor;
  }
  
  private calculateTackleSuccess(player: PlayerState, perception: PerceptionData): number {
    const tacklingSkill = (player.stats.tackling ?? 50) / 100;
    const distanceToBall = player.position.distanceTo(perception.ballPosition);
    const distanceFactor = distanceToBall < 3 ? 1.0 : 0.3;
    
    return tacklingSkill * distanceFactor;
  }
  
  // RISK FACTOR: RiskFactor = (1 − GameStateSafetyWeight)
  private calculateRiskFactor(action: string, player: PlayerState, perception: PerceptionData): number {
    // Simplified game state safety
    const isWinning = this.getScoreDifference(player.team) > 0;
    const isLosingLate = this.getScoreDifference(player.team) < 0 && this.getMatchTime() > 75;
    
    let riskFactor = 0.5;
    
    if (isWinning) {
      riskFactor -= 0.2; // Decrease risk when winning
    }
    
    if (isLosingLate) {
      riskFactor += 0.3; // Increase risk when losing late
    }
    
    // Action-specific risk
    switch (action) {
      case 'shoot':
        return riskFactor + 0.2;
      case 'pass':
        return riskFactor - 0.1;
      case 'dribble':
        return riskFactor + 0.1;
      case 'clear':
        return riskFactor - 0.2;
      default:
        return riskFactor;
    }
  }
  
  // HELPER METHODS
  private calculatePositionScore(action: string, player: PlayerState, perception: PerceptionData): number {
    // Simplified position scoring
    const distanceToGoal = player.position.distanceTo(perception.opponentGoalPosition);
    return Math.max(0, 1 - (distanceToGoal / 100));
  }
  
  private calculateTacticalNeed(action: string, player: PlayerState, perception: PerceptionData): number {
    // Simplified tactical need
    const teammatesNearby = perception.nearbyTeammates.length;
    const opponentsNearby = perception.nearbyOpponents.length;
    
    if (opponentsNearby > teammatesNearby) {
      return action === 'pass' ? 0.8 : 0.4;
    } else {
      return action === 'shoot' ? 0.8 : 0.5;
    }
  }
  
  private calculateFatigueModifier(action: string, player: PlayerState): number {
    const staminaRatio = player.currentStamina / 100;
    
    // High fatigue reduces success of demanding actions
    switch (action) {
      case 'sprint':
      case 'dribble':
        return staminaRatio;
      case 'shoot':
        return staminaRatio * 0.8 + 0.2;
      default:
        return 1.0;
    }
  }
  
  private calculatePersonalityBias(action: string, personality: AIPersonality): number {
    switch (action) {
      case 'shoot':
        return personality.aggression;
      case 'pass':
        return 1 - personality.aggression;
      case 'dribble':
        return personality.riskTolerance;
      default:
        return 0.5;
    }
  }
  
  private calculateAngleFromGoal(position: Vector3, goalPosition: Vector3): number {
    const angle = Math.atan2(position.x - goalPosition.x, position.z - goalPosition.z);
    return Math.cos(angle); // Better angle = closer to 1
  }
  
  private calculateInterceptionRisk(player: PlayerState, perception: PerceptionData): number {
    // Simplified interception risk
    return perception.nearbyOpponents.length * 0.1;
  }
  
  private getBestPassDistance(player: PlayerState, perception: PerceptionData): number {
    if (perception.nearbyTeammates.length === 0) return 20;
    
    const closestTeammate = perception.nearbyTeammates[0];
    return player.position.distanceTo(closestTeammate.position);
  }
  
  private getScoreDifference(team: 'home' | 'away'): number {
    // Simplified - would get from match state
    return 0;
  }
  
  private getMatchTime(): number {
    // Simplified - would get from match state
    return 50;
  }
  
  private executeAction(action: string, player: PlayerState, perception: PerceptionData, personality: AIPersonality): AIInput {
    const baseInput: AIInput = {
      playerId: player.id,
      action: action as any,
      targetPosition: player.position.clone(),
      targetPlayer: undefined,
      power: 0.5,
      direction: new Vector3(0, 0, 1),
      timestamp: Date.now()
    };
    
    switch (action) {
      case 'shoot':
        return {
          ...baseInput,
          targetPosition: perception.opponentGoalPosition.clone(),
          power: 0.9,
          direction: perception.opponentGoalPosition.clone().sub(player.position).normalize()
        };
        
      case 'pass':
        const target = perception.nearbyTeammates[0];
        return {
          ...baseInput,
          targetPlayer: target?.id,
          targetPosition: target?.position || player.position.clone(),
          power: 0.7,
          direction: target?.position.clone().sub(player.position).normalize() || new Vector3(0, 0, 1)
        };
        
      case 'dribble':
        return {
          ...baseInput,
          targetPosition: perception.opponentGoalPosition.clone(),
          power: 0.6,
          direction: perception.opponentGoalPosition.clone().sub(player.position).normalize()
        };
        
      default:
        return baseInput;
    }
  }

  // UPDATE METHODS
  public updateAI(deltaTime: number): void {
    this.aiPlayers.forEach(player => {
      const timer = this.decisionTimers.get(player.id) || 0;
      const personality = this.personalities.get(player.id)!;
      const modifier = this.DIFFICULTY_MODIFIERS[this.config.difficulty];
      
      // Update decision timer (AI evaluates every 100ms)
      const decisionInterval = 100; // 10Hz as specified
      const totalDelay = personality.decisionDelay + modifier.decisionDelay;
      
      if (timer >= decisionInterval + totalDelay) {
        this.updatePerception(player);
        const decision = this.makeDecision(player);
        this.executeDecision(player, decision);
        this.decisionTimers.set(player.id, 0);
      } else {
        this.decisionTimers.set(player.id, timer + deltaTime);
      }
    });
  }
  
  private executeDecision(player: PlayerState, decision: AIInput): void {
    // Apply decision to player state
    player.velocity.copy(decision.direction.multiplyScalar(decision.power * 10));
    
    // Handle specific actions
    switch (decision.action) {
      case 'shoot':
        this.handleShot(player, decision);
        break;
      case 'pass':
        this.handlePass(player, decision);
        break;
      case 'tackle':
        this.handleTackle(player, decision);
        break;
    }
  }
  
  private handleShot(player: PlayerState, decision: AIInput): void {
    // Shot logic would be handled by physics system
    console.log(`Player ${player.id} shooting with power ${decision.power}`);
  }
  
  private handlePass(player: PlayerState, decision: AIInput): void {
    // Pass logic would be handled by physics system
    console.log(`Player ${player.id} passing to ${decision.targetPlayer}`);
  }
  
  private handleTackle(player: PlayerState, decision: AIInput): void {
    // Tackle logic would be handled by physics/foul system
    console.log(`Player ${player.id} attempting tackle`);
  }
  
  // GETTERS FOR EXTERNAL SYSTEMS
  public getAIInput(playerId: string): AIInput | undefined {
    const player = this.aiPlayers.get(playerId);
    if (!player) return undefined;
    
    const perception = this.perceptionData.get(playerId);
    const personality = this.personalities.get(playerId);
    if (!perception || !personality) return undefined;
    
    return this.makeDecision(player);
  }
  
  public getPersonality(playerId: string): AIPersonality | undefined {
    return this.personalities.get(playerId);
  }
  
  public getPerception(playerId: string): PerceptionData | undefined {
    return this.perceptionData.get(playerId);
  }
  
  public dispose(): void {
    this.aiPlayers.clear();
    this.personalities.clear();
    this.perceptionData.clear();
    this.decisionTimers.clear();
  }
}
