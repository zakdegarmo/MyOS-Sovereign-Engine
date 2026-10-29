import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { DesktopFile } from '../../hooks/useDesktopFiles';

interface PrismaticTriconProps {
    file: DesktopFile;
    position: [number, number, number];
    childCount?: number;
    onOpenPrism?: (file: DesktopFile) => void;
    onNavigate?: (path: string) => void;
}

/**
 * PrismaticTricon: Micro-Prism 3D geometry representing directories and rootless dimensional portals.
 * Replaces flat billboard doors with glowing, multifaceted 3D time crystals that expand when clicked.
 */
export const PrismaticTricon: React.FC<PrismaticTriconProps> = ({
    file,
    position,
    childCount,
    onOpenPrism,
    onNavigate
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    // Dynamic N-sided polygon: derived from childCount or folder character hash (min 3)
    const polygonSides = useMemo(() => {
        if (childCount && childCount > 0) return Math.max(3, childCount);
        // Deterministic hash based on folder name length/ascii for distinctive crystal shapes
        const hash = file.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return 3 + (hash % 6); // 3 (triangle), 4 (square), 5 (pentagon), 6 (hexagon), 7 (heptagon), 8 (octagon)
    }, [childCount, file.name]);

    // Color theme derived from directory nature
    const prismColor = useMemo(() => {
        const name = file.name.toLowerCase();
        if (name.includes('game') || name.includes('cartridge')) return '#f59e0b';
        if (name.includes('agent') || name.includes('council')) return '#10b981';
        if (name.includes('soundstage') || name.includes('studio') || name.includes('film')) return '#ec4899';
        if (name.includes('doc') || name.includes('note') || name.includes('brain')) return '#8b5cf6';
        if (name.includes('code') || name.includes('src') || name.includes('dev')) return '#06b6d4';
        return '#00f0ff'; // Sovereign Cyan Default
    }, [file.name]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Hover spin & levitation
            const speed = hovered ? 2.8 : 0.9;
            groupRef.current.rotation.y += delta * speed;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.12;

            // Gentle floating breath
            const breath = Math.sin(state.clock.elapsedTime * 2.2 + position[0] * 0.5) * 0.08;
            groupRef.current.position.y = position[1] + breath;

            // Bloom pulse on activation click
            if (isActivating) {
                const s = THREE.MathUtils.lerp(groupRef.current.scale.x, 2.2, delta * 6);
                groupRef.current.scale.set(s, s, s);
            } else {
                const targetScale = hovered ? 1.25 : 1.0;
                const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, delta * 8);
                groupRef.current.scale.set(s, s, s);
            }
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();
        setIsActivating(true);
        setTimeout(() => {
            setIsActivating(false);
            if (onOpenPrism) {
                onOpenPrism(file);
            } else if (onNavigate) {
                onNavigate(file.path);
            }
        }, 320);
    };

    return (
        <group ref={groupRef} position={position}>
            {/* 1. Micro Decagonal Prism Outer Facets */}
            <mesh
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
                onClick={handleClick}
            >
                <cylinderGeometry args={[0.75, 0.75, 1.2, polygonSides, 1, true]} />
                <meshStandardMaterial
                    color={prismColor}
                    wireframe={!hovered}
                    transparent
                    opacity={hovered ? 0.9 : 0.65}
                    roughness={0.15}
                    metalness={0.8}
                    emissive={prismColor}
                    emissiveIntensity={hovered ? 0.8 : 0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* 2. Top & Bottom Energy Manifold Rings */}
            <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.65, 0.85, Math.max(polygonSides * 2, 16)]} />
                <meshBasicMaterial color={prismColor} transparent opacity={hovered ? 0.95 : 0.5} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.65, 0.85, Math.max(polygonSides * 2, 16)]} />
                <meshBasicMaterial color={prismColor} transparent opacity={hovered ? 0.95 : 0.5} side={THREE.DoubleSide} />
            </mesh>

            {/* 3. Glowing Time-Crystal Core (Octahedron) */}
            <mesh position={[0, 0, 0]}>
                <octahedronGeometry args={[0.35]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive={prismColor}
                    emissiveIntensity={hovered ? 1.5 : 0.8}
                    roughness={0.1}
                    metalness={0.9}
                />
            </mesh>

            {/* 4. Directional Sparkle Point Light */}
            <pointLight position={[0, 0, 0]} intensity={hovered ? 3.5 : 1.2} distance={3.0} color={prismColor} />

            {/* 5. Billboard Label */}
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <Text
                    position={[0, 1.3, 0]}
                    fontSize={0.26}
                    color={hovered ? '#00ffff' : '#ffffff'}
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={3.0}
                    textAlign="center"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                >
                    {`⬡ ${file.name}`}
                </Text>
                <Text
                    position={[0, 0.98, 0]}
                    fontSize={0.15}
                    color="#94a3b8"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.02}
                    outlineColor="#000000"
                >
                    [ PRISMATIC PORTAL ]
                </Text>
            </Billboard>
        </group>
    );
};
