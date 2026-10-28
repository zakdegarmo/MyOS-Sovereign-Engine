import React, { useState, useEffect } from 'react';
import { useWorld } from '../../engine/WorldContext';
import { Layers, Image as ImageIcon, Crosshair, Sparkles } from 'lucide-react';

export const ObjectPalette: React.FC = () => {
    const { saveBuildingPiece } = useWorld();
    const [manifest, setManifest] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState<'sprites' | 'environments'>('sprites');
    const [activeLayer, setActiveLayer] = useState<string | null>(null);

    useEffect(() => {
        fetch('/assets/lpc/semantic_manifest.json')
            .then(r => r.json())
            .then(data => {
                setManifest(data);
                if (data.sprites && Object.keys(data.sprites).length > 0) {
                    setActiveLayer(Object.keys(data.sprites)[0]);
                }
            })
            .catch(err => console.error('Failed to load semantic manifest:', err));
    }, []);

    if (!manifest) {
        return <div className="text-[10px] text-amber-500/50 font-mono italic p-4 text-center border border-dashed border-amber-500/20 rounded-xl">Loading Lexicon...</div>;
    }

    const currentItems = manifest[activeCategory]?.[activeLayer || ''] || [];

    const handleSpawn = (item: any) => {
        const path = typeof item === 'string' ? item : item.path;
        saveBuildingPiece({
            id: `sprite_${Date.now()}`,
            type: 'sprite',
            position: [0, 1, -5], // Spawn in front of default camera
            rotation: [0, 0, 0],
            scale: [1, 1, 1], // Unit scale for sprites initially
            health: 100,
            isDestroyed: false,
            textureUrl: `/assets/lpc/${path}`
        });
    };

    return (
        <div className="flex flex-col gap-3 h-[400px]">
            <p className="text-[9px] text-amber-400/40 italic font-mono">Manual Billboard Injection (Pre-AO Engine)</p>
            
            <div className="flex gap-2">
                <button 
                    onClick={() => { setActiveCategory('sprites'); setActiveLayer(Object.keys(manifest.sprites)[0] || null); }}
                    className={`flex-1 py-1 text-[10px] uppercase font-bold tracking-widest transition-colors rounded ${activeCategory === 'sprites' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-black/20 text-white/40'}`}
                >
                    Sprites
                </button>
                <button 
                    onClick={() => { setActiveCategory('environments'); setActiveLayer(Object.keys(manifest.environments)[0] || null); }}
                    className={`flex-1 py-1 text-[10px] uppercase font-bold tracking-widest transition-colors rounded ${activeCategory === 'environments' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-black/20 text-white/40'}`}
                >
                    Environment
                </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
                {Object.keys(manifest[activeCategory] || {}).map(layer => (
                    <button
                        key={layer}
                        onClick={() => setActiveLayer(layer)}
                        className={`whitespace-nowrap px-2 py-1 text-[9px] font-mono rounded ${activeLayer === layer ? 'bg-white/10 text-white border border-white/20' : 'text-white/40 hover:text-white/60'}`}
                    >
                        {layer}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 lg:grid-cols-3 gap-2 scrollbar-thin scrollbar-thumb-amber-500/20">
                {currentItems.map((item: any, idx: number) => {
                    const path = typeof item === 'string' ? item : item.path;
                    const context = typeof item === 'string' ? null : item.context;
                    
                    return (
                        <div key={idx} className="group relative bg-black/40 border border-white/10 rounded-lg overflow-hidden flex flex-col aspect-square transition-all hover:border-amber-500/50">
                            <div className="flex-1 bg-[url('/grid_bg.png')] bg-center bg-repeat opacity-80 flex items-center justify-center p-2">
                                <img src={`/assets/lpc/${path}`} alt={path} className="max-w-full max-h-full object-contain pixelated" />
                            </div>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2 backdrop-blur-sm">
                                <span className="text-[8px] text-amber-300 font-mono text-center break-all line-clamp-2">{path.split('/').pop()}</span>
                                <button
                                    onClick={() => handleSpawn(item)}
                                    className="bg-amber-500 text-black text-[10px] font-bold uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-[0_0_10px_rgba(245,158,11,0.5)] hover:scale-105 transition-transform"
                                >
                                    <Sparkles size={10} /> Spawn
                                </button>
                            </div>
                        </div>
                    );
                })}
                {currentItems.length === 0 && (
                    <div className="col-span-full text-center text-white/30 text-[10px] py-4">No assets found.</div>
                )}
            </div>
        </div>
    );
};
