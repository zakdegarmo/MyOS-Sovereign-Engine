import React from 'react';
import type { Message, FeedbackType, GemId } from '@Omni/types';
import ChatInterface from '../../components/ChatInterface';
import { Send, Trash2, Download, Key } from 'lucide-react';

interface RecursionProps {
    messages: Message[];
    isLoading: boolean;
    onSend: (text: string) => void;
    userInput: string;
    setUserInput: (text: string) => void;
    onFeedback: (messageId: string, type: FeedbackType) => void;
    onClear: () => void;
    onExport: () => void;
    onResetKey: () => void;
    selectedGems: GemId[];
    onToggleGem: (id: GemId) => void;
}

export const All: React.FC<RecursionProps> = (props) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (props.userInput.trim()) {
                props.onSend(props.userInput);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden m-4 shadow-2xl">
            {/* TOOLBAR */}
            <div className="h-10 bg-white/5 border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4 text-[10px] uppercase font-mono tracking-widest text-white/40">
                    <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Stream Active</span>
                    <span>{props.messages.length} Events</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={props.onExport} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white" title="Export Stream">
                        <Download size={12} />
                    </button>
                    <button onClick={props.onResetKey} className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white" title="Reset API Key">
                        <Key size={12} />
                    </button>
                    <button onClick={props.onClear} className="p-1.5 hover:bg-rose-500/20 rounded transition-colors text-white/40 hover:text-rose-400" title="Clear Stream">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-hidden">
                <ChatInterface
                    messages={props.messages}
                    isLoading={props.isLoading}
                    onFeedback={props.onFeedback}
                />
            </div>

            {/* INPUT */}
            <div className="p-4 bg-white/5 border-t border-white/10 shrink-0">
                <div className="relative group">
                    <textarea
                        value={props.userInput}
                        onChange={(e) => props.setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pulse into the Aether..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-amber-500/50 transition-all resize-none custom-scrollbar min-h-[44px] max-h-32 text-slate-200 placeholder:text-slate-600"
                        rows={1}
                    />
                    <button
                        onClick={() => props.onSend(props.userInput)}
                        disabled={!props.userInput.trim() || props.isLoading}
                        className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all ${props.userInput.trim() && !props.isLoading
                            ? 'bg-amber-600/60 text-white hover:bg-amber-500 hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'text-slate-600 cursor-not-allowed'
                            }`}
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[8px] font-mono text-white/20 uppercase tracking-tighter">
                    <span>Shift+Enter for newline</span>
                    <span>0:1 Potentiality Actualized</span>
                </div>
            </div>
        </div>
    );
};
