import { useSphere } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { useMatchStore } from '../../store/useMatchStore';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { activeMatchMonitor } from '../../services/rank/PerformanceMonitor';
import { emitMatchEvent } from '../commentary/CommentaryEngine';

export const Ball = ({ initialPosition = [0, 5, 0] }: { initialPosition?: [number, number, number] }) => {
    const {
        setBallState,
        updateScore,
        ballState,
        setBallPosition,
        pendingShot,
        clearPendingShot,
        startCelebration,
        matchTime
    } = useMatchStore();
    const { user } = useAuthStore();
    const pos = useRef(new Vector3(initialPosition[0], initialPosition[1], initialPosition[2]));
    const vel = useRef(new Vector3(0, 0, 0));
    const lastShotId = useRef<number | null>(null);

    const [ref, api] = useSphere(() => ({ 
        mass: 0.45,
        position: initialPosition,
        args: [0.22],
        restitution: 0.4,
        friction: 0.6,
        linearDamping: 0.25,
        angularDamping: 0.4
    }));

    useEffect(() => {
        const unsubscribe = api.position.subscribe((v) => {
            pos.current.set(v[0], v[1], v[2]);
            setBallPosition([v[0], v[1], v[2]]);
        });
        return unsubscribe;
    }, [api.position, setBallPosition]);

    useEffect(() => {
        const unsubscribe = api.velocity.subscribe((v) => {
            vel.current.set(v[0], v[1], v[2]);
        });
        return unsubscribe;
    }, [api.velocity]);

    useFrame(() => {
        if (ballState !== 'IN_PLAY') return;

        if (pendingShot && pendingShot.id !== lastShotId.current) {
            const [fx, fy, fz] = pendingShot.force;
            api.applyImpulse([fx, fy, fz], [0, 0, 0]);
            lastShotId.current = pendingShot.id;
            clearPendingShot();
        }

        const { x, z } = pos.current;
        const vx = vel.current.x;
        const vz = vel.current.z;
        const speedSq = vx * vx + vz * vz;
        if (speedSq < 0.04) {
            api.velocity.set(0, vel.current.y, 0);
        }

        if (Math.abs(z) > 37.7) { // 0.2m tolerance (radius)
            console.log("THROW IN");
            setBallState('THROW_IN');
            api.velocity.set(0, 0, 0); // Stop ball
            return;
        }

        if (Math.abs(x) > 57.7) {
            if (Math.abs(z) < 3.66) {
                console.log("GOAL!");
                const scoringTeam = x > 0 ? 'HOME' : 'AWAY';
                const shotContext = activeMatchMonitor.getLastShotContext();
                const xG = shotContext?.xG ?? 0;
                const difficulty = shotContext?.difficulty ?? 0.5;
                const minute = matchTime;
                const importanceBase = Math.max(0, Math.min(1, xG));
                const timeFactor = Math.max(0, Math.min(1, minute / 90));
                const importance = Math.max(0.4, Math.min(1, 0.3 + importanceBase * 0.4 + timeFactor * 0.3));
                updateScore(scoringTeam);
                if (scoringTeam === 'HOME') {
                    activeMatchMonitor.markLastShotSuccess(true);
                }
                emitMatchEvent({
                    id: `goal-${Date.now()}`,
                    kind: 'GOAL',
                    minute,
                    pressure: difficulty,
                    importance,
                    team: scoringTeam,
                    shotDifficulty: xG,
                    isPenalty: false
                });
                setBallState('GOAL');
                const fallbackOwned = ['FIST_PUMP', 'KNEE_SLIDE', 'ARMS_WIDE_RUN', 'CALM_DOWN'];
                const owned = user && Array.isArray(user.ownedCelebrations) && user.ownedCelebrations.length > 0
                    ? user.ownedCelebrations
                    : fallbackOwned;
                const chosenId = owned[Math.floor(Math.random() * owned.length)];
                startCelebration({ type: chosenId as any, team: scoringTeam });
            } else {
                console.log("OUT OF PLAY (Goal Kick / Corner)");
                const shotContext = activeMatchMonitor.getLastShotContext();
                if (shotContext) {
                    const xG = shotContext.xG ?? 0;
                    const difficulty = shotContext.difficulty ?? 0.5;
                    const minute = matchTime;
                    const importanceBase = Math.max(0, Math.min(1, xG));
                    const timeFactor = Math.max(0, Math.min(1, minute / 90));
                    const importance = Math.max(0.3, Math.min(1, 0.25 + importanceBase * 0.4 + timeFactor * 0.25));
                    emitMatchEvent({
                        id: `shot-miss-${Date.now()}`,
                        kind: 'SHOT_MISS',
                        minute,
                        pressure: difficulty,
                        importance,
                        team: 'HOME',
                        shotDifficulty: xG,
                        isPenalty: false
                    });
                    activeMatchMonitor.markLastShotSuccess(false);
                }
                setBallState('GOAL_KICK'); // Simplified
            }
            api.velocity.set(0, 0, 0);
        }
        
        // Simple debug control to kick the ball
        // if (input.actionB) { // Shoot key
        //    api.applyImpulse([0, 5, -5], [0, 0, 0]);
        // }
    });

    return (
        <mesh ref={ref as React.RefObject<Mesh>} castShadow receiveShadow>
            <sphereGeometry args={[0.22, 32, 32]} />
            <meshStandardMaterial color="white" roughness={0.4} metalness={0.1} />
        </mesh>
    );
};
