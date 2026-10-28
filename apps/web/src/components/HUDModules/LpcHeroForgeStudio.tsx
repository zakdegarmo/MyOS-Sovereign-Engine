import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Shield, Sparkles, ChevronLeft, ChevronRight, Flag, 
    Download, RotateCw, Play, Pause, Check, Eye, Trash2, Sliders, Search, X, Copy
} from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SemanticAvatar } from '../Avatars/SemanticAvatar';
import { type AvatarGenome, type LpcAction } from '../../hooks/useAvatarCompositor';
import { useCouncil } from '../../council/CouncilContext';

export interface FlaggedAsset {
    id: string;
    layer: string;
    filename: string;
    notes: string;
    timestamp: string;
    genomeSnapshot: AvatarGenome;
}

interface LpcHeroForgeStudioProps {
    onClose?: () => void;
    onApplyToUser?: (genome: AvatarGenome) => void;
}

type StudioCategory = 'body' | 'head' | 'ears' | 'hair' | 'facial' | 'torso' | 'legs' | 'feet' | 'arms' | 'shoulders' | 'hat' | 'weapon' | 'offhand';

interface CategoryMeta {
    key: StudioCategory;
    label: string;
    icon: string;
    description: string;
}

const CATEGORIES: CategoryMeta[] = [
    { key: 'body', label: 'Anatomy & Skin', icon: '🧬', description: 'Body structure and skin tone variants' },
    { key: 'head', label: 'Species & Head', icon: '👤', description: 'Head shape, race, and facial contours' },
    { key: 'ears', label: 'Ears & Horns', icon: '🧝', description: 'Species ears (Elven, Dragon, Cat, Wolf, etc.)' },
    { key: 'hair', label: 'Hairstyle', icon: '💈', description: 'Hair cuts, braids, and extensions' },
    { key: 'facial', label: 'Facial Hair', icon: '🧔', description: 'Beards, mustaches, and face markings' },
    { key: 'torso', label: 'Chest Armor', icon: '🛡️', description: 'Shirts, tunics, chainmail, plate, robes' },
    { key: 'legs', label: 'Legs & Pants', icon: '👖', description: 'Pants, kilts, skirts, greaves' },
    { key: 'feet', label: 'Footwear', icon: '👢', description: 'Boots, shoes, sandals, plate boots' },
    { key: 'arms', label: 'Arm Guards', icon: '🥊', description: 'Sleeves, bracers, gauntlets' },
    { key: 'shoulders', label: 'Cloaks & Shoulders', icon: '🧥', description: 'Pauldrons, capes, cloaks' },
    { key: 'hat', label: 'Headwear & Helmets', icon: '🪖', description: 'Helmets, crowns, hoods, hats' },
    { key: 'weapon', label: 'Main Hand Weapon', icon: '⚔️', description: 'Swords, axes, bows, staves' },
    { key: 'offhand', label: 'Offhand & Shield', icon: '🛡️', description: 'Shields, torches, spell implements' },
];

const VELOCITY_MAP: Record<'D' | 'L' | 'R' | 'U', [number, number, number]> = {
    'D': [0, 0, 1],
    'U': [0, 0, -1],
    'R': [1, 0, 0],
    'L': [-1, 0, 0]
};

