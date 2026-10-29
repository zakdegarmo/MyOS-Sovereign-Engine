import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Activity, Shield, Ghost, Sparkles, Binary, Hexagon } from 'lucide-react';
import { SemanticAddress, ALCHEMICAL_SYMBOLS } from '../../../sys/SemanticAddress';
import extractedSymbols from '../../../../extracted_symbols.json';

interface SymbolNode {
    depth: number;
    title: string;
    symbol: string;
    text: string;
}

const symbols = extractedSymbols as SymbolNode[];

const LEVEL_NAMES = [
    'Pillar',
    'Relationship',
    'Gene',
    'Protein',
    'Molecule',
    'Atom'
];

export const SemanticAddressPlayground: React.FC = () => {
    const [coords, setCoords] = useState<number[]>([1, 2, 3, 0, 0, 0]); // Default to Self.Identity.Ego
    const [stateChars, setStateChars] = useState<[string, string]>(['♔', '♨']);

    const address = useMemo(() => {
        try {
            return SemanticAddress.encode(coords, stateChars);
        } catch (e) {
            return null;
        }
    }, [coords, stateChars]);

    const resolvedHierarchy = useMemo(() => {
        const result: (SymbolNode | null)[] = [null, null, null, null, null, null];

        let parentIndex = -1;

        for (let d = 0; d < 6; d++) {
            const depth = d + 1;
            const coord = coords[d];

            // Find candidates for this level.
            // Candidates are nodes at current depth that are "children" of the previous parent.
            // In the flat list, these are the nodes that come after parentIndex but before the next node 
            // with depth <= parent.depth.
            let candidates: SymbolNode[] = [];

            if (depth === 1) {
                candidates = symbols.filter(s => s.depth === 1);
            } else {
                // Look for nodes at depth D+1 starting from parentIndex + 1
                for (let i = parentIndex + 1; i < symbols.length; i++) {
                    const s = symbols[i];
                    if (s.depth === depth) {
                        candidates.push(s);
                    } else if (s.depth < depth) {
                        // We hit a sibling or higher-level node of the parent, stop searching
                        break;
                    }
                }
            }

            if (candidates.length === 0) break;

            const node = candidates[coord % candidates.length];
            if (node) {
                result[d] = node;
                parentIndex = symbols.indexOf(node);
            } else {
                break;
            }
        }
        return result;
    }, [coords]);

    const updateCoord = (index: number, val: number) => {
        const next = [...coords];
        next[index] = val;
        setCoords(next);
    };

    return (
        <div className="p-6 flex flex-col gap-8 h-full bg-slate-900/40">
            {/* BIG ADDRESS DISPLAY */}
            <div className="flex flex-col items-center justify-center py-10 rounded-3xl bg-black/60 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl pointer-events-none" />

                <h2 className="text-[10px] font-mono tracking-[0.4em] text-emerald-500/50 uppercase mb-4">Semantic Address Vector</h2>

                <div className="flex items-center gap-2 font-serif text-6xl md:text-7xl lg:text-8xl tracking-tight text-white glow-emerald">
                    {Array.from(address?.fullAddress || '').map((char, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
                            className={i >= 6 ? "text-blue-400" : "text-emerald-400"}
                        >
                            {char}
                        </motion.span>
                    ))}
                </div>

                <div className="mt-4 text-[10px] font-mono text-emerald-500/80 uppercase tracking-[0.2em] flex items-center gap-2">
                    {resolvedHierarchy.filter(n => n).map((n, i) => (
                        <React.Fragment key={i}>
                            <div className="flex flex-col items-center">
                                <span className="text-[7px] text-emerald-500/30 mb-0.5">{LEVEL_NAMES[i]}</span>
                                <span>{n?.text}</span>
                            </div>
                            {i < resolvedHierarchy.filter(n => n).length - 1 && <span className="opacity-30 mt-2">.</span>}
                        </React.Fragment>
                    ))}
                </div>

                <div className="mt-8 flex gap-4 text-[11px] mono">
                    <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest">
                        Index: {coords.join('-')}
                    </div>
                    <div className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 uppercase tracking-widest">
                        Intent: {stateChars.join('')}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                {/* COORDINATE CONTROLS */}
                <div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Binary size={14} className="text-emerald-500" />
                        Root Geometry (6-Bit Alchemy)
                    </h3>

                    <div className="space-y-4 pt-4">
                        {coords.map((val, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="w-12 text-[10px] font-mono text-zinc-500">D{i + 1}</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="9"
                                    value={val}
                                    onChange={(e) => updateCoord(i, parseInt(e.target.value))}
                                    className="flex-1 accent-emerald-500 bg-zinc-800 rounded-lg h-1.5"
                                />
                                <span className="w-8 text-center text-lg font-serif text-emerald-400">{ALCHEMICAL_SYMBOLS[val]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RESOLVED HIERARCHY */}
                <div className="flex flex-col gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-white/5 overflow-hidden">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Hexagon size={14} className="text-blue-400" />
                        Semantic Refraction
                    </h3>

                    <div className="flex-1 terminal-scroll space-y-3 pt-2">
                        {resolvedHierarchy.map((node, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-emerald-500/20 transition-all border-l-2 border-l-emerald-500"
                            >
                                <div className="text-2xl font-serif text-emerald-500 w-8">{ALCHEMICAL_SYMBOLS[coords[i]]}</div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">Level {i + 1}: {LEVEL_NAMES[i]}</div>
                                    <div className="text-sm font-bold text-slate-200">{node?.text || 'Unmanifested'}</div>
                                    <div className="text-[9px] italic text-zinc-500 mt-1 max-w-xs">{node?.symbol} • {node?.title}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* INTENT SELECTOR */}
            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <h3 className="text-xs font-bold text-blue-400/60 uppercase tracking-widest mb-6">Execution Intention (2-Bit Machine)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(SemanticAddress.INTENTS).map(([key, value]) => (
                        <button
                            key={key}
                            onClick={() => setStateChars(value)}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${stateChars[0] === value[0]
                                ? 'bg-blue-500/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                }`}
                        >
                            <span className="text-2xl">{value.join('')}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest">{key}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
