/**
 * CORE SIMULATION TYPES
 * Enterprise-level football simulation architecture
 * Defines all types for the 6 major systems
 */

// ============================================================================
// 1. TACTICAL FORMATIONS ENGINE TYPES
// ============================================================================

/** 12x8 zone matrix for spatial control */
export interface PitchZone {
  id: string;
  gridX: number;
  gridY: number;
  center: Vector3;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  defensiveDensity: number;
  attackingOpportunity: number;
  transitionSpeed: number;
  isPressZone: boolean;
}

/** Formation position reference */
export interface FormationAnchor {
  playerId: string;
  baseZone: PitchZone;
  supportZones: PitchZone[];
  recoveryZone: PitchZone;
  pressingTriggerZone: PitchZone;
  offsetFromAnchor: Vector3;
}

/** Three-state formation system */
export type FormationState = 'DEFENSIVE' | 'BALANCED' | 'ATTACKING';

export interface FormationSnapshot {
  state: FormationState;
  anchors: Map<string, FormationAnchor>;
  compactnessRadius: number;
  pressureIntensity: number;
  formationWidth: number;
  teamMomentum: number;
}

export interface TacticalFormationEngine {
  currentFormation: FormationSnapshot;
  formationOffsetVector: Vector3;
  tacticalAggressionFactor: number;
  lastBallPosition: Vector3;
  possessionDuration: number;
  successfulPassChain: number;
  territoryControl: number;
  
  calculateFormationOffset(ballPos: Vector3): Vector3;
  updateFormationState(possession: boolean, momentum: number): void;
  calculateCompactness(pressureIntensity: number): number;
  calculateMomentum(): number;
  calculateFormationWidth(opponentCentralDensity: number): number;
  checkOffside(defenderLine: Vector3[], playerPos: Vector3): boolean;
  updateAnchorPositions(deltaTime: number): void;
}

// ============================================================================
// 2. ADAPTIVE LEARNING AI MEMORY SYSTEM TYPES
// ============================================================================

export interface PlayerPattern {
  shotDirectionHistory: { direction: Vector3; confidence: number }[];
  passPreferenceHeatmap: Map<string, number>;
  dribbleDirectionBias: Vector3;
  sprintUsageFrequency: number;
  skillMoveUsage: Map<string, number>;
  slideReliability: number;
}

export interface AIMemoryMetric {
  eventType: 'SHOT' | 'PASS' | 'DRIBBLE' | 'SPRINT' | 'SKILL_MOVE' | 'SLIDE' | 'SHIELD';
  timestamp: number;
  value: number;
  confidence: number;
}

export interface AdaptiveMemorySystem {
  patternMemory: Map<string, PlayerPattern>;
  recentEvents: AIMemoryMetric[];
  eventMemoryWindow: number; // Last 10 events
  maxPatternConfidence: number; // 4 consecutive events threshold
  memoryDecayFactor: number; // 0.8 old + 0.2 new
  maxInfluencePercentage: number; // 30% max
  
  recordPlayerAction(playerId: string, metric: AIMemoryMetric): void;
  getPlayerPattern(playerId: string): PlayerPattern;
  calculateAnticipationBias(playerId: string, action: string): number;
  calculateDecisionVariation(baseUtility: number, playerPredictionConfidence: number): number;
  decayMemory(): void;
}

// ============================================================================
// 3. INJURY BIOMECHANICS MODEL TYPES
// ============================================================================

export type InjurySeverity = 'NONE' | 'MINOR_KNOCK' | 'HAMSTRING_STRAIN' | 'ANKLE_TWIST' | 'KNEE_HYPEREXTENSION';

export interface InjuryImpactData {
  impactForce: number;
  maxSafeForce: number;
  staminaRatio: number;
  balanceFactor: number;
  collisionType: 'NORMAL' | 'SLIDE_BEHIND' | 'HEADER_AWKWARD';
  resultingSeverity: InjurySeverity;
}

