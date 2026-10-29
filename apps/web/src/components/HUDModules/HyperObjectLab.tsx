import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Package, Box, Layers, Plus, Trash2,
    ChevronUp, ChevronDown, Upload, Save,
    Move, Maximize, RotateCw, Image as ImageIcon,
    AlertCircle, Sparkles, Zap, Brain, Download, 
    Grid as GridIcon, Scissors
} from 'lucide-react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Grid } from '@react-three/drei';
import { GLTFExporter } from 'three-stdlib';
import { Copy } from 'lucide-react';

const PropSlider: React.FC<{ label: string, value: number, min: number, max: number, step?: number, onChange: (val: number) => void }> = ({ label, value, min, max, step = 0.1, onChange }) => (
    <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">{label}</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-400/10 px-2 py-0.5 rounded">{value.toFixed(2)}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))} 
            className="w-full accent-cyan-500 h-1 bg-white/5 rounded-full appearance-none cursor-pointer hover:bg-white/10 transition-colors" 
        />
    </div>
);

interface AssetLayer {
    id: string;
    url: string;
    opacity: number;
    scale: number;
    offsetX: number;
    offsetY: number;
    rotation: number;
    visible: boolean;
    name: string;
}

interface SavedAsset {
    id: string;
    name: string;
    layers: AssetLayer[];
    thumbnail: string;
    createdAt: number;
}

interface AssetLabProps {
    onClose: () => void;
    onManifest: (config: {
        path?: string;
        layers?: AssetLayer[];
        scale: number;
        animation: 'bob' | 'none';
        geometryType?: string;
        uvOffset?: [number, number];
        uvScale?: [number, number];
        rotationSpeed?: number;
        color?: string;
        textureUrl?: string;
    }) => void;
    selectedPropId?: string | null;
    setSelectedPropId: (id: string | null) => void;
    transformMode: 'translate' | 'scale';
    setTransformMode: (mode: 'translate' | 'scale') => void;
    onPropAction: (action: string, payload: any) => void;
    dynamicProps?: any[];
}

