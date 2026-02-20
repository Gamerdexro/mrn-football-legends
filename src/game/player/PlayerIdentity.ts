import { Vector3, Euler, Object3D, SkinnedMesh, Material } from 'three';
import { PlayerStats } from '../types/MatchEngineTypes';

// VISUAL IDENTITY
export interface BodyStructure {
  shoulderWidth: number; // 0-100
  waistNarrowness: number; // 0-100
  thighStrength: number; // 0-100
  calfDefinition: number; // 0-100
  bodyType: 'athletic' | 'powerful' | 'lean' | 'stocky';
  spineCurvature: number;
  chestExpansion: number;
  neckThickness: number;
  handProportion: number;
}

export interface FacialFeatures {
  jawlineDefinition: number; // 0-1, defined jaw
  cheekboneVisibility: number; // 0-1, visible cheekbones
  eyelidDepth: number; // 0-1, not flat eyelids
  eyebrowDepth: number; // 0-1, not painted lines
  noseBridgeShape: number; // 0-1, defined nose
  earDetail: number; // 0-1, ear shape detail
  lipCurve: number; // 0-1, subtle lip curve
  skinTextureVariation: number; // 0-1, skin variation
  foreheadShine: number; // 0-1, subtle shine
  skinRealism: number; // 0-1, avoid plastic look
}

export interface HairSystem {
  hairlineShape: 'receding' | 'normal' | 'widow' | 'mature';
  volume: number; // 0-1, hair volume
  flowDirection: Vector3; // Natural hair flow
  textureType: 'curly' | 'straight' | 'wavy' | 'messy' | 'braided' | 'fade' | 'buzz';
  movementPhysics: boolean; // Hair bounce physics
  color: string;
  highlights: boolean;
  length: number; // 0-1, hair length
}

export interface MuscleSystem {
  elbowFlexion: number; // Natural elbow bend
  kneeStructure: number; // Kneecap definition
  shoulderRotation: number; // Smooth shoulder movement
  thighTension: number; // Visual thigh tightening
  calfFlex: number; // Calf flex during acceleration
  jointRealism: number; // Avoid robotic movement
  animationBlending: number; // Smooth transitions
}

export interface OutfitDetailing {
  jerseyTexture: string; // Fabric texture
  jerseyWrinkles: boolean; // Dynamic wrinkles
  shortsReaction: boolean; // React during sprint
  sockStretching: boolean; // Proper sock stretching
  bootDetail: string; // Lace/design detail
  gloveDetail?: string; // Goalkeeper gloves
  materialQuality: number; // 0-1, material realism
}

// GAMEPLAY IDENTITY
export interface MovementStyle {
  stepPattern: 'light' | 'heavy' | 'balanced' | 'explosive';
  turnStyle: 'smooth' | 'sharp' | 'powerful' | 'technical';
  accelerationAnimation: 'explosive' | 'gradual' | 'controlled';
  sprintingPosture: 'forward' | 'upright' | 'powerful';
  idleStance: 'confident' | 'focused' | 'relaxed' | 'aggressive';
  runningStyle: 'elegant' | 'powerful' | 'efficient' | 'flamboyant';
}

export interface SkillSignature {
  preferredFoot: 'left' | 'right' | 'both';
  skillMoves: string[]; // Specific skill animations
  shootingStyle: 'powerful' | 'placement' | 'curl' | 'chip';
  passingStyle: 'short' | 'long' | 'through' | 'cross';
  dribblingStyle: 'close' | 'speed' | 'skill' | 'physical';
  defensiveStyle: 'tactical' | 'aggressive' | 'positioning' | 'interception';
}

export interface GameplayAttributes {
  speed: number; // 0-100
  acceleration: number; // 0-100
  strength: number; // 0-100
  stamina: number; // 0-100
  ballControl: number; // 0-100
  passing: number; // 0-100
  shooting: number; // 0-100
  skillMoves: number; // 0-100
  defending: number; // 0-100
  physicality: number; // 0-100
  mentality: number; // 0-100
}

// EMOTIONAL IDENTITY
export interface EmotionalExpression {
  celebrationAnimation: string;
  menuPose: string;
  facialExpression: 'confident' | 'intense' | 'calm' | 'aggressive' | 'joyful' | 'focused' | 'relaxed';
  voiceReaction: string;
  goalReaction: string;
  missReaction: string;
  foulReaction: string;
  winReaction: string;
  loseReaction: string;
}

export interface PersonalityTraits {
  confidence: number; // 0-1, affects posture
  aggression: number; // 0-1, affects movement
  creativity: number; // 0-1, affects skill moves
  leadership: number; // 0-1, affects team interactions
  showmanship: number; // 0-1, affects celebrations
  focus: number; // 0-1, affects concentration
  temperament: number; // 0-1, affects emotional control
}

