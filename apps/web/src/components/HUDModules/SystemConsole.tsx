import React from 'react';
import { X, Activity, Database, Cpu, ChevronRight, Eraser } from 'lucide-react';
import { purgeVram } from '../MaxOverlay/localLlmService';

interface SystemConsoleProps {
    useLocalAi: boolean;
    setUseLocalAi: (val: boolean) => void;
    hrmState: any;
    isConnected: boolean;
    fileNodes: any[];
    onMountFileSystem: () => void;
    onCrystallizeMemory: () => void;
    onListGeminiModels: () => void;
    onClose: () => void;
}

export const SystemConsole: React.FC<SystemConsoleProps> = ({
    useLocalAi,
    setUseLocalAi,
    hrmState,
    isConnected,
    fileNodes,
    onMountFileSystem,
    onCrystallizeMemory,
    onListGeminiModels,
    onClose
}) => {
    return (
        <div className="w-[380px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative custom-scrollbar max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/30 to-black">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Cpu size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-medium text-sm tracking-wide">System Console</h2>
                        <span className="text-white/40 text-[10px] uppercase font-mono tracking-widest block font-bold">Core Diagnostics Pipeline</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
                {/* Mystra Bridge */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity size={14} /> Inference Bridge
                    </div>
                    <button
                        onClick={() => setUseLocalAi(!useLocalAi)}
                        className={`w-full py-3 rounded-2xl border transition-all flex items-center justify-between px-4 group ${
                            useLocalAi 
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                    >
                        <span className="text-xs font-mono">{useLocalAi ? 'LOCAL (OLLAMA)' : 'CLOUD (GEMINI)'}</span>
                        <div className={`w-2 h-2 rounded-full ${useLocalAi ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]' : 'bg-white/20'}`} />
                    </button>
                    <button
                        onClick={() => purgeVram()}
                        className="w-full py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[9px] font-bold text-amber-300/60 hover:text-amber-400 hover:bg-amber-500/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Eraser size={12} />
                        Purge GPU (Unload Local LLM)
                    </button>
                    <p className="text-[9px] text-white/30 font-mono leading-relaxed px-1">
                        Determines the primary processing node for ontological inference and conversational synthesis.
                    </p>
                </div>

                {/* Databus / Filesystem */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        <Database size={14} /> Subtextual Databus
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={onMountFileSystem}
                            className={`py-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                                isConnected 
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                        >
                            {isConnected ? `MOUNTED (${fileNodes.length})` : 'MOUNT ROOT'}
                        </button>
                        <button 
                            onClick={onCrystallizeMemory}
                            disabled={!isConnected}
                            className="py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] font-bold hover:bg-blue-500/20 transition-all disabled:opacity-30"
                        >
                            CRYSTALLIZE
                        </button>
                    </div>
                </div>

                {/* HRM Core Stats */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                        <Activity size={14} /> HRM Core State
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 font-mono space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-white/30 uppercase tracking-tighter">Emotional Bias</span>
                            <span className={hrmState?.emotionalState === 'PASSIVE' ? 'text-white/60' : 'text-amber-400 font-bold'}>
                                {hrmState?.emotionalState || 'UNKNOWN'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                            <span className="text-white/30 uppercase tracking-tighter">Cycle Step</span>
                            <span className="text-white/80">{hrmState?.step || 0}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="space-y-1">
                            <span className="text-[10px] text-white/20 uppercase">Latent Vector (z_H)</span>
                            <div className="text-[10px] text-blue-300/80 break-all leading-tight bg-black/40 p-2 rounded-lg border border-white/5">
                                {hrmState?.z_H ? `[${hrmState.z_H.slice(0, 5).join(', ')} ...]` : '[NULL]'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Model Inventory */}
                <button 
                    onClick={onListGeminiModels}
                    className="w-full py-2 hover:bg-white/5 rounded-xl text-[10px] text-white/30 hover:text-white/60 transition-all flex items-center justify-center gap-2 font-mono uppercase tracking-widest border border-transparent hover:border-white/5"
                >
                    <ChevronRight size={12} /> Sync Model Inventory
                </button>
            </div>
        </div>
    );
};
