import React, { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorld } from '../../engine/WorldContext';
import { SemanticAvatar } from './SemanticAvatar';
import { useLpcManifest } from '../../hooks/useLpcManifest';

export const HorseNPC: React.FC = () => {
    const { mountState, toggleMount, setHorsePosition } = useWorld();
    const manifest = useLpcManifest();
    const { scene } = useThree();
    
    // Horse Physics Refs
    const posRef = useRef<[number, number, number]>([0, -100, 0]);
    const velRef = useRef<[number, number, number]>([0, 0, 0]);
    const [renderState, setRenderState] = useState({
        position: [0, -100, 0] as [number, number, number],
        velocity: [0, 0, 0] as [number, number, number],
        action: 'idle' as any
    });

    const isSummoned = mountState.isHorseSummoned;
    const isMounted = mountState.isMounted;
    const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3());

    // Listen for player position
    useEffect(() => {
        const handlePos = (e: any) => {
            playerPosRef.current.set(e.detail.x, e.detail.y, e.detail.z);
        };
        window.addEventListener('USER_POS_UPDATE', handlePos);
        return () => window.removeEventListener('USER_POS_UPDATE', handlePos);
    }, []);

    // Initial Summoning Logic
    useEffect(() => {
        if (isSummoned && posRef.current[1] < -50) {
            // Spawn horse ~15 meters away from player in a random direction
            const angle = Math.random() * Math.PI * 2;
            const dist = 15;
            posRef.current = [
                playerPosRef.current.x + Math.cos(angle) * dist,
                playerPosRef.current.y,
                playerPosRef.current.z + Math.sin(angle) * dist
            ];
            console.log("[HORSE] Summoned at:", posRef.current);
        }
    }, [isSummoned]);

    useFrame((_state, delta) => {
        if (!isSummoned) return;

        // If mounted, the horse follows the player exactly (or rather, the player is on the horse)
        // In this architecture, the horse component will just 'stay under' the player if mounted
        if (isMounted) {
            posRef.current = [playerPosRef.current.x, playerPosRef.current.y, playerPosRef.current.z];
            setRenderState({
                position: [...posRef.current],
                velocity: [0, 0, 0], // Velocity handled by player
                action: 'idle' // Horse movement handled by player action in compositor
            });
            setHorsePosition(posRef.current);
            return;
        }

        // Logic to move towards player
        const distToPlayer = playerPosRef.current.distanceTo(new THREE.Vector3(...posRef.current));
        
        if (distToPlayer > 1.5) {
            const dir = new THREE.Vector3()
                .copy(playerPosRef.current)
                .sub(new THREE.Vector3(...posRef.current))
                .normalize();
            
            const speed = distToPlayer > 5 ? 6 : 3;
            const vx = dir.x * speed;
            const vz = dir.z * speed;
            
            posRef.current[0] += vx * delta;
            posRef.current[2] += vz * delta;
            
            // Basic Grounding
            const terrainTruth = (window as any).GET_FAERUN_ELEVATION || ((x: number, z: number) => 0.1);
            posRef.current[1] = terrainTruth(posRef.current[0], posRef.current[2]) + 0.15;

            setRenderState({
                position: [...posRef.current],
                velocity: [vx, 0, vz],
                action: 'walk'
            });
        } else {
            // Close enough to talk/mount
            setRenderState({
                position: [...posRef.current],
                velocity: [0, 0, 0],
                action: 'idle'
            });
            
            // Automatic mounting if very close? or just stay there.
            // For now, let's keep it manual via HUD or proximity.
        }
        
        setHorsePosition(posRef.current);
    });

    if (!isSummoned || isMounted) return null; // Horse layer is handled by SemanticAvatar when mounted

    return (
        <group position={renderState.position}>
            <SemanticAvatar
                pillarName="horse"
                pillarIndex={mountState.horseType}
                position={[0, 0, 0]}
                velocity={renderState.velocity}
                action={renderState.action}
                scale={2.2}
                genome={{}} // Will be overridden by horse-specific logic in compositor
            />
        </group>
    );
};
