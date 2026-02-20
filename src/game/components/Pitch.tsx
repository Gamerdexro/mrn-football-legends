import { usePlane } from '@react-three/cannon';

export const Pitch = () => {
    const [ref] = usePlane(() => ({ 
        rotation: [-Math.PI / 2, 0, 0], 
        position: [0, 0, 0],
        friction: 0.8 
    }));

    const pitchLength = 115;
    const pitchWidth = 75;

    return (
        <group>
            <mesh ref={ref as React.RefObject<any>} receiveShadow>
                <planeGeometry args={[pitchLength, pitchWidth]} />
                <meshStandardMaterial color="#1f6c2b" roughness={0.9} />
            </mesh>

            {/* Midline */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.01, pitchWidth]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Center Circle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[9, 9.3, 64]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Center Spot */}
            <mesh position={[0, 0.03, 0]}>
                <circleGeometry args={[0.3, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>

            {/* Penalty Areas & Goal Boxes */}
            {/* Left Goal */}
            <mesh position={[-pitchLength / 2 + 16.5, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.01, 40.32]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[-pitchLength / 2 + 5.5, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.01, 18.32]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Right Goal */}
            <mesh position={[pitchLength / 2 - 16.5, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.01, 40.32]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh position={[pitchLength / 2 - 5.5, 0.02, 0]}>
                <boxGeometry args={[0.3, 0.01, 18.32]} />
                <meshStandardMaterial color="#ffffff" />
            </mesh>

            {/* Penalty Spots */}
            <mesh position={[-pitchLength / 2 + 11, 0.03, 0]}>
                <circleGeometry args={[0.25, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[pitchLength / 2 - 11, 0.03, 0]}>
                <circleGeometry args={[0.25, 16]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
        </group>
    );
};
