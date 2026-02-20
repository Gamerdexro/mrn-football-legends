import React, { useState } from 'react';

// Premium Mode Selection Card

export const PremiumModeCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  gradient: string;
  onClick: () => void;
  isLocked?: boolean;
  lockReason?: string;
}> = ({ title, description, icon, gradient, onClick, isLocked = false, lockReason = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isLocked && onClick()}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        opacity: isLocked ? 0.6 : 1,
        transform: isHovered && !isLocked ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Background with gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: gradient,
          opacity: 0.6,
          zIndex: 1,
        }}
      />

      {/* Dark overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 2,
          transition: 'all 0.3s ease',
          opacity: isHovered && !isLocked ? 0.2 : 0.4,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '200px',
          color: '#fff',
        }}
      >
        <div>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{icon}</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)' }}>
            {description}
          </p>
        </div>

        {/* Animated underline */}
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, transparent, #ffd700, transparent)',
            width: '100%',
            animation: isHovered && !isLocked ? 'underlineGlow 1s ease infinite' : 'none',
            opacity: isHovered && !isLocked ? 1 : 0.3,
          }}
        />
      </div>

      {/* Lock icon for locked modes */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div style={{ fontSize: '32px' }}>🔒</div>
          {lockReason && (
            <div style={{ fontSize: '12px', textAlign: 'center', color: '#ffd700' }}>
              {lockReason}
            </div>
          )}
        </div>
      )}

      {/* Glow on hover */}
      {isHovered && !isLocked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(255, 215, 0, 0.2) 0%, transparent 70%)',
            zIndex: 5,
            pointerEvents: 'none',
            animation: 'glowPulse 1.5s ease infinite',
          }}
        />
      )}

      <style>{`
        @keyframes underlineGlow {
          0%, 100% { opacity: 0.5; width: 30%; }
          50% { opacity: 1; width: 100%; }
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};
