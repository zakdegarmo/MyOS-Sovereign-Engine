import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { ProceduralGenome } from '../../utils/ManifestationAlgorithm';

interface ProceduralRigProps {
    genome: ProceduralGenome;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export const ProceduralRig: React.FC<ProceduralRigProps> = ({ genome, position = [0, 0, 0], rotation = [0, 0, 0] }) => {
    // Refs for animation
    const rootRef = useRef<THREE.Group>(null);
    const upperArmLRef = useRef<THREE.Group>(null);
    const upperArmRRef = useRef<THREE.Group>(null);
    const upperLegLRef = useRef<THREE.Group>(null);
    const upperLegRRef = useRef<THREE.Group>(null);
    const spineRef = useRef<THREE.Group>(null);

    const dims = genome.dimensions;
    const colors = genome.colors;

    // Helper to calculate capsule length (total height - 2*radius)
    const getCapsuleLength = (totalHeight: number, width: number) => Math.max(0.1, totalHeight - width);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const speed = genome.animation === 'walk' ? 6 : genome.animation === 'run' ? 12 : 2;
        const amplitude = genome.animation === 'idle' ? 0.05 : 0.6;

        if (genome.animation === 'walk' || genome.animation === 'run') {
            if (upperArmLRef.current) upperArmLRef.current.rotation.x = Math.sin(t * speed) * amplitude;
            if (upperArmRRef.current) upperArmRRef.current.rotation.x = Math.sin(t * speed + Math.PI) * amplitude;
            if (upperLegLRef.current) upperLegLRef.current.rotation.x = Math.sin(t * speed + Math.PI) * amplitude;
            if (upperLegRRef.current) upperLegRRef.current.rotation.x = Math.sin(t * speed) * amplitude;
            if (rootRef.current) rootRef.current.position.y = position[1] + Math.abs(Math.sin(t * speed * 2)) * 0.1;
        } else {
            if (spineRef.current) {
                spineRef.current.scale.y = 1 + Math.sin(t * speed) * 0.02;
                spineRef.current.rotation.x = Math.sin(t * speed) * 0.02;
            }
            if (upperArmLRef.current) upperArmLRef.current.rotation.x = THREE.MathUtils.lerp(upperArmLRef.current.rotation.x, 0.1, 0.1);
            if (upperArmRRef.current) upperArmRRef.current.rotation.x = THREE.MathUtils.lerp(upperArmRRef.current.rotation.x, 0.1, 0.1);
            if (upperLegLRef.current) upperLegLRef.current.rotation.x = THREE.MathUtils.lerp(upperLegLRef.current.rotation.x, 0, 0.1);
            if (upperLegRRef.current) upperLegRRef.current.rotation.x = THREE.MathUtils.lerp(upperLegRRef.current.rotation.x, 0, 0.1);
        }
    });

    return (
        <group ref={rootRef} position={position} rotation={rotation}>
            {/* PELVIS (Curvy base, squashed sphere) */}
            <group position={[0, dims.lowerLeg[1] + dims.upperLeg[1] + (dims.pelvis[1] / 2), 0]}>
                <mesh castShadow receiveShadow scale={[1, 0.8, 1]}>
                    <sphereGeometry args={[dims.pelvis[0] / 2, 32, 32]} />
                    <meshStandardMaterial color={colors.secondary} roughness={0.3} />
                </mesh>

                {/* SPINE / TORSO */}
                <group ref={spineRef} position={[0, dims.pelvis[1] / 2, 0]}>
                    {/* Torso Mesh (Hourglass curve via squashed sphere) */}
                    <group position={[0, dims.torso[1] / 2, 0]}>
                        <mesh castShadow receiveShadow scale={[1, 1.4, 0.8]}>
                            <sphereGeometry args={[dims.torso[0] / 2, 32, 32]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                        
                        {/* Bust/Chest curve overlay (Optional feminine stylistic choice) */}
                        <mesh position={[0, dims.torso[1] * 0.2, dims.torso[2] * 0.5]} castShadow scale={[1, 0.6, 0.8]}>
                            <sphereGeometry args={[dims.torso[0] * 0.45, 32, 32]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                    </group>

                    {/* NECK & HEAD */}
                    <group position={[0, dims.torso[1], 0]}>
                        {/* Neck */}
                        <mesh position={[0, 0.1, 0]} castShadow>
                            <cylinderGeometry args={[0.15, 0.2, 0.2, 16]} />
                            <meshStandardMaterial color={colors.skin} />
                        </mesh>

                        {/* Head (Smooth Sphere) */}
                        <group position={[0, 0.2 + dims.head[1] / 2, 0]}>
                            <mesh castShadow receiveShadow scale={[1, 1.1, 1]}>
                                <sphereGeometry args={[dims.head[0] / 2, 32, 32]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>
                            
                            {/* Simple Hair (Smooth Cap) */}
                            <mesh position={[0, dims.head[1] * 0.1, 0]} castShadow scale={[1.05, 1.05, 1.05]}>
                                <sphereGeometry args={[dims.head[0] / 2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
                                <meshStandardMaterial color={colors.hair} roughness={0.6} />
                            </mesh>
                        </group>
                    </group>

                    {/* SHOULDERS & ARMS */}
                    {/* Left Arm */}
                    <group ref={upperArmLRef} position={[(dims.torso[0] / 2) + 0.1, dims.torso[1] - 0.2, 0]}>
                        <mesh position={[0, -dims.upperArm[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.upperArm[0] / 2, getCapsuleLength(dims.upperArm[1], dims.upperArm[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                        {/* Lower Arm */}
                        <group position={[0, -dims.upperArm[1], 0]}>
                            <mesh position={[0, -dims.lowerArm[1] / 2, 0]} castShadow>
                                <capsuleGeometry args={[dims.lowerArm[0] / 2, getCapsuleLength(dims.lowerArm[1], dims.lowerArm[0]), 16, 16]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>
                        </group>
                    </group>

                    {/* Right Arm */}
                    <group ref={upperArmRRef} position={[-(dims.torso[0] / 2) - 0.1, dims.torso[1] - 0.2, 0]}>
                        <mesh position={[0, -dims.upperArm[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.upperArm[0] / 2, getCapsuleLength(dims.upperArm[1], dims.upperArm[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.primary} roughness={0.4} />
                        </mesh>
                        <group position={[0, -dims.upperArm[1], 0]}>
                            <mesh position={[0, -dims.lowerArm[1] / 2, 0]} castShadow>
                                <capsuleGeometry args={[dims.lowerArm[0] / 2, getCapsuleLength(dims.lowerArm[1], dims.lowerArm[0]), 16, 16]} />
                                <meshStandardMaterial color={colors.skin} roughness={0.4} />
                            </mesh>
                        </group>
                    </group>
                </group>

                {/* LEGS */}
                {/* Left Leg */}
                <group ref={upperLegLRef} position={[dims.pelvis[0] / 3, -dims.pelvis[1] / 2, 0]}>
                    <mesh position={[0, -dims.upperLeg[1] / 2, 0]} castShadow>
                        <capsuleGeometry args={[dims.upperLeg[0] / 2, getCapsuleLength(dims.upperLeg[1], dims.upperLeg[0]), 16, 16]} />
                        <meshStandardMaterial color={colors.secondary} roughness={0.4} />
                    </mesh>
                    <group position={[0, -dims.upperLeg[1], 0]}>
                        <mesh position={[0, -dims.lowerLeg[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.lowerLeg[0] / 2, getCapsuleLength(dims.lowerLeg[1], dims.lowerLeg[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.accent} roughness={0.4} />
                        </mesh>
                    </group>
                </group>

                {/* Right Leg */}
                <group ref={upperLegRRef} position={[-dims.pelvis[0] / 3, -dims.pelvis[1] / 2, 0]}>
                    <mesh position={[0, -dims.upperLeg[1] / 2, 0]} castShadow>
                        <capsuleGeometry args={[dims.upperLeg[0] / 2, getCapsuleLength(dims.upperLeg[1], dims.upperLeg[0]), 16, 16]} />
                        <meshStandardMaterial color={colors.secondary} roughness={0.4} />
                    </mesh>
                    <group position={[0, -dims.upperLeg[1], 0]}>
                        <mesh position={[0, -dims.lowerLeg[1] / 2, 0]} castShadow>
                            <capsuleGeometry args={[dims.lowerLeg[0] / 2, getCapsuleLength(dims.lowerLeg[1], dims.lowerLeg[0]), 16, 16]} />
                            <meshStandardMaterial color={colors.accent} roughness={0.4} />
                        </mesh>
                    </group>
                </group>
            </group>
        </group>
    );
};
