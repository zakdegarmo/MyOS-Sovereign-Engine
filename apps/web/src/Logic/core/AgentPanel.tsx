
import React, { useRef, useEffect } from 'react';
import { Send, Cpu, Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ForgeAgentState, FileNode } from './types';
import type { Message } from '@Omni/types';

interface AgentPanelProps {
    messages: Message[];
    agentState: ForgeAgentState;
    userInput: string;
    onUserInputChange: (val: string) => void;
    onSendMessage: () => void;
    isProcessing: boolean;
    activeFile?: FileNode | null; // NEW: Awareness of selection
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
    messages,
    agentState,
    userInput,
    onUserInputChange,
    onSendMessage,
    isProcessing,
    activeFile
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, agentState.thoughtLog]);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-96 shadow-xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border border-amber-400/30">
                        <Cpu size={16} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-amber-100">The Forge Agent</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                {agentState.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>

                {/* Agent Plan Visualization */}
                {agentState.plan.length > 0 && (
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800 mb-4">
                        <h3 className="text-xs font-mono text-slate-500 uppercase mb-2 flex items-center gap-2">
                            <Activity size={12} /> Execution Plan
                        </h3>
                        <div className="space-y-2">
                            {agentState.plan.map(step => (
                                <div key={step.id} className="flex items-start gap-2 text-xs">
                                    {step.status === 'completed' && <CheckCircle size={14} className="text-emerald-500 mt-0.5" />}
                                    {step.status === 'in-progress' && <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mt-0.5" />}
                                    {step.status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-slate-600 mt-0.5" />}
                                    {step.status === 'failed' && <AlertTriangle size={14} className="text-rose-500 mt-0.5" />}

                                    <div className={`${step.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                                        <span className="font-medium">{step.title}</span>
                                        {step.targetFiles.length > 0 && (
                                            <div className="text-[10px] text-cyan-400/70 font-mono mt-0.5">
                                                [{step.targetFiles.join(', ')}]
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Chat Stream */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                        <div className={`
                            py-2 px-3 rounded-2xl text-sm 
                            ${msg.role === 'user'
                                ? 'bg-cyan-900/40 text-cyan-100 rounded-br-none border border-cyan-800/50'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}
                        `}>
                            {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-600 mt-1 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}

                {/* Live Thought Stream */}
                {isProcessing && agentState.thoughtLog.length > 0 && (
                    <div className="self-start max-w-[90%] font-mono text-xs text-amber-500/80 italic pl-3 border-l-2 border-amber-500/30 animate-pulse">
                        {agentState.thoughtLog[agentState.thoughtLog.length - 1]}...
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-slate-950 border-t border-slate-800">
                <div className="relative flex items-center">
                    <textarea
                        value={userInput}
                        onChange={(e) => onUserInputChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendMessage();
                            }
                        }}
                        placeholder="Describe the desired improvement..."
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none h-12 scrollbar-hide"
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={!userInput.trim() || isProcessing}
                        className="absolute right-2 p-1.5 text-slate-400 hover:text-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isProcessing ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
