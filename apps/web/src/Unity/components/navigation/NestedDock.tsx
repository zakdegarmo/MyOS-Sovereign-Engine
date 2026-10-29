import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOmniGraphStore } from '../../../Omni/stores/useOmniGraphStore';

interface DockItem {
    id: string;
    label: string;
    icon: React.ElementType | string;
    color: string;
    dot?: string;
}

interface NestedDockProps {
    items: DockItem[];
    activeIds: string[];
    onToggle: (id: string) => void;
    baseColor?: string;
    className?: string;
    position?: 'fixed' | 'absolute';
}

export const NestedDock: React.FC<NestedDockProps> = ({
    items,
    activeIds,
    onToggle,
    baseColor = '#ec4899',
    className = '',
    position = 'fixed'
}) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const { setTargetNode } = useOmniGraphStore();

    return (
        <div className={`${position === 'absolute' ? 'absolute inset-0 w-full' : 'fixed left-4 top-24 bottom-4'} z-[60] flex flex-col items-center gap-2 ${className} pointer-events-none`}>
            <div
                className="flex flex-col items-center gap-2 p-2 bg-black/60 backdrop-blur-md border rounded-2xl shadow-xl transition-colors duration-300 overflow-y-auto overflow-x-hidden no-scrollbar pointer-events-auto h-auto max-h-full"
                style={{ borderColor: `${baseColor}33` }}
            >
                {items.map((item) => {
                    const isActive = activeIds.includes(item.id);
                    const isHovered = hoveredId === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                onToggle(item.id);
                                if (item.dot) {
                                    setTargetNode(item.dot);
                                }
                            }}
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`
                                relative group flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                                ${isActive ? 'bg-white/10 ring-1 ring-white/20 scale-105' : 'hover:bg-white/5'}
                            `}
                        >
                            <div
                                className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 blur-md`}
                                style={{
                                    backgroundColor: item.color,
                                    opacity: isActive ? 0.3 : (isHovered ? 0.1 : 0)
                                }}
                            />

                            {typeof item.icon === 'string' ? (
                                <div
                                    style={{
                                        color: isActive ? '#fff' : item.color,
                                        filter: isActive ? `drop-shadow(0 0 5px ${item.color})` : 'none',
                                        fontSize: '22px',
                                        fontWeight: 'bold'
                                    }}
                                    className={`transition-all duration-300 font-serif ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}
                                >
                                    {item.icon}
                                </div>
                            ) : (
                                <item.icon
                                    size={20}
                                    style={{
                                        color: isActive ? '#fff' : item.color,
                                        filter: isActive ? `drop-shadow(0 0 5px ${item.color})` : 'none'
                                    }}
                                    className={`transition-all duration-300 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'}`}
                                />
                            )}

                            <AnimatePresence>
                                {isHovered && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-black/90 border border-white/20 rounded-lg backdrop-blur text-[10px] font-mono uppercase tracking-widest whitespace-nowrap z-50 pointer-events-none shadow-xl overflow-visible min-w-max"
                                        style={{ color: item.color }}
                                    >
                                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black/90 border-l border-b border-white/20 rotate-45" />
                                        &nbsp;{item.label}&nbsp;
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isActive && (
                                <div
                                    className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full animate-pulse"
                                    style={{ backgroundColor: item.color }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
