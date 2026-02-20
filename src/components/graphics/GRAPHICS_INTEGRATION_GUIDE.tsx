import React, { useState } from 'react';
import { AnimatedStadiumBackground } from './AnimatedStadiumBackground';
import { CinematicDepthLayer } from './CinematicDepthLayer';
import { PremiumPlayButton, PremiumButton } from './PremiumButtons';
import { PremiumCurrencyDisplay } from './PremiumCurrencyDisplay';
import { LivePlayerPresence } from './LivePlayerPresence';
import { PremiumModeCard } from './PremiumModeCard';
import { AmbientSoundLayer, playClickSound, playSuccessSound } from './AmbientSoundLayer';
import { PanelOpenEffect, ModalPanel, SidePanel } from './PanelEffects';
import { GlowAccent, EventIcon, OVRBadge, AchievementBadge } from './PremiumGlowAccents';

/**
 * GRAPHICS INTEGRATION GUIDE
 * 
 * This file demonstrates how to integrate all premium graphics components
 * into your MainMenu and GameScene for a console-quality football game experience.
 * 
 * Component Hierarchy:
 * 
 * GameScene / MainMenu (Root)
 *   ├─ AnimatedStadiumBackground (zIndex: 0)
 *   ├─ CinematicDepthLayer (zIndex: 5)
 *   ├─ AmbientSoundLayer (Audio context)
 *   └─ Content Layer (zIndex: 10-100)
 *       ├─ Mode Selection Cards (Game modes)
 *       ├─ PremiumModeCard (Individual card)
 *       ├─ PremiumCurrencyDisplay (Top-right, coins/diamonds)
 *       ├─ LivePlayerPresence (Center character)
 *       ├─ PremiumButtons (Play, Glass panels)
 *       ├─ EventIcon / GlowAccent (Icon badges)
 *       ├─ OVRBadge (Player rating)
 *       └─ PanelOpenEffect (Modal overlays)
 */

