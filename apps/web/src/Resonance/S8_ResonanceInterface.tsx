import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { TelemetryMetrics, CouncilState, Message, GemId } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { VibeScanner as ResonanceModule } from '../components/HUDModules/VibeScanner';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

interface ResonanceInterfaceProps {
    telemetry: TelemetryMetrics;
    councilState: CouncilState;
    onGrantXp: (amount: number) => void;
    chronicle: Message[];
}

// Map factor IDs to their pillar pairs for recursion
// 'Resonance' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    IsFeltBy: 'Self',
    Harmonizes: 'Thought',
    IsGroundOf: 'Logic',
    Facilitates: 'Unity',
    RadiatesFrom: 'Existence',
    AlignsWith: 'Improvement',
    Inspires: 'Mastery',
    Sympathy: 'Resonance',
    IsEvokedBy: 'Transcendence',
    Eludes: 'Omni',
};

const ResonanceInterface: React.FC<ResonanceInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default Empty

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'IsFeltBy', label: 'Felt By (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Resonance_Self' },
        { id: 'Inspires', label: 'Inspires (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Resonance_Thought' },
        { id: 'AlignsWith', label: 'Aligns (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Resonance_Logic' },
        { id: 'Harmonizes', label: 'Harmonizes (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Resonance_Unity' },
        { id: 'IsGroundOf', label: 'Ground Of (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Resonance_Existence' },
        { id: 'Facilitates', label: 'Facilitates (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Resonance_Improvement' },
        { id: 'RadiatesFrom', label: 'Radiates (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Resonance_Mastery' },
        { id: 'Sympathy', label: 'Sympathy (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Resonance_Resonance' },
        { id: 'Eludes', label: 'Eludes (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Resonance_Transcendence' },
        { id: 'IsEvokedBy', label: 'Evoked (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#64748b', dot: 'Resonance_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col overflow-hidden relative font-sans">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#ec4899" // Pink-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0a0a] shrink-0 z-30 relative ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Resonance']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Resonance</h1>
                        <p className="text-[10px] font-mono text-pink-500/60 uppercase tracking-widest">EMPATHY ENGINE</p>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 min-h-0 relative overflow-hidden ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Resonance']}
                    title="VIBE SCANNER"
                    mission="To Feel, Connect, and Harmonize with All."
                    baseColor="#ec4899"
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <ResonanceModule onClose={() => {}} />
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
                                    path={['Resonance', FACTOR_TO_PILLAR[factorId]]}
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

export default ResonanceInterface;
