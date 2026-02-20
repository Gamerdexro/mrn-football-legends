import { Vector3 } from 'three';
import { PlayerState, MatchState } from '../types/MatchEngineTypes';

interface MatchPacket {
  playerId: string;
  timestamp: number;
  physicsSeed: string;
  inputTimestamps: number[];
  playerPosition: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  actions: GameAction[];
  checksum: string;
}

interface GameAction {
  type: string;
  timestamp: number;
  data: any;
  frameDelta: number;
}

interface BehavioralProfile {
  playerId: string;
  inputRegularityScore: number;
  reactionTimeVariance: number;
  actionFrequency: Map<string, number>;
  suspiciousPatterns: string[];
  trustScore: number;
  lastUpdated: Date;
}

interface AnomalyDetection {
  speedHackProbability: number;
  teleportDetection: number;
  impossibleActionScore: number;
  economyAnomalyScore: number;
  replayTamperingScore: number;
  overallRiskScore: number;
}

interface SecurityLog {
  playerId: string;
  timestamp: number;
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  action: 'monitored' | 'restricted' | 'shadow_adjusted' | 'banned';
}

export class AntiCheatSystem {
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private securityLogs: Map<string, SecurityLog[]> = new Map();
  private matchPackets: Map<string, MatchPacket[]> = new Map();
  private restrictedPlayers: Set<string> = new Set();
  private shadowAdjustments: Map<string, { factor: number; expires: Date }> = new Map();
  
  // Detection thresholds
  private readonly MAX_VELOCITY = 12; // m/s - realistic max speed
  private readonly MAX_ACCELERATION = 8; // m/s² - realistic max acceleration
  private readonly MIN_FRAME_DELTA = 8; // ms - minimum frame time (120 FPS)
  private readonly MAX_FRAME_DELTA = 50; // ms - maximum frame time (20 FPS)
  private readonly INPUT_REGULARITY_THRESHOLD = 0.95; // Too regular inputs
  private readonly ECONOMY_ANOMALY_THRESHOLD = 3; // 3x normal reward rate
  private readonly TRUST_DECAY_RATE = 0.99;

  constructor() {
    this.initializeDetection();
  }

  private initializeDetection(): void {
    // Initialize anti-cheat detection systems
    this.setupBehavioralAnalysis();
    this.setupDataIntegrityValidation();
    this.setupAnomalyDetection();
  }

  private setupBehavioralAnalysis(): void {
    // Behavioral analysis setup
  }

  private setupDataIntegrityValidation(): void {
    // Data integrity validation setup
  }

  private setupAnomalyDetection(): void {
    // Anomaly detection setup
  }

  public processMatchPacket(packet: MatchPacket): AnomalyDetection {
    // Store packet for analysis
    if (!this.matchPackets.has(packet.playerId)) {
      this.matchPackets.set(packet.playerId, []);
    }
    
    const packets = this.matchPackets.get(packet.playerId)!;
    packets.push(packet);
    
    // Keep only last 1000 packets
    if (packets.length > 1000) {
      packets.shift();
    }

    // Perform multi-layer analysis
    const anomalies: AnomalyDetection = {
      speedHackProbability: this.detectSpeedHack(packet, packets),
      teleportDetection: this.detectTeleportation(packet, packets),
      impossibleActionScore: this.detectImpossibleActions(packet),
      economyAnomalyScore: this.detectEconomyAnomalies(packet.playerId),
      replayTamperingScore: this.detectReplayTampering(packet),
      overallRiskScore: 0
    };

    // Calculate overall risk score
    anomalies.overallRiskScore = this.calculateOverallRisk(anomalies);

    // Update behavioral profile
    this.updateBehavioralProfile(packet, anomalies);

    // Take appropriate action based on risk level
    this.handleAnomalies(packet.playerId, anomalies);

    return anomalies;
  }

