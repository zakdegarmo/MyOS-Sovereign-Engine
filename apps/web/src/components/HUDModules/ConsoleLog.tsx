import React from 'react';
import { Terminal, X, Archive, Trash2 } from 'lucide-react';

interface ConsoleLogProps {
    messages: any[];
    onClear: () => void;
    onClose: () => void;
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({ messages, onClear, onClose }) => {
    return (
        <div className="w-[400px] h-[500px] bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative border-b-2">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-black/40">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-cyan-400" />
                    <span className="text-white/80 font-mono text-[11px] font-bold tracking-widest uppercase">Subtextual Console Log</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onClear}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-red-400 transition-colors"
                        title="Clear Buffer"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Log Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] custom-scrollbar bg-black/20">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-white/10 italic">
                        <Archive size={32} className="mb-4 opacity-10" />
                        Log buffer is empty.
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div key={i} className="flex gap-2 group">
                        <span className="text-white/20 select-none">[{new Date(msg.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                        <span className={`font-bold ${msg.sender === 'user' ? 'text-blue-400' : 'text-emerald-500'}`}>
                            {msg.sender === 'user' ? 'USR>' : 'MAX>'}
                        </span>
                        <span className="text-white/70 leading-normal break-words flex-1 group-hover:text-white transition-colors italic">
                            {msg.text}
                        </span>
                    </div>
                ))}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex justify-between items-center text-[9px] text-white/20 font-mono">
                <span>BUFFER STATUS: NOMINAL</span>
                <span>{messages.length} ENTRIES</span>
            </div>
        </div>
    );
};
