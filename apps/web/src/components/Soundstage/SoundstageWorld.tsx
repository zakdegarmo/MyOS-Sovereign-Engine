// apps/web/src/components/Soundstage/SoundstageWorld.tsx
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { FleshGolemActor } from './FleshGolemActor';
import { CrewAvatars } from './CrewAvatars';

export interface SoundstageWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
    currentReel?: string;
    isPlaying?: boolean;
    isMuted?: boolean;
    onScreenClick?: () => void;
    onSelectCrew?: (role: 'director' | 'dp' | 'gaffer' | 'producer') => void;
    activeCrewRole?: 'director' | 'dp' | 'gaffer' | 'producer' | null;
    onDimensionSwap?: (dim: string) => void;
    onOpenSlate?: () => void;
}

// Industrial Aluminium Box Truss Section
const TrussBar: React.FC<{
    position: [number, number, number];
    length: number;
    axis?: 'x' | 'z';
}> = ({ position, length, axis = 'x' }) => {
    return (
        <group position={position}>
            {axis === 'x' ? (
                <>
                    <mesh position={[0, 0.4, 0.4]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, -0.4, 0.4]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, -0.4, -0.4]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[length, 0.8, 0.8]} />
                        <meshStandardMaterial color="#334155" metalness={0.8} wireframe />
                    </mesh>
                </>
            ) : (
                <>
                    <mesh position={[0.4, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[-0.4, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[0.4, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh position={[-0.4, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.04, 0.04, length, 8]} />
                        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
                    </mesh>
                    <mesh>
                        <boxGeometry args={[0.8, 0.8, length]} />
                        <meshStandardMaterial color="#334155" metalness={0.8} wireframe />
                    </mesh>
                </>
            )}
        </group>
    );
};

// High-Bay Studio Flood Light Bank (Bright Daylight Fill)
const StudioHighBayBank: React.FC<{
    position: [number, number, number];
}> = ({ position }) => {
    return (
        <group position={position}>
            {/* Housing Frame */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[4.0, 0.4, 2.5]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Glowing Diffuser Panel */}
            <mesh position={[0, -0.22, 0]}>
                <planeGeometry args={[3.8, 2.3]} />
                <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* Broad Studio Fill Light */}
            <pointLight
                position={[0, -0.5, 0]}
                color="#f8fafc"
                intensity={4.5}
                distance={55}
                decay={1.8}
            />
        </group>
    );
};

// Studio Spotlight Fixture with Barn Doors and Targeted Light
const StudioSpotlightFixture: React.FC<{
    position: [number, number, number];
    targetPosition: [number, number, number];
    color: string;
    intensity: number;
    angle?: number;
    name: string;
}> = ({ position, targetPosition, color, intensity, angle = 0.65 }) => {
    const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

    return (
        <group position={position}>
            {/* Spotlight fixture yoke & barrel */}
            <mesh castShadow>
                <cylinderGeometry args={[0.35, 0.25, 0.8, 16]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Front barn doors */}
            <mesh position={[0, -0.42, 0]}>
                <boxGeometry args={[0.6, 0.08, 0.6]} />
                <meshStandardMaterial color="#020617" roughness={0.8} />
            </mesh>
            {/* Glowing lens face */}
            <mesh position={[0, -0.4, 0]}>
                <circleGeometry args={[0.3, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
            {/* Targeted spotlight */}
            <spotLight
                color={color}
                intensity={intensity}
                angle={angle}
                penumbra={0.35}
                distance={50}
                castShadow
                target={targetRef.current}
            />
            <primitive
                object={targetRef.current}
                position={[targetPosition[0] - position[0], targetPosition[1] - position[1], targetPosition[2] - position[2]]}
            />
        </group>
    );
};

export const SoundstageWorld: React.FC<SoundstageWorldProps> = ({
    isActive = true,
    isPlaying = true,
    onSelectCrew,
    activeCrewRole,
    onDimensionSwap,
    onOpenSlate
}) => {
    const dollyRef = useRef<THREE.Group>(null);
    const [isRehearsing, setIsRehearsing] = useState(false);
    const [dollyProgress, setDollyProgress] = useState(0);

    // Live Actor Staging Actions (LPC Decivoxel Rigged Clips)
    const ACTOR_A_ACTIONS = [
        'Melee_Weapon_Attack',
        'Melee_Weapon_Idle',
        'Spell_Simple_Shoot',
        'Dance_Loop',
        'Punch_Jab',
        'Pistol_Aim_Neutral'
    ];
    const ACTOR_B_ACTIONS = [
        'Melee_Weapon_Idle',
        'Melee_Weapon_Attack',
        'Spell_Simple_Idle_Loop',
        'Idle_Talking_Loop',
        'Hit_Chest',
        'Death01'
    ];
    const [actionIndexA, setActionIndexA] = useState(0);
    const [actionIndexB, setActionIndexB] = useState(0);

    // Dolly movement and live take rehearsal loop
    useFrame((_state, delta) => {
        if (isRehearsing) {
            setDollyProgress(prev => {
                const next = prev + delta * 0.45;
                if (next >= 1.0) {
                    setIsRehearsing(false);
                    return 0;
                }
                return next;
            });
        }

        if (dollyRef.current) {
            // Dolly tracks laterally along X axis from -3 to +3
            const lateralOffset = isRehearsing ? Math.sin(dollyProgress * Math.PI) * 2.5 : 0;
            dollyRef.current.position.x = -1.5 + lateralOffset;
        }
    });

    if (!isActive) return null;

    return (
        <group name="SoundstageWorld">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 1. SOUNDSTAGE ARCHITECTURE & POLISHED PRODUCTION FLOOR          */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Smooth Polished Concrete Studio Stage Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[90, 90]} />
                <meshStandardMaterial
                    color="#1e2433"
                    roughness={0.4}
                    metalness={0.2}
                />
            </mesh>

            {/* Stage Studio Safety Perimeter Border (Yellow Hazard Stripes) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <ringGeometry args={[18, 18.25, 4]} />
                <meshBasicMaterial color="#eab308" />
            </mesh>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 2. REUSABLE MODULAR SET PAD (Center Stage: Cliff Plateau)       */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group position={[0, 0, -2]}>
                {/* Elevated Set Deck Platform */}
                <mesh position={[0, 0.12, 0]} receiveShadow>
                    <cylinderGeometry args={[11, 12, 0.24, 32]} />
                    <meshStandardMaterial color="#2d2824" roughness={0.9} />
                </mesh>

                {/* Tactical Floor Mark A (Lunaria - Stage Right) */}
                <group position={[-2.4, 0.26, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <circleGeometry args={[0.9, 24]} />
                        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                        <ringGeometry args={[0.85, 0.95, 24]} />
                        <meshBasicMaterial color="#ef4444" />
                    </mesh>
                    <Text position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.26} color="#ffffff">
                        MARK A
                    </Text>
                </group>

                {/* Tactical Floor Mark B (Vespera - Stage Left) */}
                <group position={[2.4, 0.26, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <circleGeometry args={[0.9, 24]} />
                        <meshBasicMaterial color="#06b6d4" transparent opacity={0.3} />
                    </mesh>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                        <ringGeometry args={[0.85, 0.95, 24]} />
                        <meshBasicMaterial color="#06b6d4" />
                    </mesh>
                    <Text position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.26} color="#ffffff">
                        MARK B
                    </Text>
                </group>

                {/* Practical Set Dressing: Crimson Zenith Jagged Cliff Boulders */}
                <mesh position={[-4.5, 0.8, -1.8]} rotation={[0.2, 0.4, 0.1]} castShadow>
                    <dodecahedronGeometry args={[1.3, 0]} />
                    <meshStandardMaterial color="#3b322a" roughness={0.95} />
                </mesh>
                <mesh position={[4.8, 1.0, -1.5]} rotation={[-0.3, 0.2, 0.2]} castShadow>
                    <dodecahedronGeometry args={[1.5, 0]} />
                    <meshStandardMaterial color="#3b322a" roughness={0.95} />
                </mesh>
                <mesh position={[0, 0.5, -4.5]} castShadow>
                    <boxGeometry args={[14, 0.8, 2.0]} />
                    <meshStandardMaterial color="#2d2824" roughness={0.95} />
                </mesh>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 3. REAL 3D FLESH GOLEM ACTORS ON STAGE                          */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* MARK A: Lunaria (Flesh Golem Mannequin - Elder Sister / Protagonist) */}
            <FleshGolemActor
                modelUrl="/models/lunaria_flesh_golem.glb"
                position={[-2.4, 0.24, -2]}
                rotation={[0, 0.5, 0]}
                scale={1.75}
                actionName={isRehearsing ? 'Melee_Weapon_Attack' : ACTOR_A_ACTIONS[actionIndexA]}
                nameTag="LUNARIA (FLESH GOLEM)"
                roleTag={`Protagonist • ${ACTOR_A_ACTIONS[actionIndexA].replace(/_/g, ' ')}`}
                badgeColor="#f43f5e"
                isCombatRehearsal={isRehearsing}
                onClick={() => setActionIndexA(prev => (prev + 1) % ACTOR_A_ACTIONS.length)}
            />

            {/* MARK B: Vespera (Flesh Golem Mannequin - Younger Sister / Antagonist) */}
            <FleshGolemActor
                modelUrl="/models/vespera_flesh_golem.glb"
                position={[2.4, 0.24, -2]}
                rotation={[0, -0.5, 0]}
                scale={1.75}
                actionName={isRehearsing ? 'Melee_Weapon_Attack' : ACTOR_B_ACTIONS[actionIndexB]}
                nameTag="VESPERA (FLESH GOLEM)"
                roleTag={`Antagonist • ${ACTOR_B_ACTIONS[actionIndexB].replace(/_/g, ' ')}`}
                badgeColor="#38bdf8"
                isCombatRehearsal={isRehearsing}
                onClick={() => setActionIndexB(prev => (prev + 1) % ACTOR_B_ACTIONS.length)}
            />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 4. SOUNDSTAGE LIGHTING: HIGH-BAY DAYLIGHT & 3-POINT SPOTS       */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* 4x High-Bay Industrial Overhead Floodlight Banks */}
            <StudioHighBayBank position={[-16, 14, -8]} />
            <StudioHighBayBank position={[16, 14, -8]} />
            <StudioHighBayBank position={[-16, 14, 8]} />
            <StudioHighBayBank position={[16, 14, 8]} />

            {/* Studio Overhead Trusses */}
            <TrussBar position={[0, 13.5, -12]} length={44} axis="x" />
            <TrussBar position={[0, 13.5, 0]} length={44} axis="x" />
            <TrussBar position={[0, 13.5, 12]} length={44} axis="x" />
            <TrussBar position={[-18, 13.5, 0]} length={28} axis="z" />
            <TrussBar position={[18, 13.5, 0]} length={28} axis="z" />

            {/* 1. KEY LIGHT: High-Intensity Sunset Amber Key (Right Overhead) */}
            <StudioSpotlightFixture
                name="KeyLight"
                position={[11, 12, 6]}
                targetPosition={[0, 1.8, -2]}
                color="#ff9933"
                intensity={6.5}
                angle={0.7}
            />

            {/* 2. FILL LIGHT: Deep Midnight Cool Cyan Fill (Left Overhead) */}
            <StudioSpotlightFixture
                name="FillLight"
                position={[-11, 10, 6]}
                targetPosition={[0, 1.8, -2]}
                color="#38bdf8"
                intensity={4.0}
                angle={0.75}
            />

            {/* 3. RIM LIGHT: Dramatic Sanguine/Magenta Rim Light (Back Overhead) */}
            <StudioSpotlightFixture
                name="RimLight"
                position={[0, 12, -9]}
                targetPosition={[0, 1.5, -2]}
                color="#ff2a6d"
                intensity={7.0}
                angle={0.65}
            />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 5. STUDIO CAMERA DOLLY & LIVE VIEWFINDER SCREEN                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Steel Dolly Tracks */}
            <group position={[0, 0.05, 5]}>
                <mesh position={[0, 0, -0.6]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.035, 0.035, 26, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0.6]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.035, 0.035, 26, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
                </mesh>
                {[-11, -8, -5, -2, 1, 4, 7, 10].map((x, idx) => (
                    <mesh key={idx} position={[x, -0.02, 0]}>
                        <boxGeometry args={[0.35, 0.04, 1.6]} />
                        <meshStandardMaterial color="#451a03" roughness={0.8} />
                    </mesh>
                ))}

                {/* Wheeled Camera Dolly Cart */}
                <group ref={dollyRef} position={[-1.5, 0.2, 0]}>
                    {/* Dolly Base */}
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[1.8, 0.14, 1.4]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
                    </mesh>
                    {/* Pedestal Column */}
                    <mesh position={[0, 0.75, 0]} castShadow>
                        <cylinderGeometry args={[0.12, 0.16, 1.4, 12]} />
                        <meshStandardMaterial color="#334155" metalness={0.9} />
                    </mesh>

                    {/* 3D Cinema Camera Body (ARRI / RED Style) */}
                    <group position={[0, 1.55, -0.1]}>
                        <mesh castShadow>
                            <boxGeometry args={[0.42, 0.42, 0.65]} />
                            <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.9} />
                        </mesh>
                        {/* Cine Prime Lens */}
                        <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[0.16, 0.13, 0.25, 16]} />
                            <meshStandardMaterial color="#0f172a" metalness={0.85} />
                        </mesh>
                        {/* Matte Box Hood */}
                        <mesh position={[0, 0, -0.6]} castShadow>
                            <boxGeometry args={[0.48, 0.38, 0.12]} />
                            <meshStandardMaterial color="#020617" />
                        </mesh>
                        {/* Top Handle */}
                        <mesh position={[0, 0.28, 0]}>
                            <boxGeometry args={[0.08, 0.14, 0.5]} />
                            <meshStandardMaterial color="#475569" />
                        </mesh>
                        {/* Tally Light (Red Recording Indicator) */}
                        <mesh position={[0, 0.25, -0.3]}>
                            <sphereGeometry args={[0.045, 8, 8]} />
                            <meshStandardMaterial
                                color="#ef4444"
                                emissive="#ef4444"
                                emissiveIntensity={isRehearsing ? 2.5 : 0.4}
                            />
                        </mesh>

                        {/* LIVE ON-CAMERA VIEWFINDER DISPLAY ("What the Camera Sees") */}
                        <group position={[0.26, 0.1, 0.1]} rotation={[0, -0.3, 0]}>
                            {/* Monitor frame */}
                            <mesh>
                                <boxGeometry args={[0.4, 0.28, 0.04]} />
                                <meshStandardMaterial color="#0f172a" metalness={0.8} />
                            </mesh>
                            {/* Viewfinder screen face */}
                            <mesh position={[0, 0, 0.022]}>
                                <planeGeometry args={[0.36, 0.24]} />
                                <meshBasicMaterial color="#0284c7" />
                            </mesh>
                            <Text position={[0, 0, 0.025]} fontSize={0.035} color="#ffffff">
                                {isRehearsing ? '● REC [35mm]' : 'STANDBY [35mm]'}
                            </Text>
                        </group>
                    </group>
                </group>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 6. VIDEO VILLAGE: PRODUCTION MONITOR & 3D CLAPPERBOARD          */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group position={[-6.0, 0, 4.5]}>
                {/* Director's High Canvas Chair */}
                <group position={[1.2, 0, 0.5]} rotation={[0, 0.3, 0]}>
                    <mesh position={[0, 0.45, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
                        <meshStandardMaterial color="#334155" />
                    </mesh>
                    <mesh position={[0, 0.9, 0]}>
                        <boxGeometry args={[0.7, 0.06, 0.65]} />
                        <meshStandardMaterial color="#991b1b" roughness={0.7} />
                    </mesh>
                    <mesh position={[0, 1.55, -0.28]}>
                        <boxGeometry args={[0.65, 0.32, 0.04]} />
                        <meshStandardMaterial color="#991b1b" roughness={0.7} />
                    </mesh>
                    <Text position={[0, 1.55, -0.25]} fontSize={0.1} color="#ffffff" letterSpacing={0.1}>
                        DIRECTOR
                    </Text>
                </group>

                {/* Video Village Console Cart */}
                <group position={[-0.4, 0, 0]}>
                    <mesh position={[0, 0.65, 0]} castShadow>
                        <boxGeometry args={[1.4, 1.2, 0.7]} />
                        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
                    </mesh>

                    {/* 24" Primary Production Monitor */}
                    <mesh position={[0, 1.5, 0]} rotation={[-0.1, 0, 0]} castShadow>
                        <boxGeometry args={[1.3, 0.8, 0.08]} />
                        <meshStandardMaterial color="#0b0f19" metalness={0.85} roughness={0.3} />
                    </mesh>
                    {/* Live Stage Framing Feed on Director Monitor */}
                    <mesh position={[0, 1.5, 0.045]} rotation={[-0.1, 0, 0]}>
                        <planeGeometry args={[1.2, 0.7]} />
                        <meshBasicMaterial color="#0f172a" />
                    </mesh>
                    {/* Anamorphic Reticle Frame */}
                    <mesh position={[0, 1.5, 0.048]} rotation={[-0.1, 0, 0]}>
                        <planeGeometry args={[1.1, 0.58]} />
                        <meshBasicMaterial color="#38bdf8" wireframe />
                    </mesh>
                    <Text position={[0, 1.76, 0.05]} rotation={[-0.1, 0, 0]} fontSize={0.05} color="#38bdf8">
                        STAGE 4 • CAMERA A DOLLY [VIEWFINDER FEED]
                    </Text>
                    <Text position={[0, 1.3, 0.05]} rotation={[-0.1, 0, 0]} fontSize={0.08} color={isRehearsing ? '#ef4444' : '#10b981'}>
                        {isRehearsing ? '● ACTION / RECORDING TAKE 1' : 'READY • SHOT 01'}
                    </Text>

                    {/* 3D DIRECTOR'S SLATE CLIPBOARD */}
                    <group
                        position={[-0.35, 1.32, 0.15]}
                        rotation={[-0.2, -0.3, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpenSlate?.();
                        }}
                        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                    >
                        <mesh castShadow>
                            <boxGeometry args={[0.34, 0.26, 0.02]} />
                            <meshStandardMaterial color="#0f172a" />
                        </mesh>
                        <mesh position={[0, 0, 0.012]}>
                            <planeGeometry args={[0.31, 0.23]} />
                            <meshBasicMaterial color="#f8fafc" />
                        </mesh>
                        <Text position={[0, 0.04, 0.015]} fontSize={0.03} color="#0f172a">
                            📋 PRODUCTION BRIEF
                        </Text>
                        <Text position={[0, -0.04, 0.015]} fontSize={0.024} color="#e11d48">
                            CLICK TO CONFIGURE
                        </Text>
                    </group>

                    {/* INTERACTIVE 3D CLAPPERBOARD ("CALL ACTION!") */}
                    <group
                        position={[0.35, 1.32, 0.15]}
                        rotation={[-0.2, 0.3, 0]}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsRehearsing(prev => !prev);
                        }}
                        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                    >
                        {/* Clapperboard Slate Body */}
                        <mesh castShadow>
                            <boxGeometry args={[0.35, 0.26, 0.025]} />
                            <meshStandardMaterial color="#0f172a" />
                        </mesh>
                        {/* Hinged Clapper Stick */}
                        <mesh position={[0, 0.13, 0]} rotation={[0, 0, isRehearsing ? 0 : 0.4]}>
                            <boxGeometry args={[0.35, 0.05, 0.03]} />
                            <meshStandardMaterial color="#f8fafc" />
                        </mesh>
                        <Text position={[0, 0.02, 0.016]} fontSize={0.036} color={isRehearsing ? '#ef4444' : '#facc15'}>
                            {isRehearsing ? '⏹️ CUT (REHEARSING)' : '🎬 CALL ACTION'}
                        </Text>
                    </group>
                </group>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 7. IN-WORLD PORTAL DOOR: ➔ TO THE GRAND CINEMA                  */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[38.0, 2.2, -3]}
                rotation={[0, -Math.PI / 2, 0]}
                onClick={() => onDimensionSwap?.('cinema')}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; }}
            >
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[4.0, 4.4, 0.4]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                <mesh position={[-0.95, -0.1, 0.05]}>
                    <boxGeometry args={[1.8, 4.0, 0.1]} />
                    <meshStandardMaterial color="#4c0519" roughness={0.6} />
                </mesh>
                <mesh position={[0.95, -0.1, 0.05]}>
                    <boxGeometry args={[1.8, 4.0, 0.1]} />
                    <meshStandardMaterial color="#4c0519" roughness={0.6} />
                </mesh>
                <mesh position={[0, 2.5, 0.2]}>
                    <boxGeometry args={[4.6, 0.8, 0.15]} />
                    <meshStandardMaterial color="#020617" emissive="#f43f5e" emissiveIntensity={0.6} />
                </mesh>
                <Text position={[0, 2.5, 0.3]} fontSize={0.3} color="#ffffff" letterSpacing={0.1}>
                    ➔ TO THE GRAND CINEMA (DAILIES)
                </Text>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 8. CREW AVATARS & STATIONS                                      */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <CrewAvatars
                onSelectCrew={onSelectCrew}
                activeRole={activeCrewRole}
            />
        </group>
    );
};

export default SoundstageWorld;
