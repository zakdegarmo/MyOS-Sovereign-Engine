import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const MooseBot: React.FC<{ position?: [number, number, number], scale?: number, disableAI?: boolean }> = ({ 
    position = [5, 0, 5], 
    scale = 0.65,
    disableAI = false
}) => {
    const { scene, animations } = useGLTF('/models/max/moose-bot.glb');
    const { actions } = useAnimations(animations, scene);
    const groupRef = useRef<THREE.Group>(null);

    // Wandering AI State
    const targetPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const [isThinking, setIsThinking] = useState(false);
    const speed = 2.0;

    // Play first animation or 'Idle' if available
    useEffect(() => {
        if (!actions) return;
        const animationNames = Object.keys(actions);
        const idleAction = actions['Idle'] || actions['idle'] || actions[animationNames[0]];
        if (idleAction) {
            idleAction.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        if (!disableAI) {
            // Simple Wandering AI
            const dist = groupRef.current.position.distanceTo(targetPos.current);
            
            if (dist < 0.5 && !isThinking) {
                setIsThinking(true);
                setTimeout(() => {
                    const range = 25;
                    targetPos.current.set(
                        (Math.random() - 0.5) * range,
                        0,
                        (Math.random() - 0.5) * range
                    );
                    setIsThinking(false);
                }, 3000 + Math.random() * 5000);
            }

            if (dist > 0.5) {
                const dir = targetPos.current.clone().sub(groupRef.current.position).normalize();
                groupRef.current.position.add(dir.multiplyScalar(delta * speed));
                
                // Look at target
                const lookTarget = targetPos.current.clone();
                lookTarget.y = groupRef.current.position.y;
                groupRef.current.lookAt(lookTarget);
            }
        }

        // Float slightly
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.1;
    });

    return (
        <group ref={groupRef} position={position}>
            <primitive 
                object={scene} 
                scale={[scale, scale, scale]} 
            />
        </group>
    );
};

// Pre-load the model
useGLTF.preload('/models/max/moose-bot.glb');
