import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

interface PenaltyControllerProps {
    onShoot: (force: Vector3, curve: number) => void;
    enabled: boolean;
}

export const PenaltyController = ({ onShoot, enabled }: PenaltyControllerProps) => {
    const { size } = useThree();
    const startPos = useRef<{ x: number, y: number } | null>(null);
    const startTime = useRef<number>(0);
    const pathPoints = useRef<{ x: number, y: number }[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const handlePointerDown = (e: PointerEvent) => {
        if (!enabled) return;
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        startTime.current = Date.now();
        pathPoints.current = [{ x: e.clientX, y: e.clientY }];
    };

    const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        pathPoints.current.push({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e: PointerEvent) => {
        if (!isDragging || !startPos.current) return;
        setIsDragging(false);

        const endPos = { x: e.clientX, y: e.clientY };
        const endTime = Date.now();
        const duration = (endTime - startTime.current) / 1000; // seconds

        // Calculate swipe vector
        const dx = endPos.x - startPos.current.x;
        const dy = endPos.y - startPos.current.y; // Negative because screen Y is down

        // Normalize to screen size
        const ndx = dx / size.width;
        const ndy = -dy / size.height; // Up is positive

        if (ndy < 0.1) {
            // Swipe too short or wrong direction (must be up)
            return;
        }

        // Calculate power based on speed (distance / time)
        const distance = Math.sqrt(ndx * ndx + ndy * ndy);
        const speed = distance / Math.max(duration, 0.1);
        
        // Clamp power
        const power = Math.min(Math.max(speed * 15, 10), 30);

        // Calculate direction
        // In 3D world (Camera looking -Z):
        // Screen X -> World X
        // Screen Y -> World Y (height) and World -Z (depth)
        
        // We want the ball to go forward (-Z) and up (Y) based on the swipe.
        // Also sideways (X).
        
        const forwardForce = 1.0; // Base forward ratio
        const upForce = ndy * 1.5; // Height based on swipe verticality
        const sideForce = ndx * 3.0; // Sideways based on swipe horizontal

        const direction = new Vector3(sideForce, upForce, -forwardForce).normalize();
        const forceVector = direction.multiplyScalar(power);

        // Calculate curve
        // Simple curve logic: Check midpoint deviation from start-end line
        let curve = 0;
        if (pathPoints.current.length > 5) {
            const midIndex = Math.floor(pathPoints.current.length / 2);
            const midPoint = pathPoints.current[midIndex];
            
            // Expected midpoint if straight line
            const expectedMidX = (startPos.current.x + endPos.x) / 2;
            const deviationX = midPoint.x - expectedMidX;
            
            // Normalize deviation
            curve = -deviationX / size.width * 50; // Arbitrary scaler
        }

        onShoot(forceVector, curve);
        
        // Reset
        startPos.current = null;
        pathPoints.current = [];
    };

    useEffect(() => {
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, enabled, size]);

    return null; // Invisible controller
};
