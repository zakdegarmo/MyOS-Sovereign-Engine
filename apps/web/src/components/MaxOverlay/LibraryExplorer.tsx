import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Book, Library, Hash, ArrowRight, Filter } from 'lucide-react';
import { getLibraryItems, searchLibrary } from '../../memory/libraryService';
import { DeweyTreeExplorer } from '../../Thought/components/Tutor/DeweyTreeExplorer';
import { getAtomByDewey } from '../../Omni/data/GeneticMapping';

interface LibraryExplorerProps {
    isOpen?: boolean;
    onClose?: () => void;
    onEntryClick?: (entry: any) => void;
    isInline?: boolean;
}

export const LibraryExplorer: React.FC<LibraryExplorerProps> = ({ isOpen, onClose, onEntryClick, isInline }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDewey, setSelectedDewey] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen || isInline) {
            refreshLibrary();
        }
    }, [isOpen, isInline]);

    const refreshLibrary = () => {
        let data = getLibraryItems();
        if (selectedDewey) {
            // Match exact or prefix (e.g., "500" matches "510.5")
            data = data.filter(item =>
                item.deweyCode.startsWith(selectedDewey) ||
                (selectedDewey.endsWith('00') && item.deweyCode.startsWith(selectedDewey[0]))
            );
        }
        setEntries(data);
    };

    useEffect(() => {
        if (!searchQuery) {
            refreshLibrary();
        } else {
            setEntries(searchLibrary(searchQuery));
        }
    }, [selectedDewey]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.trim() === "") {
            refreshLibrary();
        } else {
            setEntries(searchLibrary(query));
        }
    };

    const content = (
        <div className={`flex flex-col overflow-hidden ${isInline ? 'w-full h-full bg-transparent' : 'w-[800px] h-[650px] bg-black/95 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.6)] z-[10500] border-b-4 border-amber-500/50'}`}>
            {/* Header - Only show in modal mode */}
            {!isInline && (
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500 text-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                            <Library size={20} />
                        </div>
                        <div>
                            <h2 className="font-display font-bold text-sm tracking-widest text-amber-500">UNIVERSAL LIBRARY</h2>
                            <p className="text-[10px] text-white/40 font-mono tracking-tighter">ORCHESTRATOR RECORDS v2.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedDewey && (
                            <button
                                onClick={() => setSelectedDewey(null)}
                                className="text-[10px] font-mono text-amber-500/60 hover:text-amber-500 flex items-center gap-1 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10"
                            >
                                <X size={10} /> CLEAR FILTER: {selectedDewey}
                            </button>
                        )}
                        {onClose && (
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar: Dewey Tree */}
                <div className={`${isInline ? 'w-[250px]' : 'w-[300px]'} border-r border-white/10 flex flex-col bg-white/5 shrink-0`}>
                    <div className="p-3 border-b border-white/5 flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                        <Filter size={10} /> Taxonomy
                    </div>
                    <div className="flex-1 overflow-hidden p-2">
                        <DeweyTreeExplorer onSelectCode={setSelectedDewey} />
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
                    {/* Search Bar */}
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                                type="text"
                                placeholder="Search archives by title, content, or code..."
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-amber-500/50 transition-colors font-mono placeholder:text-white/20"
                            />
                        </div>
                        {isInline && selectedDewey && (
                            <div className="mt-2 flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedDewey(null)}
                                    className="text-[9px] font-mono text-amber-500/60 hover:text-amber-500 flex items-center gap-1 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10"
                                >
                                    <X size={8} /> {selectedDewey}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Entries List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {entries.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/10 space-y-4">
                                <Book size={48} className="opacity-10" />
                                <div className="text-center">
                                    <p className="text-[10px] font-mono uppercase tracking-widest">No entries found</p>
                                </div>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 ${isInline ? 'gap-3' : 'gap-4'}`}>
                                {entries.map((entry, idx) => {
                                    const atomMap = getAtomByDewey(entry.deweyCode);
                                    return (
                                        <motion.div
                                            layout
                                            key={entry.id || idx}
                                            onClick={() => onEntryClick?.(entry)}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-amber-500/30 transition-all group cursor-pointer hover:bg-white/10 active:scale-[0.98]"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors leading-tight pr-4">{entry.title}</h3>
                                                    {atomMap && (
                                                        <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-1 opacity-60 group-hover:opacity-100">
                                                            <span className="text-sm">{Array.from(atomMap.atom.id).slice(0, 1)}</span>
                                                            <span>GENETIC ATOM: {atomMap.atom.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono text-[9px] border border-amber-500/20 shrink-0">
                                                    <Hash size={10} />
                                                    {entry.deweyCode}
                                                </div>
                                            </div>

                                            <p className="text-xs text-white/50 line-clamp-2 leading-relaxed mb-4 font-mono">
                                                {entry.content}
                                            </p>

                                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {entry.pillarConnections?.map((pillar: string, i: number) => (
                                                        <span key={i} className="text-[8px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500/70 border border-amber-500/10 font-mono uppercase tracking-tighter">
                                                            {pillar}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button 
                                                    className="flex items-center gap-2 text-white/20 group-hover:text-amber-500 transition-colors text-[10px] font-mono group-hover:translate-x-1 duration-300"
                                                >
                                                    ACCESS <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (isInline) return content;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -20 }}
                    className="fixed top-24 left-10 z-[10500]"
                >
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

