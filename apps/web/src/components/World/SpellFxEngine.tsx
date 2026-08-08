import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type SpellSchool = 'evocation_fire' | 'evocation_frost' | 'evocation_lightning' | 'abjuration_holy' | 'conjuration_teleport';

export interface ActiveSpellCast {
    id: string;
    school: SpellSchool;
    name: string;
    position: [number, number, number];
    startTime: number;
    durationMs: number;
}

interface SpellFxItemProps {
    cast: ActiveSpellCast;
    onComplete: (id: string) => void;
}

export const SpellFxItem: React.FC<SpellFxItemProps> = ({ cast, onComplete }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const particlesRef = useRef<THREE.Points>(null);

    const particlePositions = useMemo(() => {
        const count = 120;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 6;
            pos[i * 3 + 1] = Math.random() * 4;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
        }
        return pos;
    }, []);

    const fxConfig = useMemo(() => {
        switch (cast.school) {
            case 'evocation_fire':
                return { primaryColor: '#f97316', secondaryColor: '#ef4444', particleColor: '#fef08a', scaleSpeed: 14, rotationSpeed: 3.5 };
            case 'evocation_frost':
                return { primaryColor: '#38bdf8', secondaryColor: '#0284c7', particleColor: '#e0f2fe', scaleSpeed: 10, rotationSpeed: -2.0 };
            case 'evocation_lightning':
                return { primaryColor: '#a855f7', secondaryColor: '#ec4899', particleColor: '#f472b6', scaleSpeed: 18, rotationSpeed: 8.0 };
            case 'abjuration_holy':
                return { primaryColor: '#eab308', secondaryColor: '#facc15', particleColor: '#fef08a', scaleSpeed: 6, rotationSpeed: 1.5 };
            case 'conjuration_teleport':
            default:
                return { primaryColor: '#10b981', secondaryColor: '#059669', particleColor: '#a7f3d0', scaleSpeed: 12, rotationSpeed: -4.0 };
        }
    }, [cast.school]);

    useFrame((_state, delta) => {
        const elapsed = Date.now() - cast.startTime;
        const progress = Math.min(elapsed / cast.durationMs, 1.0);

        if (progress >= 1.0) {
            onComplete(cast.id);
            return;
        }

        if (meshRef.current) {
            const currentScale = 1.0 + progress * fxConfig.scaleSpeed;
            meshRef.current.scale.set(currentScale, currentScale, currentScale);
            meshRef.current.rotation.y += delta * fxConfig.rotationSpeed;
        }

        if (ringRef.current) {
            const ringScale = (1.0 + progress * fxConfig.scaleSpeed) * 1.4;
            ringRef.current.scale.set(ringScale, ringScale, 1.0);
            ringRef.current.rotation.z += delta * (fxConfig.rotationSpeed * 1.2);
        }

        if (particlesRef.current) {
            particlesRef.current.rotation.y += delta * 2.0;
            const pScale = 1.0 + progress * 8.0;
            particlesRef.current.scale.set(pScale, pScale, pScale);
        }
    });

    return (
        <group position={cast.position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshBasicMaterial color={fxConfig.primaryColor} transparent opacity={0.85} wireframe={cast.school === 'evocation_lightning'} />
            </mesh>
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.8, 2.4, 32]} />
                <meshBasicMaterial color={fxConfig.secondaryColor} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={particlePositions.length / 3} array={particlePositions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial size={0.25} color={fxConfig.particleColor} transparent opacity={0.9} />
            </points>
        </group>
    );
};

export interface SpellFxEngineProps {
    activeCasts: ActiveSpellCast[];
    onCastComplete: (id: string) => void;
}

export const SpellFxEngine: React.FC<SpellFxEngineProps> = ({ activeCasts, onCastComplete }) => {
    return (
        <group name="SpellFxEngine">
            {activeCasts.map(cast => (
                <SpellFxItem key={cast.id} cast={cast} onComplete={onCastComplete} />
            ))}
        </group>
    );
};
