import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { DesktopFile } from '../../hooks/useDesktopFiles';
import { PrismaticTricon } from './PrismaticTricon';
import { CartridgeLockManager } from '../../engine/CartridgeLockManager';

interface DesktopItemNodeProps {
    file: DesktopFile;
    position: [number, number, number];
    onNavigate?: (path: string) => void;
    onDimensionSwap?: (dim: string) => void;
    onOpenPrism?: (file: DesktopFile) => void;
}

/**
 * 7-Spectrum + Shades File Color Resolver
 */
function getFileColor(file: DesktopFile): string {
    const ext = (file.extension || file.name.slice(file.name.lastIndexOf('.'))).toLowerCase();
    
    // 1. Text & Code Spectrum (BLUE SHADES)
    if (['.txt', '.log'].includes(ext)) return '#0066ff'; // Bluest Blue
    if (['.md', '.markdown', '.rst'].includes(ext)) return '#3399ff'; // Sky Blue
    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) return '#00d4ff'; // Electric Cyan
    if (['.py', '.pyw'].includes(ext)) return '#02569b'; // Deep Navy Blue
    if (['.html', '.htm', '.css', '.scss', '.sass'].includes(ext)) return '#5c6bc0'; // Indigo Blue
    if (['.json', '.yaml', '.yml', '.xml', '.toml'].includes(ext)) return '#29b6f6'; // Light Blue
    if (['.cpp', '.c', '.h', '.cs', '.java', '.go', '.rs'].includes(ext)) return '#1e88e5'; // Royal Blue

    // 2. Media Spectrum (VIOLET / PURPLE / INDIGO SHADES)
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext)) return '#ab47bc'; // Bright Violet
    if (['.mp4', '.mkv', '.mov', '.avi', '.webm', '.flv'].includes(ext)) return '#673ab7'; // Deep Violet
    if (['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'].includes(ext)) return '#e040fb'; // Neon Purple

    // 3. Executables & Scripts Spectrum (RED / ORANGE SHADES)
    if (['.exe', '.msi'].includes(ext)) return '#ff1744'; // Crimson Red
    if (['.bat', '.ps1', '.sh', '.cmd', '.vbs'].includes(ext)) return '#ff5722'; // Deep Orange
    if (['.dll', '.sys', '.so'].includes(ext)) return '#d50000'; // Dark Red

    // 4. Data & Spreadsheet Spectrum (GREEN SHADES)
    if (['.csv', '.xlsx', '.xls', '.ods'].includes(ext)) return '#00e676'; // Bright Emerald Green
    if (['.db', '.sqlite', '.sql', '.db3'].includes(ext)) return '#2e7d32'; // Forest Green

    // 5. Archives & Packages Spectrum (YELLOW / AMBER SHADES)
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.iso'].includes(ext)) return '#ffc107'; // Amber Gold

    // 6. Documents & Presentations Spectrum (CORAL / PINK / MAGENTA SHADES)
    if (['.pdf'].includes(ext)) return '#ff4081'; // Hot Pink / Magenta
    if (['.doc', '.docx', '.ppt', '.pptx'].includes(ext)) return '#ff7043'; // Coral

    // 7. Default / Unknown (MONOCHROME & METALLIC)
    return '#cfd8dc'; // Platinum Silver / Light Grey
}

/**
 * Animated Door Billboard for Directories
 * Uses a 5x2 sprite sheet (`door_exit.png`).
 * Starts open at frame 9, cycles backward to frame 0 upon traversal click.
 */
