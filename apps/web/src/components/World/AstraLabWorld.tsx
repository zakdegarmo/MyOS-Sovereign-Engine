import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { ChunkPersistenceManager } from '../../engine/ChunkPersistenceManager';
import { SpatialPropCompositor, type SpatialPropItem } from './SpatialPropCompositor';
import { AstraLabHUD } from './AstraLabHUD';
import { TacticalEncounterHUD } from './TacticalEncounterHUD';
import { ParallaxatronEngine } from './ParallaxatronEngine';
import { useSpatialMemory } from './useSpatialMemory';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';
import { EnvironmentalJuice } from './EnvironmentalJuice';

interface AstraLabWorldProps {
    isActive: boolean;
    playerPosition: THREE.Vector3;
    size?: number;
    children?: React.ReactNode;
}

export interface PoiBeaconData {
    id: string;
    name: string;
    category: string;
    description: string;
    position: [number, number, number];
    color: string;
}

export interface CitySkylineData {
    id: string;
    name: string;
    position: [number, number, number];
    textureUrl: string;
    width: number;
    height: number;
}

const CITY_SKYLINES: CitySkylineData[] = [
    {
        id: 'skyline_waterdeep',
        name: 'City of Waterdeep',
        position: [-150, 18, 80],
        textureUrl: '/assets/skylines/waterdeep_skyline.png',
        width: 120,
        height: 60
    },
    {
        id: 'skyline_baldurs_gate',
        name: "Baldur's Gate",
        position: [-110, 18, 480],
        textureUrl: '/assets/skylines/baldurs_gate_skyline.png',
        width: 120,
        height: 60
    },
    {
        id: 'skyline_neverwinter',
        name: 'Neverwinter',
        position: [-180, 18, -140],
        textureUrl: '/assets/skylines/neverwinter_skyline.png',
        width: 120,
        height: 60
    },
    {
        id: 'skyline_candlekeep',
        name: 'Candlekeep Library Keep',
        position: [-130, 16, 650],
        textureUrl: '/assets/skylines/candlekeep_skyline.png',
        width: 100,
        height: 50
    },
    {
        id: 'skyline_silverymoon',
        name: 'Silverymoon',
        position: [-50, 16, -280],
        textureUrl: '/assets/skylines/silverymoon_skyline.png',
        width: 100,
        height: 50
    },
    {
        id: 'skyline_luskan',
        name: 'City of Luskan',
        position: [-210, 16, -320],
        textureUrl: '/assets/skylines/luskan_skyline.png',
        width: 100,
        height: 50
    },
    {
        id: 'skyline_mythdrannor',
        name: 'Ruins of Myth Drannor',
        position: [320, 16, -50],
        textureUrl: '/assets/skylines/mythdrannor_skyline.png',
        width: 100,
        height: 50
    }
];

const CitySkylineBillboard: React.FC<{ city: CitySkylineData }> = ({ city }) => {
    const texture = useTexture(city.textureUrl);
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ camera }) => {
        if (groupRef.current) {
            groupRef.current.quaternion.copy(camera.quaternion);
        }
    });

    return (
        <group ref={groupRef} position={city.position}>
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[city.width, city.height]} />
                <meshBasicMaterial map={texture} transparent alphaTest={0.2} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

/**
 * AstraLabWorld: Dedicated Laboratory Sandbox Environment (Testbed for AstraFaerunWorld).
 */
