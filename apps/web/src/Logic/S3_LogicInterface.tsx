import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { NexusContainer } from '../components/Shared/NexusContainer';
import type { UserGestalt, GemId } from '@Omni/types';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { LogicGate as LogicModule } from '../components/HUDModules/LogicGate';
import { DynamicTOC } from '../components/Shared/DynamicTOC';

interface LogicInterfaceProps {
    library: any;
    onUpdateLibrary: (item: any) => void;
    onOpenInEditor?: (path: string, nodeData?: any) => void;
    userGestalt?: UserGestalt;
}

// Map factor IDs to their pillar pairs for recursion
// 'Logic' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Foundation: 'Self',
    Governs: 'Thought',
    Structures: 'Logic',
    Ensures: 'Unity',
    Describes: 'Existence',
    Validates: 'Improvement',
    Underpins: 'Mastery',
    Contradicts: 'Resonance',
    Grounds: 'Transcendence',
    IsFoundationOf: 'Omni',
};

const LogicInterface: React.FC<LogicInterfaceProps & Record<string, any>> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]); // Default to Empty

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'Foundation', label: 'Foundation (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Logic_Self' },
        { id: 'Governs', label: 'Governs (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Logic_Thought' },
        { id: 'Structures', label: 'Structures (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Logic_Logic' },
        { id: 'Ensures', label: 'Ensures (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Logic_Unity' },
        { id: 'Describes', label: 'Describes (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Logic_Existence' },
        { id: 'Validates', label: 'Validates (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Logic_Improvement' },
        { id: 'Underpins', label: 'Underpins (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Logic_Mastery' },
        { id: 'Contradicts', label: 'Contradicts (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Logic_Resonance' },
        { id: 'Grounds', label: 'Grounds (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Logic_Transcendence' },
        { id: 'IsFoundationOf', label: 'IsFoundationOf (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#ffffff', dot: 'Logic_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="h-full w-full bg-slate-950 flex flex-col font-sans overflow-hidden relative">
            {/* L-FRAME NESTED DOCK (Left Vertical) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#06b6d4" // Cyan-500
            />

            {/* HEADER - Adjusted Left Margin */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-30 ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Logic']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Logic</h1>
                        <p className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest">System Architecture</p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA - Adjusted Left Margin */}
            <div className="flex-1 relative overflow-hidden ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Logic']}
                    title="LOGIC PILLAR"
                    mission="To Structure, Evaluate, and Architect the System's Reality."
                >
                    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl">
                        <div className="flex-1">
                            <LogicModule onClose={() => {}} />
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
                                    path={['Logic', FACTOR_TO_PILLAR[factorId]]}
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

export default LogicInterface;
