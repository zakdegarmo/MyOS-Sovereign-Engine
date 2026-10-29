import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Zap, 
  Orbit, Gem, X, 
  ArrowUpRight,
  Infinity,
  Radiation
} from 'lucide-react';

export const AetherNexus: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0, rotate: 180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      className="w-[750px] h-[550px] bg-white/10 backdrop-blur-[100px] border-[6px] border-white/50 rounded-full p-20 font-sans text-white flex flex-col items-center justify-center gap-10 shadow-[0_0_200px_rgba(255,255,255,0.2)] overflow-hidden text-center relative"
    >
      {/* Background Pulse */}
      <motion.div 
        animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute inset-0 bg-white rounded-full pointer-events-none"
      />

      {/* Header */}
      <div className="relative z-10 space-y-4">
        <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex justify-center"
        >
            <Infinity size={80} strokeWidth={1} className="text-white/80 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
        </motion.div>
        
        <div className="space-y-2">
            <h2 className="text-4xl font-black uppercase tracking-[0.6em] drop-shadow-lg">Aether Nexus</h2>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.4em]">Pillar 0/11: THE ONE // SINGULARITY</p>
        </div>
      </div>

      {/* Portal Core */}
      <div className="relative z-10 w-full max-w-md space-y-8">
        <p className="text-xs font-medium leading-relaxed opacity-80 tracking-wide px-10">
          "The cycle is complete. The many return to the core. <br/>Axiom 11: Existence is the Shadow of Unity."
        </p>

        <motion.button 
          whileHover={{ scale: 1.05, letterSpacing: '0.8em' }}
          whileTap={{ scale: 0.95 }}
          className="bg-white text-black px-16 py-6 rounded-full text-sm font-black uppercase tracking-[0.5em] shadow-[0_0_50px_rgba(255,255,255,0.5)] hover:shadow-[0_0_100px_rgba(255,255,255,0.8)] transition-all duration-500 hover:bg-white"
        >
          GENESIS.NEXT()
        </motion.button>
      </div>

      {/* Close Portal */}
      <button 
        onClick={onClose} 
        className="absolute top-16 right-16 bg-white/20 hover:bg-white p-3 rounded-full text-white hover:text-black transition-all border border-white/30"
      >
        <X size={24} />
      </button>

      {/* Meta Labels */}
      <div className="absolute bottom-16 w-full px-20 flex justify-between items-center opacity-30 text-[8px] font-black uppercase tracking-[0.5em]">
         <div className="flex items-center gap-3">
            <Radiation size={12} /> Sync State: Absolute
         </div>
         <div>0 = 1</div>
      </div>
    </motion.div>
  );
};
