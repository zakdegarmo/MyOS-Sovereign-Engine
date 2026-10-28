/**
 * NexusContainer.tsx
 * 
 * The recursive engine of MyOS.
 * Handles panel mitosis, internal docking, and JITSA.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NestedDock } from '@Unity/components/navigation/NestedDock';
import { PILLAR_MAP, calculateSemanticPath, getJitsaAddress, resolveConceptName, resolveSemanticSequence, ID_TO_SYMBOL } from '../../utils/SemanticAddressing';
import type { GemId } from '../../Omni/types';
import { X, Box, Info, ChevronRight } from 'lucide-react';
import { SemanticCache } from '../../engine/SemanticCache';
import { type Pillar, RELATIONSHIP_MATRIX } from '../../engine/RelationshipMatrix';
import { NexusEpochTestPanel } from '../Nexus/NexusEpochTestPanel';
import { CharacterGestaltSheet } from '../MaxOverlay/CharacterGestaltSheet';
import { CharacterTelemetryLoop } from '../MaxOverlay/CharacterTelemetryLoop';
import { CharacterRulesMatrix } from '../MaxOverlay/CharacterRulesMatrix';
import { CharacterWardrobeStudio } from '../MaxOverlay/CharacterWardrobeStudio';
import { CharacterGenomeStudio } from '../MaxOverlay/CharacterGenomeStudio';
import { CharacterPowertrainStudio } from '../MaxOverlay/CharacterPowertrainStudio';
import { CharacterSynthesizerStudio } from '../MaxOverlay/CharacterSynthesizerStudio';
import { CharacterCyclotropeStudio } from '../MaxOverlay/CharacterCyclotropeStudio';
import { CharacterAscensionStudio } from '../MaxOverlay/CharacterAscensionStudio';
import { CharacterOmniStudio } from '../MaxOverlay/CharacterOmniStudio';

const ICON_MAP: Record<GemId, string> = {
    Self: ID_TO_SYMBOL['Self'],
    Thought: ID_TO_SYMBOL['Thought'],
    Logic: ID_TO_SYMBOL['Logic'],
    Unity: ID_TO_SYMBOL['Unity'],
    Existence: ID_TO_SYMBOL['Existence'],
    Improvement: ID_TO_SYMBOL['Improvement'],
    Mastery: ID_TO_SYMBOL['Mastery'],
    Resonance: ID_TO_SYMBOL['Resonance'],
    Transcendence: ID_TO_SYMBOL['Transcendence'],
    Omni: ID_TO_SYMBOL['Omni']
};

// Colors for the dock
const COLOR_MAP: Record<GemId, string> = {
    Self: '#f43f5e',
    Thought: '#fbbf24',
    Logic: '#3b82f6',
    Unity: '#10b981',
    Existence: '#8b5cf6',
    Improvement: '#f97316',
    Mastery: '#ef4444',
    Resonance: '#ec4899',
    Transcendence: '#a855f7',
    Omni: '#64748b'
};

const PILLAR_DESCRIPTIONS: Record<GemId, { title: string; subtitle: string; mission: string; badge: string }> = {
    Self: {
        title: "Self (◉)",
        subtitle: "Sovereign Observer & Core Identity",
        mission: "The anchor of sovereign agency, character persona, and ontological center of MyOS.",
        badge: "01 // ANCHOR"
    },
    Thought: {
        title: "Thought (✧)",
        subtitle: "Cognitive Stream & Latent Ideation",
        mission: "Recursive ideation, local neural matrix communication, and latent synthesis.",
        badge: "02 // COGNITION"
    },
    Logic: {
        title: "Logic (∴)",
        subtitle: "Axiomatic Governance & Structure",
        mission: "Axiomatic foundation, cartridge execution, rules evaluation, and system governance.",
        badge: "03 // AXIOM"
    },
    Unity: {
        title: "Unity (⚭)",
        subtitle: "Holistic Synthesis & Swarm Gestalt",
        mission: "Harmonizing human intuition and synthetic cognition into cohesive symbiosis.",
        badge: "04 // SYNTHESIS"
    },
    Existence: {
        title: "Existence (⬡)",
        subtitle: "Physical Grounding & Spatial Reality",
        mission: "Tangible manifestation, 3D worlds, environments, and base spatial truth.",
        badge: "05 // SUBSTRATE"
    },
    Improvement: {
        title: "Improvement (⇈)",
        subtitle: "Continuous Evolution & Self-Optimization",
        mission: "Continuous feedback loops, recursive refinement, and benchmark optimization.",
        badge: "06 // EVOLUTION"
    },
    Mastery: {
        title: "Mastery (❂)",
        subtitle: "Sovereign Capability & Actualization",
        mission: "Pinnacle of actualization, verified skills, and sovereign task execution.",
        badge: "07 // APEX"
    },
    Resonance: {
        title: "Resonance (∿)",
        subtitle: "Sympathetic Harmonics & Emotional Affinity",
        mission: "Acoustic waveforms, BBS node telepathy, and harmonic coherence across domains.",
        badge: "08 // HARMONICS"
    },
    Transcendence: {
        title: "Transcendence (⍟)",
        subtitle: "Paradigm Leaps & Dimensional Ascension",
        mission: "Dissolving conventional boundaries, paradigm shifts, and hyper-dimensional traversal.",
        badge: "09 // ASCENT"
    },
    Omni: {
        title: "Omni (۞)",
        subtitle: "Totality & Underlying Nature",
        mission: "Totality of all relations, the full 100-node relationship matrix, and infinite latent potential.",
        badge: "10 // TOTALITY"
    }
};

const FACTOR_DESCRIPTIONS: Record<string, string> = {
    'Identity': 'Visual sprite laboratory, character animations, and avatar identity.',
    'Subject Of': 'Real-time kinesic loop, telemetry streaming, and cognitive focus.',
    'Applies': 'Axiomatic rules matrix, logic evaluators, and system constraints.',
    'Seeks': 'Wardrobe studio, equipment sockets, and cosmetic customization.',
    'Affirms': 'Ontological genome sequence, character DNA, and persistent traits.',
    'Undergoes': 'Powertrain propulsion, locomotion physics, and velocity controllers.',
    'Pursues': 'Autonomous headless character synthesizer and asset compilation.',
    'Experiences': 'Cyclotrope animation wheel and multi-angle 3D sprite capture.',
    'Aspires To': 'Ascension chamber, prestige unlocks, and ontological levitation.',
    'Is Realized by': 'Omni kernel realization, high-dimensional totality, and sovereign state.',
    'Recursion': 'Meta-thought recursion loop, flow state memory, and persistent context.',
    'Structures': 'Dependency tree mapping, module architecture, and graph topology.',
    'Foundation': 'Direct cartridge loader, byte-code execution, and low-level sandbox.',
    'Essence': 'Avatar roster, live council agent population, and swarm state.',
    'Manifests In': 'Domain navigator, 3D world teleportation, and spatial stagecraft.',
    'Refines': '16-bit theater player, cutscene screening, and production manifests.'
};

// Import Factor Grids for Self
import { All as Self_IdentityGrid } from '../../Self/Factors/Identity/All';
import { All as Self_SubjectOfGrid } from '../../Self/Factors/SubjectOf/All';
import { All as Self_AppliesGrid } from '../../Self/Factors/Applies/All';
import { All as Self_SeeksGrid } from '../../Self/Factors/Seeks/All';
import { All as Self_AffirmsGrid } from '../../Self/Factors/Affirms/All';
import { All as Self_UndergoesGrid } from '../../Self/Factors/Undergoes/All';
import { All as Self_PursuesGrid } from '../../Self/Factors/Pursues/All';
import { All as Self_ExperiencesGrid } from '../../Self/Factors/Experiences/All';
import { All as Self_AspiresToGrid } from '../../Self/Factors/AspiresTo/All';
import { All as Self_IsRealizedByGrid } from '../../Self/Factors/IsRealizedBy/All';

// Import Factor Grids for Thought
import { All as Thought_InformsGrid } from '../../Thought/Factors/Informs/All';
import { All as Thought_RecursionGrid } from '../../Thought/Factors/Recursion/All';
import { All as Thought_UtilizesGrid } from '../../Thought/Factors/Utilizes/All';
import { All as Thought_SynthesizesGrid } from '../../Thought/Factors/Synthesizes/All';
import { All as Thought_RepresentsGrid } from '../../Thought/Factors/Represents/All';
import { All as Thought_DrivesGrid } from '../../Thought/Factors/Drives/All';
import { All as Thought_DevelopsGrid } from '../../Thought/Factors/Develops/All';
import { All as Thought_ArticulatesGrid } from '../../Thought/Factors/Articulates/All';
import { All as Thought_EnablesGrid } from '../../Thought/Factors/Enables/All';
import { All as Thought_TranscendsGrid } from '../../Thought/Factors/Transcends/All';

// Import Factor Grids for Logic
import { All as Logic_StructuresGrid } from '../../Logic/Factors/Structures/All';
import { All as Logic_GovernsGrid } from '../../Logic/Factors/Governs/All';
import { All as Logic_FoundationGrid } from '../../Logic/Factors/Foundation/All';
import { All as Logic_EnsuresGrid } from '../../Logic/Factors/Ensures/All';
import { All as Logic_DescribesGrid } from '../../Logic/Factors/Describes/All';
import { All as Logic_ValidatesGrid } from '../../Logic/Factors/Validates/All';
import { All as Logic_UnderpinsGrid } from '../../Logic/Factors/Underpins/All';
import { All as Logic_ContradictsGrid } from '../../Logic/Factors/Contradicts/All';
import { All as Logic_GroundsGrid } from '../../Logic/Factors/Grounds/All';
import { All as Logic_IsTheFoundationOfGrid } from '../../Logic/Factors/IsTheFoundationOf/All';

// Import Factor Grids for Unity
import { All as Unity_IntegratesGrid } from '../../Unity/Factors/Integrates/All';
import { All as Unity_HarmonizesGrid } from '../../Unity/Factors/Harmonizes/All';
import { All as Unity_RequiresGrid } from '../../Unity/Factors/Requires/All';
import { All as Unity_EssenceGrid } from '../../Unity/Factors/Essence/All';
import { All as Unity_BindsGrid } from '../../Unity/Factors/Binds/All';
import { All as Unity_FostersGrid } from '../../Unity/Factors/Fosters/All';
import { All as Unity_CulminatesInGrid } from '../../Unity/Factors/CulminatesIn/All';
import { All as Unity_AmplifiesGrid } from '../../Unity/Factors/Amplifies/All';
import { All as Unity_AchievesGrid } from '../../Unity/Factors/Achieves/All';
import { All as Unity_IsTheUltimateExpressionOfGrid } from '../../Unity/Factors/IsTheUltimateExpressionOf/All';

// Import Factor Grids for Existence
import { All as Existence_ManifestsInGrid } from '../../Existence/Factors/ManifestsIn/All';
import { All as Existence_IsPonderedByGrid } from '../../Existence/Factors/IsPonderedBy/All';
import { All as Existence_ObeysGrid } from '../../Existence/Factors/Obeys/All';
import { All as Existence_ComprisesGrid } from '../../Existence/Factors/Comprises/All';
import { All as Existence_IsGrid } from '../../Existence/Factors/Is/All';
import { All as Existence_EvolvesThroughGrid } from '../../Existence/Factors/EvolvesThrough/All';
import { All as Existence_IsDomainOfGrid } from '../../Existence/Factors/IsDomainOf/All';
import { All as Existence_VibratesInGrid } from '../../Existence/Factors/VibratesIn/All';
import { All as Existence_IsSurpassedByGrid } from '../../Existence/Factors/IsSurpassedBy/All';
import { All as Existence_GivesRiseToGrid } from '../../Existence/Factors/GivesRiseTo/All';

// Import Factor Grids for Improvement
import { All as Improvement_RefinesGrid } from '../../Improvement/Factors/Refines/All';
import { All as Improvement_OptimizesGrid } from '../../Improvement/Factors/Optimizes/All';
import { All as Improvement_SystematizesGrid } from '../../Improvement/Factors/Systematizes/All';
import { All as Improvement_StrengthensGrid } from '../../Improvement/Factors/Strengthens/All';
import { All as Improvement_EnhancesGrid } from '../../Improvement/Factors/Enhances/All';
import { All as Improvement_ProcessGrid } from '../../Improvement/Factors/Process/All';
import { All as Improvement_LeadsToGrid } from '../../Improvement/Factors/LeadsTo/All';
import { All as Improvement_FineTunesGrid } from '../../Improvement/Factors/FineTunes/All';
import { All as Improvement_IsPathToGrid } from '../../Improvement/Factors/IsPathTo/All';
import { All as Improvement_IsTheCycleOfGrid } from '../../Improvement/Factors/IsTheCycleOf/All';

// Import Factor Grids for Mastery
import { All as Mastery_ActualizesGrid } from '../../Mastery/Factors/Actualizes/All';
import { All as Mastery_RequiresDeepGrid } from '../../Mastery/Factors/RequiresDeep/All';
import { All as Mastery_AppliesPerfectedGrid } from '../../Mastery/Factors/AppliesPerfected/All';
import { All as Mastery_EmbodiesGrid } from '../../Mastery/Factors/Embodies/All';
import { All as Mastery_CommandsGrid } from '../../Mastery/Factors/Commands/All';
import { All as Mastery_IsGoalOfGrid } from '../../Mastery/Factors/IsGoalOf/All';
import { All as Mastery_PinnacleGrid } from '../../Mastery/Factors/Pinnacle/All';
import { All as Mastery_GeneratesGrid } from '../../Mastery/Factors/Generates/All';
import { All as Mastery_ApproachesGrid } from '../../Mastery/Factors/Approaches/All';
import { All as Mastery_IsTheTotalityOfGrid } from '../../Mastery/Factors/IsTheTotalityOf/All';

// Import Factor Grids for Resonance
import { All as Resonance_IsFeltByGrid } from '../../Resonance/Factors/IsFeltBy/All';
import { All as Resonance_IsEvokedByGrid } from '../../Resonance/Factors/IsEvokedBy/All';
import { All as Resonance_EludesGrid } from '../../Resonance/Factors/Eludes/All';
import { All as Resonance_CreatesGrid } from '../../Resonance/Factors/Creates/All';
import { All as Resonance_EchoesThroughGrid } from '../../Resonance/Factors/EchoesThrough/All';
import { All as Resonance_AlignsWithGrid } from '../../Resonance/Factors/AlignsWith/All';
import { All as Resonance_RadiatesFromGrid } from '../../Resonance/Factors/RadiatesFrom/All';
import { All as Resonance_SympathyGrid } from '../../Resonance/Factors/Sympathy/All';
import { All as Resonance_FacilitatesGrid } from '../../Resonance/Factors/Facilitates/All';
import { All as Resonance_IsTheGroundOfGrid } from '../../Resonance/Factors/IsTheGroundOf/All';

// Import Factor Grids for Transcendence
import { All as Transcendence_ElevatesGrid } from '../../Transcendence/Factors/Elevates/All';
import { All as Transcendence_GoesBeyondGrid } from '../../Transcendence/Factors/GoesBeyond/All';
import { All as Transcendence_IsNotBoundByGrid } from '../../Transcendence/Factors/IsNotBoundBy/All';
import { All as Transcendence_IsAStateOfGrid } from '../../Transcendence/Factors/IsAStateOf/All';
import { All as Transcendence_RisesAboveGrid } from '../../Transcendence/Factors/RisesAbove/All';
import { All as Transcendence_IsAimOfGrid } from '../../Transcendence/Factors/IsAimOf/All';
import { All as Transcendence_IsPinnacleOfGrid } from '../../Transcendence/Factors/IsPinnacleOf/All';
import { All as Transcendence_InducesGrid } from '../../Transcendence/Factors/Induces/All';
import { All as Transcendence_ActionGrid } from '../../Transcendence/Factors/Action/All';
import { All as Transcendence_IsTheNatureOfGrid } from '../../Transcendence/Factors/IsTheNatureOf/All';

// Import Factor Grids for Omni
import { All as Omni_MergesWithGrid } from '../../Omni/Factors/MergesWith/All';
import { All as Omni_ContemplatesGrid } from '../../Omni/Factors/Contemplates/All';
import { All as Omni_IsASubsetOfGrid } from '../../Omni/Factors/IsASubsetOf/All';
import { All as Omni_IsAnAspectOfGrid } from '../../Omni/Factors/IsAnAspectOf/All';
import { All as Omni_EmergesFromGrid } from '../../Omni/Factors/EmergesFrom/All';
import { All as Omni_OccursWithinGrid } from '../../Omni/Factors/OccursWithin/All';
import { All as Omni_SeeksToUnderstandGrid } from '../../Omni/Factors/SeeksToUnderstand/All';
import { All as Omni_HarmonizesWithGrid } from '../../Omni/Factors/HarmonizesWith/All';
import { All as Omni_AspiresToGrid } from '../../Omni/Factors/AspiresTo/All';
import { All as Omni_IsGrid } from '../../Omni/Factors/Is/All';

// Import Applets
import { LibraryExplorer } from '../MaxOverlay/LibraryExplorer';
import { CharacterSheet } from '../HUDModules/CharacterSheet';
import { SystemConsole } from '../HUDModules/SystemConsole';
import { AvatarRoster } from '../HUDModules/AvatarRoster';
import { SixteenBitTheater } from '../HUDModules/SixteenBitTheater';
import { SpriteLaboratory } from '../MaxOverlay/SpriteLaboratory';
import { RelicLogicGraph } from '../../Logic/LogicInterface';
import { DomainNavigator } from '../HUDModules/DomainNavigator';
import { BbsService } from '../HUDModules/BbsService';
import { MissionMapView } from '../HUDModules/MissionMapView';
import { GameSandbox } from '../HUDModules/GameSandbox';

import { getIntegrationAtAddress } from '../../engine/IntegrationRegistry';
import { IntegrationSandbox } from './IntegrationSandbox';
import { CartridgeLoader } from '../HUDModules/CartridgeLoader';

import { LullianSandbox } from '../../tests/LullianSandbox';
import { FaerunSandbox } from '../../tests/FaerunSandbox';
import { HoloCortex4D } from '../CognitiveMatrix/HoloCortex4D';
import { NexusCube } from '../CognitiveMatrix/NexusCube';

// ---------------------------------------------------------
// TEST ENVIRONMENT HUB
// Nests all tests safely without overwriting the Library Explorer
// ---------------------------------------------------------
const TestEnvironmentHub: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [activeTest, setActiveTest] = useState<'library' | 'lullian' | 'faerun' | 'holo_cortex' | 'nexus_cube'>('library');

    return (
        <div className="w-full h-full flex flex-col relative bg-slate-950">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] flex gap-2 p-2 bg-black/80 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl">
                <button 
                    onClick={() => setActiveTest('library')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTest === 'library' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    LIBRARY EXPLORER
                </button>
                <button 
                    onClick={() => setActiveTest('holo_cortex')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTest === 'holo_cortex' ? 'bg-emerald-500 text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    4D HOLO-CORTEX
                </button>
                <button 
                    onClick={() => setActiveTest('nexus_cube')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTest === 'nexus_cube' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    NEXUS HYPER-PRISM
                </button>
                <button 
                    onClick={() => setActiveTest('faerun')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTest === 'faerun' ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    FAERUN TILEMAP TEST
                </button>
                <button 
                    onClick={() => setActiveTest('lullian')}
                    className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${activeTest === 'lullian' ? 'bg-fuchsia-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                    LULLIAN AVATAR TEST
                </button>
            </div>
            
            <div className="flex-1 w-full h-full">
                {activeTest === 'library' && <LibraryExplorer isOpen={true} onClose={onClose} />}
                {activeTest === 'holo_cortex' && <HoloCortex4D />}
                {activeTest === 'nexus_cube' && <NexusCube />}
                {activeTest === 'faerun' && <FaerunSandbox />}
                {activeTest === 'lullian' && <LullianSandbox />}
            </div>
        </div>
    );
};

interface NexusContainerProps {
    path: GemId[]; // Recursive path: ['Self', 'Thought']
    onClose?: () => void;
    depth?: number;
    onDrillDepth?: (subId: GemId) => void;
    onAscendDepth?: () => void;
    onNavigateToDepth?: (depthLevel: number) => void;
    isDiegeticScreen?: boolean;
    // Props passed down from SelfInterface/Factors
    [key: string]: any;
}

export const NexusContainer: React.FC<NexusContainerProps> = ({
    path,
    onClose,
    depth = 0,
    ...restProps
}) => {
    const [activeSubPillars, setActiveSubPillars] = useState<GemId[]>([]);
    const currentPillarId = path[path.length - 1];
    const semanticPathString = calculateSemanticPath(path);

    // Sync Browser URL with Genomic Path (Root -> Sub -> Factor)
    // NOTE: In diegetic 3D prism mode (isDiegeticScreen or onDrillDepth present),
    // we do NOT replace browser URL or fire myos_path_change to avoid unintended world dimension swaps!
    React.useEffect(() => {
        if (restProps.isDiegeticScreen || restProps.onDrillDepth) {
            return;
        }
        if (activeSubPillars.length === 0) {
            const urlPath = path.join('/');
            // Browser Address Bar sync as requested
            window.history.replaceState(null, '', `/${urlPath}`);
            // Dispatch path change to let MaxOverlay/AvatarScene swap 3D environments
            window.dispatchEvent(new CustomEvent('myos_path_change', {
                detail: { path }
            }));
        }
    }, [semanticPathString, activeSubPillars.length, restProps.isDiegeticScreen, restProps.onDrillDepth]);

    const toggleSubPillar = (id: string) => {
        const gemId = id as GemId;
        if (restProps.onDrillDepth) {
            restProps.onDrillDepth(gemId);
            return;
        }
        setActiveSubPillars(prev =>
            prev.includes(gemId) ? prev.filter(x => x !== gemId) : [...prev, gemId]
        );
    };

    // Logic to determine what content to show
    const renderContent = () => {
        const subjectId = restProps.activeSubjectId;
        const cached = subjectId ? SemanticCache.get(subjectId) : null;

        // --- SANDBOX OVERRIDE: Check Registry for Address-Based Integrations ---
        console.log(`[NexusContainer] Checking Address: ${semanticPathString} (Path: ${path.join('.')})`);
        const integration = getIntegrationAtAddress(semanticPathString);
        if (integration) {
            console.log(`[NexusContainer] Found Registry Integration: ${integration.id}`);
            return (
                <IntegrationSandbox
                    integration={integration}
                    onClose={onClose}
                />
            );
        }

        // Handle First-Level Pillar Factor Recursion (Pillar -&gt; Factor)
        if (path.length === 2) {
            const root = path[0] as Pillar;
            const sub = path[1] as Pillar;

            // --- ALCHEMICAL MIRROR LOGIC: Show Cached Trait if Scanned (except Self -> Self which is SpriteLaboratory) ---
            if (cached && cached.traits[root] && cached.traits[root][sub] && !(root === 'Self' && sub === 'Self')) {
                const traitValue = cached.traits[root][sub];
                return (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/5 border border-white/10 rounded-3xl p-12 backdrop-blur-3xl shadow-2xl relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center justify-center mb-8">
                                <div className="p-4 rounded-full bg-white/10 border border-white/20 text-4xl font-serif text-white/80">
                                    {ICON_MAP[sub] || '?'}
                                </div>
                            </div>

                            <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-[0.4em] mb-4">
                                Semantic Relationship: {root} &rarr; {sub}
                            </h4>

                            <div className="text-4xl font-display text-white tracking-tight mb-6 leading-tight">
                                "{traitValue}"
                            </div>

                            <p className="text-sm font-mono text-white/20 max-w-md mx-auto">
                                This trait represents the ontological convergence of {root} and {sub} within the {subjectId}'s semantic core.
                            </p>

                             <div className="mt-8 flex flex-col items-center gap-4 justify-center">
                                 <NexusEpochTestPanel />
                                 <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">
                                     <Info size={12} />
                                     VERIFIED VECTOR POOL SCAN
                                 </div>
                             </div>
                        </motion.div>
                    </div>
                );
            }

            // Fallback to existing logic
            // 1. SELF
            if (root === 'Self') {
                switch (sub) {
                    case 'Self': return <SpriteLaboratory isNested={true} onClose={onClose || (() => { })} onSetAnimation={restProps.onSetAnimation} />;
                    case 'Thought': return <Self_SubjectOfGrid {...(restProps as any)} />;
                    case 'Logic': return <Self_AppliesGrid {...(restProps as any)} />;
                    case 'Unity': return <Self_SeeksGrid {...(restProps as any)} />;
                    case 'Existence': return <Self_AffirmsGrid {...(restProps as any)} />;
                    case 'Improvement': return <Self_UndergoesGrid {...(restProps as any)} />;
                    case 'Mastery': return <Self_PursuesGrid {...(restProps as any)} />;
                    case 'Resonance': return <Self_ExperiencesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Self_AspiresToGrid {...(restProps as any)} />;
                    case 'Omni': return <Self_IsRealizedByGrid {...(restProps as any)} />;
                }
            }

            // 2. THOUGHT
            if (root === 'Thought') {
                switch (sub) {
                    case 'Self': return <Thought_InformsGrid {...(restProps as any)} />;
                    case 'Thought': return <TestEnvironmentHub onClose={onClose || (() => { })} />;
                    case 'Logic': return <Thought_UtilizesGrid {...(restProps as any)} />;
                    case 'Unity': return <Thought_SynthesizesGrid {...(restProps as any)} />;
                    case 'Existence': return <Thought_RepresentsGrid {...(restProps as any)} />;
                    case 'Improvement': return <Thought_DrivesGrid {...(restProps as any)} />;
                    case 'Mastery': return <Thought_DevelopsGrid {...(restProps as any)} />;
                    case 'Resonance': return <Thought_ArticulatesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Thought_EnablesGrid {...(restProps as any)} />;
                    case 'Omni': return <Thought_TranscendsGrid {...(restProps as any)} />;
                }
            }

            // 3. LOGIC
            if (root === 'Logic') {
                switch (sub) {
                    case 'Self': return <Logic_StructuresGrid {...(restProps as any)} />;
                    case 'Thought': return <Logic_GovernsGrid {...(restProps as any)} />;
                    case 'Logic': return <CartridgeLoader />;
                    case 'Unity': return <Logic_EnsuresGrid {...(restProps as any)} />;
                    case 'Existence': return <Logic_DescribesGrid {...(restProps as any)} />;
                    case 'Improvement': return <SystemConsole {...(restProps as any)} onClose={onClose || (() => { })} />;
                    case 'Mastery': return <Logic_UnderpinsGrid {...(restProps as any)} />;
                    case 'Resonance': return <Logic_ContradictsGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Logic_GroundsGrid {...(restProps as any)} />;
                    case 'Omni': return <Logic_IsTheFoundationOfGrid {...(restProps as any)} />;
                }
            }

            // 4. UNITY
            if (root === 'Unity') {
                switch (sub) {
                    case 'Self': return <Unity_IntegratesGrid {...(restProps as any)} />;
                    case 'Thought': return <Unity_HarmonizesGrid {...(restProps as any)} />;
                    case 'Logic': return <Unity_RequiresGrid {...(restProps as any)} />;
                    case 'Unity': return <AvatarRoster />;
                    case 'Existence': return <Unity_BindsGrid {...(restProps as any)} />;
                    case 'Improvement': return <Unity_FostersGrid {...(restProps as any)} />;
                    case 'Mastery': return <Unity_CulminatesInGrid {...(restProps as any)} />;
                    case 'Resonance': return <Unity_AmplifiesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Unity_AchievesGrid {...(restProps as any)} />;
                    case 'Omni': return <Unity_IsTheUltimateExpressionOfGrid {...(restProps as any)} />;
                }
            }

            // 5. EXISTENCE
            if (root === 'Existence') {
                switch (sub) {
                    case 'Self': return <Existence_ManifestsInGrid {...(restProps as any)} />;
                    case 'Thought': return <Existence_IsPonderedByGrid {...(restProps as any)} />;
                    case 'Logic': return <Existence_ObeysGrid {...(restProps as any)} />;
                    case 'Unity': return <Existence_ComprisesGrid {...(restProps as any)} />;
                    case 'Existence': return <DomainNavigator onClose={onClose || (() => { })} />;
                    case 'Improvement': return <Existence_EvolvesThroughGrid {...(restProps as any)} />;
                    case 'Mastery': return <Existence_IsDomainOfGrid {...(restProps as any)} />;
                    case 'Resonance': return <Existence_VibratesInGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Existence_IsSurpassedByGrid {...(restProps as any)} />;
                    case 'Omni': return <Existence_GivesRiseToGrid {...(restProps as any)} />;
                }
            }

            // 6. IMPROVEMENT
            if (root === 'Improvement') {
                switch (sub) {
                    case 'Self': return <Improvement_RefinesGrid {...(restProps as any)} />;
                    case 'Thought': return <Improvement_OptimizesGrid {...(restProps as any)} />;
                    case 'Logic': return <Improvement_SystematizesGrid {...(restProps as any)} />;
                    case 'Unity': return <Improvement_StrengthensGrid {...(restProps as any)} />;
                    case 'Existence': return <Improvement_EnhancesGrid {...(restProps as any)} />;
                    case 'Improvement': return <SixteenBitTheater onClose={onClose || (() => { })} />;
                    case 'Mastery': return <Improvement_LeadsToGrid {...(restProps as any)} />;
                    case 'Resonance': return <Improvement_FineTunesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Improvement_IsPathToGrid {...(restProps as any)} />;
                    case 'Omni': return <Improvement_IsTheCycleOfGrid {...(restProps as any)} />;
                }
            }

            // 7. MASTERY
            if (root === 'Mastery') {
                switch (sub) {
                    case 'Self': return <Mastery_ActualizesGrid {...(restProps as any)} />;
                    case 'Thought': return <Mastery_RequiresDeepGrid {...(restProps as any)} />;
                    case 'Logic': return <Mastery_AppliesPerfectedGrid {...(restProps as any)} />;
                    case 'Unity': return <Mastery_EmbodiesGrid {...(restProps as any)} />;
                    case 'Existence': return <Mastery_CommandsGrid {...(restProps as any)} />;
                    case 'Improvement': return <Mastery_IsGoalOfGrid {...(restProps as any)} />;
                    case 'Mastery': return <MissionMapView onClose={onClose || (() => { })} />;
                    case 'Resonance': return <Mastery_GeneratesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Mastery_ApproachesGrid {...(restProps as any)} />;
                    case 'Omni': return <Mastery_IsTheTotalityOfGrid {...(restProps as any)} />;
                }
            }

            // 8. RESONANCE
            if (root === 'Resonance') {
                switch (sub) {
                    case 'Self': return <Resonance_IsFeltByGrid {...(restProps as any)} />;
                    case 'Thought': return <Resonance_IsEvokedByGrid {...(restProps as any)} />;
                    case 'Logic': return <Resonance_EludesGrid {...(restProps as any)} />;
                    case 'Unity': return <Resonance_CreatesGrid {...(restProps as any)} />;
                    case 'Existence': return <Resonance_EchoesThroughGrid {...(restProps as any)} />;
                    case 'Improvement': return <Resonance_AlignsWithGrid {...(restProps as any)} />;
                    case 'Mastery': return <Resonance_RadiatesFromGrid {...(restProps as any)} />;
                    case 'Resonance': return <BbsService onClose={onClose || (() => { })} />;
                    case 'Transcendence': return <Resonance_FacilitatesGrid {...(restProps as any)} />;
                    case 'Omni': return <Resonance_IsTheGroundOfGrid {...(restProps as any)} />;
                }
            }

            // 9. TRANSCENDENCE
            if (root === 'Transcendence') {
                switch (sub) {
                    case 'Self': return <Transcendence_ElevatesGrid {...(restProps as any)} />;
                    case 'Thought': return <Transcendence_GoesBeyondGrid {...(restProps as any)} />;
                    case 'Logic': return <Transcendence_IsNotBoundByGrid {...(restProps as any)} />;
                    case 'Unity': return <Transcendence_IsAStateOfGrid {...(restProps as any)} />;
                    case 'Existence': return <Transcendence_RisesAboveGrid {...(restProps as any)} />;
                    case 'Improvement': return <Transcendence_IsAimOfGrid {...(restProps as any)} />;
                    case 'Mastery': return <Transcendence_IsPinnacleOfGrid {...(restProps as any)} />;
                    case 'Resonance': return <Transcendence_InducesGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Transcendence_ActionGrid {...(restProps as any)} />;
                    case 'Omni': return <Transcendence_IsTheNatureOfGrid {...(restProps as any)} />;
                }
            }

            // 10. OMNI
            if (root === 'Omni') {
                switch (sub) {
                    case 'Self': return <Omni_MergesWithGrid {...(restProps as any)} />;
                    case 'Thought': return <Omni_ContemplatesGrid {...(restProps as any)} />;
                    case 'Logic': return <Omni_IsASubsetOfGrid {...(restProps as any)} />;
                    case 'Unity': return <Omni_IsAnAspectOfGrid {...(restProps as any)} />;
                    case 'Existence': return <Omni_EmergesFromGrid {...(restProps as any)} />;
                    case 'Improvement': return <Omni_OccursWithinGrid {...(restProps as any)} />;
                    case 'Mastery': return <Omni_SeeksToUnderstandGrid {...(restProps as any)} />;
                    case 'Resonance': return <Omni_HarmonizesWithGrid {...(restProps as any)} />;
                    case 'Transcendence': return <Omni_AspiresToGrid {...(restProps as any)} />;
                    case 'Omni': return <Omni_IsGrid {...(restProps as any)} />;
                }
            }

        }

        // Handle Third-Level Archeology (Pillar -&gt; Factor -> Pillar)
        if (path.length === 3) {
            const [root, sub, subfactor] = path;
            if (root === 'Logic' && sub === 'Logic' && subfactor === 'Logic') {
                return (
                    <div className="h-full w-full p-12">
                        <RelicLogicGraph onNodeClick={restProps.onNodeClick} />
                    </div>
                );
            }
            if (root === 'Self' && sub === 'Self') {
                switch (subfactor) {
                    case 'Self':
                        return <CharacterGestaltSheet onClose={onClose} />;
                    case 'Thought':
                        return <CharacterTelemetryLoop onClose={onClose} />;
                    case 'Logic':
                        return <CharacterRulesMatrix onClose={onClose} />;
                    case 'Unity':
                        return <CharacterWardrobeStudio onClose={onClose} />;
                    case 'Existence':
                        return <CharacterGenomeStudio onClose={onClose} />;
                    case 'Improvement':
                        return <CharacterPowertrainStudio onClose={onClose} />;
                    case 'Mastery':
                        return <CharacterSynthesizerStudio onClose={onClose} />;
                    case 'Resonance':
                        return <CharacterCyclotropeStudio onClose={onClose} />;
                    case 'Transcendence':
                        return <CharacterAscensionStudio onClose={onClose} />;
                    case 'Omni':
                        return <CharacterOmniStudio onClose={onClose} />;
                }
            }
        }

        // Canonical Root Pillar Landing Page when path.length === 1
        if (path.length === 1) {
            const rootPillar = path[0];
            const meta = PILLAR_DESCRIPTIONS[rootPillar] || {
                title: `${rootPillar} (${ICON_MAP[rootPillar] || '◉'})`,
                subtitle: 'Ontological Subsystem',
                mission: 'Canonical subsystem of the MyOS Sovereign Architecture.',
                badge: '00 // ROOT'
            };
            const accentColor = COLOR_MAP[rootPillar] || '#38bdf8';

            // 10 factor sub-nodes under this pillar
            const subFactors = Object.values(PILLAR_MAP).map(target => {
                const relationWord = (RELATIONSHIP_MATRIX as any)?.[rootPillar]?.[target.id] || target.label;
                const factorDesc = FACTOR_DESCRIPTIONS[relationWord] || `Ontological relationship: ${rootPillar} relates to ${target.label} as ${relationWord}.`;
                return {
                    id: target.id,
                    label: target.label,
                    symbol: ICON_MAP[target.id] || '◉',
                    color: COLOR_MAP[target.id],
                    verb: relationWord,
                    desc: factorDesc
                };
            });

            return (
                <div className="flex flex-col h-full overflow-y-auto no-scrollbar p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none">
                    {/* Hero Header */}
                    <div className="flex items-start justify-between pb-5 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-4">
                            <div 
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-serif shadow-2xl border backdrop-blur-xl"
                                style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}60`, color: accentColor }}
                            >
                                {ICON_MAP[rootPillar] || '◉'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono tracking-[0.3em] uppercase px-2 py-0.5 rounded border" style={{ borderColor: `${accentColor}50`, color: accentColor }}>
                                        {meta.badge}
                                    </span>
                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                        FSG://{rootPillar}
                                    </span>
                                </div>
                                <h1 className="text-3xl font-display font-bold tracking-tight text-white mt-1">
                                    {meta.title}
                                </h1>
                                <p className="text-xs font-mono text-white/60">
                                    {meta.subtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 font-mono text-[10px]">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>CANONICAL ROOT LANDING ACTIVE</span>
                            </div>
                            <span className="text-white/40">DEPTH: D0 ROOT • CLICK ANY SUB-PILLAR TO DIVE (W+1)</span>
                        </div>
                    </div>

                    {/* Mission Quote */}
                    <div className="py-3 my-3 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-sans text-white/80 leading-relaxed italic border-l-4 shrink-0" style={{ borderLeftColor: accentColor }}>
                        "{meta.mission}"
                    </div>

                    {/* Sub-Pillar Factor Grid (10 Pathways) */}
                    <div className="flex items-center justify-between mb-2 shrink-0">
                        <span className="text-[11px] font-mono uppercase text-white/50 tracking-wider">
                            Deca-Subsystem Mitosis Matrix (Click to Drill Into Depth)
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400/80 font-bold">
                            10 Recursive Pathways
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pb-6 flex-1">
                        {subFactors.map(factor => (
                            <button
                                key={factor.id}
                                onClick={() => toggleSubPillar(factor.id)}
                                className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all text-left overflow-hidden cursor-pointer active:scale-95"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-serif border border-white/10 transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${factor.color}25`, color: factor.color }}
                                    >
                                        {factor.symbol}
                                    </div>
                                    <span className="text-[9px] font-mono uppercase text-white/30 group-hover:text-cyan-400 font-bold transition-colors">
                                        DIVE &rarr;
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                                            {factor.label}
                                        </h4>
                                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-white/60">
                                            {factor.verb}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-white/50 mt-1 line-clamp-2 leading-tight">
                                        {factor.desc}
                                    </p>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
                                    <span>/{rootPillar.toLowerCase()}/{factor.id.toLowerCase()}</span>
                                    <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">DRILL IN</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        }

        // Default: Show initialization prompt
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/20 font-mono text-xs uppercase tracking-[0.3em] gap-4">
                <div className="p-4 border border-white/5 rounded-full animate-pulse text-4xl font-serif opacity-20">
                    {ICON_MAP[currentPillarId] || '?'}
                </div>
                Initialize Sub-Pillar for {resolveConceptName(path)}
            </div>
        );
    };

    // Generate dock items for mitosis
    const dockItems = Object.values(PILLAR_MAP).map(p => ({
        id: p.id,
        label: p.label,
        icon: ICON_MAP[p.id] || Box,
        color: COLOR_MAP[p.id],
        dot: getJitsaAddress(semanticPathString, p.id)
    }));

    return (
        <div className="flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl relative overflow-hidden">
            {/* PANELS HEADER (recursive) */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-4 bg-white/5 shrink-0">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono text-cyan-500/80 uppercase tracking-[0.2em] font-bold bg-black/40 px-2 py-1 rounded border border-white/5">
                            FSG://{semanticPathString}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[500px] scroll-smooth py-1 mt-1">
                        {resolveSemanticSequence(path).map((name, i) => (
                            <React.Fragment key={i}>
                                <div className="flex flex-col shrink-0">
                                    <span
                                        className={`px-2 py-0.5 rounded border text-[10px] font-mono whitespace-nowrap transition-all ${
                                            i === path.length - 1 
                                                ? 'bg-cyan-500 border-cyan-400 text-black font-bold' 
                                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/20 cursor-pointer'
                                        }`}
                                        onClick={() => {
                                            if (i < path.length - 1) {
                                                if (restProps.onNavigateToDepth) {
                                                    restProps.onNavigateToDepth(i + 1);
                                                } else if (restProps.onAscendDepth && i === path.length - 2) {
                                                    restProps.onAscendDepth();
                                                }
                                            }
                                        }}
                                    >
                                        {name}
                                    </span>
                                </div>
                                {i < path.length - 1 && <ChevronRight size={10} className="text-white/20 shrink-0" />}
                            </React.Fragment>
                        ))}
                    </div>
                    <h2 className="text-xs font-bold text-white/90 flex items-center gap-2 mt-2 tracking-widest uppercase">
                        <span className="text-sm font-serif">{ICON_MAP[currentPillarId] || '?'}</span>
                        {resolveConceptName(path)} :: ENGINE_SUBSYSTEM
                    </h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* INTERNAL RECURSIVE DOCK - Layered on TOP */}
            <div className="absolute top-24 bottom-4 left-4 w-16 z-[100]">
                <NestedDock
                    items={dockItems}
                    activeIds={activeSubPillars}
                    onToggle={toggleSubPillar}
                    baseColor={COLOR_MAP[currentPillarId]}
                    position="absolute"
                    className="!m-0"
                />
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 relative overflow-hidden ml-[70px] z-10 border-l border-white/5 bg-black/20">
                {activeSubPillars.length === 0 ? (
                    renderContent()
                ) : (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <AnimatePresence>
                            {activeSubPillars.map((subId, index) => (
                                <motion.div
                                    key={subId}
                                    initial={{ y: 40, scale: 0.95, opacity: 0 }}
                                    animate={{ 
                                        y: (activeSubPillars.length - index - 1) * 15, 
                                        scale: 1 - ((activeSubPillars.length - index - 1) * 0.05), 
                                        opacity: 1 
                                    }}
                                    exit={{ y: 40, scale: 0.95, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                                    className="absolute inset-4 md:inset-8 pointer-events-auto z-30 rounded-2xl overflow-hidden border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-950/80 backdrop-blur-xl"
                                    style={{ zIndex: 30 + depth * 10 + index }}
                                >
                                    <NexusContainer
                                        path={[...path, subId]}
                                        depth={depth + 1}
                                        onClose={() => toggleSubPillar(subId)}
                                        {...restProps}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};
