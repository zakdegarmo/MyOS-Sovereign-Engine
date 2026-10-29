import React, { useState } from 'react';
import { Download, Terminal, CheckCircle, XCircle, Box, Layers, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export const SoftwareInstaller: React.FC = () => {
    const [packageName, setPackageName] = useState('');
    const [appPath, setAppPath] = useState('🜏.🜋'); // Default to Improvement -> Omni
    const [installing, setInstalling] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInstall = async () => {
        if (!packageName) return;
        setInstalling(true);
        setStatus('idle');
        setLog([`> Initiating installation sequence for: ${packageName}...`, '> Contacting Sovereign Proxy (Port 8082)...']);

        try {
            const res = await fetch('http://localhost:8082/api/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    package: packageName,
                    path: appPath
                })
            });

            if (!res.ok) throw new Error("Failed to reach proxy.");
            
            const data = await res.json();
            
            if (data.status === 'success') {
                setLog(prev => [...prev, '> Installation Complete.', '> Appended to installed_apps.json.', '> Hot-Reloading MyOS Workspace...']);
                setStatus('success');
            } else {
                throw new Error(data.error || "Installation failed.");
            }
        } catch (e: any) {
            setLog(prev => [...prev, `> ERROR: ${e.message}`, '> Installation Aborted.']);
            setStatus('error');
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 p-6 text-slate-300 font-mono text-sm overflow-y-auto">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                    <Download size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Software Installer</h1>
                    <p className="text-emerald-500/60 uppercase tracking-widest text-xs mt-1">App Store & Integration Engine</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="flex flex-col gap-4 bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                    <h2 className="text-white font-bold mb-2 flex items-center gap-2"><Box size={16} /> Package Details</h2>
                    
                    <div>
                        <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">NPM Package / Repository</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/50 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="e.g. three, react-three-fiber, canvas-confetti"
                            value={packageName}
                            onChange={e => setPackageName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-500 mb-1 uppercase tracking-wider">Ontological Path (Mount Point)</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/50 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            placeholder="e.g. 🜏.🜋"
                            value={appPath}
                            onChange={e => setAppPath(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-600 mt-1">This determines where the app appears in the Deca-Pillar menu structure.</p>
                    </div>

                    <button 
                        onClick={handleInstall}
                        disabled={installing || !packageName}
                        className={`mt-4 w-full py-3 rounded-lg font-bold uppercase tracking-widest transition-all ${
                            installing || !packageName ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        }`}
                    >
                        {installing ? 'Installing...' : 'Execute Install'}
                    </button>
                </div>

                {/* Console Output */}
                <div className="flex flex-col bg-black border border-slate-800 rounded-xl overflow-hidden relative">
                    <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
                        <Terminal size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-400 uppercase tracking-widest">Install Log</span>
                    </div>
                    <div className="p-4 flex-1 font-mono text-xs text-slate-400 flex flex-col gap-1 overflow-y-auto min-h-[200px]">
                        {log.length === 0 && <span className="opacity-50 italic">Awaiting input...</span>}
                        {log.map((l, i) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={i}
                                className={l.includes('ERROR') ? 'text-red-400' : l.includes('Complete') ? 'text-emerald-400' : ''}
                            >
                                {l}
                            </motion.div>
                        ))}
                        {installing && (
                            <motion.div 
                                animate={{ opacity: [0.5, 1, 0.5] }} 
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="text-emerald-500 mt-2"
                            >
                                _
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Status Feedback */}
            {status !== 'idle' && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${
                        status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                >
                    {status === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <div>
                        <h3 className="font-bold">{status === 'success' ? 'Installation Successful' : 'Installation Failed'}</h3>
                        <p className="text-xs opacity-70">
                            {status === 'success' ? 'The package is now available in your workspace. You may need to refresh if hot-reload didn\'t trigger.' : 'Review the logs above and try again.'}
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
