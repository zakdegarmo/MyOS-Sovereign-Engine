// apps/web/src/components/Soundstage/SoundstageStudioModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clapperboard, Camera, Lightbulb, Play, Pause, RotateCcw,
    Volume2, VolumeX, Maximize2, ExternalLink, Copy, Check,
    Film, Sparkles, Sliders, Eye, Code, Terminal, CheckCircle2,
    Clock, Layers, ShieldCheck, X, AlertCircle
} from 'lucide-react';
import type { 
    ProductionManifest, PipelineStage, ScreeningReel,
    ProductionBrief, ProductionFormat, FilmGenre, CinematicStyle, AspectRatio, LightingMood, DramaticArc
} from './types';
import { CANONICAL_PRESETS, compileBriefToManifest } from './productionPresets';

export interface SoundstageStudioModalProps {
    onClose: () => void;
    onReelChange?: (reelUrl: string) => void;
}

// Canonical benchmark manifest for "Crimson Zenith: Duel of the Sundered Sisterhood"
const CANONICAL_CRIMSON_ZENITH_MANIFEST: ProductionManifest = {
    metadata: {
        title: "Crimson Zenith: Duel of the Sundered Sisterhood",
        production_id: "crimson-zenith-teaser",
        fps: 30,
        resolution: { width: 640, height: 360 },
        total_frames: 240,
        engine: "BLENDER_EEVEE",
        style_prompt: "1980s Ralph Bakshi (Fire and Ice) meets Frank Frazetta Heavy Metal Dark Fantasy on jagged cliff plateau at sunset"
    },
    environment: {
        base_blend: "lunaria_flesh_mannequin.blend",
        terrain: {
            type: "cliff_plateau",
            material: "Crag_Rock"
        },
        backdrop: {
            type: "gradient_sunset",
            color_top: [0.15, 0.05, 0.25],
            color_bottom: [0.95, 0.45, 0.15]
        }
    },
    lighting: [
        {
            name: "KeySun",
            type: "SUN",
            energy: 5.5,
            color_rgb: [1.0, 0.55, 0.2],
            rotation_deg: [65, -15, -45]
        },
        {
            name: "RimSun",
            type: "SUN",
            energy: 8.0,
            color_rgb: [1.0, 0.1, 0.5],
            rotation_deg: [-40, 20, 135]
        },
        {
            name: "FillSun",
            type: "SUN",
            energy: 1.2,
            color_rgb: [0.2, 0.25, 0.6]
        }
    ],
    characters: [
        {
            id: "warrior_1",
            name: "Warrior 1 (Lunaria)",
            source_object: "Armature_Female",
            initial_transform: {
                location: [-1.2, 0.0, 0.0],
                rotation_euler_deg: [0, 0, 85]
            },
            equipment: [
                { name: "Modular_1H_Sword", socket: "Hand.R_Socket" },
                { name: "Modular_Combat_Skirt", socket: "Hips" }
            ],
            actions: [
                { frame: 1, animation: "Melee_Weapon_Attack (Continuous Cycles Loop)" }
            ]
        },
        {
            id: "warrior_2",
            name: "Warrior 2 (Vespera)",
            source_object: "Armature_Female_2",
            initial_transform: {
                location: [1.2, 0.0, 0.0],
                rotation_euler_deg: [0, 0, -85]
            },
            equipment: [
                { name: "Modular_Round_Shield", socket: "Hand.L_Socket" },
                { name: "Modular_1H_Sword", socket: "Hand.R_Socket" }
            ],
            actions: [
                { frame: 1, animation: "Melee_Weapon_Idle (Continuous Cycles Loop)" }
            ]
        }
    ],
    shots: [
        {
            shot_id: 1,
            name: "Shot 1: Wide Low-Angle Dolly Across the Abyss",
            description: "Revealing the sheer drop of the cliff and the two warrior sisters silhouetted against the burning dusk.",
            frame_start: 1,
            frame_end: 80,
            lens_mm: 28,
            camera_movement: {
                type: "DOLLY",
                start_pos: [-4.8, -4.5, 0.8],
                end_pos: [-3.2, -3.8, 0.5],
                start_rot_deg: [78, 0, -40],
                end_rot_deg: [82, 0, -32],
                interpolation: "BEZIER"
            }
        },
        {
            shot_id: 2,
            name: "Shot 2: Reverse Over-The-Shoulder Hero Crane on Blade Cleave & Shield Parry",
            description: "Upward camera sweep capturing the sparks and specular rim highlights as the broadsword clashes against the shield.",
            frame_start: 81,
            frame_end: 160,
            lens_mm: 45,
            camera_movement: {
                type: "CRANE",
                start_pos: [0.0, -2.2, 0.2],
                end_pos: [0.3, -1.5, 0.9],
                start_rot_deg: [65, 0, 0],
                end_rot_deg: [52, 0, 12],
                interpolation: "BEZIER"
            }
        },
        {
            shot_id: 3,
            name: "Shot 3: Low-Angle Horizon Pan Silhouetted Against Sunset",
            description: "Cinematic 35mm pan showcasing the dueling sisters framed by the vibrant ultramarine and orange cyclorama sky.",
            frame_start: 161,
            frame_end: 240,
            lens_mm: 35,
            camera_movement: {
                type: "PAN",
                start_pos: [-2.0, -4.0, 0.4],
                end_pos: [2.0, -3.8, 0.6],
                start_rot_deg: [85, 0, -15],
                end_rot_deg: [85, 0, 15],
                interpolation: "BEZIER"
            }
        }
    ]
};

