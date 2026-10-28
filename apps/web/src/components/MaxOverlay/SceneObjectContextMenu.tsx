import React, { useEffect, useRef } from 'react';
import {
    Fingerprint, Brain, Binary, Network, Mountain,
    Zap, GraduationCap, Music, Rocket, Globe,
    Move, Maximize, Copy, Trash2, X, RotateCcw
} from 'lucide-react';

interface SceneObjectContextMenuProps {
    objectId: string;
    objectType: 'wall' | 'screen' | 'prop';
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string, payload?: any) => void;
}

export const SceneObjectContextMenu: React.FC<SceneObjectContextMenuProps> = ({ objectId, objectType, x, y, onClose, onAction }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Prevent clipping off-screen
    const style: React.CSSProperties = {
        top: Math.min(y, window.innerHeight - 400),
        left: Math.min(x, window.innerWidth - 300),
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl backdrop-blur-md text-slate-200 w-72 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={style}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Header */}
            <div className="bg-slate-800/80 p-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">{objectType}</span>
                    <span className="font-bold text-white truncate w-48">{objectId}</span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            {/* Basic Actions */}
            <div className="p-2 grid grid-cols-4 gap-1 border-b border-slate-700/50">
                <button onClick={() => onAction('transform_move', objectId)} className="flex flex-col items-center justify-center p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors" title="Move">
                    <Move size={18} />
                    <span className="text-[10px] mt-1">GIZMO (MOVE)</span>
                </button>
                <button onClick={() => onAction('transform_scale', objectId)} className="flex flex-col items-center justify-center p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-green-400 transition-colors" title="Resize">
                    <Maximize size={18} />
                    <span className="text-[10px] mt-1">GIZMO (SCALE)</span>
                </button>
                <button onClick={() => onAction('edit_copy', objectId)} className="flex flex-col items-center justify-center p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-yellow-400 transition-colors" title="Copy">
                    <Copy size={18} />
                    <span className="text-[10px] mt-1">CLONE</span>
                </button>
                <button onClick={() => onAction('edit_delete', objectId)} className="flex flex-col items-center justify-center p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                    <Trash2 size={18} />
                    <span className="text-[10px] mt-1">PURGE</span>
                </button>
            </div>

            {/* Ontology Protocols */}
            <div className="flex flex-col p-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                <span className="px-3 py-1 text-[10px] font-mono text-slate-500 uppercase">Ontology Protocols</span>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_self')}>
                    <Fingerprint size={14} className="text-pink-400" />
                    <span>Inspect Identity</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_thought')}>
                    <Brain size={14} className="text-violet-400" />
                    <span>Analyze Logic</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_existence')}>
                    <Mountain size={14} className="text-emerald-400" />
                    <span>Material Properties</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_unity')}>
                    <Network size={14} className="text-cyan-400" />
                    <span>Check Dependencies</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_improvement')}>
                    <Zap size={14} className="text-yellow-400" />
                    <span>Optimize Mesh</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('reset_transform')}>
                    <RotateCcw size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
                    <span>Reset Transform</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm text-pink-400 group" onClick={() => onAction('resynthesize_dio')}>
                    <Binary size={14} className="group-hover:animate-spin-slow" />
                    <span>Resynthesize D.I.O.</span>
                </button>

                <button className="flex items-center px-4 py-2 hover:bg-slate-800 transition-colors gap-2 text-left text-sm" onClick={() => onAction('ontology_mastery')}>
                    <GraduationCap size={14} className="text-orange-400" />
                    <span>Lock Configuration</span>
                </button>

            </div>
        </div>
    );
};
