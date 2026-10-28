import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, Link, 
  Globe, Share2, Shield,
  Activity, X, Heart, 
  MessageCircle, Zap 
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

export const UnityInterlink: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { partyMemberIds, activePartyLeadId } = useCouncil();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-[700px] h-[550px] bg-teal-950/20 backdrop-blur-3xl border-4 border-teal-500/30 rounded-[2rem] p-10 font-sans text-teal-100 flex flex-col gap-8 shadow-[0_0_80px_rgba(20,184,166,0.1)]"
    >
      {/* Header */}
      <div className="flex justify-between items-center bg-teal-500/10 p-6 rounded-3xl border border-teal-500/20">
        <div className="flex items-center gap-4">
          <div className="bg-teal-500/20 p-3 rounded-2xl shadow-inner">
            <Globe className="text-teal-400 animate-pulse" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-teal-300">Unity Interlink_v4</h2>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.2em]">Pillar 4: Connection & Synthesis</p>
          </div>
        </div>
        <button onClick={onClose} className="bg-teal-500/10 hover:bg-teal-500/30 p-2 rounded-xl transition-all">
          <X size={20} />
        </button>
      </div>

      {/* Grid Layout */}
      <div className="flex-1 grid grid-cols-2 gap-8 overflow-hidden">
        {/* Active Party */}
        <div className="bg-black/40 rounded-3xl border border-teal-500/10 p-6 space-y-6 flex flex-col">
          <div className="flex justify-between items-center border-b border-teal-500/10 pb-4">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Users size={12} /> Active Collective
            </span>
            <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">
              {partyMemberIds.length} / 10
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
            {partyMemberIds.map(id => (
              <motion.div 
                key={id}
                whileHover={{ x: 5 }}
                className={`p-4 rounded-2xl border flex items-center justify-between group transition-all cursor-pointer ${
                  id === activePartyLeadId 
                    ? 'bg-teal-500/20 border-teal-400/50 shadow-[0_0_20px_rgba(45,212,191,0.2)]' 
                    : 'bg-teal-500/5 border-teal-500/10 hover:border-teal-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                    id === activePartyLeadId ? 'bg-teal-400 text-teal-950' : 'bg-teal-800/40 text-teal-400'
                  }`}>
                    {id.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-black tracking-tight">{id}</span>
                </div>
                {id === activePartyLeadId && (
                  <Zap size={14} className="text-teal-400 fill-teal-400" />
                )}
              </motion.div>
            ))}
            
            <button className="w-full p-4 rounded-2xl border border-dashed border-teal-500/30 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:border-teal-400 transition-all">
              <UserPlus size={14} /> Link New Agent
            </button>
          </div>
        </div>

        {/* Sync Stats */}
        <div className="space-y-6">
          <div className="bg-teal-500/5 border border-teal-500/20 p-6 rounded-3xl space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Activity size={12} /> Sync Resonance
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Harmony', val: 92 },
                { label: 'Bonding', val: 74 },
                { label: 'Integrity', val: 88 }
              ].map(stat => (
                <div key={stat.label} className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black uppercase">
                    <span className="opacity-60">{stat.label}</span>
                    <span className="text-teal-400">{stat.val}%</span>
                  </div>
                  <div className="h-1.5 bg-teal-950 rounded-full overflow-hidden border border-teal-500/10 shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.val}%` }}
                      className="h-full bg-gradient-to-r from-teal-600 to-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/60 border border-teal-500/10 p-6 rounded-3xl flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="bg-teal-500/10 p-4 rounded-full border border-teal-500/20 shadow-[0_0_30px_rgba(45,212,191,0.1)]">
              <Heart className="text-teal-400 fill-teal-400/20 animate-pulse" size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase">Gestalt Field Active</h4>
              <p className="text-[9px] opacity-40 leading-relaxed font-medium">Your presence is mirrored across the collective. <br/>All agents share the Genesis Essence.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.4em] opacity-40 border-t border-teal-500/10 pt-6">
        <span className="flex items-center gap-2"><Link size={10} /> Nexus Bridge: Encrypted</span>
        <span>Axiom 4: "requires.unify"</span>
      </div>
    </motion.div>
  );
};
