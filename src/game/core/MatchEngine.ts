import { Vector3, Euler } from 'three';
import { PhysicsCore } from './PhysicsCore';
import { TacticalAI } from './TacticalAI';
import { PresentationLayer } from './PresentationLayer';
import { MatchState, PlayerStats, BallState, GameConfig } from '../types/MatchEngineTypes';

export class MatchEngine {
  private physicsCore: PhysicsCore;
  private tacticalAI: TacticalAI;
  private presentationLayer: PresentationLayer;
  private lastFrameTime: number = 0;
  private accumulator: number = 0;
  private frameCount: number = 0;
  
  // Fixed timestep for physics (60 FPS = 16.67ms)
  private readonly FIXED_TIMESTEP = 1000 / 60;
  private readonly MAX_FRAME_TIME = 250; // Prevent spiral of death

  constructor(config: GameConfig) {
    this.physicsCore = new PhysicsCore(config);
    this.tacticalAI = new TacticalAI(config);
    this.presentationLayer = new PresentationLayer(config);
  }

  public update(currentTime: number): void {
    const frameTime = Math.min(currentTime - this.lastFrameTime, this.MAX_FRAME_TIME);
    this.lastFrameTime = currentTime;

    // Fixed timestep physics update
    this.accumulator += frameTime;
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.physicsCore.update(this.FIXED_TIMESTEP);
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // AI and presentation update every frame
    this.tacticalAI.updateAI(frameTime);
    this.presentationLayer.update(frameTime);

    this.frameCount++;
  }

  public getMatchState(): MatchState {
    return {
      ballState: this.physicsCore.getBallState(),
      players: this.physicsCore.getAllPlayerStates(),
      matchTime: this.presentationLayer.getMatchTime(),
      score: this.presentationLayer.getScore(),
      gamePhase: this.presentationLayer.getGamePhase() as MatchState['gamePhase']
    };
  }

  public setPlayerInput(playerId: string, input: Vector3): void {
    this.physicsCore.setPlayerInput(playerId, input);
  }

  public getTargetFPS(): number {
    return this.presentationLayer.getTargetFPS();
  }

  public dispose(): void {
    this.physicsCore.dispose();
    this.tacticalAI.dispose();
    this.presentationLayer.dispose();
  }
}
