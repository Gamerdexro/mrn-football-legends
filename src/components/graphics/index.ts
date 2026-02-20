/**
 * Graphics Components Export Index
 * 
 * This file centralizes all premium graphics component exports
 * for easy importing throughout the application.
 */

// Background and Depth Effects
export { AnimatedStadiumBackground } from './AnimatedStadiumBackground';
export { CinematicDepthLayer } from './CinematicDepthLayer';

// UI Components
export { PremiumPlayButton, PremiumButton } from './PremiumButtons';
export { PremiumCurrencyDisplay } from './PremiumCurrencyDisplay';
export { LivePlayerPresence } from './LivePlayerPresence';
export { PremiumModeCard } from './PremiumModeCard';

// Audio and Sound
export {
  AmbientSoundLayer,
  playClickSound,
  playSuccessSound,
  playErrorSound,
} from './AmbientSoundLayer';

// Panel and Modal Effects
export {
  PanelOpenEffect,
  ModalPanel,
  SidePanel,
} from './PanelEffects';

// Glow Effects and Accents
export {
  GlowAccent,
  EventIcon,
  OVRBadge,
  AchievementBadge,
} from './PremiumGlowAccents';

// Full Integration Guide
export { PremiumGraphicsIntegration } from './GRAPHICS_INTEGRATION_GUIDE';

/**
 * QUICK START GUIDE
 * 
 * Import all components at once:
 * ```typescript
 * import {
 *   AnimatedStadiumBackground,
 *   CinematicDepthLayer,
 *   PremiumButtons,
 *   PremiumCurrencyDisplay,
 *   AmbientSoundLayer,
 *   playClickSound,
 *   // ... etc
 * } from './components/graphics';
 * ```
 * 
 * Or import specific components:
 * ```typescript
 * import { PremiumModeCard } from './components/graphics/PremiumModeCard';
 * import { GlowAccent } from './components/graphics/PremiumGlowAccents';
 * ```
 * 
 * Or use the complete integration:
 * ```typescript
 * import { PremiumGraphicsIntegration } from './components/graphics';
 * ```
 */
