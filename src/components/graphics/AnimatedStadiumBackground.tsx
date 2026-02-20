import React, { useEffect, useRef } from 'react';

// Animated Stadium Background with Depth and Motion

export const AnimatedStadiumBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; opacity: number }>>([]);
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles (dust)
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3,
      });
    }

    const animate = () => {
      timeRef.current += 0.01;

      // Clear canvas
      ctx.fillStyle = '#0f1620';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Radial gradient (stadium feel)
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
      );
      gradient.addColorStop(0, 'rgba(30, 60, 100, 0.4)');
      gradient.addColorStop(0.5, 'rgba(15, 22, 32, 0.6)');
      gradient.addColorStop(1, 'rgba(5, 10, 20, 0.8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dual ambient lighting
      const lightGradient1 = ctx.createLinearGradient(
        canvas.width * 0.8,
        canvas.height * 0.2,
        canvas.width * 0.2,
        canvas.height * 0.8
      );
      lightGradient1.addColorStop(0, 'rgba(135, 206, 235, 0.08)'); // Blue top-right
      lightGradient1.addColorStop(1, 'rgba(255, 215, 0, 0.08)'); // Gold bottom-left

      ctx.fillStyle = lightGradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moving diagonal light sweep (slow)
      const sweepX = Math.sin(timeRef.current * 0.3) * canvas.width * 0.3;
      const sweepGradient = ctx.createLinearGradient(
        sweepX,
        -canvas.height,
        sweepX + 200,
        canvas.height * 2
      );
      sweepGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      sweepGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = sweepGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Camera drift effect
      cameraOffsetRef.current.x = Math.sin(timeRef.current * 0.05) * 30;
      cameraOffsetRef.current.y = Math.cos(timeRef.current * 0.04) * 30;

      // Draw and update particles (dust)
      ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
      for (const particle of particlesRef.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.globalAlpha = particle.opacity * 0.15;
        ctx.fillRect(particle.x, particle.y, 2, 2);
      }
      ctx.globalAlpha = 1;

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
        zIndex: 0,
      }}
    />
  );
};
