/**
 * ANIMATION STATE MACHINE
 * 
 * Manages all player animation states and transitions
 * Ensures smooth animation blending
 */

export type AnimationState =
  | 'idle'
  | 'jog'
  | 'run'
  | 'sprint'
  | 'turn'
  | 'pass'
  | 'shoot'
  | 'tackle'
  | 'slide-tackle'
  | 'fall'
  | 'get-up'
  | 'celebrate'
  | 'gk-dive-left'
  | 'gk-dive-right'
  | 'gk-catch'
  | 'gk-punch'
  | 'control'
  | 'dribble'
  | 'skill-move';

export interface AnimationTransition {
  from: AnimationState;
  to: AnimationState;
  condition: () => boolean;
  duration?: number;
}

export interface AnimationBlendTree {
  state: AnimationState;
  speed: number; // 0-1 animation speed
  direction: number; // -1 to 1 for turn animations
  power: number; // 0-1 for shot/pass strength
}

export class AnimationStateMachine {
  private currentState: AnimationState = 'idle';
  private previousState: AnimationState = 'idle';
  private stateStartTime = 0;
  private blendTree: AnimationBlendTree = {
    state: 'idle',
    speed: 0,
    direction: 0,
    power: 0,
  };

  // Animation duration map
  private readonly ANIMATION_DURATIONS: Record<AnimationState, number> = {
    idle: 2.0,
    jog: 0.8,
    run: 0.6,
    sprint: 0.5,
    turn: 0.4,
    pass: 0.5,
    shoot: 1.2,
    tackle: 0.8,
    'slide-tackle': 0.9,
    fall: 0.6,
    'get-up': 1.0,
    celebrate: 3.0,
    'gk-dive-left': 0.8,
    'gk-dive-right': 0.8,
    'gk-catch': 0.6,
    'gk-punch': 0.5,
    control: 0.4,
    dribble: 0.7,
    'skill-move': 1.0,
  };

  private readonly STATE_TRANSITIONS: Record<AnimationState, AnimationState[]> = {
    idle: ['jog', 'run', 'sprint', 'pass', 'shoot', 'tackle', 'celebrate'],
    jog: ['idle', 'run', 'sprint', 'pass', 'shoot', 'tackle'],
    run: ['idle', 'jog', 'sprint', 'pass', 'shoot', 'tackle', 'slide-tackle'],
    sprint: ['run', 'jog', 'tackle', 'slide-tackle', 'fall'],
    turn: ['idle', 'jog', 'run', 'sprint'],
    pass: ['jog', 'run', 'idle'],
    shoot: ['fall', 'idle', 'celebrate'],
    tackle: ['idle', 'fall'],
    'slide-tackle': ['fall'],
    fall: ['get-up'],
    'get-up': ['idle', 'jog'],
    celebrate: ['idle'],
    'gk-dive-left': ['get-up', 'gk-catch'],
    'gk-dive-right': ['get-up', 'gk-catch'],
    'gk-catch': ['idle'],
    'gk-punch': ['idle'],
    control: ['pass', 'shoot', 'dribble'],
    dribble: ['control', 'pass', 'shoot'],
    'skill-move': ['control', 'pass', 'shoot'],
  };

  constructor() {
    this.stateStartTime = Date.now();
  }

  /**
   * Transition to new animation state
   */
  public transitionTo(newState: AnimationState): boolean {
    // Check if transition is allowed
    const allowedTransitions = this.STATE_TRANSITIONS[this.currentState];
    if (!allowedTransitions.includes(newState)) {
      return false; // Invalid transition
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.stateStartTime = Date.now();

    return true;
  }

  /**
   * Update animation based on player input
   */
  public updateAnimation(
    moveInput: { x: number; y: number },
    isSprinting: boolean,
    isShootingPressed: boolean,
    isBallNear: boolean,
    playerSpeed: number
  ): AnimationState {
    const elapsedTime = (Date.now() - this.stateStartTime) / 1000;
    const duration = this.ANIMATION_DURATIONS[this.currentState];

    // Allow looping animations
    if (elapsedTime > duration && !this.isCriticalState()) {
      // Determine next state based on input
      if (isShootingPressed && isBallNear) {
        this.transitionTo('shoot');
      } else if (moveInput.x === 0 && moveInput.y === 0) {
        this.transitionTo(this.currentState === 'celebrate' ? 'celebrate' : 'idle');
      } else if (isSprinting) {
        this.transitionTo('sprint');
      } else if (Math.abs(moveInput.x) > 0.5 || Math.abs(moveInput.y) > 0.5) {
        this.transitionTo('run');
      } else {
        this.transitionTo('jog');
      }
    }

    // Update blend tree
    this.blendTree = {
      state: this.currentState,
      speed: playerSpeed,
      direction: Math.atan2(moveInput.y, moveInput.x),
      power: isShootingPressed ? Math.min(1, elapsedTime / 0.5) : 0,
    };

    return this.currentState;
  }

  /**
   * Check if current state is critical (shouldn't auto-transition)
   */
  private isCriticalState(): boolean {
    const criticalStates: AnimationState[] = ['shoot', 'tackle', 'fall', 'celebrate', 'gk-dive-left', 'gk-dive-right'];
    return criticalStates.includes(this.currentState);
  }

  /**
   * Get goalkeeper dive animation based on shot direction
   */
  public getGKDiveAnimation(shotDirection: number): AnimationState {
    return shotDirection < -0.3 ? 'gk-dive-left' : shotDirection > 0.3 ? 'gk-dive-right' : 'gk-punch';
  }

  /**
   * Get current blend tree for 3D animation system
   */
  public getBlendTree(): AnimationBlendTree {
    return { ...this.blendTree };
  }

  /**
   * Get current animation state
   */
  public getCurrentState(): AnimationState {
    return this.currentState;
  }

  /**
   * Get animation progress (0-1)
   */
  public getAnimationProgress(): number {
    const elapsed = (Date.now() - this.stateStartTime) / 1000;
    const duration = this.ANIMATION_DURATIONS[this.currentState];
    return Math.min(1, elapsed / duration);
  }

  /**
   * Force instant state change (for server updates)
   */
  public forceStateChange(newState: AnimationState): void {
    this.currentState = newState;
    this.stateStartTime = Date.now();
  }
}

/**
 * Celebraton animation controller
 */
export class CelebrationAnimationController {
  private celebrationState: { active: boolean; type: string; endTime: number } = {
    active: false,
    type: '',
    endTime: 0,
  };

