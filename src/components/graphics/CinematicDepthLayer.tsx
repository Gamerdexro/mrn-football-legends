import React, { useEffect, useRef } from 'react';

// Cinematic Depth Layer with Vignette, Spotlight, and Pulse

export const CinematicDepthLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      timeRef.current += 0.01;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Vignette (dark edges)
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.3,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.9
      );
      vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');

      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center spotlight glow
      const spotlightPulse = Math.sin(timeRef.current * 2) * 0.1 + 0.9; // 0.8 to 1.0
      const spotGradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        50,
        canvas.width / 2,
        canvas.height / 2,
        400
      );
      spotGradient.addColorStop(0, `rgba(255, 255, 200, ${0.15 * spotlightPulse})`);
      spotGradient.addColorStop(0.5, `rgba(200, 150, 50, ${0.05 * spotlightPulse})`);
      spotGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = spotGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle animated brightness pulse (5-7 sec loop)
      const pulseBrightness = Math.sin(timeRef.current * 0.15) * 0.05 + 1;
      ctx.fillStyle = `rgba(255, 255, 255, ${(pulseBrightness - 1) * 0.05})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    />
  );
};
