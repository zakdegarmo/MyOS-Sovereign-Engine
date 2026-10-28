import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';

// --- FAERUN TOPOGRAPHY CONSTANTS ---
const PILLAR_HEIGHT = 2.5; // Shorter pillars for gradual terraces
const NOISE_FREQ = 0.018;    
const NOISE_AMP = 28.0;
const DRAW_DISTANCE = 60.0; // Fog threshold

import { useWorld } from '../../engine/WorldContext';
import { topographyRegistry } from '../../engine/TopographyRegistry';

/**
 * Multi-Octave Sandbox Elevation with Seeding.
 */
export const getFaerunElevation = (x: number, z: number, config?: any) => {
    const seed = config?.seed || 42;
    const freq = config?.complexity || NOISE_FREQ;
    const amp = (config?.heightScale || NOISE_AMP) * (config?.scale || 1.0);
    const octaves = config?.octaves || 3;

    let total = 0;
    let currentFreq = freq;
    let currentAmp = amp;

    for (let i = 0; i < octaves; i++) {
        // Multi-layered pseudo-random harmonic seeding
        total += Math.sin((x + seed) * currentFreq) * Math.cos((z - seed) * currentFreq) * currentAmp;
        currentFreq *= 2.0;
        currentAmp *= 0.5;
    }
    return total;
};

/**
 * Biome Color Mapper
 */
const getBiomeColor = (elev: number) => {
    if (elev < -8) return new THREE.Color('#3498db'); // Deep Water
    if (elev < -5) return new THREE.Color('#5dade2'); // Shallow Water
    if (elev < -4) return new THREE.Color('#f4d03f'); // Sand
    if (elev < 4)  return new THREE.Color('#2e7d32'); // Grass
    if (elev < 8)  return new THREE.Color('#616a6b'); // Rock
    return new THREE.Color('#fdfefe'); // Snow
};

/**
 * Quantized Elevation: Snaps to the center of the nearest hex.
 * This is the 'Heroscape Truth' that ensures sprites stand on flat tops.
 */
export const getFaerunQuantizedElevation = (x: number, z: number, radius: number = 0.762, config?: any) => {
    const dx = radius * Math.sqrt(3);
    const dz = radius * 1.5;

    // Convert world coords to Hex-Grid row/col
    const row = Math.round(z / dz);
    const col = Math.round((x - (row % 2 !== 0 ? dx / 2 : 0)) / dx);

    // Calculate hex center world-space
    const centerX = col * dx + (row % 2 !== 0 ? dx / 2 : 0);
    const centerZ = row * dz;

    // Return elevation at center, quantized to 0.5m steps for "Discrete Terrace" look
    const rawElev = getFaerunElevation(centerX, centerZ, config);
    return Math.round(rawElev * 2) / 2; // Snaps to 0.5m increments
};

interface FaerunWorldProps {
    isActive: boolean;
    playerPosition: THREE.Vector3;
    worldOffset?: THREE.Vector3;
    backgroundUrl?: string;
    children?: React.ReactNode;
}

