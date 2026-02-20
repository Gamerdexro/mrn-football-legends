import { Vector3, Euler, AudioListener, Audio } from 'three';
import { GameConfig, MatchState, PlayerState } from '../types/MatchEngineTypes';

interface CameraSettings {
  position: Vector3;
  target: Vector3;
  fov: number;
  smoothness: number;
}

interface CommentaryLine {
  id: string;
  text: string;
  importance: number; // 0-1
  category: 'goal' | 'shot' | 'foul' | 'save' | 'general' | 'tactical';
  delay: number; // milliseconds
  triggered: boolean;
}

interface CrowdState {
  mood: 'idle' | 'murmur' | 'cheer' | 'roar' | 'tension' | 'silence' | 'whistle';
  intensity: number; // 0-1
  homeTeamAdvantage: number; // 0-1
  wavePosition: number; // 0-1 for wave animation
}

interface UIState {
  scoreVisible: boolean;
  timeVisible: boolean;
  minimapVisible: boolean;
  playerStatsVisible: boolean;
  activeNotifications: Array<{
    id: string;
    type: 'goal' | 'card' | 'substitution' | 'offside' | 'general';
    message: string;
    duration: number;
    startTime: number;
  }>;
}

export class PresentationLayer {
  private config: GameConfig;
  private cameraSettings: CameraSettings;
  private commentaryLines: CommentaryLine[] = [];
  private crowdState: CrowdState;
  private uiState: UIState;
  private matchTime: number = 0;
  private score: { home: number; away: number } = { home: 0, away: 0 };
  private gamePhase: 'first_half' | 'second_half' | 'extra_time' | 'penalty_shootout' | 'finished' = 'first_half';
  
  // Audio system
  private audioListener: AudioListener;
  private audioContext: AudioContext | null = null;
  private soundEffects: Map<string, Audio> = new Map();
  
  // Performance settings
  private targetFPS: number;
  private renderQuality: string;

  constructor(config: GameConfig) {
    this.config = config;
    this.targetFPS = this.calculateTargetFPS();
    this.renderQuality = config.renderQuality;
    
    this.cameraSettings = {
      position: new Vector3(0, 14, 18),
      target: new Vector3(0, 0, 0),
      fov: 60,
      smoothness: 0.1
    };
    
    this.crowdState = {
      mood: 'idle',
      intensity: 0.3,
      homeTeamAdvantage: 0.5,
      wavePosition: 0
    };
    
    this.uiState = {
      scoreVisible: true,
      timeVisible: true,
      minimapVisible: true,
      playerStatsVisible: false,
      activeNotifications: []
    };
    
    this.audioListener = new AudioListener();
    this.initializeCommentarySystem();
    this.initializeAudioSystem();
  }

  private calculateTargetFPS(): number {
    switch (this.config.renderQuality) {
      case 'low':
        return 30;
      case 'medium':
        return 60;
      case 'high':
        return 60;
      case 'ultra':
        return 120;
      default:
        return 60;
    }
  }

