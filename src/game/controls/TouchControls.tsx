import React, { useRef, useState, useEffect } from 'react';
import { useControlStore } from './useControlStore';

export const TouchControls: React.FC = () => {
    const { updateInput } = useControlStore();
    
    // Joystick State
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const [isJoystickActive, setIsJoystickActive] = useState(false);
    const joystickOrigin = useRef<{ x: number, y: number } | null>(null);

    // Action State
    const actionStartRef = useRef<{ x: number, y: number, time: number } | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);

    // Feedback Timer
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 1000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const showFeedback = (text: string) => {
        setFeedback(text);
    };

    // --- Joystick Logic (Left Side) ---
    const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Only prevent default if it's a touch event to avoid blocking mouse clicks elsewhere if needed,
        // but here we are covering the left half.
        if (e.cancelable) e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        joystickOrigin.current = { x: clientX, y: clientY };
        setIsJoystickActive(true);
        setJoystickPos({ x: 0, y: 0 });
    };

    const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (e.cancelable) e.preventDefault();
        if (!isJoystickActive || !joystickOrigin.current) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const deltaX = clientX - joystickOrigin.current.x;
        const deltaY = clientY - joystickOrigin.current.y;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxRadius = window.innerWidth * 0.12; 
        const deadzone = maxRadius * 0.18;

        let x = deltaX;
        let y = deltaY;

        if (distance > maxRadius) {
            const angle = Math.atan2(deltaY, deltaX);
            x = Math.cos(angle) * maxRadius;
            y = Math.sin(angle) * maxRadius;
        }

        setJoystickPos({ x, y });

        // Normalize Input
        const normalizedDist = Math.max(0, distance - deadzone) / (maxRadius - deadzone);
        
        if (distance > deadzone) {
            updateInput({
                moveX: (x / distance) * normalizedDist,
                moveY: -(y / distance) * normalizedDist // Invert Y for game coords
            });
        } else {
            updateInput({ moveX: 0, moveY: 0 });
        }
    };

    const handleJoystickEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (e.cancelable) e.preventDefault();
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        updateInput({ moveX: 0, moveY: 0 });
        joystickOrigin.current = null;
    };

    // --- Action Logic (Right Side - Swipe) ---
    const handleActionStart = (e: React.TouchEvent | React.MouseEvent) => {
        if (e.cancelable) e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        actionStartRef.current = { x: clientX, y: clientY, time: performance.now() };
    };

    const handleActionEnd = (e: React.TouchEvent | React.MouseEvent) => {
        if (e.cancelable) e.preventDefault();
        if (!actionStartRef.current) return;

        let clientX, clientY;
        if ('changedTouches' in e) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const start = actionStartRef.current;
        const deltaX = clientX - start.x;
        const deltaY = clientY - start.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const duration = performance.now() - start.time;

        const maxSwipe = Math.max(window.innerWidth, window.innerHeight) * 0.6;
        const clampedDistance = Math.min(distance, maxSwipe);
        const basePower = maxSwipe > 0 ? clampedDistance / maxSwipe : 0;
        const speed = duration > 0 ? distance / duration : 0;
        const power = Math.max(0, Math.min(1, basePower * 0.7 + speed * 0.3));
        const angleRad = Math.atan2(-deltaY, deltaX);

        const MIN_SWIPE_DIST = 30;

        if (distance < MIN_SWIPE_DIST) {
            // TAP
            if (duration < 200) {
                updateInput({ actionA: true, passPower: 0.4, swipeAngle: 0 });
                showFeedback('PASS');
                setTimeout(() => updateInput({ actionA: false, passPower: 0, swipeAngle: 0 }), 100);
            } else {
                updateInput({ actionD: true, passPower: 0.7, swipeAngle: 0 });
                showFeedback('THROUGH');
                setTimeout(() => updateInput({ actionD: false, passPower: 0, swipeAngle: 0 }), 100);
            }
        } else {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Determine Direction
            // -45 to 45: RIGHT
            // 45 to 135: DOWN
            // 135 to 180 or -180 to -135: LEFT
            // -135 to -45: UP

            if (angle > -45 && angle <= 45) {
                updateInput({ actionA: true, passPower: power, swipeAngle: angleRad });
                showFeedback('PASS');
                setTimeout(() => updateInput({ actionA: false, passPower: 0, swipeAngle: 0 }), 200);
            } else if (angle > 45 && angle <= 135) {
                updateInput({ actionC: true, passPower: power * 0.9, swipeAngle: angleRad });
                showFeedback('LOB');
                setTimeout(() => updateInput({ actionC: false, passPower: 0, swipeAngle: 0 }), 200);
            } else if (angle > -135 && angle <= -45) {
                updateInput({ actionB: true, shotPower: power, swipeAngle: angleRad });
                showFeedback('SHOOT');
                setTimeout(() => updateInput({ actionB: false, shotPower: 0, swipeAngle: 0 }), 200);
            } else {
                updateInput({ skillMove: 'LANE_CHANGE', swipeAngle: angleRad });
                showFeedback('SKILL');
                setTimeout(() => updateInput({ skillMove: 'NONE', swipeAngle: 0 }), 200);
            }
        }
        
        actionStartRef.current = null;
    };

    return (
        <div className="absolute inset-0 z-50 pointer-events-none select-none overflow-hidden">
            {/* Left Zone - Movement (Invisible Joystick) */}
            <div 
                className="absolute top-0 bottom-0 left-0 w-1/2 pointer-events-auto"
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
                onMouseDown={handleJoystickStart}
                onMouseMove={handleJoystickMove}
                onMouseUp={handleJoystickEnd}
                onMouseLeave={handleJoystickEnd}
            >
                {/* Visual Feedback for Joystick */}
                {isJoystickActive && joystickOrigin.current && (
                    <div 
                        className="absolute w-32 h-32 rounded-full border-2 border-white/20 bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ 
                            left: joystickOrigin.current.x, 
                            top: joystickOrigin.current.y 
                        }}
                    >
                        <div 
                            className="absolute w-12 h-12 rounded-full bg-white/40 shadow-lg -translate-x-1/2 -translate-y-1/2"
                            style={{ 
                                left: '50%', 
                                top: '50%',
                                transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Right Zone - Action (Swipe) */}
            <div 
                className="absolute top-0 bottom-0 right-0 w-1/2 pointer-events-auto"
                onTouchStart={handleActionStart}
                onTouchEnd={handleActionEnd}
                onMouseDown={handleActionStart}
                onMouseUp={handleActionEnd}
            >
                 {/* Visual Hint for Zones */}
                 <div className="absolute bottom-10 right-10 opacity-20 text-white text-[10px] pointer-events-none">
                    <div className="flex flex-col items-center gap-1">
                        <span>SHOOT (UP)</span>
                        <div className="flex gap-4">
                            <span>SKILL (LEFT)</span>
                            <span className="font-bold border border-white rounded-full w-8 h-8 flex items-center justify-center">TAP</span>
                            <span>PASS (RIGHT)</span>
                        </div>
                        <span>LOB (DOWN)</span>
                    </div>
                 </div>
            </div>

            {/* Action Feedback Overlay */}
            {feedback && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-4xl font-black italic text-white drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] animate-bounce pointer-events-none">
                    {feedback}
                </div>
            )}
        </div>
    );
};
