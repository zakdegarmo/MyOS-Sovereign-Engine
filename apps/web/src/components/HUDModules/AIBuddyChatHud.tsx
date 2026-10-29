import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, TerminalSquare } from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';
import { COUNCIL_AGENTS, type AgentId } from '../../council/agentRegistry';
import { useWorld } from '../../engine/WorldContext';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

interface AIBuddyChatHudProps {
    onClose: () => void;
    targetAgentId?: AgentId;
    currentDimension?: string;
}

export const AIBuddyChatHud: React.FC<AIBuddyChatHudProps> = ({ onClose, targetAgentId = 'orchestrator', currentDimension = 'desktop' }) => {
    const { thinkLocally, agentMessages } = useCouncil();
    const { timeOfDay, spawnedProps } = useWorld();
    const [inputValue, setInputValue] = useState('');
    const [history, setHistory] = useState<Array<{ sender: 'user' | 'ai', text: string, timestamp: number }>>([]);
    const [isThinking, setIsThinking] = useState(false);
    
    const agentInfo = COUNCIL_AGENTS[targetAgentId];
    const displayName = agentInfo?.name || (targetAgentId === 'orchestrator' ? 'Einstein' : targetAgentId);
    
    const scrollRef = useRef<HTMLDivElement>(null);
    const mountTimeRef = useRef(Date.now());

    // Stream listener: update live message while thinking
    useEffect(() => {
        const currentMsg = agentMessages?.[targetAgentId];
        if (currentMsg && currentMsg.timestamp >= mountTimeRef.current) {
            setHistory(prev => {
                if (prev.length > 0 && prev[prev.length - 1].timestamp === currentMsg.timestamp) {
                    // Update the existing message with the new chunk
                    const newHistory = [...prev];
                    newHistory[newHistory.length - 1] = { sender: 'ai', text: currentMsg.text, timestamp: currentMsg.timestamp };
                    return newHistory;
                }
                return [...prev, { sender: 'ai', text: currentMsg.text, timestamp: currentMsg.timestamp }];
            });
        }
    }, [agentMessages, targetAgentId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isThinking]);

    const handleSend = async () => {
        if (!inputValue.trim() || isThinking) return;

        const prompt = inputValue.trim();
        setInputValue('');
        
        const timestamp = Date.now();
        setHistory(prev => [...prev, { sender: 'user', text: prompt, timestamp }]);
        setIsThinking(true);

        try {
            // Compile Local Environment State
            const state = usePersistentWorldStore.getState();
            const playerPos = state.playerPos;
            const myPos = state.agentPositions[targetAgentId];
            
            const isDesktopEnv = !currentDimension || currentDimension === 'desktop';
            const contextSummary = `CURRENT LOCATION & ENVIRONMENT:
- Workspace: ${isDesktopEnv ? 'Native MyOS 3D Desktop Environment (Root Windows 11 Workspace)' : `Specialized Dimension (${currentDimension})`}
- Host OS: Windows 11 Desktop
- System Time: ${new Date().toLocaleTimeString()}
- Player Avatar Coordinates: [${playerPos[0].toFixed(1)}, ${playerPos[1].toFixed(1)}, ${playerPos[2].toFixed(1)}]
- Companion Position: ${myPos ? `[${myPos[0].toFixed(1)}, ${myPos[1].toFixed(1)}, ${myPos[2].toFixed(1)}]` : 'Alongside user'}
- Active 3D Workspace Objects: ${spawnedProps?.length || 0}

INSTRUCTION: You are physically present with the user in their active MyOS 3D workspace. Acknowledge this environment when relevant.`;

            // Send to local AI model via thinkLocally
            await thinkLocally(targetAgentId, prompt, contextSummary);
        } catch (e) {
            setHistory(prev => [...prev, { sender: 'ai', text: "[ERROR: Local LLM Unresponsive]", timestamp: Date.now() }]);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            className="fixed top-24 right-8 z-[3000000] w-[350px] h-[500px] flex flex-col bg-slate-950/90 backdrop-blur-xl border border-cyan-500/80 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.4)] pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                    <Bot size={16} className="text-cyan-400" />
                    <div>
                        <span className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest">{displayName}</span>
                        {agentInfo?.title && (
                            <span className="text-[10px] text-slate-400 font-mono ml-2 hidden sm:inline">({agentInfo.title})</span>
                        )}
                    </div>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Chat History */}
            <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto flex flex-col gap-3">
                {history.map((msg, i) => (
                    <div key={i} className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                        <span className="text-[9px] text-slate-500 font-mono mb-0.5 px-1">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <div className={`px-3 py-2 rounded-xl text-sm font-mono leading-relaxed ${
                            msg.sender === 'user' 
                                ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-500/30 rounded-tr-sm' 
                                : 'bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="self-start px-3 py-2 bg-slate-800/50 rounded-xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
                        <TerminalSquare size={12} className="text-cyan-500 animate-pulse" />
                        <span className="text-xs font-mono text-slate-400">Processing...</span>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-2 bg-slate-900 border-t border-cyan-500/30 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    placeholder={`Talk to ${displayName}...`}
                    className="flex-1 bg-black/50 border border-cyan-900/50 rounded-lg px-3 py-2 text-sm font-mono text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={isThinking || !inputValue.trim()}
                    className="p-2 bg-cyan-900/30 text-cyan-400 border border-cyan-800 rounded-lg hover:bg-cyan-800/50 hover:border-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={16} />
                </button>
            </div>
        </motion.div>
    );
};
