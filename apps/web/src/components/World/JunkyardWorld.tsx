// apps/web/src/components/World/JunkyardWorld.tsx
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { topographyRegistry } from '../../engine/TopographyRegistry';
import { uniracerAudio } from '../../utils/uniracerAudio';

export interface JunkyardWorldProps {
    isActive?: boolean;
    playerPosition?: [number, number, number] | THREE.Vector3;
    showRedOnCouch?: boolean;
}

/**
 * Procedural 90s Retro Poster Texture Generator
 * Creates authentic 16-bit / 64-bit mock box art & game posters in memory via HTML5 Canvas.
 */
function createMockPosterTexture(type: 'cybercycle' | 'glyphrider' | 'radical' | 'outlaw'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.save();
    if (type === 'cybercycle') {
        // SUPER CYBER-CYCLE 64
        const grad = ctx.createLinearGradient(0, 0, 0, 768);
        grad.addColorStop(0, '#0f051d');
        grad.addColorStop(0.4, '#3b0764');
        grad.addColorStop(0.7, '#c026d3');
        grad.addColorStop(1, '#f97316');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 768);

        // Perspective Sun & Neon Grid
        ctx.beginPath();
        ctx.arc(256, 420, 110, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        for (let y = 460; y < 768; y += 28) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }
        for (let x = -200; x < 712; x += 60) {
            ctx.beginPath();
            ctx.moveTo(256, 420);
            ctx.lineTo(x, 768);
            ctx.stroke();
        }

        // Title Typography
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;
        ctx.font = '900 italic 42px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SUPER', 256, 90);
        ctx.fillStyle = '#fde047';
        ctx.font = '900 italic 52px "Arial Black", Impact, sans-serif';
        ctx.fillText('CYBER-CYCLE', 256, 150);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 italic 68px "Arial Black", Impact, sans-serif';
        ctx.fillText('64', 256, 220);

        // Badges
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.fillRect(40, 680, 432, 54);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 680, 432, 54);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('★ 64-BIT ULTRA REALITY ★', 256, 715);
    } else if (type === 'glyphrider') {
        // GLYPHRIDER 2000: TURBO DRIFT
        const grad = ctx.createLinearGradient(0, 0, 512, 768);
        grad.addColorStop(0, '#022c22');
        grad.addColorStop(0.5, '#064e3b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 768);

        // Radical speed streaks
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 18; i++) {
            const y = 80 + i * 36;
            ctx.beginPath();
            ctx.moveTo(30, y);
            ctx.lineTo(480, y - 45);
            ctx.stroke();
        }

        ctx.fillStyle = '#34d399';
        ctx.font = '900 italic 58px "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 10;
        ctx.fillText('GLYPHRIDER', 256, 170);
        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 italic 48px "Impact", sans-serif';
        ctx.fillText('2000', 256, 230);
        ctx.fillStyle = '#f43f5e';
        ctx.font = '900 italic 30px sans-serif';
        ctx.fillText('⚡ TURBO DRIFT RACING ⚡', 256, 290);

        // Center Arcade Emblem
        ctx.beginPath();
        ctx.arc(256, 470, 95, 0, Math.PI * 2);
        ctx.fillStyle = '#065f46';
        ctx.fill();
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = '900 85px sans-serif';
        ctx.fillText('⬡', 256, 500);

        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('OFFICIAL ARCADE PORT', 256, 710);
    } else if (type === 'radical') {
        // RADICAL RACER: NITRO UNICYCLE
        ctx.fillStyle = '#facc15';
        ctx.fillRect(0, 0, 512, 768);

        // Hazard checker diagonals
        ctx.fillStyle = '#000000';
        for (let y = 0; y < 768; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(80, y);
            ctx.lineTo(0, y + 40);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(512, y);
            ctx.lineTo(432, y);
            ctx.lineTo(512, y + 40);
            ctx.fill();
        }

        // Comic burst
        ctx.beginPath();
        ctx.arc(256, 380, 160, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;
        ctx.font = '900 64px "Arial Black", Impact';
        ctx.textAlign = 'center';
        ctx.fillText('RADICAL', 256, 160);
        ctx.fillStyle = '#000000';
        ctx.fillText('RACER', 256, 230);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 italic 38px "Impact"';
        ctx.fillText('NITRO UNICYCLE', 256, 385);
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('NO HANDLEBARS.', 256, 440);
        ctx.fillText('NO MERCY.', 256, 475);

        ctx.fillStyle = '#000000';
        ctx.font = '900 24px monospace';
        ctx.fillText('100% NITRO SOVEREIGN ACTION', 256, 700);
    } else {
        // OUTLAW UNICYCLE: CHOPPER REVENGE
        const grad = ctx.createLinearGradient(0, 0, 0, 768);
        grad.addColorStop(0, '#18181b');
        grad.addColorStop(0.6, '#3f3f46');
        grad.addColorStop(1, '#09090b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 768);

        // Flames at bottom
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, 768);
        ctx.lineTo(60, 520);
        ctx.lineTo(130, 620);
        ctx.lineTo(210, 480);
        ctx.lineTo(290, 640);
        ctx.lineTo(370, 500);
        ctx.lineTo(440, 610);
        ctx.lineTo(512, 530);
        ctx.lineTo(512, 768);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(0, 768);
        ctx.lineTo(70, 600);
        ctx.lineTo(140, 680);
        ctx.lineTo(220, 560);
        ctx.lineTo(300, 690);
        ctx.lineTo(380, 580);
        ctx.lineTo(450, 670);
        ctx.lineTo(512, 610);
        ctx.lineTo(512, 768);
        ctx.fill();

        ctx.fillStyle = '#e4e4e7';
        ctx.font = '900 52px "Arial Black", Impact';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 14;
        ctx.fillText('OUTLAW', 256, 140);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('UNICYCLE', 256, 205);
        ctx.fillStyle = '#d4d4d8';
        ctx.font = 'bold 30px "Courier New", monospace';
        ctx.fillText('CHOPPER REVENGE', 256, 275);

        ctx.font = '900 70px monospace';
        ctx.fillText('⚙ ☠ ⚙', 256, 420);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('BORN TO SPIN • 1994', 256, 730);
    }
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
}

