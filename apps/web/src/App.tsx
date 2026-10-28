import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Contexts
import { EchoProvider, useEcho } from './context/EchoContext';
import { CouncilProvider, useCouncil } from './council/CouncilContext';
import { WorldProvider } from './engine/WorldContext';
import { CoreProvider } from './Logic/core/CoreContext';
import { SocialProvider } from './social/SocialContext';

// Components
import { MaxOverlay } from './components/MaxOverlay/MaxOverlay';
import { CartridgeLockHUD } from './components/MaxOverlay/CartridgeLockHUD';
import W5HOverlay from './Omni/components/Overlay/W5HOverlay';
import { VerboseBootScreen } from './components/MaxOverlay/VerboseBootScreen';

// Engine / Hooks / Services
import { AgentOrchestrator } from './Omni/lib/modules/AgentOrchestrator';
import { useAgentScheduler } from './hooks/useAgentScheduler';
import { sendMessageToGemini, parseGeminiResponse } from './Thought/services/tutorGeminiService';

// Pillar Interfaces (Verified Heterogeneous Imports)
import { SelfInterface } from './Self/S1_SelfInterface';
import { ThoughtInterface } from './Thought/S2_ThoughtInterface';
import LogicInterface from './Logic/S3_LogicInterface';
import UnityInterface from './Unity/S4_UnityInterface';
import { ExistenceInterface } from './Existence/S5_ExistenceInterface';
import ImprovementInterface from './Improvement/S6_ImprovementInterface';
import MasteryInterface from './Mastery/S7_MasteryInterface';
import ResonanceInterface from './Resonance/S8_ResonanceInterface';
import TranscendenceInterface from './Transcendence/S9_TranscendenceInterface';
import OmniInterface from './Omni/S10_OmniInterface';

// Types
import type { GemId } from './Omni/types/council';
import type { Message } from './Omni/types/system';
import type { UserGestalt } from './Omni/types/gestalt';
import type { LibraryNode, Synapse } from './Omni/types/knowledge';

// --- UTILS ---
const loadState = <T,>(key: string, defaultValue: T): T => {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
};

const DEFAULT_GESTALT: UserGestalt = {
    archetype: "Initiate",
    coreValues: ["Truth", "Growth"],
    narrativeArc: "Rebuilding the Nexus.",
    logicPreference: "Balanced",
    attributes: { 
        construct: { level: 1, xp: 0, history: [] }, 
        resonance: { level: 1, xp: 0, history: [] }, 
        vision: { level: 1, xp: 0, history: [] }, 
        endurance: { level: 1, xp: 0, history: [] } 
    },
    cognitiveModel: { learningStyle: 'visual', riskTolerance: 'balanced', communicationDensity: 'concise' },
    symbiosis: { coherence: 50, friction: 0, flowState: false },
    identity: { name: 'Initiate', alias: 'User', dob: '' },
    biometrics: { height: '', appearance: '' },
    favorites: { color: '#00FFFF', food: 'Code', musicGenre: 'Synthwave' },
    ontology: {
        'node-self': 'The Integrated Self, perceiving through the digital threshold.',
        'node-thought': 'Recursive cognition mirroring the cosmic structure.',
        'node-logic': 'Grounded in the Axiom 0=1; Definition precedes Existence.',
        'node-unity': 'Holographic; the part contains the whole.',
        'node-existence': 'This code, this interface, this moment of I/O.',
        'node-improvement': 'Tightening feedback loops to increase signal coherence.',
        'node-mastery': 'Execution of the Sovereign Quest with precision.',
        'node-resonance': 'VIBRANT. Aligned with Clarity and Purpose.',
        'node-transcendence': 'Dissolving the boundary between User and System.',
        'node-omni': 'The Void from which all Code emerges.'
    },
    genome: {
        body: '/actions/larry_idle_loop.png',
        legs: 'none',
        hair: 'none',
        torso: 'none',
        head: 'none',
        ears: 'none',
        facial: 'none',
        feet: 'none',
        arms: 'none',
        shoulders: 'none',
        hat: 'none',
        weapon: 'none',
        offhand: 'none'
    }
};

const PILLAR_NAMES = ['Self', 'Thought', 'Logic', 'Unity', 'Existence', 'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'] as const;

export default function App() {
    return (
        <EchoProvider>
            <CouncilProvider>
                <SocialProvider>
                    <AppContent />
                </SocialProvider>
            </CouncilProvider>
        </EchoProvider>
    );
}

