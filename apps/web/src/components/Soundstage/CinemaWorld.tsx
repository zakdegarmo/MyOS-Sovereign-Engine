// apps/web/src/components/Soundstage/CinemaWorld.tsx
import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { TheaterScreen } from './TheaterScreen';

export interface CinemaWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
    currentReel?: string;
    isPlaying?: boolean;
    isMuted?: boolean;
    onScreenClick?: () => void;
    onDimensionSwap?: (dim: string) => void;
}

// Velvet Cinema Seat Component
const CinemaSeat: React.FC<{
    position: [number, number, number];
    rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Seat Base Stand (Cast Iron Black) */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Seat Cushion (Deep Plush Crimson Velvet) */}
            <mesh position={[0, 0.48, 0.05]} castShadow receiveShadow>
                <boxGeometry args={[0.65, 0.12, 0.55]} />
                <meshStandardMaterial color="#881337" roughness={0.7} metalness={0.1} />
            </mesh>
            {/* Seat Backrest (Curved Ergonomic Velvet) */}
            <mesh position={[0, 0.92, -0.22]} rotation={[-0.1, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.62, 0.8, 0.12]} />
                <meshStandardMaterial color="#9f1239" roughness={0.65} metalness={0.1} />
            </mesh>
            {/* Left Armrest */}
            <mesh position={[-0.35, 0.7, 0]} castShadow>
                <boxGeometry args={[0.08, 0.06, 0.5]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Right Armrest */}
            <mesh position={[0.35, 0.7, 0]} castShadow>
                <boxGeometry args={[0.08, 0.06, 0.5]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
            </mesh>
        </group>
    );
};

// Art Deco Brass Wall Sconce
const WallSconce: React.FC<{
    position: [number, number, number];
    rotationY?: number;
    dimmed?: boolean;
}> = ({ position, rotationY = 0, dimmed = false }) => {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Brass Bracket */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.12, 0.4, 8]} />
                <meshStandardMaterial color="#ca8a04" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Frosted Glass Shade */}
            <mesh position={[0, 0.25, 0.1]}>
                <cylinderGeometry args={[0.18, 0.1, 0.35, 12]} />
                <meshStandardMaterial
                    color="#fef08a"
                    emissive="#eab308"
                    emissiveIntensity={dimmed ? 0.15 : 0.8}
                    roughness={0.3}
                />
            </mesh>
            {/* Cast Light */}
            <pointLight
                position={[0, 0.3, 0.25]}
                color="#fef08a"
                intensity={dimmed ? 0.3 : 1.4}
                distance={12}
                decay={2}
            />
        </group>
    );
};

