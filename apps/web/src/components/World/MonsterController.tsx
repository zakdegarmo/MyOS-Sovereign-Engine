import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { randomizeGenome, defaultGenome } from '../../hooks/useOntologicalGenome';
import { useLpcManifest } from '../../hooks/useLpcManifest';

interface MonsterNPCProps {
    id: string;
    initialPosition: [number, number, number];
    type: 'skeleton' | 'goblin' | 'wolf';
    dangerLevel: number;
    playerPosition?: [number, number, number];
}

export const MonsterNPC: React.FC<MonsterNPCProps> = ({ id, initialPosition, type, dangerLevel, playerPosition }) => {
    const manifest = useLpcManifest();
    const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(...initialPosition));
    const [action, setAction] = useState<'idle' | 'walk' | 'spellcast'>('idle');
    const [isAggro, setIsAggro] = useState(false);
    
    const speed = 1.5 + (dangerLevel * 0.5);
    const aggroRange = 15 + (dangerLevel * 5);

    const genome = useMemo(() => {
        if (!manifest) return defaultGenome;
        // Monsters have specific "Deathly/Primal" genomes
        const base = randomizeGenome(manifest);
        return {
            ...base,
            body: type === 'skeleton' ? 'body/bodies/body_bodies_skeleton.png' : base.body,
            hair: 'none',
            eyes: 'none'
        };
    }, [manifest, type]);

    useFrame((state, delta) => {
        if (!playerPosition) return;

        const pPos = new THREE.Vector3(...playerPosition);
        const dist = position.distanceTo(pPos);

        if (dist < aggroRange) {
            setIsAggro(true);
            setAction('walk');
            
            // Move toward player
            const dir = pPos.clone().sub(position).normalize();
            // Don't get too close (stop at 1.5m for 'attack')
            if (dist > 1.8) {
                const nextPos = position.clone().add(dir.multiplyScalar(speed * delta));
                setPosition(nextPos);
            } else {
                setAction('spellcast'); // "Attack" animation
            }
        } else {
            setIsAggro(false);
            if (action !== 'idle') setAction('idle');
        }
    });

    return (
        <group position={position.toArray() as [number, number, number]}>
            <SemanticAvatar
                pillarName={type}
                pillarIndex={2} // Logic/Conflict
                position={[0, 0, 0]}
                velocity={[0, 0, 0]}
                cameraRotationY={0}
                action={action}
                scale={1.2}
                genome={genome}
            />
            {isAggro && (
                <mesh position={[0, 2.5, 0]}>
                    <sphereGeometry args={[0.1, 8, 8]} />
                    <meshBasicMaterial color="red" />
                </mesh>
            )}
        </group>
    );
};
