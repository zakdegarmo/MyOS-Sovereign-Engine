import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// --- GEOGRAPHIC SEEDING UTILS (Cloned from Wilderness) ---
const HASH_PRIME_1 = 15485863;
const HASH_PRIME_2 = 2038074743;

const pseudoRandom = (x: number, z: number, seed: number) => {
    const val = (x * HASH_PRIME_1) ^ (z * HASH_PRIME_2) ^ (seed * 12345);
    return (Math.abs(Math.sin(val)) * 10000) % 1;
};

interface FaerunTraversalProps {
    isActive: boolean;
    playerPosition?: THREE.Vector3;
}

/**
 * FaerunTraversal: Specialized JRPG Forest
 * ---------------------------------------
 * This is a clean-room manifestation of the infinite forest for the Faerûn sphere.
 * It removes all relative coordinate sliding (the "Double Calculation") 
 * and anchors trees statically to the planet's surface. 
 */
export const FaerunTraversal: React.FC<FaerunTraversalProps> = ({
    isActive,
    playerPosition = new THREE.Vector3(0, 0, 0)
}) => {
    const treeTexture = useTexture('/assets/lpc/brown_trees_0.png');
    const grassTexture = useTexture('/textures/grass.jpg');
    const floorRef = useRef<THREE.Mesh>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

    const TILE_SIZE = 100;
    const TREES_PER_TILE = 15;
    
    useMemo(() => {
        if (grassTexture) {
            grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
            grassTexture.repeat.set(50, 50);
        }
    }, [grassTexture]);

    useFrame((state) => {
        if (!floorRef.current || !instancedMeshRef.current || !isActive) return;
        
        // --- 1. FRUSTUM STABILIZATION ---
        instancedMeshRef.current.frustumCulled = false;

        floorRef.current.position.set(0, 0, 0); // EXACT SURFACE ALIGNMENT

        const tempMatrix = new THREE.Matrix4();
        const tempPos = new THREE.Vector3();
        const camPos = state.camera.position;
        
        // --- 2. LOCAL COORDINATE STABILITY ---
        // Stabilize texture offset to prevent the 'Tide' effect seen in the video
        if (grassTexture) {
            grassTexture.offset.set(
                (playerPosition.x % TILE_SIZE) / TILE_SIZE,
                (playerPosition.z % TILE_SIZE) / TILE_SIZE
            );
        }

        const centerTileX = Math.floor(playerPosition.x / TILE_SIZE);
        const centerTileZ = Math.floor(playerPosition.z / TILE_SIZE);
        
        let instanceIdx = 0;
        // 5x5 Grid for extra buffer coverage against the sphere's curvature
        for (let tx = -2; tx <= 2; tx++) {
            for (let tz = -2; tz <= 2; tz++) {
                const currentTileX = centerTileX + tx;
                const currentTileZ = centerTileZ + tz;
                
                for (let i = 0; i < TREES_PER_TILE; i++) {
                    // Seeding is absolute to the world, visual offset is local to the North Pole
                    const worldX = (currentTileX * TILE_SIZE) + (pseudoRandom(currentTileX, currentTileZ, i * 2) * TILE_SIZE);
                    const worldZ = (currentTileZ * TILE_SIZE) + (pseudoRandom(currentTileX, currentTileZ, i * 2 + 1) * TILE_SIZE);
                    
                    const relX = worldX - playerPosition.x;
                    const relZ = worldZ - playerPosition.z;

                    tempPos.set(relX, 2.5, relZ);
                    tempMatrix.identity();
                    
                    // Billboard faces camera correctly in world space, 
                    // but we ensure it's stable relative to the North Pole origin
                    const worldCamPos = new THREE.Vector3().setFromMatrixPosition(state.camera.matrixWorld);
                    const treeWorldPos = new THREE.Vector3(relX, 2.5, relZ).applyMatrix4(instancedMeshRef.current.matrixWorld);

                    const angle = Math.atan2(worldCamPos.x - treeWorldPos.x, worldCamPos.z - treeWorldPos.z);
                    tempMatrix.makeRotationY(angle);
                    tempMatrix.setPosition(tempPos);

                    const scale = 5 + pseudoRandom(currentTileX, currentTileZ, i + 99) * 3;
                    tempMatrix.scale(new THREE.Vector3(scale, scale, 1));
                    
                    instancedMeshRef.current.setMatrixAt(instanceIdx++, tempMatrix);
                }
            }
        }
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (!isActive) return null;

    const totalInstances = TREES_PER_TILE * 25; // 5x5

    return (
        <group name="FaerunTraversal_Isolated">
            <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000]} />
                <meshStandardMaterial 
                    map={grassTexture} 
                    color="#446633" 
                    roughness={0.8} 
                    polygonOffset={true}
                    polygonOffsetFactor={2} 
                />
            </mesh>
            <gridHelper args={[1000, 100, "#ffffff", "#ffffff"]} position={[0, 0.001, 0]} />
            <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, totalInstances]}>
                <planeGeometry args={[1, 1.2]} />
                <meshBasicMaterial map={treeTexture} transparent alphaTest={0.5} side={THREE.DoubleSide} />
            </instancedMesh>
        </group>
    );
};
