import React, { useMemo } from 'react';
import { usePlane } from '@react-three/cannon';
import { Instance, Instances } from '@react-three/drei';
import { useMatchStore } from '../../store/useMatchStore';

// Crowd Strategy: 2D Textures / Billboards (Performance First)
// Instead of 3D models, we use instanced planes with varying colors/textures
const CrowdSection = ({
    position,
    rotation,
    count = 100,
    area,
    intensity
}: {
    position: [number, number, number];
    rotation: [number, number, number];
    count?: number;
    area: [number, number];
    intensity: number;
}) => {
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * area[0];
            const z = (Math.random() - 0.5) * area[1];
            // Random color variation for "HD" look without cost
            const color = Math.random() > 0.5 ? '#ffffff' : Math.random() > 0.5 ? '#e11d48' : '#2563eb';
            temp.push({ position: [x, 0.5, z], color });
        }
        return temp;
    }, [count, area]);

    const sway = 0.08 + intensity * 0.22;
    return (
        <group position={position} rotation={rotation}>
             {/* Base Stand (Height 10 to match original) */}
             <mesh receiveShadow position={[0, -5, 0]}>
                <boxGeometry args={[area[0], 10, area[1]]} />
                <meshStandardMaterial color="#262626" />
            </mesh>
            
            {/* 2D Crowd Instances (Sitting on top at local y=0) */}
            <Instances range={count}>
                <planeGeometry args={[0.4, 0.8]} />
                <meshStandardMaterial side={2} />
                {particles.map((data, i) => {
                    const jitter = (Math.random() - 0.5) * sway;
                    return (
                        <Instance
                            key={i}
                            position={data.position as [number, number, number]}
                            color={data.color}
                            rotation={[0, Math.random() * 0.5 - 0.25 + jitter, 0]}
                        />
                    );
                })}
            </Instances>
        </group>
    );
};

export const Stadium = () => {
    const [groundRef] = usePlane(() => ({ 
        rotation: [-Math.PI / 2, 0, 0], 
        position: [0, -0.1, 0] 
    }));
    const crowdIntensity = useMatchStore(state => state.crowdIntensity);

    // Grass Strategy: Flat mesh + Normal Map (simulated here with roughness)
    // No geometry grass
    
    const GoalFrame = ({ position }: { position: [number, number, number] }) => (
        <group position={position}>
            <mesh position={[0, 2.4, 0]}>
                <boxGeometry args={[7.32, 0.15, 0.15]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-3.66, 1.2, 0]}>
                <boxGeometry args={[0.15, 2.4, 0.15]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[3.66, 1.2, 0]}>
                <boxGeometry args={[0.15, 2.4, 0.15]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
        </group>
    );

    return (
        <group>
            <mesh ref={groundRef as React.RefObject<THREE.Mesh>} receiveShadow>
                <planeGeometry args={[230, 230]} />
                <meshStandardMaterial color="#102a19" roughness={0.9} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[90, 105, 64]} />
                <meshStandardMaterial color="#8b2f23" roughness={0.8} />
            </mesh>

            <CrowdSection position={[0, 5, -45]} rotation={[0.5, 0, 0]} area={[140, 24]} count={400} intensity={crowdIntensity} />
            <CrowdSection position={[0, 5, 50]} rotation={[-0.5, 0, 0]} area={[140, 24]} count={400} intensity={crowdIntensity} />
            
            {/* Short Sides */}
            <CrowdSection position={[-70, 5, 0]} rotation={[0, 0, -0.5]} area={[24, 90]} count={200} intensity={crowdIntensity} />
            <CrowdSection position={[70, 5, 0]} rotation={[0, 0, 0.5]} area={[24, 90]} count={200} intensity={crowdIntensity} />

            <mesh position={[50, 20, 50]}>
                <cylinderGeometry args={[1, 1, 40]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>
            <mesh position={[-50, 20, 50]}>
                <cylinderGeometry args={[1, 1, 40]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>
             <mesh position={[50, 20, -50]}>
                <cylinderGeometry args={[1, 1, 40]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>
            <mesh position={[-50, 20, -50]}>
                <cylinderGeometry args={[1, 1, 40]} />
                <meshStandardMaterial color="#ddd" />
            </mesh>

            <mesh position={[0, 14, -70]}>
                <boxGeometry args={[40, 8, 2]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[0, 14, -69.1]}>
                <planeGeometry args={[38, 6]} />
                <meshStandardMaterial color="#0f766e" />
            </mesh>

            <mesh position={[0, 0.5, -40]}>
                <boxGeometry args={[180, 1.5, 1]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0.5, 40]}>
                <boxGeometry args={[180, 1.5, 1]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[-90, 0.5, 0]}>
                <boxGeometry args={[1, 1.5, 120]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[90, 0.5, 0]}>
                <boxGeometry args={[1, 1.5, 120]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>

            <mesh position={[-55, 1.2, 36]}>
                <boxGeometry args={[10, 2, 0.2]} />
                <meshStandardMaterial color="#1d4ed8" />
            </mesh>
            <mesh position={[55, 1.2, 36]}>
                <boxGeometry args={[10, 2, 0.2]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>
            <mesh position={[-55, 1.2, -36]}>
                <boxGeometry args={[10, 2, 0.2]} />
                <meshStandardMaterial color="#f97316" />
            </mesh>
            <mesh position={[55, 1.2, -36]}>
                <boxGeometry args={[10, 2, 0.2]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>

            <mesh position={[-57.5, 1.2, 20]}>
                <cylinderGeometry args={[0.15, 0.15, 3]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-57.5, 2.9, 20]}>
                <boxGeometry args={[0.4, 1.2, 0.02]} />
                <meshStandardMaterial color="#ef4444" />
            </mesh>

            <mesh position={[-57.5, 1.2, -20]}>
                <cylinderGeometry args={[0.15, 0.15, 3]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-57.5, 2.9, -20]}>
                <boxGeometry args={[0.4, 1.2, 0.02]} />
                <meshStandardMaterial color="#facc15" />
            </mesh>

            <mesh position={[57.5, 1.2, 20]}>
                <cylinderGeometry args={[0.15, 0.15, 3]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[57.5, 2.9, 20]}>
                <boxGeometry args={[0.4, 1.2, 0.02]} />
                <meshStandardMaterial color="#22c55e" />
            </mesh>

            <mesh position={[57.5, 1.2, -20]}>
                <cylinderGeometry args={[0.15, 0.15, 3]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[57.5, 2.9, -20]}>
                <boxGeometry args={[0.4, 1.2, 0.02]} />
                <meshStandardMaterial color="#3b82f6" />
            </mesh>

            <GoalFrame position={[-57.5, 0, 0]} />
            <GoalFrame position={[57.5, 0, 0]} />
        </group>
    );
};