// SPECIAL MODES
export interface PackModeDetails {
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  entrancePose: string; // Custom entrance
  glowEffect: boolean; // Rarity-based glow
  borderFrame: string; // Special border
  revealAnimation: string; // Pack opening animation
  backgroundEffect: string; // Background particles
  musicTheme: string; // Reveal music
}

export interface EventModeDetails {
  specialJersey: string; // Event-specific jersey
  customHaircut: HairSystem; // Special hair
  temporaryTattoo: string; // Event tattoo
  coloredBoots: string; // Custom boots
  animatedOutline: boolean; // Special outline
  eventBadge: string; // Event participation badge
}

export interface GiftModeDetails {
  exclusiveIntro: string; // Gift reveal animation
  uniqueBadge: string; // Special badge under name
  customBorder: string; // Gift-specific border
  specialEffect: string; // Persistent effect
  thankYouAnimation: string; // Gratitude animation
}

// MAIN PLAYER IDENTITY INTERFACE
export interface PlayerIdentity {
  // Core info
  id: string;
  name: string;
  position: string;
  nationality: string;
  
  // Visual Identity
  bodyStructure: BodyStructure;
  facialFeatures: FacialFeatures;
  hairSystem: HairSystem;
  muscleSystem: MuscleSystem;
  outfitDetailing: OutfitDetailing;
  
  // Gameplay Identity
  movementStyle: MovementStyle;
  skillSignature: SkillSignature;
  gameplayAttributes: GameplayAttributes;
  
  // Emotional Identity
  emotionalExpression: EmotionalExpression;
  personalityTraits: PersonalityTraits;
  
  // Special Modes
  packModeDetails?: PackModeDetails;
  eventModeDetails?: EventModeDetails;
  giftModeDetails?: GiftModeDetails;
  
  // Technical
  model?: Object3D;
  materials?: Material[];
  skeleton?: any; // Three.js skeleton
  animations?: Map<string, any>; // Animation clips
}

// PLAYER IDENTITY MANAGER
export class PlayerIdentityManager {
  private identities: Map<string, PlayerIdentity> = new Map();
  private activePlayers: Map<string, PlayerIdentity> = new Map();
  
  public createIdentity(config: Partial<PlayerIdentity>): PlayerIdentity {
    const defaultIdentity: PlayerIdentity = {
      id: config.id || '',
      name: config.name || '',
      position: config.position || '',
      nationality: config.nationality || '',
      
      bodyStructure: {
        shoulderWidth: 0.5,
        waistNarrowness: 0.5,
        thighStrength: 0.5,
        calfDefinition: 0.5,
        bodyType: 'athletic',
        spineCurvature: 0.3,
        chestExpansion: 0.2,
        neckThickness: 0.5,
        handProportion: 0.5,
        ...config.bodyStructure
      },
      
      facialFeatures: {
        jawlineDefinition: 0.5,
        cheekboneVisibility: 0.5,
        eyelidDepth: 0.5,
        eyebrowDepth: 0.5,
        noseBridgeShape: 0.5,
        earDetail: 0.5,
        lipCurve: 0.5,
        skinTextureVariation: 0.5,
        foreheadShine: 0.3,
        skinRealism: 0.7,
        ...config.facialFeatures
      },
      
      hairSystem: {
        hairlineShape: 'normal',
        volume: 0.5,
        flowDirection: new Vector3(0, 0, 1),
        textureType: 'straight',
        movementPhysics: true,
        color: '#000000',
        highlights: false,
        length: 0.3,
        ...config.hairSystem
      },
      
      muscleSystem: {
        elbowFlexion: 0.7,
        kneeStructure: 0.6,
        shoulderRotation: 0.8,
        thighTension: 0.6,
        calfFlex: 0.7,
        jointRealism: 0.8,
        animationBlending: 0.9,
        ...config.muscleSystem
      },
      
      outfitDetailing: {
        jerseyTexture: 'default',
        jerseyWrinkles: true,
        shortsReaction: true,
        sockStretching: true,
        bootDetail: 'standard',
        materialQuality: 0.7,
        ...config.outfitDetailing
      },
      
      movementStyle: {
        stepPattern: 'balanced',
        turnStyle: 'smooth',
        accelerationAnimation: 'gradual',
        sprintingPosture: 'forward',
        idleStance: 'confident',
        runningStyle: 'efficient',
        ...config.movementStyle
      },
      
      skillSignature: {
        preferredFoot: 'right',
        skillMoves: [],
        shootingStyle: 'placement',
        passingStyle: 'short',
        dribblingStyle: 'close',
        defensiveStyle: 'positioning',
        ...config.skillSignature
      },
      
      gameplayAttributes: {
        speed: 50,
        acceleration: 50,
        strength: 50,
        stamina: 50,
        ballControl: 50,
        passing: 50,
        shooting: 50,
        skillMoves: 50,
        defending: 50,
        physicality: 50,
        mentality: 50,
        ...config.gameplayAttributes
      },
      
      emotionalExpression: {
        celebrationAnimation: 'default',
        menuPose: 'confident',
        facialExpression: 'confident',
        voiceReaction: 'default',
        goalReaction: 'excited',
        missReaction: 'disappointed',
        foulReaction: 'angry',
        winReaction: 'victorious',
        loseReaction: 'dejected',
        ...config.emotionalExpression
      },
      
      personalityTraits: {
        confidence: 0.5,
        aggression: 0.5,
        creativity: 0.5,
        leadership: 0.5,
        showmanship: 0.5,
        focus: 0.5,
        temperament: 0.5,
        ...config.personalityTraits
      }
    };
    
    const identity = { ...defaultIdentity, ...config };
    this.identities.set(identity.id, identity);
    return identity;
  }
  