  private detectSpeedHack(packet: MatchPacket, history: MatchPacket[]): number {
    if (history.length < 2) return 0;

    const previousPacket = history[history.length - 2];
    const deltaTime = (packet.timestamp - previousPacket.timestamp) / 1000; // seconds
    
    if (deltaTime <= 0) return 1; // Invalid time

    // Calculate velocity from position change
    const positionDelta = packet.playerPosition.clone().sub(previousPacket.playerPosition);
    const calculatedVelocity = positionDelta.length() / deltaTime;

    // Check for impossible velocities
    if (calculatedVelocity > this.MAX_VELOCITY) {
      return Math.min(1, (calculatedVelocity - this.MAX_VELOCITY) / this.MAX_VELOCITY);
    }

    // Check frame delta consistency
    const frameDeltas = packet.inputTimestamps.map((timestamp, index) => {
      if (index === 0) return 0;
      return timestamp - packet.inputTimestamps[index - 1];
    });

    const avgFrameDelta = frameDeltas.reduce((sum, delta) => sum + delta, 0) / frameDeltas.length;
    
    if (avgFrameDelta < this.MIN_FRAME_DELTA) {
      return Math.min(1, (this.MIN_FRAME_DELTA - avgFrameDelta) / this.MIN_FRAME_DELTA);
    }

    return 0;
  }

  private detectTeleportation(packet: MatchPacket, history: MatchPacket[]): number {
    if (history.length < 2) return 0;

    const previousPacket = history[history.length - 2];
    const deltaTime = (packet.timestamp - previousPacket.timestamp) / 1000;
    
    if (deltaTime <= 0) return 0;

    // Calculate maximum possible distance in given time
    const maxPossibleDistance = this.MAX_VELOCITY * deltaTime;
    const actualDistance = packet.playerPosition.distanceTo(previousPacket.playerPosition);

    if (actualDistance > maxPossibleDistance * 1.5) { // 50% tolerance
      return Math.min(1, (actualDistance - maxPossibleDistance) / maxPossibleDistance);
    }

    return 0;
  }

  private detectImpossibleActions(packet: MatchPacket): number {
    let score = 0;

    for (const action of packet.actions) {
      // Check for impossible action timing
      if (action.frameDelta < this.MIN_FRAME_DELTA) {
        score += 0.2;
      }

      // Check for action frequency anomalies
      if (action.type === 'shot' && this.isShotFrequencyAnomalous(packet.playerId, action.timestamp)) {
        score += 0.3;
      }

      // Check for impossible physics interactions
      if (action.type === 'tackle' && this.isTackleImpossible(action.data)) {
        score += 0.4;
      }
    }

    return Math.min(1, score);
  }

  private isShotFrequencyAnomalous(playerId: string, timestamp: number): boolean {
    const profile = this.behavioralProfiles.get(playerId);
    if (!profile) return false;

    // Check if shots are too frequent
    const shotFrequency = profile.actionFrequency.get('shot') || 0;
    return shotFrequency > 10; // More than 10 shots per minute is suspicious
  }

  private isTackleImpossible(tackleData: any): boolean {
    // Check if tackle distance or timing is impossible
    if (tackleData.distance > 5) return true; // 5 meters max tackle range
    if (tackleData.timing < 0) return true; // Negative timing
    if (tackleData.timing > 2000) return true; // 2 seconds max reaction time

    return false;
  }

  private detectEconomyAnomalies(playerId: string): number {
    // This would integrate with the economy system
    // For now, return 0 as placeholder
    return 0;
  }

  private detectReplayTampering(packet: MatchPacket): number {
    // Verify packet checksum
    const expectedChecksum = this.calculatePacketChecksum(packet);
    
    if (packet.checksum !== expectedChecksum) {
      return 1; // Certain tampering
    }

    // Check for packet sequence anomalies
    const history = this.matchPackets.get(packet.playerId) || [];
    if (history.length > 1) {
      const lastPacket = history[history.length - 2];
      
      // Check for out-of-order timestamps
      if (packet.timestamp <= lastPacket.timestamp) {
        return 0.5;
      }
    }

    return 0;
  }

