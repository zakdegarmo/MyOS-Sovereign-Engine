import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Play, X, User, Globe } from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';

interface SpelljammerHelmProps {
    onClose: () => void;
    onSetTarget: (agentId: string, coordinate: string) => void;
    onToggleLaunchpad?: () => void;
}

export const SpelljammerHelm: React.FC<SpelljammerHelmProps> = ({ onClose, onSetTarget, onToggleLaunchpad }) => {
    const { activeAgentId, agents } = useCouncil();
    const [targetInput, setTargetInput] = useState('D4');

    const activeAgent = activeAgentId ? agents[activeAgentId] : null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="absolute bottom-24 right-6 w-80 bg-black/90 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto z-[2000]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Crosshair size={18} className="text-cyan-400" />
                        <h3 className="font-display font-bold text-sm text-white tracking-widest">SPELLJAMMER HELM</h3>
                    </div>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 flex flex-col gap-4">
                    {/* Active Avatar Status */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                            <span>Active Avatar</span>
                        </div>
                        {activeAgent ? (
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded border border-white/20 flex items-center justify-center ${activeAgent.color} bg-white/10`}>
                                    <User size={16} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-white capitalize">{activeAgent.name}</div>
                                    <div className="text-xs text-white/50">{activeAgent.title}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-white/40 text-sm italic">No Avatar Selected</div>
                        )}
                    </div>

                    {/* Navigation Controls */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mb-2 flex justify-between">
                            <span>Cartesian Navigation</span>
                            <span className="text-cyan-400">1 UNIT / SEC</span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={targetInput}
                                onChange={(e) => setTargetInput(e.target.value.toUpperCase())}
                                placeholder="E.g. A1, J10"
                                className="flex-1 bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono tracking-wider transition-colors"
                            />
                            <button
                                onClick={() => {
                                    if (activeAgentId && targetInput) {
                                        onSetTarget(activeAgentId, targetInput);
                                    }
                                }}
                                disabled={!activeAgentId}
                                className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 hover:border-cyan-500 w-10 flex items-center justify-center rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                <Play size={16} fill="currentColor" />
                            </button>
                        </div>
                        <div className="mt-3 text-[10px] text-white/40 leading-relaxed font-mono">
                            Format: Column (A-J) + Row (1-10)<br />
                            Example: C4, F7, B2
                        </div>
                    </div>

                    {/* Dimension Door Trigger */}
                    <button
                        onClick={onToggleLaunchpad}
                        className="w-full bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/50 hover:border-indigo-500 flex items-center justify-center gap-2 py-3 rounded-xl transition-all group font-bold tracking-widest text-[10px] uppercase"
                    >
                        <Globe size={14} className="group-hover:rotate-12 transition-transform" />
                        Summon Dimension Door
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
