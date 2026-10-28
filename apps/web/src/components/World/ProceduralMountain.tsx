import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { gaiaNoise } from '../../Logic/GaiaNoise';

interface ProceduralMountainProps {
    position: [number, number, number];
    scale?: number;
    baseRadius?: number;
    height?: number;
    textureUrl?: string;
    seed?: number;
}

export const ProceduralMountain: React.FC<ProceduralMountainProps> = ({
    position,
    scale = 1,
    baseRadius = 10,
    height = 16,
    textureUrl,
    seed = 0
}) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Apply procedural noise to the geometry vertices to create a rugged appearance
    const geometry = useMemo(() => {
        // Base primitive: A pyramid/cone with a moderate number of radial and height segments
        const geo = new THREE.ConeGeometry(baseRadius, height, 8, 8);
        geo.translate(0, height / 2, 0); // Move origin to base

        const posAttribute = geo.getAttribute('position');
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // Do not deform the absolute base edge to ensure it sits flat on the ground
            if (vertex.y > 0.1) {
                // Determine 'lat/lon' or pseudo-coordinates for noise sampling
                // Combine absolute position in world + local vertex to get unique stable noise
                const queryX = position[0] + vertex.x * 2.0;
                const queryZ = position[2] + vertex.z * 2.0;

                // Add minor organic variation based on altitude (y)
                const altitudeFactor = vertex.y / height;

                // Get deterministic height offset using GaiaNoise
                const noiseVal = gaiaNoise.getTileData(queryX + seed, queryZ).height;

                // Displace vertices outward/inward, weighted heavily in the middle, pinched at the tip
                const displacementAmplitude = 1.5 * Math.sin(altitudeFactor * Math.PI);
                vertex.x += (noiseVal / 40.0) * displacementAmplitude;
                vertex.z += (noiseVal / 40.0) * displacementAmplitude;

                // Add some deterministic chaotic height jaggedness to the peak
                if (altitudeFactor > 0.5) {
                    const jitter = gaiaNoise.getTileData(queryX * 10, queryZ * 10).height;
                    vertex.y += (jitter / 50.0) * altitudeFactor;
                }
            }

            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geo.computeVertexNormals(); // Recalculate lighting normals after deformation
        return geo;
    }, [baseRadius, height, position, seed]);

    // Apply Texture if available
    const texture = useTexture(textureUrl || '/integrations/Images/Assets for VTT/2minTTdungeonBuilder/Floor.png');
    useMemo(() => {
        if (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            texture.colorSpace = THREE.SRGBColorSpace;
        }
    }, [texture]);

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={position}
            scale={[scale, scale, scale]}
            castShadow
            receiveShadow
            name="ProceduralMountain"
        >
            <meshStandardMaterial
                map={texture}
                roughness={0.9}
                metalness={0.1}
                color="#aaaaaa" // Slightly dim the texture so it looks distinct from flat ground
                flatShading={true} // Enhance the low-poly "physical module" look
            />
        </mesh>
    );
};
