import React, { useState } from 'react';

// Premium Play Button with Breathing Animation and Shine Sweep

export const PremiumPlayButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: 'relative',
          padding: '16px 48px',
          fontSize: '18px',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffa500 100%)',
          color: '#000',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          boxShadow: `0 0 30px rgba(255, 215, 0, ${isHovered ? 0.8 : 0.5})`,
          transition: 'all 0.3s ease',
          animation: 'breathing 3s ease-in-out infinite',
        }}
      >
        <span style={{ position: 'relative', zIndex: 2 }}>🎮 PLAY</span>

        {/* Inner glow effect */}
        <div
          style={{
            position: 'absolute',
            inset: '2px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Shine sweep animation */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
            animation: 'shineSweep 4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </button>

      <style>{`
        @keyframes breathing {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        @keyframes shineSweep {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// Glass Panel Component

export const GlassPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(30, 50, 80, 0.3)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 
                     inset 0 1px 1px rgba(255, 255, 255, 0.1),
                     0 0 20px rgba(135, 206, 235, ${isHovered ? 0.4 : 0.15})`,
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

// Premium Button with Micro Interactions

export const PremiumButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ children, onClick, variant = 'primary' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isPrimary = variant === 'primary';
  const gradientColors = isPrimary
    ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
    : 'linear-gradient(135deg, #87ceeb, #4db8ff)';
  const glowColor = isPrimary ? 'rgba(255, 215, 0, 0.4)' : 'rgba(135, 206, 235, 0.4)';

  const handleClick = () => {
    setIsPressed(true);
    // Play subtle tick sound
    if (window.AudioContext || (window as any).webkitAudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.1);
    }

    setTimeout(() => setIsPressed(false), 100);
    onClick();
  };

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      style={{
        padding: '10px 24px',
        borderRadius: '8px',
        border: 'none',
        background: gradientColors,
        color: '#000',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: `0 0 ${isHovered ? 20 : 10}px ${glowColor}`,
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        filter: `brightness(${isHovered ? 1.15 : 1})`,
      }}
    >
      {children}
    </button>
  );
};

