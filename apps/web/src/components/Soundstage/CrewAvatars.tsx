// apps/web/src/components/Soundstage/CrewAvatars.tsx
import React, { Suspense, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { PillarSprite } from '../Avatars/PillarSprite';

export interface CrewAvatarsProps {
    onSelectCrew?: (role: 'director' | 'dp' | 'gaffer' | 'producer') => void;
    activeRole?: 'director' | 'dp' | 'gaffer' | 'producer' | null;
}

// Interactive station marker badge
const StationBadge: React.FC<{
    title: string;
    subtitle: string;
    color: string;
    position: [number, number, number];
    isHovered: boolean;
    isSelected: boolean;
}> = ({ title, subtitle, color, position, isHovered, isSelected }) => {
    return (
        <group position={position}>
            {/* Floating billboard header */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.4, 0.65]} />
                <meshStandardMaterial
                    color={isSelected ? '#0f172a' : isHovered ? '#1e293b' : '#090d16'}
                    emissive={isSelected ? color : isHovered ? color : '#000000'}
                    emissiveIntensity={isSelected ? 0.6 : isHovered ? 0.3 : 0}
                    roughness={0.3}
                    metalness={0.8}
                />
            </mesh>
            {/* Border accent */}
            <mesh position={[0, 0, 0.01]}>
                <planeGeometry args={[2.48, 0.73]} />
                <meshBasicMaterial
                    color={isSelected ? color : isHovered ? color : '#334155'}
                    wireframe
                />
            </mesh>
            <Text
                position={[0, 0.12, 0.02]}
                fontSize={0.2}
                color={isSelected ? '#ffffff' : color}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.1}
            >
                {title}
            </Text>
            <Text
                position={[0, -0.15, 0.02]}
                fontSize={0.12}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.05}
            >
                {subtitle}
            </Text>
        </group>
    );
};

