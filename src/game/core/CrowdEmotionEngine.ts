// Advanced Crowd Emotional Model
// Implements dynamic emotional simulation for stadium crowd

export interface CrowdState {
  baseLoyalty: number;
  matchImportance: number;
  homeAdvantage: number;
  currentEmotion: number;
  tensionLevel: number;
  expectationLevel: number;
}

export interface CrowdEvent {
  eventImpact: number;
  matchImportance: number;
  timeFactor: number;
  rivalryFactor: number;
}

export class CrowdEmotionEngine {
  state: CrowdState;
  baseVolume: number = 1.0;

  constructor(initial: Partial<CrowdState>) {
    this.state = {
      baseLoyalty: initial.baseLoyalty ?? 1,
      matchImportance: initial.matchImportance ?? 1,
      homeAdvantage: initial.homeAdvantage ?? 1,
      currentEmotion: initial.currentEmotion ?? 0,
      tensionLevel: initial.tensionLevel ?? 0,
      expectationLevel: initial.expectationLevel ?? 0,
    };
  }

  applyEvent(event: CrowdEvent) {
    const delta = event.eventImpact * event.matchImportance * event.timeFactor * event.rivalryFactor;
    this.state.currentEmotion += delta;
  }

  updateTension(scoreDifference: number, matchTime: number, isKnockout: boolean) {
    const scoreDiffRatio = Math.min(Math.abs(scoreDifference) / 5, 1);
    const matchTimeRatio = Math.min(matchTime / 90, 1);
    let tension = (1 - scoreDiffRatio) * matchTimeRatio;
    if (scoreDifference <= 1 && matchTime > 75) tension += 0.2;
    if (isKnockout) tension += 0.3;
    this.state.tensionLevel = tension;
  }

  decayEmotion() {
    this.state.currentEmotion *= 0.92;
  }

  getCrowdVolume() {
    return this.baseVolume * (this.state.currentEmotion + this.state.tensionLevel);
  }

  // For low-end devices: texture swap
  getAnimationType(isLowEnd: boolean) {
    return isLowEnd ? 'texture-swap' : 'dynamic-wave';
  }

  // For high-end: wave, camera shake, flags, chants
  triggerChant(eventType: string, playerId?: string) {
    // Implement chant triggers based on eventType
    // e.g., goal, penalty save, etc.
  }
}
