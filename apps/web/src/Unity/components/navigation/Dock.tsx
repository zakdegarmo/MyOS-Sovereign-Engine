import React from 'react';
import type { GemId } from '@Omni/types';
import { COUNCIL } from '@Omni/constants';

interface DockProps {
    activeGem: GemId;
    onNavigate: (gem: GemId) => void;
    onHover?: (gem: GemId | null, rect?: DOMRect) => void;
}

export const Dock: React.FC<DockProps> = ({ activeGem, onNavigate, onHover }) => {
    const gems: GemId[] = [
        'Self', 'Thought', 'Logic', 'Unity',
        'Existence', 'Improvement', 'Mastery',
        'Resonance', 'Transcendence', 'Omni'
    ];

    const handleMouseEnter = (gem: GemId, e: React.MouseEvent) => {
        if (onHover) {
            const rect = e.currentTarget.getBoundingClientRect();
            onHover(gem, rect);
        }
    };

    return (
        <div className="fixed top-4 left-4 z-[70] flex items-start">
            {/* Horizontal Bar */}
            <div className="flex items-center gap-1 p-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5">
                {gems.map((gem) => {
                    const data = COUNCIL[gem];
                    const isActive = activeGem === gem;

                    return (
                        <button
                            key={gem}
                            onClick={() => onNavigate(gem)}
                            onMouseEnter={(e) => handleMouseEnter(gem, e)}
                            onMouseLeave={() => onHover && onHover(null)}
                            className={`
                                relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
                                ${isActive ? 'bg-white/10 scale-105 ring-1 ring-white/20' : 'hover:bg-white/5 hover:scale-105'}
                            `}
                        >
                            {/* Glow Effect */}
                            <div
                                className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md`}
                                style={{ backgroundColor: isActive ? data.color : 'transparent' }}
                            />

                            {/* Icon / Symbol */}
                            <div
                                className={`relative z-10 text-lg font-bold transition-transform duration-300 ${isActive ? '-translate-y-0.5' : ''}`}
                                style={{ color: isActive ? '#fff' : data.color }}
                            >
                                {data.symbol}
                            </div>

                            {/* Label Tooltip (Below) */}
                            <span className={`
                                absolute top-full mt-2 text-[8px] font-mono tracking-widest uppercase transition-all duration-300 pointer-events-none whitespace-nowrap bg-black/90 px-2 py-1 rounded border border-white/10 z-50
                                ${isActive ? 'opacity-0' : 'opacity-0 translate-y-[-5px] group-hover:opacity-100 group-hover:translate-y-0'}
                            `}>
                                {gem}
                            </span>

                            {/* Active Indicator Dot */}
                            {isActive && (
                                <div
                                    className="absolute -bottom-1 w-1 h-1 rounded-full animate-pulse"
                                    style={{ backgroundColor: data.color }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
