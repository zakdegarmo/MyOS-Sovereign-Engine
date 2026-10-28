import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Map, Play, Loader2, Database } from 'lucide-react';
import { generateResponse as generateLocalResponse } from './localLlmService';

interface PDFManifest {
    generatedAt: string;
    totalFiles: number;
    files: Array<{
        name: string;
        path: string;
        size: number;
    }>;
}

export const Cartographer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [manifest, setManifest] = useState<PDFManifest | null>(null);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [pageRange, setPageRange] = useState<string>('1');
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
    const log = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    useEffect(() => {
        const loadManifest = async () => {
            try {
                const res = await fetch('/data/pdf_manifest.json');
                const data = await res.json();
                setManifest(data);
                if (data.files.length > 0) setSelectedFile(data.files[0].path);
            } catch (err) {
                log(`Error loading manifest: ${err}`);
            }
        };
        loadManifest();
    }, []);

    const processMap = async () => {
        if (!selectedFile || !pageRange || isProcessing) return;
        setIsProcessing(true);
        log(`Commencing manual cartography on ${selectedFile} (Pages: ${pageRange})...`);

        try {
            const pdfjs = await import('pdfjs-dist');
            pdfjs.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.mjs';

            const pagesToProcess = pageRange.split(',').flatMap(range => {
                const [start, end] = range.split('-').map(Number);
                if (end) {
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                }
                return [start];
            }).filter(n => !isNaN(n));

            const res = await fetch(selectedFile);
            const arrayBuffer = await res.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            for (const pageNum of pagesToProcess) {
                if (pageNum < 1 || pageNum > pdf.numPages) {
                    log(`Warning: Page ${pageNum} is out of bounds. Skipping.`);
                    continue;
                }

                log(`Rasterizing page ${pageNum}...`);
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');

                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const base64 = canvas.toDataURL('image/jpeg');
                    
                    log(`Sending page ${pageNum} to Vision Model...`);
                    const systemPrompt = `You are the Cartographer. Analyze this map image. Return ONLY a strict JSON object with this exact structure: {"id": "map-unique-id", "title": "Name of Region", "data": {"terrainHeight": 25, "terrainScale": 0.005, "grassColor": "#hex", "dirtColor": "#hex", "stoneColor": "#hex", "description": "Brief topological summary"}}`;
                    
                    const aiRes = await generateLocalResponse("Extract map layout.", base64, systemPrompt);
                    
                    let topoData = null;
                    const jsonMatch = aiRes.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try { topoData = JSON.parse(jsonMatch[0]); } catch(e){}
                    }

                    if (topoData) {
                        await fetch('http://localhost:8081/api/lore/save_map', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: topoData.id || `map-${Date.now()}`,
                                title: topoData.title || `Map from ${selectedFile.split('/').pop()}`,
                                data: topoData.data,
                                source: `${selectedFile}#page=${pageNum}`
                            })
                        });
                        log(`Success: Topology saved for Page ${pageNum} (${topoData.title}).`);
                    } else {
                        log(`Failure: AI could not generate structured JSON for Page ${pageNum}.`);
                    }
                }
            }
            log('Cartography complete.');
        } catch (err) {
            log(`CRITICAL ERROR: ${err}`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="w-[800px] h-[600px] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/30 text-purple-400">
                        <Map size={24} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-purple-300">Cartographer</h2>
                        <p className="text-[10px] text-white/40 font-mono italic">Manual Topological Map Extraction v1.0</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/3 border-r border-white/5 p-6 flex flex-col gap-4 bg-white/2">
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-white/60 mb-2">Select Source Volume</label>
                        <select 
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500/50"
                        >
                            {manifest?.files.map((f, i) => (
                                <option key={i} value={f.path}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold uppercase text-white/60 mb-2">Page Range (e.g. 15,16-20)</label>
                        <input 
                            type="text" 
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-purple-500/50 font-mono"
                            placeholder="12-15,20"
                        />
                    </div>

                    <div className="mt-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={processMap}
                            disabled={isProcessing || !manifest}
                            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/20"
                        >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                            {isProcessing ? 'Analyzing Map...' : 'Extract Topology'}
                        </motion.button>
                    </div>
                </div>

                <div className="flex-1 p-6 bg-black/40 flex flex-col">
                    <div className="flex items-center gap-2 mb-4 text-white/60">
                        <Database size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Cartography Feed</span>
                    </div>
                    <div className="flex-1 min-h-0 bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar flex flex-col-reverse">
                        {logs.map((l, i) => (
                            <div key={i} className="py-0.5 border-b border-white/5 last:border-0 text-white/60">
                                {l}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