export interface PlayerBiomechanics {
  playerId: string;
  microDamage: number; // Accumulated stress (0-100+)
  currentInjury: InjurySeverity;
  injuryRecoveryTime: number;
  speedReluctance: number;
  accelerationMultiplier: number;
  jumpHeightMultiplier: number;
  lastCollisionForce: number;
  isSubstitutionSuggested: boolean;
}

export interface BiomechanicsEngine {
  playerStates: Map<string, PlayerBiomechanics>;
  isInjurySystemEnabled: boolean;
  
  calculateInjuryProbability(
    collisionMass: number,
    relativeVelocity: number,
    staminaRatio: number,
    collisionType: InjuryImpactData['collisionType']
  ): number;
  
  applyInjury(playerId: string, severityData: InjuryImpactData): void;
  updateMicroDamage(playerId: string, stressAmount: number): void;
  calculateRecoveryTime(severity: InjurySeverity, fitnessRating: number): number;
  getPerformanceModifier(playerId: string): number;
  checkSubstitutionNeeded(playerId: string): boolean;
}

// ============================================================================
// 4. GOALKEEPER NEURAL PREDICTION TYPES
// ============================================================================

export interface ShotTrajectory {
  shooterPos: Vector3;
  shooterBalance: number;
  shotVector: Vector3;
  shotPower: number;
  spin: Vector3;
  predictedPath: Vector3[];
  ballAngleVisibility: number;
  shotPreparationTime: number;
}

export interface GoalkeeperPrediction {
  predictedBallPath: Vector3[];
  predictionConfidence: number;
  diveDirectionScore: {
    nearPostWeight: number;
    farPostWeight: number;
    centerWeight: number;
    selectedZone: 'NEAR' | 'FAR' | 'CENTER' | 'HIGH' | 'LOW';
  };
  reactionDelay: number;
  shouldAttemptCatch: boolean;
  catchThreshold: number;
  safeSpinLimit: number;
  parryVector: Vector3;
  optimalPosition: Vector3;
}

export interface GoalkeeperNeuralEngine {
  currentPosition: Vector3;
  personality: 'SAFE_HANDS' | 'ANTICIPATOR' | 'SHOWMAN';
  reactionTime: number;
  anticipationBonus: number;
  fatiguePenalty: number;
  patternMemory: Map<string, number>; // Shooter bias tracking
  maxPatternBias: number; // 25% bias cap
  
  predictShotTrajectory(trajectory: ShotTrajectory, simulationFrames?: number): GoalkeeperPrediction;
  calculatePredictionConfidence(
    angleVisibility: number,
    prepTime: number,
    shooterBalance: number
  ): number;
  calculateReactionDelay(baseReaction: number, anticipationBonus: number, fatigue: number): number;
  calculateOptimalPosition(ballX: number, goalCenter: number): Vector3;
  updateShooterPattern(shooterId: string, shotDirection: Vector3): void;
}

// ============================================================================
// 5. ANTI-EXPLOIT STAMINA ABUSE SYSTEM TYPES
// ============================================================================

export interface SprintToggleTracking {
  playerId: string;
  toggleCount: number;
  windowStart: number;
  windowDuration: number; // 5 seconds
}

export interface ShieldSpamTracking {
  playerId: string;
  lastShieldTime: number;
  consecutiveShields: number;
  balanceDebuff: number;
}

export interface SlideSpamTracking {
  playerId: string;
  lastSlideTime: number;
  consecutiveSlides: number;
  recoveryAnimDuration: number;
}

export interface PressSpamTracking {
  teamId: string;
  pressFrequency: number;
  teamFatigueFactor: number;
}

export interface AntiExploitSystem {
  sprintTracking: Map<string, SprintToggleTracking>;
  shieldTracking: Map<string, ShieldSpamTracking>;
  slideTracking: Map<string, SlideSpamTracking>;
  pressTracking: Map<string, PressSpamTracking>;
  