export const HyperObjectLab: React.FC<AssetLabProps> = ({ 
    onClose, onManifest, 
    selectedPropId, setSelectedPropId, 
    transformMode, setTransformMode, 
    onPropAction,
    dynamicProps
}) => {
    const [activeTab, setActiveTab] = useState<'library' | 'external' | 'factory' | 'importer' | 'manipulator' | 'semantic' | 'geometric' | 'palette'>(selectedPropId ? 'manipulator' : 'library');
    const [assets, setAssets] = useState<string[]>([]);
    const [savedAssets, setSavedAssets] = useState<SavedAsset[]>([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    // Factory State
    const [layers, setLayers] = useState<AssetLayer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [assetName, setAssetName] = useState('New Composite Asset');
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Semantic / Emulation State
    const [subject, setSubject] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [semanticTraits, setSemanticTraits] = useState<Record<string, string>>({
        body: '', legs: '', torso: '', hair: '', feet: '',
        hat: '', head: '', eyes: '', facial: '', shoulders: '',
        arms: '', weapon: ''
    });

    const [activeRecipe, setActiveRecipe] = useState<'CRYSTAL_SPIRE' | 'CYBER_FRAME' | 'NEBULA_ORG' | 'VOID_CUBE' | 'DIO_BOX' | 'DIO_SPHERE' | 'DIO_CYLINDER' | 'DIO_TORUS' | 'DIO_PYRAMID'>('DIO_BOX');
    const [geometricSeed, setGeometricSeed] = useState(Date.now());
    const [dioTextureUrl, setDioTextureUrl] = useState('/assets/lpc/Exterior%20Tiles.png');
    const [dioUvOffset, setDioUvOffset] = useState<[number, number]>([0, 0]);
    const [dioUvScale, setDioUvScale] = useState<[number, number]>([2, 2]);
    const [dioRotationSpeed, setDioRotationSpeed] = useState(0.5);
    const geometricSceneRef = useRef<THREE.Group>(null);

    // Sprite Cutter State
    const [sliceConfig, setSliceConfig] = useState({ rows: 4, cols: 4, detectBorders: true });
    const [sourceImage, setSourceImage] = useState<string | null>(null);
    const [processedChips, setProcessedChips] = useState<{ id: number, url: string }[]>([]);
    const [isSlicing, setIsSlicing] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadAssets = async () => {
            try {
                const res = await fetch('/assets/lpc/asset_manifest.json');
                const data = await res.json();
                setAssets(data);

                // Load saved library from localStorage
                const saved = localStorage.getItem('myos_asset_library');
                if (saved) {
                    setSavedAssets(JSON.parse(saved));
                }
            } catch (err) {
                console.error("Lab initialization failed:", err);
            } finally {
                setLoading(false);
            }
        };
        loadAssets();
    }, []);

    // Save Library
    useEffect(() => {
        if (savedAssets.length > 0) {
            localStorage.setItem('myos_asset_library', JSON.stringify(savedAssets));
        }
    }, [savedAssets]);

    // Separate standard LPC layers from external 2D sprites
    const lpcAssets = useMemo(() => {
        return assets.filter((a: string) => {
            const path = a.replace(/\\/g, '/');
            const parts = path.replace('assets/lpc/', '').split('/');
            // If it's in a subfolder (parts.length > 1), it's highly likely an LPC factory part
            return parts.length > 1; 
        });
    }, [assets]);

    // Slicing Engine
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => setSourceImage(event.target?.result as string);
        reader.readAsDataURL(file);
    };

    const processSlices = useCallback(() => {
        if (!sourceImage) return;
        setIsSlicing(true);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = sourceImage;
        img.onload = () => {
            const { rows, cols } = sliceConfig;
            const chips: { id: number, url: string, uvOffset: [number, number], uvScale: [number, number] }[] = [];

            // UV math: 0,0 is bottom-left in Three.js, but top-left in Canvas.
            // Pixel size of one cell
            const cellW = 1 / cols;
            const cellH = 1 / rows;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;
                    
                    const cw = img.width / cols;
                    const ch = img.height / rows;
                    canvas.width = cw;
                    canvas.height = ch;
                    ctx.drawImage(img, c * cw, r * ch, cw, ch, 0, 0, cw, ch);
                    
                    chips.push({ 
                        id: r * cols + c, 
                        url: canvas.toDataURL(),
                        // UV Offset: x: c/cols, y: 1 - (r+1)/rows (Three.js flips Y)
                        uvOffset: [c * cellW, 1 - (r + 1) * cellH],
                        uvScale: [cellW, cellH]
                    });
                }
            }
            setProcessedChips(chips);
            setIsSlicing(false);
        };
    }, [sourceImage, sliceConfig]);

    // Categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        lpcAssets.forEach((a: string) => {
            const parts = a.replace(/\\/g, '/').replace('assets/lpc/', '').split('/');
            if (parts.length > 1) cats.add(parts[0]);
        });
        return ['All', ...Array.from(cats).sort()];
    }, [lpcAssets]);

    const filteredAssets = useMemo(() => {
        return lpcAssets.filter((a: string) => {
            const path = a.replace(/\\/g, '/');
            const parts = path.replace('assets/lpc/', '').split('/');
            const cat = parts.length > 1 ? parts[0] : 'Uncategorized';

            if (activeCategory !== 'All' && cat !== activeCategory) return false;
            if (filter && !path.toLowerCase().includes(filter.toLowerCase())) return false;
            return path.endsWith('.png');
        }).slice(0, 100);
    }, [lpcAssets, filter, activeCategory]);

    // Factory Logic
    const addLayer = (url: string, name: string) => {
        const newLayer: AssetLayer = {
            id: `layer-${Date.now()}`,
            url,
            name: name || 'Layer',
            opacity: 1,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0,
            visible: true
        };
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
        setActiveTab('factory');
    };

    const removeLayer = (id: string) => {
        setLayers(prev => prev.filter(l => l.id !== id));
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    const moveLayer = (id: string, dir: 'up' | 'down') => {
        const idx = layers.findIndex(l => l.id === id);
        if (idx === -1) return;
        const newLayers = [...layers];
        const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= layers.length) return;

        [newLayers[idx], newLayers[targetIdx]] = [newLayers[targetIdx], newLayers[idx]];
        setLayers(newLayers);
    };

    const updateLayer = (id: string, changes: Partial<AssetLayer>) => {
        setLayers(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
    };

    // Preview Rendering
    useEffect(() => {
        const canvas = previewCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background pattern for transparency
        const size = 10;
        for (let x = 0; x < canvas.width; x += size * 2) {
            for (let y = 0; y < canvas.height; y += size * 2) {
                ctx.fillStyle = '#111';
                ctx.fillRect(x, y, size, size);
                ctx.fillRect(x + size, y + size, size, size);
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x + size, y, size, size);
                ctx.fillRect(x, y + size, size, size);
            }
        }

        const loadAndDraw = async () => {
            // Draw in reverse (bottom layer first)
            for (const layer of [...layers].reverse()) {
                if (!layer.visible) continue;

                try {
                    const img = new Image();
                    img.src = layer.url.startsWith('http') ? layer.url : (layer.url.startsWith('/') ? layer.url : `/${layer.url}`);
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                    });

                    ctx.save();
                    ctx.globalAlpha = layer.opacity;

                    const centerX = canvas.width / 2 + layer.offsetX;
                    const centerY = canvas.height / 2 + layer.offsetY;

                    ctx.translate(centerX, centerY);
                    ctx.rotate((layer.rotation * Math.PI) / 180);
                    ctx.scale(layer.scale, layer.scale);

                    // Draw centered
                    ctx.drawImage(img, -img.width / 2, -img.height / 2);
                    ctx.restore();
                } catch (e) {
                    console.warn("Failed to draw layer:", layer.url);
                }
            }
        };

        loadAndDraw();
    }, [layers]);

    const handleSaveAsset = () => {
        const canvas = previewCanvasRef.current;
        if (!canvas || layers.length === 0) return;

        const thumbnail = canvas.toDataURL('image/png');
        const newAsset: SavedAsset = {
            id: `asset-${Date.now()}`,
            name: assetName,
            layers: [...layers],
            thumbnail,
            createdAt: Date.now()
        };

        setSavedAssets(prev => [newAsset, ...prev]);
        addLayerToLibraryFeedback();
    };

    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const addLayerToLibraryFeedback = () => {
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 2000);
    };

    const handleManifestComposite = () => {
        if (layers.length === 0) return;
        onManifest({
            path: '',
            layers: [...layers],
            scale: 2.5,
            animation: 'none'
        });
        onClose();
    };

    const lpcManifest = useMemo(() => {
        const manifest: Record<string, string[]> = {};
        lpcAssets.forEach((asset: string) => {
            const parts = asset.replace(/\\/g, '/').replace('assets/lpc/', '').split('/');
            if (parts.length > 1) {
                const layer = parts[0];
                if (!manifest[layer]) manifest[layer] = [];
                manifest[layer].push('/' + asset);
            }
        });
        return manifest;
    }, [lpcAssets]);

    const semanticGenome = useMemo(() => {
        const genome: any = {};
        Object.entries(semanticTraits).forEach(([layer, traitText]) => {
            if (!traitText) return;
            const searchTokens = traitText.toLowerCase().split(/[ ,._-]+/).filter(t => t.length > 2);
            const options = lpcManifest[layer] || [];
            if (options.length === 0) return;

            let bestMatch = options[0];
            let highestScore = -1;

            options.forEach((opt: string) => {
                let score = 0;
                const path = opt.toLowerCase();
                searchTokens.forEach(token => {
                    if (path.includes(token)) score += 10;
                });
                if (score > highestScore) {
                    highestScore = score;
                    highestScore = score;
                    bestMatch = opt;
                }
            });
            genome[layer] = bestMatch;
        });
        return genome;
    }, [semanticTraits, lpcManifest]);

    const handleSemanticResearch = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            const lowerSubject = subject.toLowerCase();
            if (lowerSubject.includes('rick') && lowerSubject.includes('sanchez')) {
                setSemanticTraits({
                    body: 'pale thin old man male',
                    legs: 'brown pants coffee',
                    torso: 'white coat lab teal shirt',
                    hair: 'bluish spiky messy hair',
                    feet: 'black slippers shoes',
                    hat: 'none',
                    head: 'male old humanoid nose straight',
                    eyes: 'bored blue eyes',
                    facial: 'none',
                    shoulders: 'none',
                    arms: 'long sleeves white',
                    weapon: 'none'
                });
            } else if (lowerSubject.includes('vader')) {
                setSemanticTraits({
                    body: 'black suit armored',
                    legs: 'black leggings plated',
                    torso: 'black chestplate control panel',
                    hair: 'none',
                    feet: 'black heavy boots',
                    hat: 'black samurai helmet mask',
                    head: 'mask respirator skull',
                    eyes: 'red lenses glow',
                    facial: 'none',
                    shoulders: 'black pauldrons',
                    arms: 'black gauntlets',
                    weapon: 'red laser sword lightsaber'
                });
            }
            setIsAnalyzing(false);
        }, 800);
    };

    const handleApplySemantic = () => {
        const genomeLayers: AssetLayer[] = Object.entries(semanticGenome).map(([layer, url]) => ({
            id: `sem-${layer}-${Date.now()}`,
            url: url as string,
            name: `${layer} (Semantic)`,
            visible: true,
            opacity: 1,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            rotation: 0
        }));
        setLayers(genomeLayers);
        setActiveTab('factory');
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-[90vw] h-[85vh] bg-black/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/20"
        >

            {/* Nav Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-2xl ring-1 ring-cyan-500/30">
                        <Sparkles size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white uppercase">HyperObject Lab</h2>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase border border-cyan-500/20">Manifestation & Manipulation Engine</span>
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-mono font-bold tracking-widest uppercase border border-purple-500/20 flex items-center gap-1">
                                <Box size={10} /> {loading ? "Syncing..." : "Online"}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 hover:bg-white/10 rounded-2xl text-white/40 hover:text-white transition-all hover:rotate-90"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 bg-black/40 border-b border-white/5 overflow-x-auto custom-scrollbar no-scrollbar">
                {[
                    { id: 'library', label: 'Vault', icon: <Package size={16} /> },
                    { id: 'palette', label: 'Scene Palette', icon: <GridIcon size={16} /> },
                    { id: 'geometric', label: 'D.I.O. / Geometric', icon: <Box size={16} /> },
                    { id: 'importer', label: 'Sprite Cutter', icon: <Upload size={16} /> },
                    { id: 'manipulator', label: 'Manipulator', icon: <Move size={16} /> },
                    { id: 'factory', label: 'Composite Engine', icon: <Layers size={16} /> },
                    { id: 'semantic', label: 'Semantic Engine', icon: <Brain size={16} /> },
                ].map((tab: any) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shrink-0
                            ${activeTab === tab.id
                                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                                : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeTab === 'library' && (
                        <motion.div
                            key="library"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto custom-scrollbar"
                        >

                            <div className="flex flex-col gap-6 border-b border-white/10 pb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                                            <Package size={24} className="text-cyan-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">HyperObject Vault</h3>
                                            <p className="text-[10px] font-mono text-cyan-400 opacity-60 mt-1 uppercase tracking-widest">Aetherial Library // Shards & Composites</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                                            <input 
                                                value={filter}
                                                onChange={e => setFilter(e.target.value)}
                                                placeholder="Search Vault..."
                                                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/20 w-64 focus:border-cyan-500/50 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                    {categories.map((cat: string) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border
                                                ${activeCategory === cat 
                                                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                                    : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 pb-20">
                                {savedAssets.map(saved => (
                                    <motion.div
                                        key={saved.id}
                                        layoutId={saved.id}
                                        className="group bg-black border border-cyan-500/20 rounded-[2rem] p-4 flex flex-col gap-3 hover:border-cyan-500/50 transition-all cursor-pointer shadow-2xl relative overflow-hidden"
                                    >

                                        <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 p-4 ring-1 ring-white/5 ring-inset">
                                            <img src={saved.thumbnail} className="max-w-full max-h-full object-contain pixelated drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" alt="" />
                                            <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4 backdrop-blur-md">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onManifest({ layers: saved.layers, scale: 2.5, animation: 'none' });
                                                        onClose();
                                                    }}
                                                    className="w-full py-2 bg-cyan-500 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                                >
                                                    Spawn Entity
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setLayers(saved.layers);
                                                        setAssetName(saved.name);
                                                        setActiveTab('factory');
                                                    }}
                                                    className="w-full py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                                                >
                                                    Edit Composite
                                                </button>
                                            </div>
                                        </div>
                                        <div className="px-1 text-center">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate">{saved.name}</h4>
                                            <p className="text-[8px] text-cyan-400/40 font-mono mt-1 uppercase">Composite • {saved.layers.length} Layers</p>
                                        </div>
                                    </motion.div>
                                ))}
                                {filteredAssets.map((asset) => (
                                    <motion.div 
                                        key={asset}
                                        onClick={() => {
                                            if (activeTab === 'library' && activeRecipe.startsWith('DIO_')) {
                                                setDioTextureUrl('/' + asset);
                                            } else {
                                                addLayer('/' + asset, asset.split('/').pop()?.split('.')[0] || 'Shard');
                                            }
                                        }}
                                        className="group bg-white/2 border border-white/5 rounded-[2rem] p-4 flex flex-col gap-3 hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer relative overflow-hidden text-center"
                                    >

                                        <div className="aspect-square bg-slate-900/40 rounded-2xl overflow-hidden flex items-center justify-center p-4 relative">
                                            <img src={'/' + asset} className="max-w-full max-h-full object-contain pixelated group-hover:scale-110 transition-transform duration-500" alt="" loading="lazy" />
                                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDioTextureUrl('/' + asset);
                                                        setActiveTab('geometric');
                                                    }}
                                                    className="w-full py-1.5 bg-pink-500 text-black rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                >
                                                    Use as D.I.O. Skin
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        addLayer('/' + asset, asset.split('/').pop()?.split('.')[0] || 'Shard');
                                                        setActiveTab('factory');
                                                    }}
                                                    className="w-full py-1.5 bg-cyan-500 text-black rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                                >
                                                    Add to Stack
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-center px-1">
                                            <h4 className="text-[8px] font-black text-white/20 truncate w-full group-hover:text-white/60 transition-colors uppercase tracking-widest">{asset.split('/').pop()?.split('.')[0]}</h4>
                                            <Plus size={10} className="text-white/10 group-hover:text-cyan-400 transition-colors" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'palette' && (
                        <motion.div
                            key="palette"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col p-8 gap-8 overflow-hidden"
                        >

                            <div className="flex items-center justify-between border-b border-white/10 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-500/10 rounded-2xl border border-green-500/20">
                                        <GridIcon size={24} className="text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Scene Palette</h3>
                                        <p className="text-[10px] font-mono text-green-400 opacity-60 mt-1 uppercase tracking-widest">Active manifestations // Real-time Tracking</p>
                                    </div>
                                </div>
                                <div className="text-[10px] font-black font-mono text-green-400 uppercase tracking-widest bg-green-500/5 px-4 py-2 rounded-full border border-green-500/10">
                                    {dynamicProps?.length || 0} Dynamic Entities
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-20">
                                    {dynamicProps?.map((prop: any) => (
                                        <motion.div 
                                            key={prop.id} 
                                            layout
                                            className={`p-6 bg-black border rounded-[2rem] flex items-center gap-6 group transition-all cursor-pointer relative overflow-hidden
                                                ${selectedPropId === prop.id ? 'border-green-500/50 bg-green-500/5 shadow-2xl' : 'border-white/10 hover:border-white/20'}`}
                                            onClick={() => setSelectedPropId?.(prop.id)}
                                        >

                                            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/10 group-hover:border-green-500/30 transition-all relative overflow-hidden">
                                                {prop.textureUrl || prop.texturePath ? (
                                                    <img src={prop.textureUrl || prop.texturePath} className="w-full h-full object-contain pixelated p-2" alt="" />
                                                ) : (
                                                    prop.geometryType === 'sprite' ? <ImageIcon size={32} className="text-purple-400/20" /> : <Box size={32} className="text-cyan-400/20" />
                                                )}
                                                {selectedPropId === prop.id && <div className="absolute inset-0 border-2 border-green-500 rounded-3xl animate-pulse" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-white uppercase truncate tracking-tight">{prop.id}</span>
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase border ${prop.geometryType === 'sprite' ? 'text-purple-400 border-purple-500/30 bg-purple-500/5' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5'}`}>
                                                        {prop.geometryType}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6 mt-4">
                                                    <div className="space-y-1">
                                                        <span className="text-[8px] font-black text-white/20 uppercase block tracking-[0.2em]">Matrix Status</span>
                                                        <div className="text-[9px] font-mono text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                            <span className="text-green-400">XYZ:</span> {prop.rawPosition?.[0]?.toFixed(1)}, {prop.rawPosition?.[1]?.toFixed(1)}, {prop.rawPosition?.[2]?.toFixed(1)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPropId?.(prop.id);
                                                        setTransformMode?.('translate');
                                                        setActiveTab('manipulator');
                                                    }}
                                                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all hover:border-green-500/20"
                                                >
                                                    <Move size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onPropAction('delete', prop.id);
                                                    }}
                                                    className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {(!dynamicProps || dynamicProps.length === 0) && (
                                        <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-20 gap-6 grayscale">
                                            <GridIcon size={64} className="text-white/10 mb-4" />
                                            <div className="max-w-xs space-y-2">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-white">Substrate Awaiting Manifest</h4>
                                                <p className="text-[9px] font-mono leading-loose tracking-[0.2em]">Generate a 3D Mesh or Sprite to begin environment construction.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'factory' && (
                        <motion.div
                            key="factory"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex overflow-hidden bg-black/20"
                        >

                            <div className="w-80 border-r border-white/10 bg-black/40 flex flex-col overflow-hidden">
                                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                                    <h3 className="text-xs font-black uppercase tracking-[0.25em] text-white flex items-center gap-3">
                                        <Layers size={14} className="text-cyan-400" />
                                        Layer Stack
                                        <span className="ml-auto bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[9px] font-mono">{layers.length}</span>
                                    </h3>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-2">
                                    {layers.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 grayscale">
                                            <Layers size={48} className="mb-4 text-cyan-500/20" />
                                            <p className="text-[10px] font-mono uppercase tracking-widest">Aetherial Buffer Empty</p>
                                        </div>
                                    ) : (
                                        <AnimatePresence mode="popLayout">
                                            {layers.map((layer, idx) => (
                                                <motion.div
                                                    key={layer.id}
                                                    layout
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    onClick={() => setSelectedLayerId(layer.id)}
                                                    className={`group p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3
                                                        ${selectedLayerId === layer.id
                                                            ? 'bg-cyan-500/10 border-cyan-500/30'
                                                            : 'bg-white/2 border-white/5 hover:border-white/10'}`}
                                                >

                                                    <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-white/10 shrink-0">
                                                        <img src={layer.url} className="max-w-full max-h-full object-contain pixelated" alt="" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <h4 className="text-[10px] font-bold text-white truncate uppercase tracking-widest">{layer.name}</h4>
                                                        <div className="w-full bg-white/5 h-0.5 mt-2 rounded-full overflow-hidden">
                                                            <div className="h-full bg-cyan-500/40" style={{ width: `${layer.opacity * 100}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }} disabled={idx === 0} className="p-0.5 hover:text-white disabled:opacity-0"><ChevronUp size={12} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }} disabled={idx === layers.length - 1} className="p-0.5 hover:text-white disabled:opacity-0"><ChevronDown size={12} /></button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col relative bg-slate-900/[0.05]">
                                <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/40">
                                    <div className="flex-1 max-w-sm">
                                        <input
                                            type="text"
                                            value={assetName}
                                            onChange={(e) => setAssetName(e.target.value)}
                                            className="w-full bg-transparent border-none text-lg font-black text-white outline-none focus:ring-0 placeholder:text-white/10 uppercase tracking-tighter"
                                        />
                                        <div className="h-0.5 w-8 bg-cyan-500 mt-1" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSaveAsset} disabled={layers.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-white/10 disabled:opacity-30">
                                            <Save size={14} className={showSaveSuccess ? "text-emerald-400" : ""} />
                                            {showSaveSuccess ? 'Saved' : 'Save'}
                                        </button>
                                        <button onClick={handleManifestComposite} disabled={layers.length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-30 shadow-2xl">
                                            <Sparkles size={14} /> Manifest
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 relative flex items-center justify-center p-12 overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500 rounded-full animate-pulse" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-px bg-cyan-500" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-px bg-cyan-500" />
                                    </div>
                                    <div className="relative z-10 p-1 bg-white/5 rounded-[2rem] shadow-2xl">
                                        <canvas ref={previewCanvasRef} width={384} height={384} className="bg-black rounded-[1.8rem] w-[320px] h-[320px] lg:w-[384px] lg:h-[384px] image-render-pixel" />
                                    </div>

                                    {selectedLayerId && (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute right-6 top-6 bottom-6 w-64 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto custom-scrollbar ring-1 ring-white/10">
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400 border-b border-white/5 pb-4">Refraction Controls</h4>
                                            {layers.find(l => l.id === selectedLayerId) && (() => {
                                                const l = layers.find(layer => layer.id === selectedLayerId)!;
                                                return (
                                                    <div className="space-y-6">
                                                        <LayerControl label="Refraction" icon={<ImageIcon size={10} />}>
                                                            <input type="range" min="0" max="1" step="0.01" value={l.opacity} onChange={(e) => updateLayer(l.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-cyan-400 h-1 bg-white/5 rounded-full" />
                                                        </LayerControl>
                                                        <LayerControl label="Resonance" icon={<Maximize size={10} />}>
                                                            <input type="range" min="0.1" max="10" step="0.1" value={l.scale} onChange={(e) => updateLayer(l.id, { scale: parseFloat(e.target.value) })} className="w-full accent-cyan-400 h-1 bg-white/5 rounded-full" />
                                                        </LayerControl>
                                                        <LayerControl label="Angular" icon={<RotateCw size={10} />}>
                                                            <input type="range" min="0" max="360" value={l.rotation} onChange={(e) => updateLayer(l.id, { rotation: parseInt(e.target.value) })} className="w-full accent-cyan-400 h-1 bg-white/5 rounded-full" />
                                                        </LayerControl>
                                                        <button onClick={() => removeLayer(l.id)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"><Trash2 size={12} /> Remove</button>
                                                    </div>
                                                );
                                            })()}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'semantic' && (
                        <motion.div
                            key="semantic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex overflow-hidden bg-black/40"
                        >
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={20} className="text-cyan-400" />
                                        <span className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Subject Emulation</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <input 
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            placeholder="Subject Name (e.g. Cyberpunk Merchant)"
                                            className="flex-1 bg-white/2 border border-white/5 rounded-[2rem] px-8 py-5 text-white text-lg focus:outline-none focus:border-cyan-500/50 transition-all font-mono placeholder:text-white/5 shadow-inner"
                                        />
                                        <button 
                                            onClick={handleSemanticResearch}
                                            disabled={!subject || isAnalyzing}
                                            className="px-10 py-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center gap-3 border border-cyan-400/20"
                                        >
                                            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Zap size={20} />}
                                            Analyze
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pb-20">
                                    {Object.keys(semanticTraits).map(layer => (
                                        <div key={layer} className="space-y-2">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] ml-4">{layer}</span>
                                            <input 
                                                value={semanticTraits[layer]}
                                                onChange={e => setSemanticTraits({...semanticTraits, [layer]: e.target.value})}
                                                placeholder={`Tokens for ${layer}...`}
                                                className="w-full bg-white/2 border border-white/5 rounded-2xl px-6 py-4 text-xs text-cyan-100/60 focus:outline-none focus:border-cyan-500/30 transition-all font-mono"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="w-96 border-l border-white/10 p-12 flex flex-col gap-8 bg-black/60 backdrop-blur-3xl">
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] border-b border-white/5 pb-6">Mapping Resolution</h3>
                                <div className="flex-1 space-y-3 overflow-y-auto pr-4 custom-scrollbar">
                                    {Object.entries(semanticTraits).map(([layer]) => {
                                        const asset = semanticGenome[layer];
                                        return (
                                            <div key={layer} className="p-4 bg-white/2 rounded-2xl border border-white/5 flex flex-col gap-2 group hover:border-cyan-500/20 transition-all shadow-lg">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-cyan-400/40 transition-colors">{layer}</span>
                                                    {asset && <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">SYNCED</span>}
                                                </div>
                                                <div className="text-[10px] font-mono text-white/40 truncate bg-black/40 px-3 py-2 rounded-xl group-hover:text-cyan-400/60 transition-colors">
                                                    {asset ? asset.split('/').pop() : 'VOID'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleApplySemantic}
                                    disabled={Object.values(semanticGenome).length === 0}
                                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-cyan-900/40 border border-cyan-400/20 active:scale-[0.98]"
                                >
                                    Force Manifestation
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'geometric' && (
                        <motion.div
                            key="geometric"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex-1 flex overflow-hidden bg-black"
                        >
                            <div className="w-80 border-r border-white/10 p-12 flex flex-col gap-8 bg-black/60 backdrop-blur-3xl">
                                <div>
                                    <h3 className="text-xs font-black uppercase text-cyan-400 tracking-[0.5em] mb-2">3D Formulae</h3>
                                    <p className="text-[9px] font-mono text-white/20 uppercase">Procedural GLB Synthesis</p>
                                </div>
                                
                                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Recipes</div>
                                    {(['CRYSTAL_SPIRE', 'CYBER_FRAME', 'NEBULA_ORG', 'VOID_CUBE'] as const).map(recipe => (
                                        <button
                                            key={recipe}
                                            onClick={() => setActiveRecipe(recipe)}
                                            className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group
                                                ${activeRecipe === recipe 
                                                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 font-bold' 
                                                : 'bg-white/2 border-white/5 text-white/20 hover:border-white/20'}`}
                                        >
                                            <div className="text-[10px] uppercase tracking-[0.2em] relative z-10">{recipe.replace('_', ' ')}</div>
                                            {activeRecipe === recipe && <motion.div layoutId="recipe-blob" className="absolute inset-0 bg-cyan-500/5" />}
                                        </button>
                                    ))}

                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-6 mb-2 border-b border-white/5 pb-2">D.I.O. Primitives</div>
                                    {(['DIO_BOX', 'DIO_SPHERE', 'DIO_CYLINDER', 'DIO_TORUS', 'DIO_PYRAMID'] as const).map(prim => (
                                        <button
                                            key={prim}
                                            onClick={() => setActiveRecipe(prim)}
                                            className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group
                                                ${activeRecipe === prim 
                                                ? 'bg-pink-500/10 border-pink-500/40 text-pink-400 font-bold' 
                                                : 'bg-white/2 border-white/5 text-white/20 hover:border-white/20'}`}
                                        >
                                            <div className="text-[10px] uppercase tracking-[0.2em] relative z-10">{prim.replace('_', ' ')}</div>
                                            {activeRecipe === prim && <motion.div layoutId="recipe-blob" className="absolute inset-0 bg-pink-500/5" />}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setGeometricSeed(Date.now())}
                                    className="mt-auto py-4 bg-white/2 border border-white/5 rounded-2xl text-[9px] uppercase font-black tracking-widest text-white/30 hover:text-white/60 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap size={12} /> Regenerate Matrix
                                </button>
                            </div>

                            <div className="flex-1 relative">
                                <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
                                    <color attach="background" args={['#000000']} />
                                    <Stage environment="city" intensity={0.5}>
                                        <group ref={geometricSceneRef}>
                                            <ProceduralMesh 
                                                recipe={activeRecipe} 
                                                seed={geometricSeed} 
                                                dioTextureUrl={dioTextureUrl}
                                                dioUvOffset={dioUvOffset}
                                                dioUvScale={dioUvScale}
                                                dioRotationSpeed={dioRotationSpeed}
                                            />
                                        </group>
                                    </Stage>
                                    <Grid position={[0, -1, 0]} args={[20, 20]} sectionColor="#1e293b" cellColor="#0f172a" fadeDistance={25} />
                                    <OrbitControls makeDefault />
                                </Canvas>
                                
                                <div className="absolute top-12 right-12 flex flex-col gap-4">
                                    <button 
                                        onClick={() => {
                                            if (!geometricSceneRef.current) return;
                                            const exporter = new GLTFExporter();
                                            exporter.parse(geometricSceneRef.current, (result) => {
                                                const blob = new Blob([result as any], { type: 'application/octet-stream' });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${activeRecipe.toLowerCase()}.glb`;
                                                link.click();
                                                URL.revokeObjectURL(url);
                                            }, (err) => console.error(err), { binary: true });
                                        }}
                                        className="p-5 bg-black/60 border border-white/10 rounded-3xl text-white/40 hover:text-cyan-400 hover:border-cyan-500/40 transition-all shadow-2xl backdrop-blur-xl"
                                        title="Download GLB"
                                    >
                                        <Download size={24} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onManifest({ 
                                                geometryType: activeRecipe.startsWith('DIO_') ? activeRecipe.replace('DIO_', '').toLowerCase() : activeRecipe, 
                                                scale: 2.0, 
                                                animation: 'none',
                                                textureUrl: activeRecipe.startsWith('DIO_') ? dioTextureUrl : undefined,
                                                uvOffset: activeRecipe.startsWith('DIO_') ? dioUvOffset : undefined,
                                                uvScale: activeRecipe.startsWith('DIO_') ? dioUvScale : undefined,
                                                rotationSpeed: activeRecipe.startsWith('DIO_') ? dioRotationSpeed : undefined
                                            });
                                            onClose();
                                        }}
                                        className="px-8 py-5 bg-cyan-500 text-black rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Manifest to Scene
                                    </button>
                                </div>

                                {activeRecipe.startsWith('DIO_') && (
                                    <div className="absolute bottom-12 right-12 left-12 h-40 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex gap-8 items-center ring-1 ring-white/10 shadow-2xl overflow-x-auto custom-scrollbar no-scrollbar">
                                        <div className="flex-1 space-y-4 min-w-[300px]">
                                            <h4 className="text-[9px] font-black uppercase text-pink-400 tracking-widest">Draw-It-On Parameters</h4>
                                            <div className="grid grid-cols-4 gap-6">
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">UV Offset X: {dioUvOffset[0].toFixed(2)}</span>
                                                    <input type="range" min="-1" max="1" step="0.01" value={dioUvOffset[0]} onChange={e => setDioUvOffset([parseFloat(e.target.value), dioUvOffset[1]])} className="w-full accent-pink-500 h-1 bg-white/5 rounded-full" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">UV Offset Y: {dioUvOffset[1].toFixed(2)}</span>
                                                    <input type="range" min="-1" max="1" step="0.01" value={dioUvOffset[1]} onChange={e => setDioUvOffset([dioUvOffset[0], parseFloat(e.target.value)])} className="w-full accent-pink-500 h-1 bg-white/5 rounded-full" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">UV Scale: {dioUvScale[0].toFixed(2)}</span>
                                                    <input type="range" min="0.1" max="10" step="0.1" value={dioUvScale[0]} onChange={e => setDioUvScale([parseFloat(e.target.value), parseFloat(e.target.value)])} className="w-full accent-pink-500 h-1 bg-white/5 rounded-full" />
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[8px] font-bold text-white/40 uppercase">Rotate: {dioRotationSpeed.toFixed(2)}</span>
                                                    <input type="range" min="0" max="2" step="0.05" value={dioRotationSpeed} onChange={e => setDioRotationSpeed(parseFloat(e.target.value))} className="w-full accent-pink-500 h-1 bg-white/5 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-px h-full bg-white/10 mx-2" />
                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                             <span className="text-[8px] font-bold text-white/40 uppercase">Active Skin</span>
                                             <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                                                 <div className="w-8 h-8 bg-slate-900 rounded border border-white/10 flex items-center justify-center">
                                                     <img src={dioTextureUrl} className="max-w-full max-h-full object-contain pixelated" alt="" />
                                                 </div>
                                                 <span className="text-[10px] font-mono text-pink-400 truncate">{dioTextureUrl.split('/').pop()}</span>
                                             </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'importer' && (
                        <motion.div
                            key="importer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col p-12 gap-12 overflow-y-auto custom-scrollbar bg-black/40"
                        >
                            <div className="flex items-center justify-between border-b border-white/5 pb-8 bg-white/[0.02] p-8 rounded-[2rem]">
                                <div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                        <Scissors size={28} className="text-cyan-400" />
                                        Intelligent Sprite Cutter
                                    </h3>
                                    <p className="text-[10px] font-mono text-cyan-400/60 mt-2 uppercase tracking-[0.3em]">Automated Border Detection & Lattice Slicing</p>
                                </div>
                                <div className="flex gap-4">
                                    <label className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/40 cursor-pointer hover:bg-white/10 transition-all">
                                        Load Blueprint
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    </label>
                                    <button 
                                        onClick={processSlices}
                                        disabled={!sourceImage || isSlicing}
                                        className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 text-white rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl border border-cyan-400/20 active:scale-95 flex items-center gap-2"
                                    >
                                        {isSlicing ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Zap size={16} />}
                                        Process Matrix
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-12 flex-1 overflow-hidden">
                                <div className="col-span-4 space-y-8 overflow-y-auto pr-4 custom-scrollbar">
                                    <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-inner">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 border-b border-white/5 pb-6">Lattice Config</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black text-cyan-400/40 uppercase tracking-widest ml-2">Vertical (Rows)</span>
                                                <input type="number" min="1" max="24" value={sliceConfig.rows} onChange={e => setSliceConfig({...sliceConfig, rows: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-cyan-500/50 outline-none transition-all" />
                                            </div>
                                            <div className="space-y-3">
                                                <span className="text-[9px] font-black text-cyan-400/40 uppercase tracking-widest ml-2">Horizontal (Cols)</span>
                                                <input type="number" min="1" max="24" value={sliceConfig.cols} onChange={e => setSliceConfig({...sliceConfig, cols: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-cyan-500/50 outline-none transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    {sourceImage && (
                                        <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-4 flex flex-col items-center">
                                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-4">Source Preview</span>
                                            <img src={sourceImage} className="max-w-full h-auto rounded-lg border border-white/10 pixelated shadow-2xl" alt="" />
                                        </div>
                                    )}

                                    <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-4">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle size={16} className="text-amber-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Slicing Kernel</span>
                                        </div>
                                        <p className="text-[10px] text-amber-200/40 font-mono leading-relaxed uppercase">
                                            Algorithm V4.2 integrated // Ensure transparency channel is preserved for alpha-manifestation.
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-8 bg-black/60 border border-white/5 rounded-[3rem] p-6 shadow-2xl min-h-[500px] relative overflow-hidden ring-1 ring-white/5 flex flex-col">
                                     {processedChips.length > 0 ? (
                                         <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                                             {processedChips.map(chip => (
                                                 <div key={chip.id} className="group relative aspect-square bg-white/[0.02] border border-white/5 rounded-xl hover:border-cyan-500/40 transition-all flex items-center justify-center p-2 overflow-hidden">
                                                     <img src={chip.url} className="max-w-full max-h-full object-contain pixelated" alt="" />
                                                     <button 
                                                        onClick={() => {
                                                            onManifest({
                                                                textureUrl: sourceImage!,
                                                                uvOffset: (chip as any).uvOffset,
                                                                uvScale: (chip as any).uvScale,
                                                                scale: 1.5,
                                                                animation: 'none',
                                                                geometryType: 'sprite'
                                                            });
                                                            onClose();
                                                        }}
                                                        className="absolute inset-0 bg-cyan-600/90 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity"
                                                     >
                                                         <Plus size={16} className="text-white" />
                                                         <span className="text-[8px] font-black text-white uppercase">MANIFEST UV</span>
                                                     </button>
                                                 </div>
                                             ))}
                                         </div>
                                     ) : (
                                         <div className="flex-1 flex flex-col items-center justify-center text-center">
                                             <div className="absolute inset-0 opacity-[0.05] pointer-events-none scale-150" style={{ backgroundImage: 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%)', backgroundSize: '20px 20px' }} />
                                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
                                                <Scissors size={200} className="text-white" />
                                             </div>
                                             <div className="relative text-center grayscale opacity-20 group-hover:opacity-100 transition-opacity duration-700">
                                                 <ImageIcon size={80} className="mx-auto mb-6 text-cyan-400/40" />
                                                 <p className="text-xs font-black uppercase tracking-[0.5em] text-white/40">Canvas Buffer Empty</p>
                                             </div>
                                         </div>
                                     )}
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {activeTab === 'manipulator' && (
                        <motion.div
                            key="manipulator"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="flex-1 flex flex-col p-12 bg-black/60 backdrop-blur-3xl h-full overflow-y-auto custom-scrollbar"
                        >
                            <div className="mb-10 border-b border-white/5 pb-8 flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-cyan-400 flex items-center gap-3">
                                        <Move size={24} /> Spatial Prop Manipulator
                                    </h3>
                                    <p className="text-[10px] text-white/20 font-mono mt-2 uppercase tracking-[0.3em]">
                                        Coordinate Synchronization & Waveform Scaling
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-white/5 mx-6" />
                                <div className="flex items-center gap-3 bg-white/2 px-6 py-3 rounded-full border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Quantum Link Established</span>
                                </div>
                            </div>

                            {selectedPropId ? (() => {
                                const prop = dynamicProps?.find(p => p.id === selectedPropId);
                                if (!prop) return null;

                                return (
                                    <div className="flex-1 flex flex-col gap-8 overflow-y-auto pr-4 custom-scrollbar">
                                        <div className="bg-white/[0.03] border border-white/5 rounded-[3rem] p-10 flex flex-col gap-10 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                                                <Zap size={160} className="text-cyan-400" />
                                            </div>
                                            
                                            <div className="flex items-center justify-between relative z-10">
                                                <div className="space-y-4">
                                                    <h4 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">ID: {selectedPropId}</h4>
                                                    <div className="flex gap-3">
                                                        <span className="text-[10px] bg-cyan-500 text-black px-4 py-1.5 rounded-full font-black tracking-widest uppercase shadow-lg shadow-cyan-500/20">Spatial Synchronized</span>
                                                        <span className={`text-[10px] bg-white/5 text-white/40 px-4 py-1.5 rounded-full font-black tracking-widest uppercase border border-white/10`}>
                                                            {prop.geometryType?.toUpperCase()} MODULE
                                                        </span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedPropId(null)}
                                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase text-white/60 hover:text-white transition-all border border-white/10 shadow-2xl"
                                                >
                                                    Release Link
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 relative z-10">
                                                <button
                                                    onClick={() => setTransformMode('translate')}
                                                    className={`flex flex-col items-center justify-center gap-4 py-12 rounded-[2.5rem] border transition-all duration-300
                                                        ${transformMode === 'translate' 
                                                            ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)] scale-105' 
                                                            : 'bg-white/2 border-white/5 text-white/20 hover:bg-white/10 hover:text-white/40 hover:scale-[1.02]'}
                                                    `}
                                                >
                                                    <Move size={32} />
                                                    <span className="font-black uppercase text-xs tracking-[0.3em]">Transform Gizmo</span>
                                                </button>
                                                <button
                                                    onClick={() => setTransformMode('scale')}
                                                    className={`flex flex-col items-center justify-center gap-4 py-12 rounded-[2.5rem] border transition-all duration-300
                                                        ${transformMode === 'scale' 
                                                            ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)] scale-105' 
                                                            : 'bg-white/2 border-white/5 text-white/20 hover:bg-white/10 hover:text-white/40 hover:scale-[1.02]'}
                                                    `}
                                                >
                                                    <Maximize size={32} />
                                                    <span className="font-black uppercase text-xs tracking-[0.3em]">Matrix Scale</span>
                                                </button>
                                            </div>

                                            {/* Advanced Property Inspector */}
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10 bg-black/40 p-10 rounded-[3rem] border border-white/5 shadow-inner">
                                                <div className="space-y-8">
                                                    <h5 className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.4em] mb-6">Coordinate Modulation</h5>
                                                    <div className="space-y-6">
                                                        <PropSlider 
                                                            label="Altitude (Y)" 
                                                            min={-10} max={50} 
                                                            value={prop.rawPosition?.[1] || 0} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, rawPosition: [prop.rawPosition[0], val, prop.rawPosition[2]] })} 
                                                        />
                                                        <PropSlider 
                                                            label="Roll / Pitch / Yaw" 
                                                            min={0} max={Math.PI * 2} step={0.01}
                                                            value={prop.rotation?.[1] || 0} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, rotation: [0, val, 0] })} 
                                                        />
                                                        <PropSlider 
                                                            label="Global Scale" 
                                                            min={0.1} max={10} step={0.1}
                                                            value={prop.scale || 1} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, scale: val })} 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    <h5 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.4em] mb-6">Substrate UV Fine-Tuning</h5>
                                                    <div className="space-y-6">
                                                        <PropSlider 
                                                            label="UV Offset X" 
                                                            min={0} max={1} step={0.001}
                                                            value={prop.uvOffset?.[0] || 0} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, uvOffset: [val, prop.uvOffset?.[1] || 0] })} 
                                                        />
                                                        <PropSlider 
                                                            label="UV Offset Y" 
                                                            min={0} max={1} step={0.001}
                                                            value={prop.uvOffset?.[1] || 0} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, uvOffset: [prop.uvOffset?.[0] || 0, val] })} 
                                                        />
                                                        <PropSlider 
                                                            label="UV Repeat" 
                                                            min={0.1} max={5} step={0.1}
                                                            value={prop.uvScale?.[0] || 1} 
                                                            onChange={(val) => onPropAction('update', { id: prop.id, uvScale: [val, val] })} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 relative z-10">
                                                <button
                                                    onClick={() => onPropAction('impact', selectedPropId)}
                                                    className="flex-1 py-5 bg-cyan-600/10 border border-cyan-500/30 rounded-2xl text-xs font-black text-cyan-400 hover:bg-cyan-600/20 hover:text-cyan-200 transition-all flex items-center justify-center gap-3 shadow-xl"
                                                >
                                                    <Zap size={18} /> Surge Impact
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const copyId = `manifest-copy-${Date.now()}`;
                                                        onPropAction('duplicate', { id: selectedPropId, newId: copyId });
                                                        setSelectedPropId(copyId);
                                                    }}
                                                    className="flex-1 py-5 bg-white/2 border border-white/10 rounded-2xl text-xs font-black text-white/30 hover:bg-white/10 hover:text-white/60 transition-all flex items-center justify-center gap-3 shadow-xl"
                                                >
                                                    <Copy size={18} /> Duplicate Node
                                                </button>
                                                <button
                                                    onClick={() => onPropAction('delete', selectedPropId)}
                                                    className="flex-1 py-5 bg-red-600/10 border border-red-500/20 rounded-2xl text-xs font-black text-red-500/60 hover:bg-red-600/20 hover:text-red-400 transition-all flex items-center justify-center gap-3 shadow-xl"
                                                >
                                                    <Trash2 size={18} /> Dissolve Entity
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center gap-8">
                                    <div className="w-32 h-32 bg-white/[0.02] rounded-full border border-dashed border-white/10 flex items-center justify-center text-white/10 animate-spin-slow">
                                        <Package size={64} />
                                    </div>
                                    <div className="max-w-md space-y-4">
                                        <p className="text-lg font-black uppercase tracking-[0.5em] text-white/20">Idle Frequency</p>
                                        <p className="text-xs font-mono text-white/10 leading-loose uppercase">
                                            Select a manifest entity within the visual scene to initiate spatial synchronization. Waiting for data link...
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-cyan-950/20 border-t border-white/5 backdrop-blur-3xl">
                <p className="flex items-center justify-center gap-3 text-[9px] text-cyan-400/40 uppercase tracking-[0.4em] font-black italic">
                    <AlertCircle size={10} />
                    Core Substrate Engine v1.0.42 // Final Build Manifested // HyperObject Lab Ready
                </p>
            </div>
        </motion.div>
    );
};

