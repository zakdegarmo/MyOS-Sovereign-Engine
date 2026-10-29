import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Html, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, RotateCw, ZoomIn, Eye, Activity, Shield, Sparkles, ChevronDown, X } from 'lucide-react';

interface BarbarianBenchmarkProps {
    onClose?: () => void;
}

// 1. Podium 1: The 2D Initial Concept Art Billboard
const ConceptArtBillboard: React.FC<{ url: string; position: [number, number, number] }> = ({ url, position }) => {
    const texture = React.useMemo(() => new THREE.TextureLoader().load(url), [url]);
    return (
        <group position={position}>
            {/* Holographic Frame */}
            <mesh position={[0, 1.7, 0]}>
                <planeGeometry args={[1.9, 3.4]} />
                <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
            </mesh>
            {/* Podium Base */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.1, 1.2, 0.1, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
                <ringGeometry args={[1.25, 1.35, 32]} />
                <meshBasicMaterial color="#60a5fa" side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, -0.2, 1.2]} fontSize={0.16} color="#93c5fd" anchorX="center" anchorY="top">
                [1. CONCEPT ART]
            </Text>
            <Text position={[0, -0.4, 1.2]} fontSize={0.11} color="#64748b" anchorX="center" anchorY="top">
                Reference Source (2D)
            </Text>
        </group>
    );
};

// 2. Podium 2: The 2D LPC Paperdoll Billboard
const LpcPaperdollBillboard: React.FC<{ url: string; position: [number, number, number]; isPlaying: boolean }> = ({ url, position, isPlaying }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const texture = React.useMemo(() => {
        const tex = new THREE.TextureLoader().load(url);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        // LPC walk is 9 frames across row 10 (south)
        tex.repeat.set(1 / 13, 1 / 21);
        tex.offset.set(0, 1 - (11 / 21));
        return tex;
    }, [url]);

    const frameRef = useRef(0);
    const timerRef = useRef(0);

    useFrame((_, delta) => {
        if (!isPlaying) return;
        timerRef.current += delta;
        if (timerRef.current > 0.12) {
            timerRef.current = 0;
            frameRef.current = (frameRef.current + 1) % 9;
            texture.offset.x = frameRef.current / 13;
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} position={[0, 1.5, 0]}>
                <planeGeometry args={[1.8, 2.2]} />
                <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.1, 1.2, 0.1, 32]} />
                <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
                <ringGeometry args={[1.25, 1.35, 32]} />
                <meshBasicMaterial color="#34d399" side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, -0.2, 1.2]} fontSize={0.16} color="#6ee7b7" anchorX="center" anchorY="top">
                [2. LPC PAPERDOLL]
            </Text>
            <Text position={[0, -0.4, 1.2]} fontSize={0.11} color="#64748b" anchorX="center" anchorY="top">
                64x64 Pixel Art Grid
            </Text>
        </group>
    );
};

// 3. Podium 3: The 2.5D Golem Directional Spritesheet
const GolemAvatarBillboard: React.FC<{
    idleUrl: string;
    walkUrl: string;
    position: [number, number, number];
    actionName: string;
    isPlaying: boolean;
}> = ({ idleUrl, walkUrl, position, actionName, isPlaying }) => {
    const isWalk = actionName.toLowerCase().includes('walk') || actionName.toLowerCase().includes('jog');
    const url = isWalk ? walkUrl : idleUrl;

    const texture = React.useMemo(() => {
        const tex = new THREE.TextureLoader().load(url);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.repeat.set(0.25, 0.25);
        tex.offset.set(0, 0.75); // Top row: South front-facing
        return tex;
    }, [url]);

    const frameRef = useRef(0);
    const timerRef = useRef(0);

    useFrame((_, delta) => {
        if (!isPlaying) return;
        timerRef.current += delta;
        if (timerRef.current > 0.14) {
            timerRef.current = 0;
            frameRef.current = (frameRef.current + 1) % 4;
            texture.offset.x = (frameRef.current % 4) * 0.25;
        }
    });

    return (
        <group position={position}>
            <mesh position={[0, 1.5, 0]}>
                <planeGeometry args={[2.0, 2.4]} />
                <meshBasicMaterial map={texture} transparent={true} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.1, 1.2, 0.1, 32]} />
                <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
                <ringGeometry args={[1.25, 1.35, 32]} />
                <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, -0.2, 1.2]} fontSize={0.16} color="#fde68a" anchorX="center" anchorY="top">
                [3. GOLEM (2.5D)]
            </Text>
            <Text position={[0, -0.4, 1.2]} fontSize={0.11} color="#64748b" anchorX="center" anchorY="top">
                Directional Prerender
            </Text>
        </group>
    );
};

