// apps/web/src/components/MaxOverlay/AetherConsole.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Cpu, Cloud, CloudOff, RefreshCw, FolderOpen, Shield, HelpCircle, Activity, Thermometer } from 'lucide-react';

interface BridgeConfig {
    useCloud: boolean;
    activeModel: string;
}

export const AetherConsole: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [config, setConfig] = useState<BridgeConfig>({ useCloud: false, activeModel: 'gemma4:26b' });
    const [localModels, setLocalModels] = useState<string[]>([]);
    const [sectorPath, setSectorPath] = useState('./apps/web');
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestLogs, setIngestLogs] = useState<string[]>([]);
    const [purging, setPurging] = useState(false);

    const log = (msg: string) => setIngestLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/settings/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get' })
            });
            const data = await res.json();
            if (data.config) setConfig(data.config);
        } catch (e) {
            log('Error connecting to Agent Bridge settings api.');
        }
    };

    const fetchLocalModels = async () => {
        try {
            const res = await fetch('http://localhost:11434/api/tags');
            const data = await res.json();
            if (data.models) {
                setLocalModels(data.models.map((m: any) => m.name));
            }
        } catch (e) {
            log('Error fetching models from Ollama (is Ollama running?)');
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchLocalModels();
    }, []);

    const toggleCloud = async () => {
        const nextUseCloud = !config.useCloud;
        try {
            const res = await fetch('http://localhost:8081/api/settings/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'set',
                    config: { useCloud: nextUseCloud }
                })
            });
            const data = await res.json();
            if (data.config) {
                setConfig(data.config);
                log(`Successfully toggled mode to: ${nextUseCloud ? 'CLOUD (Gemini)' : 'LOCAL (Ollama)'}`);
            }
        } catch (e) {
            log('Error saving routing toggle configuration.');
        }
    };

    const selectModel = async (model: string) => {
        try {
            const res = await fetch('http://localhost:8081/api/settings/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'set',
                    config: { activeModel: model }
                })
            });
            const data = await res.json();
            if (data.config) {
                setConfig(data.config);
                log(`Active Local Model updated to: ${model}`);
            }
        } catch (e) {
            log('Error setting active local model.');
        }
    };

    const handleIngestSector = async () => {
        setIsIngesting(true);
        log(`Initiating sector-based ingestion for folder: ${sectorPath}`);
        try {
            const res = await fetch('http://localhost:8081/api/rag/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: sectorPath })
            });
            const data = await res.json();
            if (data.success) {
                log(`Ingested successfully! ${data.count} files loaded into active memory.`);
            } else {
                log(`Ingestion failed: ${data.error || 'Unknown error'}`);
            }
        } catch (e) {
            log(`RAG connection lost: ${e}`);
        } finally {
            setIsIngesting(false);
        }
    };

    const handlePurgeVram = async () => {
        setPurging(true);
        log('Sending keep_alive: 0 signal to purge local LLM VRAM...');
        try {
            // Send empty prompt with keep_alive: 0 to unload model
            await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: config.activeModel,
                    prompt: '',
                    keep_alive: 0
                })
            });
            log('Ollama VRAM cleared. GPU cooling down.');
        } catch (e) {
            log('VRAM Purge call failed.');
        } finally {
            setPurging(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-[600px] border border-cyan-500/30 bg-[#0c1015]/95 text-gray-200 rounded-lg p-6 shadow-2xl shadow-cyan-500/10 flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-cyan-500/20 pb-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <h2 className="text-xl font-bold tracking-widest uppercase text-cyan-400 font-mono">Aether Console: LLM & RAG Manager</h2>
                    </div>
                    <button onClick={onClose} className="hover:text-cyan-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Routing Mode */}
                    <div className="border border-cyan-500/20 bg-cyan-950/10 rounded p-4 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-cyan-400 font-mono text-sm tracking-wide">ROUTING ENDPOINT GATEWAY</h3>
                            <p className="text-xs text-gray-400 mt-1">Intercept and route @google/genai SDK calls dynamically.</p>
                        </div>
                        <button 
                            onClick={toggleCloud} 
                            className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-xs font-bold border transition-all ${
                                config.useCloud 
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30' 
                                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
                            }`}
                        >
                            {config.useCloud ? (
                                <>
                                    <Cloud className="w-4 h-4" />
                                    CLOUD (GEMINI API)
                                </>
                            ) : (
                                <>
                                    <CloudOff className="w-4 h-4" />
                                    OFFLINE (LOCAL OLLAMA)
                                </>
                            )}
                        </button>
                    </div>

                    {/* Local Model Selection */}
                    {!config.useCloud && (
                        <div className="border border-cyan-500/10 bg-[#0e141b] rounded p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-cyan-400 font-mono text-xs uppercase">Local Ollama Model</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Choose which local brain powers MyOS offline.</p>
                                </div>
                                <button 
                                    onClick={handlePurgeVram}
                                    disabled={purging}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-mono rounded transition-colors disabled:opacity-50"
                                >
                                    <Thermometer className="w-3.5 h-3.5" />
                                    {purging ? 'Purging...' : 'Purge VRAM'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {localModels.length === 0 ? (
                                    <p className="text-xs text-amber-400 italic col-span-2">No local models discovered. Ensure Ollama is running.</p>
                                ) : (
                                    localModels.map(model => (
                                        <button
                                            key={model}
                                            onClick={() => selectModel(model)}
                                            className={`px-3 py-2 rounded text-left font-mono text-xs border transition-all ${
                                                config.activeModel === model
                                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                                    : 'bg-[#151c24] border-transparent hover:border-cyan-500/20 text-gray-400'
                                            }`}
                                        >
                                            {model}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* JIT RAG Sector Ingestor */}
                    <div className="border border-cyan-500/10 bg-[#0e141b] rounded p-4 space-y-4">
                        <div>
                            <h3 className="font-bold text-cyan-400 font-mono text-xs uppercase">JIT Sector-Based Ingestor</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Dynamically index specific folders into Orama search index.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-[#151c24] border border-cyan-500/20 rounded flex items-center px-3 gap-2">
                                <FolderOpen className="w-4 h-4 text-cyan-400" />
                                <input 
                                    type="text" 
                                    value={sectorPath} 
                                    onChange={(e) => setSectorPath(e.target.value)}
                                    placeholder="Sector directory path..."
                                    className="bg-transparent border-none outline-none flex-1 text-xs font-mono text-cyan-300"
                                />
                            </div>
                            <button 
                                onClick={handleIngestSector}
                                disabled={isIngesting}
                                className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-300 rounded font-mono text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isIngesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                                {isIngesting ? 'Ingesting...' : 'Ingest'}
                            </button>
                        </div>
                    </div>

                    {/* Console Logs */}
                    <div className="border border-cyan-500/10 bg-black/40 rounded p-4 flex flex-col h-[180px]">
                        <h3 className="font-bold text-cyan-500/80 font-mono text-xs uppercase mb-2">Aether Console logs</h3>
                        <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[10px] text-cyan-300/80 scrollbar-thin">
                            {ingestLogs.length === 0 ? (
                                <p className="italic text-gray-500">System idle. Ready for command input.</p>
                            ) : (
                                ingestLogs.map((logLine, idx) => (
                                    <div key={idx} className="border-b border-cyan-950/20 pb-0.5">{logLine}</div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="border-t border-cyan-500/20 pt-4 mt-4 flex justify-between items-center text-[10px] font-mono text-gray-400">
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>System Autonomy: Off-Grid Secure</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span>Bridge Connected</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
