/** @version 1.0.0-Papercraft @timestamp 2026-04-08 00:25 @author Antigravity-Omni */
import React, { useMemo, useRef, useState } from 'react';
import { useTexture, TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface PapercraftBuildingProps {
    id: string;
    position: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    type?: 'house' | 'tower' | 'shack' | 'portent';
    linkedDimension?: string;
    onTrigger?: (dimId: string) => void;
    playerPosition?: [number, number, number];
    isSelected?: boolean;
    transformMode?: 'translate' | 'scale';
    onUpdate?: (changes: any) => void;
}

/**
 * PapercraftBuilding
 * A 3D box mesh mapped with 2D pixels to look like a physical paper model.
 */
export const PapercraftBuilding: React.FC<PapercraftBuildingProps> = ({
    id,
    position,
    scale = 3,
    rotation = [0, 0, 0],
    type = 'house',
    linkedDimension,
    onTrigger,
    playerPosition,
    isSelected,
    transformMode,
    onUpdate
}) => {
    const { controls } = useThree();
    const [isDragging, setIsDragging] = useState(false);
    const groupRef = useRef<THREE.Group>(null);
    // 1. Load the facet textures
    const roofTex = useTexture('/assets/lpc/lpc-roofs/lpc-roofs/roofs.png');
    const wallTex = useTexture('/assets/lpc/LPC_city_outside_1/LPC_city_outside/city_outside.png');
    
    // 2. Setup Nearest Filtering for that crisp pixel look
    useMemo(() => {
        [roofTex, wallTex].forEach(tex => {
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
        });
    }, [roofTex, wallTex]);

    // 3. Define the materials for each face of the box
    // Order: +X, -X, +Y, -Y, +Z, -Z
    const materials = useMemo(() => {
        // Wall Material (Side/Back)
        const wallMat = new THREE.MeshStandardMaterial({ 
            map: wallTex.clone(), 
            roughness: 0.9, 
            metalness: 0.0 
        });
        wallMat.map!.offset.set(2/32, 2/32); // Pick a nice wall tile
        wallMat.map!.repeat.set(1/16, 1/16);

        // Front Material (Door/Window)
        const frontMat = new THREE.MeshStandardMaterial({ 
            map: wallTex.clone(), 
            roughness: 0.9 
        });
        frontMat.map!.offset.set(4/32, 10/32); // Door slice
        frontMat.map!.repeat.set(1/16, 1/16);

        // Roof Material (Top)
        const roofMat = new THREE.MeshStandardMaterial({ 
            map: roofTex.clone(), 
            roughness: 0.8 
        });
        roofMat.map!.offset.set(0, 0.4); // Pick a roof section
        roofMat.map!.repeat.set(0.2, 0.2);

        // Bottom/Footing
        const bottomMat = new THREE.MeshStandardMaterial({ color: '#222' });

        // Portent Material (Glowing Alchemical Emerald)
        const portentMat = new THREE.MeshStandardMaterial({
            color: '#00ff88',
            emissive: '#004422',
            emissiveIntensity: 2,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.9
        });

        if (type === 'portent') {
            return [portentMat, portentMat, portentMat, portentMat, portentMat, portentMat];
        }

        return [
            wallMat,  // +X
            wallMat,  // -X
            roofMat,  // +Y (Roof)
            bottomMat, // -Y
            frontMat, // +Z (Front)
            wallMat   // -Z
        ];
    }, [roofTex, wallTex, type]);

    // 4. Collision/Trigger Check
    const hasTriggered = React.useRef(false);
    const scene = React.useRef<THREE.Group>(null);

    useFrame(() => {
        if (groupRef.current && !isDragging) {
            groupRef.current.position.set(position[0], position[1], position[2]);
        }
    });

    React.useEffect(() => {
        if (!playerPosition || !linkedDimension || !onTrigger || hasTriggered.current) return;
        
        const dist = Math.sqrt(
            (position[0] - playerPosition[0])**2 + 
            (position[2] - playerPosition[2])**2
        );

        if (dist < scale * 1.5) {
            hasTriggered.current = true;
            onTrigger(linkedDimension);
        }
    }, [playerPosition, position, scale, linkedDimension, onTrigger]);

    return (
        <>
            {isSelected && (
                <TransformControls
                    object={groupRef.current || undefined}
                    mode={transformMode || 'translate'}
                    onMouseDown={() => {
                        setIsDragging(true);
                        if (controls) (controls as any).enabled = false;
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (controls) (controls as any).enabled = true;

                        if (groupRef.current && playerPosition) {
                            // Scale Normalization for non-inn buildings (1.5x multiplier)
                            const baseScale = groupRef.current.scale.x / 1.5;
                            
                            onUpdate?.({
                                position: [
                                    groupRef.current.position.x + playerPosition[0],
                                    groupRef.current.position.y,
                                    groupRef.current.position.z + playerPosition[2]
                                ],
                                scale: baseScale
                            });
                        }
                    }}
                />
            )}
            <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
            {/* The Building Body */}
            <mesh castShadow receiveShadow material={materials}>
                {type === 'portent' ? <octahedronGeometry args={[0.7]} /> : <boxGeometry args={[1, 1, 1]} />}
            </mesh>
            
            {/* Portent or Dimensional Glow Ring */}
            {(type === 'portent' || linkedDimension) && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
                    <ringGeometry args={[0.8, 1.0, 32]} />
                    <meshBasicMaterial 
                        color={linkedDimension ? "#9b59b6" : "#00ff88"} 
                        transparent 
                        opacity={0.5} 
                        side={THREE.DoubleSide} 
                    />
                </mesh>
            )}

            {/* Optional Shadow "Lip" to enhance papercraft feel */}
            {type !== 'portent' && (
                <mesh position={[0, -0.49, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <planeGeometry args={[1.1, 1.1]} />
                    <meshBasicMaterial color="black" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
        </>
    );
};
