import React, { useState } from 'react';

// Premium Glow Accents for Event Icons, Badges, and UI Elements

export const GlowAccent: React.FC<{
  children: React.ReactNode;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  pulseSpeed?: 'slow' | 'normal' | 'fast';
  onClick?: () => void;
}> = ({ children, color = '#ffd700', intensity = 'medium', pulseSpeed = 'normal', onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const pulseKeyframes =
    pulseSpeed === 'slow'
      ? '3s'
      : pulseSpeed === 'fast'
        ? '1s'
        : '2s';

  const glowIntensityNumber =
    intensity === 'low' ? 0.3 : intensity === 'high' ? 0.6 : 0.4;
  const glowIntensity = glowIntensityNumber.toString();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Glow layer */}
      <div
        style={{
          position: 'absolute',
          inset: '-8px',
          background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
          borderRadius: '50%',
          opacity: isHovered ? glowIntensityNumber : glowIntensityNumber * 0.5,
          filter: `blur(8px)`,
          animation: `glowPulse ${pulseKeyframes} ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          inset: '-4px',
          border: `2px solid ${color}`,
          borderRadius: '50%',
          opacity: isHovered ? 0.4 : 0.1,
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
          boxShadow: `0 0 16px ${color}`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s ease',
          transform: isHovered ? 'scale(1.08)' : 'scale(1)',
          filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none',
        }}
      >
        {children}
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% {
            opacity: ${glowIntensityNumber * 0.5};
            filter: blur(8px);
          }
          50% {
            opacity: ${glowIntensity};
            filter: blur(12px);
          }
        }
      `}</style>
    </div>
  );
};

// Event Icon with Badge
export const EventIcon: React.FC<{
  icon: string;
  label: string;
  count?: number;
  isNew?: boolean;
  onClick?: () => void;
}> = ({ icon, label, count = 0, isNew = false, onClick }) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={onClick}
    >
      <GlowAccent color="#ffd700" intensity="high" pulseSpeed="slow">
        <div
          style={{
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 215, 0, 0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          {icon}
        </div>
      </GlowAccent>

      {/* Badge */}
      {(count > 0 || isNew) && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: isNew ? '#ff4757' : '#ffd700',
            color: isNew ? '#fff' : '#000',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: `0 0 12px ${isNew ? '#ff4757' : '#ffd700'}`,
            animation: 'badgePulse 1s ease infinite',
          }}
        >
          {isNew ? '!' : count}
        </div>
      )}

      <label style={{ fontSize: '12px', color: '#fff', textAlign: 'center', maxWidth: '60px' }}>
        {label}
      </label>

      <style>{`
        @keyframes badgePulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
};

// OVR Badge (Overall Rating)
export const OVRBadge: React.FC<{
  value: number;
  maxValue?: number;
  size?: 'small' | 'medium' | 'large';
}> = ({ value, maxValue = 99, size = 'medium' }) => {
  const percentage = (value / maxValue) * 100;

  const sizeConfig = {
    small: { width: '40px', fontSize: '16px' },
    medium: { width: '60px', fontSize: '24px' },
    large: { width: '80px', fontSize: '32px' },
  };

  const config = sizeConfig[size];

  const getColor = (percent: number) => {
    if (percent >= 90) return '#ffd700';
    if (percent >= 80) return '#00ff00';
    if (percent >= 70) return '#00aaff';
    if (percent >= 60) return '#ff6b00';
    return '#ff4757';
  };

  const color = getColor(percentage);

  return (
    <div
      style={{
        position: 'relative',
        width: config.width,
        height: config.width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Circular progress background */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
        }}
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255, 215, 0, 0.1)"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${(percentage / 100) * 282.7} 282.7`}
          opacity="0.8"
          style={{
            transition: 'stroke-dasharray 0.5s ease',
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>

      {/* Value */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color,
          textShadow: `0 0 8px ${color}`,
        }}
      >
        {value}
      </div>

      <style>{`
        @keyframes ovrGlow {
          0%, 100% {
            filter: drop-shadow(0 0 4px ${color});
          }
          50% {
            filter: drop-shadow(0 0 8px ${color});
          }
        }
      `}</style>
    </div>
  );
};

// Achievement Badge
export const AchievementBadge: React.FC<{
  icon: string;
  title: string;
  progress?: number;
  isUnlocked?: boolean;
  onClick?: () => void;
}> = ({ icon, title, progress = 100, isUnlocked = true, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <GlowAccent color={isUnlocked ? '#ffd700' : '#666'} intensity={isUnlocked ? 'high' : 'low'}>
        <div
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            background: isUnlocked
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.05))'
              : 'linear-gradient(135deg, rgba(100, 100, 100, 0.1), rgba(100, 100, 100, 0.05))',
            borderRadius: '16px',
            border: `1px solid ${isUnlocked ? 'rgba(255, 215, 0, 0.3)' : 'rgba(100, 100, 100, 0.2)'}`,
            opacity: isUnlocked ? 1 : 0.5,
          }}
        >
          {icon}
        </div>
      </GlowAccent>

      {/* Progress ring */}
      {!isUnlocked && progress < 100 && (
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            background: 'linear-gradient(90deg, #666, #999)',
            height: '4px',
            borderRadius: '2px',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }}
        />
      )}

      <label
        style={{
          fontSize: '12px',
          textAlign: 'center',
          maxWidth: '80px',
          color: isUnlocked ? '#ffd700' : '#999',
        }}
      >
        {title}
      </label>

      {!isUnlocked && progress < 100 && (
        <div style={{ fontSize: '10px', color: '#999' }}>{Math.round(progress)}%</div>
      )}
    </div>
  );
};
