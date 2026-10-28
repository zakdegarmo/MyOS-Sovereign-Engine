// apps/web/src/components/Soundstage/TheaterScreen.tsx
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

export interface TheaterScreenProps {
    currentReel?: string;
    isPlaying?: boolean;
    isMuted?: boolean;
    isLooping?: boolean;
    ambilightColor?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    onScreenClick?: () => void;
}

// Fallback screen displaying high-tech test pattern / standby display
const ScreenFallback: React.FC<{ isPlaying?: boolean }> = ({ isPlaying }) => {
    return (
        <group position={[0, 0, 0.04]}>
            <mesh>
                <planeGeometry args={[16, 9]} />
                <meshStandardMaterial
                    color="#090d16"
                    emissive="#0b1329"
                    emissiveIntensity={0.8}
                    roughness={0.2}
                    metalness={0.8}
                />
            </mesh>
            {/* Standby Typography */}
            <Text
                position={[0, 0.8, 0.05]}
                fontSize={0.8}
                color="#f43f5e"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.15}
            >
                SOVEREIGN THEATER
            </Text>
            <Text
                position={[0, -0.4, 0.05]}
                fontSize={0.35}
                color="#38bdf8"
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.08}
            >
                {isPlaying ? 'LOADING PROJECTION REEL...' : 'STANDBY • READY FOR SCREENING'}
            </Text>
            <Text
                position={[0, -1.2, 0.05]}
                fontSize={0.22}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
            >
                24 FPS • H.264 CINEMA REEL • 16:9 DCI ASPECT
            </Text>
        </group>
    );
};

