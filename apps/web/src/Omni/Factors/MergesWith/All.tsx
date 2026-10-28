import { motion } from 'framer-motion';

const ALCHEMICAL_STAGES = [
  { index: 0, name: 'Nigredo', symbol: '🜔', desc: 'Dissolution / Shadow / Black Work' },
  { index: 1, name: 'Albedo', symbol: '🜊', desc: 'Purification / Light / White Work' },
  { index: 2, name: 'Rubedo', symbol: '🜫', desc: 'Coagulation / Unity / Red Work' },
  { index: 3, name: 'Citrinitas', symbol: '🜚', desc: 'Transmutation / Gold / Yellow Work' },
  { index: 4, name: 'Sublimatio', symbol: '🜄', desc: 'Elevation / Vapor / Sublimation' },
  { index: 5, name: 'Calcinatio', symbol: '🜂', desc: 'Reduction / Fire / Calcination' },
  { index: 6, name: 'Solutio', symbol: '🜄', desc: 'Immersion / Water / Dissolution' },
  { index: 7, name: 'Coagulatio', symbol: '🜃', desc: 'Manifestation / Earth / Coagulation' },
  { index: 8, name: 'Separatio', symbol: '🜁', desc: 'Distinction / Air / Separation' },
  { index: 9, name: 'Conjunctio', symbol: '🜍', desc: 'Union / Paradox / Great Work' },
];

export const All = ({ currentAddress = "0.0.0.0.0" }: { currentAddress?: string }) => {
  return (
    <div className="p-8 flex flex-col h-full text-slate-400 bg-slate-950/80 backdrop-blur-xl border border-white/5 rounded-3xl m-4 overflow-hidden shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5 pointer-events-none" />
      
      <div className="mb-6 z-10">
        <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase flex items-center gap-3">
          <span className="text-amber-500">🜔</span> Alchemical Mirror
        </h2>
        <p className="font-mono text-[10px] opacity-40 uppercase tracking-[0.2em] mt-1">
          Sandboxed Symbolic Metadata &gt; Nexus Path: {currentAddress}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 flex-1 overflow-y-auto z-10 p-1">
        {ALCHEMICAL_STAGES.map((stage) => (
          <motion.div
            key={stage.index}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="flex flex-col items-center justify-center p-4 border border-white/5 bg-black/40 rounded-2xl group transition-all"
          >
            <span className="text-3xl text-white/20 group-hover:text-amber-500 transition-colors duration-500 mb-2">
              {stage.symbol}
            </span>
            <span className="text-[10px] font-mono font-bold text-white opacity-40 group-hover:opacity-100 uppercase tracking-tighter">
              {stage.name}
            </span>
            <span className="text-[8px] opacity-20 group-hover:opacity-40 mt-1 text-center leading-none">
              {stage.desc}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-mono opacity-30 uppercase tracking-[0.2em]">Dimension Door Portal Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 opacity-80 uppercase font-mono">Bridge Active</span>
          </div>
        </div>
        
        <div className="text-[9px] font-mono opacity-20 text-right uppercase">
          Russian Doll Sandbox v1.0 <br />
          Core Genome Safety: UNTAMPERED
        </div>
      </div>
    </div>
  );
};