const LayerControl: React.FC<{ label: string, icon: React.ReactNode, children: React.ReactNode }> = ({ label, icon, children }) => (
    <div className="group/control bg-white/2 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all">
        <div className="flex items-center gap-3 mb-4">
            <span className="p-2 bg-black/40 rounded-xl text-white/20 group-hover/control:text-cyan-400 transition-colors shadow-inner">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 group-hover/control:text-white/60 transition-colors">{label}</span>
        </div>
        {children}
    </div>
);

const ProceduralMesh: React.FC<{ 
    recipe: string, 
    seed: number,
    dioTextureUrl?: string,
    dioUvOffset?: [number, number],
    dioUvScale?: [number, number],
    dioRotationSpeed?: number
}> = ({ recipe, seed, dioTextureUrl, dioUvOffset, dioUvScale, dioRotationSpeed }) => {
    const mesh = useMemo(() => {
        const random = (offset = 0) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        switch (recipe) {
            case 'CRYSTAL_SPIRE':
                return (
                    <group>
                        {[0, 1, 2, 3].map(i => (
                            <mesh key={i} position={[0, i * 1.2, 0]} rotation={[0, random(i) * Math.PI, 0]} scale={[1 - i * 0.2, 0.8, 1 - i * 0.2]}>
                                <coneGeometry args={[1, 2, 6]} />
                                <meshStandardMaterial color="#06b6d4" roughness={0.05} metalness={1} emissive="#0ea5e9" emissiveIntensity={0.5} />
                            </mesh>
                        ))}
                        <pointLight position={[0, 4, 0]} color="#06b6d4" intensity={2} />
                    </group>
                );
            case 'CYBER_FRAME':
                return (
                    <group>
                        <mesh>
                            <icosahedronGeometry args={[2, 1]} />
                            <meshStandardMaterial color="#6366f1" wireframe transparent opacity={0.6} metalness={1} />
                        </mesh>
                        <mesh scale={0.8}>
                            <icosahedronGeometry args={[2, 0]} />
                            <meshStandardMaterial color="#4f46e5" metalness={1} roughness={0.1} emissive="#818cf8" emissiveIntensity={0.2} />
                        </mesh>
                    </group>
                );
            case 'NEBULA_ORG':
                return (
                    <group>
                        {[...Array(12)].map((_: any, i: number) => (
                            <mesh key={i} position={[random(i) * 3 - 1.5, random(i + 1) * 3 - 1.5, random(i + 2) * 3 - 1.5]} scale={random(i + 3) * 0.8 + 0.2}>
                                <sphereGeometry args={[0.5, 32, 32]} />
                                <meshStandardMaterial color={i % 2 === 0 ? "#c084fc" : "#e879f9"} roughness={0.2} metalness={0.5} transparent opacity={0.8} />
                            </mesh>
                        ))}
                    </group>
                );
            case 'VOID_CUBE':
                return (
                    <group>
                        <mesh>
                            <boxGeometry args={[2.5, 2.5, 2.5]} />
                            <meshStandardMaterial color="black" roughness={0} metalness={1} transparent opacity={0.95} />
                        </mesh>
                        <mesh scale={0.4}>
                            <sphereGeometry args={[1, 32, 32]} />
                            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={10} />
                        </mesh>
                        <pointLight color="white" intensity={5} distance={5} />
                    </group>
                );
            default: return null;
        }
    }, [recipe, seed]);

    // --- DIO ENHANCEMENT ---
    const [texture] = useTexture([recipe.startsWith('DIO_') ? (dioTextureUrl || '/assets/lpc/Exterior%20Tiles.png') : '/assets/lpc/Exterior%20Tiles.png']);
    if (texture) {
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        const offset = dioUvOffset || [0, 0];
        const scale = dioUvScale || [2, 2];
        texture.offset.set(offset[0], offset[1]);
        texture.repeat.set(scale[0], scale[1]);
    }

    if (recipe.startsWith('DIO_')) {
        const prim = recipe.replace('DIO_', '').toLowerCase();
        return (
            <mesh rotation={[0, seed * 0.001 * (dioRotationSpeed || 1), 0]}>
                {prim === 'box' && <boxGeometry />}
                {prim === 'sphere' && <sphereGeometry />}
                {prim === 'cylinder' && <cylinderGeometry />}
                {prim === 'torus' && <torusGeometry />}
                {prim === 'pyramid' && <coneGeometry args={[1, 1, 4]} />}
                <meshStandardMaterial map={texture} roughness={0.5} metalness={0} />
            </mesh>
        );
    }

    return <>{mesh}</>;
};

import { useTexture } from '@react-three/drei';
