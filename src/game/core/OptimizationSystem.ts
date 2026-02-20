import { Vector3 } from 'three';
import { GameConfig } from '../types/MatchEngineTypes';

interface DeviceCapabilities {
  gpuTier: 'low' | 'medium' | 'high' | 'ultra';
  memoryGB: number;
  cpuCores: number;
  isMobile: boolean;
  pixelRatio: number;
  maxTextureSize: number;
}

interface PerformanceMetrics {
  currentFPS: number;
  averageFPS: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
}

interface OptimizationSettings {
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  targetFPS: number;
  lodDistance: number;
  shadowQuality: 'none' | 'low' | 'medium' | 'high';
  crowdDetail: 'none' | 'low' | 'medium' | 'high';
  grassDetail: 'low' | 'medium' | 'high';
  particleEffects: boolean;
  postProcessing: boolean;
  antiAliasing: boolean;
  motionBlur: boolean;
  dynamicShadows: boolean;
  reflectionQuality: 'none' | 'low' | 'medium' | 'high';
}

export class OptimizationSystem {
  private deviceCapabilities: DeviceCapabilities;
  private performanceMetrics: PerformanceMetrics;
  private currentSettings: OptimizationSettings;
  private frameHistory: number[] = [];
  private lastOptimizationTime: number = 0;
  private optimizationInterval: number = 5000; // 5 seconds
  
  // Performance presets
  private readonly PRESETS = {
    low: {
      renderQuality: 'low' as const,
      targetFPS: 30,
      lodDistance: 20,
      shadowQuality: 'none' as const,
      crowdDetail: 'none' as const,
      grassDetail: 'low' as const,
      particleEffects: false,
      postProcessing: false,
      antiAliasing: false,
      motionBlur: false,
      dynamicShadows: false,
      reflectionQuality: 'none' as const
    },
    medium: {
      renderQuality: 'medium' as const,
      targetFPS: 60,
      lodDistance: 40,
      shadowQuality: 'low' as const,
      crowdDetail: 'low' as const,
      grassDetail: 'medium' as const,
      particleEffects: true,
      postProcessing: false,
      antiAliasing: false,
      motionBlur: false,
      dynamicShadows: true,
      reflectionQuality: 'low' as const
    },
    high: {
      renderQuality: 'high' as const,
      targetFPS: 60,
      lodDistance: 60,
      shadowQuality: 'medium' as const,
      crowdDetail: 'medium' as const,
      grassDetail: 'high' as const,
      particleEffects: true,
      postProcessing: true,
      antiAliasing: true,
      motionBlur: false,
      dynamicShadows: true,
      reflectionQuality: 'medium' as const
    },
    ultra: {
      renderQuality: 'ultra' as const,
      targetFPS: 120,
      lodDistance: 100,
      shadowQuality: 'high' as const,
      crowdDetail: 'high' as const,
      grassDetail: 'high' as const,
      particleEffects: true,
      postProcessing: true,
      antiAliasing: true,
      motionBlur: true,
      dynamicShadows: true,
      reflectionQuality: 'high' as const
    }
  };

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.performanceMetrics = this.initializeMetrics();
    this.currentSettings = this.selectOptimalSettings();
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    // Detect GPU tier based on renderer and extensions
    const gpuTier = this.detectGPUTier(gl);
    
    // Detect memory (approximation)
    const memoryGB = this.estimateMemory();
    
    // Detect CPU cores
    const cpuCores = navigator.hardwareConcurrency || 4;
    
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Max texture size
    const maxTextureSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 2048;
    
