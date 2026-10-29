import React, { useState, useEffect } from 'react';
import type { Message, GemId, FeedbackType, MemCube, UserGestalt, LibraryNode } from '@Omni/types';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { NexusContainer } from '../components/Shared/NexusContainer';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { ThoughtOrchestrator as OrchestratorModule } from '../components/HUDModules/ThoughtOrchestrator';
import { DynamicTOC } from '../components/Shared/DynamicTOC';
import { useOntologicalContext } from '../council/OntologicalContext';

// Map factor IDs to their pillar pairs for recursion
// 'Thought' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Informs: 'Self',
    Recursion: 'Thought',
    Utilizes: 'Logic',
    Synthesizes: 'Unity',
    Represents: 'Existence',
    Drives: 'Improvement',
    Develops: 'Mastery',
    Articulates: 'Resonance',
    Enables: 'Transcendence',
    Transcends: 'Omni',
};

const PILLAR_TO_FACTOR: Record<string, string> = Object.entries(FACTOR_TO_PILLAR).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

interface ThoughtInterfaceProps {
    messages: Message[];
    isLoading: boolean;
    loadingStage?: any;
    onSend: (text: string) => void;
    userInput: string;
    setUserInput: (text: string) => void;
    onFeedback: (messageId: string, type: FeedbackType) => void;
    isFlowState: boolean;
    onToggleFlow: () => void;
    onClear: () => void;
    onExport: () => void;
    onResetKey: () => void;
    selectedGems: GemId[];
    onToggleGem: (id: GemId) => void;
    library: LibraryNode | null;
    onUpdateLibrary: (cube: MemCube) => void;
    userGestalt: UserGestalt;
    onCrystalize?: (msg: Message) => void;
}

export const ThoughtInterface: React.FC<ThoughtInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default to Empty
    const { activePath } = useOntologicalContext();

    useEffect(() => {
        if (activePath === 'thought.thought' || activePath === 'thought.recursion' || activePath === 'thought') {
            if (!activeFactors.includes('Recursion')) {
                setActiveFactors(['Recursion']);
            }
        }
    }, [activePath]);

    useEffect(() => {
        const jumpTarget = localStorage.getItem('mystra_pending_jump');
        if (jumpTarget) {
            const factorId = PILLAR_TO_FACTOR[jumpTarget];
            if (factorId && !activeFactors.includes(factorId)) {
                setActiveFactors(prev => [...prev, factorId]);
            }
            localStorage.removeItem('mystra_pending_jump');
        }
    }, [activeFactors]);

    const toggleFactor = (id: string) => {
        setActiveFactors((prev: string[]) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const dockItems = [
        { id: 'Informs', label: 'Informs (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Thought_Self' },
        { id: 'Recursion', label: 'Recursion (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Thought_Thought' },
        { id: 'Utilizes', label: 'Utilizes (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Thought_Logic' },
        { id: 'Synthesizes', label: 'Synthesizes (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Thought_Unity' },
        { id: 'Represents', label: 'Represents (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Thought_Existence' },
        { id: 'Drives', label: 'Drives (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Thought_Improvement' },
        { id: 'Develops', label: 'Develops (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Thought_Mastery' },
        { id: 'Articulates', label: 'Articulates (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Thought_Resonance' },
        { id: 'Enables', label: 'Enables (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Thought_Transcendence' },
        { id: 'Transcends', label: 'Transcends (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#64748b', dot: 'Thought_Omnipotence' },
    ];

    return (
        <div className="flex flex-col w-full h-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#fbbf24"
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 shrink-0 ml-[80px]">
                <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xl font-serif">
                    {ID_TO_SYMBOL['Thought']}
                </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Thought</h1>
                        <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest">Cognitive Stream</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 overflow-hidden relative ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Thought']}
                    title="THOUGHT ORCHESTRATOR"
                    mission="Recursive cognition mirroring the cosmic structure."
                    baseColor="#fbbf24"
                >
                    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <OrchestratorModule onClose={() => {}} />
                        </div>
                        <div className="w-full xl:w-96 pl-2 pr-8 pb-12">
                            <DynamicTOC onNavigate={() => {}} />
                        </div>
                    </div>
                </StandardLandingPage>

                {/* 2. OVERLAY LAYER: FACTOR TOOLS (Interactive Drawer) */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    <AnimatePresence>
                        {activeFactors.map(factorId => (
                            <motion.div
                                key={factorId}
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "100%", opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute inset-0 pointer-events-auto flex flex-col z-20"
                            >
                                <NexusContainer
                                    path={['Thought', FACTOR_TO_PILLAR[factorId]]}
                                    onClose={() => toggleFactor(factorId)}
                                    {...props}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
