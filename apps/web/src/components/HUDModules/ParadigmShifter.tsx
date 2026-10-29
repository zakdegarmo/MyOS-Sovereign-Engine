import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Wind, Sparkles, 
  Orbit, Gem, X, 
  RotateCw, Terminal,
  ShieldAlert, Activity
} from 'lucide-react';

export const ParadigmShifter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [overclock, setOverclock] = useState(0);
  const [isTranscending, setIsTranscending] = useState(false);

  useEffect(() => {
    if (isTranscending && overclock < 100) {
      const timer = setTimeout(() => setOverclock(prev => Math.min(prev + 1, 100)), 50);
      return () => clearTimeout(timer);
    }
  }, [isTranscending, overclock]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.2, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      className={`w-[650px] h-[500px] bg-amber-950/20 backdrop-blur-3xl border-4 border-amber-400/30 rounded-[4rem] p-12 font-sans text-amber-100 flex flex-col gap-8 shadow-[0_0_120px_rgba(251,191,36,0.1)] overflow-hidden transition-all duration-1000 ${
        isTranscending ? 'shadow-[0_0_200px_rgba(251,191,36,0.3)] border-amber-400' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-amber-400/10 p-6 rounded-[2.5rem] border border-amber-400/20">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-full transition-all duration-700 ${isTranscending ? 'bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)] scale-110' : 'bg-amber-400/20 shadow-inner'}`}>
            <Orbit className={`${isTranscending ? 'text-amber-950 animate-spin' : 'text-amber-400 animate-pulse'}`} size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-amber-300">Paradigm Shifter</h2>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">Pillar 9: 🜍 Transcendence</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-amber-400/10 hover:bg-amber-400/30 p-2 rounded-2xl transition-all">
          <X size={20} />
        </button>
      </div>

      {/* Overclock Gauge */}
      <div className="flex-1 flex flex-col justify-center items-center gap-10">
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle 
                    cx="96" cy="96" r="88" 
                    fill="transparent" 
                    stroke="rgba(251,191,36,0.1)" 
                    strokeWidth="8" 
                />
                <motion.circle 
                    cx="96" cy="96" r="88" 
                    fill="transparent" 
                    stroke="rgba(251,191,36,0.6)" 
                    strokeWidth="8" 
                    strokeDasharray={552}
                    animate={{ strokeDashoffset: 552 - (552 * overclock / 100) }}
                    className="shadow-[0_0_20px_rgba(251,191,36,0.5)]"
                />
            </svg>
            <div className="text-center space-y-1">
                <span className="text-5xl font-black tracking-tighter text-amber-400">{overclock}%</span>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Sync State</p>
            </div>
        </div>

        <button 
           onMouseDown={() => setIsTranscending(true)}
           onMouseUp={() => setIsTranscending(false)}
           onMouseLeave={() => setIsTranscending(false)}
           className={`px-12 py-5 rounded-full border-2 text-xs font-black uppercase tracking-[0.5em] transition-all duration-500 overflow-hidden relative group ${
            isTranscending 
            ? 'bg-amber-400 border-amber-400 text-amber-950 scale-95 shadow-[0_0_50px_rgba(251,191,36,0.6)]' 
            : 'bg-transparent border-amber-400/30 text-amber-400 hover:border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.1)]'
           }`}
        >
          <span className="relative z-10">{isTranscending ? 'Transcending...' : 'Initiate Shift'}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/50 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </button>
      </div>

      {/* Meta Labels */}
      <div className="grid grid-cols-2 gap-6 opacity-40">
         <div className="bg-amber-400/5 p-4 rounded-3xl border border-amber-400/10 flex items-center gap-4">
            <ShieldAlert size={16} />
            <span className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">Warning: Paradigm Shift may cause localized temporal distortions.</span>
         </div>
         <div className="bg-amber-400/5 p-4 rounded-3xl border border-amber-400/10 flex items-center gap-4">
            <RotateCw size={16} />
            <span className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">Limit Break: Cognitive Engine set to Infinite Recursion.</span>
         </div>
      </div>
    </motion.div>
  );
};
