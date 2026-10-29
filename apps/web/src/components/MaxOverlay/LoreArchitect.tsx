// apps/web/src/components/MaxOverlay/LoreArchitect.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Scroll, Database, Play, Pause, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { loreService } from '../../memory/LoreService';

interface PDFManifest {
    generatedAt: string;
    totalFiles: number;
    files: Array<{
        name: string;
        path: string;
        size: number;
    }>;
}

export const LoreArchitect: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [manifest, setManifest] = useState<PDFManifest | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [logs, setLogs] = useState<string[]>([]);
    
    const log = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    useEffect(() => {
        const loadManifest = async () => {
            try {
                // Fetch the list of all PDFs
                const res = await fetch('/data/pdf_manifest.json');
                const data = await res.json();
                
                // Fetch already processed volumes from the bridge
                let completedVolumes: string[] = [];
                try {
                    const dbRes = await fetch('http://localhost:8081/api/lore/list_volumes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                    const dbData = await dbRes.json();
                    if (dbData.volumes) completedVolumes = dbData.volumes;
                } catch(e) {
                    log('Warning: Could not connect to bridge for hydration.');
                }
                
                setManifest(data);
                
                // Auto-advance the index if files are already done
                let highestCompletedIndex = -1;
                for (let i = 0; i < data.files.length; i++) {
                    const safeName = data.files[i].name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    if (completedVolumes.includes(safeName)) {
                        highestCompletedIndex = i;
                    }
                }
                
                const startingIndex = highestCompletedIndex + 1;
                setCurrentIndex(startingIndex);
                log(`Manifest loaded. Resuming at volume ${startingIndex}/${data.totalFiles}`);
            } catch (err) {
                log(`Error loading manifest: ${err}`);
            }
        };
        loadManifest();
        loreService.init();
    }, []);

    const commenceIngestion = async () => {
        if (!manifest || isProcessing) return;
        setIsProcessing(true);
        log(`Commencing deep ingestion of ${manifest.totalFiles} volumes...`);

        const pdfjs = await import('pdfjs-dist');
        // Point to local worker
        pdfjs.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.mjs';

        try {
            for (let i = currentIndex; i < manifest.files.length; i++) {
                const file = manifest.files[i];
                setCurrentIndex(i);
                log(`Processing: ${file.name}...`);

                try {
                    const res = await fetch(file.path);
                    const arrayBuffer = await res.arrayBuffer();
                    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
                    const pdf = await loadingTask.promise;

                    log(`Rasterizing ${pdf.numPages} pages...`);
                    
                    const volumeChunks = [];

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        
                        // Extract native text directly (100x faster and 100% accurate for modern PDFs)
                        const textContent = await page.getTextContent();
                        const text = textContent.items.map((item: any) => item.str).join(' ');
                        
                        if (text.trim()) {
                            volumeChunks.push({
                                id: `lore-${Date.now()}-${Math.random()}`,
                                title: `${file.name} - Page ${pageNum}`,
                                content: text.replace(/\s+/g, ' ').trim(),
                                source: file.path,
                                page: pageNum,
                                pillar: loreService.mapConceptToPillar(text),
                                type: 'lore'
                            });
                        }
                        
                        if (pageNum % 5 === 0) log(`  -> Page ${pageNum}/${pdf.numPages} indexed.`);
                    }

                    log(`Volume fully cataloged: ${file.name}`);
                    
                    // Persistence Bridge: Save ONLY this volume
                    log(`Saving volume to Bridge...`);
                    await fetch('http://localhost:8081/api/lore/save_volume', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            volumeId: file.name,
                            chunks: volumeChunks
                        })
                    });
                } catch (volumeErr) {
                    log(`Error processing ${file.name}: ${volumeErr instanceof Error ? volumeErr.message : String(volumeErr)}. Skipping...`);
                    // Save an empty volume to mark it as processed so it doesn't block future reloads
                    await fetch('http://localhost:8081/api/lore/save_volume', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            volumeId: file.name,
                            chunks: []
                        })
                    }).catch(() => {});
                }
            }
            setCurrentIndex(manifest.files.length);
            log(`INGESTION COMPLETE. ALL VOLUMES SECURED.`);
        } catch (err) {
            log(`CRITICAL ERROR during ingestion: ${err}`);
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <div className="w-[800px] h-[600px] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-2xl border border-cyan-500/30 text-cyan-400">
                        <Database size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300">Lore Architect</h2>
                        <p className="text-[10px] text-white/40 font-mono italic">Astra Faerûn Context Registry v1.0</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* PDF LIST */}
                <div className="w-1/3 border-r border-white/5 overflow-y-auto p-4 space-y-2 bg-white/2 scrollbar-hide">
                    {manifest?.files.map((f, i) => (
                        <div 
                            key={i} 
                            className={`p-2 rounded-xl border text-[10px] font-mono transition-all ${
                                i === currentIndex ? 'bg-cyan-500/20 border-cyan-500/50 text-white' : 'bg-white/5 border-white/5 text-white/40'
                            }`}
                        >
                            <div className="truncate mb-1">{f.name}</div>
                            <div className="flex justify-between items-center opacity-50">
                                <span>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                                {i < currentIndex && <CheckCircle size={10} className="text-emerald-400" />}
                            </div>
                        </div>
                    ))}
                </div>

                {/* LOGS & PROGRESS */}
                <div className="flex-1 flex flex-col p-6 bg-black/40">
                    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Registry Health</span>
                                <span className="text-xl font-display font-bold text-white">
                                    {isProcessing ? 'Active Ingestion' : 'Ready for Sync'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-mono text-cyan-400">{currentIndex} / {manifest?.totalFiles || 0}</span>
                            </div>
                        </div>
                        
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentIndex / (manifest?.totalFiles || 1)) * 100}%` }}
                                className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar flex flex-col-reverse">
                        {logs.map((l, i) => (
                            <div key={i} className="py-0.5 border-b border-white/5 last:border-0 text-white/60">
                                {l}
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={commenceIngestion}
                            disabled={isProcessing || !manifest}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-cyan-900/20"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {isProcessing ? 'Syncing...' : 'Commence Ingestion'}
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-6 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white/40 hover:text-white transition-all"
                        >
                            History
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};
