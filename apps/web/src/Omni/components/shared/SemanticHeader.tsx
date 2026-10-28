import React from 'react';
import { ArrowRight, Box, Hash } from 'lucide-react';

interface SemanticHeaderProps {
    vector: string;      // e.g., "self"
    relation: string;    // e.g., "identity" or "subjectOf"
    target: string;      // e.g., "self" or "thought"
    description?: string; // Optional context
    className?: string;
}

export const SemanticHeader: React.FC<SemanticHeaderProps> = ({
    vector,
    relation,
    target,
    description,
    className = ""
}) => {
    return (
        <div className={`w-full flex items-end justify-between border-b border-indigo-500/30 pb-2 mb-6 ${className}`}>

            {/* LEFT: THE SEMANTIC ADDRESS */}
            <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400/60 mb-1">
                    <Hash size={10} />
                    <span>MyOntology Node Address</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xl md:text-2xl text-white">
                    <span className="font-bold text-indigo-400">{vector}</span>
                    <span className="text-slate-600">.</span>
                    <span className="text-emerald-400">{relation}</span>
                    <span className="text-slate-600">.</span>
                    <span className="font-bold text-cyan-400">{target}</span>
                </div>
            </div>

            {/* RIGHT: VISUAL CONTEXT */}
            <div className="hidden md:flex items-center gap-4 opacity-50">
                {description && (
                    <div className="text-xs font-sans text-right text-slate-400 max-w-[200px] border-r border-slate-700 pr-4 mr-2">
                        {description}
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                    <Box size={14} className="text-indigo-500" />
                    <ArrowRight size={12} />
                    <div className="w-16 h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-cyan-500 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};
