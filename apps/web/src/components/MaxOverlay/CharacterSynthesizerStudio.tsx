import React from 'react';
import { Lpc3DSynthesizerStudio } from '../HUDModules/Lpc3DSynthesizerStudio';
import { Wand2 } from 'lucide-react';

interface CharacterSynthesizerStudioProps {
    onClose?: () => void;
}

export const CharacterSynthesizerStudio: React.FC<CharacterSynthesizerStudioProps> = ({ onClose }) => {
    return (
        <div className="flex flex-col h-full bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif text-lg shadow-inner">
                        ☉
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                                FSG://Self.Self.Mastery
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold uppercase">
                                3D Synthesizer & Baking Workshop
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                            3D Model Wardrobe Synthesis • Style Transfer • Automated Spritesheet Baking
                        </p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                        title="Close & Return to Self.Self"
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden relative">
                <Lpc3DSynthesizerStudio />
            </div>
        </div>
    );
};
