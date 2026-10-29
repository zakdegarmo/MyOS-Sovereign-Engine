import React, { useMemo, useEffect, useState } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

// Define our biome textures (from lowest elevation to highest)
const TEXTURES = [
    '/assets/textures/terrain/terrain/ground_mud_d.jpg',     // 0: Deep/Mud
    '/assets/textures/terrain/terrain/desert_sand_d.jpg',    // 1: Sand/Beach
    '/assets/textures/terrain/terrain/grass_green_d.jpg',    // 2: Grassland
    '/assets/textures/terrain/terrain/mntn_dark_d.jpg',      // 3: Mountain/Rock
    '/assets/textures/terrain/terrain/snow1_d.jpg'           // 4: Snow Peak
];

const MAP_WIDTH = 150;
const MAP_HEIGHT = 150;
const TILE_SIZE = 1;

interface TileData {
    biomeIndex: number;
    height: number;
}

const ProceduralTilemap: React.FC = () => {
    // Load all 5 textures
    const textureMaps = useLoader(THREE.TextureLoader, TEXTURES);
    
    // Ensure textures repeat properly if scaled
    textureMaps.forEach(tex => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
    });

    const [mapData, setMapData] = useState<TileData[][]>([]);

    useEffect(() => {
        const noise2D = createNoise2D();
        const newMap: TileData[][] = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(null));
        
        // DECREASED SCALE for sweeping continents instead of tiny splotches
        const scale = 0.015; 
        const MAX_HEIGHT = 8; // How tall the mountains get

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // Combine two octaves of noise for more natural shapes (large continents + small details)
                let nx = x * scale;
                let ny = y * scale;
                let e = 1 * noise2D(nx, ny) + 0.5 * noise2D(2 * nx, 2 * ny) + 0.25 * noise2D(4 * nx, 4 * ny);
                
                // Normalize e (which is roughly -1.75 to 1.75) to 0 -> 1
                let value = (e + 1.75) / 3.5;
                // Clamp just in case
                value = Math.max(0, Math.min(1, value));

                // Map the normalized value to a biome index (0 to 4)
                let biomeIndex = 2; // Default Grass
                if (value < 0.3) biomeIndex = 0;       // Mud (Deep Water)
                else if (value < 0.4) biomeIndex = 1;  // Sand (Shoreline)
                else if (value < 0.65) biomeIndex = 2; // Grass (Plains)
                else if (value < 0.85) biomeIndex = 3; // Mountain (Cliffs)
                else biomeIndex = 4;                   // Snow (Peaks)

                // Calculate a flat height for now (no Minecraft blocks)
                const steppedHeight = 0;

                newMap[y][x] = { biomeIndex, height: steppedHeight };
            }
        }

        setMapData(newMap);
    }, []);

    // Explicitly declare hooks to prevent React render cycle crashes
    const ref0 = React.useRef<THREE.InstancedMesh>(null);
    const ref1 = React.useRef<THREE.InstancedMesh>(null);
    const ref2 = React.useRef<THREE.InstancedMesh>(null);
    const ref3 = React.useRef<THREE.InstancedMesh>(null);
    const ref4 = React.useRef<THREE.InstancedMesh>(null);
    
    // Group them for easy iteration
    const meshRefs = [ref0, ref1, ref2, ref3, ref4];

    useEffect(() => {
        if (mapData.length === 0) return;
        if (meshRefs.some(ref => !ref.current)) return;

        const counts = [0, 0, 0, 0, 0];
        const dummy = new THREE.Object3D();

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const { biomeIndex, height } = mapData[y][x];
                
                // Center the map around 0,0
                const posX = (x - MAP_WIDTH / 2) * TILE_SIZE;
                const posZ = (y - MAP_HEIGHT / 2) * TILE_SIZE;

                // Set the Y position to the height! This creates the 3D topography.
                dummy.position.set(posX, height * 0.5, posZ);
                
                // Rotate flat
                dummy.rotation.x = -Math.PI / 2;
                dummy.updateMatrix();

                // Set the matrix at the current count for this specific biome's InstancedMesh
                const currentCount = counts[biomeIndex];
                meshRefs[biomeIndex].current!.setMatrixAt(currentCount, dummy.matrix);
                
                counts[biomeIndex]++;
            }
        }

        // Update counts and trigger updates
        for (let i = 0; i < 5; i++) {
            if (meshRefs[i].current) {
                meshRefs[i].current!.count = counts[i];
                meshRefs[i].current!.instanceMatrix.needsUpdate = true;
            }
        }
    }, [mapData]);

    if (mapData.length === 0) return null;

    return (
        <group>
            {/* Render an InstancedMesh for every single biome type */}
            {meshRefs.map((ref, index) => (
                <instancedMesh key={index} ref={ref} args={[undefined, undefined, MAP_WIDTH * MAP_HEIGHT]} castShadow receiveShadow>
                    <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
                    <meshStandardMaterial map={textureMaps[index]} side={THREE.DoubleSide} roughness={0.9} />
                </instancedMesh>
            ))}
        </group>
    );
};

export const FaerunSandbox: React.FC = () => {
    return (
        <div className="w-full h-full bg-slate-900 relative">
            <div className="absolute top-4 left-4 z-10 bg-black/80 p-4 border border-fuchsia-500/30 rounded-xl text-white font-mono min-w-[300px] shadow-2xl">
                <h1 className="text-xl font-bold text-fuchsia-400 mb-2">Faerun Procedural Sandbox</h1>
                <p className="text-sm text-slate-300">Phase 7: 3D Topography & Octaves</p>
                <p className="text-xs text-slate-500 mt-2">
                    Injecting "Charm" by combining multiple layers of noise (Octaves) for realistic sweeping continents, and mapping the noise values to physical 3D elevation (Y-axis) for voxel-style topography.
                </p>
            </div>

            <Canvas camera={{ position: [0, 40, 60], fov: 50 }} shadows>
                <ambientLight intensity={0.6} />
                {/* Add a shadow-casting sun for depth */}
                <directionalLight 
                    position={[50, 100, 50]} 
                    intensity={2} 
                    castShadow 
                    shadow-mapSize-width={2048} 
                    shadow-mapSize-height={2048}
                    shadow-camera-left={-80}
                    shadow-camera-right={80}
                    shadow-camera-top={80}
                    shadow-camera-bottom={-80}
                />
                <OrbitControls makeDefault />
                
                <React.Suspense fallback={null}>
                    <ProceduralTilemap />
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default FaerunSandbox;