export const FaerunWorld: React.FC<FaerunWorldProps> = ({ 
    isActive, 
    playerPosition, 
    children 
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // --- COVALENT HEX GRID CONFIG (D&D 5ft SCALE) ---
    // Radius R = 0.762m (Distance center-to-corner for 5ft diameter)
    const RADIUS = 0.762;
    const DX = RADIUS * Math.sqrt(3); 
    const DZ = RADIUS * 1.5;         
    const GRID_SIZE = 120;            // Horizon Scale: 14,400 pillars
    const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE;

    // --- GEOMETRY MANIFESTATION ---
    const hexGeometry = useMemo(() => {
        // Trapezoidal Implementation: radiusBottom > radiusTop creates the "flare" effect
        // This causes pillars to smush together at the base for a natural clay look.
        const radiusTop = RADIUS;
        const radiusBottom = RADIUS * 1.08; 
        const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, PILLAR_HEIGHT, 6);
        return geo;
    }, [RADIUS]);

    // --- CLAYMATION TEXTURES ---
    const { terrainConfig } = useWorld();
    const textureLoader = useMemo(() => new THREE.TextureLoader(), []);
    const clayGrass = useMemo(() => textureLoader.load('/assets/claymation_grass_texture_1775971491474.png'), [textureLoader]);
    const clayRock = useMemo(() => textureLoader.load('/assets/claymation_rock_texture_1775971507445.png'), [textureLoader]);
    const claySnow = useMemo(() => textureLoader.load('/assets/claymation_snow_texture_1775971519642.png'), [textureLoader]);
    
    const hexMaterials = useMemo(() => {
        // Use White materials to allow per-instance coloring via meshRef.current.setColorAt
        const sideMat = new THREE.MeshStandardMaterial({
            color: '#8b4513', // Brown clay base for sides
            roughness: 1.0,
            metalness: 0.0,
            flatShading: true
        });
        const topMat = new THREE.MeshStandardMaterial({
            color: '#ffffff', 
            roughness: 0.9,
            metalness: 0.0,
            flatShading: true
        });
        return [sideMat, topMat, sideMat]; // [Side, Top, Bottom]
    }, []);

    useEffect(() => {
        if (!isActive) {
            topographyRegistry.unregister('faerun');
            return;
        }
        topographyRegistry.register({
            id: 'faerun',
            getElevation: (x, z) => getFaerunQuantizedElevation(x, z, RADIUS, terrainConfig),
            projection: 'flat'
        });
        topographyRegistry.setCurrent('faerun');
        (window as any).GET_FAERUN_ELEVATION = (x: number, z: number) => getFaerunQuantizedElevation(x, z, RADIUS, terrainConfig);

        return () => {
            topographyRegistry.unregister('faerun');
            if ((window as any).GET_FAERUN_ELEVATION) {
                (window as any).GET_FAERUN_ELEVATION = undefined;
            }
        };
    }, [isActive, terrainConfig]);

    // --- REAL-TIME TREADMILL SYNC ---
    useFrame((state) => {
        if (!isActive || !meshRef.current) return;

        // --- GRID STABILIZATION: THE LATTICE SNAP ---
        // Instead of moving relative to player.x/z, we snap to an absolute global grid.
        // This ensures hexes never 'jump' or overlap due to precision loss.
        const gridOriginX = Math.floor(playerPosition.x / DX) * DX;
        const gridOriginZ = Math.floor(playerPosition.z / DZ) * DZ;

        let idx = 0;
        for (let row = -GRID_SIZE / 2; row < GRID_SIZE / 2; row++) {
            for (let col = -GRID_SIZE / 2; col < GRID_SIZE / 2; col++) {
                let x = col * DX;
                if (row % 2 !== 0) x += DX / 2;
                let z = row * DZ;

                // Absolute Global Coords
                const worldX = x + gridOriginX;
                const worldZ = z + gridOriginZ;

                // Relative Screen Coords for Three.js Group centering
                const localX = worldX - playerPosition.x;
                const localZ = worldZ - playerPosition.z;
                
                // --- QUANTIZED ELEVATION ---
                const elev = getFaerunQuantizedElevation(worldX, worldZ, RADIUS, terrainConfig);

                // --- FOG OF WAR (Visual Culling) ---
                const distSq = localX*localX + localZ*localZ;
                const maxDist = (GRID_SIZE / 2) * RADIUS * 1.5;
                const scale = Math.max(0, 1 - Math.max(0, (Math.sqrt(distSq) - (maxDist * 0.7)) / (maxDist * 0.3)));

                dummy.position.set(localX, (elev * scale) - (PILLAR_HEIGHT / 2), localZ);
                dummy.scale.set(scale, 1, scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(idx, dummy.matrix);

                // --- BIOME COLORING ---
                const biomeColor = getBiomeColor(elev);
                
                // Adjust side color slightly based on biome (e.g., darker version of top)
                const sideColor = biomeColor.clone().multiplyScalar(0.4); 
                // Note: setColorAt sets BOTH top and side if single material, 
                // but since we have a materials array, we can't easily set different colors 
                // for top/side per instance without custom shaders.
                // For now, we will use biomeColor for the whole pillar to ensure biomes work.
                meshRef.current.setColorAt(idx, biomeColor);
                
                idx++;
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;



        // --- CAMERA GRAVITY (Smooth) ---
        const currentElev = getFaerunQuantizedElevation(playerPosition.x, playerPosition.z, RADIUS, terrainConfig);
        const targetCamY = 6.0 + currentElev; // Lower camera for 5ft scale
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetCamY, 0.1);
    });

    if (!isActive) return null;

    return (
        <group name="REALMS_OF_FAERUN_SANCTUARY">
            <Sky distance={450000} sunPosition={[50, 100, 50]} inclination={0.6} azimuth={0.1} />
            <directionalLight 
                position={[50, 100, 50]} 
                intensity={10.0} 
                castShadow 
                shadow-mapSize={[1024, 1024]}
                color="#fffcf0"
            />
            <ambientLight intensity={1.5} />

            {/* THE COVALENT LATTICE (Heroscape Pillars) */}
            <instancedMesh 
                ref={meshRef} 
                args={[hexGeometry, hexMaterials as any, INSTANCE_COUNT]} 
                receiveShadow 
                castShadow
            />

            {children}
        </group>
    );
};

