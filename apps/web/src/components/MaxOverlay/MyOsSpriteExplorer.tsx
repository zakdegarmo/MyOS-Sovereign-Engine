import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Shield, Skull, Wand2, Box, Eye, Layers, ChevronRight, Trash2, RotateCcw } from 'lucide-react';

export interface MyOsSpriteAction {
    [actionKey: string]: string;
}

export interface MyOsSpriteEntry {
    id: string;
    name: string;
    category: 'monsters' | 'heroes' | 'props' | string;
    badge: string;
    badgeColor: string;
    description: string;
    tileSize: number;
    grid: { cols: number; rows: number };
    scale: number;
    defaultAction: string;
    actions: MyOsSpriteAction;
    pillarAlignment: string;
}

interface MyOsSpriteExplorerProps {
    selectedSpriteId: string;
    selectedAction: string;
    onSelectSprite: (sprite: MyOsSpriteEntry, action: string) => void;
    onSelectAction: (actionKey: string) => void;
    customSprites?: MyOsSpriteEntry[];
}

export const MyOsSpriteExplorer: React.FC<MyOsSpriteExplorerProps> = ({
    selectedSpriteId,
    selectedAction,
    onSelectSprite,
    onSelectAction,
    customSprites = []
}) => {
    const [manifest, setManifest] = useState<Record<string, MyOsSpriteEntry>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<'all' | 'golems' | 'chibis' | 'lpc' | 'monsters'>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [trashedIds, setTrashedIds] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('myos_trashed_sprites');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showTrashed, setShowTrashed] = useState(false);

    useEffect(() => {
        fetch('/textures/avatars/myos_sprites_manifest.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.sprites) {
                    setManifest(data.sprites);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to load MyOS sprites manifest:", err);
                setIsLoading(false);
            });
    }, []);

    const isGolem = (s: MyOsSpriteEntry) => {
        const str = `${s.id} ${s.name} ${s.badge} ${s.description} ${s.category}`.toLowerCase();
        return s.category === 'golems' ||
            str.includes('golem') ||
            str.includes('flesh') ||
            str.includes('einstein') ||
            str.includes('cyber_goliath') ||
            str.includes('frankie');
    };

    const isChibi = (s: MyOsSpriteEntry) => {
        const str = `${s.id} ${s.name} ${s.badge} ${s.description}`.toLowerCase();
        return str.includes('chibi') ||
            str.includes('sunlit_paladin') ||
            str.includes('moonlit_mage');
    };

    const isMonster = (s: MyOsSpriteEntry) => {
        const str = `${s.id} ${s.name} ${s.category}`.toLowerCase();
        return s.category === 'monsters' ||
            str.includes('mimic') ||
            str.includes('rust_monster') ||
            str.includes('displacer_beast') ||
            str.includes('monodrone') ||
            str.includes('moose_bot') ||
            str.includes('squirrel') ||
            str.includes('bee');
    };

    const isLpc = (s: MyOsSpriteEntry) => {
        return !isGolem(s) && !isChibi(s) && !isMonster(s);
    };

    const spriteList = useMemo(() => {
        const base = Object.values(manifest);
        let combined = [...base];
        if (customSprites && customSprites.length > 0) {
            const customMap = new Map(customSprites.map(s => [s.id, s]));
            combined = combined.map(s => customMap.has(s.id) ? customMap.get(s.id)! : s);
            for (const cs of customSprites) {
                if (!combined.some(s => s.id === cs.id)) {
                    combined.unshift(cs);
                }
            }
        }
        if (showTrashed) {
            return combined.filter(s => trashedIds.includes(s.id));
        }
        return combined.filter(s => !trashedIds.includes(s.id));
    }, [manifest, customSprites, trashedIds, showTrashed]);

    const handleTrash = (e: React.MouseEvent, spriteId: string, spriteName: string) => {
        e.stopPropagation();
        if (confirm(`Move "${spriteName}" to trash? You can view or restore it anytime.`)) {
            const nextTrashed = [...trashedIds, spriteId];
            setTrashedIds(nextTrashed);
            localStorage.setItem('myos_trashed_sprites', JSON.stringify(nextTrashed));
        }
    };

    const handleRestore = (e: React.MouseEvent, spriteId: string) => {
        e.stopPropagation();
        const nextTrashed = trashedIds.filter(id => id !== spriteId);
        setTrashedIds(nextTrashed);
        localStorage.setItem('myos_trashed_sprites', JSON.stringify(nextTrashed));
    };

    const filteredSprites = useMemo(() => {
        return spriteList.filter(sprite => {
            let matchesCategory = true;
            if (activeCategory === 'golems') {
                matchesCategory = isGolem(sprite);
            } else if (activeCategory === 'chibis') {
                matchesCategory = isChibi(sprite);
            } else if (activeCategory === 'lpc') {
                matchesCategory = isLpc(sprite);
            } else if (activeCategory === 'monsters') {
                matchesCategory = isMonster(sprite);
            }

            const matchesSearch = !searchQuery || 
                sprite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sprite.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sprite.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
                Object.keys(sprite.actions).some(act => act.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [spriteList, activeCategory, searchQuery]);

    const golemCount = useMemo(() => spriteList.filter(isGolem).length, [spriteList]);
    const chibiCount = useMemo(() => spriteList.filter(isChibi).length, [spriteList]);
    const lpcCount = useMemo(() => spriteList.filter(isLpc).length, [spriteList]);
    const monsterCount = useMemo(() => spriteList.filter(isMonster).length, [spriteList]);

    return (
        <div className="flex flex-col h-full bg-black/40 border-r border-white/10 overflow-hidden select-none">
            {/* Header info banner */}
            <div className="p-3 bg-gradient-to-r from-purple-950/40 via-cyan-950/30 to-slate-950/40 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">
                        MyOS 8-Way HD Roster
                    </span>
                </div>
                <span className="text-[9px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    256px HD Matrix
                </span>
            </div>

            {/* Segmented Category Filter: 4 Core Types + All */}
            <div className="grid grid-cols-5 p-1 gap-1 border-b border-white/10 bg-black/60">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all text-center flex items-center justify-center cursor-pointer ${
                        activeCategory === 'all'
                            ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/20'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <span>All ({spriteList.length})</span>
                </button>
                <button
                    onClick={() => setActiveCategory('golems')}
                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all text-center flex items-center justify-center cursor-pointer ${
                        activeCategory === 'golems'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold shadow-md shadow-amber-500/20'
                            : 'text-amber-400/70 hover:text-amber-300 hover:bg-white/5'
                    }`}
                >
                    <span>🗿 Golem ({golemCount})</span>
                </button>
                <button
                    onClick={() => setActiveCategory('chibis')}
                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all text-center flex items-center justify-center cursor-pointer ${
                        activeCategory === 'chibis'
                            ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white font-extrabold shadow-md shadow-pink-500/20'
                            : 'text-pink-400/70 hover:text-pink-300 hover:bg-white/5'
                    }`}
                >
                    <span>👶 Chibi ({chibiCount})</span>
                </button>
                <button
                    onClick={() => setActiveCategory('lpc')}
                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all text-center flex items-center justify-center cursor-pointer ${
                        activeCategory === 'lpc'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-extrabold shadow-md shadow-emerald-500/20'
                            : 'text-emerald-400/60 hover:text-emerald-300 hover:bg-white/5'
                    }`}
                >
                    <span>🎨 LPC ({lpcCount})</span>
                </button>
                <button
                    onClick={() => setActiveCategory('monsters')}
                    className={`py-1 px-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all text-center flex items-center justify-center cursor-pointer ${
                        activeCategory === 'monsters'
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-extrabold shadow-md shadow-purple-500/20'
                            : 'text-purple-400/60 hover:text-purple-300 hover:bg-white/5'
                    }`}
                >
                    <span>💀 Foes ({monsterCount})</span>
                </button>
            </div>

            {/* Search Input */}
            <div className="p-2.5 border-b border-white/10 bg-black/30">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
                    <Search size={14} className="text-cyan-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Search creatures, actions, tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-white/30 font-mono"
                    />
                </div>
            </div>

            {/* Creature Presets List */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-2">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500 text-xs font-mono animate-pulse">
                        Loading Sovereign 8-Way Sprites...
                    </div>
                ) : filteredSprites.length === 0 ? (
                    <div className="text-center py-12 text-slate-600 text-[10px] font-mono italic">
                        No 8-Way MyOS sprites match "{searchQuery}".
                    </div>
                ) : (
                    filteredSprites.map(sprite => {
                        const isSelected = selectedSpriteId === sprite.id;
                        const actionKeys = Object.keys(sprite.actions);

                        return (
                            <div
                                key={sprite.id}
                                className={`rounded-2xl border transition-all overflow-hidden ${
                                    isSelected
                                        ? 'bg-gradient-to-b from-cyan-950/50 via-slate-900/90 to-purple-950/40 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                                        : 'bg-slate-900/60 border-white/10 hover:bg-slate-900/90 hover:border-white/20'
                                }`}
                            >
                                <button
                                    onClick={() => {
                                        const defaultAct = sprite.actions[selectedAction] ? selectedAction : sprite.defaultAction;
                                        onSelectSprite(sprite, defaultAct);
                                    }}
                                    className="w-full p-3 text-left flex flex-col gap-1.5 group cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                                {sprite.name}
                                            </span>
                                            {sprite.category === 'monsters' ? (
                                                <Skull size={13} className="text-purple-400 shrink-0" />
                                            ) : (
                                                <Shield size={13} className="text-emerald-400 shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${sprite.badgeColor}`}>
                                                {sprite.badge}
                                            </span>
                                            {showTrashed ? (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleRestore(e, sprite.id)}
                                                    title="Restore this sprite"
                                                    className="p-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                                                >
                                                    <RotateCcw size={11} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleTrash(e, sprite.id, sprite.name)}
                                                    title="Trash this sprite attempt"
                                                    className="p-1 rounded-md opacity-25 hover:opacity-100 hover:bg-red-500/30 text-red-400 border border-transparent hover:border-red-500/40 transition-all cursor-pointer"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-[9px] text-slate-400 leading-relaxed font-sans line-clamp-2">
                                        {sprite.description}
                                    </p>

                                    <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-white/5">
                                        <span className="text-cyan-400/90">
                                            {sprite.tileSize}x{sprite.tileSize} Tile ({actionKeys.length} Actions)
                                        </span>
                                        <span className="uppercase tracking-widest text-slate-400">
                                            Pillar: <strong className="text-purple-300">{sprite.pillarAlignment}</strong>
                                        </span>
                                    </div>
                                </button>
                            </div>
                        );
                    })

                )}
            </div>

            {/* Trashed Sprites Bottom Bar */}
            {trashedIds.length > 0 && (
                <div className="p-2 border-t border-white/10 bg-black/60 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setShowTrashed(!showTrashed)}
                        className={`text-[9px] font-mono flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                            showTrashed
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                                : 'text-slate-400 hover:text-white border-white/10 hover:bg-white/5'
                        }`}
                    >
                        <Trash2 size={10} className={showTrashed ? 'text-amber-400' : 'text-slate-400'} />
                        <span>{showTrashed ? '← Back to Active Roster' : `Trashed Sprites (${trashedIds.length})`}</span>
                    </button>
                    {showTrashed && (
                        <button
                            type="button"
                            onClick={() => {
                                if (confirm("Restore all trashed sprites back to the active roster?")) {
                                    setTrashedIds([]);
                                    localStorage.setItem('myos_trashed_sprites', JSON.stringify([]));
                                }
                            }}
                            className="text-[8px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                        >
                            Restore All
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
