import React, { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';
import { useAnimations, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// --- Types ---
export type BodyType = 'blob' | 'knot';

export type AvatarState = {
    color: string;
    animation: 'idle' | 'energetic' | 'resilient' | 'floating' | 'shaking' | 'walking';
    materialType: 'matte' | 'metal' | 'wireframe' | 'glossy';
    bodyType: BodyType;
    message: string;
    emoji: string;
    pillarIndex: number;
};

// --- Clay Morph Logic ---
// Applied to both Body Parts and Glyphs
export const useClayMorph = (geometry: THREE.BufferGeometry | null, speed: number = 1, intensity: number = 0.5) => {
    const originalPositions = useRef<Float32Array | null>(null);

    useLayoutEffect(() => {
        if (geometry && !originalPositions.current) {
            // Ensure normals are present
            if (!geometry.attributes.normal) geometry.computeVertexNormals();

            const count = geometry.attributes.position.count;
            originalPositions.current = new Float32Array(count * 3);
            const pos = geometry.attributes.position.array;
            for (let i = 0; i < count * 3; i++) {
                originalPositions.current[i] = pos[i];
            }
            geometry.userData.initialPositions = originalPositions.current;
        }
    }, [geometry]);

    useFrame((state) => {
        if (!geometry || !originalPositions.current) return;

        // Stop Motion Effect: 24fps (Smoother)
        const fps = 24;
        const time = Math.floor(state.clock.elapsedTime * fps) / fps;

        const positionAttribute = geometry.getAttribute('position');
        const vertex = new THREE.Vector3();

        for (let i = 0; i < positionAttribute.count; i++) {
            vertex.fromArray(originalPositions.current, i * 3);

            // 1. Breathing
            const breath = Math.sin(time * 3 * speed) * 0.05 * intensity;

            // 2. Clay Noise
            // Note: Different scalars for different object scales might be needed
            // But this generally works for unit-ish sized objects
            const noise = Math.sin(vertex.x * 5 + time * 5) *
                Math.cos(vertex.y * 5 + time * 5) *
                Math.sin(vertex.z * 5 + time * 5) * 0.08 * intensity;

            const scaleFactor = 1 + breath + noise;
            vertex.multiplyScalar(scaleFactor);

            positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        positionAttribute.needsUpdate = true;
        geometry.computeVertexNormals();
    });
};

// --- 3D Components ---

// GLB Glyph with Clay Effect
const ClayGLBGlyph = ({ url, color }: { url: string; color: string }) => {
    const { scene } = useGLTF(url);

    // We need to clone the scene so each agent gets its own instance 
    // AND so we can modify the geometry independently (deep clone preferred)
    const clonedScene = useMemo(() => scene.clone(true), [scene]);
    const meshRef = useRef<THREE.Mesh>(null);

    // Apply material and find the geometry to morph
    useEffect(() => {
        clonedScene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.material = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 1.5,
                    roughness: 0.9,
                    metalness: 0.0
                });

                // IMPORTANT: Ensure geometry is unique for morphing to work per-instance
                // (Though three.js clones share geometry by default, we might need .clone() on geom if they share same file)
                // But for now, let's assume one instance per file per scene. 
                // Actually to be safe:
                m.geometry = m.geometry.clone();
                // We'll capture this mesh in ref if it's the main one, or loop all
                if (!meshRef.current) meshRef.current = m;
            }
        });
    }, [clonedScene, color]);

    // Apply morph to the first found mesh (usually the glyph is one mesh)
    // If it's multi-part, we'd need a wrapper. For now assuming single mesh glyphs.
    // Hack: We can force re-render or use a stat hook, but hook needs stable ref.
    // Let's use a wrapper component for the hook if we can extract geometry.
    // Simpler: Just run the hook inside a sub-component per mesh? 
    // Or just iterate manually in useFrame here. 
    // Let's stick to the hook pattern but we need the geometry.

    // Better approach: Traverse and render <MorphableMesh> for each mesh found.
    const meshes: THREE.Mesh[] = [];
    clonedScene.traverse((c) => { if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh) });

    return (
        <group>
            {meshes.map((m, i) => (
                <MorphableMesh key={i} originalMesh={m} color={color} />
            ))}
        </group>
    );
};