const DoorFolderNode: React.FC<{
    file: DesktopFile;
    position: [number, number, number];
    onNavigate?: (path: string) => void;
}> = ({ file, position, onNavigate }) => {
    const [hovered, setHovered] = useState(false);
    const [frame, setFrame] = useState(0); // Default: Closed Door
    const [animPhase, setAnimPhase] = useState<'opening' | 'closing' | null>(null);
    
    // Load door sprite texture
    const texture = useTexture('/textures/objects/door_exit.png');

    // Clone & configure texture for sprite sheet math
    const doorTexture = useMemo(() => {
        const tex = texture.clone();
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1 / 5, 1 / 2); // 5 cols, 2 rows
        return tex;
    }, [texture]);

    // Update texture offset whenever frame changes
    useEffect(() => {
        const col = frame % 5;
        const row = Math.floor(frame / 5);
        doorTexture.offset.set(col / 5, (1 - row) * 0.5);
        doorTexture.needsUpdate = true;
    }, [frame, doorTexture]);

    // Open then Close animation loop when clicked
    useEffect(() => {
        if (!animPhase) return;

        const interval = setInterval(() => {
            if (animPhase === 'opening') {
                setFrame(prev => {
                    if (prev >= 9) {
                        setAnimPhase('closing');
                        return 9;
                    }
                    return prev + 1;
                });
            } else if (animPhase === 'closing') {
                setFrame(prev => {
                    if (prev <= 0) {
                        clearInterval(interval);
                        setAnimPhase(null);
                        if (onNavigate) onNavigate(file.path);
                        return 0;
                    }
                    return prev - 1;
                });
            }
        }, 45); // 45ms per frame (~0.8s total open-close traversal sequence)

        return () => clearInterval(interval);
    }, [animPhase, file.path, onNavigate]);

    const lastClickRef = useRef<number>(0);
    const handleClick = (e: any) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastClickRef.current < 500) return;
        lastClickRef.current = now;

        if (onNavigate) {
            onNavigate(file.path);
        }
        if (!animPhase) {
            setAnimPhase('opening');
        }
    };

    return (
        <group position={position}>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <mesh
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
                    onClick={handleClick}
                    scale={animPhase ? [1.15, 1.15, 1] : (hovered ? [1.1, 1.1, 1] : [1, 1, 1])}
                >
                    <planeGeometry args={[2.0, 3.2]} />
                    <meshStandardMaterial
                        map={doorTexture}
                        transparent
                        alphaTest={0.05}
                        roughness={0.2}
                        metalness={0.1}
                        emissive={hovered ? '#00f0ff' : '#000000'}
                        emissiveIntensity={hovered ? 0.3 : 0}
                    />
                </mesh>

                {/* Directory Name Label */}
                <Text
                    position={[0, 1.9, 0.05]}
                    fontSize={0.28}
                    color={hovered ? '#00ffff' : '#ffffff'}
                    anchorX="center"
                    anchorY="middle"
                    maxWidth={3.0}
                    textAlign="center"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                >
                    {file.name}
                </Text>
            </Billboard>
        </group>
    );
};

/**
 * 3D Polyhedron Node for Files
 * Geometry depends on File Size:
 * - < 1 KB: Tetrahedron
 * - < 1 MB: Box (Cube)
 * - < 50 MB: Octahedron
 * - < 500 MB: Dodecahedron
 * - >= 500 MB: Icosahedron
 */
