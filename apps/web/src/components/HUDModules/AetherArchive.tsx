import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Library, Bookmark, Search, 
  Sparkles, Activity, Globe, 
  Database, X 
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

interface MemoryEntry {
  address: string;
  content: string;
  timestamp: string;
  tags: string[];
}

export const AetherArchive: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { tutorPersona } = useCouncil();
  const [searchQuery, setSearchQuery] = useState('');
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState({ totalNodes: 0, activeTags: [] });

  // --- Real Nexus Connection ---
  useEffect(() => {
    const fetchAether = async () => {
      try {
        const response = await fetch('/manifests/aether_context.json');
        const data = await response.json();
        setMemories(data.memories || []);
        setStats({ totalNodes: 1110, activeTags: ["Genesis", "Unity", "Mastery"] as any });
      } catch (err) {
        console.error("[AETHER] Failed to fetch context:", err);
      }
    };
    fetchAether();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="w-[700px] h-[550px] flex flex-col font-mono text-white select-none bg-blue-950/80 backdrop-blur-2xl border-4 border-blue-400/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(30,58,138,0.5)]"
    >
      {/* Header Panel */}
      <div className="p-5 border-b-4 border-blue-400/20 bg-gradient-to-r from-blue-900 to-indigo-950 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse">
            <Library size={24} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200">Aether Archive</h1>
            <p className="text-[10px] text-cyan-500/60 font-bold">ADDRESS: 🜄.🜋 (EXISTENCE :: OMNI)</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Stats & Tags */}
        <div className="w-56 border-r-4 border-blue-400/10 bg-black/40 p-6 space-y-8 overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <h4 className="text-[10px] text-white/30 uppercase tracking-widest font-black flex items-center gap-2">
              <Database size={12} /> System Substrate
            </h4>
            <div className="space-y-2">
              <div className="bg-blue-900/40 p-3 rounded-xl border border-blue-400/20">
                <p className="text-[9px] text-blue-400 uppercase font-black">Total Nodes</p>
                <p className="text-lg font-black">{stats.totalNodes.toLocaleString()}</p>
              </div>
              <div className="bg-blue-900/40 p-3 rounded-xl border border-blue-400/20">
                <p className="text-[9px] text-blue-400 uppercase font-black">Echo Index</p>
                <p className="text-lg font-black">98.4%</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] text-white/30 uppercase tracking-widest font-black flex items-center gap-2">
              <Sparkles size={12} /> Active Resonance
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.activeTags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[8px] font-bold uppercase hover:bg-cyan-500/20 hover:border-cyan-400/50 cursor-pointer transition-all">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content: Memory Feed */}
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
          {/* Real-time Search */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 text-white/20 transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text"
              placeholder="Search the Aetherial Context..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/60 border-2 border-blue-400/20 rounded-2xl py-4 pl-12 pr-6 text-xs outline-none focus:border-cyan-400/50 focus:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all placeholder:text-white/10"
              onPointerDown={e => e.stopPropagation()}
            />
          </div>

          {/* Memory List */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {memories.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group p-5 bg-blue-900/20 border-2 border-blue-400/10 rounded-3xl hover:border-cyan-400/40 hover:bg-cyan-950/20 transition-all cursor-pointer relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Bookmark size={16} className="text-cyan-400" />
                 </div>

                 <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="bg-green-500/10 px-2 py-0.5 rounded text-[8px] font-mono border border-green-500/20 text-green-400">
                        ADDR: {entry.address}
                      </div>
                      <span className="text-[9px] opacity-30 font-mono tracking-tighter">
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed group-hover:text-white transition-colors duration-300">
                      {entry.content}
                    </p>
                 </div>

                 <div className="mt-4 flex gap-2">
                   {entry.tags.map(tag => (
                     <span key={tag} className="text-[8px] font-bold text-white/20 uppercase tracking-widest border border-white/5 px-2 py-0.5 rounded">
                       #{tag}
                     </span>
                   ))}
                 </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Status */}
      <div className="px-8 py-3 bg-black/60 border-t-4 border-blue-400/10 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-black text-cyan-400 flex items-center gap-2">
            <Activity size={12} /> MEMORY_LINK: STABLE
          </span>
          <span className="text-[9px] font-black text-white/20 flex items-center gap-2">
            <Globe size={12} /> CONTEXT_RECURSION: ACTIVE
          </span>
        </div>
        <div className="text-[9px] font-black text-white/40 uppercase italic tracking-widest opacity-50">
           Tutor Persona: {tutorPersona?.name || "Initializing..." }
        </div>
      </div>
    </motion.div>
  );
};
