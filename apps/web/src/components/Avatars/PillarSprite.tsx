import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useCouncil } from '../../council/CouncilContext';

interface PillarSpriteProps {
    agentId: string;
    imageUrl: string;
    scale?: number;
    position?: [number, number, number];
    onSelect?: (agentId: string) => void;
}

const PILLAR_METADATA: Record<string, { name: string; glyph: string; title: string; color: string; aura: string }> = {
    self: { name: 'Self', glyph: '◉', title: 'The Core', color: '#eab308', aura: 'rgba(234, 179, 8, 0.4)' },
    thought: { name: 'Thought', glyph: '✧', title: 'The Architect', color: '#6366f1', aura: 'rgba(99, 102, 241, 0.4)' },
    logic: { name: 'Logic', glyph: '∴', title: 'The Kernel', color: '#06b6d4', aura: 'rgba(6, 182, 212, 0.4)' },
    unity: { name: 'Unity', glyph: '⚭', title: 'The Weaver', color: '#10b981', aura: 'rgba(16, 185, 129, 0.4)' },
    existence: { name: 'Existence', glyph: '⬡', title: 'The Ground', color: '#d97706', aura: 'rgba(217, 119, 6, 0.4)' },
    improvement: { name: 'Improvement', glyph: '⇈', title: 'The Optimizer', color: '#f97316', aura: 'rgba(249, 115, 22, 0.4)' },
    mastery: { name: 'Mastery', glyph: '❂', title: 'The Master', color: '#ef4444', aura: 'rgba(239, 68, 68, 0.4)' },
    resonance: { name: 'Resonance', glyph: '∿', title: 'The Vibe', color: '#ec4899', aura: 'rgba(236, 72, 153, 0.4)' },
    transcendence: { name: 'Transcendence', glyph: '⍟', title: 'The Beyond', color: '#a855f7', aura: 'rgba(168, 85, 247, 0.4)' },
    omni: { name: 'Omni', glyph: '۞', title: 'The All', color: '#38bdf8', aura: 'rgba(56, 189, 248, 0.4)' }
};

export const PillarSprite: React.FC<PillarSpriteProps> = ({
    agentId,
    imageUrl,
    scale = 1.4,
    position = [0, 0, 0],
    onSelect
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const billboardRef = useRef<THREE.Group>(null);
    const pedestalRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();
    const { agentMessages, activeAgentId } = useCouncil();

    const cleanId = agentId.replace('drone-', '');
    const meta = PILLAR_METADATA[cleanId] || {
        name: cleanId.charAt(0).toUpperCase() + cleanId.slice(1),
        glyph: '✧',
        title: 'Guardian',
        color: '#22d3ee',
        aura: 'rgba(34, 211, 238, 0.4)'
    };

    const texture = useLoader(
        THREE.TextureLoader,
        imageUrl || '/assets/pillar_assets/pillar_self_colored_1772935053996_transparent.png'
    );

    const isSelected = activeAgentId === cleanId;
    const recentMessage = agentMessages?.[cleanId];
    const isSpeaking = recentMessage && (Date.now() - recentMessage.timestamp < 3500);

    useFrame((_, delta) => {
        // Pure billboarding for the vertical sprite plane
        if (billboardRef.current) {
            billboardRef.current.quaternion.copy(camera.quaternion);
        }

        // Slow mystical rotation for the ground pedestal
        if (pedestalRef.current) {
            pedestalRef.current.rotation.z += (isSpeaking ? 0.025 : 0.006);
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();
        onSelect?.(cleanId);
        window.dispatchEvent(new CustomEvent('myos:select-pillar', { detail: cleanId }));
    };

    return (
        <group ref={groupRef} position={position} onClick={handleClick}>
            {/* Ground Runic Pedestal Disc */}
            <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh ref={pedestalRef}>
                    <ringGeometry args={[scale * 0.32, scale * 0.44, 32]} />
                    <meshBasicMaterial
                        color={meta.color}
                        transparent
                        opacity={isSpeaking ? 0.95 : (isSelected ? 0.8 : 0.45)}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <mesh>
                    <circleGeometry args={[scale * 0.30, 32]} />
                    <meshBasicMaterial color="#020617" transparent opacity={0.65} />
                </mesh>
            </group>

            {/* Billboarded Character Sprite (Grounded: lowered from 0.48 to 0.27 to plant shoes on shadow) */}
            <group ref={billboardRef} position={[0, scale * 0.27, 0]}>
                <mesh>
                    <planeGeometry args={[scale * 0.95, scale * 0.95]} />
                    <meshBasicMaterial
                        map={texture}
                        transparent={true}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>

                {/* Subtle backlight aura glow behind sprite */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[scale * 1.05, scale * 1.05]} />
                    <meshBasicMaterial
                        color={meta.color}
                        transparent
                        opacity={isSpeaking ? 0.4 : (isSelected ? 0.28 : 0.12)}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            </group>

            {/* Floating 3D Holographic Name & Glyph Pill */}
            <Html
                position={[0, scale * 0.85, 0]}
                center
                distanceFactor={13}
                style={{ pointerEvents: 'none' }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 9px',
                        borderRadius: '9999px',
                        background: 'rgba(2, 6, 23, 0.88)',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${meta.color}${isSpeaking || isSelected ? 'cc' : '55'}`,
                        color: meta.color,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 ${isSpeaking ? '16px' : '8px'} ${meta.color}55`,
                        textShadow: `0 0 6px ${meta.color}88`,
                        transform: `scale(${isSpeaking ? 1.08 : 1.0})`,
                        transition: 'all 0.2s ease-out'
                    }}
                >
                    <span style={{ fontSize: '12px' }}>{meta.glyph}</span>
                    <span>{meta.name}</span>
                    {isSpeaking && (
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: meta.color,
                            boxShadow: `0 0 6px ${meta.color}`
                        }} />
                    )}
                </div>
            </Html>
        </group>
    );
};
