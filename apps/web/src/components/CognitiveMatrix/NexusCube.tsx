import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { NexusContainer } from '../Shared/NexusContainer';
import type { GemId } from '../../Omni/types';
import { subscribeNeuralEvents, type MyOsNeuralEvent, getRecentNeuralEvents } from '../../engine/neuralEventBus';

// ============================================================================
// 1. THE 10 TOPOLOGICAL PILLARS (MYOS ONTOLOGY)
// ============================================================================
export interface PillarDef {
    index: number;
    id: GemId;
    name: string;
    glyph: string;
    color: string;
    hex: number;
    role: string;
}

export const NEXUS_PILLARS: PillarDef[] = [
    { index: 0, id: 'Self',          name: 'Self',          glyph: '◉', color: '#f43f5e', hex: 0xf43f5e, role: 'Core Identity & Sovereign Observer' },
    { index: 1, id: 'Thought',       name: 'Thought',       glyph: '✧', color: '#fbbf24', hex: 0xfbbf24, role: 'Recursive Ideation & Latent Exploration' },
    { index: 2, id: 'Logic',         name: 'Logic',         glyph: '∴', color: '#3b82f6', hex: 0x3b82f6, role: 'Axiomatic Foundation & Governance' },
    { index: 3, id: 'Unity',         name: 'Unity',         glyph: '⚭', color: '#10b981', hex: 0x10b981, role: 'Holistic Synthesis & Convergence' },
    { index: 4, id: 'Existence',     name: 'Existence',     glyph: '⬡', color: '#8b5cf6', hex: 0x8b5cf6, role: 'Tangible Manifestation & Base Truth' },
    { index: 5, id: 'Improvement',   name: 'Improvement',   glyph: '⇈', color: '#f97316', hex: 0xf97316, role: 'Continuous Self-Refinement & Evolution' },
    { index: 6, id: 'Mastery',       name: 'Mastery',       glyph: '❂', color: '#ef4444', hex: 0xef4444, role: 'Sovereign Capability & Execution' },
    { index: 7, id: 'Resonance',     name: 'Resonance',     glyph: '∿', color: '#ec4899', hex: 0xec4899, role: 'Sympathetic Vibration & Affinity' },
    { index: 8, id: 'Transcendence', name: 'Transcendence', glyph: '⍟', color: '#a855f7', hex: 0xa855f7, role: 'Paradigm Leaps & Horizon Ascendance' },
    { index: 9, id: 'Omni',          name: 'Omniscience',   glyph: '۞', color: '#38bdf8', hex: 0x38bdf8, role: 'Totality & Complete Latent Awareness' },
];

// UTF-8 Hex Byte Decoder for MyOS-Cortex tokenizer quirk discovered in 1hr test
export function decodeCortexUtf8Hex(raw: string): string {
    return raw
        .replace(/<0xE2><0xAC><0xA1>/gi, '⬡')
        .replace(/<0xE2><0x87><0x88>/gi, '⇈')
        .replace(/<0xE2><0x88><0xBF>/gi, '∿')
        .replace(/<0xE2><0x8D><0x9F>/gi, '⍟')
        .replace(/<0xE2><0x97><0x89>/gi, '◉')
        .replace(/<0xE2><0x9C><0xA7>/gi, '✧')
        .replace(/<0xE2><0x88><0xB4>/gi, '∴')
        .replace(/<0xE2><0x9A><0xAD>/gi, '⚭')
        .replace(/<0xE2><0x9D><0x82>/gi, '❂')
        .replace(/<0xDB><0x9E>/gi, '۞');
}

// ============================================================================
// 2. JIT PROCEDURAL GLSL SHADER PRESETS FOR PRISM FACES & CORTEX TILES
// ============================================================================
const JIT_SHADERS: Record<string, { name: string; color: string; fragment: string }> = {
    aurora: {
        name: 'Arctic Aurora Wave',
        color: '#2dd4bf',
        fragment: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
                vec2 uv = vUv;
                float wave1 = sin(uv.x * 8.0 + uTime * 1.8) * 0.5 + 0.5;
                float wave2 = cos(uv.y * 6.0 - uTime * 1.3 + uv.x * 4.0) * 0.5 + 0.5;
                float aurora = smoothstep(0.2, 0.85, wave1 * wave2);
                vec3 col = mix(vec3(0.02, 0.06, 0.15), vec3(0.08, 0.85, 0.72), aurora);
                col += vec3(0.45, 0.2, 0.95) * pow(wave2, 3.0) * 0.45;
                gl_FragColor = vec4(col, 0.88);
            }
        `
    },
    cyber: {
        name: 'Neon Cyber Chasm',
        color: '#c084fc',
        fragment: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
                vec2 p = vUv * 2.0 - 1.0;
                float r = length(p);
                float a = atan(p.y, p.x);
                float grid = abs(sin(r * 14.0 - uTime * 3.0)) * abs(cos(a * 8.0 + uTime));
                vec3 col = mix(vec3(0.05, 0.01, 0.12), vec3(0.85, 0.25, 1.0), smoothstep(0.65, 0.98, grid));
                col += vec3(0.1, 0.75, 1.0) * (0.15 / (r + 0.15));
                gl_FragColor = vec4(col, 0.88);
            }
        `
    },
    synapse: {
        name: 'Bioluminescent Synapse Field',
        color: '#38bdf8',
        fragment: `
            uniform float uTime;
            varying vec2 vUv;
            void main() {
                vec2 uv = vUv * 2.0 - 1.0;
                float d = length(uv);
                float rings = sin(d * 18.0 - uTime * 4.2) * cos(uv.x * 10.0 + uTime) * sin(uv.y * 10.0 - uTime);
                vec3 base = vec3(0.01, 0.04, 0.10);
                vec3 glow = mix(vec3(0.15, 0.75, 0.98), vec3(0.96, 0.25, 0.55), sin(uTime * 0.7) * 0.5 + 0.5);
                vec3 col = base + glow * smoothstep(0.15, 0.85, abs(rings)) + vec3(0.4, 0.9, 1.0) * exp(-d * 3.5);
                gl_FragColor = vec4(col, 0.90);
            }
        `
    }
};

const VERTEX_SHADER = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export interface PinnedMemoryNode {
    id: string;
    address: string;
    pillarIdx: number;
    factorIdx: number;
    depth: number;
    summary: string;
    prompt: string;
    hopsBefore: number;
    hopsAfter: number;
    timestamp: string;
}

interface NexusCubeProps {
    onClose?: () => void;
}

