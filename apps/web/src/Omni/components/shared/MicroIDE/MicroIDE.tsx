import React from 'react';
import Editor from '@monaco-editor/react';
import type { EditorProps } from '@monaco-editor/react';

interface MicroIDEProps extends EditorProps {
    title?: string;
    onClose?: () => void;
}

export const MicroIDE: React.FC<MicroIDEProps> = ({ title = 'Untitled.tsx', onClose, ...props }) => {
    return (
        <div className="flex flex-col w-[600px] h-[400px] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="h-8 bg-slate-800 flex items-center justify-between px-3 border-b border-slate-700 select-none cursor-move">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500" />
                    <span className="text-xs font-mono text-slate-300">{title}</span>
                </div>
                {onClose && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Editor Area */}
            <div className="flex-1 relative bg-slate-950">
                <Editor
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        scrollBeyondLastLine: false,
                        padding: { top: 10 },
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        ...props.options
                    }}
                    {...props}
                />
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-slate-800 border-t border-slate-700 flex items-center px-3 gap-4">
                <span className="text-[10px] text-slate-500 font-mono">TSX</span>
                <span className="text-[10px] text-slate-500 font-mono">UTF-8</span>
                <div className="flex-1" />
                <span className="text-[10px] text-green-500 font-mono flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    READY
                </span>
            </div>
        </div>
    );
};