/**
 * Procedural Distressed Garage Rug Texture Generator
 */
function createGarageRugTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep weathered maroon/indigo base
    ctx.fillStyle = '#3f1a24';
    ctx.fillRect(0, 0, 512, 512);

    // Distressed border
    ctx.strokeStyle = '#c29b38';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 472, 472);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 440, 440);

    // Central geometric diamond motifs
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.moveTo(256, 90);
    ctx.lineTo(410, 256);
    ctx.lineTo(256, 422);
    ctx.lineTo(102, 256);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Secondary inner diamond
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(256, 160);
    ctx.lineTo(340, 256);
    ctx.lineTo(256, 352);
    ctx.lineTo(172, 256);
    ctx.closePath();
    ctx.fill();

    // Worn grunge speckles
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    for (let i = 0; i < 400; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 4 + 1;
        ctx.fillRect(x, y, r, r);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
}

export const JunkyardWorld: React.FC<JunkyardWorldProps> = ({
    isActive = true,
    playerPosition,
    showRedOnCouch = false,
}) => {
    // Topography Registration: Sets elevation for the 14m x 14m warehouse and couch cushion
    useEffect(() => {
        if (!isActive) return;

        topographyRegistry.register({
            id: 'junkyard',
            projection: 'flat',
            getElevation: (x, z) => {
                // Couch Cushion Seating Surface:
                // Couch center: (0, 0). Cushion area: X in [-1.7, 1.7], Z in [-0.7, 0.45]
                if (x >= -1.75 && x <= 1.75 && z >= -0.75 && z <= 0.45) {
                    return 0.85;
                }
                // Floor base
                return 0.0;
            },
            isBlocked: (x, z, _radius = 0.45, y) => {
                // 1. Soundstage / Junkyard Boundary (60m x 60m open lot: |x| > 28.0 or |z| > 28.0)
                if (Math.abs(x) > 28.0 || Math.abs(z) > 28.0) {
                    return true;
                }

                // 2. TV Stand Shipping Crate (Z = -4.2, X = 0)
                if (Math.abs(x) < 1.1 && Math.abs(z - (-4.2)) < 0.95) {
                    return true;
                }

                // 3. Burn Barrel Corner (X = -5.0, Z = -4.5)
                if (Math.hypot(x - (-5.0), z - (-4.5)) < 0.75) {
                    return true;
                }

                // 4. Heavy Couch Physical Collision:
                // Only block when player is physically at ground level (y < 0.7)
                if (y !== undefined && y < 0.7) {
                    if (x >= -2.2 && x <= 2.2 && z >= -0.95 && z <= 0.95) {
                        return true;
                    }
                } else if (y !== undefined && y >= 0.7) {
                    // When player is jumping or on the couch (y >= 0.7):
                    // - Cushion seating area is open (NOT blocked)
                    // - Backrest is solid wall: prevents rolling off behind couch
                    if (z > 0.45 && z <= 1.15 && x >= -2.25 && x <= 2.25) {
                        return true;
                    }
                    // - Left and right armrests are solid walls: prevents rolling off sides
                    if (Math.abs(x) > 1.72 && Math.abs(x) <= 2.25 && z >= -0.95 && z <= 0.95) {
                        return true;
                    }
                }

                return false;
            }
        });

        topographyRegistry.setCurrent('junkyard');

        return () => {
            topographyRegistry.unregister('junkyard');
        };
    }, [isActive]);

    // Lighting & Animation Refs
    const crtLightRef = useRef<THREE.PointLight>(null);
    const fireLightRef = useRef<THREE.PointLight>(null);
    const flameMeshRef = useRef<THREE.Group>(null);
    const springRef = useRef<THREE.Group>(null);

    // Spring Gimmick State
    const [springPopped, setSpringPopped] = useState<boolean>(false);
    const springPoppedRef = useRef<boolean>(false);
    const sitTimerRef = useRef<number>(0);
    const offCushionTimerRef = useRef<number>(0);
    const springAnimTimer = useRef<number>(0);

    // Cached Textures
    const posterTextures = useMemo(() => ({
        cybercycle: createMockPosterTexture('cybercycle'),
        glyphrider: createMockPosterTexture('glyphrider'),
        radical: createMockPosterTexture('radical'),
        outlaw: createMockPosterTexture('outlaw'),
        rug: createGarageRugTexture(),
    }), []);

    // Procedural 3D Helical Coil Spring Geometry (7 turns, 0.16m radius)
    const springGeometry = useMemo(() => {
        const points: THREE.Vector3[] = [];
        const turns = 7;
        const steps = 140;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angle = t * turns * Math.PI * 2;
            const r = 0.15;
            points.push(new THREE.Vector3(
                Math.cos(angle) * r,
                t * 1.0, // Normalized unit height (scaled dynamically)
                Math.sin(angle) * r
            ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        return new THREE.TubeGeometry(curve, 100, 0.022, 8, false);
    }, []);

    // Frame Update: CRT flicker, fire pulse, and comedic spring trigger/animation
    useFrame((state, delta) => {
        if (!isActive) return;
        const t = state.clock.getElapsedTime();

        // 1. Analog CRT TV High-Frequency Cyan Flicker
        if (crtLightRef.current) {
            const flicker = Math.sin(t * 14.0) * 5.0 + Math.cos(t * 31.0) * 4.0 + (Math.random() - 0.5) * 3.0;
            crtLightRef.current.intensity = 65.0 + flicker;
        }

        // 2. Burn Barrel Fire Pulse & Flame Wobble
        if (fireLightRef.current) {
            const fireFlicker = Math.sin(t * 8.5) * 8.0 + Math.cos(t * 21.0) * 5.0;
            fireLightRef.current.intensity = 80.0 + fireFlicker;
        }
        if (flameMeshRef.current) {
            flameMeshRef.current.rotation.y = t * 1.8;
            flameMeshRef.current.scale.y = 1.0 + Math.sin(t * 9.0) * 0.15;
        }

        // 3. Comical Couch Spring Trigger & Damped Harmonic Bounce
        const playerPos = playerPosition
            ? (Array.isArray(playerPosition)
                ? { x: playerPosition[0], y: playerPosition[1], z: playerPosition[2] }
                : playerPosition)
            : { x: 0, y: 0, z: 0 };

        // Check if Red is resting on the couch cushion
        const isRedOnCushion =
            playerPos.x >= -1.75 && playerPos.x <= 1.75 &&
            playerPos.z >= -0.75 && playerPos.z <= 0.45 &&
            playerPos.y >= 0.75 && playerPos.y <= 1.30;

        if (isRedOnCushion) {
            sitTimerRef.current += delta;
            // Pop spring after settling for 2.5 seconds
            if (sitTimerRef.current >= 2.5 && !springPoppedRef.current) {
                springPoppedRef.current = true;
                setSpringPopped(true);
                springAnimTimer.current = 0;
                uniracerAudio.playSpringPtwang();
            }
            offCushionTimerRef.current = 0;
        } else {
            sitTimerRef.current = 0;
            offCushionTimerRef.current += delta;
            // Reset spring after Red has been away from couch for 3.5 seconds
            if (offCushionTimerRef.current > 3.5 && springPoppedRef.current) {
                springPoppedRef.current = false;
                setSpringPopped(false);
                springAnimTimer.current = 0;
            }
        }

        // Animate the spring mesh
        if (springRef.current) {
            if (springPoppedRef.current) {
                springAnimTimer.current += delta;
                const st = springAnimTimer.current;
                // Harmonic damped cartoon uncoil reaching 1.05m
                const targetHeight = 1.05;
                const decay = Math.exp(-st * 4.5);
                const osc = Math.cos(st * 20.0);
                const currentHeight = targetHeight * (1.0 - decay * osc);
                springRef.current.scale.set(1.0, Math.max(0.08, currentHeight), 1.0);
                // Rubbery cartoon tilt and wobble
                springRef.current.rotation.z = Math.sin(st * 16.0) * decay * 0.35 + 0.16;
                springRef.current.rotation.x = Math.cos(st * 14.0) * decay * 0.25 - 0.12;
            } else {
                // Squashed flat inside the cushion
                springRef.current.scale.set(1.0, 0.08, 1.0);
                springRef.current.rotation.set(0, 0, 0);
            }
        }
    });

    if (!isActive) return null;

    return (
        <group name="JunkyardWorldRoot">
            {/* ========================================================================= */}
            {/* 1. WAREHOUSE / CONTAINER ROOM ARCHITECTURE (14m x 14m x 5.2m)             */}
            {/* ========================================================================= */}

            {/* Concrete Floor with expansion cracks and grease stains (60m x 60m open soundstage) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[60.0, 60.0]} />
                <meshStandardMaterial color="#1a1c1e" roughness={0.88} metalness={0.12} />
            </mesh>

            {/* Distressed Garage Rug between Couch and TV */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -2.1]} receiveShadow>
                <planeGeometry args={[3.8, 2.6]} />
                <meshStandardMaterial map={posterTextures.rug} roughness={0.92} metalness={0.0} />
            </mesh>

            {/* Back Studio Backdrop Wall with Posters (Z = 6.9m, 28m wide) */}
            <mesh position={[0, 3.0, 6.9]}>
                <planeGeometry args={[28.0, 6.0]} />
                <meshStandardMaterial color="#2b231d" roughness={0.75} metalness={0.35} />
            </mesh>
            {/* Distant Soundstage Boundary Wings */}
            <mesh position={[-28.0, 3.0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[60.0, 6.0]} />
                <meshStandardMaterial color="#18191c" roughness={0.85} metalness={0.2} />
            </mesh>
            <mesh position={[28.0, 3.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[60.0, 6.0]} />
                <meshStandardMaterial color="#18191c" roughness={0.85} metalness={0.2} />
            </mesh>

            {/* ========================================================================= */}
            {/* 2. THE HERO OUTLAW COUCH (Scaled 4.2m Wide for Red)                       */}
            {/* ========================================================================= */}
            <group position={[0, 0, 0]}>
                {/* Wooden Corner Base Feet */}
                {[[-1.9, -0.75], [1.9, -0.75], [-1.9, 0.75], [1.9, 0.75]].map(([fx, fz], idx) => (
                    <mesh key={`foot_${idx}`} position={[fx, 0.10, fz]}>
                        <boxGeometry args={[0.26, 0.20, 0.26]} />
                        <meshStandardMaterial color="#24140c" roughness={0.8} />
                    </mesh>
                ))}

                {/* Sturdy Heavy Base Chassis */}
                <mesh position={[0, 0.42, 0]}>
                    <boxGeometry args={[4.2, 0.48, 1.8]} />
                    <meshStandardMaterial color="#1c201a" roughness={0.82} metalness={0.08} />
                </mesh>

                {/* Left Seating Cushion (Seating surface at Y = 0.85m) */}
                <mesh position={[-0.88, 0.74, -0.12]}>
                    <boxGeometry args={[1.75, 0.22, 1.45]} />
                    <meshStandardMaterial color="#293026" roughness={0.85} metalness={0.0} />
                </mesh>

                {/* Right Seating Cushion (Seating surface at Y = 0.85m, contains spring hole) */}
                <mesh position={[0.88, 0.74, -0.12]}>
                    <boxGeometry args={[1.75, 0.22, 1.45]} />
                    <meshStandardMaterial color="#252b22" roughness={0.85} metalness={0.0} />
                </mesh>

                {/* High Padded Backrest (Angled back slightly, Z = 0.65m) */}
                <mesh position={[0, 1.32, 0.68]} rotation={[-0.12, 0, 0]}>
                    <boxGeometry args={[4.2, 1.05, 0.42]} />
                    <meshStandardMaterial color="#222820" roughness={0.85} metalness={0.0} />
                </mesh>

                {/* Left Armrest */}
                <mesh position={[-1.95, 0.98, 0]}>
                    <boxGeometry args={[0.48, 0.72, 1.8]} />
                    <meshStandardMaterial color="#1c201a" roughness={0.82} metalness={0.08} />
                </mesh>

                {/* Right Armrest */}
                <mesh position={[1.95, 0.98, 0]}>
                    <boxGeometry args={[0.48, 0.72, 1.8]} />
                    <meshStandardMaterial color="#1c201a" roughness={0.82} metalness={0.08} />
                </mesh>

                {/* ===================================================================== */}
                {/* 3. THE COMICAL POP-UP SPRING GIMMICK                                  */}
                {/* ===================================================================== */}
                <group position={[0.85, 0.85, -0.08]}>
                    {/* Ripped Cushion Tear Rim */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                        <circleGeometry args={[0.26, 24]} />
                        <meshStandardMaterial color="#0c0d0c" roughness={0.95} />
                    </mesh>

                    {/* Ragged Yellow Cushion Foam Tuft Bursting Out */}
                    <mesh position={[0.08, 0.04, 0.05]} rotation={[0.2, 0.4, -0.1]}>
                        <boxGeometry args={[0.16, 0.08, 0.12]} />
                        <meshStandardMaterial color="#eab308" roughness={0.95} />
                    </mesh>
                    <mesh position={[-0.09, 0.03, -0.06]} rotation={[-0.15, -0.3, 0.2]}>
                        <boxGeometry args={[0.14, 0.07, 0.14]} />
                        <meshStandardMaterial color="#ca8a04" roughness={0.95} />
                    </mesh>

                    {/* The Helical Coiled Steel Spring */}
                    <group ref={springRef} position={[0, 0, 0]}>
                        <mesh geometry={springGeometry}>
                            <meshStandardMaterial color="#e2e8f0" roughness={0.18} metalness={0.95} />
                        </mesh>
                    </group>
                </group>
            </group>

            {/* ========================================================================= */}
            {/* 4. CHUNKY 36" 90s CRT TELEVISION (Facing the Couch at Z = -4.2m)          */}
            {/* ========================================================================= */}
            <group position={[0, 0, -4.2]}>
                {/* Heavy Duty Shipping Crate Stand */}
                <mesh position={[0, 0.50, 0]}>
                    <boxGeometry args={[1.8, 1.0, 1.4]} />
                    <meshStandardMaterial color="#4a3728" roughness={0.88} metalness={0.05} />
                </mesh>
                {/* Metal Crate Brackets */}
                {[-0.85, 0.85].map((bx) => (
                    <mesh key={`b_${bx}`} position={[bx, 0.50, 0]}>
                        <boxGeometry args={[0.08, 1.02, 1.42]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
                    </mesh>
                ))}

                {/* CRT Main TV Chassis (facing +Z towards couch) */}
                <group position={[0, 1.55, 0]}>
                    <mesh position={[0, 0, -0.1]}>
                        <boxGeometry args={[1.5, 1.1, 0.95]} />
                        <meshStandardMaterial color="#18181b" roughness={0.5} metalness={0.2} />
                    </mesh>
                    {/* Rear Cathode Funnel Bulge */}
                    <mesh position={[0, 0, -0.6]}>
                        <boxGeometry args={[0.85, 0.75, 0.5]} />
                        <meshStandardMaterial color="#0f0f11" roughness={0.6} metalness={0.2} />
                    </mesh>

                    {/* Bulbous Curved 4:3 Glass CRT Screen (Glowing +Z towards Couch) */}
                    <mesh position={[-0.15, 0, 0.40]}>
                        <boxGeometry args={[1.05, 0.82, 0.08]} />
                        <meshStandardMaterial
                            color="#38bdf8"
                            emissive="#0284c7"
                            emissiveIntensity={1.8}
                            roughness={0.08}
                            metalness={0.1}
                        />
                    </mesh>

                    {/* Control Panel Strip (Right of Screen) */}
                    <group position={[0.52, 0, 0.40]}>
                        {/* Tuning Knobs */}
                        <mesh position={[0, 0.22, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.065, 0.065, 0.05, 16]} />
                            <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.6} />
                        </mesh>
                        <mesh position={[0, 0.04, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.065, 0.065, 0.05, 16]} />
                            <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.6} />
                        </mesh>
                        {/* Red Power LED */}
                        <mesh position={[0, -0.22, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
                            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3.5} />
                        </mesh>
                    </group>

                    {/* Chrome Rabbit-Ear Antennas extending upward in a V-shape */}
                    <mesh position={[-0.22, 0.65, -0.15]} rotation={[0.2, 0, -0.55]}>
                        <cylinderGeometry args={[0.012, 0.012, 1.1, 8]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.98} />
                    </mesh>
                    <mesh position={[0.22, 0.65, -0.15]} rotation={[0.2, 0, 0.50]}>
                        <cylinderGeometry args={[0.012, 0.012, 1.1, 8]} />
                        <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.98} />
                    </mesh>
                </group>
            </group>

            {/* ========================================================================= */}
            {/* 5. 1990s RETRO MOCK GAME POSTERS                                          */}
            {/* ========================================================================= */}
            {/* Poster 1: SUPER CYBER-CYCLE 64 (Back Wall, Left) */}
            <group position={[-3.2, 2.9, 6.84]}>
                <mesh>
                    <planeGeometry args={[2.0, 3.0]} />
                    <meshStandardMaterial map={posterTextures.cybercycle} roughness={0.4} />
                </mesh>
                {/* Thin weathered border frame */}
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[2.08, 3.08, 0.04]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.7} />
                </mesh>
            </group>

            {/* Poster 2: GLYPHRIDER 2000 (Back Wall, Right) */}
            <group position={[3.2, 2.9, 6.84]}>
                <mesh>
                    <planeGeometry args={[2.0, 3.0]} />
                    <meshStandardMaterial map={posterTextures.glyphrider} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[2.08, 3.08, 0.04]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.7} />
                </mesh>
            </group>

            {/* Poster 3: RADICAL RACER (Left Wall) */}
            <group position={[-6.84, 2.8, -0.8]} rotation={[0, Math.PI / 2, 0]}>
                <mesh>
                    <planeGeometry args={[1.9, 2.85]} />
                    <meshStandardMaterial map={posterTextures.radical} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[1.98, 2.93, 0.04]} />
                    <meshStandardMaterial color="#1e1b4b" roughness={0.7} />
                </mesh>
            </group>

            {/* Poster 4: OUTLAW UNICYCLE (Right Wall) */}
            <group position={[6.84, 2.8, -0.8]} rotation={[0, -Math.PI / 2, 0]}>
                <mesh>
                    <planeGeometry args={[1.9, 2.85]} />
                    <meshStandardMaterial map={posterTextures.outlaw} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0, -0.01]}>
                    <boxGeometry args={[1.98, 2.93, 0.04]} />
                    <meshStandardMaterial color="#18181b" roughness={0.7} />
                </mesh>
            </group>

            {/* ========================================================================= */}
            {/* 6. SET DRESSING & CLUTTER (Tires, Oil Cans, Sprockets, Burn Barrel)       */}
            {/* ========================================================================= */}

            {/* Corner 1: Stack of Worn Tires (X = 5.2, Z = 5.0) */}
            <group position={[5.2, 0, 5.0]}>
                {[0.24, 0.68, 1.12].map((ty, idx) => (
                    <mesh key={`tire_1_${idx}`} position={[0, ty, 0]} rotation={[Math.PI / 2, 0, idx * 0.4]}>
                        <torusGeometry args={[0.55, 0.22, 16, 28]} />
                        <meshStandardMaterial color="#141517" roughness={0.88} />
                    </mesh>
                ))}
            </group>

            {/* Corner 2: Stack of Worn Tires (X = -5.4, Z = 4.8) */}
            <group position={[-5.4, 0, 4.8]}>
                {[0.24, 0.68].map((ty, idx) => (
                    <mesh key={`tire_2_${idx}`} position={[0, ty, 0]} rotation={[Math.PI / 2, 0, idx * 0.6]}>
                        <torusGeometry args={[0.58, 0.24, 16, 28]} />
                        <meshStandardMaterial color="#17181a" roughness={0.88} />
                    </mesh>
                ))}
            </group>

            {/* Industrial Steel Sprockets leaning against walls */}
            <group position={[-6.7, 0.75, 2.5]} rotation={[0, 0, -0.15]}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[0.75, 0.75, 0.06, 24]} />
                    <meshStandardMaterial color="#64748b" roughness={0.35} metalness={0.9} />
                </mesh>
                {/* Center Hub Cutout */}
                <mesh rotation={[0, Math.PI / 2, 0]}>
                    <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.8} />
                </mesh>
            </group>

            {/* 55-Gallon Burn Drum in Corner with Roaring Fire (X = -5.0, Z = -4.5) */}
            <group position={[-5.0, 0, -4.5]}>
                {/* Corrugated Steel Drum */}
                <mesh position={[0, 0.65, 0]}>
                    <cylinderGeometry args={[0.55, 0.55, 1.3, 20]} />
                    <meshStandardMaterial color="#3b271d" roughness={0.7} metalness={0.5} />
                </mesh>
                {/* Animated Flame Mesh */}
                <group ref={flameMeshRef} position={[0, 1.45, 0]}>
                    <mesh>
                        <coneGeometry args={[0.35, 0.75, 8]} />
                        <meshStandardMaterial color="#ff5500" emissive="#ff4500" emissiveIntensity={3.0} />
                    </mesh>
                    <mesh position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, 0]}>
                        <coneGeometry args={[0.25, 0.65, 6]} />
                        <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={4.0} />
                    </mesh>
                </group>
            </group>

            {/* Stamped Red Tin 10W-40 Chain Oil Can & Glossy Oil Puddle */}
            <group position={[-1.6, 0, -2.6]}>
                {/* Oil Puddle on Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0.2, 0.006, 0.1]}>
                    <circleGeometry args={[0.55, 24]} />
                    <meshStandardMaterial color="#050505" roughness={0.04} metalness={0.92} />
                </mesh>
                {/* Tin Can Body */}
                <mesh position={[0, 0.22, 0]}>
                    <cylinderGeometry args={[0.16, 0.16, 0.44, 16]} />
                    <meshStandardMaterial color="#dc2626" roughness={0.35} metalness={0.3} />
                </mesh>
                {/* Copper Pouring Spout */}
                <mesh position={[0.08, 0.52, -0.06]} rotation={[-0.4, 0.4, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.32, 12]} />
                    <meshStandardMaterial color="#ea580c" roughness={0.25} metalness={0.85} />
                </mesh>
            </group>

            {/* Mechanics Wrench dropped on floor */}
            <group position={[1.8, 0.015, -2.2]} rotation={[0, 0.6, 0]}>
                <mesh>
                    <boxGeometry args={[0.05, 0.02, 0.45]} />
                    <meshStandardMaterial color="#e2e8f0" roughness={0.15} metalness={0.95} />
                </mesh>
            </group>

            {/* ========================================================================= */}
            {/* 7. CINEMATIC SOUNDSTAGE LIGHTING                                           */}
            {/* ========================================================================= */}
            {/* Crisp Ambient Soundstage Fill */}
            <ambientLight intensity={1.1} color="#94a3b8" />

            {/* Studio Key Light (Warm Overhead) */}
            <directionalLight position={[0, 16.0, 12.0]} intensity={1.8} color="#fffbeb" castShadow />

            {/* Studio Rim / Fill Light (Cool Cyan Tint) */}
            <directionalLight position={[-14.0, 10.0, -12.0]} intensity={1.2} color="#38bdf8" />

            {/* Overhead Workshop Pendant Lamp (Warm Tungsten) */}
            <pointLight position={[0, 5.2, 0]} color="#fff3cc" intensity={120.0} distance={20.0} decay={2} />
            <mesh position={[0, 5.45, 0]}>
                <coneGeometry args={[0.4, 0.35, 16]} />
                <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>

            {/* Electric Cyan CRT TV Screen Light (facing the couch) */}
            <pointLight
                ref={crtLightRef}
                position={[0, 1.55, -3.7]}
                color="#38bdf8"
                distance={12.0}
                decay={2}
                intensity={85.0}
            />

            {/* Burn Barrel Flickering Flame Light */}
            <pointLight
                ref={fireLightRef}
                position={[-5.0, 1.7, -4.5]}
                color="#ff6010"
                distance={14.0}
                decay={2}
                intensity={95.0}
            />
        </group>
    );
};

export default JunkyardWorld;
