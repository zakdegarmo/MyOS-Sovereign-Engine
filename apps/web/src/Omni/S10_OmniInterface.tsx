import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import type { MooseManifest, GemId } from '@Omni/types';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { AetherArchive as ArchiveModule } from '../components/HUDModules/AetherArchive';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

// Map factor IDs to their pillar pairs for recursion
// 'Omni' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Is: 'Self',
    SeeksToUnderstand: 'Thought',
    Contemplates: 'Logic',
    HarmonizesWith: 'Unity',
    OccursWithin: 'Existence',
    EmergesFrom: 'Improvement',
    IsSubsetOf: 'Mastery',
    MergesWith: 'Resonance',
    AspiresTo: 'Transcendence',
    IsAspectOf: 'Omni',
};

interface OmniInterfaceProps {
    manifest?: MooseManifest;
    memories: any[];
}

const OmniInterface: React.FC<OmniInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    useEffect(() => {
        const handler = (e: any) => {
            const { id } = e.detail;
            if (id.includes('door') || id === 'portal-alchemy') {
                if (!activeFactors.includes('MergesWith')) {
                    setActiveFactors(prev => [...prev, 'MergesWith']);
                }
            }
        };
        window.addEventListener('myos_portal_trigger', handler);
        return () => window.removeEventListener('myos_portal_trigger', handler);
    }, [activeFactors]);

    // DOCK CONFIGURATION (Matches Semantic Backlog Row 10 - CORRECTED)
    const dockItems = [
        { id: 'Is', label: 'Is (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Omnipotence_Self' },
        { id: 'SeeksToUnderstand', label: 'Seeks To Understand (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Omnipotence_Thought' },
        { id: 'Contemplates', label: 'Contemplates (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Omnipotence_Logic' },
        { id: 'HarmonizesWith', label: 'Harmonizes With (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Omnipotence_Unity' },
        { id: 'OccursWithin', label: 'Occurs Within (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Omnipotence_Existence' },
        { id: 'EmergesFrom', label: 'Emerges From (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Omnipotence_Improvement' },
        { id: 'IsSubsetOf', label: 'Subset Of (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Omnipotence_Mastery' },
        { id: 'MergesWith', label: 'Merges With (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Omnipotence_Resonance' },
        { id: 'AspiresTo', label: 'Aspires To (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Omnipotence_Transcendence' },
        { id: 'IsAspectOf', label: 'Aspect Of (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#ffffff', dot: 'Omnipotence_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        const isActive = activeFactors.includes(id);
        setActiveFactors(prev => isActive ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="relative w-full h-full bg-black overflow-hidden font-sans select-none flex flex-col">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#10b981" // Emerald-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-30 ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Omni']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Omni</h1>
                        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">THE ETERNAL VOID</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative overflow-hidden h-full ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Omni']}
                    title="AETHER ARCHIVE"
                    mission="To Be, To Contain, and To Manifest All."
                    baseColor="#10b981"
                >
                    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <ArchiveModule onClose={() => {}} />
                        </div>
                        <div className="w-full xl:w-96 pl-2 pr-8 pb-12">
                            <DynamicTOC onNavigate={() => {}} />
                        </div>
                    </div>
                </StandardLandingPage>

                {/* 2. OVERLAY LAYER: FACTOR DRAWERS */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mt-16">
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
                                    path={['Omni', FACTOR_TO_PILLAR[factorId]]}
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

export default OmniInterface;