  sprintToggleThreshold: number;
  sprintDrainMultiplier: number;
  shieldCooldown: number;
  shieldBalanceDebuffAmount: number;
  slideRecoveryIncrease: number;
  pressThreshold: number;
  pressTeamFatigueIncrease: number;
  
  handleSprintToggle(playerId: string): number; // Returns drain multiplier
  handleShieldAction(playerId: string): number; // Returns balance debuff
  handleSlideAction(playerId: string): number; // Returns recovery duration increase
  handleHighPress(teamId: string): number; // Returns team fatigue increase
  updateTrackingWindows(deltaTime: number): void;
  resetPlayerExploitState(playerId: string): void;
}

// ============================================================================
// 6. REMOTE CONFIG TUNING ARCHITECTURE TYPES
// ============================================================================

export type ConfigCategory = 
  | 'AI_DECISION_WEIGHTS'
  | 'STAMINA_DRAIN_RATES'
  | 'INJURY_THRESHOLD'
  | 'PACK_PROBABILITY'
  | 'DIFFICULTY_DELAY'
  | 'FORMATION_WEIGHTS';

export interface ConfigParameterBound {
  min: number;
  max: number;
  default: number;
  step?: number;
}

export interface RemoteConfigParameter {
  key: string;
  version: string;
  value: number;
  bounds: ConfigParameterBound;
  category: ConfigCategory;
  locked: boolean; // Locked params cannot be tampered with
  description: string;
}

export interface RemoteConfigSnapshot {
  versionId: string;
  timestamp: number;
  checksum: string;
  parameters: Map<string, RemoteConfigParameter>;
  isOnline: boolean;
  isValid: boolean;
}

export interface RemoteConfigSystem {
  currentConfig: RemoteConfigSnapshot;
  cachedConfig: RemoteConfigSnapshot | null;
  configHistory: RemoteConfigSnapshot[];
  checksumVerified: boolean;
  maxCacheAge: number; // milliseconds
  
  fetchLatestConfig(): Promise<RemoteConfigSnapshot>;
  validateChecksum(config: RemoteConfigSnapshot): boolean;
  getParameter(key: string): number;
  setParameterBatch(updates: Map<string, number>): Promise<boolean>;
  rollbackConfig(versionId: string): Promise<void>;
  getCachedConfig(): RemoteConfigSnapshot | null;
  verifyCriticalLocks(): boolean;
}

// ============================================================================
// SHARED TYPES
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SimulationState {
  deltaTime: number;
  matchTime: number;
  ballPosition: Vector3;
  ballVelocity: Vector3;
  possession: 'HOME' | 'AWAY' | 'NEUTRAL';
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ELITE';
}

export interface SimulationConfig {
  formationUpdateRate: number; // 10Hz = 0.1s
  memoryDecayRate: number;
  injurySystemEnabled: boolean;
  antiExploitEnabled: boolean;
  remoteConfigEnabled: boolean;
  offlineMode: boolean;
}

// ============================================================================
// INTEGRATED SIMULATION ENGINE
// ============================================================================

export interface EnterpriseFootballSimulation {
  // Core systems
  formations: TacticalFormationEngine;
  aiMemory: AdaptiveMemorySystem;
  biomechanics: BiomechanicsEngine;
  keeperPrediction: GoalkeeperNeuralEngine;
  antiExploit: AntiExploitSystem;
  remoteConfig: RemoteConfigSystem;
  
  // State
  matchState: SimulationState;
  config: SimulationConfig;
  lastUpdateTime: number;
  
  // Lifecycle
  initialize(): Promise<void>;
  update(deltaTime: number, gameState: SimulationState): void;
  shutdown(): void;
  
  // Utilities
  getSystemHealth(): Record<string, boolean>;
  logSystemMetrics(): void;
}