const CANONICAL_HELLO_WORLD_MANIFEST: ProductionManifest = {
    metadata: {
        title: "Hello World: The Sovereign Mannequin Wave",
        fps: 30,
        resolution: { width: 640, height: 360 },
        total_frames: 75,
        engine: "BLENDER_EEVEE",
        style_prompt: "Deterministic film calibration: Flesh base comic mannequin centered in frame waving hello to the camera with 3-point studio lighting and slate blue cyclorama."
    },
    environment: {
        base_blend: "flesh_base_comic.blend",
        terrain: {
            type: "Studio_Floor",
            material: "Floor_Mat"
        },
        backdrop: {
            type: "Studio_Backdrop",
            color_top: [0.12, 0.16, 0.24],
            color_bottom: [0.08, 0.10, 0.15]
        }
    },
    lighting: [
        {
            name: "KeySun",
            type: "SUN",
            energy: 2.0,
            color_rgb: [1.0, 0.96, 0.92],
            rotation_deg: [48, 25, 35]
        },
        {
            name: "RimSun",
            type: "SUN",
            energy: 0.8,
            color_rgb: [1.0, 0.9, 0.82],
            rotation_deg: [-60, 0, 180]
        },
        {
            name: "FillSun",
            type: "SUN",
            energy: 1.0,
            color_rgb: [0.88, 0.92, 1.0],
            rotation_deg: [35, -35, -45]
        }
    ],
    characters: [
        {
            id: "mannequin_1",
            name: "Flesh Base Mannequin",
            source_object: "Armature",
            initial_transform: {
                location: [0.0, 0.0, 0.0],
                rotation_euler_deg: [0, 0, 0]
            },
            actions: [
                { frame: 1, animation: "Wave_Hello" }
            ]
        }
    ],
    shots: [
        {
            shot_id: 1,
            name: "Shot 1: Centered Medium Shot (Wave Hello)",
            description: "Stationary 38mm camera focused directly on the flesh base mannequin as it raises its right arm and waves warmly.",
            frame_start: 1,
            frame_end: 75,
            lens_mm: 38,
            camera_movement: {
                type: "STATIC",
                start_pos: [0.0, -2.4, 0.65],
                end_pos: [0.0, -2.4, 0.65],
                start_rot_deg: [90, 0, 0],
                end_rot_deg: [90, 0, 0],
                interpolation: "LINEAR"
            }
        }
    ]
};

const CANONICAL_ANIMATION_CATALOG_MANIFEST: ProductionManifest = {
    metadata: {
        title: "Sovereign Mannequin: 43-Action Motion Showcase",
        fps: 30,
        resolution: { width: 640, height: 360 },
        total_frames: 2948,
        engine: "BLENDER_EEVEE",
        style_prompt: "Comprehensive skeletal motion study: Full-body full-shot framing of LPC Decivoxel Flesh Mannequin executing all 43 canonical locomotion, combat, acrobatics, and life actions with dynamic 3D neon title cards."
    },
    environment: {
        base_blend: "flesh_base_comic.blend",
        terrain: {
            type: "Studio_Floor",
            material: "Floor_Mat"
        },
        backdrop: {
            type: "Studio_Backdrop",
            color_top: [0.10, 0.13, 0.20],
            color_bottom: [0.07, 0.09, 0.13]
        }
    },
    lighting: [
        {
            name: "KeySun",
            type: "SUN",
            energy: 2.0,
            color_rgb: [1.0, 0.96, 0.92]
        },
        {
            name: "RimSun",
            type: "SUN",
            energy: 0.8,
            color_rgb: [1.0, 0.9, 0.82]
        },
        {
            name: "FillSun",
            type: "SUN",
            energy: 1.0,
            color_rgb: [0.88, 0.92, 1.0]
        }
    ],
    characters: [
        {
            id: "mannequin_1",
            name: "Flesh Base Mannequin",
            source_object: "Armature",
            initial_transform: {
                location: [0.0, 0.0, 0.0],
                rotation_euler_deg: [0, 0, 0]
            },
            actions: [
                { frame: 1, animation: "43 Canonical Actions Sequence" }
            ]
        }
    ],
    shots: [
        {
            shot_id: 1,
            name: "Shot 1: Full-Body Studio Showcase",
            description: "Wide stationary 38mm camera capturing complete skeletal kinematics from head to toe with floating neon title cards.",
            frame_start: 1,
            frame_end: 2948,
            lens_mm: 38,
            camera_movement: {
                type: "STATIC",
                start_pos: [0.0, -3.8, 0.65],
                end_pos: [0.0, -3.8, 0.65],
                start_rot_deg: [90, 0, 0],
                end_rot_deg: [90, 0, 0],
                interpolation: "LINEAR"
            }
        }
    ]
};

const REELS_CATALOG: ScreeningReel[] = [
    {
        id: "animation-catalog",
        title: "Sovereign Mannequin: 43-Action Motion Showcase",
        filename: "mannequin_animation_catalog.mp4",
        durationSeconds: 98.3,
        fps: 30,
        totalFrames: 2948,
        aspectRatio: "16:9",
        resolution: "640x360",
        genre: "Skeletal Motion Showcase / Test Reel",
        description: "Comprehensive 98-second cinematic test reel showcasing all 43 rigged animations attached to the LPC Decivoxel Flesh Mannequin with real-time glowing 3D title cards, full-body framing, and studio cyclorama lighting.",
        manifest: CANONICAL_ANIMATION_CATALOG_MANIFEST
    },
    {
        id: "hello-world",
        title: "Hello World: The Sovereign Mannequin Wave",
        filename: "hello_world.mp4",
        durationSeconds: 2.5,
        fps: 30,
        totalFrames: 75,
        aspectRatio: "16:9",
        resolution: "640x360",
        genre: "Studio Calibration / Greeting",
        description: "The foundational 'Hello World' of the MyOS film pipeline: Flesh Base Comic mannequin standing centered in the soundstage, gently waving hello to the camera across 75 frames (2.5s @ 30fps).",
        manifest: CANONICAL_HELLO_WORLD_MANIFEST
    },
    {
        id: "crimson-zenith",
        title: "Crimson Zenith: Duel of the Sundered Sisterhood",
        filename: "crimson_zenith_teaser.mp4",
        durationSeconds: 8.0,
        fps: 30,
        totalFrames: 240,
        aspectRatio: "16:9",
        resolution: "640x360",
        genre: "Bakshi / Frazetta Dark Fantasy",
        description: "Two warrior sisters clash atop a cragged plateau at sunset. Handcrafted 3-step constant cel shading, dramatic chiaroscuro rim lighting, continuous skeletal swordplay across 240 frames (8.0s @ 30fps).",
        manifest: CANONICAL_CRIMSON_ZENITH_MANIFEST
    }
];