  private calculatePacketChecksum(packet: MatchPacket): string {
    // Simple checksum for integrity validation
    const data = `${packet.playerId}${packet.timestamp}${packet.physicsSeed}${JSON.stringify(packet.actions)}`;
    return btoa(data).slice(0, 16);
  }

  private calculateOverallRisk(anomalies: AnomalyDetection): number {
    // Weighted risk calculation
    const weights = {
      speedHackProbability: 0.3,
      teleportDetection: 0.25,
      impossibleActionScore: 0.2,
      economyAnomalyScore: 0.15,
      replayTamperingScore: 0.1
    };

    let riskScore = 0;
    riskScore += anomalies.speedHackProbability * weights.speedHackProbability;
    riskScore += anomalies.teleportDetection * weights.teleportDetection;
    riskScore += anomalies.impossibleActionScore * weights.impossibleActionScore;
    riskScore += anomalies.economyAnomalyScore * weights.economyAnomalyScore;
    riskScore += anomalies.replayTamperingScore * weights.replayTamperingScore;

    return Math.min(1, riskScore);
  }

  private updateBehavioralProfile(packet: MatchPacket, anomalies: AnomalyDetection): void {
    let profile = this.behavioralProfiles.get(packet.playerId);
    
    if (!profile) {
      profile = this.createBehavioralProfile(packet.playerId);
      this.behavioralProfiles.set(packet.playerId, profile);
    }

    // Update input regularity score
    profile.inputRegularityScore = this.calculateInputRegularity(packet);
    
    // Update reaction time variance
    profile.reactionTimeVariance = this.calculateReactionTimeVariance(packet);
    
    // Update action frequency
    for (const action of packet.actions) {
      const current = profile.actionFrequency.get(action.type) || 0;
      profile.actionFrequency.set(action.type, current + 1);
    }

    // Update trust score based on anomalies
    profile.trustScore *= this.TRUST_DECAY_RATE;
    profile.trustScore -= anomalies.overallRiskScore * 0.1;
    profile.trustScore = Math.max(0, Math.min(1, profile.trustScore));

    profile.lastUpdated = new Date();

    // Check for suspicious patterns
    this.detectSuspiciousPatterns(profile, anomalies);
  }

  private createBehavioralProfile(playerId: string): BehavioralProfile {
    return {
      playerId,
      inputRegularityScore: 0.5,
      reactionTimeVariance: 0.5,
      actionFrequency: new Map(),
      suspiciousPatterns: [],
      trustScore: 0.8, // Start with moderate trust
      lastUpdated: new Date()
    };
  }

  private calculateInputRegularity(packet: MatchPacket): number {
    if (packet.inputTimestamps.length < 3) return 0.5;

    const deltas = [];
    for (let i = 1; i < packet.inputTimestamps.length; i++) {
      deltas.push(packet.inputTimestamps[i] - packet.inputTimestamps[i - 1]);
    }

    // Calculate variance
    const mean = deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
    const variance = deltas.reduce((sum, delta) => sum + Math.pow(delta - mean, 2), 0) / deltas.length;
    
    // Low variance = high regularity (suspicious)
    const regularity = 1 - Math.min(1, variance / 1000);
    
    return regularity;
  }

