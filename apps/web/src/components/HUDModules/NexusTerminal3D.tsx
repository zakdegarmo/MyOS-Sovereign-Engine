import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface NexusTerminal3DProps {
    position?: [number, number, number];
    scale?: number;
    isActive?: boolean;
    onActivate?: () => void;
}

/**
 * NexusTerminal3D.tsx
 * 
 * A stylized 3D Terminal component for the GlitchingWindowHub.
 * Features a glowing screen, holographic text, and click interaction.
 */
export const NexusTerminal3D: React.FC<NexusTerminal3DProps> = ({
    position = [0, 0, 0],
    scale = 1,
    isActive = true,
    onActivate
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const screenRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (screenRef.current && screenRef.current.material) {
            // Subtle digital flicker effect
            const flicker = Math.sin(state.clock.elapsedTime * 15) * 0.15 + 0.85;
            const mat = screenRef.current.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = flicker * 2.5;
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            onClick={(e) => {
                e.stopPropagation();
                if (isActive) onActivate?.();
            }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
            <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.4}>
                {/* Main Console Housing */}
                <mesh castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.9, 0.25]} />
                    <meshStandardMaterial
                        color="#0a0a0a"
                        roughness={0.05}
                        metalness={0.95}
                        emissive="#111"
                    />
                </mesh>

                {/* Beveled Screen Area */}
                <mesh position={[0, 0, 0.13]}>
                    <planeGeometry args={[1.1, 0.8]} />
                    <meshStandardMaterial color="#000" />
                </mesh>

                {/* Glowing Active Screen */}
                <mesh ref={screenRef} position={[0, 0, 0.135]}>
                    <planeGeometry args={[1.05, 0.75]} />
                    <meshStandardMaterial
                        color="#000"
                        emissive="#22d3ee" // Cyan-400
                        emissiveIntensity={2}
                        toneMapped={false}
                        transparent
                        opacity={0.9}
                    />
                </mesh>

                {/* Holographic Header */}
                <Text
                    position={[0, 0.65, 0]}
                    fontSize={0.12}
                    color="#22d3ee"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.01}
                    outlineColor="#083344"
                >
                    UPLINK_ESTABLISHED
                </Text>

                {/* Decorative Status Bar */}
                <mesh position={[0, -0.38, 0.14]}>
                    <boxGeometry args={[0.9, 0.04, 0.01]} />
                    <meshStandardMaterial
                        color="#22d3ee"
                        emissive="#22d3ee"
                        emissiveIntensity={4}
                    />
                </mesh>

                {/* Digital Scanlines effect (simplified via overlay) */}
                <mesh position={[0, 0, 0.14]}>
                    <planeGeometry args={[1.05, 0.75]} />
                    <meshStandardMaterial
                        color="#000"
                        transparent
                        opacity={0.1}
                        wireframe
                    />
                </mesh>
            </Float>

            {/* Power Pedestal */}
            <mesh position={[0, -0.7, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.15, 0.6, 12]} />
                <meshStandardMaterial
                    color="#0a0a0a"
                    metalness={1}
                    roughness={0.1}
                />
            </mesh>

            {/* Base Ring Aura */}
            <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.5, 32]} />
                <meshStandardMaterial
                    color="#22d3ee"
                    emissive="#22d3ee"
                    emissiveIntensity={2}
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </group>
    );
};
