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
    speed?: number; // Movement speed in meters/sec (5e 30ft = ~3.0m/s)
    hovering?: boolean; // Floating sine-wave motion for flying creatures like Beholder
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

    // Load billboard sprite texture
    const texture = useTexture(textureUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        const currentPos = posRef.current;
        const targetPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);

        // 1. Calculate direction vector towards player in XZ plane
        const dir = new THREE.Vector3().subVectors(targetPos, currentPos);
        dir.y = 0; // Keep movement ground-level or floating

        const dist = dir.length();

        // 2. Persistently move towards player if outside stopping threshold (e.g. 3m)
        if (dist > 3.0) {
            dir.normalize();
            currentPos.x += dir.x * speed * delta;
            currentPos.z += dir.z * speed * delta;
        }

        // 3. Hovering sine-wave floating motion for Beholder
        const time = state.clock.getElapsedTime();
        const floatOffsetY = hovering ? Math.sin(time * 2.5) * 0.35 + 1.8 : 1.2;

        meshRef.current.position.set(currentPos.x, currentPos.y + floatOffsetY, currentPos.z);

        // 4. Billboard facing logic: Sprite always faces the active camera
        meshRef.current.lookAt(state.camera.position);
    });

    return (
        <group>
            {/* 3D Billboard Sprite Plane */}
            <mesh ref={meshRef} position={initialPosition}>
                <planeGeometry args={scale} />
                <meshStandardMaterial
                    map={texture}
                    transparent={true}
                    alphaTest={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Glowing Target Shadow Ring on Ground */}
            <mesh position={[posRef.current.x, 0.05, posRef.current.z]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.2, 1.4, 32]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};
