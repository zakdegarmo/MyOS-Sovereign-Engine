import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dna, GitBranch, Shield, Zap, Award, Flame } from 'lucide-react';

interface CharacterAscensionStudioProps {
    onClose?: () => void;
}

export const CharacterAscensionStudio: React.FC<CharacterAscensionStudioProps> = ({ onClose }) => {
    const [generation, setGeneration] = useState(1);
    const [lineageTraits, setLineageTraits] = useState([
        { name: 'Neural Persistence', tier: 'Ascended I', desc: 'Preserves state vectors across workspace reloads' },
        { name: 'Celestial Resonance', tier: 'Ascended II', desc: 'Channels ambient lighting into luminous aura shaders' }
    ]);

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-serif text-lg shadow-inner">
                        🜍
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                                FSG://Self.Self.Transcendence
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold uppercase">
                                Character Lineage & Evolutionary Ascension
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Genomic Heritage • Evolutionary Generations • Trait Mutation & Transmutation
                        </p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Close & Return to Self.Self"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto">
                {/* Generation & Lineage Tree */}
                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <GitBranch size={16} className="text-rose-400" />
                            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                                Evolutionary Lineage
                            </span>
                        </div>
                        <span className="text-xs font-mono font-black text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-500/30">
                            Generation {generation}
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {lineageTraits.map(tr => (
                            <div key={tr.name} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white font-mono">{tr.name}</span>
                                    <span className="text-[8px] font-mono text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 font-bold uppercase">
                                        {tr.tier}
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-relaxed">
                                    {tr.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => {
                            setGeneration(prev => prev + 1);
                            setLineageTraits(prev => [
                                ...prev,
                                {
                                    name: `Transmuted Harmonic ${generation + 1}`,
                                    tier: `Ascended ${generation + 1}`,
                                    desc: 'Procedurally mutated capability synthesized from active runtime cycles.'
                                }
                            ]);
                        }}
                        className="mt-auto py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30"
                    >
                        <Sparkles size={14} />
                        <span>Trigger Next Evolutionary Cycle</span>
                    </button>
                </div>

                {/* Ascension Metamorphic Chamber */}
                <div className="p-5 rounded-2xl bg-black/30 border border-white/10 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 animate-pulse">
                        <Flame size={28} />
                    </div>
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                        Ascension Metamorphic Core
                    </h3>
                    <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed">
                        Character traits bound at this stratum transcend local session instances and persist into the global lineage memory ledger.
                    </p>
                </div>
            </div>
        </div>
    );
};