// 4. Podium 4: The 3D Real-Time Chibi Mesh with Live Skeletal Animation
const Chibi3DActor: React.FC<{
    modelUrl: string;
    position: [number, number, number];
    actionName: string;
    isPlaying: boolean;
}> = ({ modelUrl, position, actionName, isPlaying }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(modelUrl);
    const { actions, names } = useAnimations(animations, groupRef);

    useEffect(() => {
        if (!actions || names.length === 0) return;

        // Find exact or closest action match
        let targetAnim = names.find(n => n.toLowerCase() === actionName.toLowerCase());
        if (!targetAnim) {
            targetAnim = names.find(n => n.toLowerCase().includes(actionName.toLowerCase()));
        }
        if (!targetAnim) {
            targetAnim = names.includes('Idle_Loop') ? 'Idle_Loop' : names[0];
        }

        const currentAction = actions[targetAnim];
        if (currentAction) {
            currentAction.reset().fadeIn(0.2).play();
            if (!isPlaying) {
                currentAction.paused = true;
            } else {
                currentAction.paused = false;
            }
        }

        return () => {
            currentAction?.fadeOut(0.2);
        };
    }, [actionName, actions, names, isPlaying]);

    return (
        <group position={position}>
            <group ref={groupRef} position={[0, 0.1, 0]} scale={1.2}>
                <primitive object={scene} />
            </group>
            {/* Podium Base */}
            <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[1.1, 1.2, 0.1, 32]} />
                <meshStandardMaterial color="#f43f5e" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.01, 0]}>
                <ringGeometry args={[1.25, 1.35, 32]} />
                <meshBasicMaterial color="#fb7185" side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, -0.2, 1.2]} fontSize={0.16} color="#fecdd3" anchorX="center" anchorY="top">
                [4. CHIBI (3D REALTIME)]
            </Text>
            <Text position={[0, -0.4, 1.2]} fontSize={0.11} color="#64748b" anchorX="center" anchorY="top">
                Vertex-Skinned Biped Rig
            </Text>
        </group>
    );
};

