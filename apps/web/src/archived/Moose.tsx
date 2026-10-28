import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import type { FloorConfig } from './types';

// Copied logic from Avatar.tsx but specific for Moose
const MooseModel = ({ url, scale }: { url: string, scale: number }) => {
    const { scene, animations } = useGLTF(url, true);
    const { actions } = useAnimations(animations, scene);

    useEffect(() => {
        // Play first animation if available
        const actionKeys = Object.keys(actions);
        if (actionKeys.length > 0) {
            const firstAction = actions[actionKeys[0]];
            firstAction?.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    // Adjust scale/position as needed for Moose
    return <primitive object={scene} scale={scale} position={[0, 0, 0]} />;
};

const Moose: React.FC<{ floorConfig: FloorConfig, config: { scale: number, x: number, z: number } }> = ({ floorConfig, config }) => {
    const group = useRef<THREE.Group>(null);
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    // Start Moose slightly offset from Max + Config Offset
    const currentPos = useRef(new THREE.Vector3(floorConfig.x + 4 + config.x, floorConfig.y, floorConfig.z + 1 + config.z));
    const configRef = useRef(floorConfig);

    // React to Config Changes (Teleport/Reset Position)
    useEffect(() => {
        currentPos.current.set(
            floorConfig.x + 4 + config.x,
            floorConfig.y,
            floorConfig.z + 1 + config.z
        );
    }, [config, floorConfig]);

    useEffect(() => {
        configRef.current = floorConfig;
    }, [floorConfig]);

    useFrame((state, delta) => {
        if (!group.current) return;
        const { x: floorX, width: floorW, z: floorZ, depth: floorD, y: floorY } = configRef.current;

        // Wandering Logic (Slightly different parameters than Max for personality)
        if (Math.random() < 0.01) { // Moves less often
            velocity.current.x += (Math.random() - 0.5) * 3;
            velocity.current.z += (Math.random() - 0.5) * 3;
        }

        // Apply Velocity
        currentPos.current.add(velocity.current.clone().multiplyScalar(delta));
        velocity.current.multiplyScalar(0.98); // Higher friction (heavier)

        // Bounds
        const minX = floorX - floorW / 2;
        const maxX = floorX + floorW / 2;
        const minZ = floorZ - floorD / 2;
        const maxZ = floorZ + floorD / 2;

        const bounce = -0.5;
        if (currentPos.current.x > maxX) { currentPos.current.x = maxX; velocity.current.x *= bounce; }
        if (currentPos.current.x < minX) { currentPos.current.x = minX; velocity.current.x *= bounce; }
        if (currentPos.current.z > maxZ) { currentPos.current.z = maxZ; velocity.current.z *= bounce; }
        if (currentPos.current.z < minZ) { currentPos.current.z = minZ; velocity.current.z *= bounce; }

        // Rotation
        if (velocity.current.length() > 0.05) {
            const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
            let rot = group.current.rotation.y;
            let diff = targetRotation - rot;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            group.current.rotation.y += diff * delta * 2; // Turns slower
        }

        group.current.position.set(currentPos.current.x, floorY, currentPos.current.z);
    });

    return (
        <group ref={group}>
            <React.Suspense fallback={null}>
                <MooseModel url="/moose-bot.glb" scale={config.scale} />
            </React.Suspense>
        </group>
    );
};

export default Moose;
