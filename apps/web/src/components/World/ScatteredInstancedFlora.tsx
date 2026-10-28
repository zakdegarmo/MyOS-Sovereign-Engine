import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { topographyRegistry } from '../../engine/TopographyRegistry';

interface ScatteredInstancedFloraProps {
    textureUrl: string;
    count?: number;
    range?: number;
    scaleRange?: [number, number];
    colorTintRange?: [string, string];
    playerPosition?: THREE.Vector3;
}

// Seeded RNG for persistent geographic generation
const pseudoRandom = (x: number, z: number, seed: number) => {
    const val = (x * 15485863) ^ (z * 2038074743) ^ (seed * 12345);
    return (Math.abs(Math.sin(val)) * 10000) % 1;
};

export const ScatteredInstancedFlora: React.FC<ScatteredInstancedFloraProps> = ({
    textureUrl,
    count = 150,
    range = 80, // Acts as the chunk size
    scaleRange = [1.0, 3.0],
    colorTintRange,
    playerPosition = new THREE.Vector3(0, 0, 0)
}) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const texture = useLoader(THREE.TextureLoader, textureUrl);
    
    // Pixel art crispness
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(1, 1);
        // Shift pivot so the bottom edge sits on the ground
        geo.translate(0, 0.5, 0);
        return geo;
    }, []);

    const material = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });

        // Custom GPU billboarding shader
        mat.onBeforeCompile = (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
                '#include <project_vertex>',
                `
                #ifdef USE_INSTANCING
                    // Extract scale from the instance matrix
                    vec3 instScale = vec3(
                        length(instanceMatrix[0].xyz),
                        length(instanceMatrix[1].xyz),
                        length(instanceMatrix[2].xyz)
                    );
                    
                    // Scale the local position
                    vec3 scaledPos = position * instScale;
                    
                    // Transform the instance position (translation) into view space
                    vec4 mvPosition = modelViewMatrix * vec4(instanceMatrix[3].xyz, 1.0);
                    
                    // Add the scaled local position directly in view space (this creates the billboard effect)
                    mvPosition.xyz += scaledPos;
                    
                    gl_Position = projectionMatrix * mvPosition;
                #else
                    #include <project_vertex>
                #endif
                `
            );
        };
        return mat;
    }, [texture]);

    const ITEMS_PER_CHUNK = Math.floor(count / 9);

    useFrame(() => {
        if (!meshRef.current) return;
        
        const mesh = meshRef.current;
        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        
        // Calculate the geographic chunk the player is currently inside
        const centerTileX = Math.floor(playerPosition.x / range);
        const centerTileZ = Math.floor(playerPosition.z / range);
        
        let instanceIdx = 0;
        
        // Render 3x3 chunks around the player
        for (let tx = -1; tx <= 1; tx++) {
            for (let tz = -1; tz <= 1; tz++) {
                const chunkX = centerTileX + tx;
                const chunkZ = centerTileZ + tz;
                
                for (let i = 0; i < ITEMS_PER_CHUNK; i++) {
                    if (instanceIdx >= count) break;
                    
                    // Seeded random positions within this chunk
                    const worldX = (chunkX * range) + (pseudoRandom(chunkX, chunkZ, i * 3) * range);
                    const worldZ = (chunkZ * range) + (pseudoRandom(chunkX, chunkZ, i * 3 + 1) * range);
                    
                    // Snap to precise terrain elevation
                    const elevation = topographyRegistry.getElevation(worldX, worldZ);
                    
                    const scale = scaleRange[0] + pseudoRandom(chunkX, chunkZ, i * 3 + 2) * (scaleRange[1] - scaleRange[0]);
                    
                    dummy.position.set(worldX, elevation, worldZ);
                    dummy.scale.set(scale, scale, scale);
                    dummy.updateMatrix();
                    mesh.setMatrixAt(instanceIdx, dummy.matrix);

                    if (colorTintRange) {
                        const c1 = new THREE.Color(colorTintRange[0]);
                        const c2 = new THREE.Color(colorTintRange[1]);
                        const tintFactor = pseudoRandom(chunkX, chunkZ, i * 7);
                        color.lerpColors(c1, c2, tintFactor);
                        mesh.setColorAt(instanceIdx, color);
                    } else {
                        mesh.setColorAt(instanceIdx, new THREE.Color(0xffffff));
                    }
                    
                    instanceIdx++;
                }
            }
        }
        
        // Hide unused instances (e.g., due to Math.floor rounding)
        while (instanceIdx < count) {
            dummy.position.set(0, -9999, 0);
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(instanceIdx, dummy.matrix);
            instanceIdx++;
        }
        
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[geometry, material, count]}
            frustumCulled={false} // CRITICAL: Prevents culling when looking away from origin since positions are updated in shader/matrices dynamically
        />
    );
};