  private celebrationAnimations: Record<string, { duration: number; followUp?: string }> = {
    'slide-knees': { duration: 3 },
    'arms-spread': { duration: 2.5 },
    'backflip': { duration: 3.5 },
    'heart-hands': { duration: 2 },
    'knee-pump': { duration: 1.5 },
    'jump-turn': { duration: 2 },
    'shush': { duration: 2.5 },
    'point-sky': { duration: 2 },
    'chest-pound': { duration: 1.5 },
    'spin-around': { duration: 2 },
    'group-celebration': { duration: 4 },
    'fist-pump': { duration: 1.5 },
    'corner-run': { duration: 3 },
    'pop-off-dance': { duration: 3 },
    'knee-tap': { duration: 1.5 },
    'salute': { duration: 2 },
    'shoulder-shimmy': { duration: 2.5 },
    'slide-flip': { duration: 3 },
    'slow-wink': { duration: 2 },
    'jumping-jacks': { duration: 2 },
    'breakdance': { duration: 4 },
    'statue-pose': { duration: 2.5 },
    'taunt-shrug': { duration: 1.5 },
    'wave-crowd': { duration: 2 },
    'flex': { duration: 2 },
  };

  public startCelebration(celebrationType: string): void {
    const duration = this.celebrationAnimations[celebrationType]?.duration || 2.5;
    this.celebrationState = {
      active: true,
      type: celebrationType,
      endTime: Date.now() + duration * 1000,
    };
  }

  public updateCelebration(): boolean {
    if (!this.celebrationState.active) return false;

    if (Date.now() > this.celebrationState.endTime) {
      this.celebrationState.active = false;
      return false;
    }

    return true;
  }

  public getCelebrationProgress(): number {
    if (!this.celebrationState.active) return 0;

    const duration = (this.celebrationState.endTime - Date.now()) / 1000;
    const totalDuration = this.celebrationAnimations[this.celebrationState.type]?.duration || 2.5;

    return Math.max(0, 1 - duration / totalDuration);
  }

  public isCelebrating(): boolean {
    return this.celebrationState.active;
  }

  public getCurrentCelebration(): string {
    return this.celebrationState.type;
  }
}

/**
 * Goalkeeper special animations
 */
export class GoalkeeperAnimationController {
  private reactionTime = 0.3; // milliseconds to react

  /**
   * Calculate GK reaction animation based on shot trajectory
   */
  public calculateDiveReaction(shotVelocity: { x: number; y: number; z: number }): {
    animation: AnimationState;
    reactionDelay: number;
  } {
    // Faster to left/right, slower to center or high
    const horizontalComponent = Math.abs(shotVelocity.x);
    const verticalComponent = Math.abs(shotVelocity.y);

    let reactionDelay = this.reactionTime;

    // Reduce reaction time for easily reachable shots
    if (horizontalComponent > 2) {
      reactionDelay *= 1.2; // Takes longer to reach far side
    }

    if (verticalComponent > 1.5) {
      reactionDelay *= 1.1; // Takes longer to reach high balls
    }

    const animation =
      shotVelocity.x < -0.5 ? 'gk-dive-left' : shotVelocity.x > 0.5 ? 'gk-dive-right' : 'gk-punch';

    return { animation, reactionDelay };
  }
}
