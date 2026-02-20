// Action Types
export type ActionType = 'PASS' | 'SHOT' | 'SKILL' | 'DEFENSE' | 'POSSESSION' | 'MOVEMENT';

export interface MatchAction {
    type: ActionType;
    subtype?: string; // e.g., 'SHORT', 'LONG', 'BACKWARD', 'TACKLE'
    success: boolean;
    timestamp: number;
    context?: {
        underPressure?: boolean;
        xG?: number; // Expected Goals for shots
        location?: { x: number, y: number }; // 0-1 normalized field position
        difficulty?: number; // 0-1
    };
}

export class PerformanceMonitor {
    private actions: MatchAction[] = [];
    private startTime: number;
    private lastShotActionIndex: number | null = null;
    
    // Abuse tracking
    private backPassCount = 0;
    private skillSpamCount = 0;
    private lastSkillTime = 0;
    private lastActionTime = 0;
    private possessionLossCount = 0;

    constructor() {
        this.startTime = Date.now();
        this.lastActionTime = Date.now();
    }

    public recordAction(action: Omit<MatchAction, 'timestamp'>) {
        const fullAction = { ...action, timestamp: Date.now() };
        this.actions.push(fullAction);
        if (fullAction.type === 'SHOT') {
            this.lastShotActionIndex = this.actions.length - 1;
        }
        this.lastActionTime = Date.now();
        this.checkForAbuse(fullAction);
    }

    public markLastShotSuccess(success: boolean) {
        if (this.lastShotActionIndex === null) return;
        const action = this.actions[this.lastShotActionIndex];
        if (action && action.type === 'SHOT') {
            action.success = success;
        }
        this.lastShotActionIndex = null;
    }

    public getLastShotContext() {
        if (this.lastShotActionIndex === null) return null;
        const action = this.actions[this.lastShotActionIndex];
        if (!action || action.type !== 'SHOT') return null;
        return {
            xG: action.context?.xG,
            difficulty: action.context?.difficulty
        };
    }

    private checkForAbuse(action: MatchAction) {
        // Back passing logic
        // Assuming subtype 'BACKWARD' is explicitly flagged by the game engine
        if (action.type === 'PASS' && action.subtype === 'BACKWARD') {
            this.backPassCount++;
        }
        
        // Skill spam logic
        if (action.type === 'SKILL') {
            const now = Date.now();
            if (now - this.lastSkillTime < 2500) { // < 2.5 seconds
                this.skillSpamCount++;
            }
            this.lastSkillTime = now;
        }

        if (action.type === 'POSSESSION' && !action.success) {
            this.possessionLossCount++;
        }
    }

