import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, Activity, Zap, 
  Wind, Radio, Waves, 
  Target, Info, X,
  AlertCircle
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

export const VibeScanner: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { tutorPersona } = useCouncil();
  const [frequencies, setFrequencies] = useState<number[]>(Array(24).fill(0).map(() => Math.random() * 50 + 20));
  const [resonance, setResonance] = useState(84.2);

  // Oscillating waveform effect
  useEffect(() => {
    const interval = setInterval(() => {
      setFrequencies(prev => prev.map(f => {
        const delta = Math.random() * 10 - 5;
        return Math.max(10, Math.min(100, f + delta));
      }));
      setResonance(r => Math.min(100, Math.max(0, r + (Math.random() - 0.5) * 2)));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateX: -20 }}
      className="w-[600px] h-96 bg-black/90 border-4 border-green-500/30 rounded-2xl p-8 font-mono text-green-400 overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col gap-6"
    >
      {/* HUD Header */}
      <div className="flex justify-between items-center border-b-2 border-green-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="animate-pulse">
            <Radio size={20} className="text-green-500" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-[0.4em]">Resonance Scanner_v8</h1>
        </div>
        <button onClick={onClose} className="hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Main Analysis Panel */}
      <div className="flex-1 flex gap-8 py-2">
        {/* Radar/Waverform Visual */}
        <div className="flex-1 bg-green-500/5 rounded-xl border border-green-500/20 p-4 relative flex items-end gap-1">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1),transparent)]" />
          {frequencies.map((freq, i) => (
            <motion.div 
              key={i}
              className="flex-1 bg-green-500/40 rounded-t-sm"
              style={{ height: `${freq}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
          {/* Overlay Grid lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-4">
            <div className="border-t border-green-500/50 w-full" />
            <div className="border-t border-green-500/50 w-full" />
            <div className="border-t border-green-500/50 w-full" />
          </div>
        </div>

        {/* Stats Panel */}
        <div className="w-48 space-y-4 py-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-green-500/40">Resonance Sync</p>
            <p className="text-3xl font-black">{resonance.toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-40 uppercase">Harmony</span>
              <span className="font-black text-green-500">STABLE</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-40 uppercase">Axiom Link</span>
              <span className="font-black text-green-500 text-[8px]">OMNI_0=1</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-40 uppercase">Agent Sync</span>
              <span className="font-black text-green-500">{tutorPersona?.id || 'ALPHA'}</span>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-green-500/10">
            <div className="flex items-center gap-2 text-green-500/60 animate-bounce">
              <Zap size={12} />
              <span className="text-[9px] font-black uppercase">Scanning Aether...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-green-500/10 p-3 rounded-lg border border-green-500/10 flex justify-between items-center">
        <div className="flex gap-4">
          <span className="text-[9px] font-black tracking-widest text-green-500/80">FREQ: 440HZ</span>
          <span className="text-[9px] font-black tracking-widest text-green-500/60">NODE: (🜄.🜕)</span>
        </div>
        <div className="text-[8px] font-bold opacity-30 italic">
          "The vibration of existence is the first language."
        </div>
      </div>
    </motion.div>
  );
};
