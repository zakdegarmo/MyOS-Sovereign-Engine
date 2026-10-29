import React, { useState, useEffect } from 'react';
import type { UserGestalt } from '@Omni/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ID_TO_SYMBOL } from '../utils/SemanticAddressing';
import { StandardLandingPage } from '../components/Shared/StandardLandingPage';
import { DynamicTOC } from '../components/Shared/DynamicTOC';
import { NexusContainer } from '../components/Shared/NexusContainer';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import type { GemId } from '@Omni/types';
import { AvatarCreator } from '../components/Avatars/AvatarCreator';
import { Sparkles } from 'lucide-react';
import { useOntologicalContext } from '../council/OntologicalContext';

interface SelfInterfaceProps {
    gestalt: UserGestalt;
    onUpdate: (updates: Partial<UserGestalt>) => void;
    memories: any[];
    setMemories: React.Dispatch<React.SetStateAction<any[]>>;
    onNodeClick?: (node: any) => void;
}

// Map factor IDs to their pillar pairs for recursion
// 'Self' + [Pillar]
const FACTOR_TO_PILLAR: Record<string, GemId> = {
    Identity: 'Self',
    SubjectOf: 'Thought',
    Applies: 'Logic',
    Seeks: 'Unity',
    Affirms: 'Existence',
    Undergoes: 'Improvement',
    Pursues: 'Mastery',
    Experiences: 'Resonance',
    AspiresTo: 'Transcendence',
    IsRealized: 'Omni',
};

// Reverse map for navigation from the TOC
const PILLAR_TO_FACTOR: Record<string, string> = Object.entries(FACTOR_TO_PILLAR).reduce((acc, [k, v]) => ({ ...acc, [v]: k }), {});

export const SelfInterface: React.FC<SelfInterfaceProps> = (props) => {
    const [activeFactors, setActiveFactors] = useState<string[]>([]);
    const [isForgeOpen, setIsForgeOpen] = useState(false);
    const { activePath } = useOntologicalContext();

    useEffect(() => {
        if (activePath === 'self.self' || activePath === 'self.identity' || activePath === 'self') {
            if (!activeFactors.includes('Identity')) {
                setActiveFactors(['Identity']);
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

    // DOCK CONFIGURATION
    const dockItems = [
        { id: 'Identity', label: 'Identity (Self)', icon: ID_TO_SYMBOL['Self'], color: '#f43f5e', dot: 'Self_Self' },
        { id: 'SubjectOf', label: 'Subject Of (Thought)', icon: ID_TO_SYMBOL['Thought'], color: '#fbbf24', dot: 'Self_Thought' },
        { id: 'Applies', label: 'Applies (Logic)', icon: ID_TO_SYMBOL['Logic'], color: '#3b82f6', dot: 'Self_Logic' },
        { id: 'Seeks', label: 'Seeks (Unity)', icon: ID_TO_SYMBOL['Unity'], color: '#10b981', dot: 'Self_Unity' },
        { id: 'Affirms', label: 'Affirms (Existence)', icon: ID_TO_SYMBOL['Existence'], color: '#8b5cf6', dot: 'Self_Existence' },
        { id: 'Undergoes', label: 'Undergoes (Improvement)', icon: ID_TO_SYMBOL['Improvement'], color: '#f97316', dot: 'Self_Improvement' },
        { id: 'Pursues', label: 'Pursues (Mastery)', icon: ID_TO_SYMBOL['Mastery'], color: '#ef4444', dot: 'Self_Mastery' },
        { id: 'Experiences', label: 'Experiences (Resonance)', icon: ID_TO_SYMBOL['Resonance'], color: '#ec4899', dot: 'Self_Resonance' },
        { id: 'AspiresTo', label: 'Aspires To (Transcendence)', icon: ID_TO_SYMBOL['Transcendence'], color: '#a855f7', dot: 'Self_Transcendence' },
        { id: 'IsRealized', label: 'Is Realized By (Omni)', icon: ID_TO_SYMBOL['Omni'], color: '#64748b', dot: 'Self_Omnipotence' },
    ];

    const toggleFactor = (id: string) => {
        setActiveFactors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 font-sans relative overflow-hidden">
            {/* L-FRAME NESTED DOCK (Vertical Left) */}
            <NestedDock
                items={dockItems}
                activeIds={activeFactors}
                onToggle={toggleFactor}
                baseColor="#f43f5e"
            />

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-900/50 shrink-0 ml-[80px]">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xl font-serif">
                        {ID_TO_SYMBOL['Self']}
                    </div>
                    <div>
                        <h1 className="text-xl font-display text-slate-100 tracking-tight">Self</h1>
                        <p className="text-[10px] font-mono text-rose-500/60 uppercase tracking-widest">Master Table of Contents</p>
                    </div>
                </div>
                {/* Avatar Forge Trigger */}
                <button
                    onClick={() => setIsForgeOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 mr-4 rounded-lg border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] font-mono text-xs font-bold transition-all"
                >
                    <Sparkles size={14} className="animate-pulse" />
                    <span>AVATAR FORGE</span>
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative overflow-hidden ml-[80px]">

                <StandardLandingPage
                    icon={ID_TO_SYMBOL['Self']}
                    title="self"
                    mission="A Real-Time Logical Map of the Deca-Pillar Genome."
                >
                    <div className="flex justify-center w-full max-w-5xl px-8 pb-20">
                         <DynamicTOC onNavigate={(pillar) => {
                             const factorId = PILLAR_TO_FACTOR[pillar];
                             if (factorId) toggleFactor(factorId);
                         }} />
                    </div>
                </StandardLandingPage>

                {/* 2. OVERLAY LAYER: DYNAMIC RECURSIVE PANELS */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                    <AnimatePresence>
                        {activeFactors.map(factorId => (
                            <motion.div
                                key={factorId}
                                initial={{ x: "100%", opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: "100%", opacity: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 pointer-events-auto z-20"
                            >
                                <NexusContainer
                                    path={['Self', FACTOR_TO_PILLAR[factorId]]}
                                    onClose={() => toggleFactor(factorId)}
                                    {...props}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Universal Avatar Forge Modal */}
            {isForgeOpen && (
                <div className="absolute inset-0 z-50 bg-[#05050c]/98 flex items-center justify-center p-4">
                    <div className="w-full h-full border border-[#00e5ff]/40 shadow-[0_0_50px_rgba(0,229,255,0.25)] rounded overflow-hidden">
                        <AvatarCreator 
                            initialGenome={props.gestalt?.genome}
                            onSave={(newGenome) => {
                                props.onUpdate({ genome: newGenome });
                                setIsForgeOpen(false);
                            }}
                            onClose={() => setIsForgeOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