export const BarbarianBenchmarkSandbox: React.FC<BarbarianBenchmarkProps> = ({ onClose }) => {
    const [selectedAction, setSelectedAction] = useState('Idle_Loop');
    const [isPlaying, setIsPlaying] = useState(true);
    const [cameraFocus, setCameraFocus] = useState<'all' | 'concept' | 'lpc' | 'golem' | 'chibi'>('all');

    const AVAILABLE_ANIMATIONS = [
        { id: 'Idle_Loop', label: 'Idle Stance (Loop)' },
        { id: 'Sword_Attack', label: 'Sword Attack / Slash' },
        { id: 'Jog_Fwd_Loop', label: 'Jog / Run Forward' },
        { id: 'Walk_Loop', label: 'Walk Forward' },
        { id: 'Dance_Loop', label: 'Barbarian Victory Dance' },
        { id: 'Spell_Simple_Shoot', label: 'War Cry / Spell Cast' },
        { id: 'Hit_Chest', label: 'Hit Reaction (Chest)' },
        { id: 'Death01', label: 'Defeat / Fall' },
        { id: 'Jump_Loop', label: 'Jump In Air' },
        { id: 'Punch_Cross', label: 'Brawler Punch' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl border border-white/10 shadow-2xl font-mono text-white">
            {/* Top Bar Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/60">
                <div className="flex items-center gap-3">
                    <span className="p-2 bg-gradient-to-tr from-amber-600 to-rose-600 rounded-xl text-lg shadow-lg shadow-rose-500/20">
                        ⚔️
                    </span>
                    <div>
                        <h2 className="text-sm font-black tracking-wider uppercase text-rose-300">
                            Barbarian Lady Benchmark Arena
                        </h2>
                        <p className="text-[10px] text-white/50">
                            Tri-Species Architectural Evaluation: Concept Art → LPC 2D → Golem 2.5D → Chibi 3D
                        </p>
                    </div>
                </div>

                {/* Animation & Playback Bar */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                        <span className="text-[10px] text-white/60 font-bold uppercase">Shared Action:</span>
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="bg-black/80 border border-white/20 rounded-lg text-xs px-2.5 py-1 text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
                        >
                            {AVAILABLE_ANIMATIONS.map((anim) => (
                                <option key={anim.id} value={anim.id}>
                                    {anim.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isPlaying
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                        }`}
                    >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    {/* Camera Focus Presets */}
                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl text-[10px]">
                        <button
                            onClick={() => setCameraFocus('all')}
                            className={`px-2 py-1 rounded-lg font-bold transition-all ${cameraFocus === 'all' ? 'bg-cyan-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            All 4
                        </button>
                        <button
                            onClick={() => setCameraFocus('concept')}
                            className={`px-2 py-1 rounded-lg font-bold transition-all ${cameraFocus === 'concept' ? 'bg-blue-500 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Concept
                        </button>
                        <button
                            onClick={() => setCameraFocus('lpc')}
                            className={`px-2 py-1 rounded-lg font-bold transition-all ${cameraFocus === 'lpc' ? 'bg-emerald-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            LPC
                        </button>
                        <button
                            onClick={() => setCameraFocus('golem')}
                            className={`px-2 py-1 rounded-lg font-bold transition-all ${cameraFocus === 'golem' ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                            Golem
                        </button>
                        <button
                            onClick={() => setCameraFocus('chibi')}
                            className={`px-2 py-1 rounded-lg font-bold transition-all ${cameraFocus === 'chibi' ? 'bg-rose-500 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            Chibi 3D
                        </button>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>

            {/* Main 3D Viewport Soundstage */}
            <div className="relative flex-1 w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-black overflow-hidden">
                <Canvas
                    shadows
                    camera={{ position: [0, 2.5, 9.5], fov: 42 }}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                >
                    <ambientLight intensity={1.2} />
                    <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
                    <pointLight position={[-4, 4, -2]} intensity={0.8} color="#60a5fa" />
                    <pointLight position={[4, 4, -2]} intensity={0.8} color="#f43f5e" />

                    <Suspense fallback={null}>
                        {/* 1. Concept Art */}
                        <ConceptArtBillboard
                            url="/textures/avatars/barbarian_lady_concept.png"
                            position={[-4.5, 0, 0]}
                        />

                        {/* 2. LPC Paperdoll */}
                        <LpcPaperdollBillboard
                            url="/textures/avatars/lpc/barbarian_lady_lpc.png"
                            position={[-1.5, 0, 0]}
                            isPlaying={isPlaying}
                        />

                        {/* 3. 2.5D Golem */}
                        <GolemAvatarBillboard
                            idleUrl="/actions/barbarian_lady_golem_idle.png"
                            walkUrl="/actions/barbarian_lady_golem_walk.png"
                            position={[1.5, 0, 0]}
                            actionName={selectedAction}
                            isPlaying={isPlaying}
                        />

                        {/* 4. 3D Chibi Rigged Actor */}
                        <Chibi3DActor
                            modelUrl="/models/characters/barbarian_lady_chibi.glb"
                            position={[4.5, 0, 0]}
                            actionName={selectedAction}
                            isPlaying={isPlaying}
                        />

                        {/* Staging Ground Floor & Grid */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                            <planeGeometry args={[24, 16]} />
                            <meshStandardMaterial color="#0a0f1d" roughness={0.8} metalness={0.2} />
                        </mesh>
                        <Grid
                            position={[0, 0, 0]}
                            args={[24, 16]}
                            cellSize={0.5}
                            cellThickness={0.6}
                            cellColor="#1e293b"
                            sectionSize={2.0}
                            sectionThickness={1.2}
                            sectionColor="#334155"
                            fadeDistance={20}
                        />
                    </Suspense>

                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        maxPolarAngle={Math.PI / 2 + 0.05}
                        minDistance={2}
                        maxDistance={18}
                        target={[0, 1.2, 0]}
                    />
                </Canvas>

                {/* Bottom Architectural Species Metrics Panel */}
                <div className="absolute bottom-4 left-6 right-6 grid grid-cols-4 gap-3 pointer-events-none">
                    <div className="bg-blue-950/40 border border-blue-500/30 p-2.5 rounded-2xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider block">
                            Paradigm 1: Initial Concept
                        </span>
                        <p className="text-[11px] text-white/80 mt-1">
                            Diffusion-synthesized 2D raster plate. Foundation for anatomical proportions, hair palette, and armor silhouettes.
                        </p>
                        <div className="mt-2 text-[9px] text-white/40 flex justify-between">
                            <span>Draw Calls: 1</span>
                            <span>Memory: ~1.2 MB</span>
                        </div>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-2xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">
                            Paradigm 2: LPC Paperdoll
                        </span>
                        <p className="text-[11px] text-white/80 mt-1">
                            Modular 64x64 pixel art sprite sheets composed on layered canvas. Ideal for 16-bit retro realms and top-down RPGs.
                        </p>
                        <div className="mt-2 text-[9px] text-white/40 flex justify-between">
                            <span>Draw Calls: 1</span>
                            <span>Memory: ~350 KB</span>
                        </div>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-2xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                            Paradigm 3: Golem (2.5D)
                        </span>
                        <p className="text-[11px] text-white/80 mt-1">
                            Blender-baked directional sprite grids (Larry/Lunaria class). Depth-sorted billboard quads with zero GPU skeletal cost.
                        </p>
                        <div className="mt-2 text-[9px] text-white/40 flex justify-between">
                            <span>Draw Calls: 1 / quad</span>
                            <span>Memory: ~2.4 MB</span>
                        </div>
                    </div>

                    <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-2xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider block">
                            Paradigm 4: Chibi (3D Realtime)
                        </span>
                        <p className="text-[11px] text-white/80 mt-1">
                            Vertex-skinned 3D biped mesh with 45 Mixamo animations, dynamic shadows, and PBR shaders. Best for cinematic soundstages.
                        </p>
                        <div className="mt-2 text-[9px] text-white/40 flex justify-between">
                            <span>Draw Calls: ~4</span>
                            <span>Poly Count: ~9.2k</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
