import React, { useEffect, useState } from 'react';
import { Billboard, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useBiomeTileGrid, MACRO_TILE_SIZE } from '../../hooks/useBiomeTileGrid';
import type { PlacedTile } from '../../engine/WfcSolver';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaerunPoi {
    name: string;
    slug: string;
    type: 'city' | 'ruin' | 'dungeon';
    worldX: number;
    worldZ: number;
    description: string;
    imageFile?: string;
    billboardWidth?: number;
    billboardHeight?: number;
}

interface FaerunPoiData {
    cities: FaerunPoi[];
    dungeons: FaerunPoi[];
}

interface BiomeFeatureLayerProps {
    /** WFC seed — must match the seed used in AstraLabWorld */
    seed?: number;
    /** Whether to render city billboards */
    showCities?: boolean;
    /** Whether to render dungeon markers */
    showDungeons?: boolean;
    /** Whether to render river geometry */
    showRivers?: boolean;
}

// ─── Individual city billboard ────────────────────────────────────────────────

interface CityBillboardProps {
    poi: FaerunPoi;
    elevationAt: (x: number, z: number) => number;
}

const CityBillboard: React.FC<CityBillboardProps> = ({ poi, elevationAt }) => {
    const texturePath = poi.imageFile ? `/assets/cities/${poi.imageFile}` : '/assets/cities/waterdeep.jpg';
    const texture = useTexture(texturePath);

    const groundY = topographyRegistry.getElevation(poi.worldX, poi.worldZ);
    const width = poi.billboardWidth ?? 60;
    const height = poi.billboardHeight ?? 38;
    const billboardY = groundY + (height / 2);

    return (
        <group position={[poi.worldX, 0, poi.worldZ]}>
            {/* City landmark billboard */}
            <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                <group position={[0, billboardY, 0]}>
                    {texture && (
                        <mesh>
                            <planeGeometry args={[width, height]} />
                            <meshBasicMaterial
                                map={texture}
                                transparent={true}
                                alphaTest={0.1}
                                depthWrite={true}
                                blending={THREE.NormalBlending}
                                toneMapped={false}
                            />
                        </mesh>
                    )}

                    {/* City nameplate */}
                    <Text
                        position={[0, -(height / 2) - 3.5, 0]}
                        fontSize={5.0}
                        color={poi.type === 'ruin' ? '#c084fc' : '#fbbf24'}
                        outlineWidth={0.4}
                        outlineColor="#000000"
                        anchorX="center"
                        anchorY="middle"
                        renderOrder={10}
                    >
                        {poi.name.toUpperCase()}
                    </Text>

                    {/* Base indicator ring */}
                    <mesh position={[0, -(height / 2) - 1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[width * 0.2, width * 0.25, 32]} />
                        <meshBasicMaterial
                            color={poi.type === 'ruin' ? '#8844ff' : '#ffaa22'}
                            transparent={true}
                            opacity={0.4}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            </Billboard>
        </group>
    );
};

// ─── Dungeon marker ────────────────────────────────────────────────────────────

const DungeonMarker: React.FC<{ poi: FaerunPoi; elevationAt: (x: number, z: number) => number }> = ({ poi, elevationAt }) => {
    const groundY = topographyRegistry.getElevation(poi.worldX, poi.worldZ);
    return (
        <group position={[poi.worldX, groundY, poi.worldZ]}>
            <Billboard>
                <Text
                    position={[0, 8, 0]}
                    fontSize={2.5}
                    color="#ff4444"
                    outlineWidth={0.3}
                    outlineColor="#000000"
                    anchorX="center"
                    anchorY="middle"
                >
                    ⚠ {poi.name}
                </Text>
            </Billboard>
            {/* Skull marker on ground */}
            <mesh position={[0, 0.5, 0]}>
                <octahedronGeometry args={[1.5, 0]} />
                <meshBasicMaterial color="#880000" wireframe={true} />
            </mesh>
        </group>
    );
};

// ─── River segment renderer ────────────────────────────────────────────────────

const RiverTile: React.FC<{ tile: PlacedTile; elevationAt: (x: number, z: number) => number }> = ({ tile, elevationAt }) => {
    const groundY = elevationAt(tile.worldX, tile.worldZ) - 0.5;
    return (
        <mesh position={[tile.worldX, groundY, tile.worldZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[MACRO_TILE_SIZE, MACRO_TILE_SIZE]} />
            <meshBasicMaterial color="#1a6694" transparent={true} opacity={0.75} />
        </mesh>
    );
};

// ─── Main BiomeFeatureLayer ───────────────────────────────────────────────────

export const BiomeFeatureLayer: React.FC<BiomeFeatureLayerProps> = ({
    seed = 42,
    showCities = true,
    showDungeons = true,
    showRivers = true,
}) => {
    const { tiles, getElevationAt } = useBiomeTileGrid(seed);
    const [poiData, setPoiData] = useState<FaerunPoiData | null>(null);

    // Load POI data
    useEffect(() => {
        fetch('/assets/data/faerun_pois.json')
            .then(r => r.json())
            .then((d: FaerunPoiData) => setPoiData(d))
            .catch(() => console.warn('[BiomeFeatureLayer] Could not load faerun_pois.json'));
    }, []);

    const riverTiles = tiles.filter(t => t.tile.isRiver);

    return (
        <group name="BiomeFeatureLayer">
            {/* City billboards */}
            {showCities && poiData?.cities.map(poi => (
                <CityBillboard
                    key={poi.slug}
                    poi={poi}
                    elevationAt={getElevationAt}
                />
            ))}

            {/* Dungeon markers */}
            {showDungeons && poiData?.dungeons.map(poi => (
                <DungeonMarker
                    key={poi.slug}
                    poi={poi}
                    elevationAt={getElevationAt}
                />
            ))}

            {/* River water planes */}
            {showRivers && riverTiles.map(tile => (
                <RiverTile
                    key={`river-${tile.col}-${tile.row}`}
                    tile={tile}
                    elevationAt={getElevationAt}
                />
            ))}
        </group>
    );
};

export default BiomeFeatureLayer;
