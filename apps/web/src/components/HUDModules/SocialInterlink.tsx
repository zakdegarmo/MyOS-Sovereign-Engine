import React from 'react';
import { Users, Users2 } from 'lucide-react';

interface SocialInterlinkProps {
    isSocialMode: boolean;
    setIsSocialMode: (val: boolean) => void;
}

export const SocialInterlink: React.FC<SocialInterlinkProps> = ({
    isSocialMode,
    setIsSocialMode
}) => {
    return (
        <div className="flex flex-col gap-3 w-full">
            <h3 className="text-xs uppercase tracking-widest text-[var(--pillar-color)] mb-1 font-mono">Social Fabric</h3>

            <button
                onClick={() => setIsSocialMode(!isSocialMode)}
                className={`flex items-center justify-center gap-3 w-full h-16 rounded-xl border transition-all
                    ${isSocialMode
                        ? 'bg-amber-900/30 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.1)] scale-105'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'}
                `}
            >
                {isSocialMode ? <Users2 size={24} className="text-amber-400" /> : <Users size={24} />}
                <span className="font-mono text-sm">{isSocialMode ? 'Deactivate Synapse' : 'Activate Synapse'}</span>
            </button>

            <div className="bg-black/40 p-3 rounded-lg border border-white/5 mt-2">
                <p className="text-[10px] text-white/50 leading-relaxed text-center font-mono">
                    Enables interactive 3D multiplayer presence. Replaces local agency with network-synced gestures.
                </p>
            </div>
        </div>
    );
};
