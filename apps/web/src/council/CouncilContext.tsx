import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { HRMInstance, type DualRecurrentReasoningModule, type HRMState } from './HRM';
import { COUNCIL_AGENTS, type CouncilAgent, type AgentId } from './agentRegistry';
import { EconomyInstance, type Transaction, type OntoCoin, type Wallet } from './EconomySystem';
import { useLocalFileSystem } from '@Omni/hooks/useLocalFileSystem';
import { MemCube } from '../memory/MemCube';
import { initializeLibrary } from '../memory/seedLoader';

import { mistralLocalService, type MistralResponse } from '../engine/mistralLocalService';
import { generateResponse, generateStreamResponse } from '../components/MaxOverlay/localLlmService';

// --- Context Definition ---
export interface AgentLocomotionConfig {
    isWandering: boolean;
    spawnPoint?: string;
    path?: string;
}

interface CouncilContextType {
    // HRM (Reasoning Core)
    state: HRMState;
    scheduler: DualRecurrentReasoningModule;
    awaken: () => void;
    
    // Local AI Thinking
    thinkLocally: (agentId: string, prompt: string, context?: string) => Promise<string>;

    // Agent Management
    activeAgentId: AgentId | null;
    setActiveAgent: (id: AgentId | null) => void;
    visibleAgentIds: AgentId[];
    toggleAgentVisibility: (id: AgentId) => void;
    activeAgent: CouncilAgent;
    agents: Record<AgentId, CouncilAgent>;
    spawnNPC: (name: string, spriteConfig: any) => string;

    // Economy
    economyLog: Transaction[];
    getAgentBalance: (id: string, currency: OntoCoin) => number;
    getAllBalances: (id: string) => Wallet;

    // Filesystem
    mountFileSystem: () => Promise<any[]>;
    fileNodes: any[];
    isConnected: boolean;
    writeFile: (path: string, content: string | Blob) => Promise<boolean>;
    readFile: (path: string) => Promise<string | null>;
    memCube: MemCube | null;

    // Rewards
    grantOntoCoin: (coin: OntoCoin, amount: number) => void;

    // Aetherial Tutor Shapeshifter State
    tutorPersona: any | null;
    pendingShapeshift: string | null;
    proposeShapeshift: (slug: string) => void;
    approveShapeshift: () => void;
    denyShapeshift: () => void;

    // Genome Persistence
    agentGenomes: Record<AgentId, any>;
    updateAgentGenome: (id: AgentId, genome: any) => void;

    // Locomotion Persistence
    agentTargets: Record<string, string>;
    setAgentTargets: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    agentLocomotion: Record<AgentId, AgentLocomotionConfig>;
    updateAgentLocomotion: (id: AgentId, config: Partial<AgentLocomotionConfig>) => void;

    // ⚹ Party Management (Hexroll / Secret of Mana)
    partyMemberIds: string[];
    activePartyLeadId: string | null;
    addToParty: (id: string) => void;
    removeFromParty: (id: string) => void;
    swapLead: (id: string) => void;

    // Chat / Diegetic Output
    agentMessages: Record<AgentId, { text: string; timestamp: number; emotion: string } | null>;
    speak: (id: AgentId, text: string, emotion?: string) => void;

    // Selection Logic
    selectedPropId: string | null;
    setSelectedPropId: (id: string | null) => void;

    // Inventory / Vault
    userInventory: any[];
    addToInventory: (item: any) => void;
}


