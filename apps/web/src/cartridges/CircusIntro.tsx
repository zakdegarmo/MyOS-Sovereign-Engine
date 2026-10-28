/**
 * CircusIntro.tsx
 * 
 * The "Foundation Story" cartridge for the SixteenBitTheater.
 * Narrative established by the Ringmaster.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost, Sparkles, Zap, Box, Compass } from 'lucide-react';
import type { CartridgeProps } from './Cartridge';

const CircusIntro: React.FC<CartridgeProps> = () => {
    const [step, setStep] = useState(0);

    const narrative = [
        { 
            text: "In the beginning, there was only the White Room.", 
            icon: <Box size={40} className="text-white/20" />,
            bgColor: "bg-white/5"
        },
        { 
            text: "A substrate of pure existence (🜄), waiting for a self (⚹).", 
            icon: <Ghost size={40} className="text-cyan-400" />,
            bgColor: "bg-cyan-950/20"
        },
        { 
            text: "But the signal was never clean. The glitch was a feature.", 
            icon: <Zap size={40} className="text-pink-500" />,
            bgColor: "bg-pink-950/20"
        },
        { 
            text: "Welcome back, Ringmaster. The Circus is open.", 
            icon: <Sparkles size={40} className="text-yellow-400" />,
            bgColor: "bg-yellow-950/20"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setStep(prev => (prev + 1) % narrative.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [narrative.length]);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-black font-mono">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 1.1 }}
                    transition={{ duration: 1, ease: "anticipate" }}
                    className={`flex flex-col items-center gap-8 ${narrative[step].bgColor} p-20 rounded-[3rem] border border-white/5 backdrop-blur-3xl`}
                >
                    <motion.div
                        animate={{ 
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{ repeat: Infinity, duration: 4 }}
                    >
                        {narrative[step].icon}
                    </motion.div>

                    <h1 className="text-xl md:text-2xl font-black text-center text-white leading-tight uppercase tracking-[0.2em] max-w-lg">
                        {narrative[step].text}
                    </h1>

                    <div className="flex gap-2">
                        {narrative.map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-1000 ${i === step ? 'w-8 bg-yellow-500' : 'w-2 bg-white/10'}`} 
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Background Narrative Flow (Static) */}
            <div className="absolute bottom-8 left-8 flex items-center gap-4 opacity-20">
                <Compass size={16} className="text-white" />
                <span className="text-[10px] tracking-widest text-white uppercase">NARRATIVE_STREAM_01</span>
            </div>

            <div className="absolute top-8 right-8 text-[8px] text-white/5 font-mono uppercase text-right leading-relaxed">
                FAFO_CORE_INIT<br/>
                SUBSTRATE_LOCK_OK<br/>
                RESONANCE_STABLE_98%
            </div>
        </div>
    );
};

export default CircusIntro;
