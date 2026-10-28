import React from 'react';
import { motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';

// --- Types ---
import type { CouncilAgent } from '../../council/agentRegistry';
import type { AgentId } from '../../council/agentRegistry';
import type { HRMState } from '../../council/HRM';

interface UnifiedDebugPanelProps {
    isVisible: boolean;
    onClose: () => void;

    // Agent State (kept for props consistency if needed elsewhere)
    agents: Record<string, CouncilAgent>;
    activeAgentId: AgentId;
    setActiveAgent: (id: AgentId) => void;
    visibleAgentIds: string[];
    toggleAgentVisibility: (id: AgentId) => void;
    
    // System Helpers
    hrmState: HRMState;
    isConnected: boolean;
    fileNodes: any[];
    mountFileSystem?: () => Promise<any> | void;
    crystallizeMemory: () => Promise<void>;
    listGeminiModels: () => Promise<void>;
    useLocalAi: boolean;
    setUseLocalAi: (val: boolean) => void;
}

export const UnifiedDebugPanel: React.FC<UnifiedDebugPanelProps> = (props) => {
    if (!props.isVisible) return null;

    return (
        <motion.div
            initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
            className="fixed top-0 right-0 h-full w-[350px] bg-slate-950/95 border-l border-slate-800 shadow-2xl z-[9999] flex flex-col backdrop-blur-md"
        >
            {/* --- HEADER --- */}
            <div className="h-12 border-b border-slate-800 flex items-center justify-between px-4 bg-black/40">
                <div className="flex items-center gap-2 text-slate-200 font-display font-bold text-sm tracking-wider">
                    <HardDrive size={14} className="text-blue-500" />
                    NEXUS CONTROL (SYSTEM)
                </div>
                <button onClick={props.onClose} className="p-1 hover:bg-red-900/30 rounded text-slate-500 hover:text-red-400">✕</button>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                <div className="space-y-6">
                    <Section title="Mystra Construct">
                        <Toggle
                            label={props.useLocalAi ? "MYSTRA BRIDGE (LOCAL) ACTIVE" : "MYSTRA BRIDGE INACTIVE"}
                            active={props.useLocalAi}
                            onClick={() => props.setUseLocalAi(!props.useLocalAi)}
                        />
                        <p className="text-[9px] text-slate-500 mt-2">
                            Toggles between Gemini Cloud Inference and Local Host Ollama.
                        </p>
                    </Section>

                    <Section title="Filesystem (MemCube)">
                        <div className="flex gap-2">
                            <button onClick={props.mountFileSystem} className={`flex-1 overflow-hidden whitespace-nowrap py-1.5 rounded text-[10px] font-bold border ${props.isConnected ? 'bg-green-900/30 border-green-700 text-green-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {props.isConnected ? `MOUNTED (${props.fileNodes.length})` : 'MOUNT ROOT'}
                            </button>
                            <button onClick={props.crystallizeMemory} disabled={!props.isConnected} className="flex-1 py-1.5 rounded text-[10px] font-bold border border-blue-900 bg-blue-900/20 text-blue-400 disabled:opacity-50">
                                CRYSTALLIZE
                            </button>
                        </div>
                    </Section>

                    <Section title="HRM Core State">
                        <div className="bg-slate-900 rounded p-2 text-xs font-mono space-y-1 border border-slate-800">
                            <div className="flex justify-between">
                                <span className="text-slate-500">EMOTION</span>
                                <span className={props.hrmState?.emotionalState === 'PASSIVE' ? 'text-slate-400' : 'text-green-400'}>{props.hrmState?.emotionalState}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">STEP</span>
                                <span>{props.hrmState?.step}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">VECTOR</span>
                                <span className="text-blue-400">[{props.hrmState?.z_H?.slice(0, 3).map((n: number) => n.toFixed(1)).join(',')}]</span>
                            </div>
                        </div>
                    </Section>

                    <button onClick={props.listGeminiModels} className="w-full text-xs text-slate-500 hover:text-slate-300 underline">
                        Dump Gemini Models to Chat
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// --- Subcomponents ---

const Section: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-l-2 border-slate-800 pl-3">
        <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-wider">{title}</h4>
        {children}
    </div>
);

const Toggle: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-1 text-[9px] font-bold rounded border transition-colors ${active ? 'bg-blue-900/30 border-blue-600 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
    >
        {label}
    </button>
);
