import React from 'react';
import SynergeticGraph from '@Existence/viz/CosmicGraph/SynergeticGraph';
import { GaiaTelemetry } from '../../../components/World/GaiaTelemetry';

interface IsTheGroundOfProps {
  onNodeClick?: (node: any) => void;
}

export const All: React.FC<IsTheGroundOfProps> = ({ onNodeClick }) => {
  return (
    <div className="w-full h-[600px] min-h-[600px] relative overflow-hidden bg-slate-950/50 rounded-2xl border border-white/5 mx-auto max-w-5xl my-4">
      {/* TELEMETRY BRIDGE */}
      <div className="absolute top-4 right-4 z-20">
        <GaiaTelemetry className="w-48 shadow-2xl ring-1 ring-white/5" />
      </div>

      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-lg font-display text-cyan-400">Is the Ground Of Grid</h2>
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Resonance -&gt; Omni</p>
      </div>
      <SynergeticGraph onNodeClick={onNodeClick} />
    </div>
  );
};
