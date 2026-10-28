import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { UserGestalt, GemId } from '@Omni/types';
import { AgentOrchestrator } from '@Omni/lib/modules/AgentOrchestrator';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { InventoryModule as ImprovementModule } from '../components/HUDModules/InventoryModule';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

interface ImprovementInterfaceProps {
    workflowEngine: any;
    userGestalt?: UserGestalt;
    agentOrchestrator?: AgentOrchestrator;
}

// Map factor IDs to their pillar pairs for recursion
// 'Improvement' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    FineTunes: 'Self',
    Refines: 'Thought',
    Systematizes: 'Logic',
    Optimizes: 'Unity',
    Strengthens: 'Existence',
    Process: 'Improvement',
    Hones: 'Mastery',
    Adapts: 'Resonance',
    Evolves: 'Transcendence',
    IsCycleOf: 'Omni',
};

const ImprovementInterface: React.FC<ImprovementInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'FineTunes', label: 'Fine Tunes (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Improvement_Self' },
        { id: 'Refines', label: 'Refines (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Improvement_Thought' },
        { id: 'Systematizes', label: 'Systematizes (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Improvement_Logic' },
        { id: 'Optimizes', label: 'Optimizes (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Improvement_Unity' },
        { id: 'Strengthens', label: 'Strengthens (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Improvement_Existence' },
        { id: 'Process', label: 'Process (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Improvement_Improvement' },
        { id: 'Hones', label: 'Hones (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Improvement_Mastery' },
        { id: 'Adapts', label: 'Adapts (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Improvement_Resonance' },
        { id: 'Evolves', label: 'Evolves (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Improvement_Transcendence' },
        { id: 'IsCycleOf', label: 'Cycle Of (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#ffffff', dot: 'Improvement_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-mono relative">
            {/* L-FRAME NESTED DOCK (Vertical Left) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#f59e0b" // Amber-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-30 relative ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Improvement']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Improvement</h1>
                        <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest">OPTIMIZATION ENGINE</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 w-full overflow-hidden relative ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Improvement']}
                    title="IMPROVEMENT VAULT"
                    mission="To Iterate, Optimize, and Evolve the System."
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <ImprovementModule onClose={() => {}} />
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
                                    path={['Improvement', FACTOR_TO_PILLAR[factorId]]}
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

export default ImprovementInterface;
