import React from 'react';
import { usePlane } from '@react-three/cannon';

export const Playground = () => {
    const [groundRef] = usePlane(() => ({ 
        rotation: [-Math.PI / 2, 0, 0], 
        position: [0, -0.1, 0] 
    }));

    return (
        <group>
            <mesh ref={groundRef as React.RefObject<THREE.Mesh>} receiveShadow>
                <planeGeometry args={[80, 80]} />
                <meshStandardMaterial color="#ff6b35" roughness={0.6} metalness={0.1} />
            </mesh>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[10, 10.4, 48]} />
                <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
                <boxGeometry args={[0.2, 0.02, 80]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            <mesh position={[-30, 1.5, 0]} castShadow>
                <boxGeometry args={[0.2, 3, 0.2]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-30, 3.1, 0]} castShadow>
                <boxGeometry args={[0.2, 0.2, 6]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[30, 1.5, 0]} castShadow>
                <boxGeometry args={[0.2, 3, 0.2]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[30, 3.1, 0]} castShadow>
                <boxGeometry args={[0.2, 0.2, 6]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            <mesh position={[0, 1, -40]} receiveShadow>
                <boxGeometry args={[80, 2, 0.5]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 2.3, -40]} receiveShadow>
                <boxGeometry args={[80, 1.8, 0.1]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[0, 1, 40]} receiveShadow>
                <boxGeometry args={[80, 2, 0.5]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 2.3, 40]} receiveShadow>
                <boxGeometry args={[80, 1.8, 0.1]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[-40, 1, 0]} receiveShadow>
                <boxGeometry args={[0.5, 2, 80]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[-40, 2.3, 0]} receiveShadow>
                <boxGeometry args={[0.1, 1.8, 80]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <mesh position={[40, 1, 0]} receiveShadow>
                <boxGeometry args={[0.5, 2, 80]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[40, 2.3, 0]} receiveShadow>
                <boxGeometry args={[0.1, 1.8, 80]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>

            <mesh position={[-20, 0.6, 30]} receiveShadow>
                <boxGeometry args={[12, 0.6, 2]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[-20, 1.4, 30.8]} receiveShadow>
                <boxGeometry args={[11.4, 0.4, 1.2]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>

            <mesh position={[20, 0.6, 30]} receiveShadow>
                <boxGeometry args={[10, 0.6, 2]} />
                <meshStandardMaterial color="#111827" />
            </mesh>
            <mesh position={[20, 1.4, 30.8]} receiveShadow>
                <boxGeometry args={[9.4, 0.4, 1.2]} />
                <meshStandardMaterial color="#4b5563" />
            </mesh>

            <mesh position={[-35, 5.5, -35]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, 11]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[-35, 11.5, -35]} castShadow>
                <sphereGeometry args={[0.9, 16, 16]} />
                <meshStandardMaterial emissive="#fde68a" emissiveIntensity={1.3} color="#ffffff" />
            </mesh>
            <mesh position={[35, 5.5, -35]} castShadow>
                <cylinderGeometry args={[0.35, 0.35, 11]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            <mesh position={[35, 11.5, -35]} castShadow>
                <sphereGeometry args={[0.9, 16, 16]} />
                <meshStandardMaterial emissive="#bfdbfe" emissiveIntensity={1.1} color="#ffffff" />
            </mesh>
        </group>
    );
};