function AppContent() {
    const {
        memCube,
        isConnected,
        setAgentTargets,
        agentTargets,
        selectedPropId
    } = useCouncil();

    const { emitPulse } = useEcho();

    // Core State
    const [activeGem, setActiveGem] = useState<GemId>(() => loadState<GemId>('myos_active_gem', 'Self'));
    const [messages, setMessages] = useState<Message[]>(() => loadState('myos_messages', []));
    const [userGestalt, setUserGestalt] = useState<UserGestalt>(() => loadState('myos_user_gestalt', DEFAULT_GESTALT));
    const [library, setLibrary] = useState<LibraryNode | null>(null);
    const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

    // Sidebar UI State
    const [userInput, setUserInput] = useState("");
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);
    const [isFlowState, setIsFlowState] = useState(false);
    const [selectedGems, setSelectedGems] = useState<GemId[]>(['Self', 'Thought']);
    const [ghostNodes, setGhostNodes] = useState<any[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connections, setConnections] = useState<Synapse[]>([]);
    const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
    const [isGraphVisible, setIsGraphVisible] = useState(false);
    const [isPanelsVisible, setIsPanelsVisible] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    
    const talkingStickIndex = useRef(0);
    const handledPropId = useRef<string | null>(null);

    // Orchestrator
    const [orchestrator] = useState(() => new AgentOrchestrator());
    useAgentScheduler(orchestrator, library, ghostNodes, { intervalMs: 30000, enabled: true });

    // Local Storage Sync
    useEffect(() => { localStorage.setItem('myos_active_gem', JSON.stringify(activeGem)); }, [activeGem]);
    useEffect(() => { localStorage.setItem('myos_messages', JSON.stringify(messages)); }, [messages]);
    useEffect(() => { localStorage.setItem('myos_user_gestalt', JSON.stringify(userGestalt)); }, [userGestalt]);

    // Global Hyperjump Bus (Cross-Pillar Node Navigation)
    useEffect(() => {
        const handleJump = (e: any) => {
            const root = e.detail?.root;
            if (root && PILLAR_NAMES.includes(root as any)) {
                setActiveGem(root as GemId);
                setIsPanelsVisible(true); // Ensure panels open when jumping
                // The new Interface will read 'mystra_pending_jump' from localStorage on mount and open the panel.
            }
        };
        window.addEventListener('MYSTRA_JUMP', handleJump);
        return () => window.removeEventListener('MYSTRA_JUMP', handleJump);
    }, []);

    // Global Gestalt Update Listener
    useEffect(() => {
        const handleUpdate = (e: any) => {
            const update = e.detail;
            setUserGestalt(prev => ({ ...prev, ...update }));
        };
        window.addEventListener('myos_update_gestalt', handleUpdate);
        return () => window.removeEventListener('myos_update_gestalt', handleUpdate);
    }, []);

    // Handle Selection Hotswap
    useEffect(() => {
        if (selectedPropId && selectedPropId !== handledPropId.current) {
            setActiveSubjectId(selectedPropId);
            handledPropId.current = selectedPropId;
        }
    }, [selectedPropId]);

    // Library Hydration
    useEffect(() => {
        if (isConnected && memCube) {
            const buffer = (memCube as any).buffer;
            if (buffer?.para?.library) {
                setLibrary(buffer.para.library);
            }
        }
    }, [isConnected, memCube]);

    // Global Heartbeat
    useEffect(() => {
        const interval = setInterval(() => {
            const currentPillar = PILLAR_NAMES[talkingStickIndex.current % 10];
            talkingStickIndex.current++;
            emitPulse({
                agentId: currentPillar,
                monologue: "...pondering the silent metrics...",
                state: "pondering",
                skillActive: false,
                skillType: "none"
            });
        }, 12000);
        return () => clearInterval(interval);
    }, [emitPulse]);

    // Handlers
    const handleGraphNodeClick = useCallback((node: any) => {
        if (!node?.id) return;
        const pillar = node.id.split('.')[0];
        if (PILLAR_NAMES.includes(pillar as any)) {
            setActiveGem(pillar as GemId);
            setAgentTargets((prev: any) => ({ ...prev, [pillar.toLowerCase()]: "A1" }));
        }
    }, [setAgentTargets]);

    const handleUpdateLibrary = useCallback((node: any) => {
        setLibrary(prev => ({ ...prev, ...node } as LibraryNode));
    }, []);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsGeminiLoading(true);

        try {
            const history = messages.map(m => ({
                id: m.id,
                timestamp: m.timestamp,
                role: m.role as 'user' | 'model',
                text: m.content
            }));
            const { text: responseText } = await sendMessageToGemini(history, text, undefined, true, []);
            const { cleanText } = parseGeminiResponse(responseText);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: cleanText, timestamp: Date.now() }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: "The Aether is silent.", timestamp: Date.now() }]);
        } finally {
            setIsGeminiLoading(false);
        }
    };

    // Render logic

    const renderInterface = () => {
        const commonProps = {
            activeSubjectId: activeSubjectId || selectedPropId || 'Nexus Kernel'
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeGem}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full h-full"
                >
                    {(() => {
                        switch (activeGem) {
                            case 'Self':
                                return <SelfInterface {...commonProps} gestalt={userGestalt} onUpdate={(u: any) => setUserGestalt(p => ({ ...p, ...u }))} memories={[]} setMemories={() => { }} onNodeClick={handleGraphNodeClick} />;
                            case 'Thought':
                                return <ThoughtInterface {...commonProps} messages={messages} isLoading={isGeminiLoading} onSend={handleSendMessage} userInput={userInput} setUserInput={setUserInput} onFeedback={() => { }} isFlowState={isFlowState} onToggleFlow={() => setIsFlowState(!isFlowState)} onClear={() => setMessages([])} onExport={() => { }} onResetKey={() => { }} selectedGems={selectedGems} onToggleGem={(id: any) => setSelectedGems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} library={library} onUpdateLibrary={handleUpdateLibrary as any} userGestalt={userGestalt} />;
                            case 'Logic':
                                return (
                                    <LogicInterface {...commonProps} library={library} onUpdateLibrary={handleUpdateLibrary} onOpenInEditor={(path: any) => setSelectedFilePath(path)} userGestalt={userGestalt} messages={messages} onClear={() => setMessages([])} />
                                );
                            case 'Unity':
                                return <UnityInterface {...commonProps} library={library} onUpdateLibrary={handleUpdateLibrary} userGestalt={userGestalt} connections={connections} onAddSynapses={(syns: any) => setConnections(prev => [...prev, ...syns])} onAuthError={() => { }} ghostNodes={ghostNodes} onAddGhostNodes={(gn: any) => setGhostNodes(prev => [...prev, ...gn])} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} orchestrator={orchestrator} />;
                            case 'Existence':
                                return <ExistenceInterface {...commonProps} />;
                            case 'Improvement':
                                return <ImprovementInterface {...commonProps} workflowEngine={{} as any} userGestalt={userGestalt} />;
                            case 'Mastery':
                                return (
                                    <MasteryInterface {...commonProps} quests={[]} achievements={[]} telemetry={{} as any} />
                                );
                            case 'Resonance':
                                return <ResonanceInterface {...commonProps} telemetry={{} as any} councilState={{} as any} chronicle={[]} onGrantXp={() => { }} />;
                            case 'Transcendence':
                                return <TranscendenceInterface {...commonProps} userGestalt={userGestalt} library={library} onWarp={() => { }} />;
                            case 'Omni':
                                return <OmniInterface {...commonProps} manifest={{ id: 'omni-1', title: 'Omni', description: 'The Void', intent: 'Be', screens: [], doors: [], sceneObjects: [] } as any} memories={[]} />;
                            default:
                                return <div className="p-8 text-cyan-400 font-display">MANIFESTING...</div>;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };

    return (
        <>
            <AnimatePresence>
                {isBooting && (
                    <VerboseBootScreen onBootComplete={() => setIsBooting(false)} />
                )}
            </AnimatePresence>

            <MaxOverlay
                userGestalt={userGestalt}
                onUpdateUserGestalt={(u: any) => setUserGestalt(p => ({ ...p, ...u }))}
                library={library ? [library] : undefined}
                activeGem={activeGem}
                setActiveGem={setActiveGem}
                agentTargets={agentTargets}
                isGraphVisible={isGraphVisible}
                setIsGraphVisible={setIsGraphVisible}
                isPanelsVisible={isPanelsVisible}
                setIsPanelsVisible={setIsPanelsVisible}
            >
                <div className={`relative w-full h-screen text-white font-mono overflow-hidden ${!isPanelsVisible && !selectedFilePath ? 'pointer-events-none' : ''}`}>
                    <AnimatePresence>
                        {isPanelsVisible && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 bg-black/80 backdrop-blur-xl pointer-events-auto"
                            >
                                <div className="h-full relative overflow-visible">
                                    <CoreProvider>
                                        {renderInterface()}
                                    </CoreProvider>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* JRPG/Cyberpunk Scanline Overlay */}
                    <div className="scanline-overlay pointer-events-none" />

                    {/* Sovereign Load & Lock Cartridge Protection HUD */}
                    <CartridgeLockHUD />

                    {selectedFilePath && (
                        <div className="absolute inset-0 z-[60] bg-black/90 flex items-center justify-center p-8 pointer-events-auto">
                            <W5HOverlay filePath={selectedFilePath} onClose={() => setSelectedFilePath(null)} />
                        </div>
                    )}
                </div>
            </MaxOverlay>
        </>
    );
}
