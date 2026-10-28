import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    Search, Sparkles, Dna, Compass, ArrowRight, Check, 
    RefreshCw, Layers, Shield, Send
} from 'lucide-react';
import { useOntologicalContext } from '../../council/OntologicalContext';
import { genomeFromPath, pillarIndexFromPath, hueFromPath, cyrb53 } from '../../hooks/useOntologicalGenome';
import { useAvatarCompositor, type AvatarGenome } from '../../hooks/useAvatarCompositor';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';

interface CharacterGenomeStudioProps {
    onClose?: () => void;
}

const PILLAR_NAMES = ['Self', 'Thought', 'Logic', 'Unity', 'Existence', 'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'];

export const CharacterGenomeStudio: React.FC<CharacterGenomeStudioProps> = ({ onClose }) => {
    const { updateAgentGenome } = useCouncil();
    const { activePath: globalPath, setActivePath: setGlobalPath } = useOntologicalContext();
    
    const [pathInput, setPathInput] = useState(globalPath || 'self.identity.ego');
    const [manifest, setManifest] = useState<any>({ sprites: {} });
    const [activeGenome, setActiveGenome] = useState<AvatarGenome | null>(null);
    const [derivedSeed, setDerivedSeed] = useState(0);
    const [derivedPillar, setDerivedPillar] = useState(0);
    const [derivedHue, setDerivedHue] = useState(0);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        fetch('/textures/avatars/lpc/mephit_manifest.json')
            .then(res => res.json())
            .then(data => {
                setManifest(data);
                if (pathInput) {
                    generateFromPath(pathInput, data);
                }
            })
            .catch(console.error);
    }, []);

    const generateFromPath = (path: string, manifestData: any) => {
        const trimmed = path.trim().toLowerCase();
        if (!trimmed || !manifestData.sprites) return;
        const genome = genomeFromPath(trimmed, manifestData);
        setActiveGenome(genome);
        setDerivedPillar(pillarIndexFromPath(trimmed));
        setDerivedHue(hueFromPath(trimmed));
        setDerivedSeed(cyrb53(trimmed));
        setGlobalPath(trimmed);
    };

    const poseFrameRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { canvas, draw } = useAvatarCompositor(
        activeGenome || {},
        'walk',
        'D',
        poseFrameRef,
        {
            resolution: 256,
            tint: {
                aura_back: `hsl(${derivedHue}, 100%, 70%)`,
                aura_front: `hsl(${derivedHue}, 100%, 80%)`,
            },
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
            animId = requestAnimationFrame(loop);
        };
        animId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animId);
    }, [draw, canvas]);

    const handleApply = () => {
        if (!activeGenome) return;
        updateAgentGenome('user' as AgentId, { genome: activeGenome, pillarIdx: derivedPillar, hueShift: derivedHue });
        window.dispatchEvent(new CustomEvent('myos_update_gestalt', { detail: { genome: activeGenome } }));
        setStatusMessage('✨ Genome Manifested into Active Avatar!');
        setTimeout(() => setStatusMessage(null), 2500);
    };

    const PRESET_PATHS = [
        'self.identity.ego',
        'thought.synthesizes.pattern',
        'logic.structures.relic',
        'unity.integrates.harmony',
        'mastery.commands.totality',
        'resonance.echoes.frequencies',
        'transcendence.elevates.spirit'
    ];

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-serif text-lg shadow-inner">
                        🜄
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                                FSG://Self.Self.Existence
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold uppercase">
                                Ontological Genome & Deterministic Generator
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Dot-Path Synthesis • Seed Hashing • Procedural Avatar Manifestation
                        </p>
                    </div>
                </div>

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

            {/* Content Body */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
                {/* Left Column (5 cols): Path Input & Genomic Parameters */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                            Ontological Dot-Path
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={pathInput}
                                onChange={(e) => setPathInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && generateFromPath(pathInput, manifest)}
                                placeholder="e.g. self.identity.ego"
                                className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                            />
                            <button
                                onClick={() => generateFromPath(pathInput, manifest)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
                            >
                                <Search size={13} />
                                <span>Synthesize</span>
                            </button>
                        </div>

                        {/* Presets */}
                        <div className="space-y-1.5 pt-2">
                            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">
                                Quick Ontological Vectors:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_PATHS.map(p => (
                                    <button
                                        key={p}
                                        onClick={() => {
                                            setPathInput(p);
                                            generateFromPath(p, manifest);
                                        }}
                                        className="px-2 py-1 rounded bg-black/40 border border-white/5 hover:border-indigo-500/40 text-[9px] font-mono text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Derived Mathematical Traits */}
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 font-mono text-[9px]">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block pb-1 border-b border-white/5">
                            Deterministic Properties
                        </span>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Hash Seed:</span>
                            <span className="text-cyan-400 font-bold">0x{derivedSeed.toString(16).toUpperCase().padStart(8, '0')}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Harmonic Pillar:</span>
                            <span className="text-amber-400 font-bold">{PILLAR_NAMES[derivedPillar]} [{derivedPillar}]</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-400">
                            <span>Resonant Hue Shift:</span>
                            <span className="text-fuchsia-400 font-bold">{derivedHue}°</span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-2">
                        {statusMessage && (
                            <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold text-center animate-pulse">
                                {statusMessage}
                            </div>
                        )}
                        <button
                            onClick={handleApply}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={14} />
                            <span>Manifest Active Genome</span>
                        </button>
                    </div>
                </div>

                {/* Right Column (7 cols): Manifestation Turntable */}
                <div className="lg:col-span-7 flex flex-col items-center justify-center bg-black/30 border border-white/10 rounded-2xl p-6">
                    <canvas
                        ref={canvasRef}
                        width={256}
                        height={256}
                        className="image-pixelated bg-black rounded-2xl shadow-[0_0_60px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/30"
                    />
                    <div className="mt-4 text-center font-mono text-[10px] text-slate-400">
                        Synthesized from <strong className="text-indigo-300">{pathInput}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};
