import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { type ProceduralGenome } from '../utils/ManifestationAlgorithm';

/**
 * useAvatarModulation
 * 
 * Logic for skeletal distortion based on the ProceduralGenome (The "Ark" Effect).
 */
export function useAvatarModulation(clonedScene: THREE.Group, genome: ProceduralGenome, debug: boolean = false) {
    const bonesRef = useRef<Record<string, THREE.Bone>>({});

    useEffect(() => {
        const bones: Record<string, THREE.Bone> = {};
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Bone) {
                bones[child.name] = child;
                if (debug) console.log(`[useAvatarModulation] Found bone: ${child.name}`);
            }
        });
        bonesRef.current = bones;
    }, [clonedScene, debug]);

    useFrame(() => {
        const bones = bonesRef.current;
        const dims = genome.dimensions;
        if (!dims) return;

        const applyScale = (search: string, scaleVec: [number, number, number] | undefined) => {
            if (!scaleVec) return;
            
            // Only apply if the scale is NOT the default [1, 1, 1]
            const isDefault = Math.abs(scaleVec[0] - 1) < 0.01 && 
                              Math.abs(scaleVec[1] - 1) < 0.01 && 
                              Math.abs(scaleVec[2] - 1) < 0.01;
            
            if (isDefault) return;

            Object.entries(bones).forEach(([name, bone]) => {
                if (name.toLowerCase().includes(search.toLowerCase())) {
                    bone.scale.set(scaleVec[0], scaleVec[1], scaleVec[2]);
                }
            });
        };

        applyScale('Head', dims.head);
        applyScale('Neck', dims.head);
        applyScale('Spine', dims.torso);
        applyScale('Hips', dims.pelvis);
        applyScale('Arm', dims.upperArm);
        applyScale('ForeArm', dims.lowerArm);
        applyScale('Hand', dims.hands);
        applyScale('UpLeg', dims.upperLeg);
        applyScale('Leg', dims.lowerLeg);
        applyScale('Foot', dims.feet);
    });
}