  private calculateReactionTimeVariance(packet: MatchPacket): number {
    // Calculate variance in reaction times for different action types
    const reactionTimes: number[] = [];
    
    for (const action of packet.actions) {
      if (action.data && action.data.reactionTime) {
        reactionTimes.push(action.data.reactionTime);
      }
    }

    if (reactionTimes.length < 2) return 0.5;

    const mean = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;
    const variance = reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - mean, 2), 0) / reactionTimes.length;
    
    return Math.min(1, variance / 1000);
  }

  private detectSuspiciousPatterns(profile: BehavioralProfile, anomalies: AnomalyDetection): void {
    // Clear old patterns
    profile.suspiciousPatterns = [];

    // Check for input regularity
    if (profile.inputRegularityScore > this.INPUT_REGULARITY_THRESHOLD) {
      profile.suspiciousPatterns.push('bot_like_input_regularity');
    }

    // Check for superhuman reaction times
    if (profile.reactionTimeVariance < 0.1) {
      profile.suspiciousPatterns.push('superhuman_reaction_times');
    }

    // Check for high anomaly scores
    if (anomalies.speedHackProbability > 0.7) {
      profile.suspiciousPatterns.push('speed_hack_detected');
    }

    if (anomalies.teleportDetection > 0.7) {
      profile.suspiciousPatterns.push('teleportation_detected');
    }
  }

  private handleAnomalies(playerId: string, anomalies: AnomalyDetection): void {
    const profile = this.behavioralProfiles.get(playerId);
    if (!profile) return;

    let action: 'monitored' | 'restricted' | 'shadow_adjusted' | 'banned' = 'monitored';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (anomalies.overallRiskScore > 0.8) {
      action = 'banned';
      severity = 'critical';
    } else if (anomalies.overallRiskScore > 0.6) {
      action = 'shadow_adjusted';
      severity = 'high';
    } else if (anomalies.overallRiskScore > 0.4) {
      action = 'restricted';
      severity = 'medium';
    } else if (anomalies.overallRiskScore > 0.2) {
      action = 'monitored';
      severity = 'low';
    }

    // Log the violation
    this.logSecurityEvent(playerId, anomalies, action, severity);

    // Apply the action
    switch (action) {
      case 'monitored':
        // Just monitor, no action needed
        break;
      
      case 'restricted':
        this.restrictPlayer(playerId);
        break;
      
      case 'shadow_adjusted':
        this.shadowAdjustPlayer(playerId, anomalies.overallRiskScore);
        break;
      
      case 'banned':
        this.banPlayer(playerId);
        break;
    }
  }

  private logSecurityEvent(playerId: string, anomalies: AnomalyDetection, action: string, severity: string): void {
    if (!this.securityLogs.has(playerId)) {
      this.securityLogs.set(playerId, []);
    }

    const logs = this.securityLogs.get(playerId)!;
    logs.push({
      playerId,
      timestamp: Date.now(),
      violationType: 'anomaly_detection',
      severity: severity as any,
      details: anomalies,
      action: action as any
    });

    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
  }

  private restrictPlayer(playerId: string): void {
    this.restrictedPlayers.add(playerId);
  }

  private shadowAdjustPlayer(playerId: string, riskScore: number): void {
    // Apply shadow adjustment factor
    const adjustmentFactor = 1 - (riskScore * 0.3); // Reduce effectiveness by up to 30%
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.shadowAdjustments.set(playerId, { factor: adjustmentFactor, expires });
  }

  private banPlayer(playerId: string): void {
    // In production, this would interface with the ban system
    this.restrictedPlayers.add(playerId);
  }

  public isPlayerRestricted(playerId: string): boolean {
    return this.restrictedPlayers.has(playerId);
  }

  public getShadowAdjustment(playerId: string): number {
    const adjustment = this.shadowAdjustments.get(playerId);
    if (!adjustment) return 1.0;

    // Check if adjustment has expired
    if (Date.now() > adjustment.expires.getTime()) {
      this.shadowAdjustments.delete(playerId);
      return 1.0;
    }

    return adjustment.factor;
  }

  public getPlayerTrustScore(playerId: string): number {
    const profile = this.behavioralProfiles.get(playerId);
    return profile ? profile.trustScore : 0.5;
  }

  public getSecurityLogs(playerId: string): SecurityLog[] {
    return this.securityLogs.get(playerId) || [];
  }

  public dispose(): void {
    this.behavioralProfiles.clear();
    this.securityLogs.clear();
    this.matchPackets.clear();
    this.restrictedPlayers.clear();
    this.shadowAdjustments.clear();
  }
}
