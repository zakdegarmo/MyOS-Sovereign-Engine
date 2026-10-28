
import React, { useEffect, useRef } from 'react';
import type { ConceptKey } from '@Unity/types';
import { ArrowDown, CircleDot, RotateCcw, Activity } from 'lucide-react';

interface PathStep {
    node: ConceptKey;
    label?: string;
}

interface Props {
    path: PathStep[];
    onClear: () => void;
}

export const PathStream: React.FC<Props> = ({ path, onClear }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when path updates
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [path]);

    if (path.length === 0) return null;

    return (
        <div className="absolute top-0 left-0 h-full z-30 p-4 pointer-events-none flex flex-col justify-center">
            <div className="pointer-events-auto w-64 max-h-[80vh] bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-lg flex flex-col overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.15)] animate-in slide-in-from-left fade-in duration-500">

                {/* Header */}
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-2 text-cyan-400">
                        <Activity size={14} />
                        <span className="text-xs font-mono font-bold tracking-widest">SEMANTIC LOG</span>
                    </div>
                    <button
                        onClick={onClear}
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Reset Path"
                    >
                        <RotateCcw size={14} />
                    </button>
                </div>

                {/* Vertical Scrollable Path Area */}
                <div ref={containerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
                    {path.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center animate-in fade-in slide-in-from-top-2 duration-300">

                            {/* Connector (Vector Label) */}
                            {step.label && (
                                <div className="flex flex-col items-center py-2 gap-1 w-full">
                                    <div className="h-3 w-[1px] bg-gray-700"></div>
                                    <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-mono font-bold text-amber-500 uppercase text-center w-full max-w-[90%] break-words leading-tight">
                                        {step.label}
                                    </div>
                                    <div className="h-3 w-[1px] bg-gray-700"></div>
                                    <ArrowDown size={10} className="text-gray-500" />
                                </div>
                            )}

                            {/* Node Pill */}
                            <div className={`
                w-full text-center px-3 py-2 rounded border text-xs font-bold font-mono transition-all duration-300 relative
                ${idx === path.length - 1
                                    ? 'bg-violet-500/20 border-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}
              `}>
                                {idx === path.length - 1 && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                        <CircleDot size={8} className="animate-pulse text-violet-500" />
                                    </div>
                                )}
                                {step.node}
                            </div>
                        </div>
                    ))}
                    {/* Spacer for bottom padding */}
                    <div className="h-4 shrink-0"></div>
                </div>
            </div>
        </div>
    );
};
