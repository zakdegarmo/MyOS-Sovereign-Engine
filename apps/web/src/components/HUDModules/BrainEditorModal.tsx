import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Brain, Cpu, Sliders, ShieldCheck, HardDrive, 
    Volume2, Monitor, RefreshCw, Sparkles, Terminal, CheckCircle2 
} from 'lucide-react';

interface BrainEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentModel?: string;
    onModelChange?: (model: string) => void;
}

export const BrainEditorModal: React.FC<BrainEditorModalProps> = ({
    isOpen,
    onClose,
    currentModel = 'gemma4:26b',
    onModelChange
}) => {
    const [activeTab, setActiveTab] = useState<'neural' | 'pillars' | 'hardware' | 'distro'>('neural');
    const [selectedModel, setSelectedModel] = useState(currentModel);
    const [memoryDecayHours, setMemoryDecayHours] = useState(12);
    const [reflectionCadence, setReflectionCadence] = useState(45);
    const [renderScale, setRenderScale] = useState(1.0);
    const [crtScanlines, setCrtScanlines] = useState(false);
    const [audioVolume, setAudioVolume] = useState(85);

    // Pillar Weights (0 to 100)
    const [pillarWeights, setPillarWeights] = useState<Record<string, number>>({
        self: 85,
        thought: 90,
        logic: 95,
        unity: 80,
        existence: 90,
        improvement: 85,
        mastery: 90,
        resonance: 80,
        transcendence: 85,
        omni: 95
    });

    if (!isOpen) return null;

    const handleWeightChange = (pillar: string, val: number) => {
        setPillarWeights(prev => ({ ...prev, [pillar]: val }));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none font-sans">
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 20 }}
                    className="w-[680px] max-w-[95vw] max-h-[85vh] bg-slate-950/95 border border-purple-500/40 rounded-3xl shadow-[0_0_80px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden text-white"
                >
                    {/* Header */}
                    <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-purple-950/50 to-slate-900 border-b border-purple-500/30 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <Brain size={20} className="animate-pulse text-purple-300" />
                            </div>
                            <div>
                                <h3 className="text-sm font-mono font-bold tracking-wider text-purple-200 uppercase flex items-center gap-2">
                                    <span>RUBIK'S CORTEX • BRAIN EDITOR</span>
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-[9px] text-purple-300 border border-purple-400/30">
                                        SETTINGS
                                    </span>
                                </h3>
                                <p className="text-[11px] text-slate-400 font-mono">
                                    Cognitive Weights, Model Routing & Sovereign Distro Parameters
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-red-500/20 hover:border-red-400 border border-slate-700 text-slate-400 hover:text-red-300 transition-all"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-6 py-2 bg-slate-900/60 border-b border-white/5 flex items-center gap-2 text-xs font-mono shrink-0">
                        <button
                            onClick={() => setActiveTab('neural')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'neural'
                                    ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 font-bold'
                                    : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <Cpu size={13} /> NEURAL & MODELS
                        </button>
                        <button
                            onClick={() => setActiveTab('pillars')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'pillars'
                                    ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 font-bold'
                                    : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <Sliders size={13} /> 10 PILLAR WEIGHTS
                        </button>
                        <button
                            onClick={() => setActiveTab('hardware')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'hardware'
                                    ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 font-bold'
                                    : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <Monitor size={13} /> GRAPHICS & AUDIO
                        </button>
                        <button
                            onClick={() => setActiveTab('distro')}
                            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                activeTab === 'distro'
                                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 font-bold'
                                    : 'text-slate-400 hover:text-white border border-transparent'
                            }`}
                        >
                            <HardDrive size={13} /> LIVE DISTRO
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs">
                        {/* TAB 1: NEURAL ROUTING */}
                        {activeTab === 'neural' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-mono font-bold text-slate-300 block uppercase">
                                        Active Edge Inference Model (localhost:11434)
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {[
                                            { id: 'gemma4:26b', name: 'Gemma 4 (26B-A4W4)', desc: 'Primary local sovereign cortex' },
                                            { id: 'mistral:latest', name: 'Mistral 7B', desc: 'Fast tactical low-VRAM model' },
                                            { id: 'llava:latest', name: 'LLaVA Multimodal', desc: 'Screen observer & VLM vision' },
                                            { id: 'cloud_gemini', name: 'Cloud Gemini Fallback', desc: 'Remote high-bandwidth compiler' }
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedModel(m.id);
                                                    onModelChange?.(m.id);
                                                }}
                                                className={`p-3 rounded-2xl border text-left transition-all ${
                                                    selectedModel === m.id
                                                        ? 'bg-purple-500/20 border-purple-400 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                                                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="font-mono font-bold flex items-center justify-between">
                                                    <span>{m.name}</span>
                                                    {selectedModel === m.id && <CheckCircle2 size={13} className="text-purple-400" />}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-slate-300">Biological Memory Half-Life</span>
                                        <span className="text-purple-400 font-bold">{memoryDecayHours} Hours</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={48}
                                        value={memoryDecayHours}
                                        onChange={(e) => setMemoryDecayHours(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        Governs SQLite synaptic lattice memory decay. Low = fast forgetting; High = permanent crystallization.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-slate-300">Autopoiesis Reflection Interval</span>
                                        <span className="text-purple-400 font-bold">{reflectionCadence}s</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={15}
                                        max={120}
                                        step={5}
                                        value={reflectionCadence}
                                        onChange={(e) => setReflectionCadence(Number(e.target.value))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 2: 10 PILLAR WEIGHTS */}
                        {activeTab === 'pillars' && (
                            <div className="space-y-3">
                                <p className="text-[11px] text-slate-400 font-mono mb-2">
                                    Fine-tune the cognitive balance and dialectical tension across the 10 Topological Anchors:
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(pillarWeights).map(([pillar, val]) => (
                                        <div key={pillar} className="p-3 bg-slate-900/70 border border-white/5 rounded-2xl space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-mono">
                                                <span className="font-bold uppercase text-purple-300">{pillar}</span>
                                                <span className="text-slate-400">{val}%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={10}
                                                max={100}
                                                value={val}
                                                onChange={(e) => handleWeightChange(pillar, Number(e.target.value))}
                                                className="w-full accent-purple-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TAB 3: HARDWARE & DISPLAY */}
                        {activeTab === 'hardware' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-slate-300">WebGL Viewport Resolution Scale</span>
                                        <span className="text-cyan-400 font-bold">{(renderScale * 100).toFixed(0)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={1.5}
                                        step={0.1}
                                        value={renderScale}
                                        onChange={(e) => setRenderScale(Number(e.target.value))}
                                        className="w-full accent-cyan-500"
                                    />
                                    <p className="text-[10px] text-slate-400 font-mono">
                                        Higher resolution = sharper visual clarity; Lower = locked 60fps on low-power iGPUs.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                            <Volume2 size={14} className="text-pink-400" /> Master Audio Volume
                                        </span>
                                        <span className="text-pink-400 font-bold">{audioVolume}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={audioVolume}
                                        onChange={(e) => setAudioVolume(Number(e.target.value))}
                                        className="w-full accent-pink-500"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                                    <div>
                                        <span className="font-mono font-bold text-slate-300 block">Retro CRT Scanlines & Bloom</span>
                                        <span className="text-[10px] text-slate-400 font-mono">Diegetic phosphor scanline post-processing shader</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={crtScanlines}
                                        onChange={(e) => setCrtScanlines(e.target.checked)}
                                        className="w-5 h-5 accent-purple-500 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB 4: LIVE DISTRO & BARE METAL */}
                        {activeTab === 'distro' && (
                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="font-bold text-cyan-300 uppercase flex items-center gap-1">
                                            <HardDrive size={13} /> SOVEREIGN DISTRO ENVIRONMENT
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[9px] font-bold">
                                            STANDALONE READY
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                                        MyOS is designed to boot directly from a USB live flash drive into a hardware-accelerated kiosk session without standard desktop baggage.
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 text-[11px] font-mono">
                                    <span className="font-bold text-slate-300 block">Host Filesystem Integration ($HOME)</span>
                                    <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10 text-slate-300 text-[10px] space-y-1">
                                        <p>• Bridge Service: <strong className="text-emerald-400">http://127.0.0.1:8081</strong></p>
                                        <p>• 3D Tri-cons: Extruded triangular prisms representing user files</p>
                                        <p>• Directory Portals: Automatic proximity sliding doors for folders</p>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-2 text-[11px] font-mono">
                                    <span className="font-bold text-slate-300 block">Bare-Metal Drive Installer</span>
                                    <p className="text-[10px] text-slate-400 font-sans">
                                        To clone this live image onto your hard drive's EFI boot sector:
                                    </p>
                                    <div className="bg-slate-950 p-2.5 rounded-xl border border-white/10 font-mono text-cyan-300 text-[10px] flex items-center justify-between">
                                        <code>sudo /usr/local/bin/myos-install</code>
                                        <button
                                            onClick={() => navigator.clipboard.writeText("sudo /usr/local/bin/myos-install")}
                                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] text-white"
                                        >
                                            COPY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3.5 bg-slate-900/80 border-t border-white/5 flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-mono text-slate-400">
                            MyOS Core v0.9 • Topological Symbiorithm
                        </span>
                        <button
                            onClick={onClose}
                            className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                        >
                            SAVE & CLOSE
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
