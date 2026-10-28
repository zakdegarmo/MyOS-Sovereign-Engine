import { useState, useEffect, useRef } from 'react';
import { Send, Terminal } from 'lucide-react';
import { useSwarm } from '@Omni/lib/useSwarm';
import { TEAM_DATA, AgentRole } from '@antigravity/swarm-core';

interface Message {
    id: string;
    sender: 'user' | AgentRole | 'system';
    content: string;
    timestamp: Date;
}

export default function NexusTerminal() {
    const { isConnected, lastMessage, sendCommand } = useSwarm();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'system', content: 'Initializing Swarm Uplink...', timestamp: new Date() }
    ]);
    const endRef = useRef<HTMLDivElement>(null);

    // Monitor connection status
    useEffect(() => {
        if (isConnected) {
            setMessages(prev => [...prev, { id: 'conn', sender: 'system', content: 'Swarm Uplink ESTABLISHED.', timestamp: new Date() }]);
        }
    }, [isConnected]);

    // Monitor incoming messages from Swarm
    useEffect(() => {
        if (lastMessage) {
            // Check content to guess Sender (Temporary Hack until Server sends 'sender' field)
            let sender: AgentRole | 'system' = AgentRole.Self;
            let text = "";

            // [CHAT ROUTER SUPPORT]
            // If it's a ThoughtPacket with 'chatResponse'
            // @ts-ignore
            if (lastMessage.intent && lastMessage.payload?.chatResponse) { // It's a ThoughtPacket
                // @ts-ignore
                sender = lastMessage.source;
                // @ts-ignore
                text = lastMessage.payload.chatResponse;
            }
            // Normal JSON-RPC Response
            else if (lastMessage.result?.content?.[0]?.text) {
                text = lastMessage.result.content[0].text;
                if (text.includes("Logic Agent")) sender = AgentRole.Logic;
                if (text.includes("Unity Agent")) sender = AgentRole.Unity;
            } else {
                return; // Ignore other messages (e.g. pure telemetry intent updates)
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: sender,
                content: text,
                timestamp: new Date()
            }]);
        }
    }, [lastMessage]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newMessage]);

        // Send to Swarm
        sendCommand(input);

        setInput('');
    };

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Output Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg ${msg.sender === 'user'
                            ? 'bg-neon-blue/10 border border-neon-blue/30 text-cyan-50'
                            : msg.sender === 'system'
                                ? 'text-gray-500 italic'
                                : 'bg-white/5 border border-white/10 text-gray-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-50 text-xs uppercase tracking-wider">
                                {msg.sender === 'system' && <Terminal className="w-3 h-3" />}
                                <span className={
                                    msg.sender === 'user' ? 'text-cyan-400' :
                                        msg.sender === 'system' ? 'text-gray-500' :
                                            // @ts-ignore
                                            TEAM_DATA[msg.sender]?.color || 'text-purple-400'
                                }>
                                    {msg.sender === 'user' ? 'USER' :
                                        msg.sender === 'system' ? 'SYSTEM' :
                                            // @ts-ignore
                                            (() => {
                                                // @ts-ignore
                                                const agent = TEAM_DATA[msg.sender];
                                                return `${agent?.symbol} ${agent?.title} (${msg.sender})`;
                                            })()
                                    }
                                </span>
                                <span>{msg.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-white/5">
                <form onSubmit={handleSend} className="relative group">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter command..."
                        className="w-full bg-black/50 border border-white/10 rounded px-4 py-3 pr-12 focus:outline-none focus:border-neon-blue/50 text-neon-blue placeholder-white/20 transition-all"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-neon-blue transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
