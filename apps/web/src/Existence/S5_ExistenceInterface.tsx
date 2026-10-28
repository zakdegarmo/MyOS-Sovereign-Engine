import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { GemId } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { EnvironmentControls as ExistenceModule } from '../components/HUDModules/EnvironmentControls';
import { DynamicTOC } from '../components/Shared/DynamicTOC';
import { LullianSandbox } from '../tests/LullianSandbox';
import { FaerunSandbox } from '../tests/FaerunSandbox';

// Map factor IDs to their pillar pairs for recursion
// 'Existence' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Is: 'Self',
    IsPonderedBy: 'Thought',
    Obeys: 'Logic',
    Comprises: 'Unity',
    Existence: 'Existence',
    EvolvesThrough: 'Improvement',
    IsDomainOf: 'Mastery',
    VibratesIn: 'Resonance',
    IsSurpassedBy: 'Transcendence',
    GivesRiseTo: 'Omni',
};

const PILLAR_TO_FACTOR: Record<string, string> = Object.entries(FACTOR_TO_PILLAR).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

interface ExistenceInterfaceProps {
    activeSubjectId?: string;
}

const ExistenceInterface: React.FC<ExistenceInterfaceProps & Record<string, any>> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]);

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

    // DOCK ITEMS
    const dockItems = [
        { id: 'ManifestsIn', label: 'Manifests In (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Existence_Self' },
        { id: 'IsPonderedBy', label: 'Pondered By (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Existence_Thought' },
        { id: 'Obeys', label: 'Obeys (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Existence_Logic' },
        { id: 'Comprises', label: 'Comprises (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Existence_Unity' },
        { id: 'Is', label: 'Is (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Existence_Existence' },
        { id: 'EvolvesThrough', label: 'Evolves (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Existence_Improvement' },
        { id: 'IsDomainOf', label: 'Domain Of (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Existence_Mastery' },
        { id: 'VibratesIn', label: 'Vibrates In (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Existence_Resonance' },
        { id: 'IsSurpassedBy', label: 'Surpassed By (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Existence_Transcendence' },
        { id: 'GivesRiseTo', label: 'Gives Rise To (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#ffffff', dot: 'Existence_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };


    return (
        <div className="flex flex-col h-full w-full bg-slate-950 text-slate-200 overflow-hidden relative font-sans">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#10b981"
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-30 relative ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Existence']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Existence</h1>
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">Ontology & History</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 overflow-hidden relative ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Existence']}
                    title="EXISTENCE SENSOR"
                    mission="To Manifest, Determine, and Preserve Reality."
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <ExistenceModule onClose={() => {}} />
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
                                    path={['Existence', FACTOR_TO_PILLAR[factorId]]}
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

export { ExistenceInterface };
export default ExistenceInterface;
