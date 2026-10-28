import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

import { AgentState, type FloorConfig } from './types';

interface AvatarProps {
    state: AgentState;
    onStateChange: (state: AgentState) => void;
    floorConfig: FloorConfig;
    modelType?: 'max' | 'moose';
    config: { scale: number, x: number, z: number };
}

interface ModelErrorBoundaryProps {
    fallback: React.ReactNode;
    children?: React.ReactNode;
}

interface ModelErrorBoundaryState {
    hasError: boolean;
}

class ModelErrorBoundary extends React.Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
    state: ModelErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
        return this.props.children;
    }
}

// Component to load the specific GLB file and play its animation
const SingleAvatarPart = ({ url, scale }: { url: string, scale: number }) => {
    const { scene, animations } = useGLTF(url, true);
    const { actions } = useAnimations(animations, scene);

    useEffect(() => {
        // Play the first animation found (Walking/Running)
        const actionKeys = Object.keys(actions);
        if (actionKeys.length > 0) {
            const firstAction = actions[actionKeys[0]];
            firstAction?.reset().fadeIn(0.5).play();
        }
    }, [actions]);

    return <primitive object={scene} scale={scale} position={[0, 0, 0]} />;
};

const SafeAvatarPart = ({ url, scale }: { url: string, scale: number }) => {
    return (
        <ModelErrorBoundary fallback={null}>
            <React.Suspense fallback={null}>
                <SingleAvatarPart url={url} scale={scale} />
            </React.Suspense>
        </ModelErrorBoundary>
    );
};

const Avatar: React.FC<AvatarProps & { stationary?: boolean }> = ({ state, floorConfig, modelType, config, stationary }) => {
    const group = useRef<THREE.Group>(null);

    // Keep track of latest config for useFrame
    const configRef = useRef(floorConfig);
    useEffect(() => {
        configRef.current = floorConfig;
    }, [floorConfig]);

    // Physics/Movement state
    const velocity = useRef(new THREE.Vector3(0, 0, 0));
    // Default start position (used only if not stationary)
    const currentPos = useRef(new THREE.Vector3(0, floorConfig.y, floorConfig.z));

    const glitchTimer = useRef(0);
    const nextGlitchTime = useRef(Math.random() * 5);
    const isGlitching = useRef(false);

    const { viewport, mouse } = useThree();

    useFrame((_state, delta) => {
        if (!group.current) return;

        // --- GLITCH LOGIC (Keep glitch even if stationary?) ---
        // Let's keep glitch for personality, but maybe reduce it for stationary agents
        glitchTimer.current += delta;
        if (!isGlitching.current) {
            group.current.scale.setScalar(1);
        }

        if (glitchTimer.current > nextGlitchTime.current) {
            isGlitching.current = true;
            if (glitchTimer.current > nextGlitchTime.current + (Math.random() * 0.2)) {
                isGlitching.current = false;
                glitchTimer.current = 0;
                nextGlitchTime.current = 2 + Math.random() * 5;
                group.current.scale.setScalar(1);
            } else {
                const s = 1 + (Math.random() - 0.5) * 0.3;
                group.current.scale.set(s, s * (Math.random() > 0.5 ? 1.1 : 0.9), s);
                // Only shake position if not stationary? Or shake strictly local?
                // group.current.position.x += (Math.random() - 0.5) * 0.05; 
            }
        }

        // --- NAVIGATION LOGIC ---
        // If stationary, we rely on Parent Group for position.
        // We DO NOT update group.current.position here.
        if (stationary) {
            // Face camera or look at mouse purely via rotation?
            // For now, let's just slowly face center or camera
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.05);
            return;
        }

        // Use current config
        const { x: floorX, y: floorY, z: floorZ, width: floorW, depth: floorD } = configRef.current;



        // --- 3D TRAVERSAL LOGIC ---
        const minX = floorX - floorW / 2;
        const maxX = floorX + floorW / 2;
        const minZ = floorZ - floorD / 2;
        const maxZ = floorZ + floorD / 2;

        // Random wandering impulse
        if (Math.random() < 0.02) {
            velocity.current.x += (Math.random() - 0.5) * 4;
            velocity.current.z += (Math.random() - 0.5) * 4;
        }

        // Apply Velocity
        currentPos.current.add(velocity.current.clone().multiplyScalar(delta));
        velocity.current.multiplyScalar(0.95); // Friction

        // Floor Bounds Collision
        const bounce = -0.8;
        if (currentPos.current.x > maxX) {
            currentPos.current.x = maxX;
            velocity.current.x *= bounce;
        }
        if (currentPos.current.x < minX) {
            currentPos.current.x = minX;
            velocity.current.x *= bounce;
        }
        if (currentPos.current.z < minZ) {
            currentPos.current.z = minZ;
            velocity.current.z *= bounce;
        }
        if (currentPos.current.z > maxZ) {
            currentPos.current.z = maxZ;
            velocity.current.z *= bounce;
        }

        // --- ROTATION / FACING ---
        if (velocity.current.length() > 0.1) {
            const targetRotation = Math.atan2(velocity.current.x, velocity.current.z);
            let rot = group.current.rotation.y;
            let diff = targetRotation - rot;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            group.current.rotation.y += diff * delta * 5;
        } else {
            // Look at mouse if idle (projected)
            const lookTarget = new THREE.Vector3(
                (mouse.x * viewport.width) / 2,
                floorY,
                floorZ + floorD / 2
            );
            const direction = lookTarget.sub(group.current.position).normalize();
            const targetRotation = Math.atan2(direction.x, direction.z);
            group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotation, 0.05);
        }

        // Update Position
        group.current.position.set(
            currentPos.current.x,
            floorY,
            currentPos.current.z
        );
    });

    return (
        <group ref={group} dispose={null}>
            <SafeAvatarPart url="/models/max/walking.glb" scale={config.scale} />
        </group>
    );
};

export default Avatar;
