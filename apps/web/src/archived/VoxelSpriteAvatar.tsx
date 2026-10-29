import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useClayMorph } from '../Council/AvatarConstruct';

interface VoxelSpriteAvatarProps {
    imageUrl: string;
    pillarIndex: number;
    scale?: number;
    state?: 'Idle' | 'Walk' | 'Talk';
    colorOverride?: string;
}

export const VoxelSpriteAvatar: React.FC<VoxelSpriteAvatarProps> = ({
    imageUrl,
    pillarIndex,
    scale = 1.0,
    state = 'Idle',
    colorOverride = 'white'
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const bobOffset = useRef(Math.random() * Math.PI * 2);

    const [voxelData, setVoxelData] = useState<{ count: number, matrices: THREE.Matrix4[], colors: THREE.Color[] } | null>(null);

    // Apply the same Clay Morph to the base cube geometry!
    const baseGeometryRef = useRef<THREE.BoxGeometry>(null);
    useClayMorph(baseGeometryRef.current, 1.5, 0.4);

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            // Spritesheet is 5x2
            const cols = 5;
            const rows = 2;
            const index = (pillarIndex || 1) - 1;
            const c = index % cols;
            const r = Math.floor(index / cols);

            // Calculate the region for the specific character
            const spriteWidth = Math.floor(img.width / cols);
            const spriteHeight = Math.floor(img.height / rows);

            // We downsample to make chunky voxels (e.g. max 64x64 grid to save performance)
            const maxVoxelsAxis = 64; // Adjust chunkiness
            const sampleSkip = Math.max(1, Math.floor(Math.max(spriteWidth, spriteHeight) / maxVoxelsAxis));

            const voxelsW = Math.floor(spriteWidth / sampleSkip);
            const voxelsH = Math.floor(spriteHeight / sampleSkip);

            const canvas = document.createElement('canvas');
            canvas.width = voxelsW;
            canvas.height = voxelsH;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) return;

            // Draw just the character's segment onto our small canvas to downsample and crop
            ctx.drawImage(
                img,
                c * spriteWidth, r * spriteHeight, spriteWidth, spriteHeight,
                0, 0, voxelsW, voxelsH
            );

            const imageData = ctx.getImageData(0, 0, voxelsW, voxelsH).data;
            const matrices: THREE.Matrix4[] = [];
            const colors: THREE.Color[] = [];

            const width = voxelsW;
            const height = voxelsH;

            const offsetX = -width / 2;
            const offsetY = -height / 2;

            const bgR = imageData[0]; const bgG = imageData[1]; const bgB = imageData[2];
            const colorDist = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    const pr = imageData[i]; const pg = imageData[i + 1]; const pb = imageData[i + 2]; const pa = imageData[i + 3];

                    // Skip bottom 15% to avoid capturing nameplates
                    if (y > height * 0.85) continue;

                    // If pixel is opaque and NOT the background color
                    if (pa > 50 && colorDist(pr, pg, pb, bgR, bgG, bgB) > 25) {
                        const matrix = new THREE.Matrix4();
                        // 3D placement. Y is inverted from Canvas Y. Z is 0 (flat cookie cutter)
                        matrix.setPosition(
                            (x + offsetX),
                            (-y - offsetY),
                            0
                        );
                        matrices.push(matrix);
                        colors.push(new THREE.Color(pr / 255, pg / 255, pb / 255));
                    }
                }
            }

            setVoxelData({ count: matrices.length, matrices, colors });
        };
        img.onerror = () => {
            console.warn(`[VoxelSpriteAvatar] Failed to load image: ${imageUrl}`);
        };
        img.src = imageUrl;
    }, [imageUrl, pillarIndex]);


    // Update InstancedMesh when voxelData is ready
    useEffect(() => {
        if (voxelData && instancedMeshRef.current) {
            const mesh = instancedMeshRef.current;
            for (let i = 0; i < voxelData.count; i++) {
                mesh.setMatrixAt(i, voxelData.matrices[i]);
                mesh.setColorAt(i, voxelData.colors[i]);
            }
            mesh.instanceMatrix.needsUpdate = true;
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        }
    }, [voxelData]);


    const currentScale = useRef(new THREE.Vector3(1, 1, 1));

    useFrame(({ clock }, delta) => {
        if (!groupRef.current) return;

        const time = clock.getElapsedTime();
        let targetY = 0;
        let targetRotZ = 0;
        const targetScale = new THREE.Vector3(1, 1, 1);

        // --- THE ILLUSION OF LIFE: PROCEDURAL ANIMATION ---

        if (state === 'Walk') {
            bobOffset.current += delta * 15;
            const bounce = Math.abs(Math.sin(bobOffset.current));

            targetY = bounce * 0.15;
            targetRotZ = Math.sin(bobOffset.current * 0.5) * 0.05;

            // 1. Squash and Stretch (Existence)
            // When hitting the ground (bounce=0), squash Y and stretch X/Z
            // When airborne (bounce=1), stretch Y and squash X/Z
            const stretchAmount = (bounce - 0.5) * 0.25;
            targetScale.set(1.0 - stretchAmount, 1.0 + stretchAmount, 1.0 - stretchAmount);

        } else if (state === 'Talk') {
            bobOffset.current += delta * 25; // Energetic pacing
            const bounce = Math.abs(Math.sin(bobOffset.current));

            targetY = bounce * 0.05;
            targetRotZ = 0;

            // Micro squash/stretch for animated chatter
            const chatter = Math.sin(time * 30);
            targetScale.set(1.0 + chatter * 0.015, 1.0 - chatter * 0.015, 1.0 + chatter * 0.015);

        } else {
            // Idle
            bobOffset.current += delta * 2;
            targetY = Math.sin(bobOffset.current) * 0.02;
            targetRotZ = 0;

            // 4. The Spark (Resonance / Idle Variation)
            // Never let a character freeze. Implement a gentle breathing cycle.
            const breath = Math.sin(time * 2.5); // Slow, rhythmic wave
            targetScale.set(
                1.0 + breath * 0.02, // Chest expands
                1.0 + breath * 0.01, // Body lengthens slightly
                1.0 + breath * 0.02
            );
        }

        // 2. The Nervous System (Logic)
        // Smoothly interpolate (lerp) towards the target state rather than snapping instantly.
        // This gives weight and follow-through to the physics.
        const lerpSpeed = 15;
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * lerpSpeed);
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, delta * (lerpSpeed * 0.5));
        currentScale.current.lerp(targetScale, delta * lerpSpeed);

        // Apply scale (combining procedural squash/stretch with global model scale factor)
        // Note: we calculate 'maxDimension' here safely up a scope, or abstractly:
        const maxDim = 64;
        const baseS = (scale / maxDim) * 1.5;
        groupRef.current.scale.set(
            baseS * currentScale.current.x,
            baseS * currentScale.current.y,
            baseS * currentScale.current.z
        );
    });

    if (!voxelData || voxelData.count === 0) {
        return (
            <group ref={groupRef} position={[0, scale / 2, 0]}>
                <mesh>
                    <boxGeometry args={[scale, scale, scale]} />
                    <meshBasicMaterial color={colorOverride} wireframe />
                </mesh>
            </group>
        );
    }

    // Scale down the entire voxel cluster so it fits in roughly a 1 unit radius
    const maxDimension = 64; // Our max dimension from processing
    const voxelScale = scale / maxDimension;

    // Classic clean voxel geometry (like Nintendo 64 cardboard cutouts)
    // Deeper Z dimension makes them look like nice physical acrylic blocks
    const geometryNode = <boxGeometry args={[1.05, 1.05, 3.0]} />;

    // Crisp standard material for clean JRPG aesthetic
    const materialNode = (
        <meshStandardMaterial
            roughness={0.8}
            metalness={0.0}
            flatShading={true}
        />
    );

    return (
        <group ref={groupRef} position={[0, scale / 1.5, 0]} scale={voxelScale * 1.5}>
            {/* Voxel shadows and flat shading help sell the 3D blocky look */}
            <instancedMesh
                ref={instancedMeshRef}
                castShadow
                receiveShadow
                args={[undefined, undefined, voxelData.count]}
            >
                {geometryNode}
                {materialNode}
            </instancedMesh>
        </group>
    );
};