  private initializeCommentarySystem(): void {
    // Initialize commentary lines database
    this.commentaryLines = [
      // Goal commentary
      { id: 'goal_1', text: "GOAL! What a fantastic strike!", importance: 1.0, category: 'goal', delay: 500, triggered: false },
      { id: 'goal_2', text: "The crowd erupts! A crucial goal!", importance: 0.9, category: 'goal', delay: 800, triggered: false },
      { id: 'goal_3', text: "Clinical finishing! The net bulges!", importance: 0.8, category: 'goal', delay: 600, triggered: false },
      
      // Shot commentary
      { id: 'shot_1', text: "What a strike! Just wide!", importance: 0.6, category: 'shot', delay: 200, triggered: false },
      { id: 'shot_2', text: "Powerful effort, but the keeper is equal to it!", importance: 0.7, category: 'shot', delay: 300, triggered: false },
      { id: 'shot_3', text: "Ambitious attempt from distance!", importance: 0.4, category: 'shot', delay: 150, triggered: false },
      
      // Foul commentary
      { id: 'foul_1', text: "That's a cynical foul!", importance: 0.5, category: 'foul', delay: 100, triggered: false },
      { id: 'foul_2', text: "The referee has no choice but to book him!", importance: 0.6, category: 'foul', delay: 200, triggered: false },
      { id: 'foul_3', text: "Free kick in a dangerous position!", importance: 0.7, category: 'foul', delay: 150, triggered: false },
      
      // Save commentary
      { id: 'save_1', text: "What a save! Magnificent!", importance: 0.8, category: 'save', delay: 200, triggered: false },
      { id: 'save_2', text: "The goalkeeper comes up big!", importance: 0.7, category: 'save', delay: 250, triggered: false },
      { id: 'save_3', text: "Brilliant reflexes to keep it out!", importance: 0.9, category: 'save', delay: 180, triggered: false },
      
      // General commentary
      { id: 'general_1', text: "The game is really opening up now!", importance: 0.3, category: 'general', delay: 1000, triggered: false },
      { id: 'general_2', text: "End-to-end stuff here!", importance: 0.4, category: 'general', delay: 800, triggered: false },
      { id: 'general_3', text: "The tension is palpable!", importance: 0.5, category: 'general', delay: 600, triggered: false }
    ];
  }

  private initializeAudioSystem(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  public update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    
    // Update camera
    this.updateCamera(dt);
    
    // Update commentary
    this.updateCommentary(dt);
    
    // Update crowd
    this.updateCrowd(dt);
    
    // Update UI
    this.updateUI(dt);
    
    // Update audio
    this.updateAudio(dt);
    
    // Update match time
    this.updateMatchTime(dt);
  }

  private updateCamera(dt: number): void {
    // Smooth camera following
    const targetPosition = this.calculateCameraTarget();
    const currentPosition = this.cameraSettings.position;
    
    // Smooth interpolation
    const newPosition = currentPosition.lerp(targetPosition.position, this.cameraSettings.smoothness);
    const newTarget = this.cameraSettings.target.lerp(targetPosition.target, this.cameraSettings.smoothness);
    
    this.cameraSettings.position = newPosition;
    this.cameraSettings.target = newTarget;
  }

  private calculateCameraTarget(): CameraSettings {
    // Dynamic camera positioning based on game state
    const ballPosition = new Vector3(0, 0, 0); // Would come from physics
    const actionIntensity = this.calculateActionIntensity();
    
    // Adjust camera height and distance based on action
    const baseHeight = 14;
    const baseDistance = 18;
    const heightVariation = actionIntensity * 4;
    const distanceVariation = actionIntensity * 6;
    
    return {
      position: new Vector3(
        ballPosition.x,
        baseHeight - heightVariation,
        ballPosition.z + baseDistance - distanceVariation
      ),
      target: ballPosition,
      fov: 60 + actionIntensity * 10, // Wider FOV for more action
      smoothness: 0.1
    };
  }

  private calculateActionIntensity(): number {
    // Calculate based on ball speed, player proximity, etc.
    return 0.3; // Simplified
  }

  private updateCommentary(dt: number): void {
    // Check for triggered commentary events
    this.commentaryLines.forEach(line => {
      if (!line.triggered && Math.random() < 0.01) { // Random trigger chance
        this.playCommentaryLine(line.id);
      }
    });
  }

  public triggerCommentary(event: string, player?: PlayerState): void {
    const relevantLines = this.commentaryLines.filter(line => 
      line.category === event && !line.triggered
    );
    
    if (relevantLines.length > 0) {
      const line = relevantLines[Math.floor(Math.random() * relevantLines.length)];
      setTimeout(() => {
        this.playCommentaryLine(line.id);
      }, line.delay);
    }
  }