    return {
      gpuTier,
      memoryGB,
      cpuCores,
      isMobile,
      pixelRatio,
      maxTextureSize
    };
  }

  private detectGPUTier(gl: WebGLRenderingContext | WebGL2RenderingContext | null): 'low' | 'medium' | 'high' | 'ultra' {
    if (!gl) return 'low';
    
    const renderer = gl.getParameter(gl.RENDERER);
    const vendor = gl.getParameter(gl.VENDOR);
    const extensions = gl.getSupportedExtensions();
    
    // High-end GPUs
    if (renderer.includes('RTX') || renderer.includes('GTX') || renderer.includes('Radeon RX') || 
        renderer.includes('Apple M1') || renderer.includes('Apple M2')) {
      return 'ultra';
    }
    
    // Mid-range GPUs
    if (renderer.includes('GTX') || renderer.includes('Radeon') || renderer.includes('Intel Iris')) {
      return 'high';
    }
    
    // Low-end GPUs
    if (renderer.includes('Intel HD') || renderer.includes('Mali') || renderer.includes('Adreno')) {
      return this.deviceCapabilities.isMobile ? 'low' : 'medium';
    }
    
    return 'medium';
  }

  private estimateMemory(): number {
    // Estimate device memory (this is approximate)
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory;
    }
    
    // Fallback estimation based on device type
    return this.deviceCapabilities.isMobile ? 4 : 8;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      currentFPS: 60,
      averageFPS: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      drawCalls: 0,
      triangles: 0
    };
  }

  private selectOptimalSettings(): OptimizationSettings {
    const { gpuTier, memoryGB, isMobile } = this.deviceCapabilities;
    
    // Auto-select based on device capabilities
    if (isMobile || gpuTier === 'low' || memoryGB < 4) {
      return this.PRESETS.low;
    } else if (gpuTier === 'medium' || memoryGB < 8) {
      return this.PRESETS.medium;
    } else if (gpuTier === 'high') {
      return this.PRESETS.high;
    } else {
      return this.PRESETS.ultra;
    }
  }

  public update(deltaTime: number): void {
    // Update performance metrics
    this.updatePerformanceMetrics(deltaTime);
    
    // Auto-optimize periodically
    const currentTime = Date.now();
    if (currentTime - this.lastOptimizationTime > this.optimizationInterval) {
      this.autoOptimize();
      this.lastOptimizationTime = currentTime;
    }
  }

  private updatePerformanceMetrics(deltaTime: number): void {
    const frameTime = deltaTime;
    const currentFPS = 1000 / frameTime;
    
    this.performanceMetrics.currentFPS = currentFPS;
    this.performanceMetrics.frameTime = frameTime;
    
    // Update frame history for average calculation
    this.frameHistory.push(currentFPS);
    if (this.frameHistory.length > 60) { // Keep last 60 frames
      this.frameHistory.shift();
    }
    
    // Calculate average FPS
    this.performanceMetrics.averageFPS = 
      this.frameHistory.reduce((sum, fps) => sum + fps, 0) / this.frameHistory.length;
    
    // Update memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.performanceMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
    }
  }

  private autoOptimize(): void {
    const targetFPS = this.currentSettings.targetFPS;
    const averageFPS = this.performanceMetrics.averageFPS;
    const fpsRatio = averageFPS / targetFPS;
    
    // If performance is significantly below target, downgrade
    if (fpsRatio < 0.8) {
      this.downgradeSettings();
    }
    // If performance is significantly above target, consider upgrading
    else if (fpsRatio > 1.2 && this.currentSettings.renderQuality !== 'ultra') {
      this.upgradeSettings();
    }
  }

  private downgradeSettings(): void {
    const currentQuality = this.currentSettings.renderQuality;
    
    switch (currentQuality) {
      case 'ultra':
        this.applySettings(this.PRESETS.high);
        break;
      case 'high':
        this.applySettings(this.PRESETS.medium);
        break;
      case 'medium':
        this.applySettings(this.PRESETS.low);
        break;
      case 'low':
        // Already at lowest, apply additional optimizations
        this.applyEmergencyOptimizations();
        break;
    }
  }

  private upgradeSettings(): void {
    const currentQuality = this.currentSettings.renderQuality;
    
    switch (currentQuality) {
      case 'low':
        this.applySettings(this.PRESETS.medium);
        break;
      case 'medium':
        this.applySettings(this.PRESETS.high);
        break;
      case 'high':
        this.applySettings(this.PRESETS.ultra);
        break;
    }
  }

  private applyEmergencyOptimizations(): void {
    // Additional optimizations for very low-end devices
    this.currentSettings.particleEffects = false;
    this.currentSettings.crowdDetail = 'none';
    this.currentSettings.grassDetail = 'low';
    this.currentSettings.targetFPS = Math.max(24, this.currentSettings.targetFPS - 5);
  }

  public applySettings(settings: OptimizationSettings): void {
    this.currentSettings = { ...settings };
    this.notifySettingsChange();
  }

  private notifySettingsChange(): void {
    // Notify other systems of settings change
    console.log('Optimization settings updated:', this.currentSettings);
    
    // Emit event or call callbacks
    this.onSettingsChanged(this.currentSettings);
  }

  private onSettingsChanged(settings: OptimizationSettings): void {
    // This would be connected to the rendering system
    // to apply the actual quality settings
  }

  public getLODLevel(distance: number): number {
    const lodDistance = this.currentSettings.lodDistance;
    
    if (distance < lodDistance * 0.25) return 0; // Highest detail
    if (distance < lodDistance * 0.5) return 1;
    if (distance < lodDistance) return 2;
    return 3; // Lowest detail
  }

  public shouldRenderObject(position: Vector3, cameraPosition: Vector3): boolean {
    const distance = position.distanceTo(cameraPosition);
    const maxRenderDistance = this.currentSettings.lodDistance * 1.5;
    
    return distance <= maxRenderDistance;
  }

  public getShadowQuality(): 'none' | 'low' | 'medium' | 'high' {
    return this.currentSettings.shadowQuality;
  }

  public getCrowdDetail(): 'none' | 'low' | 'medium' | 'high' {
    return this.currentSettings.crowdDetail;
  }

  public getGrassDetail(): 'low' | 'medium' | 'high' {
    return this.currentSettings.grassDetail;
  }

  public shouldRenderParticles(): boolean {
    return this.currentSettings.particleEffects;
  }

  public shouldUsePostProcessing(): boolean {
    return this.currentSettings.postProcessing;
  }

  public shouldUseAntiAliasing(): boolean {
    return this.currentSettings.antiAliasing;
  }

  public shouldUseMotionBlur(): boolean {
    return this.currentSettings.motionBlur;
  }

  public shouldUseDynamicShadows(): boolean {
    return this.currentSettings.dynamicShadows;
  }

  public getReflectionQuality(): 'none' | 'low' | 'medium' | 'high' {
    return this.currentSettings.reflectionQuality;
  }

  public getTargetFPS(): number {
    return this.currentSettings.targetFPS;
  }

  public getCurrentSettings(): OptimizationSettings {
    return { ...this.currentSettings };
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  public setQualityPreset(preset: 'low' | 'medium' | 'high' | 'ultra'): void {
    this.applySettings(this.PRESETS[preset]);
  }

  public setCustomSettings(settings: Partial<OptimizationSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.notifySettingsChange();
  }

  public forceLowEndMode(): void {
    const lowEndSettings = {
      ...this.PRESETS.low,
      targetFPS: 24,
      lodDistance: 15,
      crowdDetail: 'none' as const,
      particleEffects: false,
      postProcessing: false,
      antiAliasing: false,
      motionBlur: false,
      dynamicShadows: false
    };
    
    this.applySettings(lowEndSettings);
  }

  public forceHighEndMode(): void {
    this.applySettings(this.PRESETS.ultra);
  }

  public resetToAuto(): void {
    this.currentSettings = this.selectOptimalSettings();
    this.notifySettingsChange();
  }

  public getOptimizationReport(): {
    device: DeviceCapabilities;
    current: OptimizationSettings;
    performance: PerformanceMetrics;
    recommendations: string[];
  } {
    const recommendations = this.generateRecommendations();
    
    return {
      device: this.deviceCapabilities,
      current: this.currentSettings,
      performance: this.performanceMetrics,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const { averageFPS, currentFPS } = this.performanceMetrics;
    const { targetFPS } = this.currentSettings;
    
    if (averageFPS < targetFPS * 0.8) {
      recommendations.push('Consider lowering graphics quality for better performance');
    }
    
    if (this.deviceCapabilities.isMobile && this.currentSettings.renderQuality !== 'low') {
      recommendations.push('Mobile device detected, consider using low quality settings');
    }
    
    if (this.deviceCapabilities.memoryGB < 4 && this.currentSettings.particleEffects) {
      recommendations.push('Limited memory available, consider disabling particle effects');
    }
    
    if (this.deviceCapabilities.gpuTier === 'low' && this.currentSettings.shadowQuality !== 'none') {
      recommendations.push('Low-end GPU detected, consider disabling shadows');
    }
    
    return recommendations;
  }

  public dispose(): void {
    this.frameHistory = [];
    this.performanceMetrics = this.initializeMetrics();
  }
}
