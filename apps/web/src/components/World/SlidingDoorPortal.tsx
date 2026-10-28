import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface SlidingDoorPortalProps {
    id: string;
    name: string;
    path: string;
    itemCount?: number;
    position: [number, number, number];
    rotationY?: number;
    color?: string;
    onEnter?: (path: string) => void;
}

export const SlidingDoorPortal: React.FC<SlidingDoorPortalProps> = ({
    id,
    name,
    path,
    itemCount = 0,
    position,
    rotationY = 0,
    color = '#06b6d4',
    onEnter
}) => {
    const leftDoorRef = useRef<THREE.Mesh>(null);
    const rightDoorRef = useRef<THREE.Mesh>(null);
    const glowBeamRef = useRef<THREE.Mesh>(null);
    const { camera } = useThree();

    const [isOpen, setIsOpen] = useState(false);
    const [openProgress, setOpenProgress] = useState(0);

    const doorWidth = 0.95;
    const doorHeight = 2.4;
    const doorDepth = 0.12;

    useFrame((_, delta) => {
        // Detect camera/player proximity (within 3.8m opens automatically)
        const camPos = camera.position;
        const dist = Math.hypot(camPos.x - position[0], camPos.z - position[2]);
        const shouldBeOpen = dist < 3.8;

        if (shouldBeOpen !== isOpen) {
            setIsOpen(shouldBeOpen);
        }

        // Smooth door slide interpolation
        const targetProgress = isOpen ? 1.0 : 0.0;
        const newProgress = THREE.MathUtils.lerp(openProgress, targetProgress, delta * 5.0);
        setOpenProgress(newProgress);

        if (leftDoorRef.current && rightDoorRef.current) {
            // Left door slides left (-X), right door slides right (+X)
            const slideOffset = newProgress * 0.85;
            leftDoorRef.current.position.x = -doorWidth / 2 - slideOffset;
            rightDoorRef.current.position.x = doorWidth / 2 + slideOffset;
        }

        if (glowBeamRef.current) {
            (glowBeamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + newProgress * 0.35;
        }
    });

    const handleDoorClick = (e: any) => {
        e.stopPropagation();
        onEnter?.(path);
        window.dispatchEvent(new CustomEvent('myos:navigate-dir', { detail: path }));
    };

    return (
        <group position={position} rotation={[0, rotationY, 0]} onClick={handleDoorClick}>
            {/* Outer Cybernetic Door Frame */}
            <mesh position={[0, doorHeight / 2 + 0.1, 0]}>
                <boxGeometry args={[doorWidth * 2 + 0.3, 0.2, doorDepth * 1.5]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[-doorWidth - 0.1, doorHeight / 2, 0]}>
                <boxGeometry args={[0.2, doorHeight + 0.2, doorDepth * 1.5]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[doorWidth + 0.1, doorHeight / 2, 0]}>
                <boxGeometry args={[0.2, doorHeight + 0.2, doorDepth * 1.5]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Threshold Floor Plate */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[doorWidth * 2 + 0.2, 1.2]} />
                <meshBasicMaterial color="#020617" transparent opacity={0.8} />
            </mesh>

            {/* Glowing Threshold Light Line */}
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[doorWidth * 2, 0.08]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>

            {/* Left Sliding Door Leaf */}
            <mesh ref={leftDoorRef} position={[-doorWidth / 2, doorHeight / 2, 0]}>
                <boxGeometry args={[doorWidth, doorHeight, doorDepth]} />
                <meshStandardMaterial
                    color="#1e293b"
                    metalness={0.85}
                    roughness={0.25}
                    emissive={color}
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Right Sliding Door Leaf */}
            <mesh ref={rightDoorRef} position={[doorWidth / 2, doorHeight / 2, 0]}>
                <boxGeometry args={[doorWidth, doorHeight, doorDepth]} />
                <meshStandardMaterial
                    color="#1e293b"
                    metalness={0.85}
                    roughness={0.25}
                    emissive={color}
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Interior Portal Glow Beam (Visible when door parts open) */}
            <mesh ref={glowBeamRef} position={[0, doorHeight / 2, -0.05]}>
                <planeGeometry args={[doorWidth * 1.8, doorHeight * 0.95]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.2}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 3D Floating Directory Header Signboard */}
            <Html
                position={[0, doorHeight + 0.5, 0]}
                center
                distanceFactor={12}
                style={{ pointerEvents: 'none' }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        background: 'rgba(2, 6, 23, 0.92)',
                        backdropFilter: 'blur(12px)',
                        border: `1px solid ${color}88`,
                        color: color,
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 16px ${color}44`,
                        textShadow: `0 0 8px ${color}99`,
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📁</span>
                        <span>{name.toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 'normal' }}>
                        {itemCount} items • {isOpen ? 'OPEN' : 'APPROACH TO ENTER'}
                    </span>
                </div>
            </Html>
        </group>
    );
};
