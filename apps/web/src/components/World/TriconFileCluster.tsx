import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export interface TriconItem {
    id: string;
    name: string;
    path: string;
    kind: 'file' | 'directory';
    type?: string; // 'code' | 'doc' | 'media' | 'config' | 'archive' | 'folder'
    size?: string;
    position: [number, number, number];
}

interface TriconProps {
    item: TriconItem;
    onSelect?: (item: TriconItem) => void;
}

const TRICON_THEMES: Record<string, { color: string; glyph: string; label: string }> = {
    code: { color: '#06b6d4', glyph: '∴', label: 'CODE' },
    doc: { color: '#eab308', glyph: '✧', label: 'DOC' },
    media: { color: '#ec4899', glyph: '∿', label: 'MEDIA' },
    config: { color: '#10b981', glyph: '⚙️', label: 'CONFIG' },
    archive: { color: '#a855f7', glyph: '📦', label: 'ARCHIVE' },
    folder: { color: '#38bdf8', glyph: '📁', label: 'DIR' },
    unknown: { color: '#94a3b8', glyph: '📄', label: 'FILE' }
};

export const Tricon: React.FC<TriconProps> = ({ item, onSelect }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const [isHovered, setIsHovered] = useState(false);

    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    let category = item.type || 'unknown';
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'sh', 'c', 'cpp'].includes(ext)) category = 'code';
    else if (['md', 'txt', 'pdf', 'doc', 'json'].includes(ext)) category = 'doc';
    else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'wav', 'mp3'].includes(ext)) category = 'media';
    else if (['tar', 'gz', 'zip', 'iso', 'deb'].includes(ext)) category = 'archive';
    else if (['env', 'yaml', 'toml', 'cfg', 'conf'].includes(ext)) category = 'config';

    const theme = TRICON_THEMES[category] || TRICON_THEMES.unknown;

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Gentle hovering levitation
            meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2.0 + item.position[0]) * 0.08;
            meshRef.current.rotation.y += (isHovered ? 0.04 : 0.015);
        }
        if (ringRef.current) {
            ringRef.current.rotation.z -= 0.01;
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation();
        onSelect?.(item);
        window.dispatchEvent(new CustomEvent('myos:open-file', { detail: item }));
    };

    return (
        <group
            position={item.position}
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
            onPointerOut={() => setIsHovered(false)}
        >
            {/* Ground Runic Pedestal Disc */}
            <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh ref={ringRef}>
                    <ringGeometry args={[0.35, 0.45, 3]} />
                    <meshBasicMaterial
                        color={theme.color}
                        transparent
                        opacity={isHovered ? 0.95 : 0.45}
                        side={THREE.DoubleSide}
                    />
                </mesh>
                <mesh>
                    <circleGeometry args={[0.32, 16]} />
                    <meshBasicMaterial color="#020617" transparent opacity={0.7} />
                </mesh>
            </group>

            {/* 3D Extruded Triangular Prism (The "Tri-con") */}
            <mesh ref={meshRef} position={[0, 0.5, 0]}>
                {/* Cylinder with 3 radial segments = Perfect Triangular Prism! */}
                <cylinderGeometry args={[0.32, 0.32, 0.45, 3]} />
                <meshStandardMaterial
                    color={theme.color}
                    emissive={theme.color}
                    emissiveIntensity={isHovered ? 0.55 : 0.25}
                    metalness={0.7}
                    roughness={0.2}
                    transparent
                    opacity={0.92}
                />
            </mesh>

            {/* Floating 3D Badge */}
            <Html
                position={[0, 1.15, 0]}
                center
                distanceFactor={11}
                style={{ pointerEvents: 'none' }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        background: 'rgba(2, 6, 23, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${theme.color}${isHovered ? 'cc' : '55'}`,
                        color: theme.color,
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 0 ${isHovered ? '14px' : '6px'} ${theme.color}44`,
                        textShadow: `0 0 6px ${theme.color}88`,
                        transform: `scale(${isHovered ? 1.08 : 1.0})`,
                        transition: 'all 0.15s ease-out'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{theme.glyph}</span>
                        <span>{item.name}</span>
                    </div>
                    {item.size && (
                        <span style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 'normal' }}>
                            {item.size} • {theme.label}
                        </span>
                    )}
                </div>
            </Html>
        </group>
    );
};

interface TriconFileClusterProps {
    items: TriconItem[];
    onSelectItem?: (item: TriconItem) => void;
}

export const TriconFileCluster: React.FC<TriconFileClusterProps> = ({ items, onSelectItem }) => {
    return (
        <group name="tricon-file-cluster">
            {items.map(item => (
                <Tricon key={item.id} item={item} onSelect={onSelectItem} />
            ))}
        </group>
    );
};