    /**
     * Calculates the Decision-Based Performance Score (0.0 to 1.0)
     * This feeds into the "Core Skill Engine" logic.
     * 
     * Good behavior: Accurate passing, Smart shot selection, Successful defensive reads.
     * Bad behavior: Blind shooting, Panic passing, Skill spamming, Losing possession under no pressure.
     */
    public calculatePerformanceScore(): number {
        if (this.actions.length === 0) return 0.5; // Neutral start

        let decisionScore = 0;
        let meaningfulActions = 0;

        this.actions.forEach(a => {
            if (a.type === 'MOVEMENT') {
                return;
            }
            let value = 0;
            let counted = false;
            switch(a.type) {
                case 'PASS':
                    // Successful pass: +1. Under pressure: +1.5.
                    // Failed pass: -1. Under pressure: -0.5 (forgivable).
                    if (a.success) {
                        value = a.context?.underPressure ? 1.5 : 1.0;
                    } else {
                        value = a.context?.underPressure ? -0.5 : -1.0;
                        if (a.subtype === 'PANIC') value -= 0.5; // Explicit panic
                    }
                    counted = true;
                    break;
                case 'SHOT':
                    // Goal/On Target: +2.0.
                    // Miss but High xG (Smart selection): +0.5.
                    // Miss and Low xG (Blind shooting): -1.5.
                    if (a.success) {
                        value = 2.0;
                    } else {
                        const xG = a.context?.xG || 0;
                        if (xG > 0.3) value = 0.5; // Good try
                        else if (xG < 0.05) value = -1.5; // Wasteful
                        else value = -0.5;
                    }
                    counted = true;
                    break;
                case 'DEFENSE':
                    // Tackle/Interception: +2.0. Missed tackle: -0.5.
                    if (a.success) {
                        value = 2.0;
                    } else {
                        value = -0.5; // Risk failed
                    }
                    counted = true;
                    break;
                case 'SKILL':
                    // Effective skill: +1.5. Failed skill: -1.0.
                    // Spam penalty handled in Fair Play, but individual failure hurts perf too.
                    value = a.success ? 1.5 : -1.0;
                    counted = true;
                    break;
                case 'POSSESSION':
                    // Lost possession.
                    // Under pressure: -0.5. No pressure: -1.5 (Careless).
                    if (!a.success) {
                        value = a.context?.underPressure ? -0.5 : -1.5;
                        counted = true;
                    }
                    break;
            }
            
            // Weight recent actions slightly higher? No, keeping it simple for now.
            if (!counted) return;
            decisionScore += value;
            meaningfulActions++;
        });

        // Normalize. 
        // Expected average per action might be ~0.5.
        // If 20 actions, score ~10 is good.
        // Range: Let's map -20 to +40 to 0.0-1.0.
        // Center at 0.5.
        
        const rawAverage = meaningfulActions > 0 ? decisionScore / meaningfulActions : 0;
        // rawAverage likely between -1.5 and 2.0.
        // Map -1.0 -> 0.2, 0 -> 0.5, 1.0 -> 0.8.
        
        let normalized = (rawAverage + 1.5) / 3.5; // Map -1.5..2.0 to 0..1
        normalized = Math.max(0.1, Math.min(0.95, normalized));

        return normalized;
    }

    /**
     * Calculates Fair Play & Anti-Abuse Score (Multiplier 0.0 to 1.2)
     * 1.0 is standard. <1.0 is penalty. >1.0 is 'Clean Play Bonus'.
     */
    public calculateFairPlayScore(): number {
        let score = 1.0;
        
        // 1. Skill Spam Penalty
        if (this.skillSpamCount > 5) score -= 0.1;
        if (this.skillSpamCount > 10) score -= 0.2; // Heavy penalty
        
        // 2. Excessive Back Passing (Time Wasting)
        if (this.backPassCount > 15) score -= 0.15;
        
        // 3. AFK / Inactivity Check
        const timeSinceLastAction = Date.now() - this.lastActionTime;
        if (timeSinceLastAction > 45000) { // 45s inactivity
            score -= 0.4;
        } else if (timeSinceLastAction > 20000) {
            score -= 0.1;
        }

        // 4. Clean Play Bonus
        // If played a full match (e.g. > 10 actions) with 0 spam, 0 backpass abuse
        const actionCount = this.actions.length;
        if (actionCount > 10 && this.skillSpamCount === 0 && this.backPassCount < 5 && score === 1.0) {
            score += 0.1; // "Clean play bonus"
        }
        
        // "Repeated abuse slowly reduces rank rewards"
        // If score drops below 0.5, it's severe.
        
        return Math.max(0.1, Math.min(1.2, score));
    }

    public reset() {
        this.actions = [];
        this.startTime = Date.now();
        this.lastActionTime = Date.now();
        this.lastShotActionIndex = null;
        this.backPassCount = 0;
        this.skillSpamCount = 0;
        this.possessionLossCount = 0;
    }

    public getReport() {
        return {
            actions: this.actions.length,
            durationMs: Date.now() - this.startTime,
            skillSpam: this.skillSpamCount,
            backPasses: this.backPassCount,
            performance: this.calculatePerformanceScore(),
            fairPlay: this.calculateFairPlayScore()
        };
    }
}

// Singleton instance for the active match
export const activeMatchMonitor = new PerformanceMonitor();
