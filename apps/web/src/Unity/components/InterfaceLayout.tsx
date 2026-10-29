import React from 'react';
import { AgentRole } from '@antigravity/swarm-core';
import {
    Brain, Network, Activity, Database, TrendingUp, Award, Wifi, Sun, Globe, User
} from 'lucide-react';

interface InterfaceLayoutProps {
    activeRole: AgentRole;
    onRoleSelect: (role: AgentRole) => void;
    systemStatus?: {
        cpu: number;
        ram: number;
        uptime: number;
        activeAgents: number;
    };
    children: React.ReactNode;
}

const AGENT_CONFIG = [
    { role: AgentRole.Thought, icon: Brain, color: 'text-cyan-400', label: 'THOUGHT' },
    { role: AgentRole.Logic, icon: Network, color: 'text-purple-400', label: 'LOGIC' },
    { role: AgentRole.Unity, icon: Activity, color: 'text-green-400', label: 'UNITY' },
    { role: AgentRole.Existence, icon: Database, color: 'text-yellow-400', label: 'EXISTENCE' },
    { role: AgentRole.Improvement, icon: TrendingUp, color: 'text-blue-400', label: 'IMPROVEMENT' },
    { role: AgentRole.Mastery, icon: Award, color: 'text-red-400', label: 'MASTERY' },
    { role: AgentRole.Resonance, icon: Wifi, color: 'text-pink-400', label: 'RESONANCE' },
    { role: AgentRole.Transcendence, icon: Sun, color: 'text-orange-400', label: 'TRANSCENDENCE' },
    { role: AgentRole.Omni, icon: Globe, color: 'text-white', label: 'OMNI' },
    { role: AgentRole.Self, icon: User, color: 'text-teal-400', label: 'SELF' },
];

export default function InterfaceLayout({ activeRole, onRoleSelect, systemStatus, children }: InterfaceLayoutProps) {
    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Top Bar / Navigation */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-black/50 backdrop-blur-sm z-50">
                <div className="flex items-center gap-2">
                    <Globe className="w-6 h-6 text-cyan-500 animate-pulse" />
                    <h1 className="text-xl font-bold tracking-[0.2em] text-cyan-100">ANTIGRAVITY<span className="text-cyan-600">SWARM</span></h1>
                </div>

                {/* Agent Selector */}
                <div className="flex items-center gap-1 bg-black/40 rounded-full p-1 border border-white/10">
                    {AGENT_CONFIG.map((agent) => (
                        <button
                            key={agent.role}
                            onClick={() => onRoleSelect(agent.role)}
                            className={`p-2 rounded-full transition-all duration-300 relative group ${activeRole === agent.role ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-110' : 'hover:bg-white/5 opacity-60 hover:opacity-100'
                                }`}
                            title={agent.label}
                        >
                            <agent.icon className={`w-5 h-5 ${agent.color}`} />
                            {activeRole === agent.role && (
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-white/70 bg-black/80 px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                                    {agent.label}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* System Vitals */}
                <div className="flex items-center gap-4 text-xs font-mono text-cyan-500/80">
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>CPU: {systemStatus?.cpu || 0}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>MEM: {systemStatus?.ram || 0}%</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 overflow-hidden relative">
                {/* Background Grid/Effects could go here */}
                {children}
            </div>
        </div>
    );
}
