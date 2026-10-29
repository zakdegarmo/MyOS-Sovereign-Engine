import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getFaerunElevation } from './FaerunWorld';
import { useWorld } from '../../engine/WorldContext';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { EnvironmentalJuice } from './EnvironmentalJuice';

interface AstraFaerunWorldProps {
    isActive: boolean;
    playerPosition: THREE.Vector3;
    children?: React.ReactNode;
}

/**
 * AstraFaerunWorld: The Neural Lattice Substrate with Biome Topography.
 * 
 * FEATURES:
 * 1. Warped Tactical Grid: Matches the underlying hills.
 * 2. Biome Clusters: Procedural grass/dirt/stone groupings.
 * 3. 5ft Grid (1.524m): Exactly aligned to D&D scale.
 * 4. Selective Pixelation: Quantitative 16-bit look for terrain only.
 */
export const AstraFaerunWorld: React.FC<AstraFaerunWorldProps & { size?: number }> = ({
    isActive,
    playerPosition,
    size,
    children
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const GRID_SIZE = 3.048; // 10 feet (Doubled grid square size for perfect player scale)
    const PLANE_SIZE = size || 2500;
    const SEGMENTS = 512; // Increased segments for heightmap detail

    // Use a flat plane geometry; the shader handles displacement on XZ.
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, [PLANE_SIZE]);

    const { terrainConfig, currentDimension } = useWorld();
    const heightmap = useTexture(terrainConfig?.heightmapUrl || '/assets/textures/toril_biome_mask.png');

    const [texMud, texSand, texGrass, texStone, texSnow, skyTexture] = useTexture([
        '/assets/textures/terrain/terrain/ground_mud_d.jpg',
        '/assets/textures/terrain/terrain/desert_sand_d.jpg',
        '/assets/textures/terrain/terrain/grass_green_d.jpg',
        '/assets/textures/terrain/terrain/mntn_dark_d.jpg',
        '/assets/textures/terrain/terrain/snow1_d.jpg',
        '/integrations/Images/Bgs/HDRPanoramas0044_8_350.jpg'
    ]);

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uGridSize: { value: GRID_SIZE },
                uColor: { value: new THREE.Color("#00ffcc") },
                uOpacity: { value: 1.0 },
                uPlayerPos: { value: new THREE.Vector3(0, 0, 0) },
                uSeed: { value: terrainConfig?.seed || 42.0 },
                uNoiseFreq: { value: terrainConfig?.complexity || 0.018 },
                uNoiseAmp: { value: terrainConfig?.heightScale || 28.0 },
                uHeightmap: { value: heightmap },
                uHasHeightmap: { value: false },
                uDisplacementScale: { value: terrainConfig?.heightScale !== undefined ? 1.0 : 0.0 }, // Force on if heightScale is present
                uResolution: { value: 128.0 }, // The target pixel grid resolution
                uColorLevels: { value: 6.0 },   // 16-bit feel (levels per channel)
                uTexMud: { value: texMud },
                uTexSand: { value: texSand },
                uTexGrass: { value: texGrass },
                uTexStone: { value: texStone },
                uTexSnow: { value: texSnow }
            },
            vertexShader: `
                varying vec3 vWorldPos;
                varying float vElevation;
                varying vec2 vUv;
                uniform float uSeed;
                uniform float uNoiseFreq;
                uniform float uNoiseAmp;
                uniform sampler2D uHeightmap;
                uniform bool uHasHeightmap;
                uniform float uDisplacementScale;

                float getElev(vec2 p) {
                    float total = 0.0;
                    if (uHasHeightmap) {
                        vec2 uv = (p.xy / 500.0) + 0.5;
                        total = texture2D(uHeightmap, uv).r * 50.0;
                    } else {
                        float freq = uNoiseFreq;
                        float amp = uNoiseAmp;
                        for(int i = 0; i < 5; i++) {
                            float n = sin((p.x * 0.7 + uSeed) * freq) * cos((p.y * 1.3 - uSeed) * freq);
                            if (i >= 2) n = abs(n);
                            total += n * amp;
                            freq *= 2.1;
                            amp *= 0.45;
                        }
                    }
                    return total;
                }

                void main() {
                    vUv = uv;
                    vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                    float h = getElev(worldPos.xz);
                    
                    vec3 displaced = position;
                    displaced.y += h; // Apply the elevation to the vertex Y

                    vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
                    vElevation = h;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vWorldPos;
                varying float vElevation;
                varying vec2 vUv;
                
                uniform float uGridSize;
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform vec3 uPlayerPos;
                uniform float uResolution;
                uniform float uColorLevels;
                
                uniform float uSeed;
                uniform float uNoiseFreq;
                uniform float uNoiseAmp;
                uniform sampler2D uHeightmap;
                uniform bool uHasHeightmap;
                
                uniform sampler2D uTexMud;
                uniform sampler2D uTexSand;
                uniform sampler2D uTexGrass;
                uniform sampler2D uTexStone;
                uniform sampler2D uTexSnow;

                float getElev(vec2 p) {
                    float total = 0.0;
                    if (uHasHeightmap) {
                        vec2 uv = (p.xy / 500.0) + 0.5;
                        total = texture2D(uHeightmap, uv).r * 50.0;
                    } else {
                        float freq = uNoiseFreq;
                        float amp = uNoiseAmp;
                        for(int i = 0; i < 5; i++) {
                            float n = sin((p.x * 0.7 + uSeed) * freq) * cos((p.y * 1.3 - uSeed) * freq);
                            if (i >= 2) n = abs(n);
                            total += n * amp;
                            freq *= 2.1;
                            amp *= 0.45;
                        }
                    }
                    return total;
                }

                void main() {
                    // 1. Calculate Grid Cell Center
                    vec2 gridCell = floor(vWorldPos.xz / uGridSize) * uGridSize + (uGridSize * 0.5);
                    float cellElev = getElev(gridCell);
                    
                    // 2. Calculate Local Tile UV
                    // By mapping to fract(vWorldPos / gridSize), the texture scales to perfectly fit the 5ft square!
                    vec2 tileUv = fract(vWorldPos.xz / uGridSize);

                    // 3. Sample the correct texture based on the cell's center elevation
                    vec4 texColor = vec4(0.0);
                    
                    if (cellElev < -2.0) {
                        texColor = texture2D(uTexMud, tileUv);
                    } else if (cellElev < 0.0) {
                        texColor = texture2D(uTexSand, tileUv);
                    } else if (cellElev < 8.0) {
                        texColor = texture2D(uTexGrass, tileUv);
                    } else if (cellElev < 15.0) {
                        texColor = texture2D(uTexStone, tileUv);
                    } else {
                        texColor = texture2D(uTexSnow, tileUv);
                    }

                    // 4. PALETTE LIMITATION
                    vec3 quantizedColor = floor(texColor.rgb * uColorLevels) / uColorLevels;

                    // 5. TACTICAL GRID OVERLAY (Preserved for high-def clarity)
                    vec2 grid = abs(fract(vWorldPos.xz / uGridSize - 0.5) - 0.5) / fwidth(vWorldPos.xz / uGridSize);
                    float line = min(grid.x, grid.y);
                    float gridVal = 1.0 - min(line, 1.0);
                    
                    // Distance-based Grid Line Fade (Sharp near player, smoothly fades out between 30m and 120m)
                    float distToPlayer = length(vWorldPos.xz - uPlayerPos.xz);
                    float gridFade = 1.0 - smoothstep(30.0, 120.0, distToPlayer);

                    // Blend the grid line on top of the PBR microtile
                    vec3 finalColor = mix(quantizedColor, uColor, gridVal * uOpacity * gridFade * 0.4);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
        });
    }, [GRID_SIZE, heightmap, terrainConfig, texMud, texSand, texGrass, texStone, texSnow]);

    useFrame(() => {
        if (meshRef.current) {
            (meshRef.current.material as THREE.ShaderMaterial).uniforms.uPlayerPos.value.copy(playerPosition);
        }
    });

    // --- TOPOGRAPHY TRUTH BRIDGE (CPU-Side Elevation for Avatars) ---
    const getAstraElevation = (x: number, z: number) => {
        let total = 0.0;
        // Hardcoded fallbacks match the default shader uniforms
        const seed = terrainConfig?.seed ?? 42.0;
        const noiseFreq = terrainConfig?.complexity ?? 0.018;
        const noiseAmp = terrainConfig?.heightScale ?? 28.0;

        let freq = noiseFreq;
        let amp = noiseAmp;
        for(let i = 0; i < 5; i++) {
            let n = Math.sin((x * 0.7 + seed) * freq) * Math.cos((z * 1.3 - seed) * freq);
            if (i >= 2) n = Math.abs(n);
            total += n * amp;
            freq *= 2.1;
            amp *= 0.45;
        }
        return total;
    };

    useEffect(() => {
        if (!isActive || !currentDimension) {
            if (currentDimension) topographyRegistry.unregister(currentDimension);
            if ((window as any).GET_ASTRA_ELEVATION === getAstraElevation) {
                (window as any).GET_ASTRA_ELEVATION = undefined;
            }
            return;
        }
        topographyRegistry.register({
            id: currentDimension,
            getElevation: getAstraElevation,
            projection: 'flat'
        });
        topographyRegistry.setCurrent(currentDimension);
        (window as any).GET_ASTRA_ELEVATION = getAstraElevation;

        return () => {
            topographyRegistry.unregister(currentDimension);
            if ((window as any).GET_ASTRA_ELEVATION === getAstraElevation) {
                (window as any).GET_ASTRA_ELEVATION = undefined;
            }
        };
    }, [isActive, terrainConfig, currentDimension]);

    if (!isActive) return null;

    return (
        <group name="AstraLattice">
            <EnvironmentalJuice biomeType="forest" />
            
            {/* Cyclotron Sky Dome: Track player position so dome is always centered around view */}
            <mesh position={[playerPosition.x, 0, playerPosition.z]}>
                <sphereGeometry args={[2500, 32, 32]} />
                <meshBasicMaterial map={skyTexture} side={THREE.BackSide} depthWrite={false} />
            </mesh>
            <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} receiveShadow />
            {children}
        </group>
    );
};
