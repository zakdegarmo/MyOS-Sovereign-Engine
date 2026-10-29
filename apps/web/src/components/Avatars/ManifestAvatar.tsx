import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { type Manifestation3DSpec } from '../../utils/ManifestationAlgorithm';

interface ManifestAvatarProps {
    spec: Manifestation3DSpec;
    position?: [number, number, number];
    scale?: number;
    action?: 'idle' | 'walk' | 'run';
    velocity?: [number, number, number];
}

/**
 * MANIFEST AVATAR: Local 3D Manifestation of LPC Sprite Identity
 * 
 * This component maps LPC genome data (colors/themes) onto a high-fidelity
 * bipedal mesh. No genetic morphing, no voxels. Just 3D translation of the sprite.
 */
export const ManifestAvatar: React.FC<ManifestAvatarProps> = ({ 
    spec,
    position = [0, 0, 0], 
    scale = 1.0,
    action = 'idle',
    velocity = [0, 0, 0]
}) => {
    const { scene, animations } = useGLTF('/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb');
    
    // SkeletonUtils ensures bones are correctly linked in the clone
    const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { actions } = useAnimations(animations, clonedScene);
    
    const groupRef = useRef<THREE.Group>(null);
    const targetRotation = useRef(0);
    const currentRotation = useRef(0);
    const currentActionRef = useRef<string>('');

    // 🧬 Manifest Material Identity
    useEffect(() => {
        if (!clonedScene) return;

        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // We rebuild materials to ensure they are unique and vibrant
                const oldMat = child.material as THREE.MeshStandardMaterial;
                const newMat = new THREE.MeshStandardMaterial({
                    map: oldMat.map,
                    color: new THREE.Color(spec.primaryColor),
                    roughness: 0.4,
                    metalness: 0.2,
                    emissive: new THREE.Color(spec.primaryColor),
                    emissiveIntensity: 0.2
                });
                
                const name = child.name.toLowerCase();
                if (name.includes('hair')) {
                    newMat.color.set(spec.hairColor);
                    newMat.emissive.set(spec.hairColor);
                } else if (name.includes('skin') || name.includes('body')) {
                    newMat.color.set(spec.skinColor);
                    newMat.emissive.set('#000000');
                    newMat.emissiveIntensity = 0;
                }
                
                child.material = newMat;
                child.frustumCulled = false;
            }
        });
    }, [clonedScene, spec]);

    // 🏃‍♂️ Animation Logic
    useEffect(() => {
        if (!actions || !action) return;
        
        const animMap: Record<string, string[]> = {
            'idle': ['Boxing_Practice', 'Standing', 'Idle'],
            'walk': ['Walking'],
            'run': ['Running', 'Walking'],
            'spellcast': ['You_Groove', 'Spellcast']
        };
 
        const mapping = spec.animationMapping;
        if (mapping && (mapping as any)[action]) {
            const targetName = (mapping as any)[action];
            const targetAction = actions[targetName];
            if (targetAction && currentActionRef.current !== action) {
                Object.values(actions).forEach(a => a?.fadeOut(0.3));
                targetAction.reset().fadeIn(0.3).play();
                currentActionRef.current = action;
                return;
            }
        }

        const targetCandidates = animMap[action] || ['Walking'];
        const animationNames = Object.keys(actions);
        
        let targetKey = animationNames.find(k => !k.toLowerCase().includes('arise')) || animationNames[0];
        for (const cand of targetCandidates) {
            const found = animationNames.find(k => 
                k.toLowerCase().includes(cand.toLowerCase()) && 
                !k.toLowerCase().includes('arise')
            );
            if (found) {
                targetKey = found;
                break;
            }
        }
        
        const targetAction = actions[targetKey];
        if (targetAction && currentActionRef.current !== action) {
            Object.values(actions).forEach(a => a?.fadeOut(0.3));
            targetAction.reset().fadeIn(0.3).play();
            currentActionRef.current = action;
        }
    }, [actions, action]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        // Face movement direction
        if (Math.abs(velocity[0]) > 0.01 || Math.abs(velocity[2]) > 0.01) {
            targetRotation.current = Math.atan2(velocity[0], velocity[2]);
        }

        const angleDiff = targetRotation.current - currentRotation.current;
        const shortAngle = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        currentRotation.current += shortAngle * 10 * delta;
        groupRef.current.rotation.y = currentRotation.current;
    });

    return (
        <group ref={groupRef} position={position}>
            <primitive 
                object={clonedScene} 
                scale={[scale, scale, scale]} 
            />
        </group>
    );
};

useGLTF.preload('/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb');
