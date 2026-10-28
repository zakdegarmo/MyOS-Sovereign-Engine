import React, { useRef, useEffect, useMemo } from 'react';
import { useGraph } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { useClayMorph } from '../Council/AvatarConstruct'; // Formatting import
import type { AvatarState } from '../Council/AvatarConstruct';
import { BlobPart } from '../Council/AvatarConstruct'; // Assuming we export BlobPart or recreate it

// --- Types ---
export type AnimationType = 'Idle' | 'Talk' | 'Walk' | 'Think';

interface RiggedCouncilorProps {
    state: AvatarState;
    animationSet?: THREE.AnimationClip[]; // Shared Animations
    currentAnimation: AnimationType;
    scale?: number;
    glyphUrl?: string;
    bonePrefix?: string;
    onBoneScan?: (tracks: string[]) => void;
    onHelp?: (availableClips: string[]) => void;
}

// --- Procedural Skeleton ---
// This attempts to match the standard Mixamo Rig hierarchy so animations retarget correctly.
export const RiggedCouncilor: React.FC<RiggedCouncilorProps> = ({ state, animationSet, currentAnimation, scale = 1, glyphUrl, bonePrefix = 'mixamorig', onBoneScan, onHelp }) => {
    const group = useRef<THREE.Group>(null);
    const { actions, names } = useAnimations(animationSet || [], group);

    // --- Animation Logic ---
    useEffect(() => {
        if (!actions || !names.length) {
            if (onHelp) onHelp([]);
            return;
        }

        // Report available clips for debugging
        if (onHelp) onHelp(names);

        // Map abstract types to potential clip names
        // Ideally, we rename clips in the source GLB to match these keys.
        // Fallback search:
        const findClip = (term: string) => names.find(n => n.toLowerCase().includes(term.toLowerCase()));

        let clipName = findClip(currentAnimation) || names[0];

        // Specific Overrides for fallback
        if (currentAnimation === 'Idle') clipName = findClip('idle') || findClip('breath') || names[0];
        if (currentAnimation === 'Talk') clipName = findClip('talk') || findClip('speak') || names[0];
        const action = actions[clipName];
        if (action) {
            const tracks = action.getClip().tracks.map(t => t.name);
            console.log(`[RiggedCouncilor] Playing clip: ${clipName}`, tracks);

            // Report to parent (MaxOverlay Debug)
            if (onBoneScan) {
                // De-duplicate and sort for cleaner UI
                const uniqueTracks = Array.from(new Set(tracks.map(t => t.split('.')[0]))).sort();
                onBoneScan(uniqueTracks);
            }

            action.reset().fadeIn(0.5).play();
            return () => { action.fadeOut(0.5); };
        } else {
            console.warn(`[RiggedCouncilor] Clip not found: ${currentAnimation}. Available: ${names.join(', ')}`);
        }
    }, [currentAnimation, actions, names, onHelp, onBoneScan]);

    // --- Material ---
    const material = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(state.color),
        roughness: 0.6, metalness: 0.0, clearcoat: 0.1, clearcoatRoughness: 0.4,
    }), [state.color]);

    const prefix = bonePrefix;

    return (
        <group ref={group} dispose={null} scale={scale}>
            {/* HIPS (Root of Skeleton) */}
            <group name={`${prefix}Hips`} position={[0, 0.9, 0]}>
                <BlobPart args={[0.4]} material={material} />

                {/* SPINE */}
                <group name={`${prefix}Spine`} position={[0, 0.2, 0]}>
                    <BlobPart args={[0.45]} material={material} />
                    <group name={`${prefix}Spine1`} position={[0, 0.2, 0]}>
                        <BlobPart args={[0.48]} material={material} />
                        <group name={`${prefix}Spine2`} position={[0, 0.2, 0]}>
                            <BlobPart args={[0.5]} material={material} />

                            {/* NECK / HEAD */}
                            <group name={`${prefix}Neck`} position={[0, 0.3, 0]}>
                                <group name={`${prefix}Head`} position={[0, 0.1, 0]}>
                                    {/* Abstract Head */}
                                    <mesh>
                                        <sphereGeometry args={[0.35, 32, 32]} />
                                        <meshPhysicalMaterial color="#111" transparent opacity={0.6} roughness={0.2} transmission={0.5} thickness={1} />
                                    </mesh>
                                    {/* Floating Glyph */}
                                    <group scale={0.4}>
                                        {/* Glyph rendering logic here */}
                                        <mesh>
                                            <boxGeometry args={[0.5, 0.5, 0.5]} />
                                            <meshStandardMaterial color={state.color} emissive={state.color} emissiveIntensity={2} />
                                        </mesh>
                                    </group>
                                </group>
                            </group>

                            {/* ARMS */}
                            <group name={`${prefix}LeftShoulder`} position={[0.2, 0.1, 0]}>
                                <group name={`${prefix}LeftArm`} position={[0.2, 0, 0]}>
                                    <BlobPart args={[0.15]} material={material} />
                                    <group name={`${prefix}LeftForeArm`} position={[0.25, 0, 0]}>
                                        <BlobPart args={[0.12]} material={material} />
                                        <group name={`${prefix}LeftHand`} position={[0.25, 0, 0]}>
                                            <BlobPart args={[0.1]} material={material} />
                                        </group>
                                    </group>
                                </group>
                            </group>
                            <group name={`${prefix}RightShoulder`} position={[-0.2, 0.1, 0]}>
                                <group name={`${prefix}RightArm`} position={[-0.2, 0, 0]}>
                                    <BlobPart args={[0.15]} material={material} />
                                    <group name={`${prefix}RightForeArm`} position={[-0.25, 0, 0]}>
                                        <BlobPart args={[0.12]} material={material} />
                                        <group name={`${prefix}RightHand`} position={[-0.25, 0, 0]}>
                                            <BlobPart args={[0.1]} material={material} />
                                        </group>
                                    </group>
                                </group>
                            </group>

                        </group>
                    </group>
                </group>

                {/* LEGS */}
                <group name={`${prefix}LeftUpLeg`} position={[0.2, -0.1, 0]}>
                    <BlobPart args={[0.2]} material={material} />
                    <group name={`${prefix}LeftLeg`} position={[0, -0.4, 0]}>
                        <BlobPart args={[0.18]} material={material} />
                        <group name={`${prefix}LeftFoot`} position={[0, -0.4, 0]}>
                            <BlobPart args={[0.15]} material={material} />
                        </group>
                    </group>
                </group>
                <group name={`${prefix}RightUpLeg`} position={[-0.2, -0.1, 0]}>
                    <BlobPart args={[0.2]} material={material} />
                    <group name={`${prefix}RightLeg`} position={[0, -0.4, 0]}>
                        <BlobPart args={[0.18]} material={material} />
                        <group name={`${prefix}RightFoot`} position={[0, -0.4, 0]}>
                            <BlobPart args={[0.15]} material={material} />
                        </group>
                    </group>
                </group>

            </group>
        </group>
    );
};
