import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useCouncil } from '../council/CouncilContext';
import { type AgentId } from '../council/agentRegistry';

export type LocomotionState = 'Idle' | 'Walking' | 'Talking';

interface UseAILocomotionProps {
    agentId: AgentId;
    basePosition?: [number, number, number];
    enabled?: boolean;
    speed?: number;
    interactionRange?: number; // How close to get to objects
}

export function useAILocomotion({
    agentId,
    basePosition = [0, 0, 0],
    enabled = true,
    speed = 2.0,
    interactionRange = 2.0
}: UseAILocomotionProps) {
    const { scene } = useThree();
    const { agentTargets, agentMessages } = useCouncil();
    
    // Core physical state
    const position = useRef(new THREE.Vector3(...basePosition));
    const rotation = useRef(new THREE.Euler(0, 0, 0));
    const [locomotionState, setLocomotionState] = useState<LocomotionState>('Idle');
    
    // Cognitive state
    const currentTarget = useRef<THREE.Vector3 | null>(null);
    const wanderTimer = useRef(0);
    const isObserving = useRef(false);
    
    // Did the LLM explicitly tell us to go somewhere?
    const explicitTargetCoord = agentTargets?.[agentId];
    
    // Is the AI talking right now? (TTL 5 seconds for talking animation)
    const currentMsg = agentMessages?.[agentId];
    const isTalking = currentMsg && (Date.now() - currentMsg.timestamp < 5000);

    // Free Will: Environmental Scan
    const scanEnvironment = () => {
        const interactiveObjects: THREE.Object3D[] = [];
        
        // Very basic semantic scan: look for meshes with user data tagging them as interactive
        // In a complex scene, we might look for specific names or userData flags
        scene.traverse((child) => {
            if (child.userData?.isInteractive || child.name?.includes('Nexus') || child.name?.includes('File')) {
                interactiveObjects.push(child);
            }
        });

        if (interactiveObjects.length > 0) {
            // Pick a random object of interest
            const obj = interactiveObjects[Math.floor(Math.random() * interactiveObjects.length)];
            const targetPos = new THREE.Vector3();
            obj.getWorldPosition(targetPos);
            
            // Add a small random offset so they don't walk inside the object
            targetPos.x += (Math.random() - 0.5) * interactionRange;
            targetPos.z += (Math.random() - 0.5) * interactionRange;
            targetPos.y = position.current.y; // Stay grounded
            
            currentTarget.current = targetPos;
            isObserving.current = true; // We are going to observe this
        } else {
            // Just wander around the immediate vicinity randomly
            const range = 15;
            currentTarget.current = new THREE.Vector3(
                position.current.x + (Math.random() - 0.5) * range,
                position.current.y,
                position.current.z + (Math.random() - 0.5) * range
            );
            isObserving.current = false;
        }
    };

    useFrame((state, delta) => {
        if (!enabled) return;

        // 1. Check Operability (Explicit overrides from LLM)
        if (explicitTargetCoord) {
            try {
                // Assume explicit coords come in as "x,y,z" or JSON array
                let parsed: number[] = [];
                if (explicitTargetCoord.includes(',')) {
                    parsed = explicitTargetCoord.split(',').map(Number);
                } else if (explicitTargetCoord.startsWith('[')) {
                    parsed = JSON.parse(explicitTargetCoord);
                }
                
                if (parsed.length >= 3) {
                    currentTarget.current = new THREE.Vector3(parsed[0], parsed[1], parsed[2]);
                    isObserving.current = false; // Forced mission
                }
            } catch (e) {
                // Invalid coord format
            }
        }

        // 2. State Machine Update
        if (isTalking) {
            if (locomotionState !== 'Talking') setLocomotionState('Talking');
            // Face the camera when talking for better UX (optional but nice)
            const camPos = state.camera.position.clone();
            camPos.y = position.current.y; // Keep Y grounded
            const targetRotation = new THREE.Matrix4().lookAt(camPos, position.current, new THREE.Vector3(0, 1, 0));
            const targetEuler = new THREE.Euler().setFromRotationMatrix(targetRotation);
            // Smoothly rotate towards camera
            rotation.current.y += (targetEuler.y - rotation.current.y) * delta * 5;
            return;
        }

        if (currentTarget.current) {
            const dist = position.current.distanceTo(currentTarget.current);
            
            if (dist > 0.5) {
                // Moving towards target
                if (locomotionState !== 'Walking') setLocomotionState('Walking');
                
                const dir = currentTarget.current.clone().sub(position.current).normalize();
                position.current.add(dir.multiplyScalar(delta * speed));
                
                // Rotate to face movement direction
                const lookTarget = currentTarget.current.clone();
                lookTarget.y = position.current.y;
                const targetRotation = new THREE.Matrix4().lookAt(lookTarget, position.current, new THREE.Vector3(0, 1, 0));
                const targetEuler = new THREE.Euler().setFromRotationMatrix(targetRotation);
                
                // Slerp rotation
                const currentQuat = new THREE.Quaternion().setFromEuler(rotation.current);
                const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
                currentQuat.slerp(targetQuat, delta * 10);
                rotation.current.setFromQuaternion(currentQuat);
                
            } else {
                // Reached target
                if (locomotionState !== 'Idle') setLocomotionState('Idle');
                currentTarget.current = null;
                wanderTimer.current = 0; // Reset timer so they chill for a bit
            }
        } else {
            // Idle state: wait for a bit, then pick a new place to go
            if (locomotionState !== 'Idle') setLocomotionState('Idle');
            
            wanderTimer.current += delta;
            
            // If they just arrived to observe something, stay idle longer
            const idleTime = isObserving.current ? 8.0 : 4.0;
            
            if (wanderTimer.current > idleTime) {
                scanEnvironment();
            }
        }
    });

    return {
        position: [position.current.x, position.current.y, position.current.z] as [number, number, number],
        rotation: [rotation.current.x, rotation.current.y, rotation.current.z] as [number, number, number],
        locomotionState
    };
}
