import { useBox } from '@react-three/cannon';
import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useMatchStore } from '../../store/useMatchStore';
import { emitMatchEvent, KeeperPersonality, KeeperDecisionDetail } from '../commentary/CommentaryEngine';

interface GoalkeeperProps {
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    personality?: KeeperPersonality;
    team?: 'HOME' | 'AWAY';
}

export const Goalkeeper = ({
    difficulty = 'MEDIUM',
    personality = 'SAFE_HANDS',
    team = 'AWAY'
}: GoalkeeperProps) => {
    // Goalkeeper starts at goal line center: 0, 1, -52.5 (assuming standard pitch size from Ball.tsx)
    // Wait, Pitch.tsx likely defines the goal position.
    // In Ball.tsx: Goal Lines are at +/- 52.7 X. Z is width?
    // Let's re-read Ball.tsx.
    // "Touch Lines (Throw-in) if Math.abs(z) > 34.2" -> Z is width (68m)
    // "Goal Lines if Math.abs(x) > 52.7" -> X is length (105m)
    // So goals are at X = +/- 52.5.
    // Penalty spot is usually 11m from goal line.
    // If goal is at X = -52.5, penalty spot is at X = -41.5.
    
    // Position: [X, Y, Z]
    // Goal center: [-52.5, 1, 0]
    
    const [ref, api] = useBox(() => ({
        mass: 10,
        position: [-52.0, 1.2, 0],
        args: [0.5, 2, 1],
        material: { friction: 0.0, restitution: 0.0 },
        fixedRotation: true
    }));

    const [hasDived, setHasDived] = useState(false);
    const { ballPosition, ballState, matchTime } = useMatchStore();
    const lastBallPos = useRef(new Vector3(ballPosition[0], ballPosition[1], ballPosition[2]));
    const ballVelocity = useRef(new Vector3(0, 0, 0));
    const keeperPos = useRef(new Vector3(-52.0, 1.2, 0));
    const lastDecisionTime = useRef(0);
    const lastDecisionDetail = useRef<KeeperDecisionDetail | null>(null);
    const showmanConfidence = useRef(0.5);
    
    useEffect(() => {
        const unsubPos = api.position.subscribe((v) => {
            keeperPos.current.set(v[0], v[1], v[2]);
        });
        return unsubPos;
    }, [api.position]);
    
    useEffect(() => {
        if (ballState === 'IN_PLAY') {
            return;
        }
        setHasDived(false);
        api.position.set(-52.0, 1.2, 0);
        api.velocity.set(0, 0, 0);
        api.rotation.set(0, 0, 0);
        if (lastDecisionDetail.current && personality === 'SHOWMAN') {
            if (ballState === 'GOAL') {
                showmanConfidence.current = Math.max(0.1, showmanConfidence.current - 0.35);
            } else {
                showmanConfidence.current = Math.min(1, showmanConfidence.current + 0.25);
            }
        }
        lastDecisionTime.current = 0;
        lastDecisionDetail.current = null;
    }, [ballState, api.position, api.velocity, api.rotation, personality]);

    const dive = (variant: 'REFLEX' | 'FULL' | 'HIGH', predictedZ: number, speed: number, distanceToLine: number) => {
        setHasDived(true);
        let baseOffsetRange = 3;

        if (personality === 'ANTICIPATOR') {
            baseOffsetRange += 1.5;
        } else if (personality === 'SAFE_HANDS') {
            baseOffsetRange *= 0.6;
        } else if (personality === 'SHOWMAN') {
            const swing = 0.5 + showmanConfidence.current;
            baseOffsetRange *= 0.8 + swing * 0.6;
        }

        let jitter = 0.7;
        if (personality === 'SAFE_HANDS') {
            jitter *= 0.5;
        } else if (personality === 'SHOWMAN') {
            jitter *= 1.4;
        }
        const aimOffset = (Math.random() - 0.5) * (baseOffsetRange + jitter);

        const targetZ = predictedZ + aimOffset;
        const diveDirection = targetZ >= 0 ? 1 : -1;

        let lateralPowerBase = 5;
        let jumpPowerBase = 2.2;

        if (variant === 'REFLEX') {
            lateralPowerBase *= 0.8;
            jumpPowerBase += 0.6;
            if (personality === 'SAFE_HANDS') {
                lateralPowerBase *= 0.9;
            }
        } else if (variant === 'HIGH') {
            lateralPowerBase *= 0.9;
            jumpPowerBase += 1.0;
            if (personality === 'SHOWMAN') {
                jumpPowerBase += 0.3;
            }
        } else {
            lateralPowerBase *= 1.1;
            if (personality === 'COMMANDER') {
                lateralPowerBase *= 0.95;
            }
        }

        const speedFactor = Math.max(0.8, Math.min(1.4, speed / 20));
        const distanceFactor = Math.max(0.8, Math.min(1.3, Math.abs(distanceToLine) / 12));

        const divePower = lateralPowerBase * speedFactor * distanceFactor;
        const jumpPower = jumpPowerBase + Math.random() * 0.6;

        api.velocity.set(0, jumpPower, diveDirection * divePower);
        api.rotation.set(diveDirection * Math.PI / 2, 0, 0);

        if (personality === 'ANTICIPATOR') {
            const detail: KeeperDecisionDetail = Math.abs(targetZ) < 4 ? 'ANTICIPATED_CORRECT' : 'ANTICIPATED_WRONG';
            lastDecisionDetail.current = detail;
            emitMatchEvent({
                id: `keeper-${Date.now()}`,
                kind: 'KEEPER_DECISION',
                minute: matchTime,
                pressure: 0.7,
                importance: matchTime >= 80 ? 0.8 : 0.5,
                team,
                keeperPersonality: personality,
                keeperDecisionDetail: detail
            });
        } else if (personality === 'COMMANDER') {
            lastDecisionDetail.current = 'POSITIONAL_SAVE';
            emitMatchEvent({
                id: `keeper-${Date.now()}`,
                kind: 'KEEPER_DECISION',
                minute: matchTime,
                pressure: 0.6,
                importance: matchTime >= 80 ? 0.7 : 0.4,
                team,
                keeperPersonality: personality,
                keeperDecisionDetail: 'POSITIONAL_SAVE'
            });
        } else if (personality === 'SAFE_HANDS') {
            lastDecisionDetail.current = 'SECURE_SAVE';
            emitMatchEvent({
                id: `keeper-${Date.now()}`,
                kind: 'KEEPER_DECISION',
                minute: matchTime,
                pressure: 0.5,
                importance: 0.4,
                team,
                keeperPersonality: personality,
                keeperDecisionDetail: 'SECURE_SAVE'
            });
        } else if (personality === 'SHOWMAN') {
            const highConfidence = showmanConfidence.current > 0.6;
            const detail: KeeperDecisionDetail = highConfidence ? 'SHOWMAN_HOT' : 'SHOWMAN_ERROR';
            lastDecisionDetail.current = detail;
            emitMatchEvent({
                id: `keeper-${Date.now()}`,
                kind: 'KEEPER_DECISION',
                minute: matchTime,
                pressure: 0.8,
                importance: matchTime >= 70 ? 0.75 : 0.5,
                team,
                keeperPersonality: personality,
                keeperDecisionDetail: detail
            });
        }
    };
    
    useFrame((_, delta) => {
        const dt = Math.max(delta, 0.016);

        const currentBall = new Vector3(ballPosition[0], ballPosition[1], ballPosition[2]);
        const prevBall = lastBallPos.current;

        const vx = (currentBall.x - prevBall.x) / dt;
        const vz = (currentBall.z - prevBall.z) / dt;

        ballVelocity.current.set(vx, 0, vz);
        lastBallPos.current.copy(currentBall);

        if (hasDived || ballState !== 'IN_PLAY') {
            return;
        }

        const goalX = -52.5;
        const ballX = currentBall.x;
        const movingTowardsGoal = vx < -4;
        const withinHorizontalWindow = ballX > goalX - 25 && ballX < goalX + 40;

        if (!movingTowardsGoal || !withinHorizontalWindow) {
            return;
        }

        const distanceToLine = goalX - ballX;
        if (distanceToLine >= 0) {
            return;
        }

        const timeToLine = distanceToLine / vx;
        if (timeToLine <= 0 || timeToLine > 2.5) {
            return;
        }

        const speed = Math.sqrt(vx * vx + vz * vz);

        const predictedZ = currentBall.z + vz * timeToLine;

        const highShot = currentBall.y > 2.2 && Math.abs(predictedZ) < 4;
        const distanceMagnitude = Math.abs(distanceToLine);
        let variant: 'REFLEX' | 'FULL' | 'HIGH';

        if (highShot) {
            variant = 'HIGH';
        } else if (distanceMagnitude < 12) {
            variant = 'REFLEX';
        } else {
            variant = 'FULL';
        }

        let reactionBase =
            difficulty === 'HARD' ? 0.08 :
            difficulty === 'MEDIUM' ? 0.14 :
            0.2;

        if (personality === 'ANTICIPATOR') {
            reactionBase *= 0.6;
        } else if (personality === 'SAFE_HANDS') {
            reactionBase *= 1.15;
        } else if (personality === 'SHOWMAN') {
            const factor = 0.8 + (1 - showmanConfidence.current) * 0.4;
            reactionBase *= factor;
        }

        const now = lastDecisionTime.current + dt;

        if (lastDecisionTime.current === 0) {
            lastDecisionTime.current = dt;
        }

        if (lastDecisionTime.current < reactionBase) {
            lastDecisionTime.current = now;
            return;
        }

        dive(variant, predictedZ, speed, distanceToLine);
    });

    return (
        <group ref={ref as React.RefObject<any>} castShadow receiveShadow>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[0.5, 2, 1]} />
                <meshStandardMaterial color="yellow" />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                <meshStandardMaterial color="orange" />
            </mesh>
            <mesh position={[0, 1.3, 0.6]}>
                <boxGeometry args={[0.3, 0.8, 0.3]} />
                <meshStandardMaterial color="yellow" />
            </mesh>
            <mesh position={[0, 1.3, -0.6]}>
                <boxGeometry args={[0.3, 0.8, 0.3]} />
                <meshStandardMaterial color="yellow" />
            </mesh>
        </group>
    );
};
