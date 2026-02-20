// Long-Term Stability Model (6-Month Progression)
// Ensures ecosystem health and progression through phases

export type EconomyPhase = 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'PHASE_4' | 'PHASE_5' | 'PHASE_6';

export interface PhaseConfiguration {
  phase: EconomyPhase;
  resourceAvailability: number; // 0.5 to 1.5
  forgeActivity: number;
  recyclerMultiplier: number;
  skillGapVisibility: number;
  marketVolatility: number;
  cosmetsicPriority: number;
  durationDays: number;
  description: string;
}

export class LongTermStabilityModel {
  private phasesConfig: Record<EconomyPhase, PhaseConfiguration> = {
    PHASE_1: {
      phase: 'PHASE_1',
      resourceAvailability: 0.8, // Tight resources
      forgeActivity: 0.6, // Low forge demand
      recyclerMultiplier: 1.0,
      skillGapVisibility: 0.3, // Hidden skill gaps
      marketVolatility: 0.9, // High volatility
      cosmetsicPriority: 0.3,
      durationDays: 30,
      description: 'Low resources, high experimentation',
    },
    PHASE_2: {
      phase: 'PHASE_2',
      resourceAvailability: 0.95,
      forgeActivity: 0.85,
      recyclerMultiplier: 1.05,
      skillGapVisibility: 0.5,
      marketVolatility: 0.8,
      cosmetsicPriority: 0.4,
      durationDays: 30,
      description: 'Forge rises, recycler increases',
    },
    PHASE_3: {
      phase: 'PHASE_3',
      resourceAvailability: 1.1,
      forgeActivity: 1.1,
      recyclerMultiplier: 1.1,
      skillGapVisibility: 0.7,
      marketVolatility: 0.7,
      cosmetsicPriority: 0.5,
      durationDays: 30,
      description: 'Skill gap visible, market fluctuates',
    },
    PHASE_4: {
      phase: 'PHASE_4',
      resourceAvailability: 1.2,
      forgeActivity: 1.15,
      recyclerMultiplier: 1.08,
      skillGapVisibility: 0.85,
      marketVolatility: 0.5,
      cosmetsicPriority: 0.6,
      durationDays: 30,
      description: 'Meta stabilizes, economy controlled',
    },
    PHASE_5: {
      phase: 'PHASE_5',
      resourceAvailability: 1.15,
      forgeActivity: 1.1,
      recyclerMultiplier: 1.05,
      skillGapVisibility: 0.9,
      marketVolatility: 0.4,
      cosmetsicPriority: 0.8,
      durationDays: 30,
      description: 'Identity cosmetics matter',
    },
    PHASE_6: {
      phase: 'PHASE_6',
      resourceAvailability: 1.1,
      forgeActivity: 1.0,
      recyclerMultiplier: 1.0,
      skillGapVisibility: 0.95,
      marketVolatility: 0.3,
      cosmetsicPriority: 0.9,
      durationDays: 30,
      description: 'Sustainable ecosystem',
    },
  };

  private startDate: number;
  private currentPhase: EconomyPhase = 'PHASE_1';

  constructor(startDate?: number) {
    this.startDate = startDate || Date.now();
    this.updatePhase();
  }

  private updatePhase(): void {
    const elapsedDays = (Date.now() - this.startDate) / (24 * 60 * 60 * 1000);
    let accumulatedDays = 0;

    const phases: EconomyPhase[] = [
      'PHASE_1',
      'PHASE_2',
      'PHASE_3',
      'PHASE_4',
      'PHASE_5',
      'PHASE_6',
    ];

    for (const phase of phases) {
      const config = this.phasesConfig[phase];
      accumulatedDays += config.durationDays;

      if (elapsedDays <= accumulatedDays) {
        this.currentPhase = phase;
        break;
      }
    }
  }

  public getCurrentPhase(): PhaseConfiguration {
    this.updatePhase();
    return this.phasesConfig[this.currentPhase];
  }

  public getPhaseProgress(): number {
    this.updatePhase();
    const config = this.phasesConfig[this.currentPhase];
    const phases: EconomyPhase[] = [
      'PHASE_1',
      'PHASE_2',
      'PHASE_3',
      'PHASE_4',
      'PHASE_5',
      'PHASE_6',
    ];

    let accumulatedDays = 0;
    for (let i = 0; i < phases.indexOf(this.currentPhase); i++) {
      accumulatedDays += this.phasesConfig[phases[i]].durationDays;
    }

    const elapsedInPhase =
      (Date.now() - this.startDate) / (24 * 60 * 60 * 1000) - accumulatedDays;
    return Math.min(elapsedInPhase / config.durationDays, 1.0);
  }

  public estimateCurrencyHealth(): {
    coinsHealth: string;
    diamondsHealth: string;
    overallStability: number;
  } {
    const phase = this.getCurrentPhase();
    let stability = phase.resourceAvailability * 0.5 + (1 - phase.marketVolatility) * 0.5;

    return {
      coinsHealth:
        phase.resourceAvailability > 1.0
          ? 'ABUNDANT'
          : 'CONTROLLED',
      diamondsHealth:
        this.currentPhase === 'PHASE_1' || this.currentPhase === 'PHASE_2'
          ? 'SCARCE'
          : 'BALANCED',
      overallStability: Math.min(stability, 1.0),
    };
  }

  public shouldNoDeadCurrency(): boolean {
    // Ensure no currency becomes dead
    const phase = this.getCurrentPhase();
    return phase.forgeActivity > 0.5 && phase.recyclerMultiplier > 0.8;
  }

  public shouldSystemNotCollapse(): boolean {
    // Periodic check to ensure ecosystem doesn't collapse
    const phase = this.getCurrentPhase();
    return (
      phase.resourceAvailability > 0.5 &&
      phase.forgeActivity > 0.5 &&
      (1 - phase.marketVolatility) > 0.2
    );
  }
}
