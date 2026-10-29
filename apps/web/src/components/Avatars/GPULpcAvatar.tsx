import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useLpcTexture, SHEET_WIDTH, SHEET_HEIGHT } from '../../hooks/useLpcTexture';
import { type AvatarState } from './AvatarController';

interface GPULpcAvatarProps {
    genome: Record<string, string>;
    action: AvatarState;
    velocity: [number, number, number];
    position: [number, number, number];
    scale?: number;
    cameraRotationY?: number;
}

const actionRowBase: Record<string, number> = {
    spellcast: 0,
    thrust: 4,
    walk: 8,
    slash: 12,
    bow: 16,
    hurt: 20,
    idle: 8, // Idle uses walk row but stays on frame 0
};

const actionFrames: Record<string, number> = {
    spellcast: 7,
    thrust: 8,
    walk: 9,
    slash: 6,
    bow: 13,
    hurt: 6,
    idle: 1,
};

const dirOffset: Record<string, number> = {
    'U': 0, 'L': 1, 'D': 2, 'R': 3,
    'UL': 1, 'UR': 3, 'DL': 2, 'DR': 2
};

export const GPULpcAvatar: React.FC<GPULpcAvatarProps> = ({
    genome,
    action,
    velocity,
    position,
    scale = 1,
    cameraRotationY = 0
}) => {
    const [lastDir, setLastDir] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');
    
    // 1. Bake the texture once for this genome
    const texture = useLpcTexture(genome);
    const materialRef = useRef<THREE.SpriteMaterial>(null);
    const animTimer = useRef(0);

    // 2. Determine Direction
    const direction = useMemo(() => {
        const vel = new THREE.Vector3(velocity[0], 0, velocity[2]);
        if (vel.length() < 0.001) return lastDir;

        if (cameraRotationY) {
            vel.applyAxisAngle(new THREE.Vector3(0, 1, 0), -cameraRotationY);
        }

        const angle = Math.atan2(vel.z, vel.x);
        let index = Math.round(angle / (Math.PI / 4));
        if (index < 0) index += 8;
        if (index === 8) index = 0;
        
        const dirs = ['R', 'DR', 'D', 'DL', 'L', 'UL', 'U', 'UR'] as const;
        return dirs[index];
    }, [velocity, lastDir, cameraRotationY]);

    useEffect(() => {
        if (direction !== lastDir) setLastDir(direction);
    }, [direction, lastDir]);

    // 3. GPU Frame Animation Loop
    useFrame((state, delta) => {
        if (!texture || !materialRef.current) return;
        
        animTimer.current += delta;
        
        // Settings for current action
        const activeAction = action === 'talk' ? 'idle' : action;
        const frames = actionFrames[activeAction];
        let row = actionRowBase[activeAction];
        
        // Hurt animation only has one row
        if (activeAction !== 'hurt') {
            row += dirOffset[direction];
        }

        // 10 frames per second animation speed
        const fps = 10; 
        const frameIndex = activeAction === 'idle' ? 0 : Math.floor(animTimer.current * fps) % frames;

        // The texture coordinate space goes from 0.0 to 1.0. 
        // We have 13 columns (x) and 21 rows (y)
        const colWidth = 1 / 13;
        const rowHeight = 1 / 21;

        // Set the window size
        texture.repeat.set(colWidth, rowHeight);
        
        // Offset the window
        // Note: For Y, 0 is the bottom in WebGL, but our rows are top-to-bottom.
        // We set flipY = false on the texture so 0 is top.
        texture.offset.set(frameIndex * colWidth, row * rowHeight);

        // Tell ThreeJS the texture matrix needs updating
        texture.needsUpdate = true;
    });

    return (
        <group position={position}>
            {texture ? (
                <sprite position={[0, scale, 0]} scale={[scale * 2, scale * 2, 1]}>
                    <spriteMaterial 
                        ref={materialRef} 
                        map={texture} 
                        transparent 
                        alphaTest={0.1} // Helps with depth sorting pixel art
                        color={0xffffff} 
                    />
                </sprite>
            ) : (
                <mesh position={[0, scale, 0]}>
                    <boxGeometry args={[0.5, 1, 0.5]} />
                    <meshBasicMaterial color="gray" wireframe />
                </mesh>
            )}
        </group>
    );
};
