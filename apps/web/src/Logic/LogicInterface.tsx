import React from 'react';
import { Network, History, ShieldAlert } from 'lucide-react';
import SynergeticGraph from '../Existence/viz/CosmicGraph/SynergeticGraph';

interface RelicLogicGraphProps {
    onNodeClick?: (node: any) => void;
}

/**
 * RELIC_LOGIC_GRAPH
 * Historical Artifact from logic_v1.0.0
 * Archival Designation: [TOMB_S3_ARCHIVE]
 */
export const RelicLogicGraph: React.FC<RelicLogicGraphProps> = ({ onNodeClick }) => {
    return (
        <div className="h-full flex flex-col bg-slate-950/90 backdrop-blur-2xl rounded-3xl border-2 border-amber-900/30 overflow-hidden relative group">
            {/* RELIC OVERLAY HEADER */}
            <div className="p-4 border-b border-amber-900/20 bg-amber-950/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        <History size={16} />
                    </div>
                    <div>
                        <h2 className="text-amber-500/80 font-bold tracking-[0.2em] text-[10px] uppercase">Archeological Archive</h2>
                        <p className="text-[9px] font-mono text-amber-900/60 uppercase">Designation: LOGIC_INTERFACE_V1</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-900/40 text-[9px] font-mono text-amber-500/40">
                    <ShieldAlert size={10} />
                    READ_ONLY_PORTFOLIO
                </div>
            </div>

            {/* THE GRAPH RELIC */}
            <div className="flex-1 relative overflow-hidden saturate-[0.25] group-hover:saturate-100 transition-all duration-1000 grayscale group-hover:grayscale-0">
                <SynergeticGraph onNodeClick={onNodeClick} />
                
                {/* SCANLINE/DUST OVERLAY */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_2px]" />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950 via-transparent to-slate-950 opacity-40" />
            </div>

            {/* CAUTION FOOTER */}
            <div className="px-5 py-2 border-t border-amber-900/20 bg-amber-950/20 flex justify-between items-center text-[8px] text-amber-900/60 font-mono">
                <span>EST: ALPHA_PHASE_01</span>
                <span>"MEMORY IS TRUTH"</span>
            </div>
        </div>
    );
};

export default RelicLogicGraph;