const DEFAULT_COUNCIL_FALLBACK: CouncilContextType = {
    state: HRMInstance.getState(),
    scheduler: HRMInstance,
    awaken: () => HRMInstance.wakeUp(),
    thinkLocally: async () => '',
    activeAgentId: 'orchestrator',
    setActiveAgent: () => {},
    activeAgent: COUNCIL_AGENTS['orchestrator'],
    visibleAgentIds: ['user', 'orchestrator'],
    toggleAgentVisibility: () => {},
    agents: COUNCIL_AGENTS,
    spawnNPC: () => '',
    economyLog: [],
    getAgentBalance: () => 0,
    getAllBalances: () => ({ SelCoin: 0, ThoCoin: 0, LogCoin: 0, UniCoin: 0, ExiCoin: 0, ImpCoin: 0, MasCoin: 0, ResCoin: 0, TraCoin: 0, OmniCoin: 0 }),
    mountFileSystem: async () => [],
    fileNodes: [],
    isConnected: false,
    writeFile: async () => false,
    readFile: async () => null,
    memCube: HRMInstance.memCube,
    grantOntoCoin: () => {},
    tutorPersona: null,
    pendingShapeshift: null,
    proposeShapeshift: () => {},
    approveShapeshift: () => {},
    denyShapeshift: () => {},
    agentGenomes: {},
    updateAgentGenome: () => {},
    agentTargets: {},
    setAgentTargets: () => {},
    agentLocomotion: {},
    updateAgentLocomotion: () => {},
    partyMemberIds: ['talia', 'aelar'],
    activePartyLeadId: 'talia',
    addToParty: () => {},
    removeFromParty: () => {},
    swapLead: () => {},
    agentMessages: {} as any,
    speak: () => {},
    selectedPropId: null,
    setSelectedPropId: () => {},
    userInventory: [],
    addToInventory: () => {}
};

const CouncilContext = (typeof window !== 'undefined' && (window as any).__MYOS_COUNCIL_CONTEXT__)
    ? (window as any).__MYOS_COUNCIL_CONTEXT__
    : (typeof window !== 'undefined'
        ? ((window as any).__MYOS_COUNCIL_CONTEXT__ = createContext<CouncilContextType>(DEFAULT_COUNCIL_FALLBACK))
        : createContext<CouncilContextType>(DEFAULT_COUNCIL_FALLBACK));

// --- Provider ---

