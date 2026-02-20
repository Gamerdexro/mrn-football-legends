/**
 * TACTICAL FORMATIONS ENGINE
 * 
 * Dynamic spatial control system driven by zones, ball state, and tactical identity.
 * The pitch is divided into a 12x8 zone matrix.
 * Each zone has weight values for defensive density, attacking opportunity, and transition speed.
 * Formation shifts calculated through Formation Offset Vector based on ball position.
 * 
 * Key features:
 * - Dynamic 12x8 zone matrix
 * - Formation state transitions (defensive/balanced/attacking)
 * - Compactness calculation based on pressure intensity
 * - Momentum-driven shape changes
 * - Pressing triggers based on context
 * - Offside trap synchronization
 * - 10Hz update rate for efficiency
 */

import type {
  TacticalFormationEngine,
  FormationSnapshot,
  FormationState,
  FormationAnchor,
  PitchZone,
  Vector3,
  SimulationState,
} from '../types/simulation';

const PITCH_LENGTH = 105; // meters
const PITCH_WIDTH = 68; // meters
const ZONE_COLS = 12;
const ZONE_ROWS = 8;
const ZONE_WIDTH = PITCH_LENGTH / ZONE_COLS; // 8.75m
const ZONE_HEIGHT = PITCH_WIDTH / ZONE_ROWS; // 8.5m

const FORMATION_UPDATE_RATE = 0.1; // 10Hz = 100ms

export class TacticalFormationsEngine implements TacticalFormationEngine {
  currentFormation: FormationSnapshot;
  formationOffsetVector: Vector3 = { x: 0, y: 0, z: 0 };
  tacticalAggressionFactor: number = 1.0;
  lastBallPosition: Vector3 = { x: 0, y: 0, z: 0 };
  possessionDuration: number = 0;
  successfulPassChain: number = 0;
  territoryControl: number = 0;
  
  private pitchZones: PitchZone[] = [];
  private lastUpdateTime: number = 0;
  private momentumThreshold: number = 0.6;
  private baseCompactnessRadius: number = 20;
  private maxCompactnessRadius: number = 35;
  private minCompactnessRadius: number = 12;
  private offlineMode: boolean = false;

  constructor(offlineMode: boolean = false) {
    this.offlineMode = offlineMode;
    this.initializePitchZones();
    this.currentFormation = this.createDefaultFormation();
  }

  /**
   * Initialize 12x8 zone matrix
   */
  private initializePitchZones(): void {
    this.pitchZones = [];
    
    for (let col = 0; col < ZONE_COLS; col++) {
      for (let row = 0; row < ZONE_ROWS; row++) {
        const minX = -PITCH_LENGTH / 2 + col * ZONE_WIDTH;
        const maxX = minX + ZONE_WIDTH;
        const minZ = -PITCH_WIDTH / 2 + row * ZONE_HEIGHT;
        const maxZ = minZ + ZONE_HEIGHT;
        
        const zone: PitchZone = {
          id: `zone_${col}_${row}`,
          gridX: col,
          gridY: row,
          center: {
            x: (minX + maxX) / 2,
            y: 0,
            z: (minZ + maxZ) / 2,
          },
          bounds: { minX, maxX, minZ, maxZ },
          defensiveDensity: this.calculateZoneDefensiveDensity(col),
          attackingOpportunity: this.calculateZoneAttackingOpportunity(col),
          transitionSpeed: this.calculateZoneTransitionSpeed(col),
          isPressZone: false,
        };
        
        this.pitchZones.push(zone);
      }
    }
  }

  /**
   * Defensive density higher in defensive third
   */
  private calculateZoneDefensiveDensity(col: number): number {
    if (col < 4) return 0.9; // Defensive third
    if (col < 8) return 0.5; // Midfield
    return 0.1; // Attacking third
  }

  /**
   * Attacking opportunity higher in attacking third
   */
  private calculateZoneAttackingOpportunity(col: number): number {
    if (col < 4) return 0.1;
    if (col < 8) return 0.5;
    return 0.9;
  }

  /**
   * Transition speed affects how quickly players move through zones
   */
  private calculateZoneTransitionSpeed(col: number): number {
    if (col < 4 || col >= 10) return 0.7; // Slower in key zones
    return 1.0;
  }

