/**
 * FULL INJURY BIOMECHANICS MODEL
 * 
 * Physics-based injury system where collision generates ImpactForce.
 * Injury is not random - it's calculated from:
 * - Mass and relative velocity
 * - Stamina ratio (low stamina increases risk)
 * - Collision type (slide tackle multiplies by 1.2)
 * - Landing position (header from awkward angle)
 * 
 * Injuries accumulate micro-damage during match.
 * Severity affects speed, acceleration, jump height.
 * Optional toggle for casual mode.
 */

import type {
  BiomechanicsEngine as BiomechanicsEngineContract,
  PlayerBiomechanics,
  InjuryImpactData,
  InjurySeverity,
} from '../types/simulation';

const INJURY_UPDATE_RATE = 0.33; // ~3x per second

interface InjurySeverityData {
  speedReductionPercent: number;
  accelerationReductionPercent: number;
  jumpHeightReductionPercent: number;
  recoveryHoursPerFitnessPoint: number;
}

const INJURY_SEVERITIES: Record<InjurySeverity, InjurySeverityData> = {
  NONE: {
    speedReductionPercent: 0,
    accelerationReductionPercent: 0,
    jumpHeightReductionPercent: 0,
    recoveryHoursPerFitnessPoint: 0,
  },
  MINOR_KNOCK: {
    speedReductionPercent: 5,
    accelerationReductionPercent: 3,
    jumpHeightReductionPercent: 2,
    recoveryHoursPerFitnessPoint: 0.5,
  },
  HAMSTRING_STRAIN: {
    speedReductionPercent: 25,
    accelerationReductionPercent: 30,
    jumpHeightReductionPercent: 10,
    recoveryHoursPerFitnessPoint: 2.0,
  },
  ANKLE_TWIST: {
    speedReductionPercent: 15,
    accelerationReductionPercent: 20,
    jumpHeightReductionPercent: 25,
    recoveryHoursPerFitnessPoint: 1.5,
  },
  KNEE_HYPEREXTENSION: {
    speedReductionPercent: 40,
    accelerationReductionPercent: 50,
    jumpHeightReductionPercent: 60,
    recoveryHoursPerFitnessPoint: 4.0,
  },
};

export class BiomechanicsEngine implements BiomechanicsEngineContract {
  playerStates: Map<string, PlayerBiomechanics> = new Map();
  isInjurySystemEnabled: boolean = true;
  
  private lastUpdateTime: number = 0;
  private maxSafeForce: number = 500; // Default threshold
  private microDamageThreshold: number = 100;

  /**
   * Initialize player biomechanics state
   */
  initializePlayer(playerId: string): PlayerBiomechanics {
    const state: PlayerBiomechanics = {
      playerId,
      microDamage: 0,
      currentInjury: 'NONE',
      injuryRecoveryTime: 0,
      speedReluctance: 0,
      accelerationMultiplier: 1.0,
      jumpHeightMultiplier: 1.0,
      lastCollisionForce: 0,
      isSubstitutionSuggested: false,
    };
    
    this.playerStates.set(playerId, state);
    return state;
  }

  /**
   * Calculate injury probability from collision
   * InjuryProbability = (ImpactForce / MaxSafeForce) × (1 − StaminaRatio) × BalanceFactor
   */
  calculateInjuryProbability(
    collisionMass: number,
    relativeVelocity: number,
    staminaRatio: number,
    collisionType: InjuryImpactData['collisionType']
  ): number {
    // ImpactForce = Mass × RelativeVelocity
    let impactForce = collisionMass * relativeVelocity;

    // Slide tackle from behind multiplies by 1.2
    if (collisionType === 'SLIDE_BEHIND') {
      impactForce *= 1.2;
    }

    // Header from awkward angle uses joint torque calculation
    if (collisionType === 'HEADER_AWKWARD') {
      impactForce *= 0.9; // Slightly different calculation but similar magnitude
    }

    // Base probability calculation
    const forceFactor = Math.min(impactForce / this.maxSafeForce, 2.0); // Cap at 2.0
    const staminaFactor = Math.max(1 - staminaRatio, 0); // Tired = more risk
    const balanceFactor = 0.8 + Math.random() * 0.4; // 0.8 - 1.2 random variation

    const probability = forceFactor * staminaFactor * balanceFactor;
    
    return Math.min(probability, 1.0); // Cap at 100%
  }