export const CrewAvatars: React.FC<CrewAvatarsProps> = ({
    onSelectCrew,
    activeRole
}) => {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <group>
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 1. DIRECTOR'S STATION (Akira) - Video Village & Folding Chair    */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[-4.5, 0, 3.5]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrew?.('director');
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered('director');
                }}
                onPointerOut={() => setHovered(null)}
            >
                {/* Tactical Floor Mark A (Yellow/Black hazard tape circle) */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
                    <ringGeometry args={[1.0, 1.15, 32]} />
                    <meshBasicMaterial color="#f43f5e" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                    <circleGeometry args={[1.0, 32]} />
                    <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
                </mesh>

                {/* Director's High-Back Canvas Chair */}
                <group position={[0.7, 0, 0.2]} rotation={[0, 0.3, 0]}>
                    {/* Wooden Legs (Cross-braced X) */}
                    <mesh position={[-0.25, 0.45, 0]} rotation={[0, 0, 0.15]} castShadow>
                        <boxGeometry args={[0.05, 0.95, 0.05]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[0.25, 0.45, 0]} rotation={[0, 0, -0.15]} castShadow>
                        <boxGeometry args={[0.05, 0.95, 0.05]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[0, 0.45, -0.25]} rotation={[0.15, 0, 0]} castShadow>
                        <boxGeometry args={[0.05, 0.95, 0.05]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>
                    <mesh position={[0, 0.45, 0.25]} rotation={[-0.15, 0, 0]} castShadow>
                        <boxGeometry args={[0.05, 0.95, 0.05]} />
                        <meshStandardMaterial color="#1e293b" />
                    </mesh>

                    {/* Canvas Seat Cushion */}
                    <mesh position={[0, 0.85, 0]} castShadow>
                        <boxGeometry args={[0.65, 0.06, 0.6]} />
                        <meshStandardMaterial color="#991b1b" roughness={0.7} />
                    </mesh>

                    {/* Backrest Uprights & Canvas */}
                    <mesh position={[-0.28, 1.35, -0.26]} castShadow>
                        <cylinderGeometry args={[0.025, 0.025, 1.0, 8]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0.28, 1.35, -0.26]} castShadow>
                        <cylinderGeometry args={[0.025, 0.025, 1.0, 8]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0, 1.5, -0.26]} castShadow>
                        <boxGeometry args={[0.62, 0.28, 0.04]} />
                        <meshStandardMaterial color="#991b1b" roughness={0.7} />
                    </mesh>
                    <Text
                        position={[0, 1.5, -0.23]}
                        fontSize={0.09}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="middle"
                        letterSpacing={0.1}
                    >
                        DIRECTOR
                    </Text>
                </group>

                {/* Video Village Console (Monitor Cart on wheels) */}
                <group position={[-0.6, 0, 0.5]} rotation={[0, -0.4, 0]}>
                    {/* Cart frame */}
                    <mesh position={[0, 0.6, 0]} castShadow>
                        <boxGeometry args={[0.8, 1.1, 0.5]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
                    </mesh>
                    {/* Primary Director Monitor */}
                    <mesh position={[0, 1.3, 0]} rotation={[-0.15, 0, 0]} castShadow>
                        <boxGeometry args={[0.9, 0.55, 0.08]} />
                        <meshStandardMaterial color="#0b0f19" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Glowing preview screen */}
                    <mesh position={[0, 1.3, 0.045]} rotation={[-0.15, 0, 0]}>
                        <planeGeometry args={[0.82, 0.48]} />
                        <meshBasicMaterial color="#0284c7" />
                    </mesh>
                    {/* Secondary Waveform / Scopes Monitor */}
                    <mesh position={[0, 0.82, 0.26]} rotation={[-0.3, 0, 0]}>
                        <planeGeometry args={[0.5, 0.25]} />
                        <meshBasicMaterial color="#10b981" />
                    </mesh>
                    {/* Clapperboard on cart shelf */}
                    <group position={[0.2, 1.18, 0.1]} rotation={[0, 0.4, 0]}>
                        <mesh castShadow>
                            <boxGeometry args={[0.24, 0.18, 0.02]} />
                            <meshStandardMaterial color="#0f172a" />
                        </mesh>
                        <Text position={[0, 0.02, 0.015]} fontSize={0.035} color="#ffffff">
                            SCENE 01 / TAKE 1
                        </Text>
                    </group>
                </group>

                {/* Director Avatar Billboard */}
                <Suspense fallback={null}>
                    <PillarSprite
                        agentId="director"
                        imageUrl="/assets/pillar_assets/pillar_thought_colored_1772935064430_transparent.png"
                        scale={3.0}
                        position={[0, 0, 0]}
                    />
                </Suspense>

                {/* Overhead Station Title Badge */}
                <StationBadge
                    title="DIRECTOR"
                    subtitle="Akira • Production Manifests"
                    color="#f43f5e"
                    position={[0, 3.4, 0]}
                    isHovered={hovered === 'director'}
                    isSelected={activeRole === 'director'}
                />
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 2. DP'S STATION (Cinematographer) - Camera Dolly Track & Rig    */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[4.5, 0, 2.5]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrew?.('dp');
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered('dp');
                }}
                onPointerOut={() => setHovered(null)}
            >
                {/* Camera Mark Floor Ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
                    <ringGeometry args={[1.0, 1.15, 32]} />
                    <meshBasicMaterial color="#f59e0b" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                    <circleGeometry args={[1.0, 32]} />
                    <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
                </mesh>

                {/* Dual Chrome Dolly Rails */}
                <group position={[-0.4, 0.04, -0.5]}>
                    <mesh position={[-0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 5.0, 12]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.35, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.03, 0.03, 5.0, 12]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                    </mesh>
                    {/* Rail ties */}
                    {[-2.0, -1.0, 0, 1.0, 2.0].map((z, idx) => (
                        <mesh key={idx} position={[0, -0.015, z]}>
                            <boxGeometry args={[0.9, 0.03, 0.12]} />
                            <meshStandardMaterial color="#1e293b" />
                        </mesh>
                    ))}
                </group>

                {/* Heavy Cinema Camera Dolly & Pedestal */}
                <group position={[-0.4, 0.1, 0.2]} rotation={[0, -0.2, 0]}>
                    {/* Dolly platform */}
                    <mesh position={[0, 0.05, 0]} castShadow>
                        <boxGeometry args={[0.9, 0.08, 0.8]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Hydraulic Riser Column */}
                    <mesh position={[0, 0.65, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.1, 1.1, 16]} />
                        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Cinema Camera Body (ARRI style) */}
                    <mesh position={[0, 1.25, 0]} castShadow>
                        <boxGeometry args={[0.3, 0.32, 0.45]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Cinema Prime Lens Barrel */}
                    <mesh position={[0, 1.25, -0.32]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.09, 0.1, 0.25, 16]} />
                        <meshStandardMaterial color="#090d16" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Matte Box & Flags */}
                    <mesh position={[0, 1.25, -0.48]} castShadow>
                        <boxGeometry args={[0.32, 0.24, 0.1]} />
                        <meshStandardMaterial color="#020617" roughness={0.6} />
                    </mesh>
                    {/* On-Camera Viewfinder / Monitor */}
                    <mesh position={[0.22, 1.35, 0]} rotation={[0, 0.3, 0]}>
                        <boxGeometry args={[0.05, 0.2, 0.28]} />
                        <meshStandardMaterial color="#0f172a" />
                    </mesh>
                    <mesh position={[0.25, 1.35, 0]} rotation={[0, 0.3, 0]}>
                        <planeGeometry args={[0.24, 0.16]} />
                        <meshBasicMaterial color="#38bdf8" />
                    </mesh>
                </group>

                {/* DP Avatar Billboard */}
                <Suspense fallback={null}>
                    <PillarSprite
                        agentId="dp"
                        imageUrl="/assets/pillar_assets/pillar_existence_colored_1772935107738_transparent.png"
                        scale={3.0}
                        position={[0.5, 0, 0]}
                    />
                </Suspense>

                {/* Overhead Station Title Badge */}
                <StationBadge
                    title="DP / CINEMATOGRAPHER"
                    subtitle="Framing • Lenses • Camera Dollies"
                    color="#f59e0b"
                    position={[0, 3.4, 0]}
                    isHovered={hovered === 'dp'}
                    isSelected={activeRole === 'dp'}
                />
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 3. GAFFER'S STATION (Lighting Tech) - Dimmer Rack & Flag Stand  */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[7.0, 0, 5.5]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrew?.('gaffer');
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered('gaffer');
                }}
                onPointerOut={() => setHovered(null)}
            >
                {/* Tactical Floor Mark Ring */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
                    <ringGeometry args={[1.0, 1.15, 32]} />
                    <meshBasicMaterial color="#eab308" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                    <circleGeometry args={[1.0, 32]} />
                    <meshBasicMaterial color="#0f172a" transparent opacity={0.6} />
                </mesh>

                {/* Lighting Control Desk / Dimmer Console */}
                <group position={[-0.4, 0, 0]} rotation={[0, -0.5, 0]}>
                    {/* Console table */}
                    <mesh position={[0, 0.5, 0]} castShadow>
                        <boxGeometry args={[1.2, 0.95, 0.65]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
                    </mesh>
                    {/* Slanted Fader Surface */}
                    <mesh position={[0, 1.0, 0]} rotation={[-0.2, 0, 0]} castShadow>
                        <boxGeometry args={[1.15, 0.08, 0.55]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
                    </mesh>
                    {/* Glowing DMX Display Strip */}
                    <mesh position={[0, 1.06, -0.15]} rotation={[-0.2, 0, 0]}>
                        <planeGeometry args={[1.0, 0.15]} />
                        <meshBasicMaterial color="#eab308" />
                    </mesh>
                    {/* Fader Channels (LED Indicators) */}
                    {[-0.4, -0.2, 0, 0.2, 0.4].map((x, idx) => (
                        <mesh key={idx} position={[x, 1.05, 0.05]} rotation={[-0.2, 0, 0]}>
                            <boxGeometry args={[0.04, 0.04, 0.15]} />
                            <meshBasicMaterial color={idx % 2 === 0 ? '#ef4444' : '#38bdf8'} />
                        </mesh>
                    ))}
                </group>

                {/* Professional C-Stand with Cutter Flag / Reflector */}
                <group position={[0.7, 0, -0.4]}>
                    {/* Turtle Base C-Stand Legs */}
                    <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.2, 0.45, 3]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} />
                    </mesh>
                    {/* Main Chrome Riser */}
                    <mesh position={[0, 1.4, 0]} castShadow>
                        <cylinderGeometry args={[0.02, 0.025, 2.7, 12]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
                    </mesh>
                    {/* Grip Head & Gobo Arm */}
                    <mesh position={[0.3, 2.5, 0]} rotation={[0, 0, 0.4]} castShadow>
                        <cylinderGeometry args={[0.015, 0.015, 1.1, 10]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                    </mesh>
                    {/* Black Solid Flag (Cutter) */}
                    <mesh position={[0.7, 2.7, 0]} rotation={[0.2, 0.3, 0]} castShadow>
                        <boxGeometry args={[0.6, 0.8, 0.02]} />
                        <meshStandardMaterial color="#090d16" roughness={0.9} />
                    </mesh>
                </group>

                {/* Gaffer Avatar Billboard */}
                <Suspense fallback={null}>
                    <PillarSprite
                        agentId="gaffer"
                        imageUrl="/assets/pillar_assets/pillar_resonance_sprite_1772934836602_transparent.png"
                        scale={3.0}
                        position={[0, 0, 0]}
                    />
                </Suspense>

                {/* Overhead Station Title Badge */}
                <StationBadge
                    title="GAFFER / LIGHTING"
                    subtitle="Chiaroscuro • 3-Point Setup • Cel Ramps"
                    color="#eab308"
                    position={[0, 3.4, 0]}
                    isHovered={hovered === 'gaffer'}
                    isSelected={activeRole === 'gaffer'}
                />
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 4. EXECUTIVE PRODUCER STATION (User) - Slate & Production Desk  */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[0, 0, 5.5]}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectCrew?.('producer');
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered('producer');
                }}
                onPointerOut={() => setHovered(null)}
            >
                {/* Executive Producer Floor Star Emblem */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
                    <ringGeometry args={[1.2, 1.35, 32]} />
                    <meshBasicMaterial color="#38bdf8" />
                </mesh>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
                    <circleGeometry args={[1.2, 32]} />
                    <meshBasicMaterial color="#0f172a" transparent opacity={0.7} />
                </mesh>

                {/* Glass & Steel Producer Console */}
                <group position={[0, 0, 0.4]}>
                    {/* Steel table frame */}
                    <mesh position={[0, 0.48, 0]} castShadow>
                        <boxGeometry args={[1.8, 0.9, 0.7]} />
                        <meshStandardMaterial
                            color="#0f172a"
                            metalness={0.8}
                            roughness={0.2}
                            wireframe
                        />
                    </mesh>
                    {/* Glass surface top */}
                    <mesh position={[0, 0.94, 0]}>
                        <boxGeometry args={[1.85, 0.04, 0.75]} />
                        <meshStandardMaterial
                            color="#0284c7"
                            transparent
                            opacity={0.5}
                            metalness={0.9}
                            roughness={0.1}
                        />
                    </mesh>
                    {/* Production Master Tablet Slate */}
                    <group position={[0, 0.97, 0]} rotation={[-0.2, 0, 0]}>
                        <mesh castShadow>
                            <boxGeometry args={[0.42, 0.02, 0.3]} />
                            <meshStandardMaterial color="#020617" />
                        </mesh>
                        <mesh position={[0, 0.012, 0]}>
                            <planeGeometry args={[0.39, 0.27]} />
                            <meshBasicMaterial color="#38bdf8" />
                        </mesh>
                        <Text position={[0, 0.02, 0]} fontSize={0.035} color="#0f172a">
                            MYOS PRODUCTION SUITE
                        </Text>
                    </group>
                </group>

                {/* Producer Station Title Badge */}
                <StationBadge
                    title="EXECUTIVE PRODUCER"
                    subtitle="User • Greenlight • Screening Approval"
                    color="#38bdf8"
                    position={[0, 2.6, 0]}
                    isHovered={hovered === 'producer'}
                    isSelected={activeRole === 'producer'}
                />
            </group>
        </group>
    );
};

export default CrewAvatars;