  /**
   * Get zone at ball position
   */
  private findZoneAtPosition(pos: Vector3): PitchZone {
    const zone = this.pitchZones.find(z => 
      pos.x >= z.bounds.minX && pos.x < z.bounds.maxX &&
      pos.z >= z.bounds.minZ && pos.z < z.bounds.maxZ
    );
    return zone || this.pitchZones[0];
  }

  /**
   * Calculate formation offset based on ball position
   * FormationOffset = BallPosition × TacticalAggressionFactor × 0.35
   */
  calculateFormationOffset(ballPos: Vector3): Vector3 {
    const offset: Vector3 = {
      x: ballPos.x * this.tacticalAggressionFactor * 0.35,
      y: 0,
      z: ballPos.z * this.tacticalAggressionFactor * 0.15, // Less z influence
    };

    this.formationOffsetVector = offset;
    return offset;
  }

  /**
   * Update formation state based on possession and momentum
   */
  updateFormationState(possession: boolean, momentum: number): void {
    let newState: FormationState = 'BALANCED';
    
    if (possession) {
      if (momentum > this.momentumThreshold) {
        newState = 'ATTACKING';
      } else if (momentum < 0.3) {
        newState = 'BALANCED';
      }
    } else {
      if (momentum > 0.7) {
        newState = 'DEFENSIVE';
      } else {
        newState = 'BALANCED';
      }
    }
    
    this.currentFormation.state = newState;
  }

  /**
   * Calculate compactness radius
   * CompactnessRadius = BaseRadius − (PressureIntensity × 2 meters)
   */
  calculateCompactness(pressureIntensity: number): number {
    const compactness = this.baseCompactnessRadius - (pressureIntensity * 2);
    return Math.max(
      this.minCompactnessRadius,
      Math.min(compactness, this.maxCompactnessRadius)
    );
  }

  /**
   * Calculate momentum
   * Momentum = PossessionDuration × SuccessfulPassChain × TerritoryControl
   * All normalized to 0-1 range
   */
  calculateMomentum(): number {
    const possessionFactor = Math.min(this.possessionDuration / 60, 1); // 60 seconds = full factor
    const passFactor = Math.min(this.successfulPassChain / 10, 1); // 10 passes = full factor
    const territoryFactor = Math.min(this.territoryControl, 1);
    
    const momentum = possessionFactor * 0.4 + passFactor * 0.35 + territoryFactor * 0.25;
    return Math.min(momentum, 1.0);
  }

  /**
   * Calculate formation width adjustment
   * Width = FormationWidth × (1 + OpponentCentralDensityFactor)
   */
  calculateFormationWidth(opponentCentralDensity: number): number {
    const baseWidth = 25; // Default formation width in meters
    const adjustmentFactor = 1 + opponentCentralDensity;
    return baseWidth * adjustmentFactor;
  }

  /**
   * Check offside trap across defensive line
   */
  checkOffside(defenderLine: Vector3[], playerPos: Vector3): boolean {
    if (defenderLine.length === 0) return false;
    
    // Find the most advanced defender (lowest x value if attacking to positive x)
    const mostAdvancedDefender = defenderLine.reduce((min, def) => 
      def.x > min.x ? def : min
    );
    
    // Allow small tolerance for sync error
    const offside = playerPos.x > mostAdvancedDefender.x + 0.5;
    return offside;
  }

  /**
   * Update anchor positions with smooth movement
   */
  updateAnchorPositions(deltaTime: number): void {
    const now = Date.now();
    
    // Only update at formation update rate
    if (now - this.lastUpdateTime < FORMATION_UPDATE_RATE * 1000) {
      return;
    }
    
    this.lastUpdateTime = now;
    
    // Calculate shift influence based on formation state
    const stateInfluence = this.getStateInfluence();
    
    // Update each anchor
    this.currentFormation.anchors.forEach((anchor: FormationAnchor) => {
      const currentPos = anchor.baseZone.center;
      const offset = this.formationOffsetVector;
      
      // Apply smooth movement toward target with easing
      const targetX = currentPos.x + offset.x * stateInfluence;
      const targetZ = currentPos.z + offset.z * stateInfluence;
      
      // Movement smoothing prevents robotic shifts
      const smoothFactor = 0.15; // 15% per update gives natural feel
      const newX = currentPos.x + (targetX - currentPos.x) * smoothFactor;
      const newZ = currentPos.z + (targetZ - currentPos.z) * smoothFactor;
      
      anchor.offsetFromAnchor.x = newX - anchor.baseZone.center.x;
      anchor.offsetFromAnchor.z = newZ - anchor.baseZone.center.z;
    });
  }

