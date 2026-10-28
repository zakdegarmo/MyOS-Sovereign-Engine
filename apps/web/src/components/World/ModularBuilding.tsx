import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';

interface BuildingPieceProps {
    id: string;
    type: 'wall' | 'floor' | 'pillar' | 'ceiling';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    textureUrl?: string;
    uvOffset?: [number, number];
    health: number;
    isSelected?: boolean;
    onSelect?: () => void;
    onUpdate?: (changes: any) => void;
    transformMode?: 'translate' | 'rotate' | 'scale';
}

export const BuildingPiece: React.FC<BuildingPieceProps> = ({
    id, type, position, rotation, scale, textureUrl, uvOffset, health, isSelected, onSelect, onUpdate, transformMode
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { camera, controls } = useThree();
    const [isDragging, setIsDragging] = useState(false);

    const texture = useTexture(textureUrl || '/assets/lpc/Exterior Tiles.png');
    if (texture) {
        texture.magFilter = texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        if (uvOffset) {
            texture.offset.set(uvOffset[0], uvOffset[1]);
        }
    }

    const { symbolicLinks } = useWorld();
    const isDestroyed = health <= 0;
    const GRID_SIZE = 1.524; // Lore-accurate 5 feet

    // Rust-like "damaged" visual
    const color = useMemo(() => {
        if (isDestroyed) return "#333";
        if (health < 50) return "#ffaaaa";
        return "#ffffff";
    }, [health, isDestroyed]);

    const geometry = useMemo(() => {
        switch (type) {
            case 'wall': return new THREE.BoxGeometry(1, 1, 0.1);
            case 'floor': return new THREE.BoxGeometry(1, 0.1, 1);
            case 'pillar': return new THREE.CylinderGeometry(0.1, 0.1, 1);
            case 'ceiling': return new THREE.BoxGeometry(1, 0.05, 1);
            case 'sprite': return new THREE.PlaneGeometry(1, 1);
            default: return new THREE.BoxGeometry(1, 1, 1);
        }
    }, [type]);

    return (
        <>
            {isSelected && !isDestroyed && (
                <TransformControls
                    object={meshRef.current || undefined}
                    mode={transformMode || 'translate'}
                    onMouseDown={() => {
                        setIsDragging(true);
                        if (controls) (controls as any).enabled = false;
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        if (controls) (controls as any).enabled = true;
                        if (meshRef.current) {
                            // Apply Lore-Accurate Grid Snapping
                            const pos = meshRef.current.position;
                            pos.x = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
                            pos.y = Math.round(pos.y / 0.5) * 0.5; // Half-meter vertical snap
                            pos.z = Math.round(pos.z / GRID_SIZE) * GRID_SIZE;

                            onUpdate?.({
                                position: pos.toArray(),
                                rotation: meshRef.current.rotation.toArray().slice(0, 3),
                                scale: meshRef.current.scale.toArray()
                            });
                        }
                    }}
                />
            )}
            <mesh
                ref={meshRef}
                position={position}
                rotation={rotation}
                scale={scale}
                onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
                castShadow
                receiveShadow
                visible={!isDestroyed || Math.random() > 0.5} // "Glitchy" destruction
            >
                <primitive object={geometry} attach="geometry" />
                <meshStandardMaterial 
                    map={texture} 
                    color={color} 
                    transparent={isDestroyed || type === 'sprite'}
                    side={type === 'sprite' ? THREE.DoubleSide : THREE.FrontSide}
                    opacity={isDestroyed ? 0.3 : 1.0}
                    wireframe={isDestroyed}
                />
            </mesh>
        </>
    );
};

export const ModularBuildingSystem: React.FC = () => {
    const { buildingPieces, updateBuildingPiece } = useWorld();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <group name="MODULAR_BUILDING_SYSTEM">
            {buildingPieces.map(piece => (
                <BuildingPiece
                    key={piece.id}
                    {...piece}
                    isSelected={selectedId === piece.id}
                    onSelect={() => setSelectedId(piece.id)}
                    onUpdate={(changes) => updateBuildingPiece(piece.id, changes)}
                />
            ))}
        </group>
    );
};
