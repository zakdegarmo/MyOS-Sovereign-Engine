import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, Trophy, Star, 
  Crown, ChevronRight, X,
  Activity, BarChart3, PieChart,
  Zap, ShieldCheck
} from 'lucide-react';

export const MasteryConsolidator: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const pillars = [
    { name: 'Self', level: 85, color: 'bg-indigo-500' },
    { name: 'Thought', level: 92, color: 'bg-sky-500' },
    { name: 'Logic', level: 78, color: 'bg-slate-500' },
    { name: 'Unity', level: 64, color: 'bg-teal-500' },
    { name: 'Existence', level: 100, color: 'bg-indigo-600' },
    { name: 'Improvement', level: 88, color: 'bg-amber-500' },
    { name: 'Resonance', level: 70, color: 'bg-pink-500' },
    { name: 'Transcendence', level: 42, color: 'bg-amber-400' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, rotateX: -20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      className="w-[800px] h-[600px] bg-purple-950/20 backdrop-blur-3xl border-4 border-purple-500/30 rounded-[4rem] p-12 font-sans text-purple-100 flex flex-col gap-10 shadow-[0_0_150px_rgba(168,85,247,0.1)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-500/20 to-amber-500/20 p-8 rounded-[3rem] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="bg-amber-400 p-4 rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.3)]">
            <Crown className="text-purple-950" size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-[0.5em] text-white">Mastery Consolidator</h2>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em]">Pillar 7: 🜇 Total Domain Control</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 gap-10 overflow-hidden">
        {/* Progress Grid */}
        <div className="bg-black/40 rounded-[3rem] border border-white/10 p-8 space-y-6 overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-xs font-black uppercase tracking-widest opacity-40">Pillar Synchronization</span>
              <Activity size={16} className="text-purple-400" />
           </div>
           
           <div className="space-y-6">
             {pillars.map(pillar => (
               <div key={pillar.name} className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span>{pillar.name}</span>
                   <span className="text-amber-400">{pillar.level}%</span>
                 </div>
                 <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden border border-white/5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${pillar.level}%` }}
                     className={`h-full ${pillar.color} shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
                   />
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* System Stats */}
        <div className="space-y-8 flex flex-col">
            <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/10 p-8 flex flex-col items-center justify-center text-center gap-6 group hover:bg-white/10 transition-all cursor-pointer">
                <div className="relative">
                   <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                   <Trophy size={64} className="text-amber-400 relative z-10" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black uppercase tracking-tighter">Domain Overlord</h3>
                   <p className="text-[10px] opacity-40 leading-relaxed font-medium">All systems have achieved <br/>primary resonance thresholds.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-purple-500/10 p-6 rounded-[2.5rem] border border-purple-500/20 text-center space-y-1">
                    <span className="text-2xl font-black text-white">1.2M</span>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Nodes Indexed</p>
                </div>
                <div className="bg-amber-500/10 p-6 rounded-[2.5rem] border border-amber-500/20 text-center space-y-1">
                    <span className="text-2xl font-black text-white">O(1)</span>
                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Access Latency</p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.5em] opacity-40 border-t border-white/10 pt-8">
        <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-amber-400" />
            Vesting Protocol: Absolute
        </div>
        <span>Axiom 7: "mastery.actualize"</span>
      </div>
    </motion.div>
  );
};
