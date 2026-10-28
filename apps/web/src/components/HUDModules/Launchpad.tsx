import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, CornerDownRight, Eraser, Globe } from 'lucide-react';
import { COUNCIL } from '../../Omni/constants';
import { findApplicationBySequence } from '../MaxOverlay/applicationRegistry';

interface LaunchpadProps {
    onClose: () => void;
    onLaunch: (manifestUrl: string) => void;
}

export const Launchpad: React.FC<LaunchpadProps> = ({ onClose, onLaunch }) => {
    const [sequence, setSequence] = useState<string[]>([]);
    const [status, setStatus] = useState<'IDLE' | 'HUNTING' | 'FOUND' | 'ERROR'>('IDLE');

    const handleSymbolPress = (symbol: string) => {
        if (sequence.length >= 5) return; // Limit sequence length
        setSequence(prev => [...prev, symbol]);
    };

    const clearSequence = () => {
        setSequence([]);
        setStatus('IDLE');
    };

    useEffect(() => {
        if (sequence.length > 0) {
            const match = findApplicationBySequence(sequence);
            if (match) {
                setStatus('FOUND');
                // Auto launch after a short delay
                const timer = setTimeout(() => {
                    onLaunch(match.manifestUrl);
                    clearSequence();
                }, 800);
                return () => clearTimeout(timer);
            } else {
                setStatus('HUNTING');
            }
        } else {
            setStatus('IDLE');
        }
    }, [sequence, onLaunch]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[320px] bg-black/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
        >
            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Hash size={16} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Onto-Launchpad</h3>
                        <p className="text-[10px] text-white/40 uppercase font-mono tracking-tight">Key in address...</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                    <X size={16} className="text-white/40 group-hover:text-white" />
                </button>
            </div>

            {/* DISPLAY */}
            <div className="px-6 py-8 bg-black/40 relative">
                <div className="h-12 flex items-center justify-center gap-3 p-4 bg-black/60 border border-white/10 rounded-2xl shadow-inner">
                    <AnimatePresence mode="popLayout">
                        {sequence.map((symbol, i) => (
                            <motion.span
                                key={`${symbol}-${i}`}
                                initial={{ opacity: 0, scale: 0, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0 }}
                                className="text-2xl text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                            >
                                {symbol}
                            </motion.span>
                        ))}
                    </AnimatePresence>
                    {sequence.length === 0 && (
                        <span className="text-xs font-mono text-white/20 animate-pulse uppercase tracking-[0.3em]">
                            _AWAITING_INPUT
                        </span>
                    )}
                </div>

                {/* Status Indicator */}
                <div className="mt-3 flex items-center justify-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'FOUND' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                            status === 'HUNTING' ? 'bg-amber-500 animate-pulse' : 'bg-white/10'
                        }`} />
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">
                        {status === 'FOUND' ? 'ADDRESS_LOCKED' : status === 'HUNTING' ? 'SCANNING_REGISTRY' : 'STBY_LINK_READY'}
                    </span>
                </div>
            </div>

            {/* KEYPAD */}
            <div className="p-6 grid grid-cols-5 gap-3 bg-white/5">
                {Object.values(COUNCIL).map((pillar) => (
                    <button
                        key={pillar.id}
                        onClick={() => handleSymbolPress(pillar.symbol)}
                        className="aspect-square flex flex-col items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all group relative overflow-hidden active:scale-95"
                    >
                        <span className={`text-xl transition-all group-hover:scale-110 ${pillar.color}`}>
                            {pillar.symbol}
                        </span>
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    </button>
                ))}
            </div>

            {/* CONTROLS */}
            <div className="px-6 pb-6 flex gap-3">
                <button
                    onClick={clearSequence}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:bg-red-400/10 hover:border-red-500/30 transition-all uppercase text-[10px] font-bold tracking-widest"
                >
                    <Eraser size={12} />
                    Reset
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/60 uppercase text-[10px] font-bold tracking-widest">
                    <Globe size={12} />
                    Registry
                </div>
            </div>
        </motion.div>
    );
};