export const CouncilProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // FS Capability
    const { writeFile, readFile, mountDirectory, fileNodes, isConnected } = useLocalFileSystem();

    // HRM State
    const [state, setState] = useState<HRMState>(HRMInstance.getState());

    // Agent State
    const [activeAgentId, setActiveAgentId] = useState<AgentId | null>('orchestrator');
    const [visibleAgentIds, setVisibleAgentIds] = useState<AgentId[]>(['user', 'orchestrator']);
    const [agents, setAgents] = useState<Record<AgentId, CouncilAgent>>(COUNCIL_AGENTS);

    // Economy State
    const [economyLog, setEconomyLog] = useState<Transaction[]>([]);

    // Aetherial Tutor
    const [tutorPersona, setTutorPersona] = useState<any | null>(null);
    const [pendingShapeshift, setPendingShapeshift] = useState<string | null>(null);

    const proposeShapeshift = (slug: string) => {
        setPendingShapeshift(slug);
    };

    const shapeshiftCompanion = (slug: string) => {
        const s = slug.toLowerCase();
        let bodySheet = '/actions/lunaria_sorceress_idle_loop.png';
        let archetype: string | undefined = undefined;

        if (s.includes('einstein') || s.includes('tutor') || s.includes('albert')) {
            bodySheet = '/actions/einstein_idle_loop.png';
        } else if (s.includes('larry') || s.includes('technician') || s.includes('it')) {
            bodySheet = '/actions/larry_idle_loop.png';
        } else if (s.includes('rogue') || s.includes('shadow')) {
            bodySheet = '/actions/shadow_rogue_idle_loop.png';
        } else if (s.includes('paladin') || s.includes('sunlit') || s.includes('knight')) {
            bodySheet = '/actions/sunlit_paladin_idle_loop.png';
        } else if (s.includes('adventurer') || s.includes('fighter')) {
            bodySheet = '/actions/flesh_adventurer_idle_loop.png';
        } else if (s.includes('uniracer') || s.includes('unicycle') || s.includes('red')) {
            bodySheet = '';
            archetype = 'uniracer';
        } else if (s.includes('devil')) {
            bodySheet = '/actions/barbed_devil_idle_loop.png';
        } else if (s.includes('golem')) {
            bodySheet = '/actions/microvoxel_golem_idle_loop.png';
        } else {
            bodySheet = '/actions/lunaria_sorceress_idle_loop.png';
        }

        const config = {
            genome: {
                body: bodySheet,
                archetype,
                modelType: archetype === 'uniracer' ? 'uniracer' : undefined,
                legs: 'none', hair: 'none', torso: 'none', head: 'none', ears: 'none', facial: 'none', feet: 'none', arms: 'none', shoulders: 'none', hat: 'none', weapon: 'none', offhand: 'none'
            },
            meta: { id: slug, name: slug.toUpperCase(), category: 'heroes', action: 'idle', archetype }
        };

        setAgentGenomes(prev => {
            const next = {
                ...prev,
                orchestrator: config,
                companion: config
            };
            localStorage.setItem('myos_agent_genomes', JSON.stringify(next));
            return next;
        });

        window.dispatchEvent(new CustomEvent('myos_update_companion', { detail: { genome: config } }));
    };

    const approveShapeshift = (slugOverride?: string) => {
        const slug = slugOverride || pendingShapeshift;
        if (!slug) return;
        shapeshiftCompanion(slug);
        setTutorPersona({ path: slug });
        setPendingShapeshift(null);
    };

    // Auto-shapeshift companion when swapping realms
    useEffect(() => {
        const handleSwap = (e: any) => {
            const dim = e.detail;
            if (dim === 'uniracers_world' || dim === 'cycle_park' || dim === 'junkyard') {
                shapeshiftCompanion('uniracer');
            } else if (dim === 'printer_panic') {
                shapeshiftCompanion('larry');
            } else if (dim === 'soundstage' || dim === 'cinema') {
                shapeshiftCompanion('einstein');
            } else if (dim === 'astra_faerun' || dim === 'yawning_portal') {
                shapeshiftCompanion('lunaria');
            }
        };
        window.addEventListener('myos_dimension_swap', handleSwap);
        return () => window.removeEventListener('myos_dimension_swap', handleSwap);
    }, []);

    const denyShapeshift = () => {
        setPendingShapeshift(null);
    };

    // Genome State
    const [agentGenomes, setAgentGenomes] = useState<Record<AgentId, any>>({} as Record<AgentId, any>);
    const [agentTargets, setAgentTargets] = useState<Record<string, string>>({});
    const [agentLocomotion, setAgentLocomotion] = useState<Record<AgentId, AgentLocomotionConfig>>(() => {
        const initial: any = {};
        Object.keys(COUNCIL_AGENTS).forEach(id => {
            initial[id] = { isWandering: id === 'orchestrator' }; // Only tutor wanders/follows
        });
        return initial;
    });

    // Chat State
    const [agentMessages, setAgentMessages] = useState<Record<AgentId, { text: string; timestamp: number; emotion: string } | null>>({} as any);
    const [agentHistory, setAgentHistory] = useState<Record<string, { role: 'user' | 'assistant', content: string }[]>>({});

    const thinkLocally = async (agentId: string, prompt: string, context?: string): Promise<string> => {
        const history = agentHistory[agentId] || [];
        const agent = agents[agentId as AgentId];
        const baseInstruction = agent?.systemInstruction || "You are an agent in MyOS.";
        const systemPrompt = context ? `${baseInstruction}\n\n--- LOCAL ENVIRONMENT STATE ---\n${context}` : baseInstruction;
        
        const isEinstein = agent?.name?.includes('Einstein') || agent?.name?.includes('Tutor');
        
        let responseText = "";
        
        try {
            // First try Ollama local service which defaults to gemma4 (now with streaming)
            const messageTimestamp = Date.now(); // Freeze the timestamp for the stream
            responseText = await generateStreamResponse(prompt, (chunk) => {
                // Real-time update for UI feedback
                setAgentMessages(prev => ({
                    ...prev,
                    [agentId]: { text: chunk, timestamp: messageTimestamp }
                }));
            }, systemPrompt, 'gemma4:latest', history);
        } catch (e) {
            console.warn("Ollama failed, falling back to Mistral...", e);
            let mistralRes: MistralResponse;
            if (isEinstein) {
                mistralRes = await mistralLocalService.generateGroundedResponse(prompt, systemPrompt, history, agentId);
            } else {
                mistralRes = await mistralLocalService.generateResponse(prompt, systemPrompt, history, agentId);
            }
            responseText = mistralRes.text;
        }
        
        // Update History
        setAgentHistory(prev => {
            const nextHistory: { role: 'user' | 'assistant', content: string }[] = [
                ...history,
                { role: 'user', content: prompt },
                { role: 'assistant', content: responseText }
            ];
            return {
                ...prev,
                [agentId]: nextHistory.slice(-10) // Rolling last 10
            };
        });

        return responseText;
    };

    // ⚹ Party Management (Hexroll / Secret of Mana)
    const [partyMemberIds, setPartyMemberIds] = useState<string[]>(['talia', 'aelar']);
    const [activePartyLeadId, setActivePartyLeadId] = useState<string | null>('talia');

    const addToParty = (id: string) => {
        setPartyMemberIds(prev => {
            if (prev.includes(id)) return prev;
            if (prev.length >= 4) return prev;
            return [...prev, id];
        });
    };

    const removeFromParty = (id: string) => {
        setPartyMemberIds(prev => prev.filter(mid => mid !== id));
        if (activePartyLeadId === id) {
            setActivePartyLeadId(partyMemberIds.find(mid => mid !== id) || null);
        }
    };

    const swapLead = (id: string) => {
        if (partyMemberIds.includes(id)) {
            setActivePartyLeadId(id);
        }
    };

    const [selectedPropId, setSelectedPropId] = useState<string | null>(null);

    // Inventory State
    const [userInventory, setUserInventory] = useState<any[]>([]);

    const addToInventory = (item: any) => {
        setUserInventory(prev => {
            if (prev.find(i => i.id === item.id)) return prev;
            return [...prev, item];
        });
    };

    const speak = (id: AgentId, text: string, emotion = 'neutral') => {

        setAgentMessages(prev => ({
            ...prev,
            [id]: { text, timestamp: Date.now(), emotion }
        }));
    };

    const spawnNPC = (name: string, spriteConfig: any): string => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        const npcId = `npc_${Date.now()}_${rand}` as AgentId;
        const newAgent: CouncilAgent = {
            id: npcId,
            name: name ? `${name} #${rand}` : `NPC #${rand}`,
            role: 'Autonomous NPC',
            title: 'Wandering Entity',
            description: 'Dynamic sovereign NPC spawned into the active scene.',
            pillar: 'Self',
            color: '#10b981',
            systemInstruction: 'You are a wandering NPC in the MyOS simulation.',
            avatarConfig: {
                modelType: 'sprite',
                action: 'idle',
                scale: 2.0,
                ...(spriteConfig || {})
            }
        };

        setAgents(prev => ({
            ...prev,
            [npcId]: newAgent
        }));

        setVisibleAgentIds(prev => (prev.includes(npcId) ? prev : [...prev, npcId]));

        if (spriteConfig?.genome) {
            setAgentGenomes(prev => ({
                ...prev,
                [npcId]: spriteConfig.genome
            }));
        }

        setAgentLocomotion(prev => ({
            ...prev,
            [npcId]: { isWandering: true }
        }));

        console.log(`[CouncilContext] Spawned NPC: ${npcId} (${newAgent.name})`);
        return npcId;
    };

    // Persistence Logic
    useEffect(() => {
        initializeLibrary();
        const savedGenomes = localStorage.getItem('myos_agent_genomes');
        if (savedGenomes) {
            try {
                setAgentGenomes(JSON.parse(savedGenomes));
            } catch (e) {
                console.error("Failed to parse agent genomes", e);
            }
        } else {
            setAgentGenomes({
                user: {
                    genome: {
                        body: '/actions/larry_idle_loop.png',
                        legs: 'none', hair: 'none', torso: 'none', head: 'none', ears: 'none', facial: 'none', feet: 'none', arms: 'none', shoulders: 'none', hat: 'none', weapon: 'none', offhand: 'none'
                    },
                    meta: { id: 'larry_it_technician', name: 'Larry (Frontline IT Desktop Support)', category: 'heroes', action: 'idle' }
                },
                orchestrator: {
                    genome: {
                        body: '/actions/lunaria_sorceress_idle_loop.png',
                        legs: 'none', hair: 'none', torso: 'none', head: 'none', ears: 'none', facial: 'none', feet: 'none', arms: 'none', shoulders: 'none', hat: 'none', weapon: 'none', offhand: 'none'
                    },
                    meta: { id: 'lunaria_sorceress', name: 'Lunaria (Lunar Archmage)', category: 'heroes', action: 'idle' }
                },
                companion: {
                    genome: {
                        body: '/actions/lunaria_sorceress_idle_loop.png',
                        legs: 'none', hair: 'none', torso: 'none', head: 'none', ears: 'none', facial: 'none', feet: 'none', arms: 'none', shoulders: 'none', hat: 'none', weapon: 'none', offhand: 'none'
                    },
                    meta: { id: 'lunaria_sorceress', name: 'Lunaria (Lunar Archmage)', category: 'heroes', action: 'idle' }
                }
            } as any);
        }

        const savedTargets = localStorage.getItem('myos_agent_targets');
        if (savedTargets) {
            try {
                setAgentTargets(JSON.parse(savedTargets));
            } catch (e) {
                console.error("Failed to parse agent targets", e);
            }
        }

        const savedTutor = localStorage.getItem('myos_tutor_persona');
        if (savedTutor) {
            try {
                setTutorPersona(JSON.parse(savedTutor));
            } catch (e) {
                console.error("Failed to parse tutor persona", e);
            }
        }

        const savedLoco = localStorage.getItem('myos_agent_locomotion');
        if (savedLoco) {
            try {
                setAgentLocomotion(prev => ({ ...prev, ...JSON.parse(savedLoco) }));
            } catch (e) {
                console.error("Failed to parse agent locomotion", e);
            }
        }

        const savedInventory = localStorage.getItem('myos_user_inventory');
        if (savedInventory) {
            try {
                setUserInventory(JSON.parse(savedInventory));
            } catch (e) {
                console.error("Failed to parse user inventory", e);
            }
        }
    }, []);

    useEffect(() => {
        if (Object.keys(agentGenomes).length > 0) {
            localStorage.setItem('myos_agent_genomes', JSON.stringify(agentGenomes));
        }
    }, [agentGenomes]);

    useEffect(() => {
        localStorage.setItem('myos_agent_targets', JSON.stringify(agentTargets));
    }, [agentTargets]);

    useEffect(() => {
        localStorage.setItem('myos_agent_locomotion', JSON.stringify(agentLocomotion));
    }, [agentLocomotion]);

    useEffect(() => {
        if (tutorPersona) {
            localStorage.setItem('myos_tutor_persona', JSON.stringify(tutorPersona));
        }
    }, [tutorPersona]);

    useEffect(() => {
        localStorage.setItem('myos_user_inventory', JSON.stringify(userInventory));
    }, [userInventory]);

    useEffect(() => {
        // Hydrate HRM with Filesystem Persistence
        if (writeFile && readFile) {
            HRMInstance.setIO(writeFile, readFile);
        }

        const unsubscribeHRM = HRMInstance.subscribe((newState) => {
            setState(newState);
        });
        const unsubscribeEco = EconomyInstance.subscribe((newLog) => {
            setEconomyLog(newLog);
        });
        return () => {
            unsubscribeHRM();
            unsubscribeEco();
        };
    }, [writeFile, readFile]);

    const toggleAgentVisibility = (id: AgentId) => {
        setVisibleAgentIds(prev => {
            if (prev.includes(id)) {
                // Don't hide the last one? Or allow empty?
                // If hiding the active one, we should probably switch active
                if (id === activeAgentId && prev.length > 1) {
                    const next = prev.find(a => a !== id);
                    if (next) setActiveAgentId(next);
                }
                return prev.filter(a => a !== id);
            } else {
                setActiveAgentId(id); // Auto-focus on reveal
                return [...prev, id];
            }
        });
    };

    const value = useMemo(() => ({
        state,
        scheduler: HRMInstance,
        awaken: () => HRMInstance.wakeUp(),

        activeAgentId,
        setActiveAgent: (id: AgentId | null) => {
            setActiveAgentId(id);
            if (id && id !== 'user') {
                // Determine context
                let situationalPrompt = `You have been selected. Greet the User based on your semantic nature.`;
                if (id === 'bartender') {
                    situationalPrompt = `Roleplay the Bartender. Who: Last Proprietor. What: Resonance/Stability. Where: Astral/Shadow Hub. When: Eternal. Why: Pure Intent extraction. How: Storytelling. How are you?`;
                }
                
                // Auto-Bark on selection
                thinkLocally(id, situationalPrompt).then(res => {
                    speak(id, res);
                });
            }
        },
        activeAgent: activeAgentId ? agents[activeAgentId] : agents['orchestrator'],
        visibleAgentIds,
        toggleAgentVisibility,
        agents,
        spawnNPC,

        // Local AI Thinking
        thinkLocally,

        // Economy
        economyLog,
        getAgentBalance: (id: string, currency: OntoCoin) => EconomyInstance.getBalance(id, currency),
        getAllBalances: (id: string) => EconomyInstance.getAllBalances(id),

        // Filesystem
        mountFileSystem: mountDirectory,
        fileNodes,
        isConnected,
        writeFile,
        readFile,
        memCube: HRMInstance.memCube,

        // Tutor Persona
        tutorPersona,
        pendingShapeshift,
        proposeShapeshift,
        approveShapeshift,
        denyShapeshift,

        // Genome Persistence
        agentGenomes,
        updateAgentGenome: (id: AgentId, g: any) => setAgentGenomes(prev => ({ ...prev, [id]: g })),

        // Locomotion
        agentLocomotion,
        updateAgentLocomotion: (id: AgentId, config: Partial<AgentLocomotionConfig>) =>
            setAgentLocomotion(prev => ({
                ...prev,
                [id]: { ...prev[id], ...config }
            })),
        agentTargets,
        setAgentTargets,
        agentMessages,
        speak,

        // ⚹ Party Management
        partyMemberIds,
        activePartyLeadId,
        addToParty,
        removeFromParty,
        swapLead,

        // Selection Logic
        selectedPropId,
        setSelectedPropId,

        // Inventory
        userInventory,
        addToInventory,

        // Rewards
        grantOntoCoin: (coin: OntoCoin, amount: number) => {
            EconomyInstance.mint('user', coin, amount);
        }
    }), [state, activeAgentId, visibleAgentIds, agents, economyLog, mountDirectory, fileNodes, isConnected, writeFile, readFile, tutorPersona, agentGenomes, agentTargets, agentLocomotion, agentMessages, partyMemberIds, activePartyLeadId, selectedPropId, userInventory]);


    if (typeof window !== 'undefined') {
        (window as any).__MYOS_LATEST_COUNCIL_VALUE__ = value;
    }

    return (
        <CouncilContext.Provider value={value}>
            {children}
        </CouncilContext.Provider>
    );
};

// --- Hook ---

export const useCouncil = () => {
    const context = useContext(CouncilContext);
    if (!context) {
        if (typeof window !== 'undefined' && (window as any).__MYOS_LATEST_COUNCIL_VALUE__) {
            return (window as any).__MYOS_LATEST_COUNCIL_VALUE__;
        }
        return DEFAULT_COUNCIL_FALLBACK;
    }
    return context;
};
