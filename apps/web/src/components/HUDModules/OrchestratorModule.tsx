import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Zap } from 'lucide-react';
import { generateResponse } from "../MaxOverlay/maxGeminiService";
import { saveLibraryItem } from '../../memory/libraryService';
import { decodeUDCAToTags } from '../../utils/semanticAvatar/femtoCoder';
import { buildConceptualSkin } from '../../utils/semanticAvatar/semanticMatcher';
import { useCouncil } from '../../council/CouncilContext';
import { useSwarmTelemetry } from '../../hooks/useSwarmTelemetry';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface Message {
    id: string;
    sender: 'user' | 'orchestrator';
    text: string;
    timestamp: number;
}

interface OrchestratorModuleProps {
    fileContext?: string;
    onAgentTargetUpdate?: (agentId: string, coordinate: string) => void;
    onPlaceProp?: (prop: { id: string, coordinate: string, texturePath: string, scale?: number }) => void;
    isFollowing?: boolean;
    onToggleFollow?: () => void;
}

export const OrchestratorModule: React.FC<OrchestratorModuleProps> = ({
    fileContext,
    isFollowing = false,
    onToggleFollow
}) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            sender: 'orchestrator',
            text: "Ah, hello! Wonderful to see you. What thought experiments or projects are we tinkering with today? I'm ready to help navigate the space, inspect code, or explore.",
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { updateAgentGenome } = useCouncil();
    const { telemetry } = useSwarmTelemetry();

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || isThinking) return;

        const userMsg: Message = {
            id: generateId(),
            sender: 'user',
            text: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsThinking(true);

        const systemPrompt = `
            You are the "Aetherial Tutor," a shapeshifting AI guide. 
            Act as a helpful, philosophical guide. Feel free to shapeshift per previous rules.
            Context: ${fileContext || 'No files indexed'}
            
            [LIVE_SYSTEM_TELEMETRY]
            CPU: ${telemetry.system?.cpu || 0}%
            FPS: ${telemetry.system?.fps || 0}
            ACTIVE_AGENTS: ${JSON.stringify(telemetry.agents || {})}
        `;

        try {
            const response = await generateResponse(input, undefined, systemPrompt);
            const orchestratorMsg: Message = {
                id: generateId(),
                sender: 'orchestrator',
                text: response.text.replace(/```json[\s\S]*```/, ''), // Hide JSON
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, orchestratorMsg]);

            // Save to Library if the protocol triggered
            if (response.libraryEntry) {
                const entry = response.libraryEntry;
                saveLibraryItem({
                    title: entry.title,
                    deweyCategory: entry.dewey_code.split('.')[0] + "00",
                    deweyCode: entry.dewey_code,
                    content: entry.full_content || entry.content_summary,
                    tags: entry.tags || [],
                    pillarConnections: entry.pillar_connections || [],
                    type: 'knowledge'
                });
            }

            // Handle Persona Override
            if (response.personaOverride) {
                if (response.personaOverride.avatar_cypher) {
                    const decodedTags = decodeUDCAToTags(response.personaOverride.avatar_cypher);
                    const newGenome = buildConceptualSkin(decodedTags);
                    updateAgentGenome('orchestrator', newGenome);
                } else if (response.personaOverride.genome) {
                    updateAgentGenome('orchestrator', response.personaOverride.genome);
                }
            }
        } catch (err) {
            console.error("Orchestrator Error:", err);
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col w-full h-[400px] bg-black/50 rounded-xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 bg-white/5 shrink-0 px-2">
                <h3 className="text-xs uppercase tracking-widest text-[var(--pillar-color)] py-2 font-mono">System Tutor</h3>
                <button 
                    onClick={onToggleFollow}
                    className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${isFollowing ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    title={isFollowing ? "Disable Avatar Follow" : "Enable Avatar Follow"}
                >
                    <Footprints size={12} />
                    <span className="text-[8px] font-bold uppercase tracking-wider">{isFollowing ? 'FOLLOWING' : 'FREE'}</span>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar flex flex-col">
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`
                            max-w-[90%] p-2.5 rounded-xl text-[10px] font-mono leading-relaxed relative
                            ${m.sender === 'user'
                                ? 'bg-sky-900/40 text-sky-100 border border-sky-500/20 rounded-tr-none'
                                : 'bg-white/10 text-white border border-white/10 rounded-tl-none'}
                        `}>
                            {m.text}
                            <div className={`absolute top-0 ${m.sender === 'user' ? 'right-0 translate-x-1/2 -translate-y-1/2' : 'left-0 -translate-x-1/2 -translate-y-1/2'}`}>
                                {m.sender === 'orchestrator' ? <Sparkles size={10} className="text-white" /> : <Zap size={10} className="text-sky-400" />}
                            </div>
                        </div>
                    </div>
                ))}
                {isThinking && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-2 rounded-xl text-[10px] font-mono text-white/40 animate-pulse">
                            Formulating...
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2 border-t border-white/10 flex gap-2 shrink-0 bg-black/40">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Command..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none focus:border-white/30 transition-colors font-mono"
                />
                <button
                    type="submit"
                    disabled={isThinking || !input.trim()}
                    className="bg-sky-500/20 text-sky-300 border border-sky-500/30 p-1.5 rounded-lg hover:bg-sky-500/40 transition-colors disabled:opacity-50"
                >
                    <Send size={14} />
                </button>
            </form>
        </div>
    );
};
