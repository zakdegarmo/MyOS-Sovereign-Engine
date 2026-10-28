import React from 'react';
import { Compass } from 'lucide-react';

interface SpelljammerHelmModuleProps {
    showHelm: boolean;
    setShowHelm: (show: boolean) => void;
}

export const SpelljammerHelmModule: React.FC<SpelljammerHelmModuleProps> = ({
    showHelm,
    setShowHelm
}) => {
    return (
        <div className="flex flex-col gap-3 w-full">
            <h3 className="text-xs uppercase tracking-widest text-[var(--pillar-color)] mb-1 font-mono">Resonance Navigation</h3>

            <button
                onClick={() => setShowHelm(!showHelm)}
                className={`flex items-center justify-center gap-3 w-full h-16 rounded-xl border transition-all
                    ${showHelm
                        ? 'bg-rose-900/30 border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)] scale-105'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                `}
            >
                <Compass size={24} className={showHelm ? "text-rose-400" : ""} />
                <span className="font-mono text-sm">{showHelm ? 'Disengage Helm' : 'Engage Helm'}</span>
            </button>

            <div className="bg-black/40 p-3 rounded-lg border border-white/5 mt-2">
                <p className="text-[10px] text-white/50 leading-relaxed text-center font-mono">
                    Activate the Spelljammer Helm to navigate the aether and directly adjust the resonance field.
                </p>
            </div>
        </div>
    );
};
