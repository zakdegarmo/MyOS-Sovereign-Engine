import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, MapControls } from '@react-three/drei';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { aoEngine } from '../../Logic/AOGenerator';
import * as THREE from 'three';

const CHUNK_SIZE = 16;
const TILE_SIZE = 2; // Real-world scale

function TerrainTile({ x, z, tileID, isCanon }: { x: number, z: number, tileID: number, isCanon: boolean }) {
    const texPath = `/assets/lpc/Exterior Tiles.png`; 
    // We would ideally slice the sprite sheet based on tileID, but for this proof of concept
    // we'll just tint the plane based on whether it is canonical or not, and use a basic color.
    
    let color = '#3a8a3a'; // Grass
    if (tileID === 28) color = '#3a5a8a'; // Water
    if (tileID === 16) color = '#555555'; // Cobblestone (City)
    
    return (
        <mesh position={[x * TILE_SIZE, 0, z * TILE_SIZE]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            {isCanon && (
                <mesh position={[0, 0, 0.01]}>
                     <planeGeometry args={[TILE_SIZE * 0.9, TILE_SIZE * 0.9]} />
                     <meshBasicMaterial color="#ffff00" transparent opacity={0.2} />
                </mesh>
            )}
        </mesh>
    );
}

export default function LivingRealm() {
    const [chunkX, setChunkX] = useState(0);
    const [chunkZ, setChunkZ] = useState(0);

    const terrain = useMemo(() => {
        const tiles = [];
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let z = 0; z < CHUNK_SIZE; z++) {
                const worldX = (chunkX * CHUNK_SIZE) + x;
                const worldZ = (chunkZ * CHUNK_SIZE) + z;
                const data = aoEngine.getTerrain(worldX, worldZ);
                tiles.push(
                    <TerrainTile 
                        key={`${worldX}-${worldZ}`} 
                        x={worldX} 
                        z={worldZ} 
                        tileID={data.tileID} 
                        isCanon={data.isCanon} 
                    />
                );
            }
        }
        return tiles;
    }, [chunkX, chunkZ]);

    const entities = useMemo(() => {
        return aoEngine.getEntitiesInChunk(chunkX, chunkZ).map(ent => (
            <SemanticAvatar 
                key={ent.id}
                pillarIndex={0}
                pillarName={ent.id}
                genome={ent.genome}
                position={[ent.x * TILE_SIZE, 0, ent.z * TILE_SIZE]}
                scale={1}
                action="idle"
            />
        ));
    }, [chunkX, chunkZ]);

    return (
        <div className="w-full h-full absolute inset-0 bg-black">
            <div className="absolute top-4 left-4 z-10 p-4 bg-gray-900/80 rounded-xl border border-white/20 text-white backdrop-blur-md">
                <h2 className="text-xl font-bold text-amber-400">Living Realm (VTT)</h2>
                <p className="text-sm opacity-70">Powered by Canonical Vector DB & AO Engine</p>
                <div className="mt-4 flex gap-2">
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded" onClick={() => setChunkX(c => c - 1)}>West</button>
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded" onClick={() => setChunkZ(c => c - 1)}>North</button>
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded" onClick={() => setChunkZ(c => c + 1)}>South</button>
                    <button className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded" onClick={() => setChunkX(c => c + 1)}>East</button>
                </div>
                <div className="mt-2 text-xs text-amber-200/50">
                    Chunk: [{chunkX}, {chunkZ}] | Yellow tint = Canon Override
                </div>
            </div>

            <Canvas camera={{ position: [CHUNK_SIZE, CHUNK_SIZE, CHUNK_SIZE], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
                
                <group position={[-CHUNK_SIZE, 0, -CHUNK_SIZE]}>
                    {terrain}
                    {entities}
                </group>

                <MapControls />
            </Canvas>
        </div>
    );
}
