import { Vector3 } from 'three';
import { PlayerState } from '../types/MatchEngineTypes';

// Zone matrix: 12x8 pitch grid
interface PitchZone {
  x: number;
  z: number;
  defensiveDensity: number; // 0-1
  attackingOpportunity: number; // 0-1
  transitionSpeed: number; // 0-1
}

interface FormationPlayer {
  playerId: string;
  baseZone: { x: number; z: number };
  supportZones: { x: number; z: number }[];
  recoveryZone: { x: number; z: number };
  pressingTriggerZone: { x: number; z: number };
  currentPosition: Vector3;
  targetPosition: Vector3;
}

interface FormationState {
  type: 'defensive' | 'balanced' | 'attacking';
  compactnessRadius: number;
  width: number;
  pressingIntensity: number;
  momentum: number;
}

interface PlayerPattern {
  shotDirectionHistory: Vector3[];
  passPreferenceHeatmap: Map<string, number>;
  dribbleDirectionBias: Vector3;
  sprintUsageFrequency: number;
  skillMoveUsage: number;
  memoryScore: number;
}

export class TacticalFormations {
  private pitchZones: PitchZone[][] = [];
  private formationPlayers: Map<string, FormationPlayer> = new Map();
  private formationState: FormationState;
  private ballPosition: Vector3 = new Vector3(0, 0, 0);
  private possessionTeam: 'home' | 'away' = 'home';
  private matchTime: number = 0;
  private momentum: number = 0;
  private possessionDuration: number = 0;
  private successfulPassChain: number = 0;
  private territoryControl: number = 0.5;
  
  // Formation definitions
  private readonly FORMATIONS = {
    '4-4-2': {
      defensive: [
        { x: 6, z: 2 },  // GK
        { x: 2, z: 8 },  // LB
        { x: 10, z: 8 }, // RB
        { x: 4, z: 10 }, // CB
        { x: 8, z: 10 }, // CB
        { x: 3, z: 14 }, // LM
        { x: 7, z: 14 }, // CM
        { x: 9, z: 14 }, // CM
        { x: 11, z: 14 }, // RM
        { x: 4, z: 18 }, // ST
        { x: 8, z: 18 }  // ST
      ],
      attacking: [
        { x: 6, z: 2 },  // GK
        { x: 1, z: 12 }, // LB
        { x: 11, z: 12 }, // RB
        { x: 3, z: 14 }, // CB
        { x: 9, z: 14 }, // CB
        { x: 2, z: 16 }, // LM
        { x: 6, z: 16 }, // CM
        { x: 10, z: 16 }, // CM
        { x: 4, z: 20 }, // RM
        { x: 5, z: 22 }, // ST
        { x: 7, z: 22 }  // ST
      ]
    },
    '4-3-3': {
      defensive: [
        { x: 6, z: 2 },  // GK
        { x: 2, z: 8 },  // LB
        { x: 10, z: 8 }, // RB
        { x: 4, z: 10 }, // CB
        { x: 8, z: 10 }, // CB
        { x: 3, z: 14 }, // CM
        { x: 6, z: 14 }, // CM
        { x: 9, z: 14 }, // CM
        { x: 2, z: 18 }, // LW
        { x: 6, z: 20 }, // ST
        { x: 10, z: 18 } // RW
      ],
      attacking: [
        { x: 6, z: 2 },  // GK
        { x: 1, z: 12 }, // LB
        { x: 11, z: 12 }, // RB
        { x: 3, z: 14 }, // CB
        { x: 9, z: 14 }, // CB
        { x: 4, z: 16 }, // CM
        { x: 6, z: 16 }, // CM
        { x: 8, z: 16 }, // CM
        { x: 1, z: 20 }, // LW
        { x: 6, z: 22 }, // ST
        { x: 11, z: 20 } // RW
      ]
    }
  };

  constructor() {
    this.initializePitchZones();
    this.formationState = {
      type: 'balanced',
      compactnessRadius: 30,
      width: 40,
      pressingIntensity: 0.5,
      momentum: 0
    };
  }

