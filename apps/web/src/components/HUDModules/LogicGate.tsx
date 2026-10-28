import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, X,
  ChevronRight,
  Binary
} from 'lucide-react';

import { useCouncil } from '../../council/CouncilContext';

export const LogicGate: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { agentMessages } = useCouncil();
  const [logs, setLogs] = useState<string[]>([
    "[KERNEL] Initializing Logic Substrate...",
    "[AXIOM] 0=1 Validation: SUCCESS",
    "[PILLAR_2] Logic Gate: STANDBY",
    "[SUBSYSTEM] Aetherial Link: ACTIVE",
  ]);

  // Real-time Council Logging
  useEffect(() => {
    const latest = Object.values(agentMessages || {})
      .filter(m => m && m.timestamp)
      .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))[0];
    if (latest) {
      setLogs(prev => [...prev.slice(-40), `[AGENT] ${latest.text}`]);
    }
  }, [agentMessages]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCommand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      const cmd = input.toUpperCase();
      setLogs(prev => [...prev, `> ${cmd}`, `[LOGIC] Executing ${cmd}...`, `[RESULT] Command localized in Aether.`]);
      setInput('');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-[650px] h-[500px] bg-black border-4 border-amber-900/40 rounded-sm shadow-[0_0_40px_rgba(120,53,15,0.2)] flex flex-col font-mono text-amber-500 overflow-hidden"
    >
      {/* Terminal Title Bar */}
      <div className="bg-amber-950/20 px-6 py-3 border-b-2 border-amber-900/30 flex justify-between items-center bg-gradient-to-r from-amber-950/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="bg-slate-400/20 p-2 rounded-lg">
            <Terminal className="text-slate-300" size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-100">Observation Module 5.2.1</h2>
            <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter italic">Pillar 3: Logic / Node-Aware Manifestation</p>
          </div>
        </div>
        <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-900/50 animate-pulse" />
            <button onClick={onClose} className="hover:text-white transition-colors">
              <X size={16} />
            </button>
        </div>
      </div>

      {/* Logic Scarf / Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-8 overflow-y-auto space-y-2 relative bg-[linear-gradient(rgba(120,53,15,0.05)_50%,transparent_50%)] bg-[length:100%_4px]"
      >
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-[11px] font-bold ${log.startsWith('>') ? 'text-white' : 'text-amber-500/80'}`}
          >
            {log}
          </motion.div>
        ))}
      </div>

      {/* Input Line */}
      <div className="p-6 bg-amber-950/10 border-t-2 border-amber-900/20 flex items-center gap-4">
        <ChevronRight size={18} className="text-amber-600" />
        <input 
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleCommand}
          placeholder="ENTER_LOGIC_COMMAND..."
          className="flex-1 bg-transparent border-none outline-none text-xs font-black placeholder:text-amber-950"
          autoFocus
          onPointerDown={e => e.stopPropagation()}
        />
        <div className="flex items-center gap-3">
          <Binary size={14} className="opacity-20" />
          <span className="text-[9px] font-black opacity-20">SYSTEM: STABLE</span>
        </div>
      </div>

      {/* Footer / Asset Tray */}
      <div className="px-8 py-2 bg-amber-900/10 flex justify-between items-center text-[8px] font-black tracking-tighter opacity-40">
        <span>LOGIC_SYNC: 100%</span>
        <span>RECURSION_DEPTH: 8_LAYERS</span>
        <span>PILLAR_ID: 🜖</span>
      </div>
    </motion.div>
  );
};
