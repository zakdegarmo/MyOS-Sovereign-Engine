import React, { useMemo } from 'react';
import { FRACTAL_MAP } from '../constants';
import { FileNode } from '../types';
import { Hexagon, Activity, Zap, Box } from 'lucide-react';

interface OntologyHUDProps {
  node: FileNode | null;
}

const OntologyHUD: React.FC<OntologyHUDProps> = ({ node }) => {
  if (!node) return (
    <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-sm border border-slate-800 rounded-lg p-8 bg-slate-900/50">
      <Hexagon className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
      <p>AWAITING_SELECTION</p>
      <p className="text-xs opacity-50 mt-2">Select a node to analyze harmonic resonance.</p>
    </div>
  );

  // Simulate an AI analysis matching the node to the ontology
  const resonance = useMemo(() => {
    // Deterministic pseudo-random based on node name length for demo
    const keys = Object.keys(FRACTAL_MAP);
    const keyIndex = node.name.length % keys.length;
    const majorKey = keys[keyIndex];
    const subKeys = Object.keys(FRACTAL_MAP[majorKey]);
    const subKey = subKeys[node.complexity % subKeys.length];
    const values = FRACTAL_MAP[majorKey][subKey];
    
    return { majorKey, subKey, values };
  }, [node]);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-900/50 rounded-lg p-4 h-full flex flex-col shadow-lg overflow-y-auto">
      <div className="flex items-center space-x-2 mb-4 border-b border-cyan-900/30 pb-2">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-cyan-100 font-mono text-sm tracking-widest">RESONANCE_SCAN</h3>
      </div>

      <div className="mb-6">
        <div className="text-xs text-slate-400 mb-1 font-mono uppercase">Subject</div>
        <div className="text-xl font-bold text-white break-all">{node.name}</div>
        <div className="flex items-center space-x-2 mt-2">
           <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/50">
             CPX: {node.complexity}
           </span>
           <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
             GEO: {node.geometry || 'Sphere'}
           </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-950/50 p-3 rounded border-l-2 border-cyan-500">
            <div className="text-xs text-cyan-500 font-mono mb-1">ONTOLOGY_ROOT</div>
            <div className="text-lg font-bold text-slate-100">{resonance.majorKey}</div>
        </div>

        <div className="bg-slate-950/50 p-3 rounded border-l-2 border-purple-500">
            <div className="text-xs text-purple-500 font-mono mb-1">VECTOR :: {resonance.subKey}</div>
            <div className="flex flex-wrap gap-2 mt-2">
                {resonance.values.slice(0, 6).map((val, idx) => (
                    <span key={idx} className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded shadow-sm border border-slate-700">
                        {val}
                    </span>
                ))}
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-2">
                <span>HARMONIC_ALIGNMENT</span>
                <span>{(node.complexity * 4.2).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div 
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min((node.complexity * 4.2), 100)}%` }}
                ></div>
            </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 text-center">
         <button className="w-full py-2 px-4 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-800 text-cyan-400 text-xs font-mono uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <Zap className="w-3 h-3" />
            Inject Antigravity
         </button>
      </div>
    </div>
  );
};

export default OntologyHUD;