  public getIdentity(id: string): PlayerIdentity | undefined {
    return this.identities.get(id);
  }
  
  public activatePlayer(id: string): PlayerIdentity | undefined {
    const identity = this.identities.get(id);
    if (identity) {
      this.activePlayers.set(id, identity);
    }
    return identity;
  }
  
  public deactivatePlayer(id: string): void {
    this.activePlayers.delete(id);
  }
  
  public getActivePlayer(id: string): PlayerIdentity | undefined {
    return this.activePlayers.get(id);
  }
  
  public getAllActivePlayers(): PlayerIdentity[] {
    return Array.from(this.activePlayers.values());
  }
  
  public updateIdentity(id: string, updates: Partial<PlayerIdentity>): void {
    const identity = this.identities.get(id);
    if (identity) {
      const updatedIdentity = { ...identity, ...updates };
      this.identities.set(id, updatedIdentity);
      
      // Update active player if needed
      if (this.activePlayers.has(id)) {
        this.activePlayers.set(id, updatedIdentity);
      }
    }
  }
  
  public generateUniqueFeatures(baseIdentity: Partial<PlayerIdentity>): PlayerIdentity {
    // Generate unique features for each player
    const uniqueFeatures = {
      ...baseIdentity,
      bodyStructure: {
        bodyType: baseIdentity.bodyStructure?.bodyType ?? 'athletic',
        spineCurvature: baseIdentity.bodyStructure?.spineCurvature ?? 0.3,
        chestExpansion: baseIdentity.bodyStructure?.chestExpansion ?? 0.2,
        neckThickness: baseIdentity.bodyStructure?.neckThickness ?? 0.5,
        handProportion: baseIdentity.bodyStructure?.handProportion ?? 0.5,
        ...baseIdentity.bodyStructure,
        shoulderWidth: 0.3 + Math.random() * 0.4,
        waistNarrowness: 0.3 + Math.random() * 0.4,
        thighStrength: 0.4 + Math.random() * 0.4,
        calfDefinition: 0.4 + Math.random() * 0.4,
      },
      facialFeatures: {
        jawlineDefinition: 0.4 + Math.random() * 0.4,
        cheekboneVisibility: 0.3 + Math.random() * 0.5,
        eyelidDepth: 0.5 + Math.random() * 0.3,
        eyebrowDepth: baseIdentity.facialFeatures?.eyebrowDepth ?? 0.5,
        earDetail: baseIdentity.facialFeatures?.earDetail ?? 0.5,
        lipCurve: baseIdentity.facialFeatures?.lipCurve ?? 0.5,
        skinTextureVariation: baseIdentity.facialFeatures?.skinTextureVariation ?? 0.5,
        foreheadShine: baseIdentity.facialFeatures?.foreheadShine ?? 0.3,
        skinRealism: baseIdentity.facialFeatures?.skinRealism ?? 0.7,
        noseBridgeShape: 0.4 + Math.random() * 0.4,
      },
      personalityTraits: {
        ...baseIdentity.personalityTraits,
        confidence: 0.3 + Math.random() * 0.4,
        aggression: 0.3 + Math.random() * 0.4,
        creativity: 0.3 + Math.random() * 0.4,
        leadership: baseIdentity.personalityTraits?.leadership ?? 0.5,
        showmanship: 0.3 + Math.random() * 0.4,
        focus: baseIdentity.personalityTraits?.focus ?? 0.5,
        temperament: baseIdentity.personalityTraits?.temperament ?? 0.5,
      }
    };
    
    return this.createIdentity(uniqueFeatures);
  }
  
  public dispose(): void {
    this.identities.clear();
    this.activePlayers.clear();
  }
}
