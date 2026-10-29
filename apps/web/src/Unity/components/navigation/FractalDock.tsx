import React, { useState } from 'react';
import type { GemId } from '@Omni/types';
import { PILLAR_MODULES, COUNCIL } from '@Omni/constants';
import type { PillarModule } from '@Omni/constants';
import { motion, AnimatePresence } from 'framer-motion';

interface FractalDockProps {
    parentId: GemId;
    activeModuleId?: string;
    onSelectModule: (moduleId: string) => void;
    position: { top: number; left: number };
}

export const FractalDock: React.FC<FractalDockProps> = ({ parentId, activeModuleId, onSelectModule, position }) => {
    const modules: PillarModule[] = PILLAR_MODULES[parentId] || [];
    const parentColor = COUNCIL[parentId]?.color || 'text-white';
    const [hoveredModule, setHoveredModule] = useState<string | null>(null);

    // Calculate dynamic style based on parent position
    const dockStyle = {
        top: `${position.top}px`,
        left: `${position.left}px`,
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute z-[60] flex flex-col items-start"
                style={dockStyle}
                onMouseLeave={() => setHoveredModule(null)}
            >
                {/* Connector Line (Vertical) */}
                <div className={`w-0.5 h-4 bg-white/20 ml-5 -mt-1`} />

                {/* Layer 2: Module List */}
                <div className="relative flex">
                    <div className="flex flex-col gap-1 p-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl shadow-xl min-w-[160px]">
                        {modules.map((mod) => (
                            <div
                                key={mod.id}
                                className="relative group"
                                onMouseEnter={() => setHoveredModule(mod.id)}
                            >
                                <button
                                    onClick={() => onSelectModule(mod.id)}
                                    className={`
                                        group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all
                                        ${activeModuleId === mod.id ? 'bg-white/10' : 'hover:bg-white/5'}
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    {activeModuleId === mod.id && (
                                        <div className={`absolute left-0 w-1 h-full rounded-r bg-current ${parentColor}`} />
                                    )}

                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold tracking-wide ${activeModuleId === mod.id ? parentColor : 'text-gray-300 group-hover:text-white'}`}>
                                            {mod.name}
                                        </span>
                                        <span className="text-[10px] text-white/40 truncate max-w-[120px]">
                                            {mod.description}
                                        </span>
                                    </div>

                                    {/* Fractal Branch Indicator */}
                                    {mod.genes && mod.genes.length > 0 && (
                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                </button>

                                {/* Layer 3: Gene Expansion (Horizontal) */}
                                {hoveredModule === mod.id && mod.genes && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        className="absolute left-[calc(100%+8px)] top-0 flex flex-col gap-1 p-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl min-w-[140px] z-[70]"
                                    >
                                        {/* Horizontal connector */}
                                        <div className="absolute top-4 -left-2 w-2 h-0.5 bg-white/20" />

                                        <div className="px-2 py-1 text-[9px] font-mono tracking-[0.2em] text-white/30 uppercase border-b border-white/5 mb-1">
                                            Genome
                                        </div>

                                        {mod.genes.map((gene) => (
                                            <button
                                                key={gene}
                                                className="px-3 py-1.5 text-xs text-left text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                                            >
                                                {gene}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
