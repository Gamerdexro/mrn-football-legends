import React, { useEffect, useRef } from 'react';

// Live Player Presence with Silhouette, Floating Motion, Rim Light

export const LivePlayerPresence: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const animate = () => {
      timeRef.current += 0.01;

      if (containerRef.current) {
        // Slow idle floating motion
        const floatY = Math.sin(timeRef.current * 0.5) * 20;
        const floatX = Math.cos(timeRef.current * 0.3) * 10;

        containerRef.current.style.transform = `translate(${floatX}px, ${floatY}px)`;
      }

      requestAnimationFrame(animate);
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '280px',
        height: '420px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        transition: 'transform 0.05s linear',
      }}
    >
      {/* Rim Light Glow Behind Player */}
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(135, 206, 235, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'rimLightPulse 4s ease-in-out infinite',
        }}
      />

      {/* Player Silhouette */}
      <svg
        viewBox="0 0 200 300"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          zIndex: 1,
          filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))',
        }}
      >
        {/* Player silhouette shape (football player in action pose) */}
        {/* Head */}
        <circle cx="100" cy="50" r="18" fill="rgba(100, 150, 200, 0.9)" />

        {/* Body */}
        <rect x="85" y="70" width="30" height="40" rx="8" fill="rgba(80, 120, 180, 0.9)" />

        {/* Arms */}
        <ellipse cx="65" cy="85" rx="12" ry="25" fill="rgba(90, 130, 190, 0.85)" transform="rotate(-30 65 85)" />
        <ellipse cx="135" cy="80" rx="12" ry="28" fill="rgba(90, 130, 190, 0.85)" transform="rotate(40 135 80)" />

        {/* Legs */}
        <ellipse cx="85" cy="140" rx="10" ry="50" fill="rgba(70, 110, 170, 0.9)" />
        <ellipse cx="115" cy="155" rx="10" ry="55" fill="rgba(70, 110, 170, 0.9)" transform="rotate(25 115 155)" />

        {/* Soccer ball */}
        <circle cx="145" cy="100" r="12" fill="rgba(255, 255, 255, 0.8)" />
        <circle cx="145" cy="100" r="12" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="1" />
      </svg>

      {/* Shadow Under Feet */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          width: '150px',
          height: '30px',
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.4) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(8px)',
        }}
      />

      {/* Glow accents on jersey number */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
        }}
      >
        7
      </div>

      <style>{`
        @keyframes rimLightPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
