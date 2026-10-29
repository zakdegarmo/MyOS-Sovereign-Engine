import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';

interface LogEntry {
    id: string;
    timestamp: string;
    event: string;
    agent: string;
    type: 'system' | 'commit' | 'error' | 'milestone';
    hash?: string;
}

const MOCK_HISTORY: LogEntry[] = [
    { id: '1', timestamp: '2026-03-22T22:30:00', event: 'Mistral Local Integration (SWARM)', agent: 'System', type: 'milestone', hash: 'ms_7b_v1' },
    { id: '2', timestamp: '2026-03-22T21:45:00', event: 'Camera Rig: InterpLookAt Fix', agent: 'Graphics', type: 'commit', hash: 'c8b2d4' },
    { id: '3', timestamp: '2026-03-22T21:15:00', event: 'Virtual TV: Telemetry Channel Active', agent: 'Interface', type: 'commit', hash: 'tv_s4_2' },
    { id: '4', timestamp: '2026-03-22T20:00:00', event: 'Bartender NPC: LLM Barks Enabled', agent: 'Council', type: 'system', hash: 'npc_b01' },
    { id: '5', timestamp: '2026-03-22T19:30:00', event: 'Gradients Shifted: Resonance v3', agent: 'Self', type: 'milestone', hash: 'res_flux' },
];

export const ChroniclesPanel: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: 'session_start', timestamp: new Date().toISOString(), event: 'MyOS Runtime Environment Initialized', agent: 'Core', type: 'milestone', hash: 'init_v0.9.1' },
        ...MOCK_HISTORY
    ]);

    React.useEffect(() => {
        const handler = (e: any) => {
            const { event, agent, type, timestamp, hash } = e.detail;
            const newEntry: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: timestamp || new Date().toISOString(),
                event,
                agent,
                type: type || 'system',
                hash
            };
            setLogs(prev => [newEntry, ...prev].slice(0, 50));
        };
        window.addEventListener('myos_system_log', handler);
        return () => window.removeEventListener('myos_system_log', handler);
    }, []);

    return (
        <div className="w-full h-full flex flex-col bg-slate-950/90 backdrop-blur-xl border-l border-emerald-500/20 overflow-hidden relative font-mono select-none">
            {/* Header */}
            <div className="h-12 border-b border-emerald-500/30 bg-emerald-900/10 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <Clock size={16} className="text-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-[0.2em]">Chronicles // Runtime_History</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[10px] text-emerald-500/70 font-bold uppercase">Streaming live</span>
                </div>
            </div>

            {/* Timeline View */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                <div className="absolute left-[39px] top-8 bottom-8 w-[1px] bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent" />
                
                <div className="relative space-y-10 pl-6">
                    {logs.map((log) => (
                        <div key={log.id} className="relative group">
                            {/* Marker */}
                            <div className={`absolute -left-[30px] top-1.5 w-3 h-3 rounded-full border-2 bg-slate-950 z-10 transition-all duration-300 group-hover:scale-125 ${
                                log.type === 'milestone' ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]' :
                                log.type === 'error' ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]' :
                                'border-emerald-500/50'
                            }`} />

                            <div className="flex flex-col gap-2 bg-white/[0.02] hover:bg-white/[0.05] p-4 rounded-lg border border-white/[0.05] transition-all duration-300 group-hover:translate-x-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[13px] font-bold tracking-wide ${
                                            log.type === 'milestone' ? 'text-amber-400' : 
                                            log.type === 'error' ? 'text-red-400' :
                                            'text-emerald-300'
                                        }`}>
                                            {log.event.toUpperCase()}
                                        </span>
                                        {log.hash && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500/60 font-mono border border-emerald-500/20">
                                                {log.hash}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-white/30 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5">
                                        <Info size={10} className="text-emerald-500/50" />
                                        SOURCE: {log.agent}
                                    </span>
                                    <span>|</span>
                                    <span className="text-emerald-500/40">TYPE: {log.type}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="h-8 bg-black/40 border-t border-emerald-500/10 px-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4 text-[9px] text-emerald-500/30 font-bold uppercase">
                    <span>Total_Events: {logs.length}</span>
                    <span>Buffer_Status: Nominal</span>
                </div>
                <div className="text-[9px] text-emerald-500/20 italic">
                    MyOS // Fragment_Memory_Service
                </div>
            </div>
        </div>
    );
};
