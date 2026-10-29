import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Compass, Play, Pause, X,
    Terminal, ArrowUpRight, RotateCcw,
    Sparkles, Sword
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';
import { type MyOsSpriteEntry } from './MyOsSpriteExplorer';

export interface InputTelemetryEvent {
    id: string;
    timestamp: string;
    key: string;
    action: string;
    latencyMs: number;
}

export const CharacterTelemetryLoop: React.FC<{
    onClose?: () => void;
    initialSpriteId?: string;
}> = ({ onClose, initialSpriteId }) => {
    const { agents } = useCouncil();
    const [manifest, setManifest] = useState<Record<string, MyOsSpriteEntry>>({});
    const [customSprites, setCustomSprites] = useState<MyOsSpriteEntry[]>([]);
    const [selectedId, setSelectedId] = useState<string>(initialSpriteId || 'lunaria_sorceress');
    
    // Telemetry Kinematics State
    const [activeAction, setActiveAction] = useState<string>('idle');
    const [activeDirection, setActiveDirection] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [isSprinting, setIsSprinting] = useState<boolean>(false);
    const [currentFps, setCurrentFps] = useState<number>(16);
    const [frameDelta, setFrameDelta] = useState<number>(62.5); // ~16 FPS
    const [cycleProgress, setCycleProgress] = useState<number>(0);

    // Event Bus & Input Telemetry Stream
    const [eventStream, setEventStream] = useState<InputTelemetryEvent[]>([]);
    const activeKeysRef = useRef<Set<string>>(new Set());
    const lastKeyTimeRef = useRef<number>(performance.now());

    // Load Sprites Manifest & Custom Roster
    useEffect(() => {
        fetch('/textures/avatars/myos_sprites_manifest.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.sprites) {
                    setManifest(data.sprites);
                }
            })
            .catch(console.error);

        try {
            const saved = localStorage.getItem('myos_custom_sprites');
            if (saved) setCustomSprites(JSON.parse(saved));
        } catch (e) {
            console.error(e);
        }
    }, []);

    const allSprites = useMemo(() => {
        const combined = { ...manifest };
        for (const cs of customSprites) {
            combined[cs.id] = cs;
        }
        return combined;
    }, [manifest, customSprites]);

    const activeSprite: MyOsSpriteEntry = useMemo(() => {
        if (allSprites[selectedId]) return allSprites[selectedId];
        const first = Object.values(allSprites)[0];
        return first || {
            id: 'lunaria_sorceress',
            name: 'Lunaria (Lunar Archmage)',
            category: 'heroes',
            badge: 'SELÛNITE HIGH ARCHMAGE',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'High Elven celestial sorceress.',
            tileSize: 256,
            grid: { cols: 8, rows: 8 },
            scale: 1.0,
            defaultAction: 'idle',
            actions: {
                idle: '/actions/lunaria_sorceress_idle_loop.png',
                walk: '/actions/lunaria_sorceress_walk_loop.png',
                run: '/actions/lunaria_sorceress_run_loop.png',
                spellcast: '/actions/lunaria_sorceress_spellcast_loop.png'
            },
            pillarAlignment: 'thought'
        };
    }, [allSprites, selectedId]);

    // Direction Heading Vector
    const headingVector = useMemo(() => {
        switch (activeDirection) {
            case 'U': return { x: 0, y: -1, deg: 0 };
            case 'UR': return { x: 0.707, y: -0.707, deg: 45 };
            case 'R': return { x: 1, y: 0, deg: 90 };
            case 'DR': return { x: 0.707, y: 0.707, deg: 135 };
            case 'D': return { x: 0, y: 1, deg: 180 };
            case 'DL': return { x: -0.707, y: 0.707, deg: 225 };
            case 'L': return { x: -1, y: 0, deg: 270 };
            case 'UL': return { x: -0.707, y: -0.707, deg: 315 };
            default: return { x: 0, y: 1, deg: 180 };
        }
    }, [activeDirection]);

    const currentSpeed = useMemo(() => {
        if (activeAction === 'idle' || activeAction === 'hurt' || activeAction === 'death') return 0;
        const baseSpeed = 120;
        return isSprinting || activeAction === 'run' ? Math.round(baseSpeed * 1.6) : baseSpeed;
    }, [activeAction, isSprinting]);

    // Live Keyboard Listener for Input Stream Telemetry
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
                return;
            }

            const now = performance.now();
            const latency = Math.round(now - lastKeyTimeRef.current);
            lastKeyTimeRef.current = now;

            const key = e.key.toLowerCase();
            activeKeysRef.current.add(key);

            let triggeredAction = activeAction;
            if (key === 'shift') {
                setIsSprinting(true);
                if (activeAction === 'walk') {
                    triggeredAction = 'run';
                    setActiveAction('run');
                }
            } else if (key === 'w' || key === 'arrowup') {
                setActiveDirection('U');
                triggeredAction = isSprinting ? 'run' : 'walk';
                setActiveAction(triggeredAction);
            } else if (key === 's' || key === 'arrowdown') {
                setActiveDirection('D');
                triggeredAction = isSprinting ? 'run' : 'walk';
                setActiveAction(triggeredAction);
            } else if (key === 'a' || key === 'arrowleft') {
                setActiveDirection('L');
                triggeredAction = isSprinting ? 'run' : 'walk';
                setActiveAction(triggeredAction);
            } else if (key === 'd' || key === 'arrowright') {
                setActiveDirection('R');
                triggeredAction = isSprinting ? 'run' : 'walk';
                setActiveAction(triggeredAction);
            } else if (key === 'p') {
                triggeredAction = 'spellcast';
                setActiveAction('spellcast');
            } else if (e.code === 'Space') {
                setIsPlaying(prev => !prev);
            }

            const newEvent: InputTelemetryEvent = {
                id: Math.random().toString(36).substring(2, 7),
                timestamp: new Date().toLocaleTimeString(),
                key: e.key.toUpperCase(),
                action: triggeredAction,
                latencyMs: Math.min(latency, 999)
            };

            setEventStream(prev => [newEvent, ...prev.slice(0, 15)]);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            activeKeysRef.current.delete(key);

            if (key === 'shift') {
                setIsSprinting(false);
                if (activeAction === 'run') {
                    setActiveAction('walk');
                }
            } else if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                if (!activeKeysRef.current.has('w') && !activeKeysRef.current.has('s') && !activeKeysRef.current.has('a') && !activeKeysRef.current.has('d')) {
                    if (activeAction !== 'spellcast' && activeAction !== 'hurt' && activeAction !== 'death') {
                        setActiveAction('idle');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeAction, isSprinting]);

    // Canvas Frame Loop
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spriteSheetImgRef = useRef<HTMLImageElement | null>(null);
    const currentFrameRef = useRef(0);

    const sheetPath = activeSprite.actions[activeAction] || activeSprite.actions[activeSprite.defaultAction];

    useEffect(() => {
        if (!sheetPath) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = sheetPath;
        img.onload = () => {
            spriteSheetImgRef.current = img;
        };
    }, [sheetPath]);

    useEffect(() => {
        let animId: number;
        let lastTime = performance.now();
        const fpsInterval = 1000 / currentFps;

        const renderLoop = (now: number) => {
            animId = requestAnimationFrame(renderLoop);
            const elapsed = now - lastTime;
            if (elapsed > fpsInterval) {
                setFrameDelta(Math.round(elapsed * 10) / 10);
                lastTime = now - (elapsed % fpsInterval);

                if (isPlaying) {
                    currentFrameRef.current = (currentFrameRef.current + 1) % 8;
                    setCycleProgress(Math.round((currentFrameRef.current / 8) * 100));
                }

                if (canvasRef.current && spriteSheetImgRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 160, 160);

                        const dirMap: Record<string, number> = {
                            'D': 0, 'DL': 1, 'L': 2, 'UL': 3,
                            'U': 4, 'UR': 5, 'R': 6, 'DR': 7
                        };
                        const row = dirMap[activeDirection] ?? 0;
                        const col = currentFrameRef.current;
                        const tileSize = activeSprite.tileSize || 256;

                        ctx.drawImage(
                            spriteSheetImgRef.current,
                            col * tileSize, row * tileSize, tileSize, tileSize,
                            0, 0, 160, 160
                        );
                    }
                }
            }
        };

        animId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animId);
    }, [activeDirection, activeSprite.tileSize, isPlaying, currentFps]);

    // Force Trigger Action
    const triggerAction = (actionName: string) => {
        setActiveAction(actionName);
        currentFrameRef.current = 0;
        const newEvent: InputTelemetryEvent = {
            id: Math.random().toString(36).substring(2, 7),
            timestamp: new Date().toLocaleTimeString(),
            key: 'UI_STIMULUS',
            action: actionName,
            latencyMs: 0
        };
        setEventStream(prev => [newEvent, ...prev.slice(0, 15)]);

        // If spellcast or hurt, return to idle after cycle
        if (actionName === 'spellcast' || actionName === 'hurt') {
            setTimeout(() => {
                setActiveAction('idle');
            }, 800);
        }
    };

    // State Machine Node Definitions
    const STATE_NODES = [
        { id: 'idle', label: 'IDLE', desc: 'Resting Stance (v = 0)', color: 'from-blue-500 to-cyan-500' },
        { id: 'walk', label: 'WALK', desc: 'Ground Translation (v > 0)', color: 'from-emerald-500 to-teal-500' },
        { id: 'run', label: 'RUN', desc: 'Sprint Translation (Shift + v)', color: 'from-amber-500 to-yellow-500' },
        { id: 'spellcast', label: 'SPELLCAST', desc: 'Arcane Chanting Cycle (P)', color: 'from-purple-500 to-fuchsia-500' },
        { id: 'slash', label: 'SLASH', desc: 'Melee Strike Arc', color: 'from-rose-500 to-red-500' },
        { id: 'hurt', label: 'HURT', desc: 'Impact Rebound', color: 'from-orange-500 to-amber-600' },
        { id: 'death', label: 'DEATH', desc: 'Terminal Collapse (HP <= 0)', color: 'from-red-900 to-slate-900' },
    ];

    return (
        <div className="flex flex-col h-full w-full bg-slate-950/95 text-white overflow-hidden select-none font-mono">
            {/* Top Sub-Dock Header */}
            <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-indigo-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-serif text-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                        ☿
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">
                                Character Telemetry & Behavioral Feedback Loops
                            </h2>
                            <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                                FSG://Self.Self.Thought
                            </span>
                        </div>
                        <p className="text-[9px] text-slate-400">
                            Real-time kinematic vectors, animation state machine, and input latency telemetry
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Live Heartbeat Status */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-emerald-500/30 rounded-full text-[9px] text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        <span>FEEDBACK LOOP ACTIVE</span>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: Kinematic Telemetry, Radar & Input Event Stream */}
                <div className="w-96 border-r border-white/10 p-5 flex flex-col gap-4 bg-black/30 shrink-0 overflow-y-auto">
                    {/* Character Selector */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Telemetry Subject
                        </label>
                        <select
                            value={selectedId}
                            onChange={(e) => {
                                setSelectedId(e.target.value);
                                setActiveAction('idle');
                            }}
                            className="w-full bg-black/70 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500 transition cursor-pointer"
                        >
                            {Object.values(allSprites).map(s => (
                                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Kinematic Compass & Velocity Radar */}
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                                <Compass size={13} />
                                <span>Heading & Kinematics</span>
                            </span>
                            <span className="text-white font-bold">{currentSpeed} px/s</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            {/* Visual 8-Way Heading Compass */}
                            <div className="relative w-28 h-28 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-inner shrink-0">
                                <div className="absolute inset-2 rounded-full border border-dashed border-white/10" />
                                
                                {/* Heading Arrow */}
                                <motion.div
                                    animate={{ rotate: headingVector.deg }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className="w-1.5 h-12 bg-gradient-to-t from-transparent via-cyan-500 to-cyan-300 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                                    style={{ transformOrigin: 'center 75%' }}
                                />

                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md ring-2 ring-black" />
                                </div>

                                {/* Cardinal labels */}
                                <span className="absolute top-1 text-[7px] text-slate-500 font-bold">N</span>
                                <span className="absolute bottom-1 text-[7px] text-slate-500 font-bold">S</span>
                                <span className="absolute left-1.5 text-[7px] text-slate-500 font-bold">W</span>
                                <span className="absolute right-1.5 text-[7px] text-slate-500 font-bold">E</span>
                            </div>

                            {/* Coordinate Readouts */}
                            <div className="flex-1 space-y-2 text-[9px]">
                                <div className="bg-slate-900/80 p-2 rounded-xl border border-white/5 space-y-1">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Direction:</span>
                                        <strong className="text-cyan-400">{activeDirection}</strong>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Heading Vector:</span>
                                        <strong className="text-white font-mono">({headingVector.x.toFixed(2)}, {headingVector.y.toFixed(2)})</strong>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>Sprint State:</span>
                                        <strong className={isSprinting ? "text-amber-400" : "text-slate-500"}>
                                            {isSprinting ? "ACTIVE (1.6x)" : "NORMAL"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1.5 text-center">
                                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                                        <span className="text-[7px] text-slate-500 block">DELTA T</span>
                                        <span className="text-emerald-400 font-bold">{frameDelta} ms</span>
                                    </div>
                                    <div className="bg-slate-900/60 p-1.5 rounded-lg border border-white/5">
                                        <span className="text-[7px] text-slate-500 block">CYCLE</span>
                                        <span className="text-purple-400 font-bold">{cycleProgress}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Input Event Telemetry Stream */}
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex-1 flex flex-col space-y-2 overflow-hidden">
                        <div className="flex items-center justify-between text-[10px] text-slate-300 font-bold uppercase tracking-wider pb-1 border-b border-white/10">
                            <span className="flex items-center gap-1.5">
                                <Terminal size={12} className="text-cyan-400" />
                                <span>Input Event Stream</span>
                            </span>
                            <span className="text-[8px] text-slate-500 font-normal">WASD / Shift / P</span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[8px]">
                            {eventStream.length === 0 ? (
                                <div className="py-8 text-center text-slate-500 italic">
                                    Press WASD, Shift, Space, or P to inspect event telemetry.
                                </div>
                            ) : (
                                eventStream.map((evt) => (
                                    <div
                                        key={evt.id}
                                        className="p-1.5 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-between text-slate-300 font-mono"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">{evt.timestamp.split(' ')[0]}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">{evt.key}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-cyan-400 uppercase font-bold">{evt.action}</span>
                                            <span className="text-slate-500">{evt.latencyMs}ms</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: State Machine Graph, Animation Canvas & Stimulus Controls */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-slate-950">
                    {/* Top Stage & State Controller */}
                    <div className="flex gap-6 items-start">
                        {/* Live Character Canvas Viewport */}
                        <div className="w-44 h-44 rounded-3xl bg-black/60 border border-purple-500/30 p-2 flex flex-col items-center justify-center relative shadow-2xl shrink-0">
                            <canvas
                                ref={canvasRef}
                                width={160} height={160}
                                className="image-pixelated rounded-2xl"
                            />
                            <div className="absolute bottom-2 inset-x-2 flex items-center justify-between px-2 text-[8px] text-slate-400 bg-black/80 rounded-lg border border-white/10 backdrop-blur-sm">
                                <span className="text-cyan-400 font-bold uppercase">{activeAction}</span>
                                <span>{currentFps} FPS</span>
                            </div>
                        </div>

                        {/* Interactive Stimulus Controls */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                                    Behavioral Feedback Stimulus
                                </span>
                                <span className="text-[8px] text-slate-500">
                                    Click to inject state transitions into the feedback loop
                                </span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                <button
                                    onClick={() => triggerAction('idle')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'idle'
                                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <RotateCcw size={11} />
                                    <span>Idle</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('walk')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'walk'
                                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span>🚶 Walk</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('run')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'run'
                                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span>🏃 Run</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('spellcast')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'spellcast'
                                            ? 'bg-purple-500 text-black border-purple-400 shadow-md shadow-purple-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <Sparkles size={11} />
                                    <span>Spellcast</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('slash')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'slash'
                                            ? 'bg-rose-500 text-black border-rose-400 shadow-md shadow-rose-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <Sword size={11} />
                                    <span>Slash</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('hurt')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'hurt'
                                            ? 'bg-orange-500 text-black border-orange-400 shadow-md shadow-orange-500/30 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span>🩸 Hurt</span>
                                </button>
                                <button
                                    onClick={() => triggerAction('death')}
                                    className={`py-2 px-3 rounded-xl border text-[9px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                        activeAction === 'death'
                                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/40 font-black'
                                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span>💀 Death</span>
                                </button>
                            </div>

                            {/* Directional Quick-Pill */}
                            <div className="flex items-center gap-1.5 pt-2">
                                <span className="text-[8px] text-slate-400 uppercase font-bold mr-1">Heading:</span>
                                {(['U', 'UR', 'R', 'DR', 'D', 'DL', 'L', 'UL'] as const).map(dir => (
                                    <button
                                        key={dir}
                                        onClick={() => setActiveDirection(dir)}
                                        className={`px-2 py-0.5 rounded text-[8px] font-bold transition cursor-pointer ${
                                            activeDirection === dir
                                                ? 'bg-cyan-500 text-black'
                                                : 'bg-white/5 text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {dir}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Animation State Machine Visualization Graph */}
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-3xl p-5 flex flex-col space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                            <div className="flex items-center gap-2">
                                <Activity size={14} className="text-cyan-400 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    Animation State Machine Transition Graph
                                </span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                                ACTIVE: {activeAction.toUpperCase()}
                            </span>
                        </div>

                        {/* State Graph Nodes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 flex-1">
                            {STATE_NODES.map((node) => {
                                const isActive = activeAction === node.id;
                                return (
                                    <motion.div
                                        key={node.id}
                                        animate={{
                                            scale: isActive ? 1.03 : 1,
                                            borderColor: isActive ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)'
                                        }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        onClick={() => triggerAction(node.id)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                            isActive
                                                ? 'bg-gradient-to-br from-cyan-950/70 via-slate-900/90 to-purple-950/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                                                : 'bg-slate-900/40 hover:bg-slate-900/70'
                                        }`}
                                    >
                                        {isActive && (
                                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                                            </span>
                                        )}

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${node.color}`} />
                                                <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-300'}`}>
                                                    {node.label}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                                                {node.desc}
                                            </p>
                                        </div>

                                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-500">
                                            <span>Transit Condition:</span>
                                            <span className="font-mono text-cyan-300/80">
                                                {node.id === 'idle' ? '|v| == 0' : node.id === 'walk' ? '|v| > 0' : node.id === 'run' ? 'Shift + |v|' : node.id === 'spellcast' ? 'Key P (750ms)' : node.id === 'slash' ? 'Attack Key' : node.id === 'hurt' ? 'Damage Delta' : 'HP <= 0'}
                                            </span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
