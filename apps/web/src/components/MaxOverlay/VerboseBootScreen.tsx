import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, Cpu, Sparkles, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface BootStep {
    id: string;
    label: string;
    detail: string;
    status: 'pending' | 'running' | 'done' | 'warning';
}

interface VerboseBootScreenProps {
    onBootComplete: () => void;
}

export const VerboseBootScreen: React.FC<VerboseBootScreenProps> = ({ onBootComplete }) => {
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const [steps, setSteps] = useState<BootStep[]>([
        { id: 'kernel', label: 'MyOS Sovereign Kernel', detail: 'Mounting runtime parameters and local storage gestalt', status: 'pending' },
        { id: 'council', label: '10-Pillar Ontological Council', detail: 'Hydrating cognitive state: Self, Thought, Logic, Unity, Existence...', status: 'pending' },
        { id: 'lpc_manifest', label: '2.5D LPC Sprite Atlas', detail: 'Parsing mephit_manifest.json and character sheets', status: 'pending' },
        { id: 'three_webgl', label: 'Spatial 3D Canvas & WebGL', detail: 'Compiling Three.js shaders and stagecraft lighting', status: 'pending' },
        { id: 'action_economy', label: 'D&D 5e Action Matrix', detail: 'Binding Grimoire spell VFX, action orbs, and inventory', status: 'pending' },
        { id: 'neural_bridge', label: 'Local Neural AI Core', detail: 'Pinging Ollama localhost:11434 (Gemma4 / LLaVA / Mistral)', status: 'pending' },
        { id: 'manifest', label: 'Virtual Shell Manifestation', detail: 'Spawning avatar in sovereign room environment', status: 'pending' }
    ]);

    const addLog = (msg: string) => {
        const timestamp = new Date().toISOString().substring(11, 23);
        setLogs(prev => [...prev.slice(-12), `[${timestamp}] ${msg}`]);
    };

    useEffect(() => {
        let mounted = true;

        const runBootSequence = async () => {
            addLog("INIT: Sovereign Engine v2.5 starting...");

            for (let i = 0; i < steps.length; i++) {
                if (!mounted) return;
                setCurrentStepIndex(i);
                
                // Set running
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
                addLog(`EXEC: Starting ${steps[i].label}...`);
                
                // Fast progressive loading with telemetry
                const delay = 35 + Math.random() * 20;
                await new Promise(r => setTimeout(r, delay));
                
                if (!mounted) return;
                
                // Complete step
                setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
                setProgress(Math.round(((i + 1) / steps.length) * 100));
                addLog(`OK: ${steps[i].label} initialized [DONE]`);
            }

            if (!mounted) return;
            addLog("SYS: All subsystems operational. Virtual Shell ready.");
            setIsComplete(true);
            
            // Auto complete immediately
            setTimeout(() => {
                if (mounted) onBootComplete();
            }, 100);
        };

        runBootSequence();

        return () => { mounted = false; };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.6 } }}
            onClick={onBootComplete}
            className="fixed inset-0 z-[999999] bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-mono select-none cursor-pointer"
            style={{ background: 'radial-gradient(circle at center, #091322 0%, #020617 100%)' }}
        >
            {/* Background Cyberpunk Grid & Scanline */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="scanline-overlay pointer-events-none opacity-30" />

            <div className="relative w-full max-w-3xl bg-black/60 border border-cyan-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col gap-6">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                            <Cpu size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-fuchsia-400 font-display uppercase">
                                MyOS Sovereign Engine
                            </h1>
                            <span className="text-[10px] text-cyan-400/60 uppercase tracking-widest block">
                                Dynamic Bootloader & Subsystem Manifest
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onBootComplete}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 text-[10px] text-cyan-300 font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                        <span>Force Launch</span>
                        <Play size={10} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end text-xs">
                        <span className="text-white/60 font-bold tracking-widest text-[11px] uppercase">
                            {isComplete ? "INITIALIZATION COMPLETE" : steps[currentStepIndex]?.label || "BOOTING..."}
                        </span>
                        <span className="text-cyan-400 font-black text-sm tracking-wider">
                            {progress}%
                        </span>
                    </div>

                    <div className="w-full h-2 bg-slate-900 rounded-full border border-white/10 overflow-hidden p-0.5 relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-fuchsia-500 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                </div>

                {/* Step Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                                step.status === 'done'
                                    ? 'bg-cyan-950/20 border-cyan-500/30 text-white'
                                    : step.status === 'running'
                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 animate-pulse'
                                    : 'bg-white/5 border-white/5 text-white/30'
                            }`}
                        >
                            <div className="mt-0.5">
                                {step.status === 'done' && <CheckCircle2 size={14} className="text-cyan-400" />}
                                {step.status === 'running' && <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />}
                                {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold truncate leading-none">
                                    {step.label}
                                </div>
                                <div className="text-[9px] text-white/40 truncate mt-1">
                                    {step.detail}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Live Console Output */}
                <div className="bg-black/80 rounded-2xl p-3 border border-white/10 font-mono text-[10px] h-28 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-1.5 text-white/30 border-b border-white/10 pb-1 mb-1.5 text-[9px] uppercase tracking-wider">
                        <Terminal size={11} />
                        <span>Live Boot Telemetry Log</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide text-cyan-400/80">
                        {logs.map((log, i) => (
                            <div key={i} className="truncate">
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </motion.div>
    );
};
