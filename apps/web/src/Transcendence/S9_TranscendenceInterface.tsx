import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { MooseManifest, UserGestalt, LibraryNode, GemId } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { ParadigmShifter as TranscendenceModule } from '../components/HUDModules/ParadigmShifter';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

interface TranscendenceInterfaceProps {
    onWarp?: (manifest: MooseManifest) => void;
    userGestalt: UserGestalt;
    library: LibraryNode | null;
}

// Map factor IDs to their pillar pairs for recursion
// 'Transcendence' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Elevates: 'Self',
    Induces: 'Thought',
    IsNotBoundBy: 'Logic',
    Integrates: 'Unity',
    Surpasses: 'Existence',
    GoesBeyond: 'Improvement',
    RisesAbove: 'Mastery',
    IsStateOf: 'Resonance',
    IsAimOf: 'Transcendence',
    IsNatureOf: 'Omni',
};

const TranscendenceInterface: React.FC<TranscendenceInterfaceProps> = (props) => {
    const { userGestalt, library } = props;
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'Elevates', label: 'Elevates (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Transcendence_Self' },
        { id: 'Induces', label: 'Induces (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Transcendence_Thought' },
        { id: 'IsNotBoundBy', label: 'Unbound (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Transcendence_Logic' },
        { id: 'Integrates', label: 'Integrates (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Transcendence_Unity' },
        { id: 'Surpasses', label: 'Surpasses (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Transcendence_Existence' },
        { id: 'GoesBeyond', label: 'Beyond (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Transcendence_Improvement' },
        { id: 'RisesAbove', label: 'Rises (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Mastery_Mastery' },
        { id: 'IsStateOf', label: 'State (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Transcendence_Resonance' },
        { id: 'IsAimOf', label: 'Aim (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Transcendence_Transcendence' },
        { id: 'IsNatureOf', label: 'Nature (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#64748b', dot: 'Transcendence_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#050505] text-white font-sans relative overflow-hidden gap-0">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-900/20 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-white/5 opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#a855f7" // Purple-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-30 relative ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Transcendence']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Transcendence</h1>
                        <p className="text-[10px] font-mono text-indigo-500/60 uppercase tracking-widest">REALITY BROADCAST</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 flex flex-col z-10 relative overflow-hidden h-full ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Transcendence']}
                    title="PARADIGM SHIFTER"
                    mission="To Surpass Limits and Manifest the New."
                    baseColor="#a855f7"
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <TranscendenceModule onClose={() => {}} />
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
                                    path={['Transcendence', FACTOR_TO_PILLAR[factorId]]}
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

export default TranscendenceInterface;
