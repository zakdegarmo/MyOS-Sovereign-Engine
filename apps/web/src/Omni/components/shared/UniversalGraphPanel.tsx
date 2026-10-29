import React from 'react';
import { UniversalGraph } from '@Self/UniversalGraph';
import type { UserGestalt, IdeaCube } from '@Omni/types';
import { Share2 } from 'lucide-react';

interface UniversalGraphPanelProps {
    mode?: 'ontology' | 'chronos' | 'dewey' | 'void';
    memories: any[];
    gestalt: UserGestalt;
    ideas: IdeaCube[];
    title?: string;
    className?: string;
}

export const UniversalGraphPanel: React.FC<UniversalGraphPanelProps> = ({
    mode = 'ontology',
    memories,
    gestalt,
    ideas,
    title = "GRAPH",
    className = ""
}) => {
    return (
        <div className={`flex flex-col bg-slate-900/50 rounded-xl border border-white/5 overflow-hidden ${className}`}>
            {title && (
                <div className="h-8 border-b border-white/5 flex items-center px-4 bg-white/5 justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Share2 size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                    </div>
                </div>
            )}
            <div className="flex-1 relative">
                <UniversalGraph
                    mode={mode}
                    gestalt={gestalt}
                    memories={memories}
                    ideas={ideas}
                />
            </div>
        </div>
    );
};
