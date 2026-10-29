import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, X, ChevronRight, Globe, Info, Send } from 'lucide-react';
import { mistralLocalService } from '../../engine/mistralLocalService';

interface MenuOption {
    label: string;
    action: () => void;
    icon?: React.ReactNode;
}

interface MicroChatProps {
    id: string;
    name: string;
    title: string;
    initialGreeting: string;
    lore: string[];
    menuOptions: MenuOption[];
    onClose: () => void;
}

/**
 * MicroChat.tsx
 * 
 * A specialized, lightweight chat UI for local NPC interactions.
 * Features menu-driven choices and active Local LLM (Mystra/Mistral) responses.
 */
export const MicroChat: React.FC<MicroChatProps> = ({
    id, name, title, initialGreeting, lore, menuOptions, onClose
}) => {
    const [messages, setMessages] = useState<{ sender: 'npc' | 'user', text: string }[]>([]);
    const [isMenuVisible, setIsMenuVisible] = useState(true);
    const [isThinking, setIsThinking] = useState(false);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([{ sender: 'npc', text: initialGreeting }]);
    }, [initialGreeting]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const generateLLMResponse = async (prompt: string) => {
        setIsThinking(true);
        const contextString = `You are ${name}, ${title}. Lore context: ${(lore || []).join('. ')}`;
        
        try {
            const response = await mistralLocalService.generateResponse(prompt, contextString, history);
            setMessages(prev => [...prev, { sender: 'npc', text: response.text }]);
            setHistory(prev => {
                const newHistory: { role: 'user' | 'assistant', content: string }[] = [
                    ...prev, 
                    { role: 'user', content: prompt },
                    { role: 'assistant', content: response.text }
                ];
                return newHistory.slice(-10);
            });
            
            // Log interaction to telemetry
            mistralLocalService.logTelemetry({
                id: `chat-${id}-${Date.now()}`,
                source: id as any,
                intent: `User input: ${prompt.slice(0, 30)}...`,
                status: 'interaction',
                timestamp: Date.now(),
                context: 'microchat-ui',
                input: prompt,
                output: response.text
            });
        } catch (err) {
            console.error("LLM Error:", err);
        } finally {
            setIsThinking(false);
        }
    };

    const handleOptionClick = async (option: MenuOption) => {
        setMessages(prev => [...prev, { sender: 'user', text: option.label }]);
        setIsMenuVisible(false);
        
        // Response logic based on LLM instead of static action
        await generateLLMResponse(option.label);
        
        // Still fire the action for side-effects (e.g. buying a drink, changing channel)
        setTimeout(() => {
            option.action();
        }, 500);
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isThinking) return;

        const text = input;
        setMessages(prev => [...prev, { sender: 'user', text }]);
        setInput("");
        setIsMenuVisible(false);

        await generateLLMResponse(text);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-32 right-8 w-80 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-[1000] flex flex-col"
        >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <MessageSquare size={14} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{name}</h3>
                        <p className="text-[9px] text-cyan-400/60 font-mono tracking-tighter uppercase">{title}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                    <X size={14} className="text-white/40" />
                </button>
            </div>

            {/* Content Area */}
            <div 
                ref={scrollRef}
                className="flex-1 p-5 overflow-y-auto max-h-64 custom-scrollbar space-y-4"
            >
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[85%] px-3 py-2 rounded-2xl text-[11px] leading-relaxed
                            ${m.sender === 'user' 
                                ? 'bg-cyan-500 text-black font-bold' 
                                : 'bg-white/5 text-slate-300 border border-white/5'}
                        `}>
                            {m.text}
                        </div>
                    </div>
                ))}
                
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 text-slate-500 px-3 py-2 rounded-2xl text-[10px] animate-pulse italic">
                            {name} is thinking...
                        </div>
                    </div>
                )}
                
                {isMenuVisible && menuOptions && (
                    <div className="pt-2 space-y-2">
                        <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest pl-1">Interaction Menu</p>
                        {menuOptions.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleOptionClick(opt)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    {opt.icon || <ChevronRight size={12} className="text-slate-600 group-hover:text-cyan-400" />}
                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">{opt.label}</span>
                                </div>
                                <ChevronRight size={10} className="text-slate-700 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="px-4 py-3 bg-black/20 border-t border-white/5 flex gap-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Talk to the Bartender..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button 
                    type="submit" 
                    disabled={isThinking || !input.trim()}
                    className="p-1.5 bg-cyan-500 rounded-xl text-black hover:bg-cyan-400 transition-colors disabled:opacity-50"
                >
                    <Send size={14} />
                </button>
            </form>

            {/* Footer Context Info */}
            <div className="px-5 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-30">
                    <Globe size={10} className="text-cyan-400" />
                    <span className="text-[8px] font-mono text-white tracking-widest uppercase">Wetwork_Local</span>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer" title={(lore || []).join('\n')}>
                    <Info size={10} className="text-slate-500 group-hover:text-white transition-colors" />
                    <span className="text-[8px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors uppercase">Context_Graph</span>
                </div>
            </div>
        </motion.div>
    );
};
