import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- GEOGRAPHIC SEEDING UTILS ---
const HASH_PRIME_1 = 15485863;
const HASH_PRIME_2 = 2038074743;

const pseudoRandom = (x: number, z: number, seed: number) => {
    const val = (x * HASH_PRIME_1) ^ (z * HASH_PRIME_2) ^ (seed * 12345);
    return (Math.abs(Math.sin(val)) * 10000) % 1;
};

/**
 * WildernessTraversal
 * INFINTIE D&D GEOGRAPHICAL FOREST
 */
export const WildernessTraversal: React.FC<WildernessTraversalProps> = ({
    isActive,
    playerPosition = new THREE.Vector3(0, 0, 0)
}) => {
    const treeTexture = useTexture('/assets/lpc/brown_trees_0.png');
    const grassTexture = useTexture('/textures/grass.jpg');
    const floorRef = useRef<THREE.Mesh>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

    // D&D CONFIG
    const TILE_SIZE = 100; // 100 meters per geographic chunk
    const TREES_PER_TILE = 15;
    
    useMemo(() => {
        if (grassTexture) {
            grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
            grassTexture.repeat.set(50, 50);
        }
    }, [grassTexture]);

    // --- INSTANCED GEOGRAPHIC RENDERING ---
    useFrame((state) => {
        if (!floorRef.current || !instancedMeshRef.current) return;
        
        // Stabilize floor at the North Pole (Planet rotation handles global alignment)
        // Offset by -0.02 to ensure it sits BELOW the agents at Y=0.1
        floorRef.current.position.set(0, -0.01, 0);

        // --- VISUAL FEEDBACK: LOCAL TEXTURE SCROLLING ---
        // Since we are at the North Pole, we scroll the texture offsets manually 
        // to provide high-frequency movement cues regardless of the planet's scale.
        if (grassTexture) {
            grassTexture.offset.set(
                (playerPosition.x % TILE_SIZE) / TILE_SIZE,
                (playerPosition.z % TILE_SIZE) / TILE_SIZE
            );
        }

        // Update Instanced Trees based on CURRENT GEOGRAPHIC COORDS
        const tempMatrix = new THREE.Matrix4();
        const tempPos = new THREE.Vector3();
        const camPos = state.camera.position;
        
        // Calculate player's current tile
        const centerTileX = Math.floor(playerPosition.x / TILE_SIZE);
        const centerTileZ = Math.floor(playerPosition.z / TILE_SIZE);
        
        let instanceIdx = 0;
        // Render 3x3 grid of tiles around the player
        for (let tx = -1; tx <= 1; tx++) {
            for (let tz = -1; tz <= 1; tz++) {
                const currentTileX = centerTileX + tx;
                const currentTileZ = centerTileZ + tz;
                
                for (let i = 0; i < TREES_PER_TILE; i++) {
                    const worldX = (currentTileX * TILE_SIZE) + (pseudoRandom(currentTileX, currentTileZ, i * 2) * TILE_SIZE);
                    const worldZ = (currentTileZ * TILE_SIZE) + (pseudoRandom(currentTileX, currentTileZ, i * 2 + 1) * TILE_SIZE);
                    
                    const relX = worldX - playerPosition.x;
                    const relZ = worldZ - playerPosition.z;
                    
                    tempPos.set(relX, 2.5, relZ);
                    tempMatrix.identity();
                    
                    // BILLBOARDING: Face the camera (safeguarded against NaN)
                    const dx = camPos.x - relX;
                    const dz = camPos.z - relZ;
                    if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
                        const angle = Math.atan2(dx, dz);
                        tempMatrix.makeRotationY(angle);
                        tempMatrix.setPosition(tempPos);
                    } else {
                        tempMatrix.setPosition(tempPos);
                    }

                    const scale = 5 + pseudoRandom(currentTileX, currentTileZ, i + 99) * 3;
                    tempMatrix.scale(new THREE.Vector3(scale, scale, 1));
                    
                    instancedMeshRef.current.setMatrixAt(instanceIdx++, tempMatrix);
                }
            }
        }
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!isActive) return null;

    const totalInstances = TREES_PER_TILE * 9;

    return (
        <group name="WildernessTraversal">
            {/* VIBRANT GROUND: Scrollable for movement cues */}
            <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial 
                    map={grassTexture} 
                    color="#446633" 
                    roughness={0.8}
                />
            </mesh>

            {/* HIGH-CONTRAST GRID: Anchored to Player for feedback */}
            <gridHelper args={[1000, 100, "#ffffff", "#ffffff"]} position={[0, -0.005, 0]} />

            {/* INSTANCED GEOGRAPHIC FOREST */}
            <instancedMesh 
                ref={instancedMeshRef} 
                args={[undefined, undefined, totalInstances]}
            >
                <planeGeometry args={[1, 1.2]} />
                <meshBasicMaterial 
                    map={treeTexture} 
                    transparent 
                    alphaTest={0.5} 
                    side={THREE.DoubleSide}
                />
            </instancedMesh>
        </group>
    );
};
