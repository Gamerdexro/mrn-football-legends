import { useRef, useEffect } from 'react';
import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMatchStore } from '../../store/useMatchStore';
import { useGameStore } from '../../store/useGameStore';

type AIRole = 'DEFENDER' | 'MIDFIELDER' | 'ATTACKER';

type AIPlayerProps = {
    startPos?: [number, number, number];
    role?: AIRole;
};

// Reusable vector to avoid GC
const tempHomePos = new Vector3();
const tempToHome = new Vector3();
const tempToBall = new Vector3();

export const AIPlayer = ({ startPos = [10, 1, 0], role = 'DEFENDER' }: AIPlayerProps) => {
    const { ballState, ballPosition, setDefenderPosition, setBallOwnership } = useMatchStore();
    const aiDifficulty = useGameStore(state => state.settings.aiDifficulty);
    
    const [, api] = useSphere(() => ({
        mass: 70,
        position: [startPos[0], 1, startPos[2]],
        args: [0.5],
        linearDamping: 0.9,
        fixedRotation: true,
        material: { friction: 0.0, restitution: 0.0 }
    }));

    const pos = useRef(new Vector3(startPos[0], startPos[1], startPos[2]));
    const velocity = useRef(new Vector3(0, 0, 0));
    const targetVelocity = useRef(new Vector3(0, 0, 0));
    const hasBallRef = useRef(false);
    const lastTick = useRef(0);
    const isSleeping = useRef(false);
    
    // Config based on difficulty
    const config = useRef({
        aggression: 0.9,
        maxSpeed: 4,
        anticipation: 0.9,
        lateralNoise: 0.4
    });

    useEffect(() => {
        if (aiDifficulty === 'BEGINNER') {
            config.current = { aggression: 0.6, maxSpeed: 2.5, anticipation: 0.5, lateralNoise: 1 };
        } else if (aiDifficulty === 'ADVANCED') {
            config.current = { aggression: 1.2, maxSpeed: 5, anticipation: 1.2, lateralNoise: 0.25 };
        }
    }, [aiDifficulty]);
    
    useEffect(() => {
        const unsubscribe = api.position.subscribe((v) => {
            pos.current.set(v[0], v[1], v[2]);
            // Only update store occasionally or if significant change to save react renders? 
            // Actually setDefenderPosition might be triggering frequent state updates. 
            // Let's debounce this in the store or just accept it for now as it's needed for rendering UI indicators?
            // If this is just for minimap/logic, maybe we throttle it?
            // For now, keep it but be aware.
            setDefenderPosition([v[0], v[1], v[2]]);
        });
        return unsubscribe;
    }, [api.position, setDefenderPosition]);

    useFrame((state, delta) => {
        const now = state.clock.getElapsedTime();
        const dt = Math.min(delta, 0.05);

        // --- AI TICK (Logic updates 5 times per second) ---
        if (now - lastTick.current > 0.2) {
            lastTick.current = now;
            
            const currentPos = pos.current;
            tempHomePos.set(startPos[0], startPos[1], startPos[2]);
            
            // Ball position vector
            const ballPosX = ballPosition[0];
            const ballPosZ = ballPosition[2];

            if (ballState !== 'IN_PLAY') {
                // Return to home position
                tempToHome.copy(tempHomePos).sub(currentPos);
                const distHome = tempToHome.length();

                if (distHome < 0.2) {
                    targetVelocity.current.set(0, 0, 0);
                } else {
                    tempToHome.normalize();
                    const targetSpeed = Math.min(config.current.maxSpeed * 0.7, distHome * 1.5);
                    targetVelocity.current.copy(tempToHome).multiplyScalar(targetSpeed);
                }
            } else {
                // Chase ball logic
                tempToBall.set(ballPosX, 1, ballPosZ).sub(currentPos);
                const distToBall = tempToBall.length();
                const hasBall = distToBall < 2;

                if (hasBall && !hasBallRef.current) {
                    setBallOwnership('AWAY', `AI_${role}`);
                }
                hasBallRef.current = hasBall;

                // Simple Chase Logic for now (can be expanded)
                if (distToBall < 45) {
                     // Pressing
                     tempToBall.normalize();
                     const pressSpeed = config.current.maxSpeed * config.current.aggression;
                     targetVelocity.current.copy(tempToBall).multiplyScalar(pressSpeed);
                } else {
                    // Return home if ball too far
                    tempToHome.copy(tempHomePos).sub(currentPos);
                    tempToHome.normalize();
                    targetVelocity.current.copy(tempToHome).multiplyScalar(config.current.maxSpeed * 0.5);
                }
            }
        }

        // --- PHYSICS UPDATE (Every Frame) ---
        // Interpolate velocity for smoothness
        velocity.current.lerp(targetVelocity.current, 4 * dt);
        
        // Physics Sleep/Wake Optimization
        const speed = velocity.current.length();
        if (speed < 0.1 && !isSleeping.current) {
             // If very slow, set to 0 and maybe sleep?
             // api.sleep() is available in some versions, but let's just set velocity to 0 to stop calculation drift
             api.velocity.set(0, 0, 0);
             // isSleeping.current = true; // Use with caution
        } else {
             // isSleeping.current = false;
             // api.wakeUp();
             api.velocity.set(velocity.current.x, 0, velocity.current.z);
        }
    });

    return null;
};