// Helper to apply hook to a specific mesh instance
const MorphableMesh = ({ originalMesh, color }: { originalMesh: THREE.Mesh, color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const geometry = useMemo(() => originalMesh.geometry.clone(), [originalMesh]);

    useClayMorph(geometry, 1.2, 0.8);

    return (
        <mesh
            geometry={geometry}
            scale={originalMesh.scale}
            rotation={originalMesh.rotation}
            position={originalMesh.position}
        >
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.5}
                roughness={0.9}
                metalness={0.0}
            />
        </mesh>
    );
};

// Procedural Leviathan Cross (Fallback/Improvement)
// We treat this as "Clay" too by wrapping parts? 
// Or just leave it static? User complained about "correct stuff". 
// Improvement GLB exists (741KB). We should use the GLB if possible!
// But earlier I made a procedural one because the GLB was "wrong".
// Let's TRY the GLB first for all, as user implies they are "correct stuff" now.
// If Improvement is still broken, we can revert. But let's trust the user's "fix the glyphs" command.

// Blobby Clay Part 
export const BlobPart = ({
    args,
    material,
    position,
    rotation,
    scale,
    name
}: {
    args?: any[];
    material: THREE.Material;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    name?: string;
}) => {
    const geomRef = useRef<THREE.SphereGeometry>(null);
    useClayMorph(geomRef.current, 1, 0.6);

    return (
        <mesh position={position} rotation={rotation} scale={scale} castShadow material={material} name={name}>
            <sphereGeometry ref={geomRef} args={[args ? args[0] : 0.3, 64, 64]} />
        </mesh>
    );
};

// --- Clay Leviathan Cross (Procedural Sulfur 🜏) ---
const ClayLeviathanCross = ({ color }: { color: string }) => {
    // Reusing the Clay Material from parent would be ideal, but for now recreate matches
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        color, roughness: 0.6, metalness: 0.0, clearcoat: 0.1, clearcoatRoughness: 0.4, sheen: 0.2
    }), [color]);

    return (
        <group scale={120} rotation={[0, 0, 0]}> {/* Scale up to match GLB size context (0.008 * 120 ~= 1) */}
            {/* Infinity (Bottom) */}
            <group position={[0, -0.4, 0]} scale={0.5}>
                <mesh position={[-0.55, 0, 0]}>
                    <torusGeometry args={[0.4, 0.15, 16, 32]} />
                    <primitive object={material} />
                </mesh>
                <mesh position={[0.55, 0, 0]}>
                    <torusGeometry args={[0.4, 0.15, 16, 32]} />
                    <primitive object={material} />
                </mesh>
            </group>

            {/* Staff */}
            <BlobPart args={[0.15]} scale={[1, 4, 1]} position={[0, 0.3, 0]} material={material} />

            {/* Cross Bars */}
            <BlobPart args={[0.15]} scale={[5, 0.8, 1]} position={[0, 0.5, 0]} material={material} />
            <BlobPart args={[0.15]} scale={[3, 0.8, 1]} position={[0, 0.8, 0]} material={material} />
        </group>
    );
};