export const NexusCube: React.FC<NexusCubeProps> = ({ onClose }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    // ========================================================================
    // OUTER HYPER-DECAGONAL PRISM STATE (WINDOW & NEXUSCONTAINER MANAGER)
    // ========================================================================
    const [activeFaceIdx, setActiveFaceIdx] = useState<number>(0); // 0..9 (10 Pillars)
    const [semanticPath, setSemanticPath] = useState<GemId[]>(['Self']); // D0=['Self'], D1=['Self','Thought'], etc.
    const [isLockedIn, setIsLockedIn] = useState<boolean>(false); // Spacebar Lock-In mounts live React <NexusContainer />
    const [prismGlassMode, setPrismGlassMode] = useState<'normal' | 'translucent' | 'hidden'>('normal');
    const [gluedFaces, setGluedFaces] = useState<Record<number, string>>({});
    const [activeFaceShader, setActiveFaceShader] = useState<Record<number, string>>({});

    // ========================================================================
    // INNER BIOLUMINESCENT RUBIK'S CORTEX STATE (THOUGHT & NEURON VISUALIZER)
    // ========================================================================
    const [shellDensity, setShellDensity] = useState<number>(9); // Outer mesh N×N (3 to 10, default 9 for 1-3-9 Russian doll)
    const [isExploded, setIsExploded] = useState<boolean>(false);
    const [showGlyphs, setShowGlyphs] = useState<boolean>(true);
    const [activeDominantPillars, setActiveDominantPillars] = useState<number[]>([0, 1, 2]);
    const [hopMetrics, setHopMetrics] = useState<{ before: number; after: number; sliceMoves: string[] }>({
        before: 6,
        after: 2,
        sliceMoves: ['Slice-Y(+1) 90°', 'Slice-X(0) -90°']
    });
    const [firingNeuronCount, setFiringNeuronCount] = useState<number>(42);

    // ========================================================================
    // AI STREAMING & HUMAN FAILSAFE STATE
    // ========================================================================
    const [humanFailsafeLocked, setHumanFailsafeLocked] = useState<boolean>(false);
    const [promptInput, setPromptInput] = useState<string>('');
    const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
    const [copiedToast, setCopiedToast] = useState<boolean>(false);
    const [isThinking, setIsThinking] = useState<boolean>(false);
    const [streamingTelemetry, setStreamingTelemetry] = useState<string>('[Dominant: Self ◉, Thought ✧, Logic ∴] Ready for real-time neural streaming.');
    const [streamingSynthesis, setStreamingSynthesis] = useState<string>(
        'Welcome to NexusCube. Outer 10-sided Russian-Doll Hyper-Decagonal Prism manages your 10 Pillar workspaces & NestedDocks. Inner Bioluminescent Glass-Mesh Rubik\'s Cortex visualizes live neurons firing and twists slices to minimize node hops as MyOS-Cortex thinks.'
    );
    const [pinnedMemories, setPinnedMemories] = useState<PinnedMemoryNode[]>([
        {
            id: 'mem-init',
            address: 'FSG://1.2.3 [Self ◉ → Thought ✧ → Logic ∴]',
            pillarIdx: 0,
            factorIdx: 1,
            depth: 1,
            summary: 'Initial Sovereign Anchor: 10-Sided Prism + 1-3-9 Rubik\'s Parallax Cortex initialized.',
            prompt: 'System Boot Initialization',
            hopsBefore: 6,
            hopsAfter: 2,
            timestamp: new Date().toLocaleTimeString()
        }
    ]);
    const [liveEventLog, setLiveEventLog] = useState<MyOsNeuralEvent[]>(() => getRecentNeuralEvents());

    // Refs for mutable access inside 60fps requestAnimationFrame loop
    const stateRef = useRef({
        activeFaceIdx: 0,
        targetYaw: 0,
        currentYaw: 0,
        depthLevel: 0, // 0 = D0, 1 = D1, 2 = D2
        depthLerp: 0,
        isLockedIn: false,
        prismGlassMode: 'normal' as 'normal' | 'translucent' | 'hidden',
        isThinking: false,
        isExploded: false,
        explodeLerp: 0,
        showGlyphs: true,
        humanFailsafeLocked: false,
        shellDensity: 9,
        activeDominantPillars: [0, 1, 2],
        orbitTheta: 0.0,
        orbitPhi: 1.38,
        orbitRadius: 11.5,
        mouseOmega: 0,
        // Extrude / Implode animation
        extrudeState: 'STABLE_3D' as 'EXTRUDE_1D' | 'EXTRUDE_2D' | 'EXTRUDE_3D' | 'STABLE_3D' | 'COLLAPSE',
        extrudeProgress: 1.0,
    });

    useEffect(() => {
        stateRef.current.activeFaceIdx = activeFaceIdx;
        // 10 faces: each face is 36 degrees (2*PI / 10)
        stateRef.current.targetYaw = -activeFaceIdx * ((Math.PI * 2) / 10);
    }, [activeFaceIdx]);

    useEffect(() => {
        stateRef.current.depthLevel = Math.max(0, semanticPath.length - 1);
    }, [semanticPath]);

    useEffect(() => {
        stateRef.current.isLockedIn = isLockedIn;
    }, [isLockedIn]);

    useEffect(() => {
        stateRef.current.prismGlassMode = prismGlassMode;
    }, [prismGlassMode]);

    useEffect(() => {
        stateRef.current.isThinking = isThinking;
    }, [isThinking]);

    useEffect(() => {
        stateRef.current.isExploded = isExploded;
    }, [isExploded]);

    useEffect(() => {
        stateRef.current.showGlyphs = showGlyphs;
    }, [showGlyphs]);

    useEffect(() => {
        stateRef.current.humanFailsafeLocked = humanFailsafeLocked;
    }, [humanFailsafeLocked]);

    useEffect(() => {
        stateRef.current.activeDominantPillars = activeDominantPillars;
    }, [activeDominantPillars]);

    // Exposed imperative triggers for Three.js scene
    const sceneApiRef = useRef<{
        triggerRubikSliceTwist: (axis: 'x' | 'y' | 'z', layerIdx: number, dir: number) => void;
        triggerNeuralBurst: (pillars: number[]) => void;
        triggerVoxelEvent?: (event: MyOsNeuralEvent) => void;
        rebuildInnerShells: (outerN: number) => void;
        updatePrismFaceTextures: (path: GemId[]) => void;
        glueAppToCurrentFace: (faceIdx: number) => Promise<void>;
        applyShaderToFace: (faceIdx: number, shaderKey: string | null) => void;
        triggerExtrude: () => void;
        triggerImplode: () => void;
    } | null>(null);

    // Live subscription to global MyOS Neural Event Bus
    useEffect(() => {
        const unsubscribe = subscribeNeuralEvents((evt) => {
            setLiveEventLog(prev => [evt, ...prev.slice(0, 24)]);
            sceneApiRef.current?.triggerVoxelEvent?.(evt);
        });
        return unsubscribe;
    }, []);

    const abortControllerRef = useRef<AbortController | null>(null);

    // ========================================================================
    // RUSSIAN-DOLL PRISM NAVIGATION HANDLERS
    // ========================================================================
    const selectPillarFace = useCallback((faceIdx: number) => {
        const normalized = ((faceIdx % 10) + 10) % 10;
        setActiveFaceIdx(normalized);
        const pillarId = NEXUS_PILLARS[normalized].id;
        setSemanticPath(prev => {
            const copy = [...prev];
            copy[copy.length - 1] = pillarId;
            return copy;
        });
    }, []);

    // Clicking a button on the NestedDock drills down (W+1) into the next Russian-doll prism depth
    // and rotates the 10-sided prism to align with that sub-pillar's face!
    const drillDownNestedDock = useCallback((subPillarIdx: number) => {
        const targetPillar = NEXUS_PILLARS[subPillarIdx];
        if (!targetPillar) return;

        // If currently Locked-In to DOM, briefly unlock so user sees the 3D Russian-doll dive & spin!
        if (stateRef.current.isLockedIn) {
            setIsLockedIn(false);
        }

        setSemanticPath(prev => {
            const nextPath = [...prev, targetPillar.id];
            setTimeout(() => sceneApiRef.current?.updatePrismFaceTextures(nextPath), 20);
            return nextPath;
        });
        setActiveFaceIdx(subPillarIdx);
        stateRef.current.mouseOmega = 1.6; // kinetic dolly kick for dramatic dive
        sceneApiRef.current?.triggerNeuralBurst([activeFaceIdx, subPillarIdx]);
        sceneApiRef.current?.triggerRubikSliceTwist(
            subPillarIdx % 3 === 0 ? 'x' : subPillarIdx % 3 === 1 ? 'y' : 'z',
            (subPillarIdx % 3) - 1,
            subPillarIdx % 2 === 0 ? 1 : -1
        );
    }, [activeFaceIdx]);

    const ascendRussianDollDepth = useCallback(() => {
        setSemanticPath(prev => {
            if (prev.length <= 1) return prev;
            const nextPath = prev.slice(0, -1);
            const topGem = nextPath[nextPath.length - 1];
            const foundIdx = NEXUS_PILLARS.findIndex(p => p.id === topGem);
            if (foundIdx !== -1) setActiveFaceIdx(foundIdx);
            setTimeout(() => sceneApiRef.current?.updatePrismFaceTextures(nextPath), 20);
            return nextPath;
        });
        stateRef.current.mouseOmega = 1.2;
    }, []);

    // ========================================================================
    // THREE.JS SCENE INITIALIZATION (10-SIDED PRISM + BIOLUMINESCENT RUBIK BRAIN)
    // ========================================================================
    useEffect(() => {
        const container = mountRef.current;
        if (!container) return;

        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x03020a);
        scene.fog = new THREE.FogExp2(0x03020a, 0.028);

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
        camera.position.set(0, 1.5, 11.5);

        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        // Lighting
        scene.add(new THREE.AmbientLight(0xdbeafe, 0.85));
        const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.8);
        dirLight1.position.set(8, 14, 10);
        scene.add(dirLight1);
        const dirLight2 = new THREE.DirectionalLight(0xc084fc, 1.4);
        dirLight2.position.set(-8, -10, -8);
        scene.add(dirLight2);
        const corePointLight = new THREE.PointLight(0x38bdf8, 3.2, 12);
        corePointLight.position.set(0, 0, 0);
        scene.add(corePointLight);

        // Subtle Floor Reference Grid
        const floorGrid = new THREE.GridHelper(60, 60, 0x1e293b, 0x0f172a);
        floorGrid.position.y = -4.2;
        scene.add(floorGrid);

        // Master Root Group (rotates with currentYaw for 10-sided prism alignment)
        const masterPrismGroup = new THREE.Group();
        scene.add(masterPrismGroup);

        // ====================================================================
        // PART A: OUTER 10-SIDED RUSSIAN-DOLL HYPER-DECAGONAL PRISM
        // ====================================================================
        // A regular decagon has 10 faces: each subtends 36 deg (PI/5).
        // Apothem R_apothem = distance from center to face center.
        // Face width W = 2 * R_apothem * tan(PI / 10).
        const PRISM_APOTHEM = 4.25;
        const PRISM_FACE_WIDTH = 2 * PRISM_APOTHEM * Math.tan(Math.PI / 10); // ~2.76
        const PRISM_HEIGHT = 3.6;

        const outerPrismShellGroup = new THREE.Group();
        masterPrismGroup.add(outerPrismShellGroup);

        // Inner Russian-Doll Prism Preview Shell (D1 Nested Prism)
        const innerPrismShellGroup = new THREE.Group();
        innerPrismShellGroup.scale.set(0.62, 0.62, 0.62);
        masterPrismGroup.add(innerPrismShellGroup);

        // Store face materials & canvas textures for the 10 Pillar faces
        const faceMaterials: THREE.Material[] = [];
        const faceMeshes: THREE.Mesh[] = [];
        const shaderUniformsList: { uTime: { value: number } }[] = [];

        function createDecagonFaceTexture(pillar: PillarDef, currentPath: GemId[]): THREE.CanvasTexture {
            const c = document.createElement('canvas');
            c.width = 768;
            c.height = 960;
            const ctx = c.getContext('2d')!;

            // Deep translucent-style dark slate background
            const grad = ctx.createLinearGradient(0, 0, 0, 960);
            grad.addColorStop(0, '#090d1a');
            grad.addColorStop(0.5, '#0f172a');
            grad.addColorStop(1, '#060913');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 768, 960);

            // Outer glowing border in Pillar color
            ctx.strokeStyle = pillar.color;
            ctx.lineWidth = 8;
            ctx.strokeRect(8, 8, 752, 944);

            // Top Header Bar (FSG Semantic Address + Depth)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.fillRect(12, 12, 744, 88);
            ctx.strokeStyle = 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 2;
            ctx.strokeRect(12, 12, 744, 88);

            const depthIdx = Math.max(0, currentPath.length - 1);
            const pathStr = [...currentPath.slice(0, -1), pillar.id].join(' → ');
            ctx.fillStyle = pillar.color;
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`DEPTH D${depthIdx} // FACE ${pillar.index + 1}/10`, 28, 46);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px monospace';
            ctx.fillText(`FSG://${pathStr}`, 28, 78);

            // Left-Side NestedDock Strip drawn directly on the face (and clickable via Raycaster UV!)
            ctx.fillStyle = 'rgba(6, 10, 22, 0.92)';
            ctx.fillRect(20, 116, 86, 816);
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
            ctx.lineWidth = 2;
            ctx.strokeRect(20, 116, 86, 816);

            NEXUS_PILLARS.forEach((subP, idx) => {
                const by = 130 + idx * 79;
                ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
                ctx.fillRect(28, by, 70, 68);
                ctx.strokeStyle = subP.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(28, by, 70, 68);

                ctx.fillStyle = subP.color;
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(subP.glyph, 63, by + 38);

                ctx.fillStyle = '#cbd5e1';
                ctx.font = 'bold 10px monospace';
                ctx.fillText(subP.name.slice(0, 7).toUpperCase(), 63, by + 58);
            });

            // Main Workspace Content Area (Right of NestedDock)
            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 2;
            ctx.strokeRect(120, 116, 628, 816);

            // Giant Watermark Glyph
            ctx.fillStyle = pillar.color + '22';
            ctx.font = 'bold 240px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(pillar.glyph, 434, 520);

            // Main Title & Role
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 34px monospace';
            ctx.fillText(`${pillar.glyph} ${pillar.name.toUpperCase()}`, 434, 280);

            ctx.fillStyle = pillar.color;
            ctx.font = '18px monospace';
            ctx.fillText(pillar.role, 434, 325);

            // Instructions Card
            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.fillRect(154, 600, 560, 210);
            ctx.strokeStyle = pillar.color + '66';
            ctx.strokeRect(154, 600, 560, 210);

            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('RUSSIAN-DOLL NEXUS HYPER-PRISM', 434, 642);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '15px monospace';
            ctx.fillText('• Click any NestedDock icon on left to Dive (W+1)', 434, 682);
            ctx.fillText('• Press [SPACEBAR] to Lock-In Live React DOM', 434, 714);
            ctx.fillText('• Click "📎 Glue App" to mirror a Windows program', 434, 746);
            ctx.fillText('• Inner Rubik\'s Cortex visible through glass core', 434, 778);

            const tex = new THREE.CanvasTexture(c);
            tex.needsUpdate = true;
            return tex;
        }

        // Build the 10 Rectangular Faces of the Outer Hyper-Decagonal Prism
        NEXUS_PILLARS.forEach((pillar, i) => {
            const angle = i * ((Math.PI * 2) / 10);
            const tex = createDecagonFaceTexture(pillar, ['Self']);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.2,
                metalness: 0.15,
                transparent: true,
                opacity: 0.78,
                side: THREE.DoubleSide
            });
            faceMaterials.push(mat);

            const faceGeo = new THREE.PlaneGeometry(PRISM_FACE_WIDTH * 0.98, PRISM_HEIGHT);
            const faceMesh = new THREE.Mesh(faceGeo, mat);
            faceMesh.position.set(
                Math.sin(angle) * PRISM_APOTHEM,
                0,
                Math.cos(angle) * PRISM_APOTHEM
            );
            faceMesh.rotation.y = angle;
            faceMesh.userData = { isPrismFace: true, faceIdx: i };
            outerPrismShellGroup.add(faceMesh);
            faceMeshes.push(faceMesh);

            // Neon edge frame for each rectangular face
            const edgeGeo = new THREE.EdgesGeometry(faceGeo);
            const edgeMat = new THREE.LineBasicMaterial({ color: pillar.hex, transparent: true, opacity: 0.75 });
            faceMesh.add(new THREE.LineSegments(edgeGeo, edgeMat));

            // Inner Russian-Doll D1 Face Wireframe
            const innerFaceMesh = new THREE.LineSegments(
                edgeGeo,
                new THREE.LineBasicMaterial({ color: pillar.hex, transparent: true, opacity: 0.28 })
            );
            innerFaceMesh.position.copy(faceMesh.position);
            innerFaceMesh.rotation.copy(faceMesh.rotation);
            innerPrismShellGroup.add(innerFaceMesh);
        });

        // Top & Bottom Decagonal Caps + 4D Schlegel Struts connecting Outer & Inner Prisms
        const circumRadius = PRISM_APOTHEM / Math.cos(Math.PI / 10);
        const capPointsTop: THREE.Vector3[] = [];
        const capPointsBot: THREE.Vector3[] = [];
        const schlegelPositions: number[] = [];

        for (let i = 0; i < 10; i++) {
            const cornerAngle = (i + 0.5) * ((Math.PI * 2) / 10);
            const x = Math.sin(cornerAngle) * circumRadius;
            const z = Math.cos(cornerAngle) * circumRadius;
            const topV = new THREE.Vector3(x, PRISM_HEIGHT / 2, z);
            const botV = new THREE.Vector3(x, -PRISM_HEIGHT / 2, z);
            capPointsTop.push(topV);
            capPointsBot.push(botV);

            // 4D Schlegel diagonal struts from Outer Decagon vertices to Inner Russian-Doll Decagon vertices
            schlegelPositions.push(topV.x, topV.y, topV.z, topV.x * 0.62, topV.y * 0.62, topV.z * 0.62);
            schlegelPositions.push(botV.x, botV.y, botV.z, botV.x * 0.62, botV.y * 0.62, botV.z * 0.62);
        }
        capPointsTop.push(capPointsTop[0].clone());
        capPointsBot.push(capPointsBot[0].clone());

        const capLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
        outerPrismShellGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(capPointsTop), capLineMat));
        outerPrismShellGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(capPointsBot), capLineMat));

        const schlegelGeo = new THREE.BufferGeometry();
        schlegelGeo.setAttribute('position', new THREE.Float32BufferAttribute(schlegelPositions, 3));
        const schlegelLines = new THREE.LineSegments(
            schlegelGeo,
            new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.45 })
        );
        masterPrismGroup.add(schlegelLines);

        // ====================================================================
        // PART B: INNER BIOLUMINESCENT GLASS-MESH RUBIK'S CORTEX (1x1, 3x3, 9x9)
        // ====================================================================
        // Lives suspended inside the center of the 10-sided Hyper-Prism!
        const rubikBrainRoot = new THREE.Group();
        scene.add(rubikBrainRoot);

        const shellsContainer = new THREE.Group();
        rubikBrainRoot.add(shellsContainer);

        const neuralNetworkGroup = new THREE.Group();
        rubikBrainRoot.add(neuralNetworkGroup);

        // Cache glyph sprite textures for each Pillar
        const glyphTextures: Record<number, THREE.CanvasTexture> = {};
        NEXUS_PILLARS.forEach(p => {
            const c = document.createElement('canvas');
            c.width = 128;
            c.height = 128;
            const ctx = c.getContext('2d')!;
            ctx.clearRect(0, 0, 128, 128);
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 18;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 74px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.glyph, 64, 64);
            glyphTextures[p.index] = new THREE.CanvasTexture(c);
        });

        interface SquareTileNode {
            mesh: THREE.Mesh;
            shellIndex: number; // 0 = 1x1 Core, 1 = 3x3 Mid, 2 = N×N Outer
            basePos: THREE.Vector3;
            normal: THREE.Vector3;
            gridCoord: THREE.Vector3; // normalized -1..1 for Rubik slice selection
            pillarIdx: number;
            factorIdx: number;
            glyphSprite?: THREE.Sprite;
            pulseIntensity: number;
        }

        let allSquareTiles: SquareTileNode[] = [];
        let glyphSpritesList: THREE.Sprite[] = [];

        // Build the 3 Concentric Translucent Square-Mesh Shells (1x1 Core, 3x3 Mid, N×N Outer)
        function buildConcentricSquareMeshShells(outerN: number) {
            while (shellsContainer.children.length > 0) {
                shellsContainer.remove(shellsContainer.children[0]);
            }
            allSquareTiles = [];
            glyphSpritesList = [];

            const shellConfigs = [
                { shellIdx: 0, gridN: 1, halfSize: 0.45, baseOpacity: 0.55, borderOpacity: 0.9 },
                { shellIdx: 1, gridN: 3, halfSize: 1.15, baseOpacity: 0.28, borderOpacity: 0.65 },
                { shellIdx: 2, gridN: outerN, halfSize: 2.05, baseOpacity: 0.18, borderOpacity: 0.48 },
            ];

            const faceNormals = [
                { normal: new THREE.Vector3(0, 0, 1),  uAxis: new THREE.Vector3(1, 0, 0),  vAxis: new THREE.Vector3(0, 1, 0) },
                { normal: new THREE.Vector3(0, 0, -1), uAxis: new THREE.Vector3(-1, 0, 0), vAxis: new THREE.Vector3(0, 1, 0) },
                { normal: new THREE.Vector3(1, 0, 0),  uAxis: new THREE.Vector3(0, 0, -1), vAxis: new THREE.Vector3(0, 1, 0) },
                { normal: new THREE.Vector3(-1, 0, 0), uAxis: new THREE.Vector3(0, 0, 1),  vAxis: new THREE.Vector3(0, 1, 0) },
                { normal: new THREE.Vector3(0, 1, 0),  uAxis: new THREE.Vector3(1, 0, 0),  vAxis: new THREE.Vector3(0, 0, -1) },
                { normal: new THREE.Vector3(0, -1, 0), uAxis: new THREE.Vector3(1, 0, 0),  vAxis: new THREE.Vector3(0, 0, 1) },
            ];

            shellConfigs.forEach(cfg => {
                const { shellIdx, gridN, halfSize, baseOpacity, borderOpacity } = cfg;
                const step = (halfSize * 2) / gridN;
                const tileWidth = step * 0.86;
                const tileGeo = new THREE.PlaneGeometry(tileWidth, tileWidth);
                const edgeGeo = new THREE.EdgesGeometry(tileGeo);

                faceNormals.forEach((fDef, fIdx) => {
                    for (let iu = 0; iu < gridN; iu++) {
                        for (let iv = 0; iv < gridN; iv++) {
                            const uOffset = -halfSize + step * (iu + 0.5);
                            const vOffset = -halfSize + step * (iv + 0.5);

                            const pos = new THREE.Vector3()
                                .addScaledVector(fDef.normal, halfSize)
                                .addScaledVector(fDef.uAxis, uOffset)
                                .addScaledVector(fDef.vAxis, vOffset);

                            // Concentric Euclidean radial coloring (Rubik's concentric rings!)
                            const normU = gridN > 1 ? (iu / (gridN - 1)) * 2 - 1 : 0;
                            const normV = gridN > 1 ? (iv / (gridN - 1)) * 2 - 1 : 0;
                            const ringDist = Math.sqrt(normU * normU + normV * normV);
                            const pillarIdx = Math.min(9, Math.floor(((ringDist / 1.42) * 5 + shellIdx * 2 + fIdx) % 10));
                            const factorIdx = (iu * gridN + iv + fIdx) % 10;
                            const pillar = NEXUS_PILLARS[pillarIdx];

                            const mat = new THREE.MeshPhysicalMaterial({
                                color: pillar.hex,
                                emissive: pillar.hex,
                                emissiveIntensity: shellIdx === 0 ? 0.65 : 0.22,
                                transparent: true,
                                opacity: baseOpacity,
                                roughness: 0.1,
                                metalness: 0.1,
                                transmission: 0.5,
                                side: THREE.DoubleSide,
                                depthWrite: false,
                            });

                            const tileMesh = new THREE.Mesh(tileGeo, mat);
                            tileMesh.position.copy(pos);
                            tileMesh.lookAt(pos.clone().add(fDef.normal));

                            // Crisp glowing square-mesh border
                            const borderMat = new THREE.LineBasicMaterial({
                                color: pillar.hex,
                                transparent: true,
                                opacity: borderOpacity,
                                blending: THREE.AdditiveBlending
                            });
                            tileMesh.add(new THREE.LineSegments(edgeGeo, borderMat));

                            // Billboarded Pillar Glyph Sprite on key tiles (all 1x1 & 3x3 tiles, and sparse 9x9 centers/corners)
                            let glyphSprite: THREE.Sprite | undefined;
                            const shouldHaveGlyph =
                                shellIdx < 2 ||
                                (iu % 2 === 0 && iv % 2 === 0);

                            if (shouldHaveGlyph) {
                                const spriteMat = new THREE.SpriteMaterial({
                                    map: glyphTextures[pillarIdx],
                                    color: 0xffffff,
                                    transparent: true,
                                    opacity: shellIdx === 0 ? 0.95 : shellIdx === 1 ? 0.8 : 0.55,
                                    blending: THREE.AdditiveBlending,
                                    depthWrite: false
                                });
                                glyphSprite = new THREE.Sprite(spriteMat);
                                const sScale = tileWidth * 0.52;
                                glyphSprite.scale.set(sScale, sScale, sScale);
                                glyphSprite.visible = stateRef.current.showGlyphs;
                                tileMesh.add(glyphSprite);
                                glyphSpritesList.push(glyphSprite);
                            }

                            shellsContainer.add(tileMesh);

                            // Normalized grid coordinate (-1, 0, +1) for Rubik's slice twists
                            const gx = Math.round(pos.x / (halfSize * 0.66));
                            const gy = Math.round(pos.y / (halfSize * 0.66));
                            const gz = Math.round(pos.z / (halfSize * 0.66));

                            allSquareTiles.push({
                                mesh: tileMesh,
                                shellIndex: shellIdx,
                                basePos: pos.clone(),
                                normal: fDef.normal.clone(),
                                gridCoord: new THREE.Vector3(
                                    Math.max(-1, Math.min(1, gx)),
                                    Math.max(-1, Math.min(1, gy)),
                                    Math.max(-1, Math.min(1, gz))
                                ),
                                pillarIdx,
                                factorIdx,
                                glyphSprite,
                                pulseIntensity: 0
                            });
                        }
                    }
                });
            });
        }

        buildConcentricSquareMeshShells(stateRef.current.shellDensity);

        // ====================================================================
        // PART C: BIOLUMINESCENT NEURONS, SOMA NODES & TRAVELING AXON PULSES
        // ====================================================================
        interface AxonPathway {
            curve: THREE.QuadraticBezierCurve3;
            line: THREE.Line;
            pulseDot: THREE.Mesh;
            t: number;
            speed: number;
            pillarIdx: number;
            activeBoost: number;
        }

        const axonPathways: AxonPathway[] = [];
        const somaNodes: { mesh: THREE.Mesh; pillarIdx: number; baseScale: number }[] = [];

        function buildBioluminescentNeuralNetwork() {
            while (neuralNetworkGroup.children.length > 0) {
                neuralNetworkGroup.remove(neuralNetworkGroup.children[0]);
            }
            axonPathways.length = 0;
            somaNodes.length = 0;

            const somaGeo = new THREE.SphereGeometry(0.055, 12, 12);
            const pulseGeo = new THREE.SphereGeometry(0.042, 8, 8);

            // Create 60 Bioluminescent Soma Nodes distributed across the 1x1 -> 3x3 -> 9x9 shells
            const nodePositions: { pos: THREE.Vector3; pillarIdx: number }[] = [];
            for (let i = 0; i < 60; i++) {
                const pillarIdx = i % 10;
                const pillar = NEXUS_PILLARS[pillarIdx];
                const layerRadius = i < 10 ? 0.35 : i < 30 ? 1.08 : 1.92;
                const theta = (i * 2.39996) % (Math.PI * 2); // golden angle spiral
                const phi = Math.acos(1 - 2 * ((i + 0.5) / 60));

                const pos = new THREE.Vector3(
                    layerRadius * Math.sin(phi) * Math.cos(theta),
                    layerRadius * Math.cos(phi),
                    layerRadius * Math.sin(phi) * Math.sin(theta)
                );
                nodePositions.push({ pos, pillarIdx });

                const somaMat = new THREE.MeshBasicMaterial({
                    color: pillar.hex,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending
                });
                const somaMesh = new THREE.Mesh(somaGeo, somaMat);
                somaMesh.position.copy(pos);
                neuralNetworkGroup.add(somaMesh);
                somaNodes.push({ mesh: somaMesh, pillarIdx, baseScale: i < 10 ? 1.4 : 1.0 });
            }

            // Connect Soma Nodes with 90 Curving Bioluminescent Axon Filaments + Traveling Action-Potential Dots
            for (let i = 0; i < 90; i++) {
                const src = nodePositions[i % nodePositions.length];
                const dst = nodePositions[(i * 7 + 13) % nodePositions.length];
                const pillar = NEXUS_PILLARS[src.pillarIdx];

                const mid = src.pos.clone().add(dst.pos).multiplyScalar(0.5);
                // Curve outward/inward organically like brain white-matter tracts
                mid.add(new THREE.Vector3(
                    Math.sin(i * 1.7) * 0.35,
                    Math.cos(i * 2.3) * 0.35,
                    Math.sin(i * 3.1) * 0.35
                ));

                const curve = new THREE.QuadraticBezierCurve3(src.pos, mid, dst.pos);
                const points = curve.getPoints(24);
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({
                    color: pillar.hex,
                    transparent: true,
                    opacity: 0.32,
                    blending: THREE.AdditiveBlending
                });
                const line = new THREE.Line(lineGeo, lineMat);
                neuralNetworkGroup.add(line);

                const dotMat = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.95,
                    blending: THREE.AdditiveBlending
                });
                const pulseDot = new THREE.Mesh(pulseGeo, dotMat);
                neuralNetworkGroup.add(pulseDot);

                axonPathways.push({
                    curve,
                    line,
                    pulseDot,
                    t: Math.random(),
                    speed: 0.35 + (i % 7) * 0.08,
                    pillarIdx: src.pillarIdx,
                    activeBoost: 1.0
                });
            }
        }

        buildBioluminescentNeuralNetwork();

        // ====================================================================
        // PART D: SHORTEST-HOP RUBIK'S SLICE ROTATION ENGINE
        // ====================================================================
        interface ActiveSliceTwist {
            axis: 'x' | 'y' | 'z';
            layerIdx: number; // -1, 0, +1
            targetAngle: number;
            currentAngle: number;
            affectedTiles: SquareTileNode[];
            startPositions: THREE.Vector3[];
            startQuaternions: THREE.Quaternion[];
        }

        const sliceTwistQueue: { axis: 'x' | 'y' | 'z'; layerIdx: number; dir: number }[] = [];
        let currentSliceTwist: ActiveSliceTwist | null = null;

        function triggerRubikSliceTwist(axis: 'x' | 'y' | 'z', layerIdx: number, dir: number) {
            if (stateRef.current.humanFailsafeLocked) return; // Respect Human Failsafe!
            if (sliceTwistQueue.length < 6) {
                sliceTwistQueue.push({ axis, layerIdx, dir });
            }
        }

        function triggerNeuralBurst(pillars: number[]) {
            const pSet = new Set(pillars);
            allSquareTiles.forEach(tile => {
                if (pSet.has(tile.pillarIdx)) {
                    tile.pulseIntensity = 1.0;
                }
            });
            axonPathways.forEach(ax => {
                if (pSet.has(ax.pillarIdx)) {
                    ax.activeBoost = 3.2;
                }
            });
        }

        function triggerVoxelEvent(event: MyOsNeuralEvent) {
            const pillarDef = NEXUS_PILLARS.find(p => p.id === event.dominantPillar || p.name === event.dominantPillar);
            const pIdx = pillarDef ? pillarDef.index : 0;

            if (event.nodeAddress) {
                const { x, y, z } = event.nodeAddress;
                let foundMatch = false;
                allSquareTiles.forEach(tile => {
                    if (
                        Math.round(tile.gridCoord.x) === x &&
                        Math.round(tile.gridCoord.y) === y &&
                        Math.round(tile.gridCoord.z) === z
                    ) {
                        tile.pulseIntensity = 2.4;
                        foundMatch = true;
                    }
                });
                if (!foundMatch) {
                    triggerNeuralBurst([pIdx]);
                }
            } else {
                triggerNeuralBurst([pIdx]);
            }

            axonPathways.forEach(ax => {
                if (ax.pillarIdx === pIdx) {
                    ax.activeBoost = 4.2;
                }
            });

            // If action is tool/script run or pillar shift, twist Rubik layer
            if (event.eventType === 'SCRIPT_RUN' || event.eventType === 'PILLAR_SHIFT' || event.eventType === 'TOOL_EXECUTION') {
                const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
                const axis = event.nodeAddress?.x !== undefined ? 'x' : axes[Math.floor(Math.random() * 3)];
                const layer = event.nodeAddress ? event.nodeAddress[axis] : 0;
                triggerRubikSliceTwist(axis, layer, Math.random() > 0.5 ? 1 : -1);
            }
        }

        // ====================================================================
        // PART E: MOUSE / KEYBOARD / RAYCASTER INTERACTION
        // ====================================================================
        let isDragging = false;
        let prevMouse = { x: 0, y: 0 };
        let downMouse = { x: 0, y: 0 };
        const raycaster = new THREE.Raycaster();

        const onPointerDown = (e: MouseEvent) => {
            isDragging = true;
            prevMouse = { x: e.clientX, y: e.clientY };
            downMouse = { x: e.clientX, y: e.clientY };
        };

        const onPointerMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - prevMouse.x;
            const dy = e.clientY - prevMouse.y;
            prevMouse = { x: e.clientX, y: e.clientY };

            stateRef.current.orbitTheta -= dx * 0.0065;
            stateRef.current.orbitPhi = Math.max(0.35, Math.min(Math.PI - 0.35, stateRef.current.orbitPhi - dy * 0.0065));
            stateRef.current.mouseOmega = Math.min(2.5, stateRef.current.mouseOmega + Math.hypot(dx, dy) * 0.015);
        };

        const onPointerUp = (e: MouseEvent) => {
            if (!isDragging) return;
            isDragging = false;
            const moveDist = Math.hypot(e.clientX - downMouse.x, e.clientY - downMouse.y);
            if (moveDist > 6 || stateRef.current.isLockedIn) return;

            // Check if user clicked on a 10-sided Prism face (or its left-hand NestedDock strip!)
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycaster.setFromCamera(mouse, camera);

            if (stateRef.current.prismGlassMode !== 'hidden') {
                const hits = raycaster.intersectObjects(faceMeshes, false);
                if (hits.length > 0) {
                    const hit = hits[0];
                    const clickedFaceIdx = hit.object.userData.faceIdx;
                    if (typeof clickedFaceIdx === 'number') {
                        // If already facing this face and user clicked the left NestedDock strip (uv.x < 0.16)
                        if (clickedFaceIdx === stateRef.current.activeFaceIdx && hit.uv && hit.uv.x < 0.16 && hit.uv.y < 0.88 && hit.uv.y > 0.04) {
                            const dockIndex = Math.min(9, Math.max(0, Math.floor(((1 - hit.uv.y) - 0.12) / 0.082)));
                            drillDownNestedDock(dockIndex);
                            return;
                        }
                        selectPillarFace(clickedFaceIdx);
                    }
                }
            }
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.shiftKey) {
                // Shift + Wheel scales the outer square-mesh resolution (3x3 up to 10x10)
                setShellDensity(prev => {
                    const next = Math.max(3, Math.min(10, prev + (e.deltaY < 0 ? 1 : -1)));
                    if (next !== prev) {
                        stateRef.current.shellDensity = next;
                        setTimeout(() => buildConcentricSquareMeshShells(next), 0);
                    }
                    return next;
                });
            } else {
                stateRef.current.orbitRadius = Math.max(2.6, Math.min(20.0, stateRef.current.orbitRadius + e.deltaY * 0.005));
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') {
                e.preventDefault();
                setIsLockedIn(prev => !prev);
            } else if (e.ctrlKey && e.key === 'ArrowRight') {
                e.preventDefault();
                selectPillarFace(stateRef.current.activeFaceIdx + 1);
            } else if (e.ctrlKey && e.key === 'ArrowLeft') {
                e.preventDefault();
                selectPillarFace(stateRef.current.activeFaceIdx - 1);
            } else if (e.key === '[') {
                e.preventDefault();
                drillDownNestedDock((stateRef.current.activeFaceIdx + 1) % 10);
            } else if (e.key === ']') {
                e.preventDefault();
                ascendRussianDollDepth();
            }
        };

        const domElem = renderer.domElement;
        domElem.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);
        domElem.addEventListener('wheel', onWheel, { passive: false });
        window.addEventListener('keydown', onKeyDown);

        // ====================================================================
        // PART F: IMPERATIVE API FOR REACT HUD CONTROLS
        // ====================================================================
        sceneApiRef.current = {
            triggerRubikSliceTwist,
            triggerNeuralBurst,
            triggerVoxelEvent,
            rebuildInnerShells: (outerN: number) => {
                buildConcentricSquareMeshShells(outerN);
            },
            updatePrismFaceTextures: (path: GemId[]) => {
                NEXUS_PILLARS.forEach((p, idx) => {
                    const mat = faceMaterials[idx];
                    if (mat && mat instanceof THREE.MeshStandardMaterial) {
                        mat.map = createDecagonFaceTexture(p, path);
                        mat.needsUpdate = true;
                    }
                });
            },
            glueAppToCurrentFace: async (faceIdx: number) => {
                try {
                    const stream = await navigator.mediaDevices.getDisplayMedia({
                        video: { displaySurface: 'window' } as any,
                        audio: false
                    });
                    const vid = document.createElement('video');
                    vid.srcObject = stream;
                    vid.muted = true;
                    await vid.play();

                    const vidTex = new THREE.VideoTexture(vid);
                    vidTex.minFilter = THREE.LinearFilter;
                    vidTex.magFilter = THREE.LinearFilter;

                    const mat = new THREE.MeshBasicMaterial({
                        map: vidTex,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.95
                    });
                    faceMaterials[faceIdx] = mat;
                    faceMeshes[faceIdx].material = mat;
                    setGluedFaces(prev => ({ ...prev, [faceIdx]: `Live Windows Stream #${faceIdx + 1}` }));
                } catch (err) {
                    console.warn('Screen capture cancelled:', err);
                }
            },
            applyShaderToFace: (faceIdx: number, shaderKey: string | null) => {
                if (!shaderKey || !JIT_SHADERS[shaderKey]) {
                    const tex = createDecagonFaceTexture(NEXUS_PILLARS[faceIdx], semanticPath);
                    const stdMat = new THREE.MeshStandardMaterial({
                        map: tex,
                        roughness: 0.2,
                        metalness: 0.15,
                        transparent: true,
                        opacity: 0.78,
                        side: THREE.DoubleSide
                    });
                    faceMaterials[faceIdx] = stdMat;
                    faceMeshes[faceIdx].material = stdMat;
                    setActiveFaceShader(prev => {
                        const next = { ...prev };
                        delete next[faceIdx];
                        return next;
                    });
                    return;
                }
                const uTime = { value: 0 };
                shaderUniformsList.push(uTime);
                const sMat = new THREE.ShaderMaterial({
                    vertexShader: VERTEX_SHADER,
                    fragmentShader: JIT_SHADERS[shaderKey].fragment,
                    uniforms: { uTime },
                    transparent: true,
                    side: THREE.DoubleSide
                });
                faceMaterials[faceIdx] = sMat;
                faceMeshes[faceIdx].material = sMat;
                setActiveFaceShader(prev => ({ ...prev, [faceIdx]: JIT_SHADERS[shaderKey].name }));
            },
            triggerExtrude: () => {
                stateRef.current.extrudeProgress = 0.0;
                stateRef.current.extrudeState = 'EXTRUDE_1D';
            },
            triggerImplode: () => {
                stateRef.current.extrudeProgress = 1.0;
                stateRef.current.extrudeState = 'COLLAPSE';
            }
        };

        // ====================================================================
        // PART G: 60FPS ANIMATION & RENDER LOOP
        // ====================================================================
        let animId = 0;
        let lastTime = performance.now();
        const targetCamPos = new THREE.Vector3();
        const currentCamLook = new THREE.Vector3(0, 0, 0);

        const animate = (now: number) => {
            animId = requestAnimationFrame(animate);
            const dt = Math.min((now - lastTime) / 1000, 0.1);
            lastTime = now;

            // Update shader uniforms
            shaderUniformsList.forEach(u => { u.value = now * 0.001; });

            // 1. Extrude / Implode Progression (from holo_window)
            const st = stateRef.current;
            if (st.extrudeState === 'EXTRUDE_1D') {
                st.extrudeProgress += dt * 1.4;
                const f = Math.min(1, st.extrudeProgress);
                masterPrismGroup.scale.set(f, 0.01, 0.01);
                if (st.extrudeProgress >= 1) { st.extrudeProgress = 0; st.extrudeState = 'EXTRUDE_2D'; }
            } else if (st.extrudeState === 'EXTRUDE_2D') {
                st.extrudeProgress += dt * 1.4;
                const f = Math.min(1, st.extrudeProgress);
                masterPrismGroup.scale.set(1, Math.max(0.01, f), 0.01);
                if (st.extrudeProgress >= 1) { st.extrudeProgress = 0; st.extrudeState = 'EXTRUDE_3D'; }
            } else if (st.extrudeState === 'EXTRUDE_3D') {
                st.extrudeProgress += dt * 1.4;
                const f = Math.min(1, st.extrudeProgress);
                masterPrismGroup.scale.set(1, 1, Math.max(0.01, f));
                if (st.extrudeProgress >= 1) { st.extrudeProgress = 1; st.extrudeState = 'STABLE_3D'; }
            } else if (st.extrudeState === 'COLLAPSE') {
                st.extrudeProgress = Math.max(0.001, st.extrudeProgress - dt * 1.2);
                const f = st.extrudeProgress;
                masterPrismGroup.scale.set(f, f, f);
            } else {
                masterPrismGroup.scale.set(1, 1, 1);
            }

            // 2. Smooth 10-Sided Prism Yaw Alignment & Russian-Doll Depth Interpolation
            st.currentYaw += (st.targetYaw - st.currentYaw) * 0.12;
            masterPrismGroup.rotation.y = st.currentYaw;

            st.depthLerp += (st.depthLevel - st.depthLerp) * 0.08;
            const innerBoost = 0.62 + Math.sin(now * 0.002) * 0.015;
            innerPrismShellGroup.scale.set(innerBoost, innerBoost, innerBoost);
            innerPrismShellGroup.rotation.y = -now * 0.00025;

            // 3. Auto-Fade Outer 10-Sided Prism to 15% Glass Opacity during Active AI Thought (or Translucent Mode)
            const targetPrismOpacity =
                st.prismGlassMode === 'hidden'
                    ? 0.0
                    : st.isThinking || st.prismGlassMode === 'translucent'
                        ? 0.15
                        : 0.78;

            outerPrismShellGroup.visible = st.prismGlassMode !== 'hidden';
            innerPrismShellGroup.visible = st.prismGlassMode !== 'hidden';
            schlegelLines.visible = st.prismGlassMode !== 'hidden';

            faceMaterials.forEach(m => {
                if ('opacity' in m) {
                    m.opacity += (targetPrismOpacity - m.opacity) * 0.1;
                }
            });

            // 4. Rubik's Slice Twist Execution (Shortest-Hop Node Alignment!)
            if (!currentSliceTwist && sliceTwistQueue.length > 0 && !st.humanFailsafeLocked) {
                const nextMove = sliceTwistQueue.shift()!;
                const affected = allSquareTiles.filter(t => Math.round(t.gridCoord[nextMove.axis]) === nextMove.layerIdx);
                currentSliceTwist = {
                    axis: nextMove.axis,
                    layerIdx: nextMove.layerIdx,
                    targetAngle: nextMove.dir * (Math.PI / 2),
                    currentAngle: 0,
                    affectedTiles: affected,
                    startPositions: affected.map(t => t.basePos.clone()),
                    startQuaternions: affected.map(t => t.mesh.quaternion.clone())
                };
            }

            if (currentSliceTwist) {
                const stepAngle = (currentSliceTwist.targetAngle - currentSliceTwist.currentAngle) * 0.18;
                currentSliceTwist.currentAngle += stepAngle;
                const finishSnap = Math.abs(currentSliceTwist.targetAngle - currentSliceTwist.currentAngle) < 0.015;
                const ang = finishSnap ? currentSliceTwist.targetAngle : currentSliceTwist.currentAngle;

                const rotAxis =
                    currentSliceTwist.axis === 'x'
                        ? new THREE.Vector3(1, 0, 0)
                        : currentSliceTwist.axis === 'y'
                            ? new THREE.Vector3(0, 1, 0)
                            : new THREE.Vector3(0, 0, 1);
                const rotQuat = new THREE.Quaternion().setFromAxisAngle(rotAxis, ang);

                currentSliceTwist.affectedTiles.forEach((tile, i) => {
                    const rotatedPos = currentSliceTwist!.startPositions[i].clone().applyQuaternion(rotQuat);
                    tile.basePos.copy(rotatedPos);
                    tile.mesh.quaternion.copy(rotQuat).multiply(currentSliceTwist!.startQuaternions[i]);
                    if (finishSnap) {
                        tile.gridCoord.applyQuaternion(rotQuat);
                        tile.gridCoord.set(
                            Math.round(tile.gridCoord.x),
                            Math.round(tile.gridCoord.y),
                            Math.round(tile.gridCoord.z)
                        );
                    }
                });

                if (finishSnap) {
                    currentSliceTwist = null;
                }
            }

            // 5. Explode Shells & Parallax Tile Pulse Updates
            const targetExplode = st.isExploded ? 1.0 : 0.0;
            st.explodeLerp += (targetExplode - st.explodeLerp) * 0.09;

            const activeSet = new Set(st.activeDominantPillars);
            allSquareTiles.forEach(tile => {
                // Explode shells outward radially by shell index (0=Core, 1=3x3, 2=9x9)
                const explodeFactor = 1.0 + st.explodeLerp * (tile.shellIndex * 0.55 + 0.2);
                tile.mesh.position.copy(tile.basePos).multiplyScalar(explodeFactor);

                tile.pulseIntensity = Math.max(0, tile.pulseIntensity - dt * 1.4);
                const isDominant = activeSet.has(tile.pillarIdx);

                const mat = tile.mesh.material as THREE.MeshPhysicalMaterial;
                const targetEmissive =
                    tile.shellIndex === 0
                        ? 0.85
                        : isDominant
                            ? 0.65 + tile.pulseIntensity * 0.85 + Math.sin(now * 0.006 + tile.pillarIdx) * 0.15
                            : 0.15 + tile.pulseIntensity * 0.5;
                mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;

                if (tile.glyphSprite) {
                    tile.glyphSprite.visible = st.showGlyphs;
                }
            });

            // 6. Bioluminescent Neurons & Traveling Axon Action-Potential Pulses
            const speedMultiplier = st.isThinking ? 2.6 : 1.0;
            axonPathways.forEach(ax => {
                ax.activeBoost = Math.max(1.0, ax.activeBoost - dt * 1.5);
                ax.t = (ax.t + dt * ax.speed * speedMultiplier * ax.activeBoost) % 1.0;
                const pos = ax.curve.getPoint(ax.t);
                ax.pulseDot.position.copy(pos);

                const isDom = activeSet.has(ax.pillarIdx);
                const scale = (isDom || st.isThinking) ? 1.35 * ax.activeBoost : 0.75;
                ax.pulseDot.scale.setScalar(Math.min(2.4, scale));
                (ax.line.material as THREE.LineBasicMaterial).opacity = isDom ? 0.68 : 0.22;
            });

            somaNodes.forEach((sn, idx) => {
                const isDom = activeSet.has(sn.pillarIdx);
                const pulse = sn.baseScale * (1.0 + Math.sin(now * 0.008 + idx) * (isDom ? 0.35 : 0.12));
                sn.mesh.scale.setScalar(pulse);
            });

            // Gentle float of the inner Rubik's Cortex unless Failsafe locked
            if (!st.humanFailsafeLocked) {
                rubikBrainRoot.rotation.y = Math.sin(now * 0.0004) * 0.18;
                rubikBrainRoot.rotation.x = Math.cos(now * 0.0003) * 0.10;
            }

            // Flow-State Cognitive Gradient (Local Gemma 4 Recommendation #2)
            if (st.humanFailsafeLocked) {
                // Blockage / Failsafe: sharp pulsed crimson
                corePointLight.color.setHex(0xef4444);
                corePointLight.intensity = 2.8 + Math.sin(now * 0.01) * 1.2;
            } else if (st.isThinking) {
                // Active Inference / Thought Stream: diffuse oscillating amber/gold
                corePointLight.color.setHex(0xfbbf24);
                corePointLight.intensity = 3.6 + Math.sin(now * 0.006) * 0.9;
            } else {
                // Resting Sovereign Equilibrium: steady cool sapphire cyan
                corePointLight.color.setHex(0x38bdf8);
                corePointLight.intensity = 2.4 + Math.sin(now * 0.002) * 0.4;
            }

            // 7. Kinetic Dolly Pullback & Smooth Camera Rig (from holo_window)
            st.mouseOmega *= 0.88;
            const yawDelta = Math.abs(st.targetYaw - st.currentYaw);
            const totalOmega = yawDelta * 3.5 + st.mouseOmega;
            const dollyOffset = 2.8 * Math.tanh(totalOmega * 0.45);

            if (st.isLockedIn) {
                const lockPullback = 1.4 * Math.tanh(yawDelta * 3.0);
                targetCamPos.set(0, 0, PRISM_APOTHEM + 3.2 + lockPullback);
            } else {
                const effectiveRadius = st.orbitRadius + dollyOffset;
                targetCamPos.x = effectiveRadius * Math.sin(st.orbitPhi) * Math.sin(st.orbitTheta);
                targetCamPos.y = effectiveRadius * Math.cos(st.orbitPhi);
                targetCamPos.z = effectiveRadius * Math.sin(st.orbitPhi) * Math.cos(st.orbitTheta);
            }

            camera.position.lerp(targetCamPos, 0.09);
            camera.lookAt(currentCamLook);

            renderer.render(scene, camera);
        };

        animId = requestAnimationFrame(animate);

        const onResize = () => {
            if (!container) return;
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(animId);
            domElem.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('mousemove', onPointerMove);
            window.removeEventListener('mouseup', onPointerUp);
            domElem.removeEventListener('wheel', onWheel);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', onResize);
            renderer.dispose();
        };
    }, [ascendRussianDollDepth, drillDownNestedDock, selectPillarFace]);

    // ========================================================================
    // LIVE OLLAMA TOKEN STREAMING + SHORTEST-HOP RUBIK'S SOLVER
    // ========================================================================
    const handleSendStreamingPrompt = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = promptInput.trim();
        if (!text || isThinking) return;

        setPromptInput('');
        setLastUserPrompt(text);
        setIsThinking(true);
        setStreamingTelemetry('⚡ [STREAMING ACTIVE] Outer Prism fading to 15% Glass — Solving shortest-hop Rubik slice twists...');
        setStreamingSynthesis('');

        // Immediately detect referenced Pillars in the user's prompt and trigger initial shortest-hop twist
        const initialPillars: number[] = [];
        NEXUS_PILLARS.forEach(p => {
            if (text.toLowerCase().includes(p.name.toLowerCase()) || text.includes(p.glyph)) {
                initialPillars.push(p.index);
            }
        });
        const seedPillars = initialPillars.length >= 2 ? initialPillars : [activeFaceIdx, (activeFaceIdx + 2) % 10, (activeFaceIdx + 4) % 10];
        setActiveDominantPillars(seedPillars);
        sceneApiRef.current?.triggerNeuralBurst(seedPillars);

        // Compute Shortest-Hop Rubik's Slice Moves
        const rawHops = Math.max(4, Math.abs(seedPillars[0] - seedPillars[1]) + 3);
        const compressedHops = Math.max(1, Math.min(2, Math.floor(rawHops / 3)));
        const moves = [
            `Slice-Y(${(seedPillars[0] % 3) - 1}) 90°`,
            `Slice-X(${(seedPillars[1] % 3) - 1}) -90°`
        ];
        setHopMetrics({ before: rawHops, after: compressedHops, sliceMoves: moves });

        if (!humanFailsafeLocked) {
            sceneApiRef.current?.triggerRubikSliceTwist('y', (seedPillars[0] % 3) - 1, 1);
            sceneApiRef.current?.triggerRubikSliceTwist('x', (seedPillars[1] % 3) - 1, -1);
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    model: 'myos-cortex:latest',
                    stream: true,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are MyOS-Cortex operating inside the NexusCube (10-Sided Hyper-Decagonal Prism + Bioluminescent Rubik\'s Cortex). Always begin with a concise [Telemetry] block listing Dominant Nodes and Active Vectors, followed by [Synthesis]. Keep your response sharp, grounded, and insightful.'
                        },
                        { role: 'user', content: text }
                    ]
                })
            });

            if (!response.ok || !response.body) {
                throw new Error(`Ollama HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            let tokenCount = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        const tokenRaw = parsed?.message?.content || '';
                        if (tokenRaw) {
                            const cleanToken = decodeCortexUtf8Hex(tokenRaw);
                            accumulated += cleanToken;
                            tokenCount++;

                            // Parse live Pillars as tokens arrive!
                            const discoveredPillars: number[] = [];
                            NEXUS_PILLARS.forEach(p => {
                                if (accumulated.includes(p.name) || accumulated.includes(p.glyph)) {
                                    discoveredPillars.push(p.index);
                                }
                            });

                            if (discoveredPillars.length > 0) {
                                setActiveDominantPillars(discoveredPillars.slice(0, 4));
                            }

                            // Every 8 tokens, fire a bioluminescent neural wave and a Rubik's slice micro-alignment
                            if (tokenCount % 8 === 0) {
                                const burstTargets = discoveredPillars.length > 0 ? discoveredPillars : seedPillars;
                                sceneApiRef.current?.triggerNeuralBurst(burstTargets);
                                setFiringNeuronCount(35 + (tokenCount % 55));

                                if (tokenCount % 24 === 0 && !stateRef.current.humanFailsafeLocked) {
                                    const axis = (['x', 'y', 'z'] as const)[(tokenCount / 24) % 3];
                                    const layer = ((tokenCount / 8) % 3) - 1;
                                    sceneApiRef.current?.triggerRubikSliceTwist(axis, layer, tokenCount % 16 === 0 ? 1 : -1);
                                }
                            }

                            // Split [Telemetry] vs [Synthesis] for clean diegetic display
                            const synthSplit = accumulated.split(/\[Synthesis\]/i);
                            if (synthSplit.length > 1) {
                                setStreamingTelemetry(synthSplit[0].replace(/\[Telemetry\]/i, '').trim());
                                setStreamingSynthesis(synthSplit[1].trim());
                            } else {
                                setStreamingSynthesis(accumulated);
                            }
                        }
                    } catch {
                        // Partial JSON line
                    }
                }
            }

            // Pin Completed Thought to Ontological Working Memory Card
            const primaryPillar = activeDominantPillars[0] ?? activeFaceIdx;
            const secondaryPillar = activeDominantPillars[1] ?? ((activeFaceIdx + 1) % 10);
            const newMemory: PinnedMemoryNode = {
                id: `mem-${Date.now()}`,
                address: `FSG://${primaryPillar + 1}.${secondaryPillar + 1}.${semanticPath.length} [${NEXUS_PILLARS[primaryPillar].glyph} → ${NEXUS_PILLARS[secondaryPillar].glyph}]`,
                pillarIdx: primaryPillar,
                factorIdx: secondaryPillar,
                depth: semanticPath.length,
                summary: accumulated.replace(/\[Telemetry\][\s\S]*?\[Synthesis\]/i, '').trim().slice(0, 140) + '...',
                prompt: text,
                hopsBefore: rawHops,
                hopsAfter: compressedHops,
                timestamp: new Date().toLocaleTimeString()
            };
            setPinnedMemories(prev => [newMemory, ...prev.slice(0, 7)]);
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                setStreamingTelemetry('🛡️ [HUMAN FAILSAFE TRIGGERED] Inference stream aborted by operator.');
            } else {
                setStreamingTelemetry(`⚠️ Ollama connection error: ${err?.message || 'Check localhost:11434'}`);
            }
        } finally {
            setIsThinking(false);
        }
    };

    const handleTriggerHumanFailsafe = () => {
        const nextLock = !humanFailsafeLocked;
        setHumanFailsafeLocked(nextLock);
        if (nextLock && isThinking && abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsThinking(false);
        }
    };

    const currentPillar = NEXUS_PILLARS[activeFaceIdx] || NEXUS_PILLARS[0];

    return (
        <div className="relative w-full h-screen bg-[#03020a] text-slate-100 overflow-hidden select-none font-mono">
            {/* 3D WebGL Viewport (10-Sided Russian-Doll Hyper-Prism + Inner Bioluminescent Rubik's Cortex) */}
            <div ref={mountRef} className="absolute inset-0 w-full h-full z-0" />

            {/* ================================================================
                HYBRID 3D-TO-LIVE-DOM LOCK-IN OVERLAY (Question 4)
                When Spacebar / Lock-In is active, mounts the live interactive
                React <NexusContainer path={semanticPath} /> flush in the center!
               ================================================================ */}
            {isLockedIn && (
                <div className="absolute inset-x-16 top-20 bottom-24 z-30 rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-[0_0_80px_rgba(56,189,248,0.35)] bg-slate-950/95 backdrop-blur-2xl flex flex-col pointer-events-auto">
                    <div className="h-11 bg-slate-900/95 border-b border-cyan-500/30 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
                                🔒 LOCKED-IN LIVE DOM FACE #{activeFaceIdx + 1}/10
                            </span>
                            <span className="text-xs font-bold text-white">
                                {currentPillar.glyph} {currentPillar.name} — Depth D{semanticPath.length - 1} ({semanticPath.join(' → ')})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400">
                                Click any sub-pillar below to Dive (W+1) in 3D, or press [SPACEBAR] to return to 3D Orbit
                            </span>
                            <button
                                onClick={() => setIsLockedIn(false)}
                                className="px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-400/50 text-cyan-200 text-[10px] font-bold uppercase"
                            >
                                🔓 Unlock to 3D Prism (Space)
                            </button>
                        </div>
                    </div>

                    {/* Quick 3D Russian-Doll Drill Bar inside Locked-In View */}
                    <div className="h-10 bg-black/60 border-b border-white/10 px-4 flex items-center gap-1.5 overflow-x-auto">
                        <span className="text-[10px] text-purple-300 font-bold mr-2 shrink-0">
                            🌀 3D RUSSIAN-DOLL DIVE (W+1):
                        </span>
                        {NEXUS_PILLARS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => drillDownNestedDock(p.index)}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] flex items-center gap-1 shrink-0 transition-all"
                                style={{ borderColor: p.color + '66', color: p.color }}
                            >
                                <span>{p.glyph}</span>
                                <span>{p.name}</span>
                            </button>
                        ))}
                        {semanticPath.length > 1 && (
                            <button
                                onClick={ascendRussianDollDepth}
                                className="ml-auto px-2.5 py-1 rounded bg-purple-500/20 hover:bg-purple-500/40 border border-purple-400/50 text-purple-200 text-[10px] font-bold shrink-0"
                            >
                                ⬆️ Ascend (W-1)
                            </button>
                        )}
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <NexusContainer
                            path={semanticPath}
                            onClose={() => setIsLockedIn(false)}
                        />
                    </div>
                </div>
            )}

            {/* ================================================================
                LEFT HUD COLUMN: HYPER-PRISM + BIOLUMINESCENT RUBIK'S CORTEX
               ================================================================ */}
            <div className="absolute top-3 left-3 bottom-20 z-20 w-[355px] flex flex-col gap-2 overflow-y-auto no-scrollbar pointer-events-none">
                {/* CARD 1: OUTER 10-SIDED RUSSIAN-DOLL HYPER-PRISM CONTROLS */}
                <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl pointer-events-auto shrink-0">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                        <div>
                            <div className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
                                10-SIDED RUSSIAN-DOLL HYPER-PRISM
                            </div>
                            <div className="text-xs font-bold text-white flex items-center gap-2 mt-0.5">
                                <span style={{ color: currentPillar.color }}>{currentPillar.glyph}</span>
                                <span>FACE {activeFaceIdx + 1}/10: {currentPillar.name.toUpperCase()}</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-bold">
                            DEPTH D{semanticPath.length - 1}
                        </span>
                    </div>

                    {/* Active Russian-Doll Semantic Path Breadcrumb */}
                    <div className="bg-black/50 border border-white/10 rounded-lg px-2.5 py-1 mb-2 flex items-center justify-between text-[10px]">
                        <div className="truncate text-cyan-300">
                            <span className="text-slate-500 mr-1">PATH:</span>
                            {semanticPath.join(' → ')}
                        </div>
                        {semanticPath.length > 1 && (
                            <button
                                onClick={ascendRussianDollDepth}
                                className="ml-2 px-2 py-0.5 rounded bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 font-bold shrink-0"
                            >
                                ⬆️ W-1
                            </button>
                        )}
                    </div>

                    {/* NestedDock Russian-Doll Drill-Down Grid (Click any to Dive W+1 & Spin to Face) */}
                    <div className="mb-2">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
                            <span>NESTEDDOCK DRILL-DOWN (CLICK TO DIVE W+1):</span>
                            <span className="text-cyan-400">[ / ] KEYS</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                            {NEXUS_PILLARS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => drillDownNestedDock(p.index)}
                                    title={`Dive W+1 into ${semanticPath.join(' → ')} → ${p.name}`}
                                    className="px-1 py-1 rounded bg-slate-900/90 hover:bg-slate-800 border text-[10px] flex flex-col items-center transition-all"
                                    style={{
                                        borderColor: activeFaceIdx === p.index ? p.color : 'rgba(255,255,255,0.12)',
                                        color: p.color
                                    }}
                                >
                                    <span className="text-xs leading-none">{p.glyph}</span>
                                    <span className="text-[8px] text-slate-300 truncate w-full text-center mt-0.5">
                                        {p.name.slice(0, 5)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Window Glue, Lock-In & Prism Glass Controls */}
                    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        <button
                            onClick={() => sceneApiRef.current?.glueAppToCurrentFace(activeFaceIdx)}
                            className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/35 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold transition-all"
                        >
                            📎 Glue App to Face {activeFaceIdx + 1}
                        </button>
                        <button
                            onClick={() => setIsLockedIn(prev => !prev)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                isLockedIn
                                    ? 'bg-cyan-500/30 border-cyan-400 text-white'
                                    : 'bg-cyan-500/15 hover:bg-cyan-500/30 border-cyan-500/30 text-cyan-300'
                            }`}
                        >
                            {isLockedIn ? '🔓 Unlock (Space)' : '🔍 Lock-In DOM (Space)'}
                        </button>
                    </div>

                    {/* Prism Shell Opacity Toggle so user can inspect the Rubik Brain anytime */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() =>
                                setPrismGlassMode(prev =>
                                    prev === 'normal' ? 'translucent' : prev === 'translucent' ? 'hidden' : 'normal'
                                )
                            }
                            className="flex-1 px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-purple-200 text-[10px] font-bold"
                        >
                            🔮 Prism: {prismGlassMode.toUpperCase()}
                        </button>
                        <button
                            onClick={() => sceneApiRef.current?.triggerExtrude()}
                            className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[10px]"
                            title="Extrude 1D -> 2D -> 3D"
                        >
                            ✨ Extrude
                        </button>
                        <button
                            onClick={() => sceneApiRef.current?.triggerImplode()}
                            className="px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-[10px]"
                            title="Collapse to 0D Singularity"
                        >
                            💥 Implode
                        </button>
                    </div>
                </div>

                {/* CARD 2: INNER BIOLUMINESCENT RUBIK'S CORTEX CONTROLS */}
                <div className="bg-slate-950/85 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-3 shadow-2xl pointer-events-auto shrink-0">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-2">
                        <div>
                            <div className="text-[10px] text-purple-400 font-bold tracking-widest uppercase">
                                BIOLUMINESCENT RUBIK&apos;S CORTEX (1²–3²–{shellDensity}²)
                            </div>
                            <div className="text-[10px] text-slate-300">
                                Parallax Square-Mesh & Shortest-Hop Solver
                            </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                            {firingNeuronCount} Axons
                        </span>
                    </div>

                    {/* Hop-Distance Compression Telemetry */}
                    <div className="bg-black/50 border border-purple-500/25 rounded-lg p-2 mb-2 text-[10px]">
                        <div className="flex items-center justify-between text-purple-200 font-bold mb-0.5">
                            <span>🧊 SHORTEST-HOP COMPRESSION:</span>
                            <span className="text-emerald-400">
                                {hopMetrics.before} → {hopMetrics.after} Hops
                            </span>
                        </div>
                        <div className="text-slate-400 truncate">
                            Moves: {hopMetrics.sliceMoves.join(' → ')}
                        </div>
                    </div>

                    {/* Outer Square-Mesh Parallax Density Slider (3x3 up to 10x10) */}
                    <div className="mb-2">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Outer Mesh Density (Shift+Wheel):</span>
                            <span className="text-cyan-300 font-bold">1×1 ⊂ 3×3 ⊂ {shellDensity}×{shellDensity}</span>
                        </div>
                        <input
                            type="range"
                            min={3}
                            max={10}
                            value={shellDensity}
                            onChange={e => {
                                const val = parseInt(e.target.value, 10);
                                setShellDensity(val);
                                sceneApiRef.current?.rebuildInnerShells(val);
                            }}
                            className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                    </div>

                    {/* Rubik's Slice Twist, Explode & Glyph Controls */}
                    <div className="grid grid-cols-3 gap-1.5 mb-1.5">
                        <button
                            onClick={() => sceneApiRef.current?.triggerRubikSliceTwist('x', 1, 1)}
                            disabled={humanFailsafeLocked}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/15 text-[10px] text-cyan-300 disabled:opacity-40"
                        >
                            🔄 Twist X
                        </button>
                        <button
                            onClick={() => sceneApiRef.current?.triggerRubikSliceTwist('y', 0, 1)}
                            disabled={humanFailsafeLocked}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/15 text-[10px] text-purple-300 disabled:opacity-40"
                        >
                            🔄 Twist Y
                        </button>
                        <button
                            onClick={() => sceneApiRef.current?.triggerRubikSliceTwist('z', -1, -1)}
                            disabled={humanFailsafeLocked}
                            className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/15 text-[10px] text-pink-300 disabled:opacity-40"
                        >
                            🔄 Twist Z
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            onClick={() => setIsExploded(prev => !prev)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                isExploded
                                    ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                                    : 'bg-slate-900/90 hover:bg-slate-800 border-white/15 text-slate-300'
                            }`}
                        >
                            {isExploded ? '🧲 Implode Shells' : '💥 Explode Shells'}
                        </button>
                        <button
                            onClick={() => setShowGlyphs(prev => !prev)}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                                showGlyphs
                                    ? 'bg-cyan-500/25 border-cyan-400/50 text-cyan-200'
                                    : 'bg-slate-900/90 border-white/15 text-slate-400'
                            }`}
                        >
                            ✨ Glyphs: {showGlyphs ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ================================================================
                TOP-RIGHT HUD: HUMAN FAILSAFE, TELEMETRY STREAM & MEMORY INDEX
               ================================================================ */}
            <div className="absolute top-4 right-4 z-20 w-[390px] bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-2xl pointer-events-auto flex flex-col max-h-[82vh]">
                {/* Human-Centric Failsafe Override Banner (Question 1 & 10) */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                    <div>
                        <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                            <span>MYOS-CORTEX LIVE TELEMETRY</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Dual-Operator Symbiosis // Local RTX 4060 Ti
                        </div>
                    </div>
                    <button
                        onClick={handleTriggerHumanFailsafe}
                        className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                            humanFailsafeLocked
                                ? 'bg-red-500/35 border-red-400 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                : 'bg-emerald-500/15 hover:bg-red-500/25 border-emerald-500/40 text-emerald-200'
                        }`}
                        title="Human Failsafe: Freeze autonomous AI slice rotations and abort active stream"
                    >
                        {humanFailsafeLocked ? '🛡️ FAILSAFE LOCKED' : '🛡️ HUMAN FAILSAFE'}
                    </button>
                </div>

                {/* Live Streaming Telemetry & Synthesis Output (Selectable + Copyable + User Input Recorded) */}
                <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                    <span>LIVE TRANSCRIPT SCROLL (SELECTABLE):</span>
                    <button
                        onClick={() => {
                            const fullText = `${lastUserPrompt ? `> YOU: ${lastUserPrompt}\n\n` : ''}[Telemetry]\n${streamingTelemetry}\n\n[Synthesis]\n${streamingSynthesis}`;
                            navigator.clipboard.writeText(fullText);
                            setCopiedToast(true);
                            setTimeout(() => setCopiedToast(false), 2000);
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 font-bold transition-all"
                    >
                        {copiedToast ? '✅ Copied!' : '📋 Copy Output'}
                    </button>
                </div>
                <div className="bg-black/60 border border-cyan-500/25 rounded-xl p-3 mb-3 overflow-y-auto max-h-52 space-y-2 select-text cursor-text">
                    {lastUserPrompt && (
                        <div className="text-[10px] text-amber-300 font-bold border-b border-white/10 pb-1.5">
                            &gt; YOU: {lastUserPrompt}
                        </div>
                    )}
                    <div className="text-[10px] text-cyan-300 font-bold whitespace-pre-wrap leading-relaxed">
                        {streamingTelemetry}
                    </div>
                    <div className="text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed border-t border-white/10 pt-2">
                        {streamingSynthesis || (isThinking ? 'Streaming tokens from myos-cortex:latest...' : '')}
                    </div>
                </div>

                {/* JIT Procedural Shaders for Active Prism Face */}
                <div className="mb-3">
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                        <span>JIT SHADERS ON FACE #{activeFaceIdx + 1}:</span>
                        {activeFaceShader[activeFaceIdx] && (
                            <button
                                onClick={() => sceneApiRef.current?.applyShaderToFace(activeFaceIdx, null)}
                                className="text-rose-400 hover:underline"
                            >
                                Reset Face
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {Object.entries(JIT_SHADERS).map(([key, s]) => (
                            <button
                                key={key}
                                onClick={() => sceneApiRef.current?.applyShaderToFace(activeFaceIdx, key)}
                                className="px-2 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-[9px] font-bold truncate"
                                style={{ color: s.color }}
                            >
                                ● {s.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spatial Working Memory Index (Click any pinned memory to restore its Face, Depth & Rubik state!) */}
                <div className="flex-1 overflow-y-auto min-h-[110px]">
                    <div className="text-[9px] text-purple-300 uppercase tracking-wider font-bold mb-1.5">
                        📌 ONTOLOGICAL WORKING MEMORY INDEX ({pinnedMemories.length}):
                    </div>
                    <div className="space-y-1.5">
                        {pinnedMemories.map(mem => (
                            <div
                                key={mem.id}
                                onClick={() => {
                                    selectPillarFace(mem.pillarIdx);
                                    setActiveDominantPillars([mem.pillarIdx, mem.factorIdx]);
                                    sceneApiRef.current?.triggerNeuralBurst([mem.pillarIdx, mem.factorIdx]);
                                    sceneApiRef.current?.triggerRubikSliceTwist('y', (mem.pillarIdx % 3) - 1, 1);
                                }}
                                className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 cursor-pointer transition-all"
                            >
                                <div className="flex items-center justify-between text-[9px] text-cyan-400 font-bold">
                                    <span>{mem.address}</span>
                                    <span className="text-emerald-400">{mem.hopsBefore}→{mem.hopsAfter} hops</span>
                                </div>
                                <div className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">
                                    {mem.summary}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Live Neural Telemetry Tracer (Every Script, Agent Tool, and Node Action in 3D Space) */}
                <div className="border-t border-white/10 pt-2.5 mt-2 shrink-0">
                    <div className="flex items-center justify-between text-[9px] text-cyan-300 uppercase tracking-wider font-bold mb-1.5">
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            LIVE NEURAL TRACE BUS ({liveEventLog.length})
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                            VOXEL [X, Y, Z]
                        </span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                        {liveEventLog.length === 0 ? (
                            <div className="text-[10px] text-slate-500 italic py-1">
                                Awaiting engine events (tools, scripts, cortex streams)...
                            </div>
                        ) : (
                            liveEventLog.slice(0, 8).map(evt => (
                                <div
                                    key={evt.id}
                                    onClick={() => sceneApiRef.current?.triggerVoxelEvent?.(evt)}
                                    className="p-1.5 rounded bg-slate-900/70 hover:bg-slate-800/80 border border-white/5 flex items-center justify-between text-[9px] cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-1.5 truncate">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: evt.colorHex || '#38bdf8' }}
                                        />
                                        <span className="font-bold text-slate-300 truncate">
                                            {evt.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 font-mono">
                                        <span className="text-[8px] text-slate-400 uppercase">
                                            {evt.source.replace('_', ' ')}
                                        </span>
                                        {evt.nodeAddress && (
                                            <span className="px-1 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[8px]">
                                                [{evt.nodeAddress.x},{evt.nodeAddress.y},{evt.nodeAddress.z}]
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ================================================================
                BOTTOM COMMAND DOCK: 10 PILLAR PRISM SPINNER + STREAMING PROMPT
               ================================================================ */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-auto w-full max-w-4xl px-4">
                {/* 10-Pillar Prism Face Quick-Selector Bar */}
                <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-xl border border-white/15 rounded-full px-3 py-1 shadow-xl">
                    <button
                        onClick={() => selectPillarFace(activeFaceIdx - 1)}
                        className="px-2 py-1 rounded-full hover:bg-white/10 text-xs text-slate-300"
                        title="Previous Prism Face (Ctrl+Left)"
                    >
                        ◀
                    </button>
                    {NEXUS_PILLARS.map(p => {
                        const isSelected = activeFaceIdx === p.index;
                        return (
                            <button
                                key={p.id}
                                onClick={() => selectPillarFace(p.index)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${
                                    isSelected ? 'scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'
                                }`}
                                style={{
                                    backgroundColor: isSelected ? p.color + '33' : 'transparent',
                                    border: isSelected ? `1px solid ${p.color}` : '1px solid transparent',
                                    color: p.color
                                }}
                            >
                                <span>{p.glyph}</span>
                                <span className="hidden md:inline">{p.name}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={() => selectPillarFace(activeFaceIdx + 1)}
                        className="px-2 py-1 rounded-full hover:bg-white/10 text-xs text-slate-300"
                        title="Next Prism Face (Ctrl+Right)"
                    >
                        ▶
                    </button>
                </div>

                {/* Live Streaming Prompt Bar */}
                <form
                    onSubmit={handleSendStreamingPrompt}
                    className="w-full flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/35 rounded-2xl px-3 py-2 shadow-2xl"
                >
                    <input
                        type="text"
                        value={promptInput}
                        onChange={e => setPromptInput(e.target.value)}
                        placeholder="Ask MyOS-Cortex anything — watch the outer Prism fade & inner Rubik's Cortex twist slices in real time..."
                        className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none px-2"
                    />
                    <button
                        type="submit"
                        disabled={isThinking}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        {isThinking ? '⚡ Streaming...' : '🧠 Pulse Cortex'}
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-slate-300 text-xs font-bold"
                        >
                            Exit
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};
