import React from 'react';
import { Save, Upload, X, HardDrive } from 'lucide-react';

export interface SaveLoadStateModalProps {
    isOpen?: boolean;
    onClose?: () => void;
    onExportState: () => void;
    onImportState: () => Promise<any> | void;
}

export const SaveLoadStateModal: React.FC<SaveLoadStateModalProps> = ({
    onClose,
    onExportState,
    onImportState
}) => {
    return (
        <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/95 border-2 border-cyan-500/40 rounded-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl w-full max-w-md font-sans text-slate-100 flex flex-col gap-4 pointer-events-auto"
        >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <HardDrive className="text-cyan-400" size={20} />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400 font-mono">System State Manager</h3>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        title="Close Modal"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Persist or restore the entire MyOS universe snapshot including spatial layout, avatar configurations, and environment state.
            </p>

            <div className="flex flex-col gap-3 mt-2">
                <button
                    onClick={() => {
                        onExportState();
                    }}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition-all border border-cyan-400/30 cursor-pointer"
                >
                    <Save size={18} /> Save / Export Universe State
                </button>

                <button
                    onClick={async () => {
                        await onImportState();
                    }}
                    className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all border border-slate-600/50 cursor-pointer"
                >
                    <Upload size={18} /> Load / Import Universe State
                </button>
            </div>

            <div className="text-[10px] text-slate-500 text-center font-mono mt-2 pt-3 border-t border-white/5">
                MyOS State Snapshot Engine • Local JSON / Workspace Sync
            </div>
        </div>
    );
};
