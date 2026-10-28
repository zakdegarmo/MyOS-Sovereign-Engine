import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Terminal, Shield, Zap, 
    Users, Coins, 
    ChevronRight, Info, AlertTriangle,
    X, RefreshCw, Loader2
} from 'lucide-react';
import { useStoryteller } from '../../hooks/useStoryteller';
import type { Mission } from '../../hooks/useStoryteller';

export const BbsService: React.FC<{ onClose: () => void; onAccept: (missionId: string) => void }> = ({ onClose, onAccept }) => {
    const { missions, isLoading, error, scanForJobs, acceptMission } = useStoryteller();
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

    const selectedMission = missions.find(m => m.id === selectedMissionId);

    const handleAccept = (id: string) => {
        acceptMission(id);
        onAccept(id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onWheel={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-[700px] h-[550px] bg-slate-950/90 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-3xl pointer-events-auto"
        >
            {/* HEADER */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Terminal size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Onto-BBS Terminal</h2>
                        <p className="text-[10px] text-amber-500/40 font-mono">EST_LINK: OVERCLOCK_TUNNEL_{missions.length.toString().padStart(2, '0')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={scanForJobs}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-[9px] font-bold text-amber-400 uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Scan for Jobs
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={18} className="text-white/40 hover:text-white" />
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex overflow-hidden">
                {/* LIST */}
                <div className="w-2/5 border-r border-white/5 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    <div className="flex items-center justify-between px-2 pb-2">
                        <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Available Jobs</h3>
                        {error && <span className="text-[8px] text-red-400 font-mono">LINK_ERR</span>}
                    </div>

                    {missions.length === 0 && !isLoading && (
                        <div className="py-10 px-4 text-center space-y-3">
                            <Info size={24} className="mx-auto text-slate-700" />
                            <p className="text-[9px] text-slate-500 font-mono leading-relaxed">No active job listings found in the substrate. Initiate a deep scan.</p>
                        </div>
                    )}

                    {missions.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedMissionId(m.id)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1.5
                                ${selectedMissionId === m.id 
                                    ? 'bg-amber-500/10 border-amber-500/30' 
                                    : 'bg-white/5 border-transparent hover:bg-white/10'}
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-200">{m.title}</span>
                                {m.status === 'ACTIVE' && <Zap size={10} className="text-amber-500 animate-pulse" />}
                            </div>
                            <div className="flex gap-2">
                                <div className={`px-1.5 py-0.5 rounded text-[8px] font-mono
                                    ${m.difficulty === 'HIGH' ? 'bg-red-500/20 text-red-400' : 
                                      m.difficulty === 'MED' ? 'bg-amber-500/20 text-amber-400' : 
                                      'bg-emerald-500/20 text-emerald-400'}
                                `}>
                                    {m.difficulty}
                                </div>
                                <span className="text-[9px] text-slate-500 font-mono italic">{m.targetPillar}</span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* DETAIL */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar bg-black/20">
                    {selectedMission ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedMission.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{selectedMission.title}</h2>
                                    <div className="flex items-center gap-2 text-[9px] font-mono text-amber-500/60">
                                        <Shield size={10} />
                                        TARGET_DOMAIN: {selectedMission.targetAddress}
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed font-mono italic pt-2">
                                        "{selectedMission.description}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Coins size={12} className="text-amber-500" />
                                            Rewards
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedMission.rewards.map((r, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-3 py-1 bg-black/40 border border-white/10 rounded-full text-xs font-bold text-slate-200">
                                                    <span className="text-amber-400 font-mono text-[9px]">{r.type}</span>
                                                    <span>x{r.amount}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                            <Users size={12} className="text-blue-500" />
                                            Intelligence
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-600 italic">
                                            No other operatives currently on matching frequency.
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex gap-4">
                                    <AlertTriangle size={24} className="text-red-500/40 shrink-0" />
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em]">Warning: High Noise</h4>
                                        <p className="text-[9px] text-slate-500 font-mono">Resonance levels in {selectedMission.targetPillar} are fluctuating. Probability of hostile manifestation: HIGH.</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/5">
                                    {selectedMission.status === 'AVAILABLE' ? (
                                        <button 
                                            onClick={() => handleAccept(selectedMission.id)}
                                            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                                        >
                                            Infiltrate Substrate
                                            <ChevronRight size={18} />
                                        </button>
                                    ) : (
                                        <div className="w-full py-4 bg-slate-800 text-slate-500 font-black uppercase tracking-[0.3em] rounded-2xl flex items-center justify-center gap-3 opacity-50 cursor-not-allowed border border-white/5">
                                            Operative Active
                                            <Zap size={18} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-800 opacity-20">
                            <Terminal size={64} strokeWidth={1} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Select_Listing</span>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[9px] text-slate-500 font-mono">
                        <Shield size={12} className="text-emerald-500" />
                        SECURE_CONNECTION: TRUE
                    </div>
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    Welcome to the Dungeon v0.8.2
                </div>
            </div>
        </motion.div>
    );
};
