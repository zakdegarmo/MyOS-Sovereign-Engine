// apps/web/src/cartridges/Glyphrider/editor/PolyhedralSpriteBillboard.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PolyhedralSpriteBillboardProps {
    type?: 'cube' | 'tetra';
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    accentColor?: string;
    isSelected?: boolean;
    onClick?: () => void;
}

/**
 * Creates dynamic animated canvas textures for the faces of the polyhedron.
 * Each face displays an existential radar, CRT retro graphic, or radical 16-bit iconography.
 */
function createFaceCanvas(faceIndex: number, label: string, color: string): { canvas: HTMLCanvasElement; texture: THREE.CanvasTexture; update: (t: number) => void } {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const update = (t: number) => {
        if (!ctx) return;
        ctx.clearRect(0, 0, 256, 256);

        // Dark tech background
        const grad = ctx.createLinearGradient(0, 0, 256, 256);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);

        // Cyber Grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i, 256);
            ctx.moveTo(0, i); ctx.lineTo(256, i);
            ctx.stroke();
        }

        // Animated Concentric Wave / Radar
        ctx.save();
        ctx.translate(128, 128);
        const pulse = (Math.sin(t * 3 + faceIndex * 1.2) + 1) * 0.5;
        const radius = 25 + pulse * 60;

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-80, 0); ctx.lineTo(80, 0);
        ctx.moveTo(0, -80); ctx.lineTo(0, 80);
        ctx.stroke();

        // Rotating Glyph/Needle
        const angle = t * 2.5 + faceIndex * (Math.PI / 3);
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(12, 10);
        ctx.lineTo(-12, 10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Border Glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);

        // Label Typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`FACE_${faceIndex}: ${label}`, 128, 35);

        // CRT Scanline simulation
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        for (let y = 0; y < 256; y += 4) {
            ctx.fillRect(0, y, 256, 2);
        }

        texture.needsUpdate = true;
    };

    return { canvas, texture, update };
}

export const PolyhedralSpriteBillboard: React.FC<PolyhedralSpriteBillboardProps> = ({
    type = 'cube',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = [1, 1, 1],
    accentColor = '#38bdf8',
    isSelected = false,
    onClick
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const groupRef = useRef<THREE.Group>(null);

    // Build 6 canvas textures for cube faces, or 4 for tetrahedron
    const faceLabels = [
        'VELOCITY',
        'ONTOLOGY',
        'SYNERGY',
        'MOMENTUM',
        'GRAVITY',
        'ASCEND'
    ];

    const faceColors = [
        accentColor,
        '#f59e0b',
        '#10b981',
        '#ec4899',
        '#8b5cf6',
        '#06b6d4'
    ];

    const faceData = useMemo(() => {
        const count = type === 'cube' ? 6 : 4;
        return Array.from({ length: count }, (_, idx) => 
            createFaceCanvas(idx, faceLabels[idx % faceLabels.length], faceColors[idx % faceColors.length])
        );
    }, [type, accentColor]);

    const materials = useMemo(() => {
        return faceData.map(fd => new THREE.MeshStandardMaterial({
            map: fd.texture,
            roughness: 0.2,
            metalness: 0.1,
            emissive: new THREE.Color(accentColor),
            emissiveIntensity: 0.25
        }));
    }, [faceData, accentColor]);

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        for (const fd of faceData) {
            fd.update(t);
        }

        // Gentle floating gyroscopic bobbing
        if (groupRef.current && !isSelected) {
            groupRef.current.rotation.y += delta * 0.4;
            groupRef.current.position.y = position[1] + Math.sin(t * 1.8) * 0.15;
        }
    });

    useEffect(() => {
        return () => {
            for (const mat of materials) mat.dispose();
            for (const fd of faceData) fd.texture.dispose();
        };
    }, [materials, faceData]);

    return (
        <group
            ref={groupRef}
            position={position}
            rotation={rotation}
            scale={scale}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
        >
            {type === 'cube' ? (
                <mesh ref={meshRef} material={materials} castShadow receiveShadow>
                    <boxGeometry args={[2, 2, 2]} />
                </mesh>
            ) : (
                <mesh ref={meshRef} castShadow receiveShadow>
                    <tetrahedronGeometry args={[1.8, 0]} />
                    <meshStandardMaterial
                        map={faceData[0].texture}
                        roughness={0.2}
                        metalness={0.2}
                        emissive={new THREE.Color(accentColor)}
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}

            {/* Glowing Neon Corner Brackets */}
            {isSelected && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(2.1, 2.1, 2.1)]} />
                    <lineBasicMaterial color="#facc15" linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};

export default PolyhedralSpriteBillboard;
