/**
 * MATCH TIME MANAGEMENT SYSTEM
 * Centralized authoritative time management
 * ⏱️ 6-minute matches scale: 1 real second = 10 game seconds
 */

export interface TimeState {
  matchTime: number; // in seconds
  elapsedRealTime: number;
  isRunning: boolean;
  isPaused: boolean;
  phase: 'first-half' | 'half-time' | 'second-half' | 'extra-time' | 'penalty';
  phaseTime: number;
  stoppage: number; // Added time
}

export class MatchTimeManager {
  private timeState: TimeState;
  private timeScale = 10; // 1 real second = 10 game seconds (for 6 min matches)
  private tickTimer: NodeJS.Timeout | null = null;
  private listeners: ((state: TimeState) => void)[] = [];

  // Time thresholds
  private readonly HALF_TIME_DURATION = 45 * 60 * this.timeScale;
  private readonly EXTRA_TIME_DURATION = 15 * 60 * this.timeScale; // 15 min per half
  private readonly FULL_TIME_THRESHOLD = 90 * 60 * this.timeScale;

  constructor() {
    this.timeState = {
      matchTime: 0,
      elapsedRealTime: 0,
      isRunning: false,
      isPaused: false,
      phase: 'first-half',
      phaseTime: 0,
      stoppage: 0,
    };
  }

  /**
   * Start match timer
   */
  public startTimer(): void {
    if (this.timeState.isRunning) return;

    this.timeState.isRunning = true;
    const startTime = Date.now();
    let lastTickTime = startTime;

    this.tickTimer = setInterval(() => {
      if (!this.timeState.isRunning || this.timeState.isPaused) return;

      const now = Date.now();
      const realDeltaTime = (now - lastTickTime) / 1000; // seconds
      lastTickTime = now;

      // Apply time scale
      const scaledDeltaTime = realDeltaTime * this.timeScale;

      this.timeState.matchTime += scaledDeltaTime;
      this.timeState.elapsedRealTime += realDeltaTime;
      this.timeState.phaseTime += scaledDeltaTime;

      // Check for state transitions
      this._checkPhaseTransitions();

      // Notify listeners
      this._notifyListeners();
    }, 16); // ~60 FPS
  }

  /**
   * Stop timer
   */
  public stopTimer(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.timeState.isRunning = false;
  }

  /**
   * Pause timer
   */
  public pauseTimer(): void {
    this.timeState.isPaused = true;
  }

  /**
   * Resume timer
   */
  public resumeTimer(): void {
    this.timeState.isPaused = false;
  }

  /**
   * Check phase transitions (half-time, full-time, etc)
   */
  private _checkPhaseTransitions(): void {
    switch (this.timeState.phase) {
      case 'first-half':
        if (this.timeState.matchTime >= this.HALF_TIME_DURATION) {
          this.timeState.phase = 'half-time';
          this.pauseTimer();
          this._notifyListeners();
        }
        break;

      case 'second-half':
        if (this.timeState.matchTime >= this.FULL_TIME_THRESHOLD) {
          this.timeState.phase = 'penalty'; // Or full-time
          this.pauseTimer();
          this._notifyListeners();
        }
        break;

      case 'extra-time':
        if (this.timeState.phaseTime >= this.EXTRA_TIME_DURATION * 2) {
          this.timeState.phase = 'penalty';
          this.pauseTimer();
          this._notifyListeners();
        }
        break;
    }
  }

  /**
   * Transition to next half
   */
  public proceedToSecondHalf(): void {
    this.timeState.phase = 'second-half';
    this.timeState.phaseTime = 0;
    this.startTimer();
  }

  /**
   * Transition to extra time
   */
  public proceedToExtraTime(): void {
    this.timeState.phase = 'extra-time';
    this.timeState.phaseTime = 0;
    this.startTimer();
  }

  /**
   * Transition to penalty shootout
   */
  public proceedToPenalties(): void {
    this.timeState.phase = 'penalty';
    this.stopTimer();
  }

  /**
   * Format time as MM:SS
   */
  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /**
   * Get current time state
   */
  public getTimeState(): TimeState {
    return { ...this.timeState };
  }

  /**
   * Get formatted match time
   */
  public getFormattedTime(): string {
    return this.formatTime(this.timeState.matchTime);
  }

  /**
   * Get minutes for display
   */
  public getDisplayMinutes(): number {
    return Math.floor(this.timeState.matchTime / 60);
  }

  /**
   * Subscribe to time changes
   */
  public subscribe(listener: (state: TimeState) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private _notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.timeState));
  }

  /**
   * Set time scale (for testing or different match lengths)
   */
  public setTimeScale(scale: number): void {
    this.timeScale = scale;
  }

  /**
   * Add stoppage time
   */
  public addStoppageTime(seconds: number): void {
    this.timeState.stoppage += seconds;
  }

  /**
   * Get total match duration including stoppage
   */
  public getTotalMatchTime(): number {
    return this.timeState.matchTime + this.timeState.stoppage;
  }

  /**
   * Is match finished?
   */
  public isMatchFinished(): boolean {
    return this.timeState.phase === 'penalty' && !this.timeState.isRunning;
  }
}

/**
 * Match phase analyzer
 */
export class MatchPhaseAnalyzer {
  /**
   * Get match intensity based on time
   */
  static getMatchIntensity(timeState: TimeState): number {
    // Intensity increases as match progresses
    const baseIntensity = Math.min(1, timeState.matchTime / 1800); // 30 minutes to full intensity

    // Extra intensity near end of half
    const timeIntoHalf = timeState.phaseTime;
    const halfDuration = 2700; // 45 minutes scaled
    const timeToHalfEnd = Math.max(0, halfDuration - timeIntoHalf);

    if (timeToHalfEnd < 300) {
      // Last 5 minutes
      return Math.min(1, baseIntensity + (300 - timeToHalfEnd) / 300);
    }

    return baseIntensity;
  }

  /**
   * Should add stoppage time?
   */
  static shouldAddStoppageTime(events: number, injuries: number): number {
    // Roughly 30 seconds per goal or injury
    return (events + injuries * 2) * 30;
  }

  /**
   * Get match difficulty multiplier
   */
  static getDifficultyMultiplier(phase: string): number {
    switch (phase) {
      case 'first-half':
        return 0.8;
      case 'second-half':
        return 1.0;
      case 'extra-time':
        return 1.2;
      case 'penalty':
        return 1.5;
      default:
        return 1.0;
    }
  }
}
