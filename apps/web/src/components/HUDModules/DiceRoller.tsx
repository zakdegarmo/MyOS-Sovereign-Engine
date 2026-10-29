import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type DiceTier = 10 | 100 | 1000;

interface DiceRollerProps {
    tier: DiceTier;
    targetDC: number;
    label?: string;
    onComplete: (result: number, success: boolean, differential: number) => void;
    onClose: () => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ 
    tier, 
    targetDC, 
    label = "Ontological Check", 
    onComplete,
    onClose 
}) => {
    const [isRolling, setIsRolling] = useState(true);
    const [result, setResult] = useState<number | null>(null);
    const [displayValue, setDisplayValue] = useState(0);

    const roll = useCallback(() => {
        setIsRolling(true);
        setResult(null);

        // Simulated rolling animation duration
        const duration = 1500;
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            
            if (elapsed < duration) {
                setDisplayValue(Math.floor(Math.random() * tier) + 1);
                requestAnimationFrame(animate);
            } else {
                const finalResult = Math.floor(Math.random() * tier) + 1;
                const success = finalResult >= targetDC;
                const differential = finalResult - targetDC;
                
                setResult(finalResult);
                setDisplayValue(finalResult);
                setIsRolling(false);
                
                // Delay completion callback for visual impact
                setTimeout(() => {
                    onComplete(finalResult, success, differential);
                }, 1000);
            }
        };

        animate();
    }, [tier, targetDC, onComplete]);

    useEffect(() => {
        roll();
    }, []); // Auto-roll on mount for dramatic effect

    const getSuccessColor = () => {
        if (result === null) return 'text-white';
        return result >= targetDC ? 'text-emerald-400' : 'text-rose-400';
    };

    const diff = result !== null ? result - targetDC : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto"
        >
            <div className="w-[400px] bg-slate-950 border border-white/10 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                {/* AMBIENT GLOW */}
                <div className={`absolute -inset-20 opacity-20 blur-[100px] pointer-events-none transition-colors duration-500
                    ${isRolling ? 'bg-cyan-500' : (result! >= targetDC ? 'bg-emerald-500' : 'bg-rose-500')}
                `} />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="space-y-1 text-center">
                        <h3 className="text-[10px] font-bold text-cyan-400/60 tracking-[0.4em] uppercase">{label}</h3>
                        <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Tier: {tier === 1000 ? 'Ω_EPIC' : (tier === 100 ? 'Σ_STANDARD' : 'Δ_BASIC')}</p>
                    </div>

                    {/* DICE ORB */}
                    <motion.div
                        animate={isRolling ? { 
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, -5, 0],
                        } : { scale: 1 }}
                        transition={{ repeat: Infinity, duration: 0.2 }}
                        className={`w-48 h-48 rounded-full border-2 flex flex-col items-center justify-center gap-2 backdrop-blur-xl shadow-2xl transition-colors duration-500
                            ${isRolling ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_50px_rgba(6,182,212,0.2)]' : 
                              (result! >= targetDC ? 'border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.2)]' : 
                                                 'border-rose-500/50 bg-rose-500/5 shadow-[0_0_50px_rgba(244,63,94,0.2)]')}
                        `}
                    >
                        <span className={`text-6xl font-bold tracking-tighter font-mono ${getSuccessColor()}`}>
                            {displayValue}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-white/30 tracking-widest uppercase">
                            <Target size={12} />
                            DC: {targetDC}
                        </div>
                    </motion.div>

                    {/* RESULT CARD */}
                    <AnimatePresence>
                        {!isRolling && result !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full space-y-4"
                            >
                                <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 transition-colors
                                    ${result >= targetDC ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}
                                `}>
                                    {result >= targetDC ? (
                                        <CheckCircle2 className="text-emerald-400" size={24} />
                                    ) : (
                                        <AlertTriangle className="text-rose-400" size={24} />
                                    )}
                                    <div className="flex flex-col">
                                        <span className={`text-sm font-bold uppercase tracking-widest ${getSuccessColor()}`}>
                                            {result >= targetDC ? 'Success Confirmed' : 'Check Failed'}
                                        </span>
                                        <span className="text-[10px] text-white/30 font-mono tracking-widest italic">
                                            {diff === 0 ? 'Exact Match' : `${diff > 0 ? 'Exceeded' : 'Missed'} by ${Math.abs(diff)} pts`}
                                        </span>
                                    </div>
                                </div>

                                <button 
                                    onClick={onClose}
                                    className="w-full py-4 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Acknowledge
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isRolling && (
                        <div className="flex items-center gap-2 text-cyan-400 font-mono text-[9px] animate-pulse uppercase tracking-[0.3em]">
                            <Zap size={12} />
                            Calculating Ontological Variance...
                        </div>
                    )}
                </div>

                {/* SCANLINES */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
            </div>
        </motion.div>
    );
};
