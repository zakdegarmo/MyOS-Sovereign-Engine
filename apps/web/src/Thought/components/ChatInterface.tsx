import React, { useEffect, useRef } from 'react';
import type { Message, GemId, FeedbackType } from '@Omni/types';
import { COUNCIL, GEM_ACTIONS } from '@Omni/constants';
import { User, Sparkles, Terminal } from 'lucide-react';

interface ChatInterfaceProps {
    messages: Message[];
    isLoading: boolean;
    onFeedback: (messageId: string, type: FeedbackType) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, onFeedback }) => {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar h-full">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 opacity-50">
                    <Sparkles className="w-16 h-16" />
                    <p className="text-lg font-mono tracking-tighter uppercase">The Council Chamber is silent.</p>
                    <p className="text-xs font-mono">Speak to the Aether to begin.</p>
                </div>
            )}

            {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const gem = msg.gemId ? COUNCIL[msg.gemId] : null;

                return (
                    <div
                        key={msg.id}
                        className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        {!isUser && gem && (
                            <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-800 border border-slate-700 shadow-sm ${gem.color}`}
                                title={gem.name}
                            >
                                {gem.symbol}
                            </div>
                        )}

                        <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>

                            {/* TOOL LOGS */}
                            {msg.toolLog && (
                                <div className="w-full rounded-xl p-3 mb-2 bg-slate-900/50 border border-white/5 text-[10px] font-mono animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2 text-amber-500/80 mb-2 uppercase tracking-widest">
                                        <Terminal className="w-3 h-3" />
                                        <span>Action: {msg.toolLog.toolName}</span>
                                    </div>
                                    <div className="pl-4 border-l border-white/10 space-y-1 text-slate-400">
                                        <p><strong className="text-white/40">INPUT:</strong> {JSON.stringify(msg.toolLog.toolInput)}</p>
                                        <p><strong className="text-white/40">RESULT:</strong> {JSON.stringify(msg.toolLog.toolOutput)}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`w-full rounded-2xl p-4 shadow-xl relative group ${isUser
                                ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-br-none'
                                : 'bg-slate-900/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-bl-none'
                                }`}>
                                {!isUser && gem && (
                                    <div className={`text-[10px] font-mono font-bold mb-1 opacity-70 uppercase tracking-widest flex items-center gap-2 ${gem.color}`}>
                                        <span className="text-lg">{gem.symbol}</span>
                                        {gem.name}
                                    </div>
                                )}
                                <div className="whitespace-pre-wrap leading-relaxed text-sm selection:bg-amber-500/30">
                                    {msg.content}
                                </div>
                            </div>

                            {!isUser && (
                                <div className="w-full mt-2 overflow-x-auto no-scrollbar">
                                    {!msg.feedback ? (
                                        <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                                            {(Object.keys(COUNCIL) as GemId[]).map((gemId) => {
                                                const c = COUNCIL[gemId];
                                                const actionVerb = GEM_ACTIONS[gemId];
                                                return (
                                                    <button
                                                        key={gemId}
                                                        onClick={() => onFeedback(msg.id, actionVerb)}
                                                        className={`px-2 py-1 rounded bg-black/40 border border-white/5 hover:border-white/20 text-[9px] font-mono flex items-center gap-1 transition-all hover:-translate-y-0.5 whitespace-nowrap ${c.color.replace('text-', 'hover:text-')}`}
                                                        title={`${c.symbol} ${c.name}: ${actionVerb.toUpperCase()}`}
                                                    >
                                                        <span>{c.symbol}</span>
                                                        <span className="opacity-0 group-hover:opacity-100 hidden md:inline">{actionVerb}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-[9px] font-mono py-1 px-3 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 animate-in zoom-in-95 w-fit">
                                            {(() => {
                                                const gemId = (Object.keys(GEM_ACTIONS) as GemId[]).find(key => GEM_ACTIONS[key] === msg.feedback);
                                                if (!gemId) return null;
                                                const feedbackGem = COUNCIL[gemId];
                                                return (
                                                    <>
                                                        <span className={`text-sm ${feedbackGem.color}`}>{feedbackGem.symbol}</span>
                                                        <span className={`${feedbackGem.color} uppercase font-bold`}>{msg.feedback}</span>
                                                    </>
                                                )
                                            })()}
                                            <span className="text-white/20 tracking-tighter">INTEGRATED</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isUser && (
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                );
            })}

            {isLoading && (
                <div className="flex gap-4 justify-start animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700"></div>
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 w-48 h-12 border border-white/5 flex items-center px-6">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-amber-500/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatInterface;
