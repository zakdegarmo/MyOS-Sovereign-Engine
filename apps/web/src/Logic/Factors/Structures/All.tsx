import React from 'react';
import { TabletopSimulator } from '../../Simulation/TabletopSimulator';

export const All = () => {
  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header Info */}
      <div className="px-6 py-4 bg-slate-900/50 border-b border-white/5 shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-display text-white tracking-tight">Agentic Sandbox</h2>
          <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Logic / Simulation / Structures</p>
        </div>
        <div className="px-3 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-[10px] font-mono text-cyan-400 font-bold">MODE: DEDUCTIVE_BATTLE</span>
        </div>
      </div>

      {/* Simulator Viewport */}
      <div className="flex-1 min-h-[500px] relative">
        <TabletopSimulator />
      </div>

      {/* Footer / Instructions */}
      <div className="p-4 bg-slate-900/50 border-t border-white/5 shrink-0 text-center">
        <p className="text-[10px] text-white/30 font-mono tracking-widest uppercase">
          Simulating Game State via Ollama [Mistral] // Agentic Conflict Resolution System
        </p>
      </div>
    </div>
  );
};