  private playCommentaryLine(lineId: string, player?: PlayerState): void {
    const line = this.commentaryLines.find(l => l.id === lineId);
    if (line) {
      line.triggered = true;
      
      // Reset trigger after some time
      setTimeout(() => {
        line.triggered = false;
      }, 10000);
      
      // Play audio commentary (if available)
      this.playCommentaryAudio(line.id);
      
      // Display subtitle
      this.displayCommentarySubtitle(line.text, player);
    }
  }

  private playCommentaryAudio(lineId: string): void {
    // In a real implementation, would play actual audio files
    console.log(`Playing commentary: ${lineId}`);
  }

  private displayCommentarySubtitle(text: string, player?: PlayerState): void {
    // Display subtitle on screen
    const subtitle = player ? `${(player as any).name}: ${text}` : text;
    console.log(`Commentary: ${subtitle}`);
  }

  private updateCrowd(dt: number): void {
    // Update crowd mood based on game events
    this.updateCrowdMood();
    
    // Update crowd animation
    this.updateCrowdAnimation(dt);
    
    // Update crowd audio
    this.updateCrowdAudio();
  }

  private updateCrowdMood(): void {
    // Mood transitions based on game events
    const recentGoal = this.checkRecentGoal();
    const recentShot = this.checkRecentShot();
    const matchImportance = this.calculateMatchImportance();
    
    if (recentGoal) {
      this.crowdState.mood = 'roar';
      this.crowdState.intensity = 1.0;
    } else if (recentShot) {
      this.crowdState.mood = 'tension';
      this.crowdState.intensity = 0.7;
    } else if (matchImportance > 0.8) {
      this.crowdState.mood = 'murmur';
      this.crowdState.intensity = 0.5;
    } else {
      this.crowdState.mood = 'idle';
      this.crowdState.intensity = 0.3;
    }
  }

  private updateCrowdAnimation(dt: number): void {
    // Wave animation for high-end devices
    if (this.renderQuality === 'high' || this.renderQuality === 'ultra') {
      this.crowdState.wavePosition += dt * 0.5;
      if (this.crowdState.wavePosition > 1) {
        this.crowdState.wavePosition = 0;
      }
    }
  }

  private updateCrowdAudio(): void {
    // Adjust crowd volume based on mood and intensity
    const volume = this.crowdState.intensity * 0.7;
    
    // Play appropriate crowd sound
    switch (this.crowdState.mood) {
      case 'roar':
        this.playCrowdSound('crowd_roar', volume);
        break;
      case 'cheer':
        this.playCrowdSound('crowd_cheer', volume * 0.8);
        break;
      case 'tension':
        this.playCrowdSound('crowd_tension', volume * 0.6);
        break;
      case 'murmur':
        this.playCrowdSound('crowd_murmur', volume * 0.4);
        break;
      default:
        this.playCrowdSound('crowd_idle', volume * 0.3);
    }
  }

  private playCrowdSound(soundName: string, volume: number): void {
    // Play crowd sound effect
    console.log(`Playing crowd sound: ${soundName} at volume ${volume}`);
  }

  private updateUI(dt: number): void {
    // Update notifications
    this.updateNotifications(dt);
    
    // Update score display
    this.updateScoreDisplay();
    
    // Update time display
    this.updateTimeDisplay();
  }

  private updateNotifications(dt: number): void {
    const currentTime = Date.now();
    
    this.uiState.activeNotifications = this.uiState.activeNotifications.filter(notification => {
      return currentTime - notification.startTime < notification.duration;
    });
  }

  public showNotification(type: 'goal' | 'card' | 'substitution' | 'offside' | 'general', message: string): void {
    const notification = {
      id: Math.random().toString(),
      type,
      message,
      duration: 3000,
      startTime: Date.now()
    };
    
    this.uiState.activeNotifications.push(notification);
  }

  private updateScoreDisplay(): void {
    // Update score UI
    if (this.uiState.scoreVisible) {
      // Render score: `HOME ${this.score.home} - ${this.score.away} AWAY`
    }
  }

