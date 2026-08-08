import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export interface BillboardEnemyDroneProps {
    id: string;
    name: string;
    textureUrl: string;
    initialPosition: [number, number, number];
    playerPosition: [number, number, number];
    speed?: number;
    hovering?: boolean;
    scale?: [number, number];
}

export const BillboardEnemyDrone: React.FC<BillboardEnemyDroneProps> = ({
    id,
    name,
    textureUrl,
    initialPosition,
    playerPosition,
    speed = 2.5,
    hovering = true,
    scale = [4.0, 4.0]
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const posRef = useRef<THREE.Vector3>(new THREE.Vector3(...initialPosition));

    const texture = useTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const currentPos = posRef.current;
        const targetPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);

        const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
        dir.y = 0;

        const dist = dir.length();

        if (dist > 3.0) {
            dir.normalize();
            currentPos.x += dir.x * speed * delta;
            currentPos.z += dir.z * speed * delta;
        }

        const time = state.clock.getElapsedTime();
        const floatOffsetY = hovering ? Math.sin(time * 2.5) * 0.35 + 1.8 : 1.2;

        meshRef.current.position.set(currentPos.x, currentPos.y + floatOffsetY, currentPos.z);
        meshRef.current.lookAt(state.camera.position);
    });

    return (
        <group>
            <mesh ref={meshRef} position={initialPosition}>
                <planeGeometry args={scale} />
                <meshStandardMaterial
                    map={texture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            <mesh position={[posRef.current.x, 0.05, posRef.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.2, 1.4, 32]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
