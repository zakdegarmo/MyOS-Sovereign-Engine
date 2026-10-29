import React from 'react';
import { FlaskConical } from 'lucide-react';

interface SpriteLabModuleProps {
    showLab: boolean;
    setShowLab: (show: boolean) => void;
}

export const SpriteLabModule: React.FC<SpriteLabModuleProps> = ({
    showLab,
    setShowLab
}) => {
    return (
        <div className="flex flex-col gap-3 w-full">
            <h3 className="text-xs uppercase tracking-widest text-[var(--pillar-color)] mb-1 font-mono">Mephit Lab</h3>

            <button
                onClick={() => setShowLab(!showLab)}
                className={`flex items-center justify-center gap-3 w-full h-16 rounded-xl border transition-all
                    ${showLab
                        ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)] scale-105'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                `}
            >
                <FlaskConical size={24} className={showLab ? "text-cyan-400" : ""} />
                <span className="font-mono text-sm">{showLab ? 'Close Lab' : 'Open Mephit Lab'}</span>
            </button>

            <div className="bg-black/40 p-3 rounded-lg border border-white/5 mt-2 text-xs text-white/50 italic">
                Refine the visual identity of your agentic Mephits through ontological genome manipulation.
            </div>
        </div>
    );
};
