import React from 'react';
import { X, Move, Maximize, RotateCcw, Trash2 } from 'lucide-react';

interface PropContextMenuProps {
    propId: string;
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: 'move' | 'scale' | 'reset' | 'delete') => void;
}

export const PropContextMenu: React.FC<PropContextMenuProps> = ({ propId, x, y, onClose, onAction }) => {
    const style = {
        top: Math.min(y, window.innerHeight - 200),
        left: Math.min(x, window.innerWidth - 250),
    };

    return (
        <div
            className="fixed z-50 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl text-slate-200 overflow-hidden font-mono text-sm pointer-events-auto"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <span className="font-bold text-cyan-400 uppercase tracking-tighter">Prop: {propId}</span>
                <button onClick={onClose} className="hover:text-white transition-colors"><X size={14} /></button>
            </div>

            <div className="flex flex-col py-2">
                <button
                    className="flex items-center px-4 py-2.5 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors gap-3 group"
                    onClick={() => onAction('move')}
                >
                    <Move size={16} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                    <span>Enable Gizmo (Move)</span>
                </button>

                <button
                    className="flex items-center px-4 py-2.5 hover:bg-amber-500/20 hover:text-amber-200 transition-colors gap-3 group"
                    onClick={() => onAction('scale')}
                >
                    <Maximize size={16} className="text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Enable Gizmo (Scale)</span>
                </button>

                <div className="h-px bg-slate-700 my-1 mx-2" />

                <button
                    className="flex items-center px-4 py-2.5 hover:bg-slate-800 transition-colors gap-3 group"
                    onClick={() => onAction('reset')}
                >
                    <RotateCcw size={16} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Reset Transform</span>
                </button>

                <button
                    className="flex items-center px-4 py-2.5 hover:bg-red-500/20 hover:text-red-300 transition-colors gap-3 group"
                    onClick={() => onAction('delete')}
                >
                    <Trash2 size={16} className="text-red-500 group-hover:shake transition-all" />
                    <span>Purge from Scene</span>
                </button>
            </div>
        </div>
    );
};