  /**
   * Get formation state influence multiplier
   */
  private getStateInfluence(): number {
    switch (this.currentFormation.state) {
      case 'DEFENSIVE':
        return 0.3; // Less aggressive positioning
      case 'ATTACKING':
        return 1.2; // More aggressive positioning
      case 'BALANCED':
      default:
        return 1.0;
    }
  }

  /**
   * Create default formation (4-3-3)
   */
  private createDefaultFormation(): FormationSnapshot {
    const anchors = new Map<string, FormationAnchor>();
    
    // This is simplified - in production would have full squad
    // Goalkeeper
    anchors.set('keeper', this.createAnchor('keeper', -45, 0));
    // Defenders
    anchors.set('cb1', this.createAnchor('cb1', -35, -15));
    anchors.set('cb2', this.createAnchor('cb2', -35, 15));
    // Midfielders
    anchors.set('cm1', this.createAnchor('cm1', -15, -10));
    anchors.set('cm2', this.createAnchor('cm2', -15, 0));
    // Attackers
    anchors.set('st1', this.createAnchor('st1', 15, -10));
    anchors.set('st2', this.createAnchor('st2', 15, 10));
    
    return {
      state: 'BALANCED',
      anchors,
      compactnessRadius: this.baseCompactnessRadius,
      pressureIntensity: 0.5,
      formationWidth: 25,
      teamMomentum: 0.5,
    };
  }

  /**
   * Create formation anchor at position
   */
  private createAnchor(playerId: string, x: number, z: number): FormationAnchor {
    const baseZone = this.findZoneAtPosition({ x, y: 0, z });
    
    return {
      playerId,
      baseZone,
      supportZones: this.getSupportZones(baseZone),
      recoveryZone: this.getRecoveryZone(baseZone),
      pressingTriggerZone: this.getPressingTriggerZone(baseZone),
      offsetFromAnchor: { x: 0, y: 0, z: 0 },
    };
  }

  /**
   * Get support zones around anchor zone
   */
  private getSupportZones(baseZone: PitchZone): PitchZone[] {
    return this.pitchZones.filter(z => {
      const distance = Math.sqrt(
        Math.pow(z.gridX - baseZone.gridX, 2) + 
        Math.pow(z.gridY - baseZone.gridY, 2)
      );
      return distance <= 2 && distance > 0;
    });
  }

  /**
   * Get recovery zone (defensive fallback)
   */
  private getRecoveryZone(baseZone: PitchZone): PitchZone {
    // Recovery zone is 3-4 zones back
    const recoveryCol = Math.max(0, baseZone.gridX - 3);
    return this.pitchZones.find(z => 
      z.gridX === recoveryCol && z.gridY === baseZone.gridY
    ) || baseZone;
  }

  /**
   * Get pressing trigger zone
   */
  private getPressingTriggerZone(baseZone: PitchZone): PitchZone {
    // Pressing zone is 1-2 zones ahead
    const pressingCol = Math.min(ZONE_COLS - 1, baseZone.gridX + 2);
    return this.pitchZones.find(z => 
      z.gridX === pressingCol && z.gridY === baseZone.gridY
    ) || baseZone;
  }

  /**
   * Check if should activate high press (last 10 minutes while losing)
   */
  shouldActivateHighPress(matchTime: number, scoreGap: number): boolean {
    const timeRemaining = 5400 - matchTime; // 90 * 60 seconds
    return timeRemaining < 600 && scoreGap < 0; // Last 10 minutes, down by score
  }

  /**
   * Get all zones for pitch visualization
   */
  getZones(): PitchZone[] {
    return this.pitchZones;
  }

  /**
   * Get current formation anchors
   */
  getFormationAnchors(): Map<string, FormationAnchor> {
    return this.currentFormation.anchors;
  }
}