const FilePolyhedronNode: React.FC<{
    file: DesktopFile;
    position: [number, number, number];
    onDimensionSwap?: (dim: string) => void;
}> = ({ file, position, onDimensionSwap }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const isGameCartridge = useMemo(() => {
        const nameLower = file.name.toLowerCase();
        const targetLower = (file.target || '').toLowerCase();
        if (nameLower.includes('printer panic') || targetLower.includes('printer_panic') || targetLower.includes('printer-panic')) return 'printer_panic';
        if (nameLower.includes('glyphrider') || targetLower.includes('glyphrider')) return 'glyphrider';
        if (nameLower.includes('b-movie') || targetLower.includes('b-movie')) return 'b_movie_beatdown';
        if (nameLower.includes('combat lab') || targetLower.includes('combat_lab')) return 'combat_lab';
        return null;
    }, [file.name, file.target]);

    const sizeBytes = file.size ?? 1024;
    const baseColor = isGameCartridge ? '#00f0ff' : getFileColor(file);

    // Select geometry based on physical byte size or game cartridge status
    const geometry = useMemo(() => {
        if (isGameCartridge) return new THREE.TorusGeometry(0.65, 0.22, 16, 32);
        if (sizeBytes < 1024) return new THREE.TetrahedronGeometry(0.7);
        if (sizeBytes < 1024 * 1024) return new THREE.BoxGeometry(1.0, 1.0, 1.0);
        if (sizeBytes < 50 * 1024 * 1024) return new THREE.OctahedronGeometry(0.8);
        if (sizeBytes < 500 * 1024 * 1024) return new THREE.DodecahedronGeometry(0.85);
        return new THREE.IcosahedronGeometry(0.9);
    }, [sizeBytes, isGameCartridge]);

    // Continuous slow rotation
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * (isGameCartridge ? 1.4 : 0.8);
            meshRef.current.rotation.x += delta * 0.3;
            meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
        }
    });

    const lastClickRef = useRef<number>(0);
    const handleClick = async (e: any) => {
        e.stopPropagation();
        const now = Date.now();
        if (now - lastClickRef.current < 500) return;
        lastClickRef.current = now;

        const isLnk = file.name.toLowerCase().endsWith('.lnk') || (file.extension || '').toLowerCase() === '.lnk';
        const targetToLaunch = (isLnk && file.path) ? file.path : (file.target || file.path);
        console.log(`[FilePolyhedronNode] Clicked: "${file.name}" -> Target: "${targetToLaunch}"`);

        // 1. Direct Dimension Swap for MyOS Games / Cartridges
        if (isGameCartridge) {
            console.log(`[DesktopItemNode] Direct dimension swap to: ${isGameCartridge}`);
            CartridgeLockManager.lockCartridge(isGameCartridge, file.name);
            if (onDimensionSwap) onDimensionSwap(isGameCartridge);
            window.dispatchEvent(new CustomEvent('myos_dimension_swap', { detail: isGameCartridge }));
            return;
        }

        // 2. Direct Web URL Launch
        if (targetToLaunch.startsWith('http://') || targetToLaunch.startsWith('https://')) {
            window.open(targetToLaunch, '_blank');
            return;
        }

        // 3. Local Windows App/File Launcher via Agent Bridge
        try {
            const endpoints = ['/api/win/launch', 'http://localhost:8081/api/win/launch'];
            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target: targetToLaunch })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.error) {
                            console.warn('[FilePolyhedronNode] Launch warning/error:', data.error);
                        }
                        return;
                    }
                } catch (_) {}
            }
        } catch (err) {
            console.error('[FilePolyhedronNode] Failed to launch:', err);
        }
    };

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                geometry={geometry}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
                onClick={handleClick}
                scale={hovered ? 1.25 : 1.0}
            >
                <meshStandardMaterial
                    color={baseColor}
                    roughness={isGameCartridge ? 0.1 : 0.2}
                    metalness={isGameCartridge ? 0.8 : 0.6}
                    wireframe={hovered}
                    emissive={baseColor}
                    emissiveIntensity={hovered ? 0.8 : (isGameCartridge ? 0.4 : 0.1)}
                />
            </mesh>

            {/* Floating File / Cartridge Label */}
            <Text
                position={[0, 1.2, 0.1]}
                fontSize={0.24}
                color={hovered ? '#00ffff' : (isGameCartridge ? '#38bdf8' : '#ffffff')}
                anchorX="center"
                anchorY="middle"
                maxWidth={2.8}
                textAlign="center"
                outlineWidth={0.03}
                outlineColor="#000000"
                onClick={handleClick}
            >
                {isGameCartridge ? `[GAME] ${file.name}` : file.name}
            </Text>
        </group>
    );
};

export const DesktopItemNode: React.FC<DesktopItemNodeProps> = ({ file, position, onNavigate, onDimensionSwap, onOpenPrism }) => {
    if (file.isDirectory) {
        return <PrismaticTricon file={file} position={position} onOpenPrism={onOpenPrism} onNavigate={onNavigate} />;
    }
    return <FilePolyhedronNode file={file} position={position} onDimensionSwap={onDimensionSwap} />;
};
