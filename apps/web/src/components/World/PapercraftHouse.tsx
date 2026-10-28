import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';

interface PapercraftHouseProps {
    position: [number, number, number];
    scale?: number;
    facetUrl: string;
    id?: string;
    linkedDimension?: string;
    onTrigger?: (dim: string) => void;
    isSelected?: boolean;
    transformMode?: 'translate' | 'scale';
    onUpdate?: (changes: any) => void;
    playerPosition?: [number, number, number];
}

/**
 * PapercraftHouse.tsx
 * 
 * A high-fidelity "composite" building with a gabled roof.
 * Uses a single facet sheet (pixel art) mapped to a custom BufferGeometry.
 * Includes interaction for dimension swapping.
 */
export const PapercraftHouse: React.FC<PapercraftHouseProps> = ({
    position,
    scale = 1.0,
    facetUrl,
    id,
    linkedDimension,
    onTrigger,
    isSelected,
    transformMode,
    onUpdate,
    playerPosition
}) => {
    const { stashPosition, swapDimension } = useWorld();
    const { controls } = useThree();
    const [isDragging, setIsDragging] = React.useState(false);
    const groupRef = useRef<THREE.Group>(null);
    const texture = useTexture(facetUrl);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    // --- COMPOSITE GEOMETRY SYNTHESIS ---
    // Instead of one mesh, we build the house as a stack of "Physical" layers
    const compositeBuilding = useMemo(() => {
        const width = 2.4;
        const foundationHeight = 0.8;
        const facadeHeight = 1.0;
        const depth = 3.6;
        const roofHeight = 1.2;

        // Texture Grid: [Top L: Front] [Top R: Back] [Bot L: Sides] [Bot R: Roof]
        const col = 0.5;
        const row = 0.5;

        const createLayerMaterials = (type: 'foundation' | 'facade' | 'roof') => {
            const mats = [];
            for (let i = 0; i < 6; i++) {
                const mat = new THREE.MeshStandardMaterial({ 
                    map: texture.clone(), 
                    transparent: true,
                    alphaTest: 0.1,
                    roughness: 1,
                    metalness: 0,
                    side: THREE.DoubleSide
                });
                
                // Aggressive Zoom Logic: Offsets move the 'window', Repeat stretches the 'content'
                const zoom = 0.92; // Tighter crop to absolutely kill any blue bleed
                const margin = (1 - zoom) / 2;

                if (type === 'foundation') {
                    // Stone Base: Pull from bottom-left corner art
                    mat.map!.repeat.set(col * zoom, row * 0.4 * zoom);
                    mat.map!.offset.set(margin * col, margin * row); 
                } else if (type === 'facade') {
                    if (i === 4) { // Front (+Z)
                        mat.map!.repeat.set(col * zoom, row * zoom);
                        mat.map!.offset.set(margin * col, row + (margin * row)); 
                    } else if (i === 5) { // Back (-Z)
                        mat.map!.repeat.set(col * zoom, row * zoom);
                        mat.map!.offset.set(col + (margin * col), row + (margin * row)); 
                    } else { // Timber side walls
                        mat.map!.repeat.set(col * zoom, row * zoom);
                        mat.map!.offset.set(margin * col, margin * row);
                    }
                }
                
                mats.push(mat);
            }
            return mats;
        };

        return {
            foundation: {
                args: [width, foundationHeight, depth] as [number, number, number],
                pos: [0, foundationHeight / 2, 0] as [number, number, number],
                mats: createLayerMaterials('foundation')
            },
            facade: {
                args: [width * 1.01, facadeHeight, depth * 1.01] as [number, number, number], 
                pos: [0, foundationHeight + (facadeHeight/2) - 0.02, 0] as [number, number, number], // Tighter snap to close seams
                mats: createLayerMaterials('facade')
            }
        };
    }, [texture]);

    // Roof Gables - Tighter quadrant mapping
    const roofGables = useMemo(() => {
        const width = 2.45;
        const roofHeight = 1.4;
        const baseTotalHeight = 1.78; 

        const gableGeo = new THREE.PlaneGeometry(width, 2.0);
        const roofTexture = texture.clone();
        roofTexture.offset.set(0.5, 0); 
        roofTexture.repeat.set(0.5, 0.5);

        return {
            geo: gableGeo,
            mat: new THREE.MeshStandardMaterial({ 
                map: roofTexture, 
                side: THREE.DoubleSide,
                transparent: true,
                alphaTest: 0.1,
                roughness: 1,
                metalness: 0
            }),
            height: baseTotalHeight
        };
    }, [texture]);

    const [isHovered, setIsHovered] = React.useState(false);

    const handleInteraction = () => {
        if (linkedDimension) {
            stashPosition(position, 'faerun');
            onTrigger?.(linkedDimension);
            swapDimension(linkedDimension);
        }
    };

    useFrame(() => {
        if (groupRef.current && !isDragging) {
            groupRef.current.position.set(position[0], position[1], position[2]);
        }
    });

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
                            // Scale Normalization for Inn (2.2x view multiplier)
                            const baseScale = groupRef.current.scale.x / 2.2;
                            
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
            <group 
                ref={groupRef}
                position={position} 
                scale={scale}
            onPointerOver={() => setIsHovered(true)}
            onPointerOut={() => setIsHovered(false)}
            onClick={handleInteraction}
        >
            {/* 1. COMPOSITE BODY */}
            <mesh 
                position={compositeBuilding.foundation.pos} 
                material={compositeBuilding.foundation.mats}
            >
                <boxGeometry args={compositeBuilding.foundation.args} />
            </mesh>

            <mesh 
                position={compositeBuilding.facade.pos} 
                material={compositeBuilding.facade.mats}
            >
                <boxGeometry args={compositeBuilding.facade.args} />
            </mesh>

            {/* 2. ROOF GABLES (Snapping to facade edges) */}
            <mesh 
                geometry={roofGables.geo} 
                material={roofGables.mat}
                position={[0, roofGables.height + 0.7, 1.2]}
                rotation={[-Math.PI / 4, 0, 0]}
            />
            <mesh 
                geometry={roofGables.geo} 
                material={roofGables.mat}
                position={[0, roofGables.height + 0.7, -1.2]}
                rotation={[Math.PI / 4, 0, 0]}
            />

            {/* Interaction Aura */}
            {isHovered && linkedDimension && (
                <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <Text
                        position={[0, 3.5, 0]}
                        fontSize={0.4}
                        color="#22d3ee"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="#083344"
                    >
                        [ ENTER {id?.replace(/_/g, ' ').toUpperCase()} ]
                    </Text>
                </Float>
            )}

            {/* Ring Base Glow */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[scale * 2.5, scale * 2.7, 32]} />
                <meshStandardMaterial 
                    color={isHovered ? "#22d3ee" : "#8b4513"} 
                    emissive={isHovered ? "#22d3ee" : "#000"}
                    emissiveIntensity={2}
                    transparent 
                    opacity={0.6} 
                />
            </mesh>
        </group>
        </>
    );
};
