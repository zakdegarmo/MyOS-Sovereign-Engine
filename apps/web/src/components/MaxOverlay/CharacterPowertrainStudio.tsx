import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Sliders, Sparkles, Sun, Palette, Wand2, Layers, 
    RefreshCw, Check, Undo2
} from 'lucide-react';
import { useAvatarCompositor, type AvatarGenome } from '../../hooks/useAvatarCompositor';
import { defaultGenome } from '../../hooks/useOntologicalGenome';
import { useCouncil } from '../../council/CouncilContext';
import { type AgentId } from '../../council/agentRegistry';

interface CharacterPowertrainStudioProps {
    onClose?: () => void;
}

export const CharacterPowertrainStudio: React.FC<CharacterPowertrainStudioProps> = ({ onClose }) => {
    const { updateAgentGenome } = useCouncil();
    const [hueShift, setHueShift] = useState(180);
    const [celShading, setCelShading] = useState(true);
    const [contrast, setContrast] = useState(1.25);
    const [celLevels, setCelLevels] = useState(5);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const poseFrameRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { canvas, draw } = useAvatarCompositor(
        defaultGenome,
        'walk',
        'D',
        poseFrameRef,
        {
            resolution: 256,
            inkStyle: celShading ? 'bold' : 'none',
            contrast: contrast,
            celLevels: celShading ? celLevels : undefined,
            tint: {
                aura_back: `hsl(${hueShift}, 100%, 70%)`,
                aura_front: `hsl(${hueShift}, 100%, 80%)`,
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
    }, [draw, canvas, hueShift, celShading, contrast, celLevels]);

    const handleApply = () => {
        updateAgentGenome('user' as AgentId, { hueShift });
        setStatusMessage('✨ Color Calibration Applied Globally!');
        setTimeout(() => setStatusMessage(null), 2500);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 font-serif text-lg shadow-inner">
                        🜏
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-fuchsia-400 uppercase tracking-widest">
                                FSG://Self.Self.Improvement
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold uppercase">
                                Powertrain & Color Calibration Studio
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Hue Shifts • Cel-Shading Filters • Dynamic Quantization & Contrast
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

            {/* Main Content */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
                {/* Sliders (6 cols) */}
                <div className="lg:col-span-6 flex flex-col gap-5">
                    {/* Hue Shift Slider */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                                Master Hue Shift
                            </span>
                            <span className="text-xs font-mono font-black text-fuchsia-400">{hueShift}°</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={360}
                            value={hueShift}
                            onChange={(e) => setHueShift(parseInt(e.target.value))}
                            className="w-full accent-fuchsia-500 h-2 bg-slate-800 rounded-lg"
                        />
                        <div className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-cyan-500 via-blue-500 via-purple-500 to-red-500 opacity-60" />
                    </div>

                    {/* Cel Shading & Filters */}
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest block">
                                    Cel-Shading Filter
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">
                                    Retro comic outline ink & shadow quantization
                                </span>
                            </div>
                            <button
                                onClick={() => setCelShading(prev => !prev)}
                                className={`px-3 py-1.5 rounded-xl font-mono text-[9px] font-bold uppercase transition cursor-pointer ${
                                    celShading ? 'bg-amber-500 text-black font-black' : 'bg-white/10 text-white/40'
                                }`}
                            >
                                {celShading ? 'Active' : 'Disabled'}
                            </button>
                        </div>

                        {celShading && (
                            <div className="space-y-3 pt-2 border-t border-white/5">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Quantization Steps:</span>
                                        <span className="text-amber-400 font-bold">{celLevels} Bands</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={2}
                                        max={8}
                                        value={celLevels}
                                        onChange={(e) => setCelLevels(parseInt(e.target.value))}
                                        className="w-full accent-amber-400 h-1"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                        <span>Contrast Multiplier:</span>
                                        <span className="text-cyan-400 font-bold">{contrast.toFixed(2)}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.8}
                                        max={2.0}
                                        step={0.05}
                                        value={contrast}
                                        onChange={(e) => setContrast(parseFloat(e.target.value))}
                                        className="w-full accent-cyan-400 h-1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto space-y-2">
                        {statusMessage && (
                            <div className="p-2 rounded-xl bg-fuchsia-950/80 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] font-mono font-bold text-center animate-pulse">
                                {statusMessage}
                            </div>
                        )}
                        <button
                            onClick={handleApply}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-600 hover:from-fuchsia-500 hover:to-amber-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-fuchsia-900/30 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={14} />
                            <span>Apply Calibration</span>
                        </button>
                    </div>
                </div>

                {/* Right Viewport (6 cols) */}
                <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/30 border border-white/10 rounded-2xl p-6">
                    <canvas
                        ref={canvasRef}
                        width={256}
                        height={256}
                        className="image-pixelated bg-black rounded-2xl shadow-[0_0_60px_rgba(217,70,239,0.25)] ring-1 ring-fuchsia-500/30"
                    />
                    <div className="mt-4 text-center font-mono text-[10px] text-slate-400">
                        Live Filter Preview: <strong className="text-fuchsia-300">{hueShift}° Shift</strong> • <strong className="text-amber-300">{celShading ? 'Cel Shaded' : 'Raw Pixel'}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};