  private initializePitchZones(): void {
    // Create 12x8 zone matrix
    for (let x = 0; x < 12; x++) {
      this.pitchZones[x] = [];
      for (let z = 0; z < 8; z++) {
        this.pitchZones[x][z] = {
          x,
          z,
          defensiveDensity: Math.random() * 0.3 + 0.2,
          attackingOpportunity: Math.random() * 0.3 + 0.2,
          transitionSpeed: Math.random() * 0.3 + 0.2
        };
      }
    }
  }

  public setFormation(team: 'home' | 'away', formationType: string, players: PlayerState[]): void {
    const formation = this.FORMATIONS[formationType as keyof typeof this.FORMATIONS];
    if (!formation) return;

    // Clear existing formation players for this team
    this.formationPlayers.forEach((player, id) => {
      const playerState = players.find(p => p.id === id);
      if (playerState && playerState.team === team) {
        this.formationPlayers.delete(id);
      }
    });

    // Assign players to formation positions
    players.filter(p => p.team === team).forEach((player, index) => {
      if (index < formation.defensive.length) {
        const defensivePos = formation.defensive[index];
        const attackingPos = formation.attacking[index];
        
        this.formationPlayers.set(player.id, {
          playerId: player.id,
          baseZone: defensivePos,
          supportZones: this.calculateSupportZones(defensivePos),
          recoveryZone: defensivePos,
          pressingTriggerZone: { x: defensivePos.x + 1, z: defensivePos.z + 2 },
          currentPosition: player.position.clone(),
          targetPosition: this.zoneToWorldPosition(defensivePos)
        });
      }
    });
  }