export const PremiumGraphicsIntegration: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [coins, setCoins] = useState(5234);
  const [diamonds, setDiamonds] = useState(156);

  // Game modes with premium data
  const gameModes = [
    {
      title: 'Season',
      description: 'Compete in a full season',
      icon: '⚽',
      gradient: 'linear-gradient(135deg, #1a472a 0%, #2d7a3e 100%)',
      isLocked: false,
    },
    {
      title: 'Rivals',
      description: 'Competitive Online Matches',
      icon: '🔥',
      gradient: 'linear-gradient(135deg, #472a1a 0%, #7a3e2d 100%)',
      isLocked: false,
    },
    {
      title: 'Squad Arena',
      description: 'Build & Battle Teams',
      icon: '🏆',
      gradient: 'linear-gradient(135deg, #2a1a47 0%, #3e2d7a 100%)',
      isLocked: false,
    },
    {
      title: 'Events',
      description: 'Limited-Time Campaigns',
      icon: '🎯',
      gradient: 'linear-gradient(135deg, #472a2a 0%, #7a3e3e 100%)',
      isLocked: true,
      lockReason: 'Unlock at OVR 75+',
    },
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#0a0a0a',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background layers */}
      <AnimatedStadiumBackground />
      <CinematicDepthLayer />
      <AmbientSoundLayer volume={0.2} enabled={true} />

      {/* Main content container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Club Name */}
          <div style={{ color: '#ffd700', fontSize: '28px', fontWeight: 'bold' }}>
            🏟️ Your Club Name
          </div>

          {/* Currency Display */}
          <PremiumCurrencyDisplay coins={coins} diamonds={diamonds} />
        </div>

        {/* Center Section - Player Presence + Greeting */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '60px',
            marginBottom: '40px',
          }}
        >
          {/* Live Player */}
          <LivePlayerPresence />

          {/* Welcome Info */}
          <div style={{ color: '#fff', flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '36px', marginBottom: '12px', color: '#ffd700' }}>
              Welcome Back!
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
              Your squad is ready. Let's compete today.
            </p>

            {/* Info cards with glow */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
              <GlowAccent intensity="low">
                <div
                  style={{
                    background: 'rgba(255, 215, 0, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 215, 0, 0.2)',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ color: '#ffd700', fontWeight: 'bold' }}>Current Form</div>
                  <div style={{ color: '#fff' }}>Peak Condition</div>
                </div>
              </GlowAccent>

              <GlowAccent intensity="low" color="#00ff00">
                <div
                  style={{
                    background: 'rgba(0, 255, 0, 0.1)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                    fontSize: '14px',
                  }}
                >
                  <div style={{ color: '#00ff00', fontWeight: 'bold' }}>Squad Morale</div>
                  <div style={{ color: '#fff' }}>Excellent</div>
                </div>
              </GlowAccent>
            </div>
          </div>

          {/* OVR Badge */}
          <OVRBadge value={87} size="large" />
        </div>

        {/* Mode Selection Grid */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#ffd700', fontSize: '18px', marginBottom: '16px' }}>
            Select Game Mode
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {gameModes.map((mode) => (
              <PremiumModeCard
                key={mode.title}
                title={mode.title}
                description={mode.description}
                icon={mode.icon}
                gradient={mode.gradient}
                isLocked={mode.isLocked}
                lockReason={mode.lockReason}
                onClick={() => {
                  playClickSound(800, 100);
                  setSelectedMode(mode.title);
                  setIsPanelOpen(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            marginTop: 'auto',
          }}
        >
          {/* Event Icons */}
          <EventIcon
            icon="🎁"
            label="Daily Reward"
            count={1}
            isNew={true}
            onClick={() => {
              playSuccessSound();
              alert('Daily reward claimed!');
            }}
          />

          {/* Notifications */}
          <EventIcon icon="📬" label="Messages" count={3} />

          {/* Achievements */}
          <EventIcon icon="🏅" label="Achievements" />

          {/* Settings */}
          <EventIcon
            icon="⚙️"
            label="Settings"
            onClick={() => {
              playClickSound(600, 80);
              setIsPanelOpen(true);
            }}
          />
        </div>
      </div>

      {/* Play Button Center */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '40px',
          zIndex: 20,
        }}
      >
        <PremiumPlayButton
          onClick={() => {
            playSuccessSound();
            if (selectedMode) {
              alert(`Starting ${selectedMode}...`);
            }
          }}
        />
      </div>

      {/* Modal Panel Example */}
      <PanelOpenEffect isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} direction="right">
        <ModalPanel title="Game Mode Details" onClose={() => setIsPanelOpen(false)}>
          <div style={{ color: '#fff' }}>
            {selectedMode ? (
              <>
                <h3 style={{ color: '#ffd700', marginTop: 0 }}>{selectedMode}</h3>
                <p>
                  This is where you can display detailed information about the selected game mode,
                  including rewards, difficulty, and entry requirements.
                </p>

                {/* Achievement badges in modal */}
                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                  <AchievementBadge
                    icon="⭐"
                    title="First Win"
                    isUnlocked={true}
                  />
                  <AchievementBadge
                    icon="🔥"
                    title="Hot Streak"
                    progress={60}
                    isUnlocked={false}
                  />
                </div>

                <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      playSuccessSound();
                      setCoins(coins + 100);
                      alert('Entry successful!');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    Enter Mode
                  </button>
                  <button
                    onClick={() => {
                      playClickSound(600, 80);
                      setIsPanelOpen(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p>Select a game mode to see details.</p>
            )}
          </div>
        </ModalPanel>
      </PanelOpenEffect>
    </div>
  );
};

/**
 * IMPLEMENTATION CHECKLIST
 *
 * ✅ Component 1: AnimatedStadiumBackground - Canvas-based animated background with particles
 * ✅ Component 2: CinematicDepthLayer - Vignette, spotlight, and pulse effects
 * ✅ Component 3: PremiumButtons - Play button with breathing + shine animations
 * ✅ Component 4: PremiumCurrencyDisplay - Animated currency with shine/bounce
 * ✅ Component 5: LivePlayerPresence - Player silhouette with rim light and floating
 * ✅ Component 6: PremiumModeCard - Mode selection cards with lock states
 * ✅ Component 7: AmbientSoundLayer - Web Audio API ambient + click/success sounds
 * ✅ Component 8: PanelEffects - Slide-in modal and side panel animations
 * ✅ Component 9: PremiumGlowAccents - Glow effects, event icons, OVR badge, achievements
 * ✅ Component 10: GRAPHICS_INTEGRATION_GUIDE - This file
 *
 * AUDIO CONTEXT USAGE:
 * - playClickSound(frequency, duration) - UI interaction feedback
 * - playSuccessSound() - Positive action confirmation
 * - playErrorSound() - Error/invalid action feedback
 * - AmbientSoundLayer component - Continuous ambient atmosphere
 *
 * ANIMATION PERFORMANCE:
 * - Canvas animations use requestAnimationFrame (60fps)
 * - CSS transitions use cubic-bezier for smooth easing
 * - Glow effects use CSS filters for GPU acceleration
 * - All SVG animations are hardware-accelerated
 *
 * NEXT STEPS FOR FULL INTEGRATION:
 * 1. Import this component into MainMenu.tsx
 * 2. Replace existing menu background and UI elements
 * 3. Connect game mode selection to actual game routes
 * 4. Link currency display to game state (Zustand store)
 * 5. Integrate notifications and daily rewards system
 * 6. Add analytics for UI interaction tracking
 * 7. Deploy with performance monitoring
 */
