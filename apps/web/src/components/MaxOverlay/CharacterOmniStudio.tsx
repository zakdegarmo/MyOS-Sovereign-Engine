import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Download, Send, Package, Check, Layers, Code, 
    FileJson, FileArchive, Globe, Sparkles
} from 'lucide-react';

interface CharacterOmniStudioProps {
    onClose?: () => void;
}

export const CharacterOmniStudio: React.FC<CharacterOmniStudioProps> = ({ onClose }) => {
    const [selectedEngine, setSelectedEngine] = useState<'PHASER' | 'GODOT' | 'PIXI' | 'CUSTOM'>('PHASER');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const exportManifestTemplate = {
        meta: {
            app: "MyOS Sovereign Sprite Engine",
            version: "2.0.0",
            target: selectedEngine,
            timestamp: new Date().toISOString()
        },
        character: {
            id: "active_character_gestalt",
            tileSize: 256,
            grid: { cols: 8, rows: 8 },
            actions: ["idle", "walk", "run", "spellcast", "slash"],
            directions: ["U", "UR", "R", "DR", "D", "DL", "L", "UL"],
            animations: {
                idle: { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 16, loop: true },
                walk: { frames: [8, 9, 10, 11, 12, 13, 14, 15], fps: 16, loop: true },
                run: { frames: [16, 17, 18, 19, 20, 21, 22, 23], fps: 24, loop: true },
                spellcast: { frames: [24, 25, 26, 27, 28, 29, 30, 31], fps: 12, loop: false }
            }
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(exportManifestTemplate, null, 2));
        setStatusMessage(`📋 ${selectedEngine} Manifest Copied to Clipboard!`);
        setTimeout(() => setStatusMessage(null), 2500);
    };

    const handleDownload = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportManifestTemplate, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `character_manifest_${selectedEngine.toLowerCase()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setStatusMessage(`📥 Downloaded ${selectedEngine} Manifest!`);
        setTimeout(() => setStatusMessage(null), 2500);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-serif text-lg shadow-inner">
                        🜋
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                                FSG://Self.Self.Omni
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold uppercase">
                                Global Multi-Game Manifest & Asset Exporter
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            Multi-Engine Compilers • Godot, Phaser, PixiJS & Custom WebGL Packages
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

            {/* Main Content */}
            <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto">
                {/* Left (5 cols): Target Engine Selection */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
                            Select Target Engine Architecture
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'PHASER', label: 'Phaser 3', desc: 'JSON Hash Sprite Atlas' },
                                { id: 'GODOT', label: 'Godot 4.x', desc: 'SpriteFrames Resource (.tres)' },
                                { id: 'PIXI', label: 'PixiJS', desc: 'Spritesheet Texture Spec' },
                                { id: 'CUSTOM', label: 'Raw JSON', desc: 'Universal MyOS Definition' }
                            ].map(eng => {
                                const isSelected = selectedEngine === eng.id;
                                return (
                                    <button
                                        key={eng.id}
                                        onClick={() => setSelectedEngine(eng.id as any)}
                                        className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                                            isSelected
                                                ? 'bg-emerald-500/10 border-emerald-500/60 text-white shadow-sm'
                                                : 'bg-black/30 border-white/5 text-slate-400 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="text-[10px] font-bold font-mono uppercase">{eng.label}</span>
                                        <span className="text-[8px] opacity-70 leading-tight">{eng.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-auto space-y-2">
                        {statusMessage && (
                            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold text-center animate-pulse">
                                {statusMessage}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                            >
                                <Download size={14} />
                                <span>Download Manifest</span>
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
                            >
                                <Send size={14} />
                                <span>Copy JSON</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right (7 cols): Manifest JSON Preview */}
                <div className="lg:col-span-7 flex flex-col bg-black/40 border border-white/10 rounded-2xl p-4 overflow-hidden">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono">
                            <FileJson size={14} className="text-emerald-400" />
                            <span>Generated Specification Preview</span>
                        </div>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">
                            {selectedEngine} Compliant
                        </span>
                    </div>
                    <pre className="flex-1 overflow-auto p-3 text-[10px] font-mono text-emerald-300/90 leading-relaxed bg-black/50 rounded-xl mt-3 scrollbar-thin">
                        {JSON.stringify(exportManifestTemplate, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};