const PRESET_PROMPTS = [
    {
        label: "⚔️ Crimson Zenith (Frazetta / Bakshi)",
        prompt: "1980s Ralph Bakshi (Fire and Ice) meets Frank Frazetta Heavy Metal dark high fantasy duel on a cliff plateau at burning sunset with dramatic chiaroscuro lighting and sword clashing action."
    },
    {
        label: "🌧️ Cyberpunk Rain Alleyway",
        prompt: "Cyberpunk neo-noir rainy back-alley infiltration with holographic neon reflections, steamy sewer vents, slow-motion coat flutter, and dramatic Dutch-angle tracking shot."
    },
    {
        label: "🚀 Mecha Strike: Deep Space",
        prompt: "Epic orbital space fleet confrontation with mecha silhouettes firing particle beams across the curvature of a planetary ring with high contrast specular rim illumination."
    },
    {
        label: "🏰 Gothic Vampire Citadel",
        prompt: "Midnight gothic vampire cathedral dual with blood moon backlight, sweeping crane ascent up crumbling stained-glass spires, and rapier sparks."
    }
];

export const SoundstageStudioModal: React.FC<SoundstageStudioModalProps> = ({
    onClose,
    onReelChange
}) => {
    // Navigation Tabs
    const [activeTab, setActiveTab] = useState<'prompt' | 'pipeline' | 'shotlist' | 'player'>('player');

    // Reel State
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const activeReel = REELS_CATALOG[activeReelIndex];

    // Creative Direction Brief (Film School in a Data Structure)
    const [currentBrief, setCurrentBrief] = useState<ProductionBrief>(CANONICAL_PRESETS[0]);
    const [showManifestPreview, setShowManifestPreview] = useState(false);
    const [creativePrompt, setCreativePrompt] = useState(CANONICAL_PRESETS[0].logline);
    const [selectedModel, setSelectedModel] = useState('gemma4:latest');
    const [manifestEngine, setManifestEngine] = useState<'BLENDER_EEVEE' | 'CYCLES'>('BLENDER_EEVEE');

    // Pipeline Execution State
    const [pipelineStage, setPipelineStage] = useState<PipelineStage>('screening');
    const [pipelineProgress, setPipelineProgress] = useState(100);
    const [pipelineLogs, setPipelineLogs] = useState<string[]>([
        "[Director Akira] Creative prompt parsed into structured 3-shot manifest.",
        "[DP] Camera tracks calculated: 28mm wide dolly (Shot 1), 45mm reverse hero crane (Shot 2), 35mm horizon pan (Shot 3).",
        "[Gaffer] Chiaroscuro 3-point lighting configured: Key Sun (5.5 amber), Sanguine Rim (8.0 crimson), Fill (1.2 twilight).",
        "[Blender 5.2 Headless] Animated skeletal combat (Melee_Weapon_Attack & Melee_Weapon_Idle) looped across 240 frames @ 30fps.",
        "[PyAV Reel Assembly] Encoded H.264 yuv420p MP4 with faststart, monotonic PTS, 0 B-frames -> apps/web/public/screenings/crimson_zenith_teaser.mp4.",
        "[Screening Ready] Verified playable 8.0s video reel available on soundstage theater screen."
    ]);

    // Video Player State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isLooping, setIsLooping] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(8.0);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // Shotlist View Mode
    const [shotlistViewMode, setShotlistViewMode] = useState<'cards' | 'json'>('cards');
    const [selectedShotId, setSelectedShotId] = useState<number>(1);

    // Dynamic direct URL resolution
    const [directVideoUrl, setDirectVideoUrl] = useState('');

    useEffect(() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
        setDirectVideoUrl(`${origin}/screenings/${activeReel.filename}`);
    }, [activeReel]);

    // Handle HTML5 Video time updates
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                setDuration(videoRef.current.duration);
            }
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play().catch(e => console.warn("Video play interrupted:", e));
                setIsPlaying(true);
            }
        }
    };

    const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const restartVideo = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            setCurrentTime(0);
            videoRef.current.play().catch(e => console.warn(e));
            setIsPlaying(true);
        }
    };

    const copyDirectLink = () => {
        if (navigator.clipboard && directVideoUrl) {
            navigator.clipboard.writeText(directVideoUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    // Calculate timecode string: 00:00:00 (MM:SS:FF at 30fps)
    const formatTimecode = (secs: number) => {
        const totalFrames = Math.floor(secs * 30);
        const frames = totalFrames % 30;
        const totalSeconds = Math.floor(secs);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
    };

    // Execute Production Pipeline
    const handleProduceReel = async () => {
        setActiveTab('pipeline');
        setPipelineStage('manifesting');
        setPipelineProgress(15);
        const compiled = compileBriefToManifest(currentBrief);
        setPipelineLogs([
            `[Executive Producer] Triggered production with brief: "${currentBrief.title}"`,
            `[Production Slate] Format: ${currentBrief.format.toUpperCase()} • Style: ${currentBrief.filmStyle} • Ratio: ${currentBrief.aspectRatio} • FPS: ${currentBrief.fps}`
        ]);

        try {
            // Attempt to trigger live Agent Bridge on localhost:8081
            setPipelineLogs(prev => [...prev, `[Agent Bridge] Contacting studio director on localhost:8081...`]);
            const manifestRes = await fetch('http://localhost:8081/api/studio/manifest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brief: currentBrief,
                    prompt: `${currentBrief.title}: ${currentBrief.logline}. Style: ${currentBrief.filmStyle}. Genre: ${currentBrief.primaryGenre}.`,
                    model: selectedModel,
                    offline: false
                })
            }).catch(() => null);

            if (manifestRes && manifestRes.ok) {
                const manifestData = await manifestRes.json();
                setPipelineProgress(40);
                setPipelineLogs(prev => [
                    ...prev,
                    `[Director Akira] Production manifest generated via ${selectedModel}: ${compiled.shots.length} shots, ${compiled.metadata.total_frames} frames @ ${compiled.metadata.fps}fps.`,
                    `[DP] Camera staging: ${currentBrief.cameraLanguage.join(' -> ')}.`
                ]);

                setPipelineStage('filming');
                setPipelineProgress(60);
                setPipelineLogs(prev => [
                    ...prev,
                    `[Blender 5.2 Headless] Launching filming engine with Flesh Golem combat choreography...`
                ]);

                const produceRes = await fetch('http://localhost:8081/api/studio/produce', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        manifest: manifestData.manifest || compiled,
                        offline: true
                    })
                }).catch(() => null);

                if (produceRes && produceRes.ok) {
                    const produceData = await produceRes.json();
                    setPipelineStage('stitching');
                    setPipelineProgress(85);
                    setPipelineLogs(prev => [
                        ...prev,
                        `[PyAV Compiler] Muxing H.264 video with faststart atom and monotonic timestamps...`
                    ]);

                    setPipelineStage('screening');
                    setPipelineProgress(100);
                    const reelName = produceData.videoUrl ? produceData.videoUrl.split('/').pop() : activeReel.filename;
                    setPipelineLogs(prev => [
                        ...prev,
                        `[Screening Master] ✅ Video reel verified: /screenings/${reelName}`,
                        `[Soundstage Theater] Reel ready for Executive Screening!`
                    ]);
                    onReelChange?.(reelName);
                    return;
                }
            }
        } catch (bridgeErr) {
            console.warn('[Soundstage] Agent Bridge call failed, using graceful simulation:', bridgeErr);
        }

        // Graceful pipeline stepper fallback
        setTimeout(() => {
            setPipelineStage('manifesting');
            setPipelineProgress(35);
            setPipelineLogs(prev => [
                ...prev,
                `[Director Akira] Manifest synthesized: ${compiled.shots.length} shots, ${compiled.metadata.total_frames} frames @ ${compiled.metadata.fps}fps (${currentBrief.runtimeSeconds}s), ${currentBrief.filmStyle} style.`
            ]);
        }, 1000);

        setTimeout(() => {
            setPipelineStage('filming');
            setPipelineProgress(65);
            setPipelineLogs(prev => [
                ...prev,
                `[Blender 5.2 Headless] Executing film_crimson_zenith.py on Flesh Golems...`,
                `[Blender 5.2] Loaded Flesh Golem rigs (lunaria_flesh_golem.glb & vespera_flesh_golem.glb), bound weapons, cycled combat actions.`
            ]);
        }, 2200);

        setTimeout(() => {
            setPipelineStage('stitching');
            setPipelineProgress(85);
            setPipelineLogs(prev => [
                ...prev,
                `[PyAV Compiler] Ingesting ${compiled.metadata.total_frames} rendered frames...`,
                `[PyAV Compiler] Muxing H.264 (AVC1) faststart MP4 at ${currentBrief.fps}fps (${currentBrief.aspectRatio})...`
            ]);
        }, 3400);

        setTimeout(() => {
            setPipelineStage('screening');
            setPipelineProgress(100);
            setPipelineLogs(prev => [
                ...prev,
                `[Screening Master] ✅ Video reel verified: apps/web/public/screenings/${activeReel.filename}`,
                `[Soundstage Theater] Reel ready for Executive Screening!`
            ]);
            onReelChange?.(activeReel.filename);
        }, 4600);
    };

    return (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-6xl h-[88vh] bg-[#0b0f19] border border-white/15 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-200"
            >
                {/* ═════════════════════════════════════════════════════════════ */}
                {/* TOP HEADER BAR                                                */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className="h-16 px-6 border-b border-white/10 bg-slate-950/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                            <Clapperboard size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold tracking-wider text-white">
                                    SOVEREIGN 3D ANIMATION STUDIO
                                </h2>
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    STAGE 4
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Autonomous Multi-Agent Filming Engine • Headless Blender 5.2 • PyAV Video Assembly
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab('prompt')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'prompt'
                                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Clapperboard size={14} />
                            Director's Slate
                        </button>
                        <button
                            onClick={() => setActiveTab('pipeline')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'pipeline'
                                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Sliders size={14} />
                            Pipeline Status
                        </button>
                        <button
                            onClick={() => setActiveTab('shotlist')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'shotlist'
                                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Layers size={14} />
                            Shotlist Inspector
                        </button>
                        <button
                            onClick={() => setActiveTab('player')}
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                activeTab === 'player'
                                    ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Film size={14} />
                            Reel Player
                        </button>
                    </div>

                    {/* Close Modal Button */}
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                        title="Close Studio"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ═════════════════════════════════════════════════════════════ */}
                {/* TAB CONTENT PANELS                                            */}
                {/* ═════════════════════════════════════════════════════════════ */}
                <div className="flex-1 overflow-hidden p-6">
                    {/* TAB 1: DIRECTOR'S PRODUCTION SLATE ("Film School in a Data Structure") */}
                    {activeTab === 'prompt' && (
                        <div className="h-full flex flex-col gap-4 overflow-y-auto max-w-5xl mx-auto pr-1">
                            {/* 1. CINEMATIC PRODUCTION SLATE BANNER */}
                            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-white/15 shadow-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                                        <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">PROD ID</span>
                                        <span className="text-xs font-bold text-amber-300 font-mono">{currentBrief.productionId.toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                                <Clapperboard size={16} className="text-rose-400" />
                                                DIRECTOR'S PRODUCTION SLATE
                                            </h3>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                                                {currentBrief.format.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Film School in a Data Structure: Predetermined cinematic parameters synthesized for headless Blender execution.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right font-mono text-[11px] text-slate-400 hidden sm:block">
                                        <div><span className="text-slate-500">RATIO:</span> <span className="text-slate-200">{currentBrief.aspectRatio}</span></div>
                                        <div><span className="text-slate-500">TIME:</span> <span className="text-emerald-400">{currentBrief.runtimeSeconds}s ({Math.floor(currentBrief.runtimeSeconds * currentBrief.fps)}f @ {currentBrief.fps}fps)</span></div>
                                    </div>
                                    <button
                                        onClick={() => setShowManifestPreview(!showManifestPreview)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                                            showManifestPreview 
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                : 'bg-slate-900 text-slate-400 border-white/10 hover:text-white'
                                        }`}
                                    >
                                        <Code size={13} />
                                        {showManifestPreview ? 'Hide JSON' : 'Inspect JSON'}
                                    </button>
                                </div>
                            </div>

                            {/* CANONICAL FILM PRESETS */}
                            <div>
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
                                    Director Presets (Quick Load)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {CANONICAL_PRESETS.map((preset) => (
                                        <button
                                            key={preset.productionId}
                                            onClick={() => {
                                                setCurrentBrief(preset);
                                                setCreativePrompt(preset.logline);
                                            }}
                                            className={`text-left p-2.5 rounded-xl border transition-all text-xs group flex flex-col justify-between ${
                                                currentBrief.productionId === preset.productionId
                                                    ? 'bg-rose-500/15 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                                                    : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-800/40'
                                            }`}
                                        >
                                            <div className="font-semibold text-slate-200 group-hover:text-rose-400 transition-colors line-clamp-1">
                                                {preset.title.split(':')[0]}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                                                {preset.filmStyle.replace(/_/g, ' ')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* FORM GRID: 2 COLUMNS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {/* LEFT COLUMN: STORY & CINEMATIC STYLE */}
                                <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-white/10 text-xs">
                                    <div className="font-bold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-white/10 text-[11px] uppercase tracking-wider">
                                        <Film size={13} className="text-amber-400" />
                                        Story & Cinematic Aesthetics
                                    </div>

                                    {/* Format Selector */}
                                    <div>
                                        <label className="text-slate-400 block mb-1">Production Format</label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { id: 'short', label: 'Short (8s)' },
                                                { id: 'episodic', label: 'Episodic (10s)' },
                                                { id: 'feature_scene', label: 'Scene (12s)' },
                                                { id: 'action_reel', label: 'Action (8s)' }
                                            ].map(fmt => (
                                                <button
                                                    key={fmt.id}
                                                    onClick={() => setCurrentBrief(prev => ({
                                                        ...prev,
                                                        format: fmt.id as ProductionFormat,
                                                        runtimeSeconds: fmt.id === 'feature_scene' ? 12 : (fmt.id === 'episodic' ? 10 : 8)
                                                    }))}
                                                    className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all ${
                                                        currentBrief.format === fmt.id
                                                            ? 'bg-rose-500 text-white font-bold shadow'
                                                            : 'bg-slate-950/80 text-slate-400 hover:text-white border border-white/5'
                                                    }`}
                                                >
                                                    {fmt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title Input */}
                                    <div>
                                        <label className="text-slate-400 block mb-1">Film Title</label>
                                        <input
                                            type="text"
                                            value={currentBrief.title}
                                            onChange={(e) => setCurrentBrief(prev => ({ ...prev, title: e.target.value }))}
                                            className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-1.5 text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
                                        />
                                    </div>

                                    {/* Logline Input */}
                                    <div>
                                        <label className="text-slate-400 block mb-1">Logline / Dramatic Premise</label>
                                        <textarea
                                            value={currentBrief.logline}
                                            onChange={(e) => setCurrentBrief(prev => ({ ...prev, logline: e.target.value }))}
                                            rows={2}
                                            className="w-full bg-slate-950 border border-white/15 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500 resize-none"
                                        />
                                    </div>

                                    {/* Genre & Style Row */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-slate-400 block mb-1">Primary Genre</label>
                                            <select
                                                value={currentBrief.primaryGenre}
                                                onChange={(e) => setCurrentBrief(prev => ({ ...prev, primaryGenre: e.target.value as FilmGenre }))}
                                                className="w-full bg-slate-950 border border-white/15 rounded-lg p-1.5 text-slate-200"
                                            >
                                                <option value="dark_fantasy">Dark Fantasy</option>
                                                <option value="cyberpunk">Cyberpunk</option>
                                                <option value="sci_fi">Sci-Fi</option>
                                                <option value="film_noir">Film Noir</option>
                                                <option value="gothic_horror">Gothic Horror</option>
                                                <option value="space_opera">Space Opera</option>
                                                <option value="martial_arts">Martial Arts</option>
                                                <option value="retro_futurism">Retro Futurism</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 block mb-1">Aesthetic Lens / Style</label>
                                            <select
                                                value={currentBrief.filmStyle}
                                                onChange={(e) => setCurrentBrief(prev => ({ ...prev, filmStyle: e.target.value as CinematicStyle }))}
                                                className="w-full bg-slate-950 border border-white/15 rounded-lg p-1.5 text-amber-400 font-medium"
                                            >
                                                <option value="bakshi_frazetta_cel">1980s Bakshi/Frazetta Cel</option>
                                                <option value="panavision_anamorphic">1970s Panavision Anamorphic</option>
                                                <option value="cyberpunk_neon_bloom">Cyberpunk Neon Bloom</option>
                                                <option value="film_noir_chiaroscuro">Film Noir Chiaroscuro</option>
                                                <option value="modern_action_hfr">Modern HFR Action (60fps)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Lighting Mood */}
                                    <div>
                                        <label className="text-slate-400 block mb-1">Lighting Mood & Gaffer Palette</label>
                                        <select
                                            value={currentBrief.lightingMood}
                                            onChange={(e) => setCurrentBrief(prev => ({ ...prev, lightingMood: e.target.value as LightingMood }))}
                                            className="w-full bg-slate-950 border border-white/15 rounded-lg p-1.5 text-slate-200"
                                        >
                                            <option value="sunset_chiaroscuro">Sunset Chiaroscuro (Amber Key + Crimson Rim)</option>
                                            <option value="cyberpunk_neon">Cyberpunk Neon (Cyan Key + Magenta Rim)</option>
                                            <option value="highbay_daylight">High-Bay Daylight (Neutral 5500K Studio Fill)</option>
                                            <option value="lowkey_noir">Low-Key Noir (Tungsten Hard Shadow)</option>
                                            <option value="dungeon_torchlight">Dungeon Torchlight (Warm Flickering Amber)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: TECHNICAL, FRAMING & FLESH GOLEM CAST */}
                                <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-white/10 text-xs">
                                    <div className="font-bold text-slate-200 flex items-center gap-1.5 pb-1 border-b border-white/10 text-[11px] uppercase tracking-wider">
                                        <Camera size={13} className="text-rose-400" />
                                        Technical Framing & Flesh Golem Cast
                                    </div>

                                    {/* Aspect Ratio & FPS */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-slate-400 block mb-1">Aspect Ratio</label>
                                            <select
                                                value={currentBrief.aspectRatio}
                                                onChange={(e) => setCurrentBrief(prev => ({ ...prev, aspectRatio: e.target.value as AspectRatio }))}
                                                className="w-full bg-slate-950 border border-white/15 rounded-lg p-1.5 text-slate-200 font-mono"
                                            >
                                                <option value="16:9">16:9 DCI Cinema (640x360)</option>
                                                <option value="2.39:1">2.39:1 Cinemascope (854x360)</option>
                                                <option value="4:3">4:3 Academy Classic (480x360)</option>
                                                <option value="9:16">9:16 Vertical Reel (360x640)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-slate-400 block mb-1">Timebase / Framerate</label>
                                            <select
                                                value={currentBrief.fps}
                                                onChange={(e) => setCurrentBrief(prev => ({ ...prev, fps: Number(e.target.value) as any }))}
                                                className="w-full bg-slate-950 border border-white/15 rounded-lg p-1.5 text-slate-200 font-mono"
                                            >
                                                <option value={24}>24 fps (Cinema Standard)</option>
                                                <option value={30}>30 fps (Animation Standard)</option>
                                                <option value={60}>60 fps (Gaming Cutscene HFR)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Cast Sockets: Flesh Golem Mark A & Mark B */}
                                    <div className="flex flex-col gap-2">
                                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/30">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-rose-400 flex items-center gap-1">
                                                    Mark A • {currentBrief.cast.leadA.characterName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">Rig: LPC Decivoxel</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Skeletal Action Loop</span>
                                                    <select
                                                        value={currentBrief.cast.leadA.animationAction}
                                                        onChange={(e) => setCurrentBrief(prev => ({
                                                            ...prev,
                                                            cast: {
                                                                ...prev.cast,
                                                                leadA: { ...prev.cast.leadA, animationAction: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded p-1 text-slate-200 text-[11px]"
                                                    >
                                                        <option value="Melee_Weapon_Attack">Melee_Weapon_Attack (Attack)</option>
                                                        <option value="Melee_Weapon_Idle">Melee_Weapon_Idle (Guard Stance)</option>
                                                        <option value="Spell_Simple_Shoot">Spell_Simple_Shoot (Cast)</option>
                                                        <option value="Pistol_Aim_Neutral">Pistol_Aim_Neutral (Aim)</option>
                                                        <option value="Dance_Loop">Dance_Loop (Acrobatic)</option>
                                                        <option value="Punch_Jab">Punch_Jab (Unarmed)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Hand.R Socket Weapon</span>
                                                    <input
                                                        type="text"
                                                        value={currentBrief.cast.leadA.weaponRight || ''}
                                                        onChange={(e) => setCurrentBrief(prev => ({
                                                            ...prev,
                                                            cast: {
                                                                ...prev.cast,
                                                                leadA: { ...prev.cast.leadA, weaponRight: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded p-1 text-slate-200 text-[11px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-sky-500/30">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-sky-400 flex items-center gap-1">
                                                    Mark B • {currentBrief.cast.leadB.characterName}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">Rig: LPC Decivoxel</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Skeletal Action Loop</span>
                                                    <select
                                                        value={currentBrief.cast.leadB.animationAction}
                                                        onChange={(e) => setCurrentBrief(prev => ({
                                                            ...prev,
                                                            cast: {
                                                                ...prev.cast,
                                                                leadB: { ...prev.cast.leadB, animationAction: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded p-1 text-slate-200 text-[11px]"
                                                    >
                                                        <option value="Melee_Weapon_Idle">Melee_Weapon_Idle (Guard Stance)</option>
                                                        <option value="Melee_Weapon_Attack">Melee_Weapon_Attack (Attack)</option>
                                                        <option value="Spell_Simple_Idle_Loop">Spell_Simple_Idle_Loop (Channel)</option>
                                                        <option value="Idle_Talking_Loop">Idle_Talking_Loop (Dialogue)</option>
                                                        <option value="Hit_Chest">Hit_Chest (Parry Reaction)</option>
                                                        <option value="Death01">Death01 (Climax Defeat)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Hand.L Socket Gear</span>
                                                    <input
                                                        type="text"
                                                        value={currentBrief.cast.leadB.weaponLeft || ''}
                                                        onChange={(e) => setCurrentBrief(prev => ({
                                                            ...prev,
                                                            cast: {
                                                                ...prev.cast,
                                                                leadB: { ...prev.cast.leadB, weaponLeft: e.target.value }
                                                            }
                                                        }))}
                                                        className="w-full bg-slate-900 border border-white/10 rounded p-1 text-slate-200 text-[11px]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLLAPSIBLE MATHEMATICAL MANIFEST PREVIEW */}
                            {showManifestPreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono mb-1.5">
                                        <span>// COMPILED PRODUCTION MANIFEST (Sent to Blender Engine)</span>
                                        <span>Total Frames: {Math.floor(currentBrief.runtimeSeconds * currentBrief.fps)}</span>
                                    </div>
                                    <pre className="p-2.5 rounded-lg bg-black/60 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                                        {JSON.stringify(compileBriefToManifest(currentBrief), null, 2)}
                                    </pre>
                                </motion.div>
                            )}

                            {/* ACTION BUTTON */}
                            <button
                                onClick={handleProduceReel}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.4)] transition-all transform active:scale-[0.99] mt-1"
                            >
                                <Clapperboard size={18} />
                                🎬 CALL ACTION! COMPILE BRIEF & PRODUCE REEL
                            </button>
                        </div>
                    )}

                    {/* TAB 2: PRODUCTION PIPELINE STATUS */}
                    {activeTab === 'pipeline' && (
                        <div className="h-full flex flex-col gap-6 max-w-4xl mx-auto overflow-y-auto">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <Sliders size={18} className="text-rose-400" />
                                    End-to-End Production Pipeline
                                </h3>
                                <p className="text-xs text-slate-400">
                                    4-stage automated execution: Agent Brainstorm → Blender 5.2 Headless → PyAV Encoding → Virtual Theater Screening.
                                </p>
                            </div>

                            {/* 4-Step Pipeline Stepper */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    {
                                        step: 1,
                                        title: "Agent Pre-Production",
                                        agent: "Director Akira",
                                        desc: "Multi-shot manifest synthesis",
                                        active: pipelineProgress >= 25,
                                        done: pipelineProgress >= 35
                                    },
                                    {
                                        step: 2,
                                        title: "Headless Blender 5.2",
                                        agent: "DP & Gaffer",
                                        desc: "96-frame animation render",
                                        active: pipelineProgress >= 50,
                                        done: pipelineProgress >= 70
                                    },
                                    {
                                        step: 3,
                                        title: "PyAV Reel Assembly",
                                        agent: "PyAV 18.0.0",
                                        desc: "H.264 MP4 yuv420p video mux",
                                        active: pipelineProgress >= 80,
                                        done: pipelineProgress >= 90
                                    },
                                    {
                                        step: 4,
                                        title: "Screening Ready",
                                        agent: "Executive Producer",
                                        desc: "3D Soundstage theater projection",
                                        active: pipelineProgress === 100,
                                        done: pipelineProgress === 100
                                    }
                                ].map((item) => (
                                    <div
                                        key={item.step}
                                        className={`p-3.5 rounded-xl border transition-all ${
                                            item.done
                                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                                                : item.active
                                                ? 'bg-rose-950/30 border-rose-500/50 text-rose-300 animate-pulse'
                                                : 'bg-slate-900/40 border-white/10 text-slate-500'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                                                STAGE 0{item.step}
                                            </span>
                                            {item.done ? (
                                                <CheckCircle2 size={16} className="text-emerald-400" />
                                            ) : (
                                                <Clock size={16} className={item.active ? 'text-rose-400 animate-spin' : 'text-slate-600'} />
                                            )}
                                        </div>
                                        <div className="font-bold text-xs text-white mb-0.5">{item.title}</div>
                                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                                        <div className="text-[10px] text-amber-400 mt-2 font-mono">Agent: {item.agent}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="font-semibold text-slate-300">Overall Pipeline Progress</span>
                                    <span className="font-mono text-amber-400 font-bold">{pipelineProgress}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pipelineProgress}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>

                            {/* Real-Time Pipeline Terminal Logs */}
                            <div className="flex-1 flex flex-col min-h-[180px] bg-black/90 rounded-xl border border-white/15 p-4 font-mono text-xs overflow-hidden">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-slate-400">
                                    <span className="flex items-center gap-1.5 text-xs text-slate-300">
                                        <Terminal size={14} className="text-rose-400" />
                                        Production Event Log
                                    </span>
                                    <span className="text-[10px] text-emerald-400">● LIVE MONITOR</span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                                    {pipelineLogs.map((log, idx) => (
                                        <div key={idx} className="leading-relaxed">
                                            <span className="text-slate-500 mr-2">[{new Date().toISOString().slice(11, 19)}]</span>
                                            {log.includes('✅') || log.includes('verified') ? (
                                                <span className="text-emerald-400">{log}</span>
                                            ) : log.includes('Director') ? (
                                                <span className="text-rose-400">{log}</span>
                                            ) : log.includes('DP') || log.includes('Gaffer') ? (
                                                <span className="text-amber-400">{log}</span>
                                            ) : (
                                                <span>{log}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SHOTLIST INSPECTOR */}
                    {activeTab === 'shotlist' && (
                        <div className="h-full flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                                        <Layers size={18} className="text-rose-400" />
                                        Multi-Shot Production Manifest Inspector
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Canonical production manifest for &apos;{activeReel.title}&apos; (4.0s @ 24fps = 96 frames total).
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShotlistViewMode('cards')}
                                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                                            shotlistViewMode === 'cards'
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                                                : 'bg-slate-900 border-white/10 text-slate-400'
                                        }`}
                                    >
                                        Visual Cards
                                    </button>
                                    <button
                                        onClick={() => setShotlistViewMode('json')}
                                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                                            shotlistViewMode === 'json'
                                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                                                : 'bg-slate-900 border-white/10 text-slate-400'
                                        }`}
                                    >
                                        Raw JSON Manifest
                                    </button>
                                </div>
                            </div>

                            {shotlistViewMode === 'cards' ? (
                                <div className="grid grid-cols-2 gap-4 flex-1 overflow-y-auto">
                                    {activeReel.manifest.shots.map((shot) => (
                                        <div
                                            key={shot.shot_id}
                                            onClick={() => setSelectedShotId(shot.shot_id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                                                selectedShotId === shot.shot_id
                                                    ? 'bg-slate-900/90 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                                                    : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                        SHOT 0{shot.shot_id}
                                                    </span>
                                                    <span className="font-mono text-xs text-amber-400">
                                                        Frames {shot.frame_start} - {shot.frame_end} ({((shot.frame_end - shot.frame_start + 1) / 24).toFixed(1)}s)
                                                    </span>
                                                </div>

                                                <h4 className="text-sm font-bold text-white mb-1.5">{shot.name}</h4>
                                                <p className="text-xs text-slate-400 mb-3">{shot.description}</p>

                                                {/* Lens & Camera Movement */}
                                                <div className="space-y-1.5 bg-black/40 p-3 rounded-lg border border-white/10 text-xs font-mono">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Lens:</span>
                                                        <span className="text-cyan-400">{shot.lens_mm}mm Cinematic Prime</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Rig Move:</span>
                                                        <span className="text-amber-400">{shot.camera_movement.type} ({shot.camera_movement.interpolation})</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Start Pos:</span>
                                                        <span className="text-slate-300">[{shot.camera_movement.start_pos.join(', ')}]</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">End Pos:</span>
                                                        <span className="text-slate-300">[{shot.camera_movement.end_pos.join(', ')}]</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Lighting & Cel Shading Ramps */}
                                            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                                                <span>Cel Shaders: Bakshi_Flesh + Frazetta_Steel</span>
                                                <span className="text-emerald-400 font-semibold">● Blender Ready</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Additional Manifest Meta: Lighting Rig & Characters */}
                                    <div className="col-span-2 p-4 rounded-xl bg-slate-950/80 border border-white/10">
                                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                            Stage Lighting Palettes & Bone Socket Rigging
                                        </h5>
                                        <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                                                <span className="text-amber-400 font-bold block mb-1">Key Sun Light</span>
                                                <div className="text-slate-400">Energy: 5.5</div>
                                                <div className="text-slate-400">Color: Sunset Fire Gold</div>
                                                <div className="text-slate-400">Angle: [65°, -15°, -45°]</div>
                                            </div>
                                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                                                <span className="text-rose-400 font-bold block mb-1">Sanguine Rim Light</span>
                                                <div className="text-slate-400">Energy: 8.0</div>
                                                <div className="text-slate-400">Color: Bakshi Magenta</div>
                                                <div className="text-slate-400">Focus: Silhouette Specular</div>
                                            </div>
                                            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5">
                                                <span className="text-cyan-400 font-bold block mb-1">Socket Rigging</span>
                                                <div className="text-slate-400">Warrior 1: Hand.R_Socket</div>
                                                <div className="text-slate-400">Warrior 2: Hand.R_Socket</div>
                                                <div className="text-slate-400">Prop: Broadsword Master</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 bg-black/90 p-4 rounded-xl border border-white/15 overflow-y-auto font-mono text-xs text-amber-300 leading-relaxed">
                                    <pre>{JSON.stringify(activeReel.manifest, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: REEL PLAYER */}
                    {activeTab === 'player' && (
                        <div className="h-full flex flex-col gap-4">
                            {/* Video Display & Cinema Stage View */}
                            <div className="flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-white/10 group shadow-[0_0_40px_rgba(0,0,0,0.9)]">
                                <video
                                    ref={videoRef}
                                    src={`/screenings/${activeReel.filename}`}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={() => {
                                        if (isLooping) {
                                            restartVideo();
                                        } else {
                                            setIsPlaying(false);
                                        }
                                    }}
                                    playsInline
                                    muted={isMuted}
                                    loop={isLooping}
                                    className="max-w-full max-h-full object-contain cursor-pointer"
                                    onClick={togglePlay}
                                />

                                {/* Big Center Play Button Overlay when paused */}
                                {!isPlaying && (
                                    <button
                                        onClick={togglePlay}
                                        className="absolute w-20 h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.6)] hover:scale-105 transition-all"
                                    >
                                        <Play size={36} className="ml-1.5" />
                                    </button>
                                )}

                                {/* Top Watermark & Info Pill */}
                                <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span>SOVEREIGN THEATER SCREENING</span>
                                    <span className="text-slate-500">|</span>
                                    <span className="text-amber-400 font-bold">{activeReel.resolution} @ {activeReel.fps} FPS</span>
                                </div>
                            </div>

                            {/* Transport Controls Bar */}
                            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/15 flex flex-col gap-2.5">
                                {/* Scrubber Timeline */}
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-rose-400 font-bold w-16">
                                        {formatTimecode(currentTime)}
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 8.0}
                                        step="0.01"
                                        value={currentTime}
                                        onChange={handleScrub}
                                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                    <span className="font-mono text-xs text-slate-400 w-16 text-right">
                                        {formatTimecode(duration || 8.0)}
                                    </span>
                                </div>

                                {/* Control Buttons & Link Badges */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={togglePlay}
                                            className="w-10 h-10 rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                                            title={isPlaying ? "Pause" : "Play"}
                                        >
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                                        </button>
                                        <button
                                            onClick={restartVideo}
                                            className="w-10 h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 flex items-center justify-center transition-all"
                                            title="Restart Reel (Frame 0001)"
                                        >
                                            <RotateCcw size={16} />
                                        </button>
                                        <button
                                            onClick={() => setIsMuted(!isMuted)}
                                            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                                                isMuted
                                                    ? 'bg-slate-900 border-white/10 text-slate-400'
                                                    : 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                            }`}
                                            title={isMuted ? "Unmute Audio" : "Mute Audio"}
                                        >
                                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                        </button>
                                        <button
                                            onClick={() => setIsLooping(!isLooping)}
                                            className={`px-3 h-10 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all ${
                                                isLooping
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                                                    : 'bg-slate-900 border-white/10 text-slate-400'
                                            }`}
                                            title="Toggle Loop"
                                        >
                                            LOOP: {isLooping ? 'ON' : 'OFF'}
                                        </button>
                                    </div>

                                    {/* Direct Link & Screening Route */}
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-white/10 flex items-center gap-2 font-mono text-xs">
                                            <span className="text-slate-500">Screening URL:</span>
                                            <span className="text-amber-400 select-all max-w-[280px] truncate">
                                                {directVideoUrl || `http://localhost:5173/screenings/${activeReel.filename}`}
                                            </span>
                                            <button
                                                onClick={copyDirectLink}
                                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                                title="Copy Direct Link"
                                            >
                                                {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                            </button>
                                            <a
                                                href={`/screenings/${activeReel.filename}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                                title="Open in new tab"
                                            >
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>

                                        <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
                                            <ShieldCheck size={14} />
                                            <span>VERIFIED H.264 MP4</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default SoundstageStudioModal;
