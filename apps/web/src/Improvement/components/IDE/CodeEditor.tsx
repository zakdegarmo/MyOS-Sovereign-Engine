
import React from 'react';

/**
 * Native Code Editor (Safe Mode)
 * Uses pure HTML/CSS to avoid CSP violations from external syntax highlighters.
 */
interface CodeEditorProps {
    file: { name: string; content: string; language: string } | null;
}

export default function CodeEditor({ file, onChange }: CodeEditorProps & { onChange?: (val: string) => void }) {
    if (!file) {
        return (
            <div className="h-full flex items-center justify-center text-gray-600 text-sm font-mono select-none">
                [SELECT A FILE TO EDIT]
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a] font-mono text-sm">
            {/* Header */}
            <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-neon-green opacity-90 font-bold">{file.name}</span>
                <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">{file.language}</span>
            </div>

            {/* Native Code View / Edit */}
            <div className="flex-1 overflow-hidden relative group">
                <textarea
                    className="w-full h-full bg-transparent text-gray-300 font-mono text-xs leading-relaxed p-4 resize-none focus:outline-none custom-scrollbar"
                    value={file.content}
                    onChange={(e) => onChange && onChange(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
