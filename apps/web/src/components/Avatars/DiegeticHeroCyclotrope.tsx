import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, Ring } from '@react-three/drei';
import * as THREE from 'three';

export interface CyclotropeItem {
    id: string;
    label: string;
    icon?: string;
    sublabel?: string;
    color?: string;
}

interface DiegeticHeroCyclotropeProps {
    items: CyclotropeItem[];
    selectedIndex: number;
    onSelectIndex: (index: number) => void;
    radius?: number;
    color?: string;
    ringLabel?: string;
    yOffset?: number;
    isActiveRing?: boolean;
}

const CyclotropeCard: React.FC<{
    item: CyclotropeItem;
    index: number;
    total: number;
    radius: number;
    groupRef: React.RefObject<THREE.Group | null>;
    isSelected: boolean;
    isActiveRing: boolean;
    activeColor: string;
    onSelect: () => void;
}> = ({ item, index, total, radius, groupRef, isSelected, isActiveRing, activeColor, onSelect }) => {
    const textRef = useRef<any>(null);
    const subtextRef = useRef<any>(null);
    const iconRef = useRef<any>(null);
    const badgeMeshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // baseAngle: 0 is front-center (+Z facing camera at +Z)
    const baseAngle = (index / total) * Math.PI * 2;

    useFrame(() => {
        if (!groupRef.current) return;
        const currentGroupRot = groupRef.current.rotation.y;
        let worldAngle = (baseAngle + currentGroupRot) % (Math.PI * 2);
        if (worldAngle > Math.PI) worldAngle -= Math.PI * 2;
        if (worldAngle < -Math.PI) worldAngle += Math.PI * 2;

        const distance = Math.abs(worldAngle);
        // Generous fade threshold so side options remain visible in peripheral arc
        const fadeThreshold = Math.PI * 0.55;

        let opacity = 0;
        if (distance < fadeThreshold) {
            opacity = 1.0 - (distance / fadeThreshold);
            opacity = Math.pow(opacity, 1.2);
        }

        const effectiveOpacity = isActiveRing ? opacity : opacity * 0.35;

        if (textRef.current) textRef.current.fillOpacity = effectiveOpacity;
        if (subtextRef.current) subtextRef.current.fillOpacity = effectiveOpacity * 0.85;
        if (iconRef.current) iconRef.current.fillOpacity = effectiveOpacity;
        if (badgeMeshRef.current && (badgeMeshRef.current.material as THREE.MeshBasicMaterial)) {
            (badgeMeshRef.current.material as THREE.MeshBasicMaterial).opacity = effectiveOpacity * (isSelected ? 0.85 : 0.55);
        }
    });

    const itemColor = item.color || activeColor;

    return (
        <group
            // +cos(baseAngle) places baseAngle=0 at +Z (facing user's camera in front)
            position={[
                Math.sin(baseAngle) * (isSelected ? radius + 0.12 : radius),
                isSelected ? 0.06 : 0,
                Math.cos(baseAngle) * (isSelected ? radius + 0.12 : radius)
            ]}
            scale={isSelected ? 1.2 : (hovered ? 1.05 : 0.92)}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                {/* Background Plaque */}
                <mesh ref={badgeMeshRef} position={[0, 0, -0.02]}>
                    <planeGeometry args={[0.9, 0.45]} />
                    <meshBasicMaterial 
                        color={isSelected ? itemColor : '#0a0a14'} 
                        transparent 
                        opacity={0.6} 
                        side={THREE.DoubleSide} 
                    />
                </mesh>

                {/* Outer Glow Border when selected / hovered */}
                {(isSelected || hovered) && (
                    <lineSegments position={[0, 0, -0.01]}>
                        <edgesGeometry args={[new THREE.PlaneGeometry(0.92, 0.47)]} />
                        <lineBasicMaterial color={itemColor} linewidth={2} />
                    </lineSegments>
                )}

                {/* Icon */}
                {item.icon && (
                    <Text
                        ref={iconRef}
                        position={[0, 0.08, 0.02]}
                        fontSize={0.16}
                        textAlign="center"
                        fillOpacity={0}
                    >
                        {item.icon}
                    </Text>
                )}

                {/* Label */}
                <Text
                    ref={textRef}
                    position={[0, item.sublabel ? -0.04 : (item.icon ? -0.08 : 0), 0.02]}
                    fontSize={0.09}
                    color={isSelected ? '#ffffff' : itemColor}
                    fontWeight="bold"
                    textAlign="center"
                    maxWidth={0.85}
                    fillOpacity={0}
                >
                    {item.label}
                </Text>

                {/* Sublabel */}
                {item.sublabel && (
                    <Text
                        ref={subtextRef}
                        position={[0, -0.14, 0.02]}
                        fontSize={0.055}
                        color="#aaaaaa"
                        textAlign="center"
                        maxWidth={0.85}
                        fillOpacity={0}
                    >
                        {item.sublabel}
                    </Text>
                )}
            </Billboard>
        </group>
    );
};

export const DiegeticHeroCyclotrope: React.FC<DiegeticHeroCyclotropeProps> = ({
    items,
    selectedIndex,
    onSelectIndex,
    radius = 2.0,
    color = '#00ffcc',
    ringLabel,
    yOffset = 3.8,
    isActiveRing = true
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const total = Math.max(1, items.length);

    // Target rotation based on selectedIndex
    const stepAngle = (Math.PI * 2) / total;
    const targetRotation = -selectedIndex * stepAngle;

    useFrame((_state, delta) => {
        if (!groupRef.current) return;
        // Smooth snappy damping towards target index rotation without spinning out of control
        let diff = targetRotation - groupRef.current.rotation.y;
        
        // Wrap diff to shortest angular path
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        
        groupRef.current.rotation.y += diff * Math.min(1, delta * 14);
    });

    return (
        <group position={[0, yOffset, 0]}>
            {/* Luminous Orbital Halo Ring Above Character's Head */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
                <meshBasicMaterial 
                    color={color} 
                    transparent 
                    opacity={isActiveRing ? 0.7 : 0.2} 
                    side={THREE.DoubleSide} 
                />
            </mesh>

            {/* Ring Category Header floating above ring */}
            {ringLabel && (
                <Billboard position={[0, 0.45, 0]} follow>
                    <Text
                        fontSize={0.16}
                        color={color}
                        fontWeight="bold"
                        fillOpacity={isActiveRing ? 1.0 : 0.3}
                    >
                        {ringLabel}
                    </Text>
                </Billboard>
            )}

            {/* Orbiting Items Wheel */}
            <group ref={groupRef}>
                {items.map((item, idx) => (
                    <CyclotropeCard
                        key={item.id}
                        item={item}
                        index={idx}
                        total={total}
                        radius={radius}
                        groupRef={groupRef}
                        isSelected={idx === selectedIndex}
                        isActiveRing={isActiveRing}
                        activeColor={color}
                        onSelect={() => onSelectIndex(idx)}
                    />
                ))}
            </group>
        </group>
    );
};
