import React, { useState, useEffect } from 'react';

interface IntroSceneProps {
    onComplete: () => void;
}

type IntroPhase = 'LOGO_SEQUENCE' | 'DISCLAIMER' | 'LOADING' | 'COMPLETE';

export const IntroScene: React.FC<IntroSceneProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<IntroPhase>('LOGO_SEQUENCE');
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
        // Phase 1: Logo Animation (5s)
        const logoTimer = setTimeout(() => {
            setPhase('DISCLAIMER');
        }, 5000);

        return () => clearTimeout(logoTimer);
    }, []);

    useEffect(() => {
        if (phase === 'DISCLAIMER') {
            // Phase 2: Disclaimer (2s)
            const disclaimerTimer = setTimeout(() => {
                setPhase('LOADING');
            }, 2500); // 2.5s for readability
            return () => clearTimeout(disclaimerTimer);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'LOADING') {
            // Phase 3: Fake Smart Loading
            const interval = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev >= 100) return 100;
                    
                    // Curve: Fast start, slow middle, fast end
                    if (prev < 30) return prev + 2;
                    if (prev < 70) return prev + 0.5; // Simulate heavy assets
                    if (prev < 90) return prev + 1;
                    if (prev < 99) return prev + 0.2; // The "99%" pause
                    return prev;
                });
            }, 50);

            // Force complete safety net
            const safetyTimer = setTimeout(() => {
                setLoadingProgress(100);
            }, 6000);

            return () => {
                clearInterval(interval);
                clearTimeout(safetyTimer);
            };
        }
    }, [phase]);

    useEffect(() => {
        if (loadingProgress >= 100) {
            const timer = setTimeout(() => {
                onComplete();
            }, 500); // Quick pause at 100%
            return () => clearTimeout(timer);
        }
    }, [loadingProgress, onComplete]);

    if (phase === 'LOGO_SEQUENCE') {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden text-white select-none">
                <div className="absolute inset-0 z-0">
                     <div className="absolute inset-0 bg-[url('/img/menu_bg.jpg')] bg-cover bg-center animate-subtle-zoom opacity-40 grayscale" />
                     <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80" />
                </div>

                <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
                    <div className="relative">
                        <picture>
                            <source srcSet="/img/mrn-football-legends-logo.webp" type="image/webp" />
                            <img
                                src="/img/mrn-football-legends-logo.jpg"
                                alt="MRN Football Legends"
                                className="w-40 h-40 mb-6 drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-xl object-contain"
                            />
                        </picture>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-shine pointer-events-none" />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent text-center px-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                        MRN FOOTBALL LEGENDS
                    </h1>
                    <p className="text-center text-[10px] text-gray-400 mt-3 tracking-[0.4em] uppercase animate-fade-in" style={{ animationDelay: '1s' }}>
                        The Ultimate Simulation
                    </p>
                </div>
            </div>
        );
    }

    if (phase === 'DISCLAIMER') {
        return (
            <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white select-none animate-fade-in">
                <div className="px-8 text-center max-w-lg">
                    <p className="text-xs md:text-sm text-gray-500 font-mono leading-relaxed">
                        This is a fictional simulation. All players, teams, faces, and names are entirely generated.
                        <br /><br />
                        Any resemblance to real persons, living or dead, is purely coincidental.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden text-white select-none">
             <div className="absolute inset-0 z-0">
                 <div className="absolute inset-0 bg-[url('/img/loading_bg_new.png')] bg-cover bg-center" />
            </div>

            <div className="relative z-10 w-full max-w-md px-12 flex flex-col items-center">
                <img
                    src="/logo.svg"
                    alt="MRN Football Legends"
                    className="w-20 h-20 mb-8 opacity-90 rounded-lg object-contain"
                />
                
                {/* Loading Bar */}
                <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `${loadingProgress}%` }}
                    />
                </div>
                
                <div className="mt-4 flex justify-between w-full text-[9px] text-emerald-500/60 font-mono tracking-widest">
                    <span>{loadingProgress < 100 ? 'INITIALIZING SYSTEM...' : 'READY'}</span>
                    <span>{Math.floor(loadingProgress)}%</span>
                </div>

                
            </div>
        </div>
    );
};
