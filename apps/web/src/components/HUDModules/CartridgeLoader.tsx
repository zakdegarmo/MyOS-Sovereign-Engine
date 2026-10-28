import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Box, Zap, Search, CornerDownRight, 
    ShieldCheck, Info, Loader2, Terminal, Database, FolderOpen
} from 'lucide-react';
import { ID_TO_SYMBOL } from '../../utils/SemanticAddressing';

interface AuditResult {
    folder: string;
    suggested_name: string;
    suggested_description: string;
    sequence: string[];
    rationale: string;
    depth: number;
}

export const CartridgeLoader: React.FC = () => {
    const [auditPath, setAuditPath] = useState('');
    const [isAuditing, setIsAuditing] = useState(false);
    const [results, setResults] = useState<AuditResult | null>(null);
    const [status, setStatus] = useState<string>('AWAITING_CARTRIDGE_SIGNAL');

    const handleBrowse = async () => {
        try {
            const handle = await (window as any).showDirectoryPicker();
            if (handle) {
                setAuditPath(handle.name); // Using name as label, though handle is needed for real FS access
                setStatus('CARTRIDGE_LOCKED_IN');
                
                // For a real app, we'd store the handle to pass to the backend
                // Here we'll just set the path for the simulation
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.error("Folder picker failed", err);
                setStatus('PICKER_ABORTED');
            }
        }
    };

    const handleAudit = async () => {
        if (!auditPath) return;
        setIsAuditing(true);
        setStatus('INITIALIZING_ONTOLOGICAL_SCAN');
        
        try {
            // Real-time audit via Swarm Hub
            setStatus('ACCESSING_MISTRAL_SUBSTRATE');
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: auditPath })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Audit Failed');
            }

            const result = await res.json();
            setStatus('MAPPING_GENOMIC_COORDINATES');
            
            // The API returns a full AuditResult object
            setResults(result);
            setStatus('AUDIT_COMPLETE');
        } catch (err: any) {
            console.error("Audit failure:", err);
            setStatus('SCAN_FAILURE: ' + err.message);
        } finally {
            setIsAuditing(false);
        }
    };

    const confirmInstallation = () => {
        setStatus('COMMITTING_TO_REGISTRY');
        setTimeout(() => {
            setStatus('CARTRIDGE_INSTALLED_AT_0x' + (Math.random() * 10000).toString(16).toUpperCase());
        }, 1200);
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-950 font-mono text-cyan-400 select-none overflow-hidden relative">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(6,182,212,0.1),transparent)] pointer-events-none" />
            
            {/* Header */}
            <div className="h-14 border-b border-cyan-500/20 bg-black/40 flex items-center justify-between px-8 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                        <Box size={20} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.4em] text-white">Cartridge_Loader_v1.0</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] text-cyan-500/60 uppercase">System Ready // Substrate: Mistral-S1</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-[10px] text-right">
                        <div className="text-white/40 uppercase tracking-widest">Address Logic</div>
                        <div className="text-cyan-500 font-bold tracking-tighter text-xs">☉.🜔.☉</div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 p-8 min-h-0 z-10">
                {/* Left: Input & Log */}
                <div className="w-1/3 flex flex-col gap-6">
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-6 space-y-4 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white uppercase tracking-widest">
                            <Database size={14} className="text-cyan-500" />
                            Source Path
                        </div>
                        <div className="flex gap-2 relative group">
                            <input 
                                value={auditPath}
                                onChange={(e) => setAuditPath(e.target.value)}
                                placeholder="C:\Users\...\HyperAetherPilgrim"
                                className="flex-1 bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyan-100 outline-none focus:border-cyan-500/50 transition-all font-mono"
                            />
                            <button 
                                onClick={handleBrowse}
                                className="px-4 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
                                title="Open OS File Picker"
                            >
                                <FolderOpen size={16} />
                            </button>
                        </div>
                        <button 
                            onClick={handleAudit}
                            disabled={!auditPath || isAuditing}
                            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-bold text-xs uppercase tracking-[0.2em] relative overflow-hidden group
                                ${isAuditing ? 'bg-cyan-500/10 text-cyan-500/50 border border-cyan-500/20' : 'bg-cyan-600/20 text-white border border-cyan-500/40 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]'}
                            `}
                        >
                            {isAuditing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Zap size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                            )}
                            {isAuditing ? 'Auditing...' : 'Execute Onto-Scan'}
                        </button>
                    </div>

                    {/* Console Log */}
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[10px] text-cyan-500/50 flex items-center gap-2 uppercase font-bold tracking-[0.2em]">
                                <Terminal size={14} /> System_Log
                            </div>
                            <span className="text-[8px] text-white/20">UTF-8 // HEX_STREAM</span>
                        </div>
                        <div className="flex-1 space-y-2 text-[10px] font-mono overflow-y-auto custom-scrollbar pr-2 scroller-fade">
                            <div className="text-emerald-500/60">[{new Date().toLocaleTimeString()}] BOOT_SEQUENCE: OK</div>
                            <div className="text-cyan-500/60">[{new Date().toLocaleTimeString()}] AWAITING_INPUT_SIGNAL...</div>
                            <AnimatePresence>
                                {status !== 'AWAITING_CARTRIDGE_PATH' && (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }} 
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-amber-500/80"
                                    >
                                        [{new Date().toLocaleTimeString()}] {status}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right: Visualization & Results */}
                <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 bg-black/80 rounded-3xl border border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-12">
                        {/* Recursive DNA Visualization */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <div 
                                    key={i}
                                    className="absolute border border-cyan-500/20 rounded-full animate-pulse"
                                    style={{ 
                                        width: `${(i + 1) * 200}px`, 
                                        height: `${(i + 1) * 200}px`,
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        animationDelay: `${i * 0.2}s`
                                    }}
                                />
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {!results ? (
                                <motion.div 
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center space-y-6 z-20"
                                >
                                    <div className="w-24 h-24 mx-auto bg-cyan-500/10 rounded-full flex items-center justify-center border border-cyan-500/20 animate-pulse">
                                        <Box size={40} className="text-cyan-500/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-widest underline decoration-cyan-500/50 decoration-2 underline-offset-8">Awaiting Signal</h3>
                                        <p className="text-[10px] text-cyan-500/40 max-w-xs mx-auto leading-relaxed uppercase">Provide a valid integration file path to begin ontological genome mapping.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="results"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="w-full h-full flex flex-col z-20"
                                >
                                    {/* Result Summary */}
                                    <div className="flex items-start justify-between mb-8">
                                        <div>
                                            <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.3em] mb-1">Audit_Success // 0.98 Conf</div>
                                            <h3 className="text-3xl font-bold text-white uppercase tracking-tight">{results.suggested_name}</h3>
                                            <p className="text-xs text-cyan-500/60 mt-1">{results.suggested_description}</p>
                                        </div>
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center gap-1 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                            <span className="text-[9px] text-emerald-500/60 uppercase font-bold">Resonance Depth</span>
                                            <span className="text-2xl font-bold text-emerald-400">S{results.depth}</span>
                                        </div>
                                    </div>

                                    {/* Genomic Sequence Chain */}
                                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 mb-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Zap size={100} />
                                        </div>
                                        <div className="text-[10px] text-cyan-500/40 uppercase font-bold mb-6 tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            Proposed Genomic Address
                                        </div>
                                        <div className="flex items-center gap-8 justify-center">
                                            {results.sequence.map((pillar, i) => (
                                                <React.Fragment key={i}>
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform">
                                                            {(ID_TO_SYMBOL as any)[pillar] || '?'}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white/60 uppercase">{pillar}</span>
                                                    </div>
                                                    {i < results.sequence.length - 1 && (
                                                        <CornerDownRight size={24} className="text-cyan-500/20" />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rationale & Action */}
                                    <div className="flex-1 flex gap-6 min-h-0">
                                        <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                                            <div className="text-[10px] text-cyan-500 uppercase font-bold mb-3 flex items-center gap-2">
                                                <Info size={14} /> Ontological Rationale
                                            </div>
                                            <p className="text-xs text-cyan-200/60 leading-relaxed font-serif italic">
                                                "{results.rationale}"
                                            </p>
                                        </div>
                                        <div className="w-48 flex flex-col gap-3">
                                            <button 
                                                onClick={confirmInstallation}
                                                className="flex-1 bg-emerald-500 text-black font-bold uppercase text-xs rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                                            >
                                                Commit
                                            </button>
                                            <button 
                                                onClick={() => setResults(null)}
                                                className="h-14 bg-white/5 border border-white/10 text-white/40 font-bold uppercase text-[10px] rounded-2xl hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Status Footer */}
                    <div className="bg-black/40 border border-white/5 rounded-2xl px-8 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-8 text-[10px] text-cyan-500/40 uppercase tracking-widest font-bold">
                            <div className="flex align-center gap-2">
                                <span className={results ? "text-emerald-500" : "text-amber-500"}>{status}</span>
                            </div>
                            <div className="flex align-center gap-2">
                                CRC: <span className="text-white/20">VALID</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-1 bg-cyan-500/20 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                                    animate={{ width: isAuditing ? '100%' : '0%' }}
                                    transition={{ duration: 4 }}
                                />
                            </div>
                            <span className="text-[9px] text-white/20">CARTRIDGE_V0.1</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
