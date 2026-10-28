import React from 'react';
import { motion } from 'framer-motion';
import {
    Fingerprint, Brain, Binary, Network, Mountain,
    Zap, GraduationCap, Music, Rocket, Globe,
    Eye, EyeOff, MessageSquare,
    Users, Users2, User, Layers,
    Monitor, Coffee, HelpCircle, Bug, Scroll, BookOpen, Cpu, HardDrive, Sparkles, Clapperboard, Compass,
    Circle, Square, Bike, Box, Home
} from 'lucide-react';

import { BootstrapTutorial } from './BootstrapTutorial';
import { useCanvasRecorder } from '../../hooks/useCanvasRecorder';

import { type AgentId } from '../../council/agentRegistry';
import { useOntologicalContext } from '../../council/OntologicalContext';

export const AGENT_ICONS: Record<AgentId, React.ReactNode> = {
    self: <Fingerprint size={16} />,
    thought: <Brain size={16} />,
    logic: <Binary size={16} />,
    unity: <Network size={16} />,
    existence: <Mountain size={16} />,
    improvement: <Zap size={16} />,
    mastery: <GraduationCap size={16} />,
    resonance: <Music size={16} />,
    transcendence: <Rocket size={16} />,
    omni: <Globe size={16} />,
    orchestrator: <Fingerprint size={16} />,
    bartender: <Coffee size={16} />,
    user: <User size={16} />
};

interface SystemHudProps {
    isVisible: boolean;
    setIsVisible: (visible: boolean) => void;
    isPanelsVisible: boolean;
    setIsPanelsVisible: (visible: boolean) => void;
    activeAgentId: AgentId;
    setActiveAgent: (id: AgentId) => void;
    visibleAgentIds: AgentId[];
    toggleAgentVisibility: (id: AgentId) => void;
    onOpenOrchestrator: () => void;
    isSocialMode: boolean;
    setIsSocialMode: (val: boolean) => void;
    activeModuleId: string | null;
    setActiveModuleId: (id: string | null) => void;
    setActiveGem?: (gem: any) => void;
    agents: any;
    onExportState: () => void;
    onImportState: () => Promise<any> | void;
    isUiVisible: boolean;
    setIsUiVisible: (val: boolean) => void;
    onToggleAllAgents?: (show: boolean) => void;
    onHelpTrigger?: () => void;
    isTelemetryVisible?: boolean;
    setIsTelemetryVisible?: (val: boolean) => void;
    currentDimension?: string;
    onDimensionSwap?: (dim: string) => void;
    isDiegeticPrismOpen?: boolean;
    setIsDiegeticPrismOpen?: (val: boolean) => void;
    isDecaCouncilOpen?: boolean;
    setIsDecaCouncilOpen?: (val: boolean) => void;
}