  private calculateSupportZones(baseZone: { x: number; z: number }): { x: number; z: number }[] {
    const zones: { x: number; z: number }[] = [];
    
    // Add adjacent zones as support zones
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        
        const newX = baseZone.x + dx;
        const newZ = baseZone.z + dz;
        
        if (newX >= 0 && newX < 12 && newZ >= 0 && newZ < 8) {
          zones.push({ x: newX, z: newZ });
        }
      }
    }
    
    return zones;
  }

  private zoneToWorldPosition(zone: { x: number; z: number }): Vector3 {
    // Convert zone coordinates to world position
    const worldX = (zone.x - 6) * 8; // Center pitch at x=0
    const worldZ = (zone.z - 4) * 13; // Center pitch at z=0
    return new Vector3(worldX, 0, worldZ);
  }

  public updateFormation(deltaTime: number, ballPos: Vector3, possession: 'home' | 'away', matchTime: number): void {
    this.ballPosition = ballPos.clone();
    this.possessionTeam = possession;
    this.matchTime = matchTime;
    
    // Update momentum
    this.updateMomentum(deltaTime);
    
    // Update formation state
    this.updateFormationState();
    
    // Calculate formation offset
    const formationOffset = this.calculateFormationOffset();
    
    // Update each player's target position
    this.formationPlayers.forEach(player => {
      this.updatePlayerTargetPosition(player, formationOffset);
    });
  }

  private updateMomentum(deltaTime: number): void {
    if (this.possessionTeam === 'home') {
      this.possessionDuration += deltaTime;
      this.territoryControl = Math.min(1, this.territoryControl + deltaTime * 0.001);
    } else {
      this.possessionDuration = 0;
      this.territoryControl = Math.max(0, this.territoryControl - deltaTime * 0.001);
    }
    
    // Momentum = PossessionDuration × SuccessfulPassChain × TerritoryControl
    this.momentum = (this.possessionDuration * 0.01) * (this.successfulPassChain * 0.2) * this.territoryControl;
  }

  private updateFormationState(): void {
    const momentumThreshold = 0.7;
    const opponentDominance = this.territoryControl < 0.3;
    
    if (this.momentum > momentumThreshold) {
      this.formationState.type = 'attacking';
      this.formationState.compactnessRadius = 25;
      this.formationState.width = 45;
      this.formationState.pressingIntensity = 0.8;
    } else if (opponentDominance) {
      this.formationState.type = 'defensive';
      this.formationState.compactnessRadius = 35;
      this.formationState.width = 35;
      this.formationState.pressingIntensity = 0.3;
    } else {
      this.formationState.type = 'balanced';
      this.formationState.compactnessRadius = 30;
      this.formationState.width = 40;
      this.formationState.pressingIntensity = 0.5;
    }
    
    // High press mode in last 10 minutes while losing
    if (this.matchTime > 80 && this.territoryControl < 0.4) {
      this.formationState.pressingIntensity = 0.9;
    }
  }

  private calculateFormationOffset(): Vector3 {
    // FormationOffset = BallPosition × TacticalAggressionFactor × 0.35
    const tacticalAggressionFactor = this.formationState.type === 'attacking' ? 1.0 : 
                                  this.formationState.type === 'defensive' ? 0.3 : 0.6;
    
    const offset = this.ballPosition.clone().multiplyScalar(tacticalAggressionFactor * 0.35);
    
    // Limit offset to prevent unrealistic shifts
    offset.x = Math.max(-20, Math.min(20, offset.x));
    offset.z = Math.max(-15, Math.min(15, offset.z));
    
    return offset;
  }

  private updatePlayerTargetPosition(player: FormationPlayer, formationOffset: Vector3): void {
    // Get base position from current formation state
    const basePos = this.zoneToWorldPosition(player.baseZone);
    
    // Apply formation offset
    let targetPos = basePos.clone().add(formationOffset);
    
    // Apply width adjustment
    const widthFactor = this.formationState.width / 40;
    targetPos.x *= widthFactor;
    
    // Apply compactness
    const centerPos = new Vector3(0, 0, 0);
    const toCenter = centerPos.clone().sub(targetPos);
    const compactnessFactor = this.formationState.compactnessRadius / 30;
    targetPos.add(toCenter.multiplyScalar(compactnessFactor * 0.1));
    
    // Smooth movement to prevent robotic shifts
    const smoothingFactor = 0.1;
    player.targetPosition.lerp(targetPos, smoothingFactor);
  }

  public getPlayerTargetPosition(playerId: string): Vector3 | null {
    const player = this.formationPlayers.get(playerId);
    return player ? player.targetPosition.clone() : null;
  }

  public shouldPress(playerId: string, ballPos: Vector3): boolean {
    const player = this.formationPlayers.get(playerId);
    if (!player) return false;
    
    const triggerZone = this.zoneToWorldPosition(player.pressingTriggerZone);
    const distanceToTrigger = ballPos.distanceTo(triggerZone);
    
    // Press trigger conditions
    const opponentBackToGoal = ballPos.z > 0;
    const inTriggerZone = distanceToTrigger < 10;
    const pressingIntensity = this.formationState.pressingIntensity;
    
    return (opponentBackToGoal && inTriggerZone && Math.random() < pressingIntensity);
  }

  public getMarkingPriority(defenderId: string, attackerId: string): number {
    // MarkPriority = ThreatLevel × Proximity × TacticalImportance
    const defender = this.formationPlayers.get(defenderId);
    if (!defender) return 0;
    
    const threatLevel = this.calculateThreatLevel(attackerId);
    const proximity = this.calculateProximity(defenderId, attackerId);
    const tacticalImportance = this.calculateTacticalImportance(defenderId);
    
    return threatLevel * proximity * tacticalImportance;
  }

  private calculateThreatLevel(playerId: string): number {
    // Simplified threat level calculation
    // In full implementation, would use player stats and position
    return 0.5 + Math.random() * 0.3;
  }

  private calculateProximity(defenderId: string, attackerId: string): number {
    const defender = this.formationPlayers.get(defenderId);
    const attacker = this.formationPlayers.get(attackerId);
    
    if (!defender || !attacker) return 0;
    
    const distance = defender.currentPosition.distanceTo(attacker.currentPosition);
    return Math.max(0, 1 - distance / 30);
  }

  private calculateTacticalImportance(playerId: string): number {
    const player = this.formationPlayers.get(playerId);
    if (!player) return 0;
    
    // Central players have higher tactical importance
    const centerDistance = Math.abs(player.baseZone.x - 6);
    return Math.max(0.5, 1 - centerDistance / 6);
  }

  public updatePlayerPosition(playerId: string, position: Vector3): void {
    const player = this.formationPlayers.get(playerId);
    if (player) {
      player.currentPosition = position.clone();
    }
  }

  public getFormationState(): FormationState {
    return { ...this.formationState };
  }

  public incrementSuccessfulPassChain(): void {
    this.successfulPassChain++;
  }

  public resetPassChain(): void {
    this.successfulPassChain = 0;
  }

  public dispose(): void {
    this.formationPlayers.clear();
    this.pitchZones = [];
  }
}
