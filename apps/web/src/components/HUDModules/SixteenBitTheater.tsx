/**
 * SixteenBitTheater.tsx
 * 
 * The specialized "Stage" for visual storytelling and narrative cartridges.
 * Features a high-fidelity 16-bit CRT aesthetic.
 */

import React, { useState, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Monitor, Play, SkipForward, Power, Maximize2, Minimize2, PanelLeftClose, PanelLeft } from 'lucide-react';
import type { CartridgeMetadata } from '../../cartridges/Cartridge';

export const SixteenBitTheater: React.FC<{ onClose?: () => void }> = ({ onClose = () => {} }) => {
    const [activeCartridgeId, setActiveCartridgeId] = useState<string | null>('burban-warfare');
    const [isPowerOn, setIsPowerOn] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Machinima, Story & Retro-Modern cartridges
    const availableCartridges: CartridgeMetadata[] = [
        {
            id: 'glyphrider',
            name: 'Glyphrider: Rogue Unicycle League',
            description: '90s Uniracers Reboot with stunt tricks, mock-MMO campaign & track loops.',
            version: '2.0.0',
            author: 'MyOS Sovereign Arcade',
            category: 'game',
            icon: 'Zap'
        },
        {
            id: 'burban-warfare',
            name: "'Burban Warfare: Suburban Survivors",
            description: '2.5D Isometric ZAMN x Vampire Survivors Suburban Horde Cartridge',
            version: '1.0.0',
            author: 'Sovereign Game Studio',
            category: 'game',
            icon: 'Flame'
        },
        {
            id: 'b-movie-machinima',
            name: 'B-Movie Beatdown: Director Cut (Machinima)',
            description: '16-Bit Machinima Story Episode & Camera Showcase',
            version: '1.0.0',
            author: 'Director',
            category: 'game',
            icon: 'Clapperboard'
        },
        {
            id: 'circus-intro',
            name: 'The Digital Circus: Origins',
            description: 'The narrative foundation of the Circus Nexus.',
            version: '1.0.0',
            author: 'Ringmaster',
            category: 'game',
            icon: 'Film'
        }
    ];

    const ActiveCartridgeComponent = useMemo(() => {
        if (!activeCartridgeId) return null;
        return React.lazy(() => {
            if (activeCartridgeId === 'glyphrider') return import('../../cartridges/Glyphrider');
            if (activeCartridgeId === 'burban-warfare') return import('../../cartridges/BurbanWarfare');
            if (activeCartridgeId === 'b-movie-machinima') return import('../../cartridges/BMovieBeatdown');
            if (activeCartridgeId === 'circus-intro') return import('../../cartridges/CircusIntro');
            throw new Error(`Cartridge ${activeCartridgeId} not found.`);
        });
    }, [activeCartridgeId]);

    if (!isPowerOn) {
        return (
            <div className="w-[600px] h-[450px] bg-black border-4 border-slate-800 rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl">
                 <button 
                    onClick={() => setIsPowerOn(true)}
                    className="group flex flex-col items-center gap-4 transition-all"
                >
                    <div className="p-4 rounded-full bg-slate-900 border border-slate-800 group-hover:border-green-500/50 group-hover:text-green-400 text-slate-700 transition-all">
                        <Power size={32} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-800 uppercase tracking-widest group-hover:text-green-900">16-BIT_THEATER_OFF</span>
                </button>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 bg-slate-950 border-2 border-slate-800 rounded-2xl flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.9)] relative group overflow-hidden ${
            isFullscreen ? 'w-full h-full min-w-[85vw] min-h-[82vh]' : 'w-[1050px] h-[720px]'
        }`}>
            
            {/* --- CRT SCANLINE OVERLAY --- */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.05] mix-blend-overlay overflow-hidden">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="scanlines" width="100%" height="4" patternUnits="userSpaceOnUse">
                            <line x1="0" y1="0" x2="100%" y2="0" stroke="white" strokeWidth="2" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#scanlines)" />
                </svg>
            </div>

            {/* --- THEATER HEADER --- */}
            <header className="h-12 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/90 backdrop-blur-md relative z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-yellow-400/70 hover:text-yellow-400 transition-colors"
                        title={isSidebarOpen ? "Hide Rack" : "Show Cartridge Rack"}
                    >
                        {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Monitor size={15} className="text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-yellow-100 font-bold text-xs tracking-tight uppercase italic flex items-center gap-2">
                             16-Bit Arcade & Theater
                             <span className="text-[9px] not-italic px-1.5 py-0.2 rounded bg-red-600 text-white font-black animate-pulse">LIVE</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-yellow-400 transition-colors"
                        title={isFullscreen ? "Restore Viewport" : "Expand Viewport"}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button 
                        onClick={() => setIsPowerOn(false)}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-red-400 transition-colors"
                        title="Power Off"
                    >
                        <Power size={16} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </header>

            {/* --- MAIN STAGE --- */}
            <main className="flex-1 flex overflow-hidden relative">
                
                {/* Cartridge Sidebar (The Rack) */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 220, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-r border-white/10 bg-black/50 backdrop-blur-md p-4 overflow-y-auto z-40"
                        >
                            <h3 className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-3 px-1">The Rack</h3>
                            <div className="flex flex-col gap-2">
                                {availableCartridges.map(cart => (
                                    <button
                                        key={cart.id}
                                        onClick={() => setActiveCartridgeId(cart.id)}
                                        className={`text-left p-2.5 rounded-xl border transition-all ${
                                            activeCartridgeId === cart.id
                                            ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md'
                                            : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="text-xs font-bold truncate">{cart.name}</div>
                                        <div className="text-[8px] uppercase mt-1 opacity-50">v{cart.version}</div>
                                    </button>
                                ))}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* The Screen (Full Viewport) */}
                <div className="flex-1 bg-black relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeCartridgeId ? (
                            <motion.div
                                key={activeCartridgeId}
                                initial={{ opacity: 0, scale: 1.02 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full"
                            >
                                <Suspense fallback={
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-yellow-500/40">
                                        <Activity size={32} className="animate-spin" />
                                        <span className="text-[10px] font-mono tracking-[0.5em] animate-pulse">BOOTING_CARTRIDGE...</span>
                                    </div>
                                }>
                                    {ActiveCartridgeComponent && (
                                        <ActiveCartridgeComponent onClose={() => setActiveCartridgeId(null)} />
                                    )}
                                </Suspense>
                            </motion.div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
                                <span className="text-[10px] font-mono text-yellow-500 uppercase tracking-[0.3em]">No Content Detected</span>
                                <span className="text-[8px] text-white/20 mt-4 uppercase">Wait for signal or load cartridge</span>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* --- CONTROLS BAR --- */}
            <footer className="h-9 border-t border-white/10 bg-black/80 flex items-center px-6 justify-between relative z-30">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-yellow-400/80 font-mono tracking-wider">CARTRIDGE: 'BURBAN WARFARE</span>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] text-white/30 uppercase font-mono">RESOLUTION: NATIVE</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SixteenBitTheater;