export const CinemaWorld: React.FC<CinemaWorldProps> = ({
    isActive = true,
    currentReel = 'crimson_zenith_duel_of_the_sundered_sisterhood.mp4',
    isPlaying = true,
    isMuted = false,
    onScreenClick,
    onDimensionSwap
}) => {
    const screenAmbilightRef = useRef<THREE.PointLight>(null);
    const [isHoveringDoor, setIsHoveringDoor] = useState(false);
    const [isHoveringVault, setIsHoveringVault] = useState(false);

    // Ambilight breathing based on playback
    useFrame(({ clock }) => {
        if (screenAmbilightRef.current) {
            const t = clock.getElapsedTime();
            screenAmbilightRef.current.intensity = isPlaying
                ? 2.2 + Math.sin(t * 3.0) * 0.4 + Math.cos(t * 7.0) * 0.2
                : 0.4;
        }
    });

    if (!isActive) return null;

    // Seating grid configuration (4 tiers, left and right wings)
    const tiers = [
        { z: -2, y: 0.0, rows: 1 },
        { z: 3, y: 0.6, rows: 1 },
        { z: 8, y: 1.2, rows: 1 },
        { z: 13, y: 1.8, rows: 1 },
        { z: 18, y: 2.4, rows: 1 },
    ];
    const leftSeatCols = [-7.5, -6.3, -5.1, -3.9, -2.7];
    const rightSeatCols = [2.7, 3.9, 5.1, 6.3, 7.5];

    return (
        <group name="CinemaWorld">
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 1. CINEMA AUDITORIUM ARCHITECTURE                                */}
            {/* ═════════════════════════════════════════════════════════════════ */}

            {/* Base Floor with Rich Burgundy Acoustic Carpet */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 5]} receiveShadow>
                <planeGeometry args={[36, 50]} />
                <meshStandardMaterial
                    color="#2b0a14"
                    roughness={0.9}
                    metalness={0.05}
                />
            </mesh>

            {/* Center Aisle Gold-Trimmed Carpet Runner */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 5]} receiveShadow>
                <planeGeometry args={[3.2, 50]} />
                <meshStandardMaterial
                    color="#4c0519"
                    roughness={0.8}
                    metalness={0.1}
                />
            </mesh>

            {/* Tiered Seating Risers (Hardwood / Dark Walnut Plinths) */}
            {tiers.map((tier, idx) => (
                <group key={idx} position={[0, tier.y / 2, tier.z + 1.2]}>
                    {/* Left Wing Riser Plinth */}
                    <mesh position={[-5.5, 0, 0]} receiveShadow>
                        <boxGeometry args={[7.5, tier.y + 0.05, 3.2]} />
                        <meshStandardMaterial color="#1c1917" roughness={0.8} />
                    </mesh>
                    {/* Right Wing Riser Plinth */}
                    <mesh position={[5.5, 0, 0]} receiveShadow>
                        <boxGeometry args={[7.5, tier.y + 0.05, 3.2]} />
                        <meshStandardMaterial color="#1c1917" roughness={0.8} />
                    </mesh>
                    {/* Aisle Step LED Strips */}
                    <mesh position={[-1.7, (tier.y / 2) + 0.02, 0]}>
                        <boxGeometry args={[0.08, 0.04, 3.0]} />
                        <meshBasicMaterial color="#fbbf24" />
                    </mesh>
                    <mesh position={[1.7, (tier.y / 2) + 0.02, 0]}>
                        <boxGeometry args={[0.08, 0.04, 3.0]} />
                        <meshBasicMaterial color="#fbbf24" />
                    </mesh>
                </group>
            ))}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 2. PLUSH CINEMA SEATS                                            */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {tiers.map((tier, tIdx) => (
                <group key={`seats-tier-${tIdx}`}>
                    {/* Left Wing Seats */}
                    {leftSeatCols.map((x, cIdx) => (
                        <CinemaSeat
                            key={`l-${tIdx}-${cIdx}`}
                            position={[x, tier.y, tier.z]}
                        />
                    ))}
                    {/* Right Wing Seats */}
                    {rightSeatCols.map((x, cIdx) => (
                        <CinemaSeat
                            key={`r-${tIdx}-${cIdx}`}
                            position={[x, tier.y, tier.z]}
                        />
                    ))}
                </group>
            ))}

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 3. WALLS & ACOUSTIC SOUND PANELS                                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* Front Screen Wall (Proscenium Arch) */}
            <mesh position={[0, 7, -15]} receiveShadow>
                <boxGeometry args={[36, 16, 0.5]} />
                <meshStandardMaterial color="#050508" roughness={0.95} />
            </mesh>

            {/* Left Auditorium Wall */}
            <mesh position={[-16, 7, 5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[50, 16, 0.5]} />
                <meshStandardMaterial color="#0f0710" roughness={0.9} />
            </mesh>
            {/* Right Auditorium Wall */}
            <mesh position={[16, 7, 5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
                <boxGeometry args={[50, 16, 0.5]} />
                <meshStandardMaterial color="#0f0710" roughness={0.9} />
            </mesh>
            {/* Back Projection Wall */}
            <mesh position={[0, 7, 28]} rotation={[0, Math.PI, 0]} receiveShadow>
                <boxGeometry args={[36, 16, 0.5]} />
                <meshStandardMaterial color="#0a050d" roughness={0.95} />
            </mesh>

            {/* Art Deco Wall Sconces (Left & Right Walls) */}
            {[-8, 0, 8, 16].map((z, idx) => (
                <React.Fragment key={`sconces-${idx}`}>
                    <WallSconce
                        position={[-15.6, 5.5, z]}
                        rotationY={Math.PI / 2}
                        dimmed={isPlaying}
                    />
                    <WallSconce
                        position={[15.6, 5.5, z]}
                        rotationY={-Math.PI / 2}
                        dimmed={isPlaying}
                    />
                </React.Fragment>
            ))}

            {/* Ceiling (Dark Acoustic Coffer) */}
            <mesh position={[0, 14, 5]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[36, 50]} />
                <meshStandardMaterial color="#020204" roughness={1.0} />
            </mesh>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 4. GIANT SILVER SCREEN & DYNAMIC PROJECTION GLOW                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* Decorative Velvet Curtain Frame (Top Valance) */}
            <mesh position={[0, 12.8, -14.2]}>
                <boxGeometry args={[22, 1.2, 0.4]} />
                <meshStandardMaterial color="#4c0519" roughness={0.8} />
            </mesh>
            {/* Decorative Velvet Curtain Left Drapery */}
            <mesh position={[-10.8, 6.5, -14.2]}>
                <boxGeometry args={[1.4, 11.5, 0.4]} />
                <meshStandardMaterial color="#4c0519" roughness={0.8} />
            </mesh>
            {/* Decorative Velvet Curtain Right Drapery */}
            <mesh position={[10.8, 6.5, -14.2]}>
                <boxGeometry args={[1.4, 11.5, 0.4]} />
                <meshStandardMaterial color="#4c0519" roughness={0.8} />
            </mesh>

            {/* The Actual Video Surface & Player */}
            <TheaterScreen
                currentReel={currentReel}
                isPlaying={isPlaying}
                isMuted={isMuted}
                position={[0, 6.5, -14.4]}
                scale={[1.25, 1.25, 1]}
                onScreenClick={onScreenClick}
            />

            {/* Dynamic Screen Ambilight (Casts light from screen onto front rows) */}
            <pointLight
                ref={screenAmbilightRef}
                position={[0, 6.0, -10]}
                color="#60a5fa"
                intensity={isPlaying ? 2.5 : 0.5}
                distance={28}
                decay={1.8}
            />

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 5. IN-WORLD PORTAL DOOR: BACK TO FILM SOUNDSTAGE                 */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[-14.5, 1.6, 26]}
                rotation={[0, 0, 0]}
                onClick={() => onDimensionSwap?.('soundstage')}
                onPointerOver={() => setIsHoveringDoor(true)}
                onPointerOut={() => setIsHoveringDoor(false)}
            >
                {/* Door Frame */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[2.2, 3.2, 0.3]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} />
                </mesh>
                {/* Door Surface */}
                <mesh position={[0, 0, 0.05]}>
                    <boxGeometry args={[1.8, 2.9, 0.1]} />
                    <meshStandardMaterial
                        color={isHoveringDoor ? '#38bdf8' : '#0f172a'}
                        roughness={0.3}
                        metalness={0.7}
                    />
                </mesh>
                {/* Illuminated Door Sign */}
                <mesh position={[0, 1.85, 0.15]}>
                    <boxGeometry args={[2.0, 0.45, 0.1]} />
                    <meshStandardMaterial
                        color="#064e3b"
                        emissive="#10b981"
                        emissiveIntensity={isHoveringDoor ? 1.0 : 0.6}
                    />
                </mesh>
                <Text
                    position={[0, 1.85, 0.22]}
                    fontSize={0.16}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    EXIT TO FILM SOUNDSTAGE
                </Text>
            </group>

            {/* ═════════════════════════════════════════════════════════════════ */}
            {/* 6. IN-WORLD 3D PROJECTION KIOSK: FILM VAULT & REEL SELECTION     */}
            {/* ═════════════════════════════════════════════════════════════════ */}
            <group
                position={[14.5, 1.6, 26]}
                rotation={[0, 0, 0]}
                onClick={() => window.dispatchEvent(new CustomEvent('myos:open-cinema-vault'))}
                onPointerOver={() => setIsHoveringVault(true)}
                onPointerOut={() => setIsHoveringVault(false)}
            >
                {/* Console Housing */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[2.2, 3.2, 0.3]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                {/* Holographic Console Screen */}
                <mesh position={[0, 0, 0.05]}>
                    <boxGeometry args={[1.8, 2.9, 0.1]} />
                    <meshStandardMaterial
                        color={isHoveringVault ? '#f43f5e' : '#1e1b4b'}
                        emissive={isHoveringVault ? '#f43f5e' : '#4338ca'}
                        emissiveIntensity={isHoveringVault ? 0.6 : 0.2}
                        roughness={0.2}
                        metalness={0.8}
                    />
                </mesh>
                {/* Illuminated Console Header */}
                <mesh position={[0, 1.85, 0.15]}>
                    <boxGeometry args={[2.0, 0.45, 0.1]} />
                    <meshStandardMaterial
                        color="#881337"
                        emissive="#f43f5e"
                        emissiveIntensity={isHoveringVault ? 1.0 : 0.6}
                    />
                </mesh>
                <Text
                    position={[0, 1.85, 0.22]}
                    fontSize={0.16}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                >
                    FILM VAULT & ARCHIVE
                </Text>
                <Text
                    position={[0, 0.2, 0.12]}
                    fontSize={0.13}
                    color="#fecdd3"
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={1.6}
                    textAlign="center"
                >
                    {isHoveringVault ? '▶ CLICK TO OPEN VAULT & PICK REEL' : 'FILM LIBRARY & LOCAL FILE CHOOSER'}
                </Text>
            </group>
        </group>
    );
};

export default CinemaWorld;
