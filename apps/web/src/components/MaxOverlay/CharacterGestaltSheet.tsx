import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Activity, Shield, Zap, Sparkles, User, Bot, 
    X, Info, Layers, Compass, Play, Pause, 
    Sliders, Gauge, Crosshair, ArrowUpRight, Check
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';
import { type MyOsSpriteEntry } from './MyOsSpriteExplorer';

export type SpriteEngineType = 'FLESH_GOLEM' | 'CHIBI' | 'CLASSIC_LPC' | 'OBJECT_3D';

export interface KinematicEngineStats {
    walkSpeed: number;        // pixels per second (e.g. 120)
    sprintMultiplier: number; // run speed multiplier (e.g. 1.6)
    jumpImpulse: number;      // vertical velocity (e.g. 8.5 m/s)
    hitboxRadius: number;     // collision radius in px (e.g. 16)
    hitboxHeight: number;     // collision height in px (e.g. 48)
    gravityScale: number;     // e.g. 1.0
    loopFps: number;          // playback frame rate (e.g. 16)
}

const DEFAULT_KINEMATICS: KinematicEngineStats = {
    walkSpeed: 120,
    sprintMultiplier: 1.6,
    jumpImpulse: 8.5,
    hitboxRadius: 16,
    hitboxHeight: 48,
    gravityScale: 1.0,
    loopFps: 16
};

