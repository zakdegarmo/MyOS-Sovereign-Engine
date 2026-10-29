import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Maximize2, Minimize2, X, 
  ExternalLink, RefreshCw, 
  ShieldAlert, Activity
} from 'lucide-react';

interface GenesisBridgeProps {
  onClose: () => void;
  title?: string;
  pillar?: string;
}

export const GenesisBridge: React.FC<GenesisBridgeProps> = ({ 
  onClose, 
  title = "GENESIS ENGINE",
  pillar = "REAL_LOGIC"
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Port 3001 is the active Genesis workspace running 'npm run dev'
  const GENESIS_URL = "http://localhost:3001";

  const handleRefresh = () => {
    setIsRefreshing(true);
    const iframe = document.getElementById('genesis-iframe') as HTMLIFrameElement;
    if (iframe) iframe.src = iframe.src;
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`bg-slate-950 border-4 border-slate-700/50 rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col font-mono transition-all duration-500 ease-in-out ${
        isMaximized ? 'fixed inset-4 z-[9999]' : 'w-[1000px] h-[750px]'
      }`}
    >
      {/* OS TITLE BAR */}
      <div className="h-14 bg-slate-900 border-b-2 border-slate-800 flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 item-center">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="h-4 w-[2px] bg-white/10 mx-2" />
          <div className="flex items-center gap-3">
             <Activity size={14} className="text-cyan-400 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90">{title}</span>
             <span className="text-[9px] font-bold text-white/20 px-2 py-0.5 bg-white/5 rounded">PILLAR::{pillar}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            className={`p-2 hover:bg-white/10 rounded-lg transition-all ${isRefreshing ? 'animate-spin text-cyan-400' : 'text-white/40'}`}
          >
            <RefreshCw size={16} />
          </button>
          
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 hover:bg-white/10 rounded-lg text-white/40 active:scale-95 transition-all"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          <div className="h-4 w-[2px] bg-white/10" />
          
          <button onClick={onClose} className="p-2 hover:bg-rose-500/20 text-rose-500/60 hover:text-rose-400 transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* THE EMBED: ACTUAL LOGIC CORE */}
      <div className="flex-1 bg-black relative">
        <iframe 
          id="genesis-iframe"
          src={GENESIS_URL}
          className="w-full h-full border-none opacity-90 hover:opacity-100 transition-opacity duration-500"
          title="Genesis Real Logic Engine"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
        
        {/* Connection Status Overlay (Optional subtle visual feedback) */}
        <div className="absolute top-4 right-4 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Link: Stable (3001)</span>
            </div>
        </div>
      </div>

      {/* FOOTER METADATA */}
      <div className="h-10 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 text-[8px] font-black uppercase text-white/20 tracking-widest">
           <span>Substrate: Genesis-Test</span>
           <span>Latency: 1ms</span>
           <span>Mode: Direct Logic Access</span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-bold text-cyan-400/40 italic">
           <ShieldAlert size={10} />
           "Bypassing Placeholder Layers. Accessing Real Code."
        </div>
      </div>
    </motion.div>
  );
};
