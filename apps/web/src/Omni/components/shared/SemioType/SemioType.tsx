import React, { useMemo, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Voxel from './Voxel';
import type { VoxelData, FontSettings } from './types';
import { BITMAP_FONT, UNKNOWN_CHAR, COLORS } from './fontData';

// Default Settings
const DEFAULT_SETTINGS: FontSettings = {
    text: "SEMIOTYPE",
    voxelSize: 0.5,
    gap: 0.1,
    explosionForce: 20,
    returnSpeed: 2,
    drag: 0.9,
    colorMode: 'gradient',
    customColor: '#00ff00',
    voxelGeometry: 'cube'
};

interface SemioTypeContentProps {
    settings: FontSettings;
}

const SemioTypeContent: React.FC<SemioTypeContentProps> = ({ settings }) => {
    const mousePos = useRef(new THREE.Vector3(999, 999, 999));
    const { camera, mouse } = useThree();

    // Convert mouse screen coords to 3D world coords on a plane
    useFrame(() => {
        // Simple projection to z=0 plane for interaction
        const vec = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        vec.unproject(camera);
        const dir = vec.sub(camera.position).normalize();
        const distance = -camera.position.z / dir.z;
        const pos = camera.position.clone().add(dir.multiplyScalar(distance));
        mousePos.current.copy(pos);
    });

    // Generate Voxel Data from Text String (Multi-line support)
    const voxelData = useMemo(() => {
        const voxels: VoxelData[] = [];
        const text = settings.text.toUpperCase();
        const lines = text.split('\n');

        // Layout constants
        const charHeight = 7 * (settings.voxelSize + settings.gap);
        const lineHeight = charHeight + (settings.voxelSize * 6); // Add vertical spacing
        const totalHeight = lines.length * lineHeight;

        // Determine max width to center the whole block block
        let maxWidth = 0;
        lines.forEach(line => {
            let lineWidth = 0;
            for (const char of line) {
                const map = BITMAP_FONT[char] || UNKNOWN_CHAR;
                lineWidth += map[0].length * (settings.voxelSize + settings.gap) + (settings.voxelSize * 2);
            }
            if (lineWidth > maxWidth) maxWidth = lineWidth;
        });

        const blockStartX = -maxWidth / 2;
        const blockStartY = (totalHeight / 2) - charHeight; // Start from top

        lines.forEach((line, lineIndex) => {
            let cursorX = 0;
            const currentLineY = blockStartY - (lineIndex * lineHeight);

            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                const map = BITMAP_FONT[char] || UNKNOWN_CHAR;
                const rows = map.length;
                const cols = map[0].length;

                for (let i = 0; i < rows; i++) {
                    for (let j = 0; j < cols; j++) {
                        if (map[i][j] === 1) {
                            const x = blockStartX + cursorX + (j * (settings.voxelSize + settings.gap));
                            // Flip Y for coordinate system
                            const y = currentLineY + ((rows - i) * (settings.voxelSize + settings.gap));
                            const z = 0;

                            let color = COLORS.CYAN;
                            if (settings.colorMode === 'custom') {
                                color = settings.customColor;
                            } else if (settings.colorMode === 'random') {
                                const colors = Object.values(COLORS);
                                color = colors[Math.floor(Math.random() * colors.length)];
                            } else if (settings.colorMode === 'gradient') {
                                color = (lineIndex + c) % 2 === 0 ? COLORS.CYAN : COLORS.MAGENTA;
                            } else if (settings.colorMode === 'solid') {
                                color = COLORS.WHITE;
                            }

                            // Generate unique ID based on line, char, and voxel position
                            const id = `v-l${lineIndex}-c${c}-${i}-${j}`;

                            voxels.push({
                                id: id,
                                x: x,
                                y: y + 20, // Drop in effect
                                z: (Math.random() - 0.5) * 5,
                                originX: x,
                                originY: y,
                                originZ: z,
                                color: color
                            });
                        }
                    }
                }
                cursorX += cols * (settings.voxelSize + settings.gap) + (settings.voxelSize * 2);
            }
        });

        return voxels;
    }, [settings.text, settings.voxelSize, settings.gap, settings.colorMode, settings.customColor]);

    return (
        <group>
            {voxelData.map((data) => (
                <Voxel
                    key={data.id}
                    data={data}
                    settings={settings}
                    mousePos={mousePos}
                />
            ))}
        </group>
    );
};

export interface SemioTypeProps extends Partial<FontSettings> {
    standalone?: boolean; // If true, renders its own Canvas
}

export const SemioType: React.FC<SemioTypeProps> = ({ standalone = false, ...props }) => {
    const settings = { ...DEFAULT_SETTINGS, ...props };

    if (standalone) {
        return (
            <div className="w-full h-full bg-slate-900 relative overflow-hidden">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 0, 30]} fov={45} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} color={COLORS.CYAN} />
                    <pointLight position={[-10, 5, 10]} intensity={1.5} color={COLORS.MAGENTA} />

                    <SemioTypeContent settings={settings} />

                    <OrbitControls minDistance={2} maxDistance={200} />
                    <pointLight position={[5, 5, 5]} intensity={1.5} />
                </Canvas>
            </div>
        );
    }

    return <SemioTypeContent settings={settings} />;
};
