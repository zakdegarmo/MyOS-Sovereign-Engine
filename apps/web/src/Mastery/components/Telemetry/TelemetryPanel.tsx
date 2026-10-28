import React, { useEffect, useState, useRef } from 'react';
import { Activity, Zap, PauseCircle, Filter, PlayCircle } from 'lucide-react';
import { useSwarm } from '@Omni/lib/useSwarm';
import { type ThoughtPacket, AgentRole, TEAM_DATA } from '@antigravity/swarm-core';

export default function TelemetryPanel() {
    const [thoughts, setThoughts] = useState<ThoughtPacket[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [rate, setRate] = useState(30); // Seconds
    const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(Object.values(AgentRole)));
    const endRef = useRef<HTMLDivElement>(null);

    // Event Source Listener
    useEffect(() => {
        const eventSource = new EventSource('http://localhost:3000/sse');

        eventSource.addEventListener('telemetry', (e) => {
            if (!isActive) return;

            try {
                const packet: ThoughtPacket = JSON.parse(e.data);
                setThoughts(prev => [...prev, packet].slice(-100)); // Keep last 100
            } catch (err) {
                console.error("Telemetry Parse Error", err);
            }
        });

        return () => {
            eventSource.close();
        };
    }, [isActive]);

    // Auto-scroll
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thoughts]);

    // Filter Logic
    const toggleAgentFilter = (role: string) => {
        const next = new Set(selectedAgents);
        if (next.has(role)) next.delete(role);
        else next.add(role);
        setSelectedAgents(next);
    };

    const filteredThoughts = thoughts.filter(t => selectedAgents.has(t.source));

    return (
        <div className="flex flex-col h-full bg-black/90 border border-white/10 rounded-lg overflow-hidden font-mono text-[10px]">
            {/* Header / Controls */}
            <div className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-neon-blue">
                    <Activity className="w-3 h-3" />
                    <span className="font-bold tracking-widest uppercase">Telemetry</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Rate Slider */}
                    <div className="flex items-center gap-1 opacity-80 hover:opacity-100">
                        <span className="text-gray-500">RATE: {rate}s</span>
                        <input
                            type="range"
                            min="5"
                            max="60"
                            step="5"
                            value={rate}
                            onChange={(e) => setRate(parseInt(e.target.value))}
                            className="w-16 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                        />
                    </div>

                    {/* Master Toggle */}
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
                    >
                        {isActive ? <PauseCircle className="w-3 h-3" /> : <PlayCircle className="w-3 h-3" />}
                        <span className="font-bold">{isActive ? 'LIVE' : 'PAUSED'}</span>
                    </button>
                </div>
            </div>

            {/* Agent Filter Dock */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-black/40">
                <Filter className="w-3 h-3 text-gray-600 mr-1" />
                {Object.values(AgentRole).map(role => {
                    const agent = TEAM_DATA[role];
                    const isSelected = selectedAgents.has(role);
                    return (
                        <button
                            key={role}
                            onClick={() => toggleAgentFilter(role)}
                            className={`px-1.5 py-0.5 rounded border ${isSelected ? `border-${agent.color.replace('text-', '')}/50 bg-white/5 opacity-100` : 'border-transparent opacity-40 hover:opacity-70'} transition-all`}
                            style={{ color: isSelected ? undefined : 'gray' }}
                        >
                            <span className={isSelected ? agent.color : ''}>{agent.symbol}</span>
                        </button>
                    );
                })}
            </div>

            {/* Stream (Stock Ticker) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono">
                {filteredThoughts.length === 0 && (
                    <div className="text-gray-700 text-center mt-4 italic">No signals detected...</div>
                )}

                {filteredThoughts.map((packet) => {
                    const agent = TEAM_DATA[packet.source] || { color: 'text-gray-500', symbol: '?' };

                    return (
                        <div key={packet.id} className="flex items-center gap-2 hover:bg-white/5 px-1 py-0.5 rounded cursor-default group">
                            <span className="text-gray-600 w-12 flex-shrink-0">{new Date(packet.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                            <span className={`w-4 text-center font-bold ${agent.color}`}>{agent.symbol}</span>
                            <span className="text-gray-400 w-16 truncate">{packet.source}</span>
                            <span className="text-gray-500 w-16 truncate uppercase text-[9px]">{packet.status}</span>
                            <span className="text-gray-300 flex-1 truncate group-hover:whitespace-normal group-hover:break-words">
                                {packet.intent}
                            </span>
                            {packet.context && (
                                <span className="text-gray-700 hidden group-hover:block text-[9px] uppercase border border-gray-800 px-1 rounded">
                                    {packet.context}
                                </span>
                            )}
                        </div>
                    );
                })}
                <div ref={endRef} />
            </div>
        </div>
    );
}