export const SystemHud: React.FC<SystemHudProps> = ({
    isVisible, setIsVisible,
    isPanelsVisible, setIsPanelsVisible,
    activeAgentId, setActiveAgent,
    visibleAgentIds, toggleAgentVisibility,
    onOpenOrchestrator,
    isSocialMode, setIsSocialMode,
    activeModuleId, setActiveModuleId,
    setActiveGem,
    agents,
    onExportState,
    onImportState,
    isUiVisible, setIsUiVisible,
    onToggleAllAgents,
    onHelpTrigger,
    isTelemetryVisible = false,
    setIsTelemetryVisible = () => {},
    currentDimension,
    onDimensionSwap,
    isDiegeticPrismOpen = false,
    setIsDiegeticPrismOpen = () => {},
    isDecaCouncilOpen = false,
    setIsDecaCouncilOpen = () => {}
}) => {
    const { setActivePath } = useOntologicalContext();
    const { isRecording, formattedDuration, startRecording, stopRecording } = useCanvasRecorder();

    return (
        <div className="fixed bottom-0 left-0 w-full h-16 bg-black/85 border-t border-white/20 z-[10000] flex items-center justify-between px-4 pointer-events-none shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">

            {/* LEFT SIDE: PILLAR AVATAR DOCK (Council Visibility) */}
            <motion.div
                animate={{
                    opacity: isUiVisible ? 1 : 0,
                    x: isUiVisible ? 0 : -20
                }}
                className="flex items-center gap-2 pointer-events-auto h-full"
            >
                <div className="flex gap-2 h-full items-center">
                    {/* The 10 Pillars */}
                    {(['self', 'thought', 'logic', 'unity', 'existence', 'improvement', 'mastery', 'resonance', 'transcendence', 'omni'] as AgentId[]).map((id) => {
                        const agent = agents[id];
                        if (!agent) return null;
                        const isNodeVisible = visibleAgentIds.includes(id);
                        const isActive = activeAgentId === id;

                        return (
                            <button
                                key={id}
                                onClick={() => {
                                    if (id === 'omni') {
                                        const allPillars = ['self', 'thought', 'logic', 'unity', 'existence', 'improvement', 'mastery', 'resonance', 'transcendence', 'omni'] as AgentId[];
                                        const currentlyVisiblePillars = visibleAgentIds.filter(pid => allPillars.includes(pid));
                                        const shouldShowAll = currentlyVisiblePillars.length < allPillars.length;
                                        if (onToggleAllAgents) {
                                            onToggleAllAgents(shouldShowAll);
                                        }
                                        setActiveAgent('omni');
                                    } else {
                                        setActiveAgent(id);
                                        if (!isNodeVisible) toggleAgentVisibility(id);
                                    }
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    toggleAgentVisibility(id);
                                }}
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group
                                    ${isActive
                                        ? `bg-white/10 ${agent.color} border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]`
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'}
                                    ${isNodeVisible ? 'opacity-100' : 'opacity-25 grayscale'}
                                `}
                                title={`${agent.name} - ${agent.title}`}
                             >
                                {AGENT_ICONS[id]}
                                {isNodeVisible && (
                                    <div className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${agent.color.replace('text-', 'bg-')} shadow-[0_0_8px_currentColor]`} />
                                )}

                                {/* Label Tip */}
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 transition-all scale-95 group-hover:scale-100 z-[10001]">
                                    {agent.name.toUpperCase()}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* RIGHT SIDE: UTILITY DOCK */}
            <div className="flex items-center gap-3 pointer-events-auto h-full">

                <button
                    onClick={onOpenOrchestrator}
                    className="w-14 h-14 bg-white text-black rounded-xl flex items-center justify-center hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] group border-2 border-black"
                    title="System Orchestrator"
                >
                    <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
                </button>

                <div className="w-px h-10 bg-white/10 mx-1" />

                {/* UTILITY BUTTONS */}
                <div className="flex gap-1.5">

                    <HudButton
                        active={activeModuleId === 'stagecraft-controls'}
                        onClick={() => {
                            const next = activeModuleId === 'stagecraft-controls' ? null : 'stagecraft-controls';
                            setActiveModuleId(next);
                        }}
                        icon={<Globe size={18} className={activeModuleId === 'stagecraft-controls' ? 'text-cyan-400' : ''} />}
                        label="Environment Selection (Stagecraft)"
                    />

                    <div className="w-px h-10 bg-white/10 mx-1" />

                    {/* NEW: PANELS TOGGLE (Temple UI 2D Shell) */}
                    <HudButton
                        active={isPanelsVisible}
                        onClick={() => setIsPanelsVisible(!isPanelsVisible)}
                        icon={isPanelsVisible ? <Layers size={18} className="text-blue-400" /> : <Layers size={18} />}
                        label="Toggle Side Panels"
                    />

                    {/* 3D DECAGONAL PRISM NAVIGATOR */}
                    <HudButton
                        active={isDiegeticPrismOpen}
                        onClick={() => {
                            if (isDiegeticPrismOpen) {
                                window.dispatchEvent(new CustomEvent('myos_trigger_diegetic_collapse'));
                            } else {
                                setIsDiegeticPrismOpen?.(true);
                                setIsPanelsVisible(false);
                            }
                        }}
                        icon={<Box size={18} className={isDiegeticPrismOpen ? "text-cyan-300 animate-pulse" : "text-cyan-400"} />}
                        label="Toggle 3D Decagonal Prism Navigator [P]"
                    />

                    {/* RUBIK'S CORTEX BRAIN EDITOR (SETTINGS MENU) */}
                    <HudButton
                        active={activeModuleId === 'brain-editor'}
                        onClick={() => setActiveModuleId(activeModuleId === 'brain-editor' ? null : 'brain-editor')}
                        icon={<Brain size={18} className={activeModuleId === 'brain-editor' ? 'text-purple-300 animate-pulse' : 'text-purple-400'} />}
                        label="Rubik's Cortex • Brain Editor (Settings Menu & Model Routing)"
                    />

                    {/* DECA-COUNCIL AGORA (11 MINDS) OVERLAY */}
                    <HudButton
                        active={currentDimension === 'agora_sandbox' && isDecaCouncilOpen}
                        onClick={() => {
                            if (currentDimension !== 'agora_sandbox') {
                                onDimensionSwap?.('agora_sandbox');
                                setIsDecaCouncilOpen?.(true);
                            } else {
                                setIsDecaCouncilOpen?.(!isDecaCouncilOpen);
                            }
                        }}
                        icon={<Users size={18} className={(currentDimension === 'agora_sandbox' && isDecaCouncilOpen) ? "text-amber-300 animate-pulse" : "text-amber-400"} />}
                        label={currentDimension === 'agora_sandbox' ? "Toggle Deca-Council Chat [K]" : "Enter Deca-Council Agora Sandbox (11 Minds) [K]"}
                    />

                    {/* NEW: UI TOGGLE */}
                    <HudButton
                        active={isUiVisible}
                        onClick={() => setIsUiVisible(!isUiVisible)}
                        icon={isUiVisible ? <Eye size={18} className="text-emerald-400" /> : <EyeOff size={18} />}
                        label="Toggle Council Dock"
                    />

                    {/* NEW: TELEMETRY TOGGLE */}
                    <HudButton
                        active={isTelemetryVisible}
                        onClick={() => setIsTelemetryVisible(!isTelemetryVisible)}
                        icon={<Bug size={18} className={isTelemetryVisible ? 'text-green-400' : ''} />}
                        label="Telemetry"
                    />

                    <HudButton
                        active={false}
                        onClick={() => {
                            setActivePath('thought.thought');
                            setActiveGem?.('Thought');
                            setIsPanelsVisible(true);
                            setIsVisible(false);
                        }}
                        icon={<Scroll size={18} className="text-cyan-400" />}
                        label="Thought Library (Thought.Thought)"
                    />

                    <HudButton
                        active={activeModuleId === 'aether-console'}
                        onClick={() => setActiveModuleId(activeModuleId === 'aether-console' ? null : 'aether-console')}
                        icon={<Cpu size={18} className={activeModuleId === 'aether-console' ? 'text-cyan-400' : ''} />}
                        label="Aether Console (Ollama LLM & JIT RAG Panel)"
                    />

                    <HudButton
                        active={false}
                        onClick={() => {
                            setActivePath('self.identity');
                            setActiveGem?.('Self');
                            setIsPanelsVisible(true);
                            setIsVisible(false);
                        }}
                        icon={<Users size={18} className="text-amber-400" />}
                        label="Modify Character (Self.Self Avatar Lab)"
                    />

                    <HudButton
                        active={activeModuleId === 'cyclotrope-hero'}
                        onClick={() => setActiveModuleId(activeModuleId === 'cyclotrope-hero' ? null : 'cyclotrope-hero')}
                        icon={<Sparkles size={18} className={activeModuleId === 'cyclotrope-hero' ? 'text-indigo-400 animate-pulse' : 'text-indigo-300'} />}
                        label="Diegetic Hero Studio (Astrolabe Cyclotrope)"
                    />

                    <HudButton
                        active={currentDimension === 'cognitive_matrix'}
                        onClick={() => {
                            if (onDimensionSwap) {
                                onDimensionSwap(currentDimension === 'cognitive_matrix' ? 'desktop' : 'cognitive_matrix');
                            }
                        }}
                        icon={<Compass size={18} className={currentDimension === 'cognitive_matrix' ? 'text-purple-300 animate-pulse' : 'text-purple-400'} />}
                        label="Antigravity Cognitive Matrix (10 Pillars 3D Reasoning)"
                    />

                    <HudButton
                        active={activeModuleId === 'state-manager'}
                        onClick={() => setActiveModuleId(activeModuleId === 'state-manager' ? null : 'state-manager')}
                        icon={<HardDrive size={18} className={activeModuleId === 'state-manager' ? 'text-amber-400' : ''} />}
                        label="Save / Load System State"
                    />

                    {/* WARP TO HOME (3D DESKTOP ENVIRONMENT) */}
                    <button
                        onClick={() => {
                            onDimensionSwap?.('desktop');
                        }}
                        className={`pointer-events-auto flex items-center gap-1.5 px-3.5 h-11 rounded-xl text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(56,189,248,0.25)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] ${
                            currentDimension === 'desktop'
                                ? 'bg-cyan-500/25 text-cyan-200 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-400/50'
                        }`}
                        title="Return to 3D Desktop Environment (Home Dimension)"
                    >
                        <Home size={16} className="text-cyan-400" />
                        <span>WARP TO HOME</span>
                    </button>




                    <div className="w-px h-10 bg-white/10 mx-1" />

                    {/* GLOBAL 3D VIEWPORT RECORDING (ZERO UI, 60FPS) */}
                    {isRecording ? (
                        <button
                            onClick={() => stopRecording()}
                            className="flex items-center gap-2 px-3.5 h-11 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border-2 border-rose-400 font-black text-xs transition-all shadow-[0_0_25px_rgba(244,63,94,0.7)] animate-pulse"
                            title="Stop Recording and Save to Cinema Screenings"
                        >
                            <Square size={14} className="fill-white text-white" />
                            <span>STOP ({formattedDuration})</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => startRecording(`take_${currentDimension || 'viewport'}`)}
                            className="flex items-center gap-2 px-3.5 h-11 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border-2 border-rose-500/50 text-rose-300 hover:text-white font-black text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.25)] hover:scale-105"
                            title="Record 3D Viewport to Video (Zero UI, 60fps WebGL Stream)"
                        >
                            <Circle size={13} className="fill-rose-500 text-rose-500 animate-pulse" />
                            <span>REC</span>
                        </button>
                    )}

                    <div className="w-px h-10 bg-white/10 mx-1" />

                    {/* HELP BUTTON */}
                    <HudButton
                        active={false}
                        onClick={() => onHelpTrigger?.()}
                        icon={<HelpCircle size={24} className="text-amber-400" />}
                        label="System Help & Guidance (Tutor)"
                    />

                    <div className="w-px h-10 bg-white/10 mx-1" />

                    <button
                        onClick={() => setIsVisible(!isVisible)}
                        className={`
                            w-14 h-12 rounded-xl flex items-center justify-center transition-all border-2
                            ${isVisible
                                ? 'bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500 hover:text-white shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]'
                                : 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}
                        `}
                        title={isVisible ? 'Dismiss Council' : 'Summon Council'}
                    >
                        {isVisible ? <Users2 size={28} /> : <Users size={28} />}
                    </button>
                </div>
            </div>
            <BootstrapTutorial 
                isOpen={activeModuleId === 'bootstrap-guide'} 
                onClose={() => setActiveModuleId(null)} 
            />
        </div>
    );
};

const HudButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`
            w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 relative group
            ${active
                ? 'bg-white/10 text-white border-white/40 shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]'
                : 'bg-transparent text-white/40 border-transparent hover:bg-white/10 hover:text-white hover:border-white/20'}
        `}
        title={label}
    >
        {icon}
        {/* Active Dot */}
        {active && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#00ffff]" />}
    </button>
);
