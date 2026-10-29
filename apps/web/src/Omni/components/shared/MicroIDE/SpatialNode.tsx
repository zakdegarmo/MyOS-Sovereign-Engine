import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { MicroIDE } from './MicroIDE';

interface SpatialNodeProps {
    position: [number, number, number];
    label: string;
    code: string;
    language?: string;
}

export const SpatialNode: React.FC<SpatialNodeProps> = ({ position, label, code, language = 'typescript' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            // Gentle hovering animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;

            // Rotate slightly when hovered
            if (hovered) {
                meshRef.current.rotation.y += 0.02;
            } else {
                meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
            }
        }
    });

    return (
        <group position={position}>
            {/* The Physical Node Node */}
            <mesh
                ref={meshRef}
                onClick={() => setIsOpen(!isOpen)}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={isOpen ? '#3b82f6' : (hovered ? '#64748b' : '#334155')}
                    emissive={isOpen ? '#1d4ed8' : '#000000'}
                    emissiveIntensity={isOpen ? 0.5 : 0}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>

            {/* Label floating above */}
            {!isOpen && (
                <Text
                    position={[0, 1.2, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                >
                    {label}
                </Text>
            )}

            {/* The Projected UI Window */}
            {isOpen && (
                <Html
                    position={[0, 0, 1]}
                    transform
                    occlude={false}
                    distanceFactor={4}
                    style={{
                        transition: 'all 0.2s',
                        transform: 'scale(1)',
                    }}
                >
                    <div
                        onPointerDown={(e) => e.stopPropagation()} // Prevent click-through to 3D scene
                    >
                        <MicroIDE
                            title={label}
                            defaultValue={code}
                            language={language}
                            onClose={() => setIsOpen(false)}
                            height="400px" // Explicitly pass height to Editor
                        />
                    </div>
                </Html>
            )}

            {/* Connection Line visualizer placeholder */}
        </group>
    );
};
