import React, { useMemo } from 'react';
import { useDesktopFiles } from '../../hooks/useDesktopFiles';
import { DesktopItemNode } from './DesktopItemNode';
import { PrismaticTricon } from './PrismaticTricon';
import type { DesktopFile } from '../../hooks/useDesktopFiles';
import { Environment, Text } from '@react-three/drei';


const REALMS_GATEWAY_FILE: DesktopFile = {
    name: 'The 10 Sovereign Realms',
    path: 'realms',
    isDirectory: true,
    isShortcut: true,
    target: 'realms'
};

interface DesktopDimensionProps {
    onDimensionSwap?: (dim: string) => void;
    onOpenPrismForFile?: (file: any) => void;
}

export const DesktopDimension: React.FC<DesktopDimensionProps> = ({ onDimensionSwap, onOpenPrismForFile }) => {
    const { files, isLoading, navigateTo, goBack, canGoBack, currentPath } = useDesktopFiles();

    // Map the 2D file array onto a stationary 3D grid layout.
    // The user requested Top-Left = Back-Left, Bottom-Right = Front-Right.
    // In Three.js: -Z is Forward (Back of scene), +X is Right.
    // So Top-Left (Row 0, Col 0) -> X: -Width, Z: -Depth
    const mappedFiles = useMemo(() => {
        if (!Array.isArray(files)) return [];
        
        const sortedFiles = [...files].sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        // Grid config
        const columns = 6;
        const spacingX = 6;
        const spacingZ = 6;
        const originX = -((columns - 1) * spacingX) / 2; // Center horizontally
        const originZ = -10; // Start a bit back from the camera

        return sortedFiles.map((file, index) => {
            const row = Math.floor(index / columns);
            const col = index % columns;

            // X goes from left (-X) to right (+X)
            const posX = originX + col * spacingX;
            // Z goes from back (-Z, which is top of screen) to front (+Z, bottom of screen)
            const posZ = originZ + row * spacingZ;
            const posY = 1.1; // Floating above the floor slightly

            return { file, position: [posX, posY, posZ] as [number, number, number] };
        });
    }, [files]);

    return (
        <group name="desktop-dimension">
            {/* Studio Environment Map for realistic metallic and PBR reflections on avatars & items */}
            <Environment preset="city" environmentIntensity={0.85} />

            <ambientLight intensity={1.2} />
            <hemisphereLight skyColor="#ffffff" groundColor="#334155" intensity={0.9} />
            
            <directionalLight
                position={[25, 45, 25]}
                intensity={2.0}
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
                shadow-bias={-0.0001}
            />
            <directionalLight position={[-25, 30, -20]} intensity={1.2} color="#93c5fd" />
            <directionalLight position={[0, 20, 35]} intensity={1.0} color="#fef08a" />
            
            {canGoBack && (
                <group position={[-12, 1.1, -10]} onClick={(e) => { e.stopPropagation(); goBack(); }}>
                    <mesh>
                        <boxGeometry args={[1.5, 2.5, 0.2]} />
                        <meshStandardMaterial color="#ff1493" roughness={0.4} metalness={0.5} />
                    </mesh>
                    <Text position={[0, 1.5, 0.11]} fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle">
                        RETURN
                    </Text>
                </group>
            )}

            {/* THE PRIMARY SOVEREIGN REALMS GATEWAY TRICON */}
            <group position={[0, 1.3, -4]}>
                <PrismaticTricon
                    file={REALMS_GATEWAY_FILE}
                    position={[0, 0, 0]}
                    childCount={10}
                    onOpenPrism={onOpenPrismForFile}
                />
                <Text
                    position={[0, 1.45, 0]}
                    fontSize={0.28}
                    color="#fbbf24"
                    outlineWidth={0.03}
                    outlineColor="#000000"
                    anchorX="center"
                    anchorY="middle"
                >
                    🌐 REALMS GATEWAY // 10 WORLDS
                </Text>
            </group>

            {/* The stationary grid of desktop items */}
            {mappedFiles.map((mapped, i) => (
                <DesktopItemNode 
                    key={mapped.file.path + i} 
                    file={mapped.file} 
                    position={mapped.position} 
                    onNavigate={navigateTo}
                    onDimensionSwap={onDimensionSwap}
                    onOpenPrism={onOpenPrismForFile}
                />
            ))}
        </group>
    );
};
