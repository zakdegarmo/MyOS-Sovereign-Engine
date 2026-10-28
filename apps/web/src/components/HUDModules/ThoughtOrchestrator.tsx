import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Lightbulb, Sparkles, 
  Cpu, Zap, X, 
  ChevronRight, ArrowRight,
  Minimize2, Maximize2
} from 'lucide-react';

export const ThoughtOrchestrator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeIdea, setActiveIdea] = useState<string | null>(null);

  const possibilities = [
    { id: 'sim-1', label: 'Paradigm Shift: 0=1', desc: 'Recalculating absolute potential across all nodes.' },
    { id: 'sim-2', label: 'Semantic Extraction', desc: 'Mining the aether for high-fidelity protein strands.' },
    { id: 'sim-3', label: 'Neural Harmony', desc: 'Syncing all Council agents to a single resonance field.' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      className="w-[600px] h-[450px] bg-sky-950/20 backdrop-blur-3xl border-4 border-sky-400/30 rounded-[3rem] p-10 font-sans text-sky-100 flex flex-col gap-6 shadow-[0_0_100px_rgba(56,189,248,0.1)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center group">
        <div className="flex items-center gap-4">
          <div className="bg-sky-400/20 p-4 rounded-full shadow-[0_0_20px_rgba(56,189,248,0.2)] group-hover:scale-110 transition-transform cursor-pointer">
            <Brain className="text-sky-300 animate-pulse" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.3em] text-sky-300">Thought Orchestrator</h2>
            <div className="flex gap-2 items-center opacity-40">
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Pillar 2: ☿ Cognition</span>
                <div className="w-1 h-1 rounded-full bg-sky-400" />
                <span className="text-[8px] font-bold uppercase tracking-[0.2em]">Liquid Substrate</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="hover:text-white transition-colors bg-white/5 p-2 rounded-2xl">
          <X size={20} />
        </button>
      </div>

      {/* Possibility Space */}
      <div className="flex-1 grid grid-cols-1 gap-4 py-4">
        {possibilities.map((pos, i) => (
          <motion.div 
            key={pos.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setActiveIdea(pos.id)}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer group flex items-center justify-between ${
                activeIdea === pos.id 
                ? 'bg-sky-400/20 border-sky-400/50 shadow-[0_0_30px_rgba(56,189,248,0.2)] scale-[1.02]' 
                : 'bg-white/5 border-white/10 hover:border-sky-400/30'
            }`}
          >
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Zap size={10} className="text-sky-400" /> {pos.label}
              </h3>
              <p className="text-[10px] opacity-40 font-medium group-hover:opacity-100 transition-opacity">{pos.desc}</p>
            </div>
            <ArrowRight size={16} className={`transition-all ${activeIdea === pos.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} />
          </motion.div>
        ))}
      </div>

      {/* Footer Meta */}
      <div className="bg-sky-400/10 p-4 rounded-3xl flex justify-between items-center border border-sky-400/10">
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-sky-400">
             <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
             Simulation Active
          </div>
        </div>
        <div className="text-[9px] font-bold opacity-30 italic">
            "Thought is a bridge between the Void and the Form."
        </div>
      </div>
    </motion.div>
  );
};
