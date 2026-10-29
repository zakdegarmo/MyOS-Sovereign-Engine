import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export type DIOPrimitive = 'box' | 'sphere' | 'cylinder' | 'torus' | 'pyramid';

interface DIOManifestationProps {
    id: string;
    position: [number, number, number];
    primitive?: DIOPrimitive;
    textureUrl: string;
    scale?: number | [number, number, number];
    color?: string;
    emissive?: string;
    emissiveIntensity?: number;
    rotationSpeed?: number;
    uvOffset?: [number, number];
    uvScale?: [number, number];
    opacity?: number;
    pillar?: string;
}

/**
 * DIOManifestation (Draw-It-On)
 * 
 * A 'Cardboard Box' rendering primitive that skins 3D volumes with 2D Pixel Art.
 * The core engine for JIT (Just-In-Time) genomic manifestation.
 */
export const DIOManifestation: React.FC<DIOManifestationProps> = ({
    position,
    primitive = 'box',
    textureUrl,
    scale = 1,
    color = '#ffffff',
    emissive = '#000000',
    emissiveIntensity = 0.5,
    rotationSpeed = 1,
    uvOffset = [0, 0],
    uvScale = [1, 1],
    opacity = 1,
    pillar
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // NearestFilter is critical for the '16-bit Theatre' crispness
    const texture = useTexture(textureUrl);
    useMemo(() => {
        if (texture) {
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(uvScale[0], uvScale[1]);
            texture.offset.set(uvOffset[0], uvOffset[1]);
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture, uvScale, uvOffset]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * rotationSpeed * 0.5;
            // Subtle hover animation
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    const geometry = useMemo(() => {
        switch (primitive) {
            case 'sphere': return <sphereGeometry args={[1, 32, 32]} />;
            case 'cylinder': return <cylinderGeometry args={[1, 1, 2, 32]} />;
            case 'torus': return <torusGeometry args={[1, 0.4, 16, 100]} />;
            case 'pyramid': return <coneGeometry args={[1, 2, 4]} />;
            case 'box':
            default:
                return <boxGeometry args={[2, 2, 2]} />;
        }
    }, [primitive]);

    // Pillar-specific Glow Logic (Gene 82: Ghost Signals)
    const finalEmissive = useMemo(() => {
        if (emissive !== '#000000') return emissive;
        switch (pillar?.toLowerCase()) {
            case 'logic': return '#00ffff';
            case 'thought': return '#ff00ff';
            case 'improvement': return '#00ff00';
            case 'mastery': return '#ffff00';
            default: return '#555555';
        }
    }, [emissive, pillar]);

    return (
        <mesh 
            ref={meshRef} 
            position={position} 
            scale={typeof scale === 'number' ? [scale, scale, scale] : scale}
            castShadow
            receiveShadow
        >
            {geometry}
            <meshStandardMaterial 
                map={texture}
                color={color}
                emissive={new THREE.Color(finalEmissive)}
                emissiveIntensity={emissiveIntensity}
                transparent={opacity < 1}
                opacity={opacity}
                roughness={0.6}
                metalness={0.2}
            />
        </mesh>
    );
};
