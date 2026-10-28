import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { type AvatarState } from './AvatarController';

interface MyEngineAvatarProps {
    action: AvatarState;
    velocity: [number, number, number];
    position: [number, number, number];
    scale?: number;
    cameraRotationY?: number;
}

// Temporary placeholder ledger. In production, this comes from a database.
const ACTION_LEDGER = {
    'knight': {
        // We use reliable Wikimedia Commons GIFs for testing to avoid CORS/hotlink blocking
        'idle_D': 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_%28large%29.gif', // Rotating Earth
        'walk_D': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg', // Static Lion (Walk)
        'walk_R': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
        'walk_L': 'https://upload.wikimedia.org/wikipedia/commons/7/73/Lion_waiting_in_Namibia.jpg',
        'slash_D': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Polyhedron_with_no_name.gif', // Rotating Polyhedron
        'hurt_D': 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Newtons_cradle_animation_book_2.gif', // Newton's Cradle
    }
};

export const MyEngineAvatar: React.FC<MyEngineAvatarProps> = ({
    action,
    velocity,
    position,
    scale = 1,
    cameraRotationY = 0
}) => {
    const [lastDir, setLastDir] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');

    // Key-Locked direction calculation
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

    // Lookup the atomic asset
    const actionKey = `${action}_${direction}`;
    const ledger = ACTION_LEDGER['knight'] as any;
    // Fallback to idle_D if missing
    const assetUrl = ledger[actionKey] || ledger[`${action}_D`] || ledger['idle_D'];

    return (
        <group position={position}>
            <Html 
                transform 
                sprite // Makes the HTML act like a billboard!
                position={[0, scale, 0]} 
                scale={scale * 2}
                zIndexRange={[100, 0]}
            >
                <div style={{
                    width: '128px',
                    height: '128px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    pointerEvents: 'none'
                }}>
                    <img 
                        src={assetUrl} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            imageRendering: 'pixelated'
                        }} 
                        alt="Avatar State" 
                    />
                    {/* Visual debug overlay */}
                    <div style={{
                        marginTop: '4px',
                        background: 'rgba(0,0,0,0.8)',
                        color: '#00ff00',
                        fontSize: '12px',
                        padding: '4px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                    }}>
                        {action}_{direction}
                    </div>
                </div>
            </Html>
        </group>
    );
};