export const AvatarConstruct = ({ state, scale = 1, animations, glyphUrl }: { state: AvatarState, scale?: number, animations?: THREE.AnimationClip[], glyphUrl?: string }) => {
    const group = useRef<THREE.Group>(null);
    const hipsRef = useRef<THREE.Group>(null);
    const spineRef = useRef<THREE.Group>(null);
    const headRef = useRef<THREE.Group>(null);
    const leftArmRef = useRef<THREE.Group>(null);
    const rightArmRef = useRef<THREE.Group>(null);
    const leftLegRef = useRef<THREE.Group>(null);
    const rightLegRef = useRef<THREE.Group>(null);

    const { actions } = useAnimations(animations || [], group);

    useEffect(() => {
        if (animations && actions && animations.length > 0) {
            const action = actions[Object.keys(actions)[0]];
            action?.reset().fadeIn(0.5).play();
            return () => { action?.fadeOut(0.5); };
        }
    }, [actions, animations]);

    // Material Logic - CLAY FIGHTER
    const material = useMemo(() => {
        const color = new THREE.Color(state.color);
        return new THREE.MeshPhysicalMaterial({
            color,
            roughness: 0.6,
            metalness: 0.0,
            clearcoat: 0.1,
            clearcoatRoughness: 0.4,
            sheen: 0.2,
            flatShading: false,
        });
    }, [state.color]);

    const prefix = 'mixamorig';
    const rigScale: [number, number, number] = [1.2, 0.9, 1.2];



    return (
        <group ref={group} dispose={null} scale={[scale * rigScale[0], scale * rigScale[1], scale * rigScale[2]]}>
            {/* HIPS */}
            <group name={`${prefix}Hips`} position={[0, 0.8, 0]} ref={hipsRef}>
                <BlobPart args={[0.45]} material={material} />

                {/* SPINE */}
                <group name={`${prefix}Spine`} position={[0, 0.3, 0]} ref={spineRef}>
                    <group name={`${prefix}Spine1`} position={[0, 0.2, 0]}>
                        <BlobPart args={[0.5]} material={material} />

                        <group name={`${prefix}Spine2`} position={[0, 0.3, 0]}>
                            <BlobPart args={[0.55]} material={material} position={[0, 0, 0]} />

                            {/* HEAD */}
                            <group name={`${prefix}Neck`} position={[0, 0.4, 0]}>
                                <group name={`${prefix}Head`} position={[0, 0.1, 0]} ref={headRef}>
                                    {/* Smoked Glass Sphere */}
                                    <mesh position={[0, 0.1, 0]}>
                                        <sphereGeometry args={[0.38, 32, 32]} />
                                        <meshPhysicalMaterial
                                            color="#111"
                                            roughness={0.2}
                                            metalness={0.5}
                                            transmission={0.6}
                                            thickness={0.5}
                                            transparent={true}
                                            opacity={0.8}
                                        />
                                    </mesh>

                                    {/* GLB GLYPH WITH CLAY MORPH */}
                                    {/* GLYPH CONTAINER */}
                                    <group position={[0, 0.1, 0]} scale={0.008} rotation={[0, 0, 0]}>
                                        {glyphUrl && (
                                            <ClayGLBGlyph url={glyphUrl} color={state.color} />
                                        )}
                                    </group>
                                </group>
                            </group>

                            {/* ARMS */}
                            <group name={`${prefix}LeftShoulder`} position={[0.3, 0.1, 0]}>
                                <BlobPart args={[0.2]} material={material} position={[0.1, 0, 0]} />
                                <group name={`${prefix}LeftArm`} position={[0.2, 0, 0]} ref={leftArmRef}>
                                    <BlobPart args={[0.18]} material={material} position={[0, -0.2, 0]} />
                                    <group name={`${prefix}LeftForeArm`} position={[0, -0.4, 0]}>
                                        <BlobPart args={[0.16]} material={material} position={[0, -0.2, 0]} />
                                        <group name={`${prefix}LeftHand`} position={[0, -0.4, 0]}>
                                            <BlobPart args={[0.12]} material={material} />
                                        </group>
                                    </group>
                                </group>
                            </group>

                            <group name={`${prefix}RightShoulder`} position={[-0.3, 0.1, 0]}>
                                <BlobPart args={[0.2]} material={material} position={[-0.1, 0, 0]} />
                                <group name={`${prefix}RightArm`} position={[-0.2, 0, 0]} ref={rightArmRef}>
                                    <BlobPart args={[0.18]} material={material} position={[0, -0.2, 0]} />
                                    <group name={`${prefix}RightForeArm`} position={[0, -0.4, 0]}>
                                        <BlobPart args={[0.16]} material={material} position={[0, -0.2, 0]} />
                                        <group name={`${prefix}RightHand`} position={[0, -0.4, 0]}>
                                            <BlobPart args={[0.12]} material={material} />
                                        </group>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>

                {/* LEGS */}
                <group name={`${prefix}LeftUpLeg`} position={[0.2, -0.1, 0]} ref={leftLegRef}>
                    <BlobPart args={[0.22]} material={material} position={[0, -0.2, 0]} />
                    <group name={`${prefix}LeftLeg`} position={[0, -0.4, 0]}>
                        <BlobPart args={[0.2]} material={material} position={[0, -0.2, 0]} />
                        <group name={`${prefix}LeftFoot`} position={[0, -0.3, 0]}>
                            <BlobPart args={[0.15]} material={material} />
                        </group>
                    </group>
                </group>

                <group name={`${prefix}RightUpLeg`} position={[-0.2, -0.1, 0]} ref={rightLegRef}>
                    <BlobPart args={[0.22]} material={material} position={[0, -0.2, 0]} />
                    <group name={`${prefix}RightLeg`} position={[0, -0.4, 0]}>
                        <BlobPart args={[0.2]} material={material} position={[0, -0.2, 0]} />
                        <group name={`${prefix}RightFoot`} position={[0, -0.3, 0]}>
                            <BlobPart args={[0.15]} material={material} />
                        </group>
                    </group>
                </group>

            </group>
        </group>
    );
};
