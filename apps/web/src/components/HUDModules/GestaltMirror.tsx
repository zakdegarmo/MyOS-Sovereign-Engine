import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Shield, Zap, 
  Wind, Droplets, Flame, 
  Mountain, Sun, 
  Fingerprint, Sparkles, X
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

export const GestaltMirror: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { tutorPersona } = useCouncil();
  const userName = tutorPersona?.name || "User_0";
  
  // High-fidelity profile mirroring
  const profile = {
    name: userName,
    axiom: "0=1",
    essence: "Omnipresence",
    pillars: [
      { name: "Self", symbol: <Fingerprint />, resonance: 100, color: "text-white" },
      { name: "Thought", symbol: <Sun />, resonance: 92, color: "text-sky-400" },
      { name: "Logic", symbol: <Shield />, resonance: 92, color: "text-slate-400" },
      { name: "Unity", symbol: <Zap />, resonance: 74, color: "text-teal-400" },
      { name: "Existence", symbol: <Mountain />, resonance: 100, color: "text-indigo-400" },
      { name: "Improvement", symbol: <Flame />, resonance: 88, color: "text-amber-500" },
      { name: "Mastery", symbol: <User />, resonance: 95, color: "text-purple-400" },
      { name: "Resonance", symbol: <Droplets />, resonance: 70, color: "text-pink-400" },
      { name: "Transcendence", symbol: <Wind />, resonance: 42, color: "text-amber-400" },
      { name: "Omni", symbol: <Sparkles />, resonance: 100, color: "text-cyan-400" }
    ]
  };

  return (
    <motion.div 
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
      className="w-[900px] h-[650px] flex gap-8 p-12 bg-white/5 border-2 border-white/10 rounded-[4rem] shadow-[0_0_150px_rgba(255,255,255,0.05)] text-white relative overflow-hidden"
    >
      {/* Background Fractal Glow */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-500/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse" />

      {/* Profile Left: The Reflection */}
      <div className="flex-1 flex flex-col items-center justify-center relative space-y-10">
        <div className="w-56 h-56 rounded-full border-2 border-white/20 p-3 relative">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500/40 to-blue-600/40 backdrop-blur-sm flex items-center justify-center overflow-hidden">
             <User size={100} className="text-white opacity-40" />
             <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] z-10"
             />
          </div>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-6 border-2 border-dashed border-white/5 rounded-full"
          />
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
             {profile.name}
          </h1>
          <div className="inline-block px-4 py-1.5 bg-cyan-500/20 border border-cyan-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400">
             Essence: {profile.essence}
          </div>
        </div>

        <div className="w-full max-w-sm space-y-5">
           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
             <span>Axiom Awareness</span>
             <span className="text-cyan-400">{profile.axiom} (Mastered)</span>
           </div>
           <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: "100%" }}
               transition={{ duration: 2 }}
               className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]"
             />
           </div>
        </div>
      </div>

      {/* Pillars Right: The Resonance */}
      <div className="w-[450px] flex flex-col justify-between py-2">
        <div className="space-y-8">
          <div className="flex justify-between items-center pr-2">
            <h2 className="text-xs font-black uppercase tracking-[0.5em] text-white/30">Pillar_Resonance</h2>
            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all group border border-white/5">
              <X size={24} className="text-white/20 group-hover:text-white" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 pr-4 overflow-y-auto max-h-[400px] custom-scrollbar">
            {profile.pillars.map((pillar, idx) => (
              <motion.div 
                key={pillar.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 transition-all cursor-pointer group flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <div className={`p-2.5 bg-white/5 rounded-2xl border border-white/10 group-hover:border-white/20 transition-all ${pillar.color}`}>
                    {pillar.symbol}
                  </div>
                  <span className={`text-[10px] font-black ${pillar.color}`}>{pillar.resonance}%</span>
                </div>
                <div className="space-y-1">
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{pillar.name}</span>
                   <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${pillar.resonance}%` }}
                       className={`h-full bg-current ${pillar.color.replace('text', 'bg')}`}
                      />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-cyan-500/10 border border-cyan-400/20 rounded-[3rem] mt-6">
          <p className="text-[11px] italic leading-relaxed text-cyan-200/60 font-medium">
            "You are the zero that realizes the one. The TheAll body is 10 Pillars wide, but your Self remains the single point of observation."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Sparkles size={16} className="text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Tutor Verified // Gen-0</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