export const TheaterScreen: React.FC<TheaterScreenProps> = ({
    currentReel = 'hello_world.mp4',
    isPlaying = true,
    isMuted = true,
    isLooping = true,
    ambilightColor = '#ff2a5f',
    position = [0, 5.5, -14],
    rotation = [0, 0, 0],
    scale = 1,
    onScreenClick
}) => {
    const ambilightRef = useRef<THREE.PointLight>(null);
    const projectorBeamRef = useRef<THREE.Mesh>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    const videoSrc = currentReel.startsWith('http') || currentReel.startsWith('/') || currentReel.startsWith('blob:')
        ? currentReel
        : `/screenings/${currentReel}`;

    // Initialize HTML5 Video element and VideoTexture
    useEffect(() => {
        setIsVideoReady(false);

        const video = document.createElement('video');
        video.src = videoSrc;
        if (!videoSrc.startsWith('blob:')) {
            video.crossOrigin = 'anonymous';
        }
        video.playsInline = true;
        video.loop = isLooping;
        video.muted = isMuted; // Start muted to guarantee autoplay works on modern browsers
        video.preload = 'auto';

        const texture = new THREE.VideoTexture(video);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.format = THREE.RGBAFormat;

        videoRef.current = video;
        setVideoTexture(texture);

        const handleCanPlay = () => {
            setIsVideoReady(true);
            if (isPlaying) {
                video.play().catch(err => {
                    console.warn('[TheaterScreen] Autoplay deferred until user interaction:', err);
                });
            }
        };

        video.addEventListener('canplay', handleCanPlay);
        video.load();

        return () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.pause();
            video.src = '';
            texture.dispose();
        };
    }, [videoSrc, isLooping]);

    // Handle Play / Pause / Mute toggles
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        v.muted = isMuted;
        if (isPlaying) {
            v.play().catch(err => {
                console.warn('[TheaterScreen] Play failed (needs user interaction):', err);
            });
        } else {
            v.pause();
        }
    }, [isPlaying, isMuted]);

    // Animate video texture updates and projector beams
    useFrame(({ clock }) => {
        if (videoTexture && videoRef.current && !videoRef.current.paused && isPlaying) {
            videoTexture.needsUpdate = true;
        }

        if (ambilightRef.current && isPlaying) {
            const t = clock.getElapsedTime();
            ambilightRef.current.intensity = 3.5 + Math.sin(t * 3.5) * 0.4 + Math.cos(t * 7.1) * 0.2;
        }

        if (projectorBeamRef.current && isPlaying) {
            const t = clock.getElapsedTime();
            const beamMat = projectorBeamRef.current.material as THREE.MeshBasicMaterial;
            if (beamMat) {
                beamMat.opacity = 0.12 + Math.sin(t * 2.0) * 0.02;
            }
        }
    });

    const handleScreenClickInternal = () => {
        setHasUserInteracted(true);
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
            videoRef.current.play().catch(e => console.warn(e));
        }
        onScreenClick?.();
    };

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* 1. Anodized Screen Housing & Bezel Frame */}
            <group onClick={handleScreenClickInternal}>
                {/* Back Plate & Outer Bezel (16:9 ratio with border) */}
                <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
                    <boxGeometry args={[16.6, 9.6, 0.15]} />
                    <meshStandardMaterial
                        color="#0b0f19"
                        roughness={0.4}
                        metalness={0.8}
                    />
                </mesh>

                {/* Inner Bezel Accent Border */}
                <mesh position={[0, 0, 0.01]}>
                    <boxGeometry args={[16.15, 9.15, 0.05]} />
                    <meshStandardMaterial
                        color="#1e293b"
                        roughness={0.3}
                        metalness={0.9}
                    />
                </mesh>

                {/* Theater Header Marquee Plaque */}
                <mesh position={[0, 5.05, 0.08]}>
                    <boxGeometry args={[6.5, 0.6, 0.06]} />
                    <meshStandardMaterial
                        color="#090d16"
                        roughness={0.2}
                        metalness={0.9}
                    />
                </mesh>
                <Text
                    position={[0, 5.05, 0.13]}
                    fontSize={0.28}
                    color="#f59e0b"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.2}
                >
                    SOVEREIGN THEATER
                </Text>

                {/* Lower Technical Indicator Plaque */}
                <mesh position={[0, -4.95, 0.06]}>
                    <boxGeometry args={[8.0, 0.35, 0.04]} />
                    <meshStandardMaterial
                        color="#090d16"
                        roughness={0.3}
                        metalness={0.8}
                    />
                </mesh>
                <Text
                    position={[0, -4.95, 0.1]}
                    fontSize={0.16}
                    color="#64748b"
                    anchorX="center"
                    anchorY="middle"
                    letterSpacing={0.12}
                >
                    MYOS VIRTUAL PRODUCTION • STAGE 4 SCREENING
                </Text>

                {/* Screen Side Accent Pylons */}
                <mesh position={[-8.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.2, 9.6, 0.3]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
                </mesh>
                <mesh position={[8.4, 0, 0]} castShadow>
                    <boxGeometry args={[0.2, 9.6, 0.3]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.3} />
                </mesh>
            </group>

            {/* 2. Active Screen Projection Plane (16:9 ratio) */}
            {isVideoReady && videoTexture ? (
                <group onClick={handleScreenClickInternal}>
                    <mesh position={[0, 0, 0.04]}>
                        <planeGeometry args={[16, 9]} />
                        <meshBasicMaterial
                            map={videoTexture}
                            toneMapped={false}
                            side={THREE.FrontSide}
                        />
                    </mesh>

                    {/* Unmute / Play Prompt if browser blocked audio */}
                    {isMuted && !hasUserInteracted && (
                        <group position={[0, -3.6, 0.1]}>
                            <mesh>
                                <planeGeometry args={[4.2, 0.8]} />
                                <meshBasicMaterial color="#000000" transparent opacity={0.7} />
                            </mesh>
                            <Text
                                position={[0, 0, 0.02]}
                                fontSize={0.24}
                                color="#38bdf8"
                                anchorX="center"
                                anchorY="middle"
                            >
                                🔊 CLICK SCREEN TO UNMUTE
                            </Text>
                        </group>
                    )}
                </group>
            ) : (
                <ScreenFallback isPlaying={isPlaying} />
            )}

            {/* 3. Ambilight Bounce Point Light Illuminating Stage */}
            <pointLight
                ref={ambilightRef}
                position={[0, 0, 1.8]}
                color={ambilightColor}
                intensity={isPlaying ? 3.5 : 0.6}
                distance={30}
                decay={1.8}
            />

            {/* Subtle Screen Floor Reflection Light */}
            <pointLight
                position={[0, -4.5, 3.5]}
                color={ambilightColor}
                intensity={isPlaying ? 1.5 : 0.2}
                distance={18}
                decay={2}
            />

            {/* 4. Overhead Volumetric Projection Beam & Projector Housing */}
            <group position={[0, 6.5, 20]} rotation={[-0.26, 0, 0]}>
                {/* Projector body */}
                <mesh castShadow>
                    <boxGeometry args={[1.2, 0.6, 1.6]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Lens cylinder */}
                <mesh position={[0, 0, -0.9]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.22, 0.22, 0.3, 16]} />
                    <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={isPlaying ? 1.5 : 0.2} />
                </mesh>
            </group>

            {/* Volumetric light cone from lens to screen */}
            <mesh
                ref={projectorBeamRef}
                position={[0, 3.25, 3.0]}
                rotation={[Math.PI / 2 + 0.26, 0, 0]}
            >
                <coneGeometry args={[10, 24, 32, 1, true]} />
                <meshBasicMaterial
                    color="#60a5fa"
                    transparent
                    opacity={isPlaying ? 0.08 : 0.0}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
};

export default TheaterScreen;
