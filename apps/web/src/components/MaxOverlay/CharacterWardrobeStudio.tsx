import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Layers, Sparkles, RefreshCw, Trash2, Download, Send, Check, 
    Shield, Wand2, User, ChevronRight, Play, Pause, Compass
} from 'lucide-react';
import { LpcLibraryExplorer } from './LpcLibraryExplorer';
import { useAvatarCompositor, type AvatarGenome, type LpcAction, GENOME_LAYERS } from '../../hooks/useAvatarCompositor';
import { defaultGenome, randomizeGenome } from '../../hooks/useOntologicalGenome';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';

interface CharacterWardrobeStudioProps {
    onClose?: () => void;
}

export const CharacterWardrobeStudio: React.FC<CharacterWardrobeStudioProps> = ({ onClose }) => {
    const { updateAgentGenome } = useCouncil();
    const [lpcGenome, setLpcGenome] = useState<AvatarGenome>(defaultGenome);
    const [lpcAction, setLpcAction] = useState<LpcAction>('walk');
    const [lpcDirection, setLpcDirection] = useState<'U' | 'D' | 'L' | 'R'>('D');
    const [isPlaying, setIsPlaying] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const [manifest, setManifest] = useState<{
        sprites: Record<string, any[]>;
        environments: Record<string, any[]>;
        uncategorized: any[];
    }>({ sprites: {}, environments: {}, uncategorized: [] });

    useEffect(() => {
        fetch('/textures/avatars/lpc/mephit_manifest.json')
            .then(res => res.json())
            .then(data => setManifest(data))
            .catch(err => console.error("Failed to load LPC manifest:", err));
    }, []);

    const poseFrameRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { canvas, isLoaded, draw } = useAvatarCompositor(
        lpcGenome,
        lpcAction,
        lpcDirection,
        poseFrameRef,
        {
            resolution: 256,
            inkStyle: 'none',
            contrast: 1.0,
            onRender: () => {
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 256, 256);
                        ctx.drawImage(canvas, 0, 0, 256, 256);
                    }
                }
            }
        }
    );

    useEffect(() => {
        let lastTime = performance.now();
        let animId: number;
        const loop = (time: number) => {
            if (isPlaying) {
                const dt = Math.min((time - lastTime) / 1000, 0.1);
                lastTime = time;
                poseFrameRef.current = (poseFrameRef.current + dt * 1.5) % 1.0;
                if (draw) draw();
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.imageSmoothingEnabled = false;
                        ctx.clearRect(0, 0, 256, 256);
                        ctx.drawImage(canvas, 0, 0, 256, 256);
                    }
                }
            } else {
                lastTime = time;
            }
            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [isPlaying, draw, canvas]);

    const handleSelectAsset = (layer: string, entry: any) => {
        const path = typeof entry === 'string' ? entry : entry.path;
        setLpcGenome(prev => ({ ...prev, [layer]: path }));
    };

    const handleClearSlot = (layer: string) => {
        setLpcGenome(prev => ({ ...prev, [layer]: 'none' }));
    };

    const handleRandomize = () => {
        if (Object.keys(manifest.sprites).length === 0) return;
        const randomized = randomizeGenome(manifest);
        setLpcGenome(randomized);
    };

    const handleClearAll = () => {
        const empty: any = {};
        GENOME_LAYERS.forEach(l => empty[l] = 'none');
        setLpcGenome(empty);
    };

    const handleEquipToUser = () => {
        updateAgentGenome('user' as AgentId, { genome: lpcGenome });
        window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: { genome: lpcGenome } }));
        setStatusMessage('✨ Wardrobe Applied to Active Avatar!');
        setTimeout(() => setStatusMessage(null), 2500);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-serif text-lg shadow-inner">
                        🝧
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                FSG://Self.Self.Unity
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase">
                                Modular Wardrobe & Layer Compositor
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Universal Paperdoll Modularization • Hair, Garments, Armor & Weapons
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRandomize}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                        <RefreshCw size={12} className="text-amber-400" />
                        <span>Randomize Outfit</span>
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                        <Trash2 size={12} className="text-rose-400" />
                        <span>Nude Base</span>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                            title="Close & Return to Self.Self"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Main Studio Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Asset Browser */}
                <div className="w-96 border-r border-white/10 flex flex-col bg-black/20 shrink-0">
                    <LpcLibraryExplorer
                        manifest={manifest}
                        onSelectAsset={handleSelectAsset}
                        onSelectPreset={(preset) => setLpcGenome(prev => ({ ...prev, ...preset }))}
                        currentGenome={lpcGenome}
                    />
                </div>

                {/* Center Pane: Turntable Viewport */}
                <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden items-center justify-center p-6">
                    <div className="relative p-6 bg-slate-900/90 border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center">
                        <canvas
                            ref={canvasRef}
                            width={256}
                            height={256}
                            className="image-pixelated bg-black rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/30"
                        />

                        {/* 4-Directional Selector */}
                        <div className="flex gap-2 mt-4 z-10 bg-black/60 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
                            {(['U', 'L', 'D', 'R'] as const).map(dir => (
                                <button
                                    key={dir}
                                    onClick={() => setLpcDirection(dir)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition cursor-pointer ${
                                        lpcDirection === dir ? 'bg-cyan-500 text-black font-black' : 'text-white/40 hover:text-white'
                                    }`}
                                >
                                    {dir}
                                </button>
                            ))}
                        </div>

                        {/* Action Switcher */}
                        <div className="flex gap-1.5 mt-3">
                            {(['walk', 'slash', 'thrust', 'spellcast', 'bow', 'hurt'] as const).map(act => (
                                <button
                                    key={act}
                                    onClick={() => setLpcAction(act)}
                                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition cursor-pointer ${
                                        lpcAction === act ? 'bg-purple-600 text-white shadow-sm' : 'bg-white/5 text-white/40 hover:text-white'
                                    }`}
                                >
                                    {act}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Pane: Active Layer Stack & Equip Actions */}
                <div className="w-80 border-l border-white/10 flex flex-col bg-slate-950/80 p-5 gap-4 overflow-y-auto shrink-0">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                            Equipped Layers ({Object.values(lpcGenome).filter(v => v && v !== 'none').length})
                        </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                        {GENOME_LAYERS.map(layer => {
                            const val = lpcGenome[layer];
                            const isEquipped = val && val !== 'none';
                            const displayName = isEquipped ? val.split('/').pop()?.replace('.png', '') : 'Empty';
                            return (
                                <div
                                    key={layer}
                                    className={`p-2.5 rounded-xl border transition flex items-center justify-between ${
                                        isEquipped
                                            ? 'bg-black/40 border-cyan-500/30 text-white'
                                            : 'bg-black/20 border-white/5 text-slate-500'
                                    }`}
                                >
                                    <div className="flex flex-col truncate pr-2">
                                        <span className="text-[8px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                                            {layer}
                                        </span>
                                        <span className="text-[10px] font-mono truncate text-cyan-300">
                                            {displayName}
                                        </span>
                                    </div>
                                    {isEquipped && (
                                        <button
                                            onClick={() => handleClearSlot(layer)}
                                            className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                                            title={`Unequip ${layer}`}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-2">
                        {statusMessage && (
                            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold text-center animate-pulse">
                                {statusMessage}
                            </div>
                        )}
                        <button
                            onClick={handleEquipToUser}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={14} />
                            <span>Equip to Active Character</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
