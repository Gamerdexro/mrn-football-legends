import React, { useEffect, useRef, useState } from 'react';

// Ambient Sound Layer with Web Audio API

export const AmbientSoundLayer: React.FC<{ volume?: number; enabled?: boolean }> = ({
  volume = 0.3,
  enabled = true,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!enabled) {
      // Stop audio if disabled
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      oscillatorsRef.current = [];
      gainsRef.current = [];
      setIsActive(false);
      return;
    }

    // Initialize Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    const masterGain = audioContext.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(audioContext.destination);

    // Stadium ambience - low frequency hum
    const stadiumOsc = audioContext.createOscillator();
    stadiumOsc.type = 'sine';
    stadiumOsc.frequency.value = 55; // Low frequency for stadium rumble
    const stadiumGain = audioContext.createGain();
    stadiumGain.gain.value = 0.08;
    stadiumOsc.connect(stadiumGain);
    stadiumGain.connect(masterGain);
    stadiumOsc.start();
    oscillatorsRef.current.push(stadiumOsc);
    gainsRef.current.push(stadiumGain);

    // Wind layer - modulated high frequency
    const windOsc = audioContext.createOscillator();
    windOsc.type = 'triangle';
    windOsc.frequency.value = 180;
    const windGain = audioContext.createGain();
    windGain.gain.value = 0.04;
    windOsc.connect(windGain);
    windGain.connect(masterGain);

    // Modulate wind frequency for realistic effect
    const modulator = audioContext.createOscillator();
    modulator.frequency.value = 0.5; // Slow modulation
    const modulatorGain = audioContext.createGain();
    modulatorGain.gain.value = 30; // Frequency variation range
    modulator.connect(modulatorGain);
    modulatorGain.connect(windOsc.frequency);
    modulator.start();
    windOsc.start();
    oscillatorsRef.current.push(windOsc, modulator);
    gainsRef.current.push(windGain, modulatorGain);

    // Crowd murmur - subtle background texture
    const crowdOsc = audioContext.createOscillator();
    crowdOsc.type = 'sawtooth';
    crowdOsc.frequency.value = 120;
    const crowdGain = audioContext.createGain();
    crowdGain.gain.value = 0.03;
    crowdOsc.connect(crowdGain);
    crowdGain.connect(masterGain);
    crowdOsc.start();
    oscillatorsRef.current.push(crowdOsc);
    gainsRef.current.push(crowdGain);

    setIsActive(true);

    return () => {
      oscillatorsRef.current.forEach((osc) => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      oscillatorsRef.current = [];
      gainsRef.current = [];
    };
  }, [enabled, volume]);

  // UI toggle button
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      <button
        onClick={() => {
          if (audioContextRef.current) {
            if (isActive) {
              audioContextRef.current.suspend();
            } else {
              audioContextRef.current.resume();
            }
            setIsActive(!isActive);
          }
        }}
        style={{
          background: isActive
            ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
            : 'linear-gradient(135deg, #666, #999)',
          border: 'none',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          boxShadow: isActive ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
          transition: 'all 0.3s ease',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
        }}
        title={isActive ? 'Ambient Sound On' : 'Ambient Sound Off'}
      >
        {isActive ? '🔊' : '🔇'}
      </button>
    </div>
  );
};

// UI Click Sound Effect
export const playClickSound = (frequency: number = 800, duration: number = 100) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.05;
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (e) {
    // Audio disabled or not supported
  }
};

// Success/Positive Sound
export const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const notes = [800, 1000, 1200];
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.05;

      const startTime = audioContext.currentTime + (index * 100) / 1000;
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    });
  } catch (e) {
    // Audio disabled or not supported
  }
};

// Error/Negative Sound
export const playErrorSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    const notes = [600, 400];
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.05;

      const startTime = audioContext.currentTime + (index * 80) / 1000;
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  } catch (e) {
    // Audio disabled or not supported
  }
};
