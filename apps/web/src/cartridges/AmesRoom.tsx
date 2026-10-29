/**
 * AmesRoom.tsx
 * 
 * The first "Forced Perspective" cartridge.
 * Demonstrates the optical principle of Relative Size and depth illusion.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, MousePointer2, Move, Box } from 'lucide-react';
import type { CartridgeProps } from './Cartridge';

const AmesRoom: React.FC<CartridgeProps> = ({ hallucinationFactor = 0.5 }) => {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [perspectiveIntensity, setPerspectiveIntensity] = useState(0.5);

    // Track mouse for parallax demo
    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: (e.clientX - rect.left) / rect.width - 0.5,
            y: (e.clientY - rect.top) / rect.height - 0.5
        });
    };

    return (
        <div 
            className="w-full h-full bg-[#0a0a0a] relative flex items-center justify-center cursor-crosshair overflow-hidden group"
            onMouseMove={handleMouseMove}
        >
            {/* Grid Substrate (Distorted) */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%" className="overflow-visible">
                    <defs>
                        <pattern id="ames-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#ames-grid)" />
                </svg>
            </div>

            {/* --- THE AMES ROOM STRUCTURE --- */}
            <div className="relative w-[80%] h-[80%] flex items-center justify-center perspective-[1000px]">
                
                {/* Back Wall */}
                <motion.div 
                    className="absolute w-full h-full border-2 border-white/10 bg-white/5 rounded-2xl"
                    animate={{ 
                        rotateY: mousePos.x * 10,
                        rotateX: -mousePos.y * 10,
                        skewX: -hallucinationFactor * 10 
                    }}
                />

                {/* Left Subject (The "Giant") - Close to the lens */}
                <motion.div
                    className="absolute left-[-10%] top-[10%] w-48 h-64 bg-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.5)] rounded-2xl flex flex-col items-center justify-center z-50 border-4 border-cyan-300/50"
                    animate={{ 
                        x: mousePos.x * 40,
                        y: mousePos.y * 40,
                        scale: 1 + perspectiveIntensity * 2,
                        filter: `hue-rotate(${hallucinationFactor * 360}deg)`
                    }}
                >
                    <Box size={48} className="text-white mb-4 animate-bounce" />
                    <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-cyan-300 px-2 py-0.5 rounded">SUBJECT_A</span>
                    <span className="text-[8px] text-black/60 font-mono mt-2 uppercase">Scale: OVERSIZE</span>
                </motion.div>

                {/* Right Subject (The "Diminutive") - Far from the lens */}
                <motion.div
                    className="absolute right-[5%] bottom-[15%] w-48 h-64 bg-pink-500 shadow-[0_0_30px_rgba(236,72,153,0.3)] rounded-2xl flex flex-col items-center justify-center z-10 border-2 border-pink-300/30"
                    animate={{ 
                        x: mousePos.x * -20,
                        y: mousePos.y * -20,
                        scale: 1 - perspectiveIntensity * 0.7,
                    }}
                >
                    <Box size={24} className="text-white mb-2 opacity-50" />
                    <span className="text-[8px] font-bold text-white uppercase tracking-widest bg-pink-800/50 px-2 py-0.5 rounded border border-pink-500/30">SUBJECT_B</span>
                    <span className="text-[6px] text-white/40 font-mono mt-2 uppercase text-center">Scale: MINIFIED<br/>(Distant Plane)</span>
                </motion.div>

                {/* Connectors (The "Optical Bridge") */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-white/5 fill-none overflow-visible">
                    <line x1="0" y1="0" x2="100%" y2="100%" />
                    <line x1="100%" y1="0" x2="0" y2="100%" />
                </svg>
            </div>

            {/* --- Overlay UI --- */}
            <div className="absolute top-8 left-8 flex flex-col gap-4">
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <Layers className="text-cyan-400" size={16} />
                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Ames Room Logic</h4>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] text-white/40 uppercase">Optical Intensity</label>
                            <input 
                                type="range" min="0" max="1" step="0.01" 
                                value={perspectiveIntensity} 
                                onChange={(e) => setPerspectiveIntensity(parseFloat(e.target.value))}
                                className="w-32 accent-cyan-500"
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                             <span className="text-[8px] text-white/60">TRACKING: {mousePos.x.toFixed(2)}, {mousePos.y.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl max-w-[200px]">
                    <span className="text-[9px] text-white/40 leading-relaxed italic">
                        "While the room appears as a normal rectangular space through the camera lens, its true geometric shape is an irregular hexahedron..."
                    </span>
                </div>
            </div>

            {/* Prompt for interaction */}
            <div className="absolute bottom-12 right-12 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <MousePointer2 size={16} className="text-white p-1 rounded-full bg-white/10 border border-white/20 animate-pulse" />
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Move mouse to shift perspective</span>
            </div>
        </div>
    );
};

export default AmesRoom;
