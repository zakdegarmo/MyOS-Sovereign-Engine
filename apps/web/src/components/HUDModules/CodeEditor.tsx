
import React from 'react';

interface CodeEditorProps {
    file: { name: string; content: string; language: string } | null;
    onChange?: (val: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChange }) => {
    if (!file) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 bg-black/20 font-mono select-none">
                <div className="text-[10px] uppercase tracking-[0.4em] opacity-40">[Awaiting_File_Selection]</div>
                <div className="text-[10px] mt-2 opacity-20 italic italic-none">Select a substrate segment from the explorer to begin manipulation.</div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#050505] font-mono text-[11px] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center px-6 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                   <span className="text-cyan-400 font-bold tracking-tight">{file.name}</span>
                </div>
                <span className="ml-auto text-[9px] text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/5">DESCRIPTOR: {file.language}</span>
            </div>

            {/* Native Code View / Edit */}
            <div className="flex-1 overflow-hidden relative group">
                <textarea
                    className="w-full h-full bg-transparent text-slate-300 font-mono text-[11px] leading-relaxed p-6 resize-none focus:outline-none custom-scrollbar transition-all hover:bg-white/[0.02]"
                    value={file.content}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