export const AstraLabWorld: React.FC<AstraLabWorldProps> = ({
    isActive,
    playerPosition,
    size,
    children
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const cloudRingRef = useRef<THREE.Mesh>(null);
    const creatureRingRef = useRef<THREE.Mesh>(null);
    const GRID_SIZE = 3.048; // 10 feet (Doubled grid square size for perfect player scale)
    const PLANE_SIZE = size || 2500;
    const SEGMENTS = 512;

    const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);
    const [isCombatActive, setIsCombatActive] = useState(false);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE, SEGMENTS, SEGMENTS);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, [PLANE_SIZE]);

    const { terrainConfig, currentDimension } = useWorld();
    const { activeParallaxPreset } = useSpatialMemory(currentDimension || 'astra_lab');
    const heightmap = useTexture(terrainConfig?.heightmapUrl || '/assets/textures/toril_heightmap.png');
    const torilTexture = useTexture('/assets/textures/toril_texture.png');

    const [texMud, texSand, texGrass, texStone, texSnow] = useTexture([
        '/assets/textures/terrain/terrain/ground_mud_d.jpg',
        '/assets/textures/terrain/terrain/desert_sand_d.jpg',
        '/assets/textures/terrain/terrain/grass_green_d.jpg',
        '/assets/textures/terrain/terrain/mntn_dark_d.jpg',
        '/assets/textures/terrain/terrain/snow1_d.jpg'
    ]);

    const skyTex = useTexture('/assets/textures/parallax_sky_layer1.png');
    const cloudTex = useTexture('/assets/textures/parallax_clouds_layer2.png');
    const creatureTex = useTexture('/assets/textures/parallax_creatures_layer3.png');

    useMemo(() => {
        skyTex.wrapS = skyTex.wrapT = THREE.RepeatWrapping;
        skyTex.repeat.set(4, 1);
        skyTex.colorSpace = THREE.SRGBColorSpace;

        cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping;
        cloudTex.repeat.set(3, 1);

        creatureTex.wrapS = creatureTex.wrapT = THREE.RepeatWrapping;
        creatureTex.repeat.set(3, 1);
    }, [skyTex, cloudTex, creatureTex]);

    const shaderMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uGridSize: { value: GRID_SIZE },
                uColor: { value: new THREE.Color("#00ffcc") },
                uOpacity: { value: 1.0 },
                uPlayerPos: { value: new THREE.Vector3(0, 0, 0) },
                uSeed: { value: terrainConfig?.seed || 42.0 },
                uNoiseFreq: { value: terrainConfig?.complexity || 0.018 },
                uNoiseAmp: { value: 12.0 },
                uHeightmap: { value: heightmap },
                uHasHeightmap: { value: false },
                uDisplacementScale: { value: 0.0 },
                uResolution: { value: 128.0 },
                uColorLevels: { value: 6.0 },
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
                        vec2 uv = (p.xy / 2500.0) + 0.5;
                        total = texture2D(uHeightmap, uv).r * 60.0;
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
                    displaced.y += h;

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
                        vec2 uv = (p.xy / 2500.0) + 0.5;
                        total = texture2D(uHeightmap, uv).r * 60.0;
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
                    vec2 gridCell = floor(vWorldPos.xz / uGridSize) * uGridSize + (uGridSize * 0.5);
                    float cellElev = getElev(gridCell);
                    
                    vec2 tileUv = fract(vWorldPos.xz / uGridSize);

                    vec4 texColor = vec4(0.0);
                    
                    if (cellElev < 2.0) {
                        texColor = texture2D(uTexMud, tileUv); // Coastal / Ocean Waters
                    } else if (cellElev < 8.0) {
                        texColor = texture2D(uTexSand, tileUv); // Lowland Shores
                    } else if (cellElev < 24.0) {
                        texColor = texture2D(uTexGrass, tileUv); // Inland Plains & Forests
                    } else if (cellElev < 42.0) {
                        texColor = texture2D(uTexStone, tileUv); // Mountain Slopes
                    } else {
                        texColor = texture2D(uTexSnow, tileUv); // Mountain Peaks & Glaciers
                    }

                    vec3 quantizedColor = floor(texColor.rgb * uColorLevels) / uColorLevels;

                    // Tactical Grid Lines Overlay
                    vec2 grid = abs(fract(vWorldPos.xz / uGridSize - 0.5) - 0.5) / fwidth(vWorldPos.xz / uGridSize);
                    float line = min(grid.x, grid.y);
                    float gridVal = 1.0 - min(line, 1.0);

                    // Distance-based Grid Line Fade (Sharp near player, smoothly fades out between 30m and 120m)
                    float distToPlayer = length(vWorldPos.xz - uPlayerPos.xz);
                    float gridFade = 1.0 - smoothstep(30.0, 120.0, distToPlayer);

                    vec3 finalColor = mix(quantizedColor, uColor, gridVal * uOpacity * gridFade * 0.4);
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
        });
    }, [GRID_SIZE, heightmap, terrainConfig, texMud, texSand, texGrass, texStone, texSnow]);

    const getAstraLabElevation = (x: number, z: number): number => {
        let total = 0.0;
        let freq = terrainConfig?.complexity || 0.018;
        let amp = 12.0;
        const seed = terrainConfig?.seed || 42.0;

        for (let i = 0; i < 5; i++) {
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
            topographyRegistry.unregister('astra_lab');
            return;
        }
        topographyRegistry.register({
            id: 'astra_lab',
            getElevation: getAstraLabElevation,
            projection: 'flat'
        });
        topographyRegistry.setCurrent('astra_lab');

        return () => {
            topographyRegistry.unregister('astra_lab');
        };
    }, [isActive, terrainConfig, currentDimension]);

    const px = playerPosition ? (playerPosition.x !== undefined ? playerPosition.x : (playerPosition as any)[0] || 0) : 0;
    const pz = playerPosition ? (playerPosition.z !== undefined ? playerPosition.z : (playerPosition as any)[2] || 0) : 0;

    // Snap terrain mesh center to player grid position so ground NEVER abruptly ends
    const snapX = Math.floor(px / GRID_SIZE) * GRID_SIZE;
    const snapZ = Math.floor(pz / GRID_SIZE) * GRID_SIZE;

    // Active surrounding chunks calculation
    const activeChunks = useMemo(() => {
        if (!isActive) return [];
        return ChunkPersistenceManager.getSurroundingChunks(px, pz, 1, 'astra_lab', terrainConfig?.seed || 42);
    }, [px, pz, isActive, terrainConfig?.seed]);

    // Geographically Accurate D&D POI Beacons on the Map of Faerûn
    const poiBeacons = useMemo<PoiBeaconData[]>(() => [
        {
            id: 'poi_waterdeep',
            name: 'City of Waterdeep',
            category: 'Metropolis / Capital',
            description: 'The Crown of the North. Located directly on the Sword Coast bay ocean harbour.',
            position: [-150, 0, 80],
            color: '#38bdf8'
        },
        {
            id: 'poi_yawning_portal',
            name: 'The Yawning Portal Inn',
            category: 'Iconic Tavern / Dungeon Entrance',
            description: 'Famous tavern inside Waterdeep Castle Ward, featuring the 140-foot shaft to Undermountain.',
            position: [-148, 0, 82],
            color: '#f59e0b'
        },
        {
            id: 'poi_neverwinter',
            name: 'Neverwinter',
            category: 'Jewel of the North',
            description: 'Located ~170 miles North of Waterdeep along the Sword Coast and Neverwinter River.',
            position: [-180, 0, -140],
            color: '#10b981'
        },
        {
            id: 'poi_baldurs_gate',
            name: "Baldur's Gate",
            category: 'Port City / Merchant Hub',
            description: 'Located ~400 miles South of Waterdeep on the River Chionthar near the Sea of Swords.',
            position: [-110, 0, 480],
            color: '#ef4444'
        },
        {
            id: 'poi_candlekeep',
            name: 'Candlekeep Library Keep',
            category: 'Fortress Monastery / Archive',
            description: 'Located ~120 miles South of Baldur\'s Gate on the coastal sea cliffs.',
            position: [-130, 0, 650],
            color: '#a855f7'
        },
        {
            id: 'poi_icewind_dale',
            name: 'Icewind Dale',
            category: 'Frozen Wilderness Region',
            description: 'Located far North past the Spine of the World mountains in the frozen Reghed tundra.',
            position: [-220, 0, -650],
            color: '#06b6d4'
        }
    ], []);

    // Active spatial props resolved from chunk nodes
    const spatialProps = useMemo<SpatialPropItem[]>(() => {
        const props: SpatialPropItem[] = [];

        // Merge props from surrounding chunks
        activeChunks.forEach(chunk => {
            if (chunk.modifiedProps) {
                chunk.modifiedProps.forEach(noun => {
                    if (noun.gridCoordinates) {
                        props.push({
                            id: noun.id,
                            name: noun.name,
                            textureUrl: noun.spriteUrl || '/assets/lpc/chest_squared.png',
                            position: [noun.gridCoordinates.x, 0, noun.gridCoordinates.z],
                            scale: [2.0, 2.0, 1]
                        });
                    }
                });
            }
        });

        return props;
    }, [activeChunks]);

    useFrame(() => {
        if (shaderMaterial?.uniforms?.uPlayerPos) {
            shaderMaterial.uniforms.uPlayerPos.value.set(px, 0, pz);
        }
    });

    if (!isActive) return null;

    return (
        <group name="AstraLabSubstrate">
            <EnvironmentalJuice biomeType="magic_lab" />
            
            {/* Standalone Cyclotronic Multiplane Parallax Engine (Atmospherics Driven by Spatial Memory) */}
            <ParallaxatronEngine presetId={activeParallaxPreset} anchorPosition={[px, 0, pz]} />

            {/* Infinite Ground Plane: Snapped to player grid offset so terrain never abruptly ends */}
            <mesh ref={meshRef} position={[snapX, 0, snapZ]} geometry={geometry} material={shaderMaterial} receiveShadow />

            {/* Canonical D&D POI Beacons & Interactive 2.5D Labels */}
            {poiBeacons.map(poi => {
                const isHovered = hoveredPoiId === poi.id;
                return (
                    <group key={poi.id} position={poi.position as [number, number, number]}>
                        <pointLight intensity={isHovered ? 6.0 : 3.5} color={poi.color} distance={35} />
                        
                        {/* Light Pillar Beam */}
                        <mesh position={[0, 8, 0]}>
                            <cylinderGeometry args={[0.2, 0.8, 16, 16]} />
                            <meshBasicMaterial color={poi.color} transparent opacity={isHovered ? 0.9 : 0.6} />
                        </mesh>
                        
                        {/* Glowing Beacon Orb */}
                        <mesh 
                            position={[0, 16, 0]}
                            onPointerOver={() => setHoveredPoiId(poi.id)}
                            onPointerOut={() => setHoveredPoiId(null)}
                        >
                            <sphereGeometry args={[1.2, 16, 16]} />
                            <meshBasicMaterial color={poi.color} />
                        </mesh>

                        {/* Interactive 2.5D Floating HTML Title Label & Hover Lore Card */}
                        <Html position={[0, 19, 0]} center distanceFactor={25} zIndexRange={[100, 0]}>
                            <div 
                                style={{
                                    userSelect: 'none',
                                    pointerEvents: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    fontFamily: 'Inter, system-ui, sans-serif'
                                }}
                                onMouseEnter={() => setHoveredPoiId(poi.id)}
                                onMouseLeave={() => setHoveredPoiId(null)}
                            >
                                {/* Floating Badge / Label */}
                                <div style={{
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: `1.5px solid ${poi.color}`,
                                    boxShadow: isHovered ? `0 0 20px ${poi.color}` : `0 0 10px rgba(0,0,0,0.5)`,
                                    borderRadius: '8px',
                                    padding: '6px 14px',
                                    color: '#f8fafc',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease-in-out'
                                }}>
                                    📍 {poi.name}
                                </div>

                                {/* Expanded Hover Lore Card */}
                                {isHovered && (
                                    <div style={{
                                        marginTop: '8px',
                                        width: '260px',
                                        background: 'rgba(15, 23, 42, 0.95)',
                                        backdropFilter: 'blur(12px)',
                                        border: `1px solid ${poi.color}`,
                                        borderRadius: '10px',
                                        padding: '12px',
                                        color: '#cbd5e1',
                                        fontSize: '12px',
                                        lineHeight: '1.4',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
                                    }}>
                                        <div style={{ color: poi.color, fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px' }}>
                                            {poi.category}
                                        </div>
                                        <div>{poi.description}</div>
                                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', color: '#94a3b8', textAlign: 'right' }}>
                                            Coordinates: [{poi.position[0]}, {poi.position[2]}]
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Html>
                    </group>
                );
            })}

            {/* Canonical 2.5D City Skyline Billboards towering on the horizon of Faerûn */}
            {CITY_SKYLINES.map(city => (
                <CitySkylineBillboard key={city.id} city={city} />
            ))}

            {/* Spatial Prop Compositor for 2.5D Billboards in Astra Lab Sandbox */}
            <React.Suspense fallback={null}>
                <SpatialPropCompositor props={spatialProps} />
            </React.Suspense>

            {children}
        </group>
    );
};