  private updateTimeDisplay(): void {
    // Update time UI
    if (this.uiState.timeVisible) {
      const minutes = Math.floor(this.matchTime / 60);
      const seconds = Math.floor(this.matchTime % 60);
      // Render time: `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
  }

  private updateAudio(dt: number): void {
    // Update audio mixing and ducking
    this.updateAudioMixing();
  }

  private updateAudioMixing(): void {
    // Duck crowd audio during commentary
    const commentaryActive = this.commentaryLines.some(line => line.triggered);
    
    if (commentaryActive) {
      // Reduce crowd volume by 50%
      this.setAudioLevel('crowd', 0.5);
    } else {
      // Restore crowd volume
      this.setAudioLevel('crowd', 1.0);
    }
  }

  private setAudioLevel(channel: string, level: number): void {
    // Set audio channel level
    console.log(`Setting ${channel} audio level to ${level}`);
  }

  private updateMatchTime(dt: number): void {
    this.matchTime += dt;
    
    // Check for half-time/full-time
    const halfTime = this.config.matchDuration * 60 / 2; // Convert to seconds
    
    if (this.matchTime >= halfTime && this.gamePhase === 'first_half') {
      this.gamePhase = 'second_half';
      this.triggerHalfTime();
    } else if (this.matchTime >= halfTime * 2 && this.gamePhase === 'second_half') {
      this.gamePhase = 'finished';
      this.triggerFullTime();
    }
  }

  private triggerHalfTime(): void {
    this.gamePhase = 'second_half';
    this.showNotification('general', 'HALF TIME');
    this.triggerCommentary('general');
  }

  private triggerFullTime(): void {
    this.showNotification('general', 'FULL TIME');
    this.triggerCommentary('general');
  }

  private checkRecentGoal(): boolean {
    // Check if goal scored in last 5 seconds
    return false; // Simplified
  }

  private checkRecentShot(): boolean {
    // Check if shot taken in last 2 seconds
    return false; // Simplified
  }

  private calculateMatchImportance(): number {
    // Calculate based on score difference, time remaining, etc.
    const scoreDifference = Math.abs(this.score.home - this.score.away);
    const timeRemaining = (this.config.matchDuration * 60) - this.matchTime;
    
    if (scoreDifference <= 1 && timeRemaining < 300) { // Close game, last 5 minutes
      return 1.0;
    } else if (scoreDifference <= 2 && timeRemaining < 600) { // Close game, last 10 minutes
      return 0.8;
    } else {
      return 0.5;
    }
  }

  // Public API methods
  public getCameraSettings(): CameraSettings {
    return { ...this.cameraSettings };
  }

  public getCrowdState(): CrowdState {
    return { ...this.crowdState };
  }

  public getUIState(): UIState {
    return { ...this.uiState };
  }

  public getMatchTime(): number {
    return this.matchTime;
  }

  public getScore(): { home: number; away: number } {
    return { ...this.score };
  }

  public getGamePhase(): string {
    return this.gamePhase;
  }

  public getTargetFPS(): number {
    return this.targetFPS;
  }

  public setScore(home: number, away: number): void {
    this.score.home = home;
    this.score.away = away;
    this.showNotification('goal', `GOAL! Score: ${home} - ${away}`);
    this.triggerCommentary('goal');
  }

  public setGamePhase(phase: string): void {
    this.gamePhase = phase as any;
  }

  public toggleUIElement(element: 'score' | 'time' | 'minimap' | 'playerStats'): void {
    switch (element) {
      case 'score':
        this.uiState.scoreVisible = !this.uiState.scoreVisible;
        break;
      case 'time':
        this.uiState.timeVisible = !this.uiState.timeVisible;
        break;
      case 'minimap':
        this.uiState.minimapVisible = !this.uiState.minimapVisible;
        break;
      case 'playerStats':
        this.uiState.playerStatsVisible = !this.uiState.playerStatsVisible;
        break;
    }
  }

  public dispose(): void {
    this.commentaryLines = [];
    this.soundEffects.clear();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
