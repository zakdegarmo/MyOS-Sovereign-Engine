import React, { useMemo, useState, useEffect } from 'react';
import { Instances, Instance, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
export interface VoxelConfig {
    gridSize: number; // Volume dimension (e.g. 32 -> 32x32x32)
    voxelSize: number; // Render size (e.g. 0.1)
    gap: number;      // Visual gap (0.1 = 10% gap)
    generator: 'Landscape' | 'Dungeon' | 'Dragon' | 'Structure';
}

// --- Generator Algorithms ---
const generateLandscape = (size: number): THREE.Vector3[] => {
    const voxels: THREE.Vector3[] = [];
    const scale = 0.2;
    // Simple Sin/Cos Terrain
    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
            const h1 = Math.sin(x * scale) * Math.cos(z * scale * 0.5);
            const h2 = Math.sin(x * scale * 2.5 + z * scale) * 0.2;
            const normalizedHeight = Math.floor(((h1 + h2 + 1) / 2.5) * (size * 0.6));

            // Add "Earth"
            for (let y = 0; y < normalizedHeight; y++) {
                voxels.push(new THREE.Vector3(x, y, z));
            }
        }
    }
    return voxels;
};

const generateDungeon = (size: number): THREE.Vector3[] => {
    const voxels: Set<string> = new Set();
    const voxelList: THREE.Vector3[] = [];

    // Drunkard's Walk
    let cursor = new THREE.Vector3(Math.floor(size / 2), Math.floor(size / 2), Math.floor(size / 2));
    const walkers = 5;
    const steps = size * 20;

    for (let w = 0; w < walkers; w++) {
        cursor.set(Math.floor(size / 2), Math.floor(size / 2), Math.floor(size / 2));
        for (let i = 0; i < steps; i++) {
            // Carve hollow area (Room)
            const roomSize = Math.random() > 0.9 ? 3 : 1;
            for (let rx = -1; rx <= roomSize; rx++) {
                for (let ry = -1; ry <= roomSize; ry++) {
                    for (let rz = -1; rz <= roomSize; rz++) {
                        // Boundary check
                        const p = new THREE.Vector3(cursor.x + rx, cursor.y + ry, cursor.z + rz);
                        if (p.x >= 0 && p.x < size && p.y >= 0 && p.y < size && p.z >= 0 && p.z < size) {
                            const key = `${p.x},${p.y},${p.z}`;
                            if (!voxels.has(key)) {
                                voxels.add(key);
                                voxelList.push(p);
                            }
                        }
                    }
                }
            }

            // Move
            const axis = Math.floor(Math.random() * 3);
            const dir = Math.random() > 0.5 ? 1 : -1;
            if (axis === 0) cursor.x += dir;
            if (axis === 1) cursor.y += dir;
            if (axis === 2) cursor.z += dir;

            // Clamp
            cursor.x = Math.max(0, Math.min(size - 1, cursor.x));
            cursor.y = Math.max(0, Math.min(size - 1, cursor.y));
            cursor.z = Math.max(0, Math.min(size - 1, cursor.z));
        }
    }
    return voxelList;
};

// --- Components ---

const GridVisualizer = ({ size, voxelSize }: { size: number, voxelSize: number }) => {
    const fullSize = size * voxelSize;
    // Edge-Centered Logic:
    // The grid is a box from 0,0,0 to fullSize,fullSize,fullSize

    return (
        <group>
            {/* Box Frame */}
            <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(fullSize, fullSize, fullSize)]} />
                <lineBasicMaterial color="#334155" opacity={0.3} transparent />
            </lineSegments>

            {/* Corner Markers */}
            <mesh position={[fullSize / 2, fullSize / 2, fullSize / 2]}>
                <boxGeometry args={[voxelSize, voxelSize, voxelSize]} />
                <meshBasicMaterial color="#4f46e5" wireframe />
            </mesh>

            <Text position={[fullSize / 2 + 1, 0, 0]} fontSize={0.5} color="#4f46e5">X</Text>
            <Text position={[0, fullSize / 2 + 1, 0]} fontSize={0.5} color="#10b981">Y</Text>
            <Text position={[0, 0, fullSize / 2 + 1]} fontSize={0.5} color="#f43f5e">Z</Text>
        </group>
    );
};

// Helper for dynamic range
const MAX_VOXELS = 100000;

export const MicroVoxelEngine = ({ config }: { config: VoxelConfig }) => {
    const [voxels, setVoxels] = useState<THREE.Vector3[]>([]);

    useEffect(() => {
        if (config.generator === 'Landscape') setVoxels(generateLandscape(config.gridSize));
        if (config.generator === 'Dungeon') setVoxels(generateDungeon(config.gridSize));
        if (config.generator === 'Dragon') setVoxels(generateDungeon(config.gridSize)); // Reuse for now
        if (config.generator === 'Structure') setVoxels(generateDungeon(config.gridSize)); // Reuse for now
    }, [config.gridSize, config.generator]);

    // Center the grid: If grid is 32*0.1 = 3.2 units wide, shift by -1.6
    const offset = (-config.gridSize * config.voxelSize) / 2;

    return (
        <group position={[offset, offset, offset]}>
            <GridVisualizer size={config.gridSize} voxelSize={config.voxelSize} />

            <Instances limit={MAX_VOXELS} range={voxels.length}>
                <boxGeometry args={[config.voxelSize * (1 - config.gap), config.voxelSize * (1 - config.gap), config.voxelSize * (1 - config.gap)]} />
                <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.5} />

                {voxels.map((pos) => (
                    <Instance
                        key={`${pos.x}-${pos.y}-${pos.z}`}
                        position={[
                            pos.x * config.voxelSize + (config.voxelSize / 2),
                            pos.y * config.voxelSize + (config.voxelSize / 2),
                            pos.z * config.voxelSize + (config.voxelSize / 2)
                        ]}
                        color={new THREE.Color().setHSL((pos.y / config.gridSize), 0.8, 0.5)}
                    />
                ))}
            </Instances>
        </group>
    );
};
