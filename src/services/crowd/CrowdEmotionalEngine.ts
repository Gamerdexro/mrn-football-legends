export type CrowdEventType =
  | 'GOAL'
  | 'SHOT_ON_TARGET'
  | 'MISSED_OPEN_GOAL'
  | 'RED_CARD_FOR_HOME'
  | 'RED_CARD_FOR_AWAY'
  | 'LATE_COMEBACK'
  | 'PENALTY_SAVE_HOME_GK'
  | 'PENALTY_SAVE_AWAY_GK';

export interface CrowdContext {
  baseLoyalty: number;
  matchImportance: number;
  homeAdvantage: number;
  expectationLevel: number;
  rivalryFactor: number;
  knockoutStage: boolean;
  totalMatchMinutes: number;
}

export interface CrowdStateSnapshot {
  baseLoyalty: number;
  matchImportance: number;
  homeAdvantage: number;
  currentEmotion: number;
  tensionLevel: number;
  expectationLevel: number;
  crowdVolume: number;
  chantTrigger: 'NONE' | 'PERSONAL_CHANT' | 'KEEPER_SPECIAL_ROAR';
}

export interface CrowdRenderProfile {
  mode: 'LOW' | 'HIGH';
  waveMotion: number;
  cameraShakeIntensity: number;
  dynamicFlags: number;
  sectionReactionVariance: number;
}

const EVENT_IMPACT: Record<CrowdEventType, number> = {
  GOAL: 50,
  SHOT_ON_TARGET: 20,
  MISSED_OPEN_GOAL: -25,
  RED_CARD_FOR_HOME: -40,
  RED_CARD_FOR_AWAY: 40,
  LATE_COMEBACK: 70,
  PENALTY_SAVE_HOME_GK: 35,
  PENALTY_SAVE_AWAY_GK: -35
};

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const clampSigned = (v: number, m: number): number => Math.max(-m, Math.min(m, v));

export class CrowdEmotionalEngine {
  private readonly baseVolume = 0.45;
  private readonly emotionDecayFactor = 0.92;
  private readonly scoreByPlayer = new Map<string, number>();
  private state: CrowdStateSnapshot;
  private context: CrowdContext;

  constructor() {
    this.context = {
      baseLoyalty: 0.7,
      matchImportance: 0.6,
      homeAdvantage: 0.55,
      expectationLevel: 0.5,
      rivalryFactor: 1,
      knockoutStage: false,
      totalMatchMinutes: 90
    };
    this.state = {
      baseLoyalty: this.context.baseLoyalty,
      matchImportance: this.context.matchImportance,
      homeAdvantage: this.context.homeAdvantage,
      currentEmotion: 0.5,
      tensionLevel: 0.2,
      expectationLevel: this.context.expectationLevel,
      crowdVolume: 0.4,
      chantTrigger: 'NONE'
    };
    this.recomputeVolume();
  }

  configureContext(partial: Partial<CrowdContext>): CrowdStateSnapshot {
    this.context = { ...this.context, ...partial };
    this.state.baseLoyalty = clamp01(this.context.baseLoyalty);
    this.state.matchImportance = clamp01(this.context.matchImportance);
    this.state.homeAdvantage = clamp01(this.context.homeAdvantage);
    this.state.expectationLevel = clamp01(this.context.expectationLevel);
    this.recomputeVolume();
    return this.snapshot();
  }

  applyEvent(params: {
    type: CrowdEventType;
    minute: number;
    scoreDifference: number;
    scoringPlayerId?: string;
    isHomeEvent?: boolean;
  }): CrowdStateSnapshot {
    const timeFactor = this.timeFactor(params.minute);
    const rivalryFactor = clamp01(this.context.rivalryFactor);
    const eventImpact = EVENT_IMPACT[params.type] ?? 0;
    const emotionalDelta = eventImpact * this.state.matchImportance * timeFactor * rivalryFactor;
    const signedDelta = emotionalDelta / 140;
    const direction = params.isHomeEvent === false ? -1 : 1;
    this.state.currentEmotion = clamp01(this.state.currentEmotion + signedDelta * direction);
    this.state.tensionLevel = this.computeTension(params.scoreDifference, params.minute);
    this.state.chantTrigger = this.computeChantTrigger(params.type, params.scoringPlayerId);
    this.recomputeVolume();
    return this.snapshot();
  }

  tick(scoreDifference: number, minute: number): CrowdStateSnapshot {
    this.state.currentEmotion = clamp01(this.state.currentEmotion * this.emotionDecayFactor);
    this.state.tensionLevel = this.computeTension(scoreDifference, minute);
    this.state.chantTrigger = 'NONE';
    this.recomputeVolume();
    return this.snapshot();
  }

  getRenderProfile(isLowEndDevice: boolean): CrowdRenderProfile {
    if (isLowEndDevice) {
      return {
        mode: 'LOW',
        waveMotion: 0,
        cameraShakeIntensity: 0,
        dynamicFlags: 0,
        sectionReactionVariance: 0
      };
    }

    const emotion = this.state.currentEmotion;
    const tension = this.state.tensionLevel;
    const energy = clamp01((emotion + tension) * 0.5);
    return {
      mode: 'HIGH',
      waveMotion: 0.2 + energy * 0.8,
      cameraShakeIntensity: 0.05 + tension * 0.35,
      dynamicFlags: 0.2 + emotion * 0.8,
      sectionReactionVariance: 0.2 + tension * 0.6
    };
  }

  snapshot(): CrowdStateSnapshot {
    return { ...this.state };
  }

  private computeTension(scoreDifference: number, minute: number): number {
    const absoluteGap = Math.abs(scoreDifference);
    const scoreDifferenceRatio = clamp01(absoluteGap / 4);
    const matchTimeRatio = clamp01(minute / this.context.totalMatchMinutes);
    const base = (1 - scoreDifferenceRatio) * matchTimeRatio;
    const closeGameBonus = absoluteGap <= 1 ? 0.12 : 0;
    const lateBonus = minute > 75 ? 0.1 : 0;
    const knockoutBonus = this.context.knockoutStage ? 0.12 : 0;
    return clamp01(base + closeGameBonus + lateBonus + knockoutBonus);
  }

  private recomputeVolume(): void {
    const emotionAndTension = clampSigned(this.state.currentEmotion + this.state.tensionLevel, 2);
    const loyaltyFactor = 0.7 + this.state.baseLoyalty * 0.3;
    const homeFactor = 0.85 + this.state.homeAdvantage * 0.3;
    this.state.crowdVolume = clamp01(this.baseVolume * emotionAndTension * loyaltyFactor * homeFactor);
  }

  private timeFactor(minute: number): number {
    const ratio = clamp01(minute / this.context.totalMatchMinutes);
    return 0.6 + ratio * 0.5;
  }

  private computeChantTrigger(type: CrowdEventType, scoringPlayerId?: string): CrowdStateSnapshot['chantTrigger'] {
    if (type === 'PENALTY_SAVE_HOME_GK') {
      return 'KEEPER_SPECIAL_ROAR';
    }
    if (type === 'GOAL' && scoringPlayerId) {
      const next = (this.scoreByPlayer.get(scoringPlayerId) ?? 0) + 1;
      this.scoreByPlayer.set(scoringPlayerId, next);
      if (next >= 2) {
        return 'PERSONAL_CHANT';
      }
    }
    return 'NONE';
  }
}
