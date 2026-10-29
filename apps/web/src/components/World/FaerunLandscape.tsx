import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

/**
 * FAERÛN LANDSCAPE: THE FORGOTTEN REALMS SUBSTRATE
 * A high-fidelity geodesic terrain system with deterministic CPU-side grounding.
 */

export const FaerunLandscape: React.FC = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    const { currentDimension } = useWorld();
    const isActive = currentDimension === 'faerun' || currentDimension === 'astra_faerun';
    const envSpec = usePersistentWorldStore(state => state.environmentSpec);
    
    // --- TOPOGRAPHY CONSTANTS ---
    const RADIUS = 10000; // Sphere radius remains static for spherical projection mapping
    const SEED = 1337.0;

    const terrainScale = envSpec?.terrainScale ?? 0.005;
    const terrainHeight = envSpec?.terrainHeight ?? 25.0;
    const grassColorStr = envSpec?.grassColor ?? "#1a4d1a";
    const dirtColorStr = envSpec?.dirtColor ?? "#4d331a";
    const stoneColorStr = envSpec?.stoneColor ?? "#4d4d4d";

    // --- GEODESIC GEOMETRY ---
    // High-density Icosahedron for smooth terrain
    const geometry = useMemo(() => {
        const geom = new THREE.IcosahedronGeometry(RADIUS, 128);
        return geom;
    }, [RADIUS]);

    // --- DETERMINISTIC ELEVATION (CPU-Side Truth) ---
    // This matches the shader logic exactly for pixel-perfect grounding.
    const getFaerunElevation = useMemo(() => {
        return (x: number, z: number) => {
            // Simple but high-fidelity sine-noise stack
            let h = 0;
            let freq = terrainScale;
            let amp = terrainHeight;
            
            for (let i = 0; i < 3; i++) {
                h += Math.sin((x + SEED) * freq) * Math.cos((z - SEED) * freq) * amp;
                freq *= 2.0;
                amp *= 0.5;
            }
            return h;
        };
    }, [terrainScale, terrainHeight, SEED]);

    // --- SHADER MATERIAL ---
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uRadius: { value: RADIUS },
                uTerrainScale: { value: terrainScale },
                uTerrainHeight: { value: terrainHeight },
                uSeed: { value: SEED },
                uGrassColor: { value: new THREE.Color(grassColorStr) },
                uDirtColor: { value: new THREE.Color(dirtColorStr) },
                uStoneColor: { value: new THREE.Color(stoneColorStr) },
            },
            vertexShader: `
                varying vec3 vWorldPos;
                varying float vElevation;
                varying vec3 vNormal;
                uniform float uRadius;
                uniform float uTerrainScale;
                uniform float uTerrainHeight;
                uniform float uSeed;

                void main() {
                    vNormal = normal;
                    vec3 pos = position;
                    
                    // Displacement Math (Matches CPU)
                    float h = 0.0;
                    float freq = uTerrainScale;
                    float amp = uTerrainHeight;
                    for(int i=0; i<3; i++) {
                        h += sin((pos.x + uSeed) * freq) * cos((pos.z - uSeed) * freq) * amp;
                        freq *= 2.0;
                        amp *= 0.5;
                    }
                    
                    vElevation = h;
                    vec3 displaced = pos + normal * h;
                    vWorldPos = displaced;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vWorldPos;
                varying float vElevation;
                varying vec3 vNormal;
                uniform vec3 uGrassColor;
                uniform vec3 uDirtColor;
                uniform vec3 uStoneColor;

                void main() {
                    // Biome Mapping
                    vec3 color = uGrassColor;
                    if (vElevation > 15.0) color = uStoneColor;
                    else if (vElevation < -2.0) color = uDirtColor;
                    
                    // Simple Lighting
                    float light = dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
                    
                    // Grid Overlay for tactical feel (5ft grid = 1.524m)
                    float gridScale = 1.0 / 1.524;
                    vec2 grid = abs(fract(vWorldPos.xz * gridScale - 0.5) - 0.5) / fwidth(vWorldPos.xz * gridScale);
                    float line = min(grid.x, grid.y);
                    float gridVal = 1.0 - min(line, 1.0);
                    
                    vec3 finalColor = mix(color * light, vec3(1.0), gridVal * 0.1);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `
        });
    }, [RADIUS, terrainScale, terrainHeight, SEED, grassColorStr, dirtColorStr, stoneColorStr]);

    // Update Ground Truth whenever elevation function changes
    useEffect(() => {
        if (!isActive) {
            topographyRegistry.unregister('faerun_landscape');
            if ((window as any).GET_FAERUN_ELEVATION === getFaerunElevation) {
                (window as any).GET_FAERUN_ELEVATION = undefined;
            }
            return;
        }
        topographyRegistry.register({
            id: 'faerun_landscape',
            getElevation: getFaerunElevation,
            projection: 'spherical',
            radius: RADIUS
        });
        topographyRegistry.setCurrent('faerun_landscape');
        (window as any).GET_FAERUN_ELEVATION = getFaerunElevation;

        return () => {
            topographyRegistry.unregister('faerun_landscape');
            if ((window as any).GET_FAERUN_ELEVATION === getFaerunElevation) {
                (window as any).GET_FAERUN_ELEVATION = undefined;
            }
        };
    }, [isActive, getFaerunElevation]);

    // --- BRIDGE MANIFESTATION ---
    useFrame(({ clock }) => {
        if (!isActive) return;
        
        if (material) {
            material.uniforms.uTime.value = clock.elapsedTime;
        }
    });

    if (!isActive) return null;

    return (
        <mesh 
            ref={meshRef} 
            geometry={geometry} 
            material={material} 
            name="faerun_landscape" 
            position={[0, -RADIUS, 0]} // Position top at Y=0
            userData={{ isFloor: true }} 
        />
    );
};
