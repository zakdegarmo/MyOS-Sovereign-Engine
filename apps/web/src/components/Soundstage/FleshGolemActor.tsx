// apps/web/src/components/Soundstage/FleshGolemActor.tsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useGLTF, useAnimations, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

export interface FleshGolemActorProps {
    modelUrl: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    actionName?: string;
    nameTag: string;
    roleTag: string;
    badgeColor?: string;
    isCombatRehearsal?: boolean;
    onClick?: () => void;
}

export const FleshGolemActor: React.FC<FleshGolemActorProps> = ({
    modelUrl,
    position,
    rotation = [0, 0, 0],
    scale = 1.6,
    actionName = 'Melee_Weapon_Attack',
    nameTag,
    roleTag,
    badgeColor = '#f43f5e',
    isCombatRehearsal = false,
    onClick
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(modelUrl);
    const { actions, names } = useAnimations(animations, groupRef);
    const [activeAnim, setActiveAnim] = useState<string | null>(null);

    // Clone scene to allow multiple instances on stage without shared transforms
    const clonedScene = React.useMemo(() => {
        const clone = scene.clone(true);
        // Ensure shadows and materials are crisp
        clone.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                const mesh = child as THREE.Mesh;
                if (mesh.material) {
                    const mat = mesh.material as THREE.MeshStandardMaterial;
                    if (mat.roughness !== undefined) {
                        mat.roughness = 0.4;
                    }
                }
            }
        });
        return clone;
    }, [scene]);

    // Handle Animation Playback
    useEffect(() => {
        if (!actions || names.length === 0) return;

        // Try exact match, then fuzzy match, then fallback
        let targetAction = actions[actionName];
        if (!targetAction) {
            const foundName = names.find(n =>
                n.toLowerCase().includes(actionName.toLowerCase()) ||
                (isCombatRehearsal && n.toLowerCase().includes('attack')) ||
                (!isCombatRehearsal && n.toLowerCase().includes('idle'))
            );
            if (foundName) targetAction = actions[foundName];
        }
        if (!targetAction && names.length > 0) {
            targetAction = actions[names[0]];
        }

        if (targetAction) {
            targetAction.reset().fadeIn(0.2).play();
            setActiveAnim(targetAction.getClip().name);
        }

        return () => {
            if (targetAction) {
                targetAction.fadeOut(0.2);
            }
        };
    }, [actions, names, actionName, isCombatRehearsal]);

    return (
        <group 
            ref={groupRef} 
            position={position} 
            rotation={rotation} 
            scale={scale}
            onClick={(e) => {
                if (onClick) {
                    e.stopPropagation();
                    onClick();
                }
            }}
            onPointerOver={() => {
                if (onClick) document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                if (onClick) document.body.style.cursor = 'auto';
            }}
        >
            {/* 3D Flesh Golem Skinned Mesh Hierarchy */}
            <primitive object={clonedScene} />

            {/* Diegetic Actor Overhead Indicator Badge */}
            <group position={[0, 2.2, 0]}>
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[2.0, 0.45]} />
                    <meshBasicMaterial color="#090d16" transparent opacity={0.8} />
                </mesh>
                <mesh position={[0, 0, 0.005]}>
                    <planeGeometry args={[2.04, 0.49]} />
                    <meshBasicMaterial color={badgeColor} wireframe />
                </mesh>
                <Text
                    position={[0, 0.08, 0.01]}
                    fontSize={0.14}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.08}
                >
                    {nameTag}
                </Text>
                <Text
                    position={[0, -0.1, 0.01]}
                    fontSize={0.09}
                    color={badgeColor}
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.05}
                >
                    {roleTag}
                </Text>
            </group>
        </group>
    );
};

export default FleshGolemActor;