export const LpcHeroForgeStudio: React.FC<LpcHeroForgeStudioProps> = ({ onClose, onApplyToUser }) => {
    const { updateAgentGenome } = useCouncil();
    const [manifest, setManifest] = useState<Record<string, string[]>>({});
    const [isLoadingManifest, setIsLoadingManifest] = useState(true);

    // Active Selection State
    const [activeCategory, setActiveCategory] = useState<StudioCategory>('body');
    const [currentGenome, setCurrentGenome] = useState<AvatarGenome>({
        body: 'body_bodies_male.png',
        head: 'head_heads_human_male.png',
        ears: 'none',
        hair: 'adult_universal_hair_shortknot.png',
        facial: 'none',
        torso: 'lpcfemaleplatemail_0.png',
        legs: 'lpcfemaleplategreaves_0.png',
        feet: 'lpcfemalegoldenboots.png',
        arms: 'none',
        shoulders: 'none',
        hat: 'none',
        weapon: 'none',
        offhand: 'none'
    });

    // Preview Controls
    const [action, setAction] = useState<LpcAction>('idle');
    const [direction, setDirection] = useState<'U' | 'D' | 'L' | 'R'>('D');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedNotice, setCopiedNotice] = useState(false);

    // Flagged Assets State (Human-in-the-Loop)
    const [flaggedAssets, setFlaggedAssets] = useState<FlaggedAsset[]>(() => {
        try {
            const saved = localStorage.getItem('lpc_flagged_assets');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [flagModalOpen, setFlagModalOpen] = useState(false);
    const [flagNotes, setFlagNotes] = useState('');
    const [showFlagDrawer, setShowFlagDrawer] = useState(false);

    // Fetch LPC Asset Manifest
    useEffect(() => {
        const loadManifest = async () => {
            try {
                const res = await fetch('/textures/avatars/lpc/manifest.json');
                const data = await res.json();
                setManifest(data);
            } catch (err) {
                console.error("Failed to load /textures/avatars/lpc/manifest.json", err);
            } finally {
                setIsLoadingManifest(false);
            }
        };
        loadManifest();
    }, []);

    // Save Flagged Assets to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('lpc_flagged_assets', JSON.stringify(flaggedAssets));
        } catch (e) {
            console.error("Failed to persist flagged assets", e);
        }
    }, [flaggedAssets]);

    // Active category items list
    const activeList = useMemo(() => {
        const raw = manifest[activeCategory] || [];
        if (!searchQuery) return raw;
        return raw.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [manifest, activeCategory, searchQuery]);

    const activeAsset = currentGenome[activeCategory] || 'none';
    const currentIndex = activeList.indexOf(activeAsset);

    // Handler to select specific asset
    const handleSelectAsset = (layer: StudioCategory, filename: string) => {
        setCurrentGenome(prev => ({
            ...prev,
            [layer]: filename
        }));
    };

    // Sequential Cycler (Prev / Next)
    const handleCycle = (delta: number) => {
        if (activeList.length === 0) return;
        let nextIdx = currentIndex + delta;
        if (nextIdx < 0) nextIdx = activeList.length - 1;
        if (nextIdx >= activeList.length) nextIdx = 0;
        handleSelectAsset(activeCategory, activeList[nextIdx]);
    };

    // Flag Current Asset
    const handleAddFlag = () => {
        if (!activeAsset || activeAsset === 'none') return;
        const newFlag: FlaggedAsset = {
            id: `${activeCategory}_${Date.now()}`,
            layer: activeCategory,
            filename: activeAsset,
            notes: flagNotes || 'Alignment / visual issue flagged during HeroForge studio audit.',
            timestamp: new Date().toISOString(),
            genomeSnapshot: { ...currentGenome }
        };
        setFlaggedAssets(prev => [newFlag, ...prev]);
        setFlagNotes('');
        setFlagModalOpen(false);
    };

    const handleRemoveFlag = (id: string) => {
        setFlaggedAssets(prev => prev.filter(f => f.id !== id));
    };

    // Export Flagged List JSON
    const handleExportFlagsJSON = () => {
        const jsonStr = JSON.stringify(flaggedAssets, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lpc_flagged_assets_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Apply to Active Player Avatar
    const handleApplyToPlayer = () => {
        updateAgentGenome('user', {
            genome: currentGenome,
            pillarIdx: 0,
            hueShift: 0
        });
        if (onApplyToUser) onApplyToUser(currentGenome);
    };

    // Copy Genome JSON to Clipboard
    const handleCopyGenome = () => {
        navigator.clipboard.writeText(JSON.stringify(currentGenome, null, 2));
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl font-mono text-white select-none overflow-hidden">
            {/* Main Window Container */}
            <div className="relative flex flex-col w-full max-w-7xl h-[92vh] bg-[var(--color-surface,#0f172a)] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden">

                {/* --- HEADER BAR --- */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-cyan-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                            <User size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold tracking-wider text-cyan-300 flex items-center gap-2">
                                HEROFORGE LPC CHARACTER STUDIO
                                <span className="text-[10px] px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-sans uppercase">
                                    Human-in-Loop Vetting
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Sequential layer inspection & real-time LPC paperdoll compositing
                            </p>
                        </div>
                    </div>

                    {/* Header Action Controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFlagDrawer(!showFlagDrawer)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                flaggedAssets.length > 0
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                        >
                            <Flag size={14} className={flaggedAssets.length > 0 ? "text-amber-400" : ""} />
                            <span>Flagged Issues ({flaggedAssets.length})</span>
                        </button>

                        <button
                            onClick={handleCopyGenome}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition-all"
                        >
                            <Copy size={14} />
                            <span>{copiedNotice ? 'Copied!' : 'Copy Genome'}</span>
                        </button>

                        <button
                            onClick={handleApplyToPlayer}
                            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 rounded-lg text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                        >
                            <Check size={14} />
                            <span>Apply to 3D Player</span>
                        </button>

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-400 border border-slate-700 rounded-lg text-slate-400 transition-all"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                </div>

                {/* --- STUDIO BODY GRID --- */}
                <div className="grid grid-cols-12 flex-1 overflow-hidden">

                    {/* --- LEFT: HEROFORGE CATEGORY SIDEBAR --- */}
                    <div className="col-span-3 flex flex-col bg-slate-950/80 border-r border-cyan-500/20 overflow-hidden">
                        <div className="p-3 bg-slate-900/50 border-b border-slate-800/80">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                1. Select Layer Category
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {CATEGORIES.map(cat => {
                                const isSelected = activeCategory === cat.key;
                                const currentItem = currentGenome[cat.key] || 'none';
                                return (
                                    <button
                                        key={cat.key}
                                        onClick={() => {
                                            setActiveCategory(cat.key);
                                            setSearchQuery('');
                                        }}
                                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 border-cyan-500/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                                : 'bg-slate-900/30 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-base">{cat.icon}</span>
                                            <div className="truncate">
                                                <div className="text-xs font-bold truncate">{cat.label}</div>
                                                <div className="text-[9px] text-slate-500 truncate font-mono">
                                                    {currentItem.replace(/^[a-z]+_[a-z]+_/, '')}
                                                </div>
                                            </div>
                                        </div>
                                        {currentItem !== 'none' && (
                                            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- MIDDLE: LIVE VIEWPORT & CONTROLS --- */}
                    <div className="col-span-5 flex flex-col bg-slate-950/50 relative border-r border-cyan-500/20 overflow-hidden">
                        
                        {/* Viewport Top Bar: Animation & Direction Switcher */}
                        <div className="p-3 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                {(['idle', 'walk', 'slash', 'thrust', 'spellcast', 'bow', 'hurt'] as LpcAction[]).map(act => (
                                    <button
                                        key={act}
                                        onClick={() => setAction(act)}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                            action === act
                                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {act}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                {(['D', 'L', 'R', 'U'] as const).map(dir => (
                                    <button
                                        key={dir}
                                        onClick={() => setDirection(dir)}
                                        className={`w-6 h-6 rounded text-[10px] font-bold transition-all ${
                                            direction === dir
                                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {dir}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Live R3F/Canvas Viewport */}
                        <div className="flex-1 flex items-center justify-center relative p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/80 via-slate-950 to-black">
                            {/* Grid / Stage Backdrop */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                            <div className="relative w-full h-full flex items-center justify-center p-2 bg-slate-900/40 border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.1)] overflow-hidden">
                                <Canvas camera={{ position: [0, 0.8, 2.8], fov: 45 }}>
                                    <ambientLight intensity={1.8} />
                                    <directionalLight position={[5, 10, 5]} intensity={1.2} />
                                    <SemanticAvatar
                                        genome={currentGenome}
                                        pillarIndex={0}
                                        pillarName="user"
                                        action={action}
                                        velocity={VELOCITY_MAP[direction]}
                                        isNeoRetro={true}
                                    />
                                    <OrbitControls enableZoom={true} enablePan={false} minDistance={1.2} maxDistance={4} target={[0, 0.6, 0]} />
                                </Canvas>
                            </div>

                            {/* Floating Quick Action Overlay */}
                            <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <button
                                    onClick={() => setFlagModalOpen(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-xl text-xs font-bold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all active:scale-95"
                                >
                                    <Flag size={14} />
                                    <span>Flag Current Asset</span>
                                </button>
                            </div>
                        </div>

                        {/* Viewport Footer Info */}
                        <div className="p-3 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                            <span>Active Sprite Spec: <strong className="text-cyan-400">64x64 LPC (13x21 Grid)</strong></span>
                            <span>Action: <strong className="text-white uppercase">{action}</strong> | Facing: <strong className="text-white">{direction}</strong></span>
                        </div>
                    </div>

                    {/* --- RIGHT: ASSET CAROUSEL & HUMAN-IN-THE-LOOP VETTING --- */}
                    <div className="col-span-4 flex flex-col bg-slate-950/80 overflow-hidden">
                        
                        {/* Header & Search */}
                        <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                    2. Audit Assets: <span className="text-cyan-400">{CATEGORIES.find(c => c.key === activeCategory)?.label}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                    {activeList.length} items
                                </span>
                            </div>

                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Filter filenames..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>

                        {/* Sequential Asset Cycler Banner */}
                        <div className="p-3 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between gap-2">
                            <button
                                onClick={() => handleCycle(-1)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-all active:scale-95"
                                title="Previous Asset (Left Arrow)"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex-1 text-center min-w-0 px-2">
                                <div className="text-[10px] text-cyan-400 uppercase font-mono tracking-wider">
                                    [{currentIndex >= 0 ? currentIndex + 1 : 0} / {activeList.length}]
                                </div>
                                <div className="text-xs font-bold text-slate-200 truncate font-mono" title={activeAsset}>
                                    {activeAsset === 'none' ? 'None (Unequipped)' : activeAsset}
                                </div>
                            </div>

                            <button
                                onClick={() => handleCycle(1)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-all active:scale-95"
                                title="Next Asset (Right Arrow)"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Asset Grid / List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                            {/* "None" option */}
                            <button
                                onClick={() => handleSelectAsset(activeCategory, 'none')}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                                    activeAsset === 'none'
                                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-bold'
                                        : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                }`}
                            >
                                <span>🚫 None (Unequip Layer)</span>
                                {activeAsset === 'none' && <Check size={14} className="text-cyan-400" />}
                            </button>

                            {isLoadingManifest ? (
                                <div className="text-center py-10 text-xs text-slate-500 animate-pulse">
                                    Loading LPC manifest library...
                                </div>
                            ) : (
                                activeList.map(item => {
                                    const isSelected = activeAsset === item;
                                    const isFlagged = flaggedAssets.some(f => f.layer === activeCategory && f.filename === item);

                                    return (
                                        <button
                                            key={item}
                                            onClick={() => handleSelectAsset(activeCategory, item)}
                                            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between group ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 border-cyan-500/70 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                                                    : isFlagged
                                                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                                                        : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                                            }`}
                                        >
                                            <div className="truncate font-mono pr-2">
                                                {item}
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isFlagged && (
                                                    <span className="p-0.5 text-amber-400" title="Flagged for review">
                                                        <Flag size={12} />
                                                    </span>
                                                )}
                                                {isSelected && <Check size={14} className="text-cyan-400" />}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* --- FLAG ASSET MODAL --- */}
                <AnimatePresence>
                    {flagModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                                        <Flag size={16} /> Flag Problematic LPC Asset
                                    </h3>
                                    <button onClick={() => setFlagModalOpen(false)} className="text-slate-400 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                                    <div><span className="text-slate-500">Layer:</span> <strong className="text-cyan-400 uppercase">{activeCategory}</strong></div>
                                    <div><span className="text-slate-500">File:</span> <strong className="text-white font-mono">{activeAsset}</strong></div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Notes / Issue Description</label>
                                    <textarea
                                        value={flagNotes}
                                        onChange={e => setFlagNotes(e.target.value)}
                                        placeholder="e.g. Misaligned neck line, missing transparent background, 404 image load..."
                                        rows={3}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button
                                        onClick={() => setFlagModalOpen(false)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddFlag}
                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                    >
                                        Save Flag
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* --- FLAGGED DRAWER --- */}
                <AnimatePresence>
                    {showFlagDrawer && (
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 bottom-0 w-96 bg-slate-900/95 border-l border-amber-500/30 backdrop-blur-2xl z-40 p-4 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                    <Flag size={14} /> Flagged Issues Audit Log
                                </h3>
                                <button onClick={() => setShowFlagDrawer(false)} className="text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
                                {flaggedAssets.length === 0 ? (
                                    <div className="text-center py-12 text-xs text-slate-500 italic">
                                        No assets flagged yet. Click "Flag Current Asset" during your visual audit to report issues.
                                    </div>
                                ) : (
                                    flaggedAssets.map(flag => (
                                        <div key={flag.id} className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                                    {flag.layer}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveFlag(flag.id)}
                                                    className="text-slate-500 hover:text-rose-400"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>

                                            <div className="text-xs font-mono text-white font-bold break-all">
                                                {flag.filename}
                                            </div>

                                            <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                                                "{flag.notes}"
                                            </p>

                                            <button
                                                onClick={() => {
                                                    setCurrentGenome(flag.genomeSnapshot);
                                                    setActiveCategory(flag.layer as StudioCategory);
                                                }}
                                                className="w-full text-center py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-cyan-300 font-bold rounded border border-slate-700"
                                            >
                                                Load Genome Snapshot
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {flaggedAssets.length > 0 && (
                                <div className="pt-3 border-t border-slate-800">
                                    <button
                                        onClick={handleExportFlagsJSON}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl text-xs font-bold text-amber-300 transition-all"
                                    >
                                        <Download size={14} /> Export Flagged JSON
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};
