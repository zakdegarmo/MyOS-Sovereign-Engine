import React, { useRef, useState, useEffect } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MaxAvatarProps {
    position?: [number, number, number];
    scale?: number;
}

/**
 * MaxAvatar.tsx
 * 
 * 3D Avatar component for the 'Max' character (walking.glb).
 * Features autonomous wandering AI and relative scaling.
 */
export const MaxAvatar: React.FC<MaxAvatarProps> = ({ 
    position = [0, 0, 0], 
    scale = 0.8 
}) => {
    const { scene, animations } = useGLTF('/models/max/walking.glb');
    const { actions } = useAnimations(animations, scene);
    const groupRef = useRef<THREE.Group>(null);

    // AI State
    const targetPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const currentPos = useRef(new THREE.Vector3(position[0], position[1], position[2]));
    const [isWait, setIsWait] = useState(false);
    const speed = 2.0;

    useEffect(() => {
        if (!actions) return;
        const animationNames = Object.keys(actions);
        const walkAction = actions['Walk'] || actions['walking'] || actions[animationNames[0]];
        if (walkAction) {
            walkAction.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        const dist = groupRef.current.position.distanceTo(targetPos.current);
        
        if (dist < 0.5 && !isWait) {
            setIsWait(true);
            setTimeout(() => {
                const range = 20;
                targetPos.current.set(
                    (Math.random() - 0.5) * range,
                    0,
                    (Math.random() - 0.5) * range
                );
                setIsWait(false);
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

// Pre-load
useGLTF.preload('/models/max/walking.glb');
