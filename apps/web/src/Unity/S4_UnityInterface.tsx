import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { LibraryNode, UserGestalt, Synapse, GemId } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { UnityInterlink as UnityModule } from '../components/HUDModules/UnityInterlink';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

// Map factor IDs to their pillar pairs for recursion
// 'Unity' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Integrates: 'Self',
    Harmonizes: 'Thought',
    Requires: 'Logic',
    Essence: 'Unity',
    Binds: 'Existence',
    Fosters: 'Improvement',
    CulminatesIn: 'Mastery',
    Amplifies: 'Resonance',
    Achieves: 'Transcendence',
    UltimateExpressionOf: 'Omni',
};

interface UnityInterfaceProps {
    library: LibraryNode | null;
    onUpdateLibrary: (book: any) => void;
    onAuthError: () => void;
    userGestalt: UserGestalt;
    onAddSynapses: (synapses: Synapse[]) => void;
    connections: Synapse[];
    ghostNodes: any[];
    onAddGhostNodes: (ghosts: any[]) => void;
    selectedNodeId: string | null;
    onSelectNode: (id: string | null) => void;
    orchestrator?: any; // AgentOrchestrator
}

const UnityInterface: React.FC<UnityInterfaceProps & Record<string, any>> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    // DOCK ITEMS
    const dockItems = [
        { id: 'Integrates', label: 'Integrates (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Unity_Self' },
        { id: 'Harmonizes', label: 'Harmonizes (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Unity_Thought' },
        { id: 'Requires', label: 'Requires (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Unity_Logic' },
        { id: 'Essence', label: 'Essence (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Unity_Unity' },
        { id: 'Binds', label: 'Binds (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Unity_Existence' },
        { id: 'Fosters', label: 'Fosters (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Unity_Improvement' },
        { id: 'CulminatesIn', label: 'Culminates In (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Unity_Mastery' },
        { id: 'Amplifies', label: 'Amplifies (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Unity_Resonance' },
        { id: 'Achieves', label: 'Achieves (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Unity_Transcendence' },
        { id: 'UltimateExpressionOf', label: 'Ult. Expression (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#ffffff', dot: 'Unity_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#6366f1"
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-30 ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Unity']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Unity</h1>
                        <p className="text-[10px] font-mono text-indigo-500/60 uppercase tracking-widest">NEXUS INTEGRATION</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 overflow-hidden relative ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Unity']}
                    title="UNITY INTERLINK"
                    mission="To Connect, Bind, and Integrate All Phenomena."
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <UnityModule onClose={() => {}} />
                        </div>
                        <div className="w-full lg:w-96 pl-2 pr-8 pb-12">
                            <DynamicTOC onNavigate={() => {}} />
                        </div>
                    </div>
                </StandardLandingPage>

                {/* 2. OVERLAY LAYER: FACTOR DRAWERS */}
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
                                    path={['Unity', FACTOR_TO_PILLAR[factorId]]}
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

export default UnityInterface;
