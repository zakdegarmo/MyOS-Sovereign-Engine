import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface ParallaxCyclotronProps {
    playerPosition: THREE.Vector3;
    activeBiome?: 'forest' | 'desert' | 'mountain' | 'jungle' | 'plains';
}

/**
 * ParallaxCyclotron
 * 
 * Multi-layer concentric cylindrical/spherical background system.
 * Rotates background elements at differential parallax speeds to trick 
 * the viewer's depth perception and create vast spatial scale.
 */
export const ParallaxCyclotron: React.FC<ParallaxCyclotronProps> = ({
    playerPosition,
    activeBiome = 'forest'
}) => {
    const skyDomeRef = useRef<THREE.Mesh>(null);
    const farMountainsRef = useRef<THREE.Mesh>(null);
    const biomeTreelineRef = useRef<THREE.Mesh>(null);

    const daysOfThunderSky = useTexture('/assets/textures/skybox/days_of_thunder_skybox.jpg');

    useMemo(() => {
        daysOfThunderSky.wrapS = daysOfThunderSky.wrapT = THREE.ClampToEdgeWrapping;
        daysOfThunderSky.colorSpace = THREE.SRGBColorSpace;
    }, [daysOfThunderSky]);

    // Deep Sky Shader Material (Epoch 1: Days of Thunder Primordial Skybox)
    const skyMaterial = useMemo(() => {
        return new THREE.MeshBasicMaterial({
            map: daysOfThunderSky,
            side: THREE.BackSide,
            depthWrite: false
        });
    }, [daysOfThunderSky]);

    const groupRef = useRef<THREE.Group>(null);

    useFrame(() => {
        // Track Player Position so Skybox stays centered on camera at outer horizon
        if (groupRef.current && playerPosition) {
            groupRef.current.position.set(playerPosition[0], 0, playerPosition[2]);
        }
    });

    return (
        <group ref={groupRef} name="ParallaxCyclotronSystem">
            {/* Layer 0: Deep Atmospheric Sky Dome (Radius 850) */}
            <mesh ref={skyDomeRef} position={[0, 100, 0]} material={skyMaterial}>
                <sphereGeometry args={[850, 48, 48]} />
            </mesh>
        </group>
    );
};
