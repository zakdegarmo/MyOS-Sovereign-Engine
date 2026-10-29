import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronRight, ChevronDown, 
    Hash, ExternalLink, Box, Globe, Zap, FileText
} from 'lucide-react';
import { PILLARS, type Pillar } from '../../engine/RelationshipMatrix';
import { INTEGRATION_REGISTRY, type IntegrationDefinition } from '../../engine/IntegrationRegistry';
import { useOntologicalContext } from '../../council/OntologicalContext';

interface TreeNodeProps {
    label: string;
    depth: number;
    path: string; // The Symbol Path e.g. '⚹.🜔'
    description?: string;
    isApp?: boolean;
    hasChildren?: boolean;
    children?: React.ReactNode;
    onNavigate?: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ label, depth, path, description, isApp, hasChildren, children, onNavigate }) => {
    const [isExpanded, setIsExpanded] = useState(depth === 0); // Root is expanded by default
    const { activePath } = useOntologicalContext();
    
    const isActive = activePath === path.toLowerCase();
    const isParentOfActive = activePath?.startsWith(path.toLowerCase() + '.') ?? false;

    useEffect(() => {
        if (isParentOfActive) setIsExpanded(true);
    }, [isParentOfActive]);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        } else if (isApp || depth > 0) {
            onNavigate?.(path);
        }
    };

    return (
        <div className="flex flex-col">
            <div 
                onClick={handleClick}
                className={`flex items-center gap-2 py-2 px-3 rounded-xl cursor-pointer transition-all group
                    ${isApp ? 'hover:bg-cyan-500/10' : 'hover:bg-white/5'}
                    ${isActive ? 'bg-emerald-500/20 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)] border border-emerald-500/30' : 'border border-transparent'}
                `}
                style={{ marginLeft: `${depth * 14}px` }}
            >
                {hasChildren ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-500" />}
                    </div>
                ) : (
                    <div className="w-4 h-4 flex items-center justify-center">
                         {isApp ? <Box size={12} className="text-cyan-400" /> : <Hash size={12} className="text-slate-600" />}
                    </div>
                )}
                
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-mono uppercase tracking-tight transition-colors 
                             ${isActive ? 'text-emerald-300 font-bold' : isApp ? 'text-cyan-200' : 'text-slate-300'}
                             ${!isApp && !hasChildren ? 'text-slate-500' : ''}
                        `}>
                            {label}
                        </span>
                        {isApp && (
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-400/20 text-[7px] font-black text-cyan-400 uppercase tracking-widest">
                                App
                            </span>
                        )}
                    </div>
                    {description && (
                        <span className="text-[9px] font-mono text-slate-500 leading-tight group-hover:text-slate-400 transition-colors">
                            {description}
                        </span>
                    )}
                </div>

                {isActive && (
                    <div className="ml-auto flex items-center gap-2">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    </div>
                )}
                
                {isApp && !isActive && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} className="text-cyan-500/50" />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isExpanded && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const DynamicTOC: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
    const { setActivePath } = useOntologicalContext();

    // Group apps by their root symbol for the tree
    const appsByRoot = useMemo(() => {
        const groups: Record<string, IntegrationDefinition[]> = {};
        Object.values(INTEGRATION_REGISTRY).forEach(app => {
            const root = app.path.split('.')[0];
            if (!groups[root]) groups[root] = [];
            groups[root].push(app);
        });
        return groups;
    }, []);

    const handleNavigate = (symbolPath: string) => {
        const segments = symbolPath.split('.');
        const rootSymbol = segments[0];
        
        // This logic handles switching main Pillar Interfaces if needed
        // (Similar to previous implementation but using symbolPath)
        window.dispatchEvent(new CustomEvent('MYSTRA_JUMP_PATH', { detail: { path: symbolPath } }));
        setActivePath(symbolPath.toLowerCase());
        onNavigate?.(symbolPath);
    };

    return (
        <div className="w-full max-w-3xl bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl shadow-2xl pointer-events-auto mt-8">
            <div className="flex items-center justify-between mb-6 px-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                        <Globe size={18} className="text-rose-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-[0.3em]">Master_Table_Of_Contents</h3>
                        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">Fractal Genome v1.2.0 // Explorer Mode</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                     <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                        <Zap size={10} className="text-amber-500 animate-pulse" />
                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest text-shadow-glow">Index Stable</span>
                     </div>
                </div>
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                {/* 1. THE ROOT (OMNI) */}
                <TreeNode 
                    label="The Universal Root (Omni) // 🜋" 
                    depth={0} 
                    path="🜋"
                    description="The source of all potential and manifested code."
                    hasChildren
                >
                    {/* 2. PILLARS (Top Level Explorer) */}
                    {PILLARS.map(pillarName => {
                        // Map Pillar Name to Symbol via common lookup (Simplified here)
                        const symbolMap: Record<string, string> = {
                            'Self': '⚹', 'Thought': '☿', 'Logic': '🜔', 'Unity': '🝧',
                            'Existence': '🜄', 'Improvement': '🜏', 'Mastery': '☉',
                            'Resonance': '♀', 'Transcendence': '🜍', 'Omni': '🜋'
                        };
                        const symbol = symbolMap[pillarName];
                        const appsForThisPillar = appsByRoot[symbol] || [];

                        return (
                            <TreeNode 
                                key={pillarName}
                                label={`${pillarName} // ${symbol}`}
                                depth={1}
                                path={symbol}
                                hasChildren={appsForThisPillar.length > 0}
                                onNavigate={handleNavigate}
                            >
                                {/* 3. APPS (The Leaves) */}
                                {appsForThisPillar.map(app => (
                                    <TreeNode 
                                        key={app.id}
                                        label={app.name}
                                        description={app.description}
                                        depth={2}
                                        path={app.path}
                                        isApp
                                        onNavigate={handleNavigate}
                                    />
                                ))}
                            </TreeNode>
                        );
                    })}
                </TreeNode>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between px-3">
                <div className="flex items-center gap-4">
                    <div className="text-[9px] text-slate-500 font-mono flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                         TOTAL_APPS_INDEXED: {Object.keys(INTEGRATION_REGISTRY).length}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                         CORE_PILLARS: 10
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <FileText size={12} className="text-slate-600" />
                    <span className="text-[9px] text-slate-600 font-mono uppercase">Depth_Stable: 0.1.10</span>
                </div>
            </div>
        </div>
    );
};
