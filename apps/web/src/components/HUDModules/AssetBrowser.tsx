import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Package, Box } from 'lucide-react';

interface AssetBrowserProps {
    onClose: () => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({ onClose }) => {
    const [assets, setAssets] = useState<string[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('Virtual Geometries');
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const [selectedGeometry, setSelectedGeometry] = useState<string | null>(null);

    useEffect(() => {
        fetch('/assets/lpc/asset_manifest.json')
            .then(res => res.json())
            .then(data => {
                setAssets(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load asset manifest:", err);
                setLoading(false);
            });
    }, []);

    const categories = React.useMemo(() => {
        const cats = new Set<string>();
        assets.forEach(a => {
            const pathInfo = a.replace(/\\/g, '/');
            const parts = pathInfo.replace('assets/lpc/', '').split('/');
            if (parts.length > 1) {
                cats.add(parts[0]);
            } else {
                cats.add('Uncategorized');
            }
        });
        return ['Virtual Geometries', ...Array.from(cats).sort()];
    }, [assets]);

    // Handle initial category set
    useEffect(() => {
        if (categories.length > 0 && categories.includes('Uncategorized') && activeCategory === 'Uncategorized') {
            // Find a better default if available
            const bestDefault = categories.find(c => c !== 'Uncategorized') || 'Uncategorized';
            setActiveCategory(bestDefault);
        }
    }, [categories]);

    const filteredAssets = React.useMemo(() => {
        return assets
            .filter(a => {
                const pathInfo = a.replace(/\\/g, '/');
                const parts = pathInfo.replace('assets/lpc/', '').split('/');
                const cat = parts.length > 1 ? parts[0] : 'Uncategorized';

                if (cat !== activeCategory && activeCategory !== 'All') return false;
                if (filter && !pathInfo.toLowerCase().includes(filter.toLowerCase())) return false;

                return true;
            })
            .slice(0, 300);
    }, [assets, filter, activeCategory]);

    const handleTextureDragStart = (e: React.DragEvent) => {
        if (!selectedAsset) return;
        e.dataTransfer.setData('assetUrl', '/' + selectedAsset);
        e.dataTransfer.effectAllowed = 'copy';

        const img = new Image();
        img.src = '/' + selectedAsset;
        img.width = 64;
        e.dataTransfer.setDragImage(img, 32, 32);
    };

    const handleGeometryDragStart = (e: React.DragEvent) => {
        if (!selectedGeometry) return;
        e.dataTransfer.setData('geometryType', selectedGeometry);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-[400px] h-[600px] bg-black/90 backdrop-blur-2xl border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-2">
                    <Package size={20} className="text-cyan-400" />
                    <h2 className="text-white font-bold tracking-tight">Asset Browser</h2>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-white/5">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                        type="text"
                        placeholder="Filter assets (e.g. tiles, character)..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Pane: List View */}
                <div className="w-1/2 md:w-2/5 border-r border-white/5 bg-black/40 flex flex-col">
                    <div className="p-2 border-b border-white/5 bg-slate-900/40">
                        <select 
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-cyan-400 outline-none focus:border-cyan-500/50 transition-all capitalize"
                        >
                            <option value="All">All Assets</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
                        {loading ? (
                            <div className="p-4 text-center opacity-50 text-xs">Loading...</div>
                        ) : activeCategory === 'Virtual Geometries' ? (
                            ['box', 'sphere', 'tetrahedron', 'cylinder', 'cone', 'torus', 'torusKnot', 'icosahedron', 'octahedron', 'dodecahedron', 'ring', 'plane'].map(geo => (
                                <button
                                    key={geo}
                                    onClick={() => { setSelectedGeometry(geo); setSelectedAsset(null); }}
                                    className={`text-left px-3 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${selectedGeometry === geo ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 border border-transparent text-white/50 hover:bg-white/10 hover:text-white'}`}
                                >
                                    {geo} Mesh
                                </button>
                            ))
                        ) : (
                            filteredAssets.map(asset => {
                                const filename = asset.split('/').pop()?.split('.')[0] || 'Unknown';
                                return (
                                    <button
                                        key={asset}
                                        onClick={() => { setSelectedAsset(asset); setSelectedGeometry(null); }}
                                        className={`text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center gap-3 ${selectedAsset === asset ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 border border-transparent text-white/50 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <div className="w-6 h-6 bg-black rounded flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                                            <img src={'/' + asset} className="max-w-full max-h-full object-contain pixelated" loading="lazy" />
                                        </div>
                                        <span className="truncate">{filename}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane: Preview / Drag Area */}
                <div className="flex-1 bg-slate-900/20 relative flex items-center justify-center p-6 lg:p-12 overflow-hidden shadow-inner inset-shadow">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    
                    {selectedAsset ? (
                        <motion.div key={"asset-" + selectedAsset} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full h-full">
                            <div 
                                draggable 
                                onDragStart={(e: any) => handleTextureDragStart(e)}
                                className="w-full h-full border-2 border-dashed border-cyan-500/30 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-grab active:cursor-grabbing hover:bg-cyan-500/5 hover:border-cyan-400 transition-all relative overflow-hidden group bg-black/40 shadow-xl"
                            >
                                <img src={'/' + selectedAsset} className="max-w-[75%] max-h-[75%] object-contain pixelated drop-shadow-2xl group-hover:scale-[1.05] transition-transform duration-500" />
                                <div className="absolute inset-x-0 bottom-8 flex justify-center">
                                    <span className="bg-cyan-900/80 text-cyan-300 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md border border-cyan-500/30">
                                        Grab Environment Texture
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ) : selectedGeometry ? (
                        <motion.div key={"geo-" + selectedGeometry} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full h-full">
                            <div 
                                draggable 
                                onDragStart={(e: any) => handleGeometryDragStart(e)}
                                className="w-full h-full border-2 border-dashed border-cyan-500/30 rounded-3xl flex flex-col items-center justify-center gap-6 cursor-grab active:cursor-grabbing hover:bg-cyan-500/5 hover:border-cyan-400 transition-all relative overflow-hidden group bg-black/40 shadow-xl"
                            >
                                <Box size={100} className="text-cyan-400 opacity-60 group-hover:scale-110 group-hover:opacity-100 transition-all drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]" />
                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-md z-10">{selectedGeometry} Mesh</h3>
                                <div className="absolute inset-x-0 bottom-8 flex justify-center z-10">
                                    <span className="bg-cyan-900/80 text-cyan-300 px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md border border-cyan-500/30">
                                        Grab 3D Primitive
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-center opacity-30 flex flex-col items-center gap-4">
                            <Box size={48} className="opacity-50" />
                            <p className="text-xs uppercase tracking-widest font-mono">Select Payload<br/>to Preview & Manifest</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
