import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { BlobberDungeonExtruder } from '../../engine/BlobberDungeonExtruder';
import { UNDERMOUNTAIN_LEVEL_1_MAP } from '../../engine/UndermountainLevel1Map';
import { SpatialPropCompositor, type SpatialPropItem } from './SpatialPropCompositor';

interface UndermountainDungeonWorldProps {
    isActive: boolean;
    playerPosition?: [number, number, number];
    children?: React.ReactNode;
}

const UNDERMOUNTAIN_PROPS: SpatialPropItem[] = [
    {
        id: 'halaster_1',
        name: 'Halaster Blackcloak (The Mad Mage)',
        textureUrl: '/assets/lpc/npcs/halaster_blackcloak.png',
        position: [0, 0, -20],
        scale: [3.2, 3.2, 1]
    },
    {
        id: 'eye_golorr_1',
        name: 'Eye of Golorr',
        textureUrl: '/assets/lpc/items/eye_of_golorr.png',
        position: [0, 0, -12],
        scale: [1.5, 1.5, 1]
    },
    {
        id: 'chest_1',
        name: 'Reinforced Iron Chest',
        textureUrl: '/assets/lpc/chest_squared.png',
        position: [-10, 0, -10],
        scale: [1.8, 1.8, 1]
    },
    {
        id: 'well_1',
        name: 'The Yawning Portal Shaft Well',
        textureUrl: '/assets/lpc/lpc-well.png',
        position: [10, 0, 10],
        scale: [3.0, 3.0, 1]
    }
];

/**
 * UndermountainDungeonWorld: 3D Doom/Wolfenstein "Blobber" Megadungeon Environment.
 * Extrudes 3D stone walls, floor corridors, doors, and witchlight sconces directly from
 * Waterdeep: Dungeon of the Mad Mage - Maps & Miscellany grid datasets.
 */
export const UndermountainDungeonWorld: React.FC<UndermountainDungeonWorldProps> = ({
    isActive,
    playerPosition,
    children
}) => {
    const [texCobble, texWall] = useTexture([
        '/assets/textures/terrain/terrain/ground_mud_d.jpg',
        '/assets/textures/terrain/terrain/mntn_dark_d.jpg'
    ]);

    const wallMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texWall,
            roughness: 0.85,
            metalness: 0.1,
            color: '#475569'
        });
    }, [texWall]);

    const floorMaterial = useMemo(() => {
        return new THREE.MeshStandardMaterial({
            map: texCobble,
            roughness: 0.9,
            color: '#1e293b'
        });
    }, [texCobble]);

    const extrudedDungeon = useMemo(() => {
        return BlobberDungeonExtruder.extrudeMap(
            UNDERMOUNTAIN_LEVEL_1_MAP,
            wallMaterial,
            floorMaterial
        );
    }, [wallMaterial, floorMaterial]);

    const getDungeonElevation = (x: number, z: number): number => {
        return 0.0; // Level 1 dungeon floor is flat carved cobblestone
    };

    useEffect(() => {
        if (!isActive) return;
        topographyRegistry.register({
            id: 'undermountain',
            getElevation: getDungeonElevation,
            projection: 'flat'
        });
        topographyRegistry.setCurrent('undermountain');

        return () => {
            topographyRegistry.unregister('undermountain');
        };
    }, [isActive]);

    if (!isActive) return null;

    return (
        <group name="UndermountainDungeonSubstrate">
            {/* Dungeon Atmosphere: Dim ambient + Green Witchlight Torch Sconces */}
            <ambientLight intensity={0.3} color="#0f172a" />

            {/* Extruded 3D Floor Mesh */}
            <primitive object={extrudedDungeon.floorMesh} />

            {/* Extruded 3D Instanced Stone Wall Blocks (Single Draw Call Batching) */}
            <primitive object={extrudedDungeon.wallMesh} />

            {/* 2.5D Camera-Facing Billboard Props (Chests, Altars, Wells, Traps) */}
            <React.Suspense fallback={null}>
                <SpatialPropCompositor props={UNDERMOUNTAIN_PROPS} />
            </React.Suspense>

            {/* Witchlight Torch Sconces (Green/Teal Arcane Torches) */}
            {extrudedDungeon.torches.map((pos, idx) => (
                <group key={idx} position={pos}>
                    <pointLight intensity={4.0} color="#00ffcc" distance={25} castShadow />
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshBasicMaterial color="#00ffcc" />
                    </mesh>
                </group>
            ))}

            {/* Halaster's Central Arcane Glyph Lighting */}
            <pointLight position={[0, 8, 0]} intensity={3.0} color="#38bdf8" distance={45} />

            {children}
        </group>
    );
};
