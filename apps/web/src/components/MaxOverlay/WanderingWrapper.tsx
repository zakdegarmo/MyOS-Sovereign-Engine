import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { FloorConfig } from './types';
import type { CouncilAgent } from '../../council/agentRegistry';
import { BattleshipGrid } from '../../sys/BattleshipGrid';

interface WanderingWrapperProps {
    children: React.ReactNode;
    agent: CouncilAgent;
    initialPosition: string;
    floorConfig: FloorConfig;
    targetCoord?: string;    // e.g. "A1", "J10"
    isTalking: boolean;     // from Orchestrator Link
    onStateChange: (state: 'Idle' | 'Walk' | 'Talk') => void;
    allAgentsPositions: React.MutableRefObject<Record<string, THREE.Vector3>>;
}

/**
 * Avatar Controller (formerly WanderingWrapper).
 * Discards random wandering in favor of exact Cartesian grid coordinates.
 * Travels from current coords to targetCoord exactly at 1 unit per second.
 */
export const WanderingWrapper: React.FC<WanderingWrapperProps> = ({
    children,
    agent,
    initialPosition,
    floorConfig,
    targetCoord,
    isTalking,
    onStateChange,
    allAgentsPositions
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const velocity = useRef(new THREE.Vector3(0, 0, 0));

    // Y offset is static based on agent config
    const yOffset = agent.avatarConfig.yOffset || 0;
    // Convert initial grid coordinate to 3D position
    const initVec = useMemo(() => BattleshipGrid.getPosition(initialPosition, floorConfig) || new THREE.Vector3(), [initialPosition, floorConfig]);
    const currentPos = useRef(new THREE.Vector3(initVec.x, yOffset, initVec.z));

    const [localState, setLocalState] = useState<'Idle' | 'Walk' | 'Talk'>('Idle');

    // Report Position to global tracker
    useEffect(() => {
        allAgentsPositions.current[agent.id] = currentPos.current;
    }, [agent.id, allAgentsPositions]);

    const targetPos = useMemo(() => {
        if (!targetCoord) return null;
        return BattleshipGrid.getPosition(targetCoord, floorConfig);
    }, [targetCoord, floorConfig]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;

        // --- 1. Talking Overrides Everything ---
        if (isTalking) {
            if (localState !== 'Talk') {
                setLocalState('Talk');
                onStateChange('Talk');
            }
            velocity.current.set(0, 0, 0); // Stop moving
            // Maintain position
            groupRef.current.position.set(currentPos.current.x, yOffset, currentPos.current.z);
            return;
        }

        // --- 2. Precise Cartesian Traversal ---
        if (targetPos) {
            const distance = currentPos.current.distanceTo(targetPos);
            const arrivalThreshold = 0.05;

            if (distance > arrivalThreshold) {
                // Determine Direction
                const direction = new THREE.Vector3().subVectors(targetPos, currentPos.current).normalize();

                // User requirement: 1 grid_square/sec. 
                // Since the floorConfig width = 10,GRID_SIZE = 10, cellWidth = 1.
                // Euclidean distance handles the diagonal math automatically!
                const speed = 1.0;
                velocity.current.copy(direction.multiplyScalar(speed));

                if (localState !== 'Walk') {
                    setLocalState('Walk');
                    onStateChange('Walk');
                }

                // Apply Movement
                currentPos.current.add(velocity.current.clone().multiplyScalar(delta));
            } else {
                // Snap to exact target to avoid floating point drift
                currentPos.current.copy(targetPos);
                velocity.current.set(0, 0, 0);

                if (localState !== 'Idle') {
                    setLocalState('Idle');
                    onStateChange('Idle');
                }
            }
        } else {
            // No target, just chill
            velocity.current.set(0, 0, 0);
            if (localState !== 'Idle') {
                setLocalState('Idle');
                onStateChange('Idle');
            }
        }

        // Apply Final Position
        allAgentsPositions.current[agent.id].copy(currentPos.current);
        groupRef.current.position.set(currentPos.current.x, yOffset, currentPos.current.z);
    });

    return (
        <group ref={groupRef} position={[initVec.x, yOffset, initVec.z]}>
            {children}
        </group>
    );
};