export const CharacterGestaltSheet: React.FC<{
    onClose?: () => void;
    initialSpriteId?: string;
}> = ({ onClose, initialSpriteId }) => {
    const { agents, agentGenomes, updateAgentGenome, spawnNPC } = useCouncil();
    const [manifest, setManifest] = useState<Record<string, MyOsSpriteEntry>>({});
    const [customSprites, setCustomSprites] = useState<MyOsSpriteEntry[]>([]);
    const [selectedId, setSelectedId] = useState<string>(initialSpriteId || 'lunaria_sorceress');
    const [activeAction, setActiveAction] = useState<string>('idle');
    const [activeDirection, setActiveDirection] = useState<'U' | 'D' | 'L' | 'R' | 'UL' | 'UR' | 'DL' | 'DR'>('D');
    const [isPlaying, setIsPlaying] = useState<boolean>(true);
    const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

    // Kinematic Engine Settings (Persisted per character in localStorage)
    const [kinematics, setKinematics] = useState<KinematicEngineStats>(() => {
        try {
            const saved = localStorage.getItem(`myos_kinematics_${selectedId}`);
            return saved ? JSON.parse(saved) : DEFAULT_KINEMATICS;
        } catch {
            return DEFAULT_KINEMATICS;
        }
    });

    // Custom Game Attributes (Optional key-value container)
    const [customAttrs, setCustomAttrs] = useState<Array<{ key: string; value: string }>>([
        { key: 'game_role', value: 'Primary Combatant' },
        { key: 'faction', value: 'Sovereign Core' }
    ]);
    const [newAttrKey, setNewAttrKey] = useState('');
    const [newAttrVal, setNewAttrVal] = useState('');

    // Load Manifest and Custom Sprites
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

    // Combine standard and custom roster
    const allSprites = useMemo(() => {
        const combined = { ...manifest };
        for (const cs of customSprites) {
            combined[cs.id] = cs;
        }
        return combined;
    }, [manifest, customSprites]);

    // Active Character Resolution
    const activeSprite: MyOsSpriteEntry = useMemo(() => {
        if (allSprites[selectedId]) return allSprites[selectedId];
        const first = Object.values(allSprites)[0];
        return first || {
            id: 'lunaria_sorceress',
            name: 'Lunaria (Lunar Archmage)',
            category: 'heroes',
            badge: 'SELÛNITE HIGH ARCHMAGE',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'High Elven celestial sorceress channeling radiant lunar resonance.',
            tileSize: 256,
            grid: { cols: 8, rows: 8 },
            scale: 1.0,
            defaultAction: 'idle',
            actions: { idle: '/actions/lunaria_sorceress_idle_loop.png' },
            pillarAlignment: 'Transcendence'
        };
    }, [allSprites, selectedId]);

    // Update kinematics when character changes
    useEffect(() => {
        try {
            const saved = localStorage.getItem(`myos_kinematics_${activeSprite.id}`);
            if (saved) setKinematics(JSON.parse(saved));
            else setKinematics(DEFAULT_KINEMATICS);
        } catch {
            setKinematics(DEFAULT_KINEMATICS);
        }
    }, [activeSprite.id]);

    const handleSaveKinematics = (updated: Partial<KinematicEngineStats>) => {
        const next = { ...kinematics, ...updated };
        setKinematics(next);
        try {
            localStorage.setItem(`myos_kinematics_${activeSprite.id}`, JSON.stringify(next));
        } catch (e) {
            console.error(e);
        }
    };

    // Detect Sprite Type Classification
    const spriteType: SpriteEngineType = useMemo(() => {
        const id = activeSprite.id.toLowerCase();
        if (id.includes('flesh') || id.includes('einstein') || id.includes('commander') || id.includes('frankie') || id.includes('lunaria')) {
            return 'FLESH_GOLEM';
        }
        if (id.includes('chibi') || id.includes('paladin') || id.includes('mage') || id.includes('adventurer')) {
            return 'CHIBI';
        }
        if (id.includes('mimic') || id.includes('rust') || id.includes('displacer') || id.includes('monodrone') || id.includes('prop')) {
            return 'OBJECT_3D';
        }
        return 'CLASSIC_LPC';
    }, [activeSprite.id]);

    // Embodiment Assignment Handlers
    const handleAssignToSelf = () => {
        const sheet = activeSprite.actions[activeAction] || activeSprite.actions[activeSprite.defaultAction];
        const isUniracer = activeSprite.id === 'uniracer' || (activeSprite as any).archetype === 'uniracer';
        const config = {
            genome: { 
                body: sheet, 
                archetype: isUniracer ? 'uniracer' : undefined,
                modelType: isUniracer ? 'uniracer' : undefined,
                head: 'none', hair: 'none', torso: 'none', legs: 'none' 
            },
            pillarIdx: 0,
            hueShift: 0,
            meta: {
                id: activeSprite.id,
                name: activeSprite.name,
                category: activeSprite.category,
                kinematics,
                archetype: isUniracer ? 'uniracer' : undefined
            }
        };
        updateAgentGenome('user' as AgentId, config);
        window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: { genome: config } }));
        setAppliedNotice('Assigned as Active User Avatar!');
        setTimeout(() => setAppliedNotice(null), 2500);
    };

    const handleAssignToCompanion = () => {
        const sheet = activeSprite.actions[activeAction] || activeSprite.actions[activeSprite.defaultAction];
        const isUniracer = activeSprite.id === 'uniracer' || (activeSprite as any).archetype === 'uniracer';
        const config = {
            genome: { 
                body: sheet, 
                archetype: isUniracer ? 'uniracer' : undefined,
                modelType: isUniracer ? 'uniracer' : undefined,
                head: 'none', hair: 'none', torso: 'none', legs: 'none' 
            },
            pillarIdx: 0,
            hueShift: 0,
            meta: {
                id: activeSprite.id,
                name: activeSprite.name,
                category: activeSprite.category,
                kinematics,
                archetype: isUniracer ? 'uniracer' : undefined
            }
        };
        updateAgentGenome('orchestrator', config);
        updateAgentGenome('companion' as AgentId, config);
        window.dispatchEvent(new CustomEvent('myos_update_companion', { detail: { genome: config } }));
        setAppliedNotice('Assigned as Local AI Companion!');
        setTimeout(() => setAppliedNotice(null), 2500);
    };

    const handleSpawnAsNpc = () => {
        const sheet = activeSprite.actions[activeAction] || activeSprite.actions[activeSprite.defaultAction];
        const config = {
            genome: { body: sheet, head: 'none', hair: 'none', torso: 'none', legs: 'none' },
            pillarIdx: 0,
            hueShift: 0,
            meta: {
                id: activeSprite.id,
                name: activeSprite.name,
                category: activeSprite.category,
                kinematics
            }
        };
        spawnNPC(activeSprite.name, config);
        setAppliedNotice('Spawned into Active World Scene!');
        setTimeout(() => setAppliedNotice(null), 2500);
    };

    // Add optional custom attribute
    const handleAddAttribute = () => {
        if (!newAttrKey.trim()) return;
        setCustomAttrs(prev => [...prev, { key: newAttrKey.trim(), value: newAttrVal.trim() }]);
        setNewAttrKey('');
        setNewAttrVal('');
    };

    const handleRemoveAttribute = (idx: number) => {
        setCustomAttrs(prev => prev.filter((_, i) => i !== idx));
    };

    // Canvas Frame Turntable Loop
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
        const fpsInterval = 1000 / kinematics.loopFps;

        const renderLoop = (now: number) => {
            animId = requestAnimationFrame(renderLoop);
            const elapsed = now - lastTime;
            if (elapsed > fpsInterval) {
                lastTime = now - (elapsed % fpsInterval);

                if (isPlaying) {
                    currentFrameRef.current = (currentFrameRef.current + 1) % 8;
                }

                if (canvasRef.current && spriteSheetImgRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 128, 128);

                        // 8 directions mapping
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
                            0, 0, 128, 128
                        );
                    }
                }
            }
        };

        animId = requestAnimationFrame(renderLoop);
        return () => cancelAnimationFrame(animId);
    }, [activeDirection, activeSprite.tileSize, isPlaying, kinematics.loopFps]);

    return (
        <div className="flex flex-col h-full w-full bg-slate-950/95 text-white overflow-hidden select-none">
            {/* Top Sub-Dock Header */}
            <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 shrink-0 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500/30 to-purple-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300 font-serif text-lg shadow-[0_0_12px_rgba(244,63,94,0.3)]">
                        ⚹
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">
                                Character Gestalt Form
                            </h2>
                            <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded">
                                FSG://Self.Self.Self
                            </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">
                            Quantifiable traits, physical kinematics, and live engine embodiment
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {appliedNotice && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                        >
                            <Check size={12} />
                            <span>{appliedNotice}</span>
                        </motion.div>
                    )}

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

            {/* Main Content Area: Left Profile/Turntable + Right Kinematics Dashboard */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: Identity, Roster Switcher & Live Turntable */}
                <div className="w-80 border-r border-white/10 p-5 flex flex-col gap-4 bg-black/20 shrink-0 overflow-y-auto">
                    {/* Character Selector Dropdown */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Select Roster Subject
                        </label>
                        <select
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500 transition"
                        >
                            {Object.values(allSprites).map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Live Preview Turntable Canvas */}
                    <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl flex flex-col items-center gap-3 relative shadow-inner">
                        <canvas
                            ref={canvasRef}
                            width={128}
                            height={128}
                            className="image-pixelated bg-black rounded-xl shadow-lg border border-white/5"
                        />

                        {/* Direction Compass */}
                        <div className="flex gap-1 bg-black/60 p-1 rounded-full border border-white/10">
                            {(['U', 'UR', 'R', 'DR', 'D', 'DL', 'L', 'UL'] as const).map(dir => (
                                <button
                                    key={dir}
                                    onClick={() => setActiveDirection(dir)}
                                    className={`px-1.5 py-0.5 rounded-full text-[8px] font-mono font-bold transition cursor-pointer ${
                                        activeDirection === dir
                                            ? 'bg-rose-500 text-white font-black'
                                            : 'text-white/40 hover:text-white'
                                    }`}
                                >
                                    {dir}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-1 justify-center w-full">
                            {Object.keys(activeSprite.actions || {}).map(act => (
                                <button
                                    key={act}
                                    onClick={() => setActiveAction(act)}
                                    className={`px-2 py-1 rounded text-[8px] font-mono uppercase font-bold transition cursor-pointer ${
                                        activeAction === act
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/5 text-white/40 hover:text-white'
                                    }`}
                                >
                                    {act}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Core Classification Tags */}
                    <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 text-[10px] font-mono">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Sprite Engine Type:</span>
                            <span className="font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                                {spriteType.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Pillar Alignment:</span>
                            <span className="font-bold text-rose-300 uppercase">
                                {activeSprite.pillarAlignment}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">Tile Resolution:</span>
                            <span className="text-white font-bold">
                                {activeSprite.tileSize || 256}px HD
                            </span>
                        </div>
                    </div>

                    {/* Active Embodiment Deployment */}
                    <div className="mt-auto space-y-2 pt-2 border-t border-white/10">
                        <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            Deploy / Embodiment Target
                        </label>
                        <button
                            onClick={handleAssignToSelf}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-900/20 transition"
                        >
                            <User size={13} />
                            <span>Equip to Me (User Gestalt)</span>
                        </button>
                        <button
                            onClick={handleAssignToCompanion}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/20 transition"
                        >
                            <Bot size={13} />
                            <span>Equip to Local AI Companion</span>
                        </button>
                        <button
                            onClick={handleSpawnAsNpc}
                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-teal-900/20 transition"
                        >
                            <Sparkles size={13} />
                            <span>Drop into Scene as Game NPC</span>
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Kinematic Engine Properties & Physics Dashboard */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
                    {/* Header Title */}
                    <div>
                        <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Gauge size={18} className="text-cyan-400" />
                            <span>Engine Kinematics & Physics Telemetry</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Controls how this character physically behaves across MyOS worlds, retro sandboxes, and game stages.
                        </p>
                    </div>

                    {/* Kinematic Sliders Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Translation Walk Speed */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Walk Translation Speed
                                </span>
                                <span className="text-xs font-mono font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                                    {kinematics.walkSpeed} px/s
                                </span>
                            </div>
                            <input
                                type="range"
                                min={40}
                                max={240}
                                step={5}
                                value={kinematics.walkSpeed}
                                onChange={(e) => handleSaveKinematics({ walkSpeed: Number(e.target.value) })}
                                className="w-full accent-cyan-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Cautious (40)</span>
                                <span>Default (120)</span>
                                <span>Speedster (240)</span>
                            </div>
                        </div>

                        {/* Sprint Multiplier */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Sprint Run Multiplier
                                </span>
                                <span className="text-xs font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                                    {kinematics.sprintMultiplier.toFixed(1)}x
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1.0}
                                max={2.5}
                                step={0.1}
                                value={kinematics.sprintMultiplier}
                                onChange={(e) => handleSaveKinematics({ sprintMultiplier: Number(e.target.value) })}
                                className="w-full accent-amber-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Jog (1.2x)</span>
                                <span>Sprint (1.6x)</span>
                                <span>Hyper (2.5x)</span>
                            </div>
                        </div>

                        {/* Jump Impulse */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Jump Impulse Velocity
                                </span>
                                <span className="text-xs font-mono font-black text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                                    {kinematics.jumpImpulse.toFixed(1)} m/s
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={16}
                                step={0.5}
                                value={kinematics.jumpImpulse}
                                onChange={(e) => handleSaveKinematics({ jumpImpulse: Number(e.target.value) })}
                                className="w-full accent-purple-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Grounded (0)</span>
                                <span>Standard (8.5)</span>
                                <span>High Leap (16)</span>
                            </div>
                        </div>

                        {/* Loop Animation FPS */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Loop Animation FPS
                                </span>
                                <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                                    {kinematics.loopFps} FPS
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 pt-1">
                                {[8, 12, 16, 24].map(fps => (
                                    <button
                                        key={fps}
                                        onClick={() => handleSaveKinematics({ loopFps: fps })}
                                        className={`py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                                            kinematics.loopFps === fps
                                                ? 'bg-rose-500 text-white font-black'
                                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {fps} FPS
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hitbox Bounding Radius */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Collision Hitbox Radius
                                </span>
                                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                                    {kinematics.hitboxRadius} px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={8}
                                max={48}
                                step={2}
                                value={kinematics.hitboxRadius}
                                onChange={(e) => handleSaveKinematics({ hitboxRadius: Number(e.target.value) })}
                                className="w-full accent-emerald-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Narrow (8px)</span>
                                <span>Humanoid (16px)</span>
                                <span>Large (48px)</span>
                            </div>
                        </div>

                        {/* Hitbox Height */}
                        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-mono font-bold text-slate-300">
                                    Collision Height Bounds
                                </span>
                                <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
                                    {kinematics.hitboxHeight} px
                                </span>
                            </div>
                            <input
                                type="range"
                                min={16}
                                max={96}
                                step={4}
                                value={kinematics.hitboxHeight}
                                onChange={(e) => handleSaveKinematics({ hitboxHeight: Number(e.target.value) })}
                                className="w-full accent-indigo-400 cursor-pointer"
                            />
                            <div className="flex justify-between text-[8px] font-mono text-slate-500">
                                <span>Chibi / Small (24px)</span>
                                <span>Standard (48px)</span>
                                <span>Colossus (96px)</span>
                            </div>
                        </div>
                    </div>

                    {/* Extensible Custom Attributes (Optional for Game-Specific Mechanics) */}
                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wide">
                                    Game-Specific Attributes (Optional)
                                </h4>
                                <p className="text-[9px] font-mono text-slate-400">
                                    Attach custom key-values here if a specific game requires unique mechanics (e.g. ammo, stamina, D&D traits).
                                </p>
                            </div>
                            <span className="text-[9px] font-mono text-slate-500">
                                {customAttrs.length} Attributes Defined
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {customAttrs.map((attr, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono"
                                >
                                    <span className="text-slate-400">{attr.key}:</span>
                                    <span className="text-white font-bold">{attr.value}</span>
                                    <button
                                        onClick={() => handleRemoveAttribute(idx)}
                                        className="text-white/40 hover:text-red-400 ml-1 transition cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Attribute Input Row */}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                            <input
                                type="text"
                                placeholder="Property Key (e.g. stamina_pool)"
                                value={newAttrKey}
                                onChange={(e) => setNewAttrKey(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                            />
                            <input
                                type="text"
                                placeholder="Value (e.g. 100)"
                                value={newAttrVal}
                                onChange={(e) => setNewAttrVal(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                            />
                            <button
                                onClick={handleAddAttribute}
                                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold transition cursor-pointer"
                            >
                                + Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
