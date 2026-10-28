import React, { useRef, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

interface EmeraldScoutProps {
    position?: [number, number, number];
    scale?: number;
    action?: 'idle' | 'walk' | 'run';
    velocity?: [number, number, number];
}

export const EmeraldScout: React.FC<EmeraldScoutProps> = ({ 
    position = [0, 0, 0], 
    scale = 1.0,
    action = 'idle',
    velocity = [0, 0, 0]
}) => {
    // Using the Merged Animations GLB provided by the user
    const { scene, animations } = useGLTF('/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb');
    
    // Clone scene to avoid sharing state with other avatars
    const clonedScene = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { actions } = useAnimations(animations, clonedScene);
    const groupRef = useRef<THREE.Group>(null);
    const targetRotation = useRef(0);
    const currentRotation = useRef(0);

    const currentActionRef = useRef<string>('');

    // Play animation based on action
    useEffect(() => {
        if (!actions || !action) return;
        
        // If the action is already playing, don't reset it
        if (currentActionRef.current === action) return;

        const animationNames = Object.keys(actions);
        
        const findAction = (name: string) => {
            if (actions[name]) return actions[name];
            const lowerKey = animationNames.find(k => k.toLowerCase() === name.toLowerCase());
            if (lowerKey) return actions[lowerKey];
            const partialKey = animationNames.find(k => k.toLowerCase().includes(name.toLowerCase()));
            if (partialKey) return actions[partialKey];
            return null;
        };

        let targetAction = null;
        
        /**
         * THE GREAT SEMANTIC SWAP (as requested by user):
         * - 'Walking' identifies as IDLE
         * - 'You_Groove' identifies as WALKING
         */
        if (action === 'idle') {
            targetAction = findAction('Boxing_Practice') || findAction('Standing') || findAction('Idle');
        } else if (action === 'walk') {
            targetAction = findAction('Walking');
        } else if (action === 'run') {
            targetAction = findAction('Running') || findAction('Walking');
        } else if (action === 'spellcast') {
            targetAction = findAction('You_Groove') || findAction('Spellcast');
        }

        // Fallback to anything but Arise if no target found
        if (!targetAction) {
            const fallbackKey = animationNames.find(k => !k.toLowerCase().includes('arise'));
            targetAction = actions[fallbackKey || animationNames[0]];
        }

        if (targetAction) {
            // Stop previous action smoothly
            if (currentActionRef.current && actions[currentActionRef.current]) {
                // crossfade handled by fadeIn/fadeOut
            }
            
            targetAction.reset().fadeIn(0.5).play();
            targetAction.setLoop(THREE.LoopRepeat, Infinity);
            currentActionRef.current = action;
        }

        return () => {
            if (targetAction) targetAction.fadeOut(0.5);
        };
    }, [actions, action]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        
        // Subtle floating effect
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.001;

        // Facing Logic: Calculate rotation from velocity
        // We check against a small threshold to prevent jitter when nearly stationary
        if (Math.abs(velocity[0]) > 0.01 || Math.abs(velocity[2]) > 0.01) {
            // atan2(x, z) - note that in Three.js, facing forward is typically -Z
            // We use velocity[0] (x) and velocity[2] (z)
            targetRotation.current = Math.atan2(velocity[0], velocity[2]);
        }

        // Smoothly interpolate rotation (Lerp)
        const angleDiff = targetRotation.current - currentRotation.current;
        // Normalize angle to [-PI, PI] to prevent spinning the long way around
        const shortAngle = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        currentRotation.current += shortAngle * 10 * delta;
        groupRef.current.rotation.y = currentRotation.current;
    });

    return (
        <group ref={groupRef} position={position} dispose={null}>
            <primitive object={clonedScene} scale={scale} />
        </group>
    );
};

// Pre-load the model
useGLTF.preload('/models/meshy ai glb/rigged/Meshy_AI_Wilderness_Scout_biped/Meshy_AI_Wilderness_Scout_biped_Meshy_AI_Meshy_Merged_Animations.glb');
