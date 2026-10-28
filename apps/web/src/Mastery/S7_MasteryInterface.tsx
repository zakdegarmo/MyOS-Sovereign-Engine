import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { GemId, UserGestalt, LibraryNode } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { MasteryConsolidator as MasteryModule } from '../components/HUDModules/MasteryConsolidator';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

interface MasteryInterfaceProps {
    councilState?: any;
    quests?: any[];
    achievements?: any[];
    onAddQuest?: (q: any) => void;
    onDeleteQuest?: (id: string) => void;
    onCompleteQuest?: (id: string) => void;
    userGestalt?: any;
    library?: any;
    onAuthError?: () => void;
    taskLog?: string[];
    telemetry?: any;
}

// Map factor IDs to their pillar pairs for recursion
// 'Mastery' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Embodies: 'Self',
    Actualizes: 'Thought',
    AppliesPerfected: 'Logic',
    Commands: 'Unity',
    Generates: 'Existence',
    RequiresDeep: 'Improvement',
    Pinnacle: 'Mastery',
    Inspires: 'Resonance',
    Approaches: 'Transcendence',
    IsGoalOf: 'Omni',
};

export const MasteryInterface: React.FC<MasteryInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'Embodies', label: 'Embodies (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Mastery_Self' },
        { id: 'Actualizes', label: 'Actualizes (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Mastery_Thought' },
        { id: 'AppliesPerfected', label: 'Applies (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Mastery_Logic' },
        { id: 'Commands', label: 'Commands (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Mastery_Unity' },
        { id: 'Generates', label: 'Generates (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Mastery_Existence' },
        { id: 'RequiresDeep', label: 'Requires (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Mastery_Improvement' },
        { id: 'Pinnacle', label: 'Pinnacle (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Mastery_Mastery' },
        { id: 'Inspires', label: 'Inspires (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Mastery_Resonance' },
        { id: 'Approaches', label: 'Approaches (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Mastery_Transcendence' },
        { id: 'IsGoalOf', label: 'Goal Of (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#64748b', dot: 'Mastery_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="w-full flex flex-col h-full bg-[#111] text-white overflow-hidden relative font-sans">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#8b5cf6" // Violet-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-30 relative ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Mastery']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Mastery</h1>
                        <p className="text-[10px] font-mono text-violet-500/60 uppercase tracking-widest">COMMAND & CONTROL</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 relative overflow-hidden ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Mastery']}
                    title="MASTERY CONSOLIDATOR"
                    mission="To Control, Perfect, and Actualize Potential."
                    baseColor="#8b5cf6"
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <MasteryModule onClose={() => {}} />
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
                                    path={['Mastery', FACTOR_TO_PILLAR[factorId]]}
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

export default MasteryInterface;
