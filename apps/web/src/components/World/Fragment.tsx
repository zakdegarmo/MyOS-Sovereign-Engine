import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Icosahedron, Float } from '@react-three/drei';

interface FragmentProps {
    id: string;
    position: [number, number, number];
    isSecured?: boolean;
    scale?: number;
}

export const Fragment: React.FC<FragmentProps> = ({ id, position, isSecured, scale = 0.8 }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const wireRef = useRef<THREE.LineSegments>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    // Load Circuit Board Texture
    const texture = useLoader(THREE.TextureLoader, '/textures/circuitboard.png');
    
    useMemo(() => {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
        }
    }, [texture]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        
        if (meshRef.current) {
            // Pulsing Rainbow Glow logic
            // Each pulse alternates through the color spectrum
            const hue = (t * 0.2) % 1; // Slow cycle through hue
            const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
            
            if (materialRef.current) {
                materialRef.current.emissive = color;
                materialRef.current.emissiveIntensity = 0.5 + Math.sin(t * 3) * 0.3; // Pulsing intensity
            }
            
            // Rotation
            meshRef.current.rotation.y = t * 0.5;
            meshRef.current.rotation.z = t * 0.3;
        }

        if (wireRef.current) {
            wireRef.current.rotation.y = t * 0.5;
            wireRef.current.rotation.z = t * 0.3;
        }
    });

    if (isSecured) return null; // Or show a 'collected' effect

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <group position={position} name={`fragment-${id}`}>
                {/* 1. The Solid Icosahedron Faces */}
                <Icosahedron args={[scale, 0]} ref={meshRef}>
                    <meshStandardMaterial
                        ref={materialRef}
                        map={texture}
                        transparent
                        opacity={0.75}
                        metalness={0.9}
                        roughness={0.1}
                        emissiveIntensity={1}
                    />
                </Icosahedron>

                {/* 2. The Wireframe Overlay */}
                <Icosahedron args={[scale * 1.05, 0]}>
                    <meshBasicMaterial 
                        wireframe 
                        color="#00ffff" 
                        transparent 
                        opacity={0.4} 
                    />
                </Icosahedron>

                {/* 3. Point Light for local glow */}
                <pointLight intensity={2} distance={5} color="#00ffff" />
            </group>
        </Float>
    );
};
