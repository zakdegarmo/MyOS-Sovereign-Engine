/**
 * OmniLab.tsx
 * 
 * The Ringmaster's personal FAFO sandbox.
 * Functions as a "Gaming Console" that loads Cartridges from the registry.
 */

import React, { useState, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Layers, Cpu, Zap, Maximize2, Trash2, Ghost } from 'lucide-react';
import type { CartridgeMetadata } from '../../cartridges/Cartridge';

// --- Cartridge Host Component ---
export const OmniLab: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [activeCartridgeId, setActiveCartridgeId] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hallucinationFactor, setHallucinationFactor] = useState(0.5); // "Hallucinations are a feature"

    // Mock Registry for now - will move to a central loader
    const availableCartridges: CartridgeMetadata[] = [
        {
            id: 'ames-room',
            name: 'Ames Room Illusion',
            description: 'Practical forced perspective via relative scale distortion.',
            version: '1.0.0',
            author: 'Ringmaster',
            category: 'optical',
            icon: 'Layers'
        },
        {
            id: 'circus-crawl',
            name: 'Digital Circus Crawl',
            description: 'A 16-bit dungeon crawler within the Digital Circus.',
            version: '0.1.0',
            author: 'Ringmaster',
            category: 'game',
            icon: 'Gamepad2'
        },
        {
            id: 'dnd-tabletop',
            name: 'AI-Orchestrated D&D VTT',
            description: 'A 3D Virtual Tabletop slice with local Ollama Dungeon Master integration.',
            version: '1.0.0',
            author: 'Worker Subagent',
            category: 'game',
            icon: 'Gamepad2'
        }
    ];

    const ActiveCartridgeComponent = useMemo(() => {
        if (!activeCartridgeId) return null;
        
        // Dynamic Load
        return React.lazy(() => {
            if (activeCartridgeId === "ames-room") return import("../../cartridges/AmesRoom");
            if (activeCartridgeId === "circus-crawl") return import("../../cartridges/CircusCrawl");
            if (activeCartridgeId === "dnd-tabletop") return import("../../cartridges/DndTabletop");
            throw new Error(`Cartridge ${activeCartridgeId} not found.`);
        });
    }, [activeCartridgeId]);

    return (
        <div className={`w-full h-full bg-slate-950 flex flex-col font-mono text-white selection:bg-cyan-500/30 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[100]' : 'relative'}`}>
            
            {/* --- Console Header --- */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">The OmniLab</h2>
                        <span className="text-[10px] text-cyan-500/50 uppercase tracking-tighter">FAFO ENGINE v2.0.42</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Hallucination Slider */}
                    <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <Ghost size={14} className={hallucinationFactor > 0.8 ? 'text-pink-500 animate-pulse' : 'text-white/40'} />
                        <input 
                            type="range" 
                            min="0" max="1" step="0.01" 
                            value={hallucinationFactor} 
                            onChange={(e) => setHallucinationFactor(parseFloat(e.target.value))}
                            className="w-20 accent-cyan-500"
                        />
                        <span className="text-[9px] text-white/40 w-8">{(hallucinationFactor * 100).toFixed(0)}%</span>
                    </div>

                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                        <Maximize2 size={16} />
                    </button>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </header>

            {/* --- Main Viewport --- */}
            <main className="flex-1 relative overflow-hidden flex">
                
                {/* Cartridge Sidebar */}
                <aside className="w-64 border-r border-white/10 p-4 flex flex-col gap-4 bg-black/20 overflow-y-auto">
                    <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-2">Cartridge Library</h3>
                    {availableCartridges.map(cart => (
                        <button
                            key={cart.id}
                            onClick={() => setActiveCartridgeId(cart.id)}
                            className={`group p-3 rounded-xl border transition-all text-left flex gap-3 ${
                                activeCartridgeId === cart.id 
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' 
                                : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20 hover:bg-white/10'
                            }`}
                        >
                            <div className="p-2 rounded-lg bg-black/40 border border-white/10 group-hover:border-white/20">
                                {cart.icon === 'Layers' ? <Layers size={16} /> : <Gamepad2 size={16} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold tracking-tight">{cart.name}</span>
                                <span className="text-[9px] opacity-40 leading-tight mt-1">{cart.description}</span>
                            </div>
                        </button>
                    ))}

                    <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 text-[9px] text-pink-500/60 leading-relaxed italic">
                        "Hallucinations are not bugs; they are the brushstrokes of a creative god."
                    </div>
                </aside>

                {/* Active Cartridge Stage */}
                <div className="flex-1 bg-black relative">
                    <AnimatePresence mode="wait">
                        {activeCartridgeId ? (
                            <motion.div
                                key={activeCartridgeId}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="w-full h-full"
                            >
                                <Suspense fallback={
                                    <div className="w-full h-full flex items-center justify-center gap-3">
                                        <Zap size={24} className="text-cyan-500 animate-bounce" />
                                        <span className="text-xs tracking-widest animate-pulse">LOADING CARTRIDGE...</span>
                                    </div>
                                }>
                                    {ActiveCartridgeComponent && (
                                        <ActiveCartridgeComponent 
                                            onClose={() => setActiveCartridgeId(null)}
                                            hallucinationFactor={hallucinationFactor}
                                            swarmHost="localhost:3000"
                                        />
                                    )}
                                </Suspense>
                            </motion.div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
                                <Ghost size={64} className="mb-6" />
                                <span className="text-xs tracking-[0.5em] uppercase">No Cartridge Loaded</span>
                                <span className="text-[10px] mt-4 opacity-50 italic">FAFO safely, Ringmaster.</span>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Status Bar */}
            <footer className="h-6 border-t border-white/5 bg-black/40 flex items-center px-4 justify-between text-[8px] text-white/30 uppercase tracking-widest shrink-0">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> SYSTEM ONLINE</span>
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> ENGINE: NEXUS-CORE</span>
                </div>
                <div>
                    LOCAL_ADDR: 127.0.0.1:3000 (SWARM)
                </div>
            </footer>
        </div>
    );
};

export default OmniLab;
