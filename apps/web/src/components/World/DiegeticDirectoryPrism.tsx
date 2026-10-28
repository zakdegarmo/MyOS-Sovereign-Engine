import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { DesktopFile } from '../../hooks/useDesktopFiles';
import { CartridgeLockManager } from '../../engine/CartridgeLockManager';

export interface DiegeticDirectoryPrismProps {
    directory: DesktopFile;
    position?: [number, number, number];
    onClose: () => void;
    onDrillDirectory?: (path: string) => void;
    onDimensionSwap?: (dim: string) => void;
}

const FACE_WIDTH = 3.2;
const FACE_HEIGHT = 4.0; // Grand Doorway Arch Ratio (Bottom flush on floor plane Y=0)
const MAX_FACETS = 10;   // The 10-Pillar Ontological Decagon Invariant (Clamps radius to human scale)

// The 10 Sovereign Living Worlds of MyOS (The Primary Environment Portal)
export const SOVEREIGN_REALMS: DesktopFile[] = [
    { name: 'Sector 404: Printer Panic', path: 'realms/printer_panic', isDirectory: false, isShortcut: true, target: 'printer_panic' },
    { name: 'Glyphrider: Cyber Rail Racer', path: 'realms/glyphrider', isDirectory: false, isShortcut: true, target: 'glyphrider' },
    { name: 'Uniracers: Stunt Park', path: 'realms/uniracers_world', isDirectory: false, isShortcut: true, target: 'uniracers_world' },
    { name: '3D Filming Soundstage', path: 'realms/soundstage', isDirectory: false, isShortcut: true, target: 'soundstage' },
    { name: 'The Grand Cinema Theater', path: 'realms/cinema', isDirectory: false, isShortcut: true, target: 'cinema' },
    { name: 'Yawning Portal Tavern', path: 'realms/yawning_portal', isDirectory: false, isShortcut: true, target: 'yawning_portal' },
    { name: 'Undermountain Dungeon Delve', path: 'realms/undermountain', isDirectory: false, isShortcut: true, target: 'undermountain' },
    { name: 'Faerûn Open Wilderness', path: 'realms/astra_faerun', isDirectory: false, isShortcut: true, target: 'astra_faerun' },
    { name: 'Junkyard Scrap Field', path: 'realms/junkyard', isDirectory: false, isShortcut: true, target: 'junkyard' },
    { name: 'Cycle-Park Level Studio', path: 'realms/cycle_park', isDirectory: false, isShortcut: true, target: 'cycle_park' }
];

/**
 * Native Web Audio Synthesizer: Magical N64 Liquid Ripple & Windows Launch Chimes
 */
function playLiquidWarpChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Sparkling Pentatonic Liquid Portal Chord (C4, G4, C5, E5, G5, C6)
        const notes = [261.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            // Resonant Shimmer Liquid Sweep
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(350, now + idx * 0.07);
            filter.frequency.exponentialRampToValueAtTime(3800, now + idx * 0.07 + 0.65);
            filter.Q.value = 6.5;

            gain.gain.setValueAtTime(0, now + idx * 0.07);
            gain.gain.linearRampToValueAtTime(0.16, now + idx * 0.07 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 1.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.07);
            osc.stop(now + idx * 0.07 + 1.5);
        });
    } catch (_) {}
}

function playWindowsLaunchChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    } catch (_) {}
}

/**
 * Calculates dynamic radius R(N) for an N-sided prism clamped to max 10 facets (Radius <= 4.92m)
 */
function getDynamicRadius(totalFacets: number): number {
    const facets = Math.max(3, Math.min(MAX_FACETS, totalFacets));
    return (FACE_WIDTH / 2) / Math.tan(Math.PI / facets);
}

