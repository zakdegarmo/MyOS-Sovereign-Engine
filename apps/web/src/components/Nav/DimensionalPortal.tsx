import React, { useRef, useState, useMemo, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, useGLTF, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

interface DimensionalPortalProps {
    id: string;
    pillarId: string;
    label: string;
    glyph: string;
    modelUrl: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    onEnter: (id: string) => void;
    thumbnailUrl?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}

/**
 * DimensionalPortal
 * 
 * High-Stabiliy SNES-authentic JRPG navigation node.
 * Uses a memory-safe shared material approach to avoid WebGL context loss.
 */
export const DimensionalPortal: React.FC<DimensionalPortalProps> = ({
    id,
    pillarId,
    label,
    glyph,
    modelUrl,
    position,
    rotation = [0, 0, 0],
    onEnter,
    thumbnailUrl,
    isOpen: propIsOpen,
    onToggle
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const isOpen = propIsOpen ?? localIsOpen;

    const totalFrames = 8;
    const [frame, setFrame] = useState(0);
    const frameTimer = useRef(0);

    // SHARED TEXTURE (No Clones to prevent WebGL crash)
    const doorTexture = useTexture('/assets/ZAMN_Assets/door_exit_clean_final.png');
    doorTexture.magFilter = doorTexture.minFilter = THREE.NearestFilter;
    doorTexture.wrapS = THREE.RepeatWrapping;

    // Unique Material per instance but SHARED Texture
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((state, delta) => {
        // SNES ZAMN Animation Timing
        const frameDuration = 0.08; 
        
        if (isOpen && frame < totalFrames - 1) {
            frameTimer.current += delta;
            if (frameTimer.current > frameDuration) {
                setFrame(prev => Math.min(prev + 1, totalFrames - 1));
                frameTimer.current = 0;
            }
        } else if (!isOpen && frame > 0) {
            frameTimer.current += delta;
            if (frameTimer.current > frameDuration) {
                setFrame(prev => Math.max(prev - 1, 0));
                frameTimer.current = 0;
            }
        }

        // Apply Frame Offset directly to the instance material
        if (materialRef.current) {
            materialRef.current.map!.offset.x = frame / totalFrames;
            materialRef.current.map!.repeat.set(1 / totalFrames, 1);
        }
    });

    return (
        <group position={position} rotation={rotation}>
            {/* INTERACTION GLYPH */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[0, 4, 0]}>
                <mesh 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle ? onToggle() : setLocalIsOpen(!localIsOpen);
                    }}
                    onPointerOver={() => setIsHovered(true)}
                    onPointerOut={() => setIsHovered(false)}
                >
                    <Suspense fallback={<meshBasicMaterial color="#ff00ff" wireframe />}>
                        <GlyphModel url={modelUrl} isHovered={isHovered} />
                    </Suspense>
                </mesh>

                <Text
                    position={[0, 1.8, 0]}
                    fontSize={0.4}
                    color="white"
                    font="/fonts/HamburgSymbols.ttf"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="#000"
                >
                    {`${glyph} ${label.toUpperCase()}`}
                </Text>
            </Float>

            {/* THE DOOR */}
            <group position={[0, 1.2, -0.4]}>
                <mesh 
                    renderOrder={1}
                    onClick={(e) => {
                        if (isOpen) {
                            e.stopPropagation();
                            onEnter(pillarId);
                        }
                    }}
                >
                    <planeGeometry args={[4.5, 6]} />
                    <meshStandardMaterial 
                        ref={materialRef}
                        map={doorTexture} 
                        transparent 
                        alphaTest={0.1}
                        side={THREE.DoubleSide}
                        emissive="#222"
                        emissiveIntensity={isHovered ? 2 : 0.5}
                    />
                </mesh>

                {isOpen && (
                    <mesh position={[0, 0, -0.05]}>
                        <planeGeometry args={[4.2, 5.8]} />
                        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
                    </mesh>
                )}
            </group>
        </group>
    );
};

const GlyphModel = ({ url, isHovered }: { url: string, isHovered: boolean }) => {
    const { scene } = useGLTF(url);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame((state) => {
        if (clonedScene) {
            clonedScene.rotation.y += 0.02;
            if (isHovered) {
                const s = 1.3 + Math.sin(state.clock.elapsedTime * 6) * 0.15;
                clonedScene.scale.set(s, s, s);
            } else {
                clonedScene.scale.set(1, 1, 1);
            }
        }
    });

    return <primitive object={clonedScene} />;
};