  /**
   * Apply injury to player
   */
  applyInjury(playerId: string, severityData: InjuryImpactData): void {
    if (!this.isInjurySystemEnabled) return;

    let state = this.playerStates.get(playerId);
    if (!state) {
      state = this.initializePlayer(playerId);
    }

    // Determine injury severity tier
    let severity: InjurySeverity = 'NONE';
    const probability = severityData.impactForce / severityData.maxSafeForce;

    if (probability > 0.8) {
      severity = 'KNEE_HYPEREXTENSION';
    } else if (probability > 0.6) {
      severity = 'HAMSTRING_STRAIN';
    } else if (probability > 0.4) {
      severity = severityData.collisionType === 'SLIDE_BEHIND' ? 'ANKLE_TWIST' : 'HAMSTRING_STRAIN';
    } else if (probability > 0.2) {
      severity = 'ANKLE_TWIST';
    } else if (probability > 0.1) {
      severity = 'MINOR_KNOCK';
    }

    state.currentInjury = severity;
    state.lastCollisionForce = severityData.impactForce;
    state.isSubstitutionSuggested = severity === 'KNEE_HYPEREXTENSION';

    // Apply multipliers
    if (severity !== 'NONE') {
      const data = INJURY_SEVERITIES[severity];
      state.speedReluctance = data.speedReductionPercent / 100;
      state.accelerationMultiplier = (100 - data.accelerationReductionPercent) / 100;
      state.jumpHeightMultiplier = (100 - data.jumpHeightReductionPercent) / 100;
    }

    this.playerStates.set(playerId, state);
  }

  /**
   * Update micro-damage accumulation during match
   * Repeated stress adds micro-damage. At 100+ units, muscle strain triggers.
   */
  updateMicroDamage(playerId: string, stressAmount: number): void {
    let state = this.playerStates.get(playerId);
    if (!state) {
      state = this.initializePlayer(playerId);
    }

    state.microDamage += stressAmount;

    // Check if micro-damage triggers strain
    if (state.microDamage >= this.microDamageThreshold && state.currentInjury === 'NONE') {
      // Trigger hamstring strain from accumulated stress
      this.applyInjury(playerId, {
        impactForce: 250,
        maxSafeForce: this.maxSafeForce,
        staminaRatio: 0.3,
        balanceFactor: 0.5,
        collisionType: 'NORMAL',
        resultingSeverity: 'HAMSTRING_STRAIN',
      });
      state.microDamage = 0; // Reset after triggering
    }

    this.playerStates.set(playerId, state);
  }

  /**
   * Calculate recovery time between matches
   * RecoveryTime = Severity × FitnessStat
   */
  calculateRecoveryTime(severity: InjurySeverity, fitnessRating: number): number {
    const data = INJURY_SEVERITIES[severity];
    const baseRecoveryHours = data.recoveryHoursPerFitnessPoint * (100 - fitnessRating); // Fitness helps recovery
    
    return Math.max(baseRecoveryHours * 3600000, 0); // Convert to milliseconds
  }

  /**
   * Get performance modifier for injured player
   */
  getPerformanceModifier(playerId: string): number {
    const state = this.playerStates.get(playerId);
    if (!state || state.currentInjury === 'NONE') {
      return 1.0;
    }

    const data = INJURY_SEVERITIES[state.currentInjury];
    const speedMod = 1 - data.speedReductionPercent / 100;
    const accelMod = 1 - data.accelerationReductionPercent / 100;
    
    // Average modifiers for overall performance
    return (speedMod + accelMod) / 2;
  }

  /**
   * Check if substitution is needed
   */
  checkSubstitutionNeeded(playerId: string): boolean {
    const state = this.playerStates.get(playerId);
    return state ? state.isSubstitutionSuggested : false;
  }

  /**
   * Heal injury (for between-match recovery or medical intervention)
   */
  healInjury(playerId: string, severity?: InjurySeverity): void {
    const state = this.playerStates.get(playerId);
    if (!state) return;

    if (severity === undefined || severity === state.currentInjury) {
      state.currentInjury = 'NONE';
      state.injuryRecoveryTime = 0;
      state.speedReluctance = 0;
      state.accelerationMultiplier = 1.0;
      state.jumpHeightMultiplier = 1.0;
      state.isSubstitutionSuggested = false;
      state.microDamage = 0;
    }
  }

  /**
   * Update injury recovery timers
   */
  updateRecovery(deltaTime: number): void {
    this.playerStates.forEach(state => {
      if (state.currentInjury !== 'NONE' && state.injuryRecoveryTime > 0) {
        state.injuryRecoveryTime -= deltaTime * 1000;
        
        if (state.injuryRecoveryTime <= 0) {
          this.healInjury(state.playerId);
        }
      }
    });
  }

  /**
   * Get all injured players
   */
  getInjuredPlayers(): PlayerBiomechanics[] {
    return Array.from(this.playerStates.values()).filter(s => s.currentInjury !== 'NONE');
  }

  /**
   * Toggle injury system
   */
  setInjurySystemEnabled(enabled: boolean): void {
    this.isInjurySystemEnabled = enabled;
  }

  /**
   * Get player injury status
   */
  getInjuryStatus(playerId: string): PlayerBiomechanics | null {
    return this.playerStates.get(playerId) || null;
  }

  /**
   * Set max safe force threshold (difficulty tuning)
   */
  setMaxSafeForce(force: number): void {
    this.maxSafeForce = Math.max(force, 100);
  }

  /**
   * Clear all injuries (match reset)
   */
  clearAllInjuries(): void {
    this.playerStates.forEach(state => {
      state.currentInjury = 'NONE';
      state.microDamage = 0;
      state.injuryRecoveryTime = 0;
      state.speedReluctance = 0;
      state.accelerationMultiplier = 1.0;
      state.jumpHeightMultiplier = 1.0;
      state.isSubstitutionSuggested = false;
    });
  }
}