// Shader Material for Mario 64 Liquid Undulation on Portal Contact
const LiquidRippleShader = {
    uniforms: {
        uMap: { value: null },
        uTime: { value: 0 },
        uRippleIntensity: { value: 0 },
        uColor: { value: new THREE.Color('#00f0ff') }
    },
    vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uRippleIntensity;

        void main() {
            vUv = uv;
            vec3 pos = position;
            if (uRippleIntensity > 0.01) {
                float dist = length(uv - vec2(0.5, 0.5));
                float wave = sin(dist * 28.0 - uTime * 12.0) * exp(-dist * 2.2) * uRippleIntensity;
                pos.z += wave * 0.42;
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uTime;
        uniform float uRippleIntensity;
        uniform vec3 uColor;

        void main() {
            vec2 uv = vUv;
            float wave = 0.0;
            if (uRippleIntensity > 0.01) {
                float dist = length(uv - vec2(0.5, 0.5));
                wave = sin(dist * 28.0 - uTime * 12.0) * exp(-dist * 2.2) * uRippleIntensity;
                vec2 rippleOffset = vec2(cos(dist * 30.0 - uTime * 10.0), sin(dist * 30.0 - uTime * 10.0)) * 0.05 * uRippleIntensity;
                uv += rippleOffset;
            }
            vec4 tex = texture2D(uMap, uv);
            if (uRippleIntensity > 0.01) {
                tex.rgb += uColor * abs(wave) * 2.6;
            }
            gl_FragColor = tex;
        }
    `
};

/**
 * Individual 16:9 Portal Facet for a single child item inside the N-sided prism
 */
const DirectoryFacet: React.FC<{
    item: DesktopFile;
    index: number;
    totalFacets: number;
    globalIndex: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
    radius: number;
    isActive: boolean;
    isWarpingIn: boolean;
    rippleIntensity: number;
    onSelect: (index: number) => void;
    onEnter: (item: DesktopFile) => void;
}> = ({
    item, index, totalFacets, globalIndex, totalItems, currentPage, totalPages,
    radius, isActive, isWarpingIn, rippleIntensity, onSelect, onEnter
}) => {
    const angle = (index / totalFacets) * Math.PI * 2;
    const posX = Math.sin(angle) * radius;
    const posZ = Math.cos(angle) * radius;
    const rotY = angle;

    const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

    // Derived theme color
    const color = useMemo(() => {
        if (item.isDirectory) return '#00f0ff';
        const name = item.name.toLowerCase();
        if (name.includes('game') || name.includes('uniracer') || name.includes('glyphrider') || name.includes('printer') || name.includes('beatdown') || name.includes('soundstage') || name.includes('faerun')) return '#f59e0b';
        if (name.endsWith('.exe') || name.endsWith('.bat') || name.endsWith('.com')) return '#ef4444';
        if (name.endsWith('.txt') || name.endsWith('.md')) return '#3b82f6';
        return '#a855f7';
    }, [item]);

    // Helper for multi-line text wrapping with auto-scaling font size and chunking
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, startY: number, maxWidth: number, lineHeight: number, maxLines: number = 3) => {
        // Break camelCase and symbols while preserving readable chunks
        const cleaned = text.replace(/([a-z])([A-Z])/g, '$1 $2');
        const rawWords = cleaned.split(/\s+/);
        const words: string[] = [];
        for (const w of rawWords) {
            if (ctx.measureText(w).width > maxWidth) {
                let remaining = w;
                while (remaining.length > 0) {
                    let len = remaining.length;
                    while (len > 1 && ctx.measureText(remaining.slice(0, len)).width > maxWidth) {
                        len--;
                    }
                    words.push(remaining.slice(0, len));
                    remaining = remaining.slice(len);
                }
            } else {
                words.push(w);
            }
        }

        const lines: string[] = [];
        let cur = '';

        for (let i = 0; i < words.length; i++) {
            const test = cur ? `${cur} ${words[i]}` : words[i];
            if (ctx.measureText(test).width > maxWidth && cur) {
                lines.push(cur);
                cur = words[i];
                if (lines.length === maxLines - 1) {
                    const remaining = words.slice(i).join(' ');
                    let elText = remaining;
                    while (ctx.measureText(elText + '...').width > maxWidth && elText.length > 3) {
                        elText = elText.slice(0, -1);
                    }
                    lines.push(elText + '...');
                    cur = '';
                    break;
                }
            } else {
                cur = test;
            }
        }
        if (cur && lines.length < maxLines) lines.push(cur);

        const totalH = lines.length * lineHeight;
        const yOffset = startY - (totalH / 2) + (lineHeight / 2);
        lines.forEach((l, idx) => {
            ctx.fillText(l, x, yOffset + (idx * lineHeight));
        });
    };

    // Generate Grand Doorway canvas preview texture
    const texture = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1260;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const lowerName = item.name.toLowerCase();
        const ext = (item.extension || item.name.slice(item.name.lastIndexOf('.'))).toLowerCase();
        const isExe = ['.exe', '.com', '.bat', '.cmd', '.lnk', '.ps1'].includes(ext);
        const isGame = lowerName.includes('game') || lowerName.includes('uniracer') || lowerName.includes('glyphrider') || lowerName.includes('printer') || lowerName.includes('burban') || lowerName.includes('beatdown') || lowerName.includes('faerun') || lowerName.includes('soundstage') || lowerName.includes('tavern');
        const isCode = ['.ts', '.tsx', '.js', '.py', '.json', '.md', '.html', '.css'].includes(ext);

        // 1. Cybernetic Holographic Backdrop
        const bgGrad = ctx.createRadialGradient(540, 630, 80, 540, 630, 800);
        bgGrad.addColorStop(0, '#0c162d');
        bgGrad.addColorStop(0.5, '#060c18');
        bgGrad.addColorStop(1, '#020408');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1260);

        // 2. Cartesian Grid Matrix
        ctx.strokeStyle = `${color}20`;
        ctx.lineWidth = 1.5;
        for (let x = 0; x < 1080; x += 45) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1260);
            ctx.stroke();
        }
        for (let y = 0; y < 1260; y += 45) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1080, y);
            ctx.stroke();
        }

        // 3. Grand Doorway Arch Header
        ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
        ctx.fillRect(0, 0, 1080, 130);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 130);
        ctx.lineTo(1080, 130);
        ctx.stroke();

        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        const typeStr = item.isDirectory ? '📁 DIRECTORY MANIFOLD' : (isExe ? '⚡ WINDOWS EXECUTABLE' : (isGame ? '🎮 LIVING CARTRIDGE' : (isCode ? '📜 SOVEREIGN SOURCE' : '📜 SOVEREIGN ARTIFACT')));
        ctx.fillText(typeStr, 40, 80);
        ctx.shadowBlur = 0;

        ctx.font = 'bold 26px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'right';
        const pageLabel = totalPages > 1 ? ` (PG ${currentPage + 1}/${totalPages})` : '';
        ctx.fillText(`DOOR ${globalIndex + 1}/${totalItems}${pageLabel} ⬡`, 1040, 80);
        ctx.textAlign = 'left';

        // 4. Center Content Viewport Window (60, 160, 960, 910)
        ctx.fillStyle = 'rgba(3, 7, 18, 0.92)';
        ctx.strokeStyle = `${color}88`;
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 160, 960, 910);
        ctx.fillRect(60, 160, 960, 910);

        if (isExe) {
            // NATIVE WINDOWS EXECUTABLE SHOWCASE
            const exeGrad = ctx.createLinearGradient(60, 160, 60, 600);
            exeGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
            exeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = exeGrad;
            ctx.fillRect(60, 160, 960, 440);

            ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(120, 220, 840, 260);
            ctx.fillRect(120, 220, 840, 260);

            ctx.font = 'bold 110px monospace';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 20;
            ctx.fillText('⚡', 540, 360);
            ctx.shadowBlur = 0;

            ctx.font = 'bold 24px monospace';
            ctx.fillStyle = '#fca5a5';
            ctx.fillText('NATIVE OS BINARY // CLICK TO SPAWN', 540, 430);
        } else if (isGame) {
            // ARCADE / LIVING CARTRIDGE SHOWCASE
            const arcadeGrad = ctx.createLinearGradient(60, 160, 60, 600);
            arcadeGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
            arcadeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = arcadeGrad;
            ctx.fillRect(60, 160, 960, 440);

            ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(120, 220, 840, 260);
            ctx.fillRect(120, 220, 840, 260);

            ctx.font = 'bold 110px monospace';
            ctx.fillStyle = '#f59e0b';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 20;
            ctx.fillText('🎮', 540, 360);
            ctx.shadowBlur = 0;

            ctx.font = 'bold 24px monospace';
            ctx.fillStyle = '#fef08a';
            ctx.fillText('LIVING MYOS REALM // STEP IN TO WARP', 540, 430);

            ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
            for (let sy = 160; sy < 1070; sy += 8) {
                ctx.fillRect(60, sy, 960, 3);
            }
        } else if (item.isDirectory) {
            // DIRECTORY MANIFOLD BLUEPRINT
            const dirGrad = ctx.createRadialGradient(540, 420, 50, 540, 420, 320);
            dirGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
            dirGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = dirGrad;
            ctx.fillRect(60, 160, 960, 460);

            for (let r = 80; r <= 220; r += 45) {
                ctx.beginPath();
                ctx.arc(540, 420, r, 0, Math.PI * 2);
                ctx.strokeStyle = `${color}40`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.font = 'bold 110px monospace';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.shadowColor = color;
            ctx.shadowBlur = 25;
            ctx.fillText('⬡', 540, 460);
            ctx.shadowBlur = 0;

            ctx.font = 'bold 22px monospace';
            ctx.fillStyle = '#38bdf8';
            ctx.fillText('NESTED 3D PRISM HIERARCHY', 540, 520);
        } else {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.fillRect(100, 200, 880, 340);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 2;
            ctx.strokeRect(100, 200, 880, 340);

            ctx.font = 'bold 100px monospace';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText('📜', 540, 380);
        }

        // Title Box with Multi-Line Wrapping
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 12;

        const titleFontSize = item.name.length > 25 ? 36 : (item.name.length > 15 ? 44 : 52);
        ctx.font = `bold ${titleFontSize}px "Courier New", monospace`;
        wrapText(ctx, item.name, 540, 750, 860, titleFontSize * 1.25, 3);
        ctx.shadowBlur = 0;

        // Path Breadcrumb
        ctx.font = '22px monospace';
        ctx.fillStyle = '#94a3b8';
        const displayPath = item.path || 'Root Manifold';
        const truncPath = displayPath.length > 55 ? '...' + displayPath.slice(-50) : displayPath;
        ctx.fillText(truncPath, 540, 890);

        // Control Metadata Pill
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(240, 930, 600, 50);
        ctx.fillRect(240, 930, 600, 50);

        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(item.isDirectory ? '📁 DRILL IN [A]  |  ROTATE [Q/E]' : (isExe ? '⚡ LAUNCH EXE [A]  |  ROTATE [Q/E]' : '🎮 ENTER REALM [A]  |  ROTATE [Q/E]'), 540, 962);

        // 5. Action prompt bar (Floor Threshold Action)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.98)';
        ctx.fillRect(0, 1120, 1080, 140);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 1120);
        ctx.lineTo(1080, 1120);
        ctx.stroke();

        ctx.font = 'bold 32px monospace';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        const btnPrompt = item.isDirectory ? '⚡ CLICK OR PRESS [A] TO DRILL IN ⚡' : (isExe ? '⚡ CLICK OR PRESS [A] TO LAUNCH EXE ⚡' : '⚡ CLICK OR PRESS [A] TO ENTER REALM ⚡');
        ctx.fillText(btnPrompt, 540, 1205);
        ctx.shadowBlur = 0;

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }, [item, index, totalFacets, globalIndex, totalItems, currentPage, totalPages, color]);

    // Independent uniforms per facet so they never overwrite each other's texture
    const uniforms = useMemo(() => ({
        uMap: { value: texture },
        uTime: { value: 0 },
        uRippleIntensity: { value: 0 },
        uColor: { value: new THREE.Color(color) }
    }), [texture, color]);

    // Update shader uniforms
    useFrame((state) => {
        if (shaderMaterialRef.current) {
            shaderMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
            shaderMaterialRef.current.uniforms.uRippleIntensity.value = (isActive && isWarpingIn) ? rippleIntensity : 0;
            if (texture) shaderMaterialRef.current.uniforms.uMap.value = texture;
            shaderMaterialRef.current.uniforms.uColor.value.set(color);
        }
    });

    return (
        <group position={[posX, 0, posZ]} rotation={[0, rotY, 0]}>
            <mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(index);
                    onEnter(item);
                }}
                scale={isActive ? [1.04, 1.04, 1.04] : [1.0, 1.0, 1.0]}
            >
                <planeGeometry args={[FACE_WIDTH, FACE_HEIGHT, 32, 32]} />
                <shaderMaterial
                    ref={shaderMaterialRef}
                    attach="material"
                    uniforms={uniforms}
                    vertexShader={LiquidRippleShader.vertexShader}
                    fragmentShader={LiquidRippleShader.fragmentShader}
                    transparent
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Glowing Grand Doorway Arch Bezel */}
            <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[FACE_WIDTH + 0.2, FACE_HEIGHT + 0.2]} />
                <meshBasicMaterial
                    color={isActive ? color : '#1e293b'}
                    wireframe={!isActive}
                    transparent
                    opacity={isActive ? 0.95 : 0.35}
                />
            </mesh>

            {/* Ground Threshold Beam (Contacts floor plane at Y = 0) */}
            <mesh position={[0, -FACE_HEIGHT / 2, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[FACE_WIDTH + 0.4, 0.5]} />
                <meshBasicMaterial
                    color={isActive ? color : '#334155'}
                    transparent
                    opacity={isActive ? 0.95 : 0.45}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
};

/**
 * DiegeticDirectoryPrism: The dynamic N-faceted 3D geometry standing on the floor plane.
 */
export const DiegeticDirectoryPrism: React.FC<DiegeticDirectoryPrismProps> = ({
    directory,
    position = [0, 2.1, 0],
    onClose,
    onDrillDirectory,
    onDimensionSwap
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [children, setChildren] = useState<DesktopFile[]>([]);
    const [scaleProgress, setScaleProgress] = useState<number>(0);
    const [isWarpingIn, setIsWarpingIn] = useState<boolean>(false);
    const [rippleIntensity, setRippleIntensity] = useState<number>(0);
    const [flashOpacity, setFlashOpacity] = useState<number>(0);
    const [statusToast, setStatusToast] = useState<string | null>(null);

    const { camera } = useThree();
    const originalFovRef = useRef<number>((camera as any).fov || 60);

    // Human-scale Decagon: total slots clamped between 3 and MAX_FACETS (10)
    const totalSlots = Math.min(MAX_FACETS, Math.max(3, children.length));
    const radius = useMemo(() => getDynamicRadius(totalSlots), [totalSlots]);

    // Active item index
    const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

    const totalPages = Math.ceil(children.length / totalSlots) || 1;
    const currentPage = Math.floor(activeItemIndex / totalSlots);
    const pageStartIndex = currentPage * totalSlots;
    const activeSlot = activeItemIndex % totalSlots;

    // Fetch children for this directory or load SOVEREIGN_REALMS if this is the environment portal
    useEffect(() => {
        let active = true;

        const isRealmsPortal = directory.path === 'realms' ||
                               directory.name.toLowerCase().includes('realms') ||
                               directory.name.toLowerCase().includes('environment') ||
                               directory.name.toLowerCase().includes('worlds');

        if (isRealmsPortal) {
            setChildren(SOVEREIGN_REALMS);
            return;
        }

        const fetchChildren = async () => {
            const endpoints = [
                `/api/desktop/files?path=${encodeURIComponent(directory.path)}`,
                `http://localhost:8081/api/desktop/files?path=${encodeURIComponent(directory.path)}`
            ];
            for (const ep of endpoints) {
                try {
                    const res = await fetch(ep);
                    if (res.ok) {
                        const data = await res.json();
                        if (active && Array.isArray(data)) {
                            setChildren(data);
                            return;
                        }
                    }
                } catch (_) {}
            }
            if (active) {
                setChildren(SOVEREIGN_REALMS);
            }
        };

        fetchChildren();
        return () => { active = false; };
    }, [directory.path, directory.name]);

    // Visible items on the current 10-facet page
    const displayItems = useMemo(() => {
        if (children.length === 0) return [];
        const slice = children.slice(pageStartIndex, pageStartIndex + totalSlots);
        while (slice.length < totalSlots) {
            slice.push({
                name: 'VACANT MANIFOLD',
                path: '',
                isShortcut: false,
                isDirectory: false,
                target: null
            });
        }
        return slice;
    }, [children, pageStartIndex, totalSlots]);

    // Unfurl animation spring & Cinematic Mario 64 Dolly Zoom Camera
    useFrame((_, delta) => {
        setScaleProgress(prev => {
            if (prev < 1.0) return Math.min(1.0, prev + delta * 3.5);
            return 1.0;
        });

        if (groupRef.current) {
            const targetRotY = -(activeSlot / totalSlots) * Math.PI * 2;
            groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, delta * 8);
            groupRef.current.position.y = position[1];

            const currentScale = scaleProgress;
            groupRef.current.scale.set(currentScale, currentScale, currentScale);

            // MARIO 64 LIQUID WARP CAMERA & FOV DOLLY ZOOM
            if (isWarpingIn) {
                const targetCamX = groupRef.current.position.x;
                const targetCamY = position[1];
                const targetCamZ = groupRef.current.position.z + radius - 0.2; // Straight into the liquid threshold!

                camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 4.0);
                camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 4.0);
                camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 4.0);
                camera.lookAt(targetCamX, targetCamY, groupRef.current.position.z);

                // Tighten FOV for dramatic dolly warp (60 -> 26)
                if ((camera as any).fov) {
                    (camera as any).fov = THREE.MathUtils.lerp((camera as any).fov, 26, delta * 3.5);
                    (camera as any).updateProjectionMatrix();
                }
            } else if (scaleProgress > 0.3) {
                // Smoothly frame the active doorway facet so the user can clearly inspect each portal!
                const targetCamX = groupRef.current.position.x;
                const targetCamY = position[1] + 0.35;
                const targetCamZ = groupRef.current.position.z + radius + 4.2;

                camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, delta * 3.5);
                camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, delta * 3.5);
                camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, delta * 3.5);
                camera.lookAt(targetCamX, position[1], groupRef.current.position.z + radius);
            }
        }
    });

    // Cleanup camera FOV on unmount
    useEffect(() => {
        const origFov = originalFovRef.current;
        return () => {
            if ((camera as any).fov) {
                (camera as any).fov = origFov;
                (camera as any).updateProjectionMatrix();
            }
        };
    }, [camera]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'KeyE' || e.key === 'd' || e.key === 'D') {
                setActiveItemIndex(prev => (prev + 1) % Math.max(1, children.length));
            } else if (e.key === 'ArrowLeft' || e.key === 'KeyQ' || e.key === 'a' || e.key === 'A') {
                if ((e.target as HTMLElement)?.tagName !== 'INPUT') {
                    setActiveItemIndex(prev => (prev - 1 + children.length) % Math.max(1, children.length));
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (children[activeItemIndex]) {
                    handleEnterFacet(children[activeItemIndex]);
                }
            } else if (e.key === 'Escape') {
                e.stopPropagation();
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [children, activeItemIndex, onClose]);

    // Gamepad Navigation
    useEffect(() => {
        let lastStickX = 0;
        const interval = setInterval(() => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gp = gamepads[0] || gamepads[1];
            if (!gp) return;

            const stickX = gp.axes[0];
            if (stickX > 0.5 && lastStickX <= 0.5) {
                setActiveItemIndex(prev => (prev + 1) % Math.max(1, children.length));
            } else if (stickX < -0.5 && lastStickX >= -0.5) {
                setActiveItemIndex(prev => (prev - 1 + children.length) % Math.max(1, children.length));
            }
            lastStickX = stickX;

            if (gp.buttons[0]?.pressed && children[activeItemIndex]) {
                handleEnterFacet(children[activeItemIndex]);
            }
            if (gp.buttons[1]?.pressed) {
                onClose();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [children, activeItemIndex, onClose]);

    const handleEnterFacet = useCallback((item: DesktopFile) => {
        if (!item || !item.name || item.name === 'VACANT MANIFOLD') return;

        const nameLower = item.name.toLowerCase();
        const ext = (item.extension || item.name.slice(item.name.lastIndexOf('.'))).toLowerCase();
        const isExe = ['.exe', '.com', '.bat', '.cmd', '.lnk', '.ps1'].includes(ext);
        const isDoc = ['.pdf', '.txt', '.md', '.doc', '.docx', '.xlsx', '.png', '.jpg'].includes(ext);

        // 1. DIRECTORY DRILL-DOWN
        if (item.isDirectory) {
            playLiquidWarpChime();
            setIsWarpingIn(true);
            setRippleIntensity(1.0);
            window.dispatchEvent(new CustomEvent('myos:mario-walk-in', { detail: { target: item.name } }));

            setTimeout(() => {
                setIsWarpingIn(false);
                setRippleIntensity(0);
                if (onDrillDirectory) onDrillDirectory(item.path);
            }, 1200);
            return;
        }

        // 2. NATIVE WINDOWS EXECUTABLE OR DOCUMENT LAUNCH
        if (isExe || isDoc) {
            playWindowsLaunchChime();
            setStatusToast(`⚡ Launching native Windows binary: ${item.name}`);
            setTimeout(() => setStatusToast(null), 3500);

            console.log(`[DiegeticDirectoryPrism] Spawning native Windows asset: ${item.path}`);
            const endpoints = ['http://localhost:8081/api/win/launch', '/api/win/launch'];
            for (const ep of endpoints) {
                try {
                    fetch(ep, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ target: item.path })
                    }).catch(() => {});
                    break;
                } catch (_) {}
            }
            return;
        }

        // 3. LIVING MYOS REALM / ENVIRONMENT WARP
        let targetRealm: string | null = (item.target && typeof item.target === 'string') ? item.target : null;
        if (!targetRealm) {
            const realmMap: Record<string, string> = {
                'printer': 'printer_panic',
                'panic': 'printer_panic',
                'glyphrider': 'glyphrider',
                'uniracer': 'uniracers_world',
                'cinema': 'cinema',
                'theater': 'cinema',
                'soundstage': 'soundstage',
                'filmset': 'soundstage',
                'yawning': 'yawning_portal',
                'tavern': 'yawning_portal',
                'undermountain': 'undermountain',
                'dungeon': 'undermountain',
                'faerun': 'astra_faerun',
                'astra': 'astra_faerun',
                'junkyard': 'junkyard',
                'cycle': 'cycle_park',
                'park': 'cycle_park',
                'desktop': 'desktop'
            };
            for (const [key, id] of Object.entries(realmMap)) {
                if (nameLower.includes(key)) {
                    targetRealm = id;
                    break;
                }
            }
        }

        // If not a recognized MyOS realm, try opening natively on Windows rather than defaulting to printer_panic!
        if (!targetRealm) {
            playWindowsLaunchChime();
            setStatusToast(`Opening with default Windows handler: ${item.name}`);
            setTimeout(() => setStatusToast(null), 3000);
            fetch('http://localhost:8081/api/win/launch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: item.path })
            }).catch(() => {});
            return;
        }

        // --- FULL THEATRICAL MARIO 64 LIQUID WARP SEQUENCE (1.35 SECONDS) ---
        playLiquidWarpChime();
        setIsWarpingIn(true);
        setRippleIntensity(1.0);

        // Dispatch avatar kinematic walk-in
        window.dispatchEvent(new CustomEvent('myos:mario-walk-in', { detail: { target: item.name } }));

        // Flash of light at 1.05s
        setTimeout(() => {
            setFlashOpacity(1.0);
        }, 1050);

        // Swap dimension at 1.35s
        setTimeout(() => {
            setIsWarpingIn(false);
            setRippleIntensity(0);
            CartridgeLockManager.lockCartridge(targetRealm!, item.name);
            if (onDimensionSwap) onDimensionSwap(targetRealm!);
            window.dispatchEvent(new CustomEvent('myos_dimension_swap', { detail: targetRealm }));
        }, 1350);
    }, [onDrillDirectory, onDimensionSwap]);

    return (
        <group ref={groupRef} position={position}>
            {/* STATUS TOAST BILLBOARD */}
            {statusToast && (
                <Billboard position={[0, FACE_HEIGHT / 2 + 1.2, 0]}>
                    <Text fontSize={0.32} color="#facc15" outlineWidth={0.04} outlineColor="#000000" anchorX="center" anchorY="middle">
                        {statusToast}
                    </Text>
                </Billboard>
            )}

            {/* 1. Dynamic N-Faceted Polygon */}
            {displayItems.map((item, idx) => {
                const globalIdx = pageStartIndex + idx;
                return (
                    <DirectoryFacet
                        key={item.path || `slot-${currentPage}-${idx}`}
                        item={item}
                        index={idx}
                        totalFacets={totalSlots}
                        globalIndex={globalIdx}
                        totalItems={children.length}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        radius={radius}
                        isActive={idx === activeSlot}
                        isWarpingIn={isWarpingIn}
                        rippleIntensity={rippleIntensity}
                        onSelect={(clickedSlot) => {
                            setActiveItemIndex(pageStartIndex + clickedSlot);
                        }}
                        onEnter={handleEnterFacet}
                    />
                );
            })}

            {/* 2. Top & Bottom N-Sided Energy Rings */}
            <mesh position={[0, FACE_HEIGHT / 2 + 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.1, radius + 0.16, Math.max(totalSlots, 16)]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -FACE_HEIGHT / 2 - 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius - 0.1, radius + 0.16, Math.max(totalSlots, 16)]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* 3. Glowing Ontological Core */}
            <mesh position={[0, 0, 0]}>
                <octahedronGeometry args={[0.75]} />
                <meshStandardMaterial
                    color="#ffffff"
                    emissive="#00f0ff"
                    emissiveIntensity={1.8}
                    wireframe
                    transparent
                    opacity={0.6}
                />
            </mesh>
            <pointLight position={[0, 0, 0]} intensity={12} distance={radius * 2.2} color="#00f0ff" />

            {/* 4. Arch Keystone Close Button */}
            <Billboard follow lockX={false} lockY={false} lockZ={false} position={[0, FACE_HEIGHT / 2 + 0.6, 0]}>
                <mesh
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
                    onPointerOut={() => { document.body.style.cursor = 'auto'; }}
                >
                    <boxGeometry args={[3.2, 0.7, 0.1]} />
                    <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
                </mesh>
                <Text position={[0, 0, 0.08]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
                    [ ✕ RETURN TO DESKTOP (ESC) ]
                </Text>
            </Billboard>

            {/* 5. CINEMATIC RADIAL BLOOM FLASH OVERLAY */}
            {flashOpacity > 0 && (
                <Billboard position={[0, 0, radius - 0.4]}>
                    <mesh>
                        <planeGeometry args={[14, 14]} />
                        <meshBasicMaterial color="#ffffff" transparent opacity={flashOpacity} depthTest={false} />
                    </mesh>
                </Billboard>
            )}
        </group>
    );
};
