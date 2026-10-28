import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Send, Users, Play, Pause, ChevronRight, Dices, 
    RefreshCw, Quote, ShieldCheck, CheckCircle2, Clock, 
    Sparkles, Eye, LayoutGrid, Award, Box, Camera
} from 'lucide-react';
import { useCouncil } from '../../council/CouncilContext';
import { COUNCIL_AGENTS, type AgentId } from '../../council/agentRegistry';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

export interface QuotedMessageRef {
    id: string;
    senderName: string;
    senderGlyph: string;
    senderColor: string;
    textSnippet: string;
}

export interface DecaCouncilMessage {
    id: string;
    agentId: AgentId | 'cortex' | 'user';
    senderName: string;
    senderGlyph: string;
    senderColor: string;
    roleBadge?: string;
    text: string;
    timestamp: number;
    actionTag?: string;
    replyTo?: QuotedMessageRef;
}

export interface PillarProposal {
    pillarId: AgentId;
    pillarName: string;
    glyph: string;
    color: string;
    category: string;
    title: string;
    summary: string;
    status: 'Proposed' | 'Approved' | 'Testing';
    champsMetric: 'Cleanliness' | 'Hospitality' | 'Accuracy' | 'Maintenance' | 'Production' | 'Speed';
}

const PILLAR_ORDER: AgentId[] = [
    'self', 'thought', 'logic', 'unity', 'existence',
    'improvement', 'mastery', 'resonance', 'transcendence', 'omni'
];

const PILLAR_GLYPHS: Record<string, string> = {
    self: '◉',
    thought: '✧',
    logic: '∴',
    unity: '⚭',
    existence: '⬡',
    improvement: '⇈',
    mastery: '❂',
    resonance: '∿',
    transcendence: '⍟',
    omni: '۞',
    user: '👑',
    cortex: '🧠'
};

const PILLAR_HEX_COLORS: Record<string, string> = {
    self: '#eab308',
    thought: '#6366f1',
    logic: '#06b6d4',
    unity: '#10b981',
    existence: '#d97706',
    improvement: '#f97316',
    mastery: '#ef4444',
    resonance: '#ec4899',
    transcendence: '#a855f7',
    omni: '#38bdf8',
    user: '#ffffff',
    cortex: '#38bdf8'
};

const DEFAULT_PROPOSALS: PillarProposal[] = [
    {
        pillarId: 'self',
        pillarName: 'Self',
        glyph: '◉',
        color: '#eab308',
        category: 'Player Archetype',
        title: 'Asymmetric Soul Traits',
        summary: 'Each player selects an Ontological Anchor granting unique signature abilities and a distinct vulnerability curve.',
        status: 'Approved',
        champsMetric: 'Hospitality'
    },
    {
        pillarId: 'thought',
        pillarName: 'Thought',
        glyph: '✧',
        color: '#6366f1',
        category: 'Narrative Lore',
        title: 'The Shattered Keystone Quest',
        summary: 'Narrative arc where players explore modular realm tiles to reforge the 10 primordial seals before the entropic collapse.',
        status: 'Approved',
        champsMetric: 'Production'
    },
    {
        pillarId: 'logic',
        pillarName: 'Logic',
        glyph: '∴',
        color: '#06b6d4',
        category: 'Core Mechanics',
        title: 'Hex Sequencer & 3 AP System',
        summary: 'Deterministic turn queue: exactly 3 Action Points per turn. Movement on hex grid with no-zero little-endian roll tables.',
        status: 'Approved',
        champsMetric: 'Accuracy'
    },
    {
        pillarId: 'unity',
        pillarName: 'Unity',
        glyph: '⚭',
        color: '#10b981',
        category: 'Multiplayer Synergy',
        title: 'Resonance Chain Combos',
        summary: 'Adjacent players can merge card effects to unleash collaborative spells that neither could cast alone.',
        status: 'Proposed',
        champsMetric: 'Hospitality'
    },
    {
        pillarId: 'existence',
        pillarName: 'Existence',
        glyph: '⬡',
        color: '#d97706',
        category: '3D Tangibles',
        title: 'Oak Table & Tactile Hex Tiles',
        summary: 'Physical 3D wooden soundstage table, wooden token figurines, velvet dice cup, and textured parchment board.',
        status: 'Testing',
        champsMetric: 'Production'
    },
    {
        pillarId: 'improvement',
        pillarName: 'Improvement',
        glyph: '⇈',
        color: '#f97316',
        category: 'Game Loop Balance',
        title: '25-Minute Session Limit',
        summary: 'CHAMPS optimization: zero player downtime, automated turn reminders, and dynamic scaling for 1-4 players.',
        status: 'Proposed',
        champsMetric: 'Speed'
    },
    {
        pillarId: 'mastery',
        pillarName: 'Mastery',
        glyph: '❂',
        color: '#ef4444',
        category: 'Win Conditions',
        title: 'Keystone Ascension or Trivector Victory',
        summary: 'High skill-ceiling victory condition: either synthesize the Grand Monas or defeat the 3 Trial Keepers.',
        status: 'Approved',
        champsMetric: 'Accuracy'
    },
    {
        pillarId: 'resonance',
        pillarName: 'Resonance',
        glyph: '∿',
        color: '#ec4899',
        category: 'Aesthetic / Audio',
        title: 'Cel-Shaded Diegetic Audio',
        summary: 'Parchment visual shaders, real wooden dice rolling acoustics, and an ambient medieval lute soundtrack.',
        status: 'Testing',
        champsMetric: 'Production'
    },
    {
        pillarId: 'transcendence',
        pillarName: 'Transcendence',
        glyph: '⍟',
        color: '#a855f7',
        category: 'Cartridge Export',
        title: 'ROM Cartridge Compiler',
        summary: 'Export board layout and card state directly into a playable 16-bit JRPG cartridge playable in the MyOS emulator.',
        status: 'Proposed',
        champsMetric: 'Cleanliness'
    },
    {
        pillarId: 'omni',
        pillarName: 'Omni',
        glyph: '۞',
        color: '#38bdf8',
        category: 'Autopoietic Meta',
        title: 'Dynamic Encounter Cortex',
        summary: 'MyOS Cortex monitors player win rates and dynamically tailors encounter decks to maintain flow-state challenge.',
        status: 'Approved',
        champsMetric: 'Maintenance'
    }
];

const INITIAL_COUNCIL_MESSAGES: DecaCouncilMessage[] = [
    {
        id: 'msg-init-1',
        agentId: 'cortex',
        senderName: 'MyOS Cortex',
        senderGlyph: '🧠',
        senderColor: '#38bdf8',
        roleBadge: 'MODERATOR',
        text: 'Deca-Council Agora Session initiated under Elevated Sovereign Admin Zak. Cadence governed at 30-60s intervals for optimal symbiorithmic review.',
        timestamp: Date.now() - 25000,
        actionTag: 'AGORA_INITIALIZED'
    },
    {
        id: 'msg-init-2',
        agentId: 'self',
        senderName: 'Self',
        senderGlyph: '◉',
        senderColor: '#eab308',
        roleBadge: 'CORE OBSERVER',
        text: 'The 10 anchors are gathered in a 6.5m perimeter around Zak. Each agent speaks with autonomous domain authority.',
        timestamp: Date.now() - 18000
    },
    {
        id: 'msg-init-3',
        agentId: 'thought',
        senderName: 'Thought',
        senderGlyph: '✧',
        senderColor: '#6366f1',
        roleBadge: 'ARCHITECT',
        text: 'I have logged our long-term directive: construct a 3D tabletop board game in this sandbox, extractable into a video game cartridge.',
        timestamp: Date.now() - 12000,
        actionTag: 'DIRECTIVE_PINNED'
    },
    {
        id: 'msg-init-4',
        agentId: 'logic',
        senderName: 'Logic',
        senderGlyph: '∴',
        senderColor: '#06b6d4',
        roleBadge: 'KERNEL',
        text: 'Rules formulated: Hex terrain with finite 3 AP per turn. Ready to spawn initial physical table and dice on Zak\'s command.',
        timestamp: Date.now() - 5000,
        replyTo: {
            id: 'msg-init-3',
            senderName: 'Thought',
            senderGlyph: '✧',
            senderColor: '#6366f1',
            textSnippet: 'construct a 3D tabletop board game in this sandbox...'
        }
    }
];

interface DecaCouncilChatHudProps {
    onClose: () => void;
    onManifestTable?: () => void;
    onManifestProp?: (propType: 'table' | 'hex_board' | 'dice' | 'cards' | 'token') => void;
    onClearTableProps?: () => void;
    currentDimension?: string;
    onExitToDesktop?: () => void;
}

export const DecaCouncilChatHud: React.FC<DecaCouncilChatHudProps> = ({
    onClose,
    onManifestTable,
    onManifestProp,
    onClearTableProps,
    currentDimension = 'desktop',
    onExitToDesktop
}) => {
    const { thinkLocally, agentMessages } = useCouncil();
    const [activeTab, setActiveTab] = useState<'chat' | 'billboard'>('chat');
    const [messages, setMessages] = useState<DecaCouncilMessage[]>(INITIAL_COUNCIL_MESSAGES);
    const [proposals, setProposals] = useState<PillarProposal[]>(DEFAULT_PROPOSALS);
    const [inputValue, setInputValue] = useState('');
    const [isPondering, setIsPondering] = useState(false);
    const [activeSpeaker, setActiveSpeaker] = useState<AgentId | 'cortex' | null>(null);
    const [filterAgent, setFilterAgent] = useState<AgentId | 'cortex' | 'all'>('all');
    
    // Delimited Autonomous Cadence (30s, 45s, 60s)
    const [cadenceSeconds, setCadenceSeconds] = useState<number>(30);
    const [secondsUntilNextTurn, setSecondsUntilNextTurn] = useState<number>(30);
    const [isAutonomousDebateActive, setIsAutonomousDebateActive] = useState(true);

    // Quoting / Reply Threading State
    const [replyTarget, setReplyTarget] = useState<QuotedMessageRef | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const messageElementsRef = useRef<Record<string, HTMLDivElement | null>>({});

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current && activeTab === 'chat') {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isPondering, activeTab]);

    // External 3D Pillar Click Listener: Select or start quoting that pillar
    useEffect(() => {
        const handlePillarSelected = (e: any) => {
            const pillarId = e.detail as AgentId;
            if (pillarId && PILLAR_ORDER.includes(pillarId)) {
                setFilterAgent(pillarId);
                const lastMsg = [...messages].reverse().find(m => m.agentId === pillarId);
                if (lastMsg) {
                    setReplyTarget({
                        id: lastMsg.id,
                        senderName: lastMsg.senderName,
                        senderGlyph: lastMsg.senderGlyph,
                        senderColor: lastMsg.senderColor,
                        textSnippet: lastMsg.text.slice(0, 60) + (lastMsg.text.length > 60 ? '...' : '')
                    });
                }
            }
        };

        window.addEventListener('myos:select-pillar', handlePillarSelected);
        return () => window.removeEventListener('myos:select-pillar', handlePillarSelected);
    }, [messages]);

    // Delimited Autonomous Debate Clock
    useEffect(() => {
        if (!isAutonomousDebateActive) return;

        const timer = setInterval(() => {
            setSecondsUntilNextTurn(prev => {
                if (prev <= 1) {
                    // Trigger next turn
                    triggerAutonomousTurn();
                    return cadenceSeconds;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isAutonomousDebateActive, cadenceSeconds, isPondering]);

    // Trigger next autonomous debate voice
    const triggerAutonomousTurn = async () => {
        if (isPondering) return;

        // 1 in 4 chance for MyOS Cortex moderator interjection, else next pillar in rotation
        const isCortexTurn = Math.random() < 0.25;

        if (isCortexTurn) {
            setActiveSpeaker('cortex');
            setIsPondering(true);
            setTimeout(() => {
                const moderatorSummaries = [
                    "Cortex Moderator Check: Logic and Thought are in geometric alignment on the hex grid. Existence is manifesting 3D table assets. CHAMPS accuracy evaluated at 98%.",
                    "Cortex Synthesis: The board game prototype is adhering strictly to Zak's vision. Reminder to all pillars: ensure finite turn loops to prevent player fatigue.",
                    "Cortex Autopoiesis: Self and Unity have established symbiotic role pairing. The local GPU kernel is ready to compile preliminary token shaders."
                ];
                const text = moderatorSummaries[Math.floor(Math.random() * moderatorSummaries.length)];
                setMessages(prev => [
                    ...prev,
                    {
                        id: `cortex-${Date.now()}`,
                        agentId: 'cortex',
                        senderName: 'MyOS Cortex',
                        senderGlyph: '🧠',
                        senderColor: '#38bdf8',
                        roleBadge: 'MODERATOR',
                        text,
                        timestamp: Date.now(),
                        actionTag: 'CHAMPS_AUDIT'
                    }
                ]);
                setIsPondering(false);
                setActiveSpeaker(null);
            }, 1800);
            return;
        }

        // Pick next pillar speaker
        const availablePillars = PILLAR_ORDER;
        const chosenPillar = availablePillars[Math.floor(Math.random() * availablePillars.length)];
        setActiveSpeaker(chosenPillar);
        setIsPondering(true);

        const recentChatSummary = messages.slice(-3).map(m => `${m.senderName}: "${m.text}"`).join(' | ');
        const prompt = `Autonomous Council Turn for ${chosenPillar.toUpperCase()}:
Respond in character concisely (1-2 sentences) advancing our 3D tabletop board game prototype.
Recent debate context: ${recentChatSummary}
Keep friendly friction, test assumptions, and maintain alignment with human admin Zak.`;

        try {
            await thinkLocally(chosenPillar, prompt, "AGORA BOARD GAME COLLABORATION");
        } catch (e) {
            console.warn("Autonomous debate turn error:", e);
        } finally {
            setIsPondering(false);
            setActiveSpeaker(null);
        }
    };

    // Listen to 3D agentMessages speech updates and sync to chat feed
    useEffect(() => {
        if (!agentMessages) return;
        Object.entries(agentMessages).forEach(([id, msg]) => {
            if (msg?.text && PILLAR_ORDER.includes(id as AgentId)) {
                const agent = COUNCIL_AGENTS[id as AgentId];
                if (!agent) return;

                setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.agentId === id && Math.abs(last.timestamp - msg.timestamp) < 2000) {
                        return [
                            ...prev.slice(0, -1),
                            { ...last, text: msg.text }
                        ];
                    }
                    if (prev.some(m => m.timestamp === msg.timestamp)) return prev;

                    return [
                        ...prev,
                        {
                            id: `live-${id}-${msg.timestamp}`,
                            agentId: id as AgentId,
                            senderName: agent.name,
                            senderGlyph: PILLAR_GLYPHS[id] || '✧',
                            senderColor: PILLAR_HEX_COLORS[id] || '#ffffff',
                            roleBadge: agent.title?.toUpperCase() || 'GUARDIAN',
                            text: msg.text,
                            timestamp: msg.timestamp,
                            replyTo: replyTarget || undefined
                        }
                    ];
                });
            }
        });
    }, [agentMessages]);

    // Semantic Pillar Selection for User Submission
    const selectResonantPillar = (prompt: string): AgentId => {
        const p = prompt.toLowerCase();
        if (p.includes('rule') || p.includes('logic') || p.includes('math') || p.includes('turn') || p.includes('ap')) return 'logic';
        if (p.includes('lore') || p.includes('idea') || p.includes('quest') || p.includes('story') || p.includes('concept')) return 'thought';
        if (p.includes('table') || p.includes('dice') || p.includes('board') || p.includes('asset') || p.includes('3d') || p.includes('prop')) return 'existence';
        if (p.includes('speed') || p.includes('fast') || p.includes('optimize') || p.includes('champs') || p.includes('balance')) return 'improvement';
        if (p.includes('music') || p.includes('sound') || p.includes('art') || p.includes('vibe') || p.includes('shader')) return 'resonance';
        if (p.includes('coop') || p.includes('multiplayer') || p.includes('team') || p.includes('combo')) return 'unity';
        if (p.includes('win') || p.includes('victory') || p.includes('boss') || p.includes('skill')) return 'mastery';
        if (p.includes('cartridge') || p.includes('rom') || p.includes('export') || p.includes('jrpg')) return 'transcendence';
        if (p.includes('meta') || p.includes('cortex') || p.includes('deck') || p.includes('all')) return 'omni';
        return 'self';
    };

    // User Submits Prompt
    const handleSend = async () => {
        if (!inputValue.trim() || isPondering) return;
        const text = inputValue.trim();
        setInputValue('');

        const userMsg: DecaCouncilMessage = {
            id: `user-${Date.now()}`,
            agentId: 'user',
            senderName: 'Zak',
            senderGlyph: '👑',
            senderColor: '#ffffff',
            roleBadge: 'ELEVATED ROOT ADMIN',
            text,
            timestamp: Date.now(),
            replyTo: replyTarget || undefined
        };

        // Reset reply target once used
        setReplyTarget(null);

        setMessages(prev => [...prev, userMsg]);
        setIsPondering(true);

        const primaryAgentId = selectResonantPillar(text);
        setActiveSpeaker(primaryAgentId);

        try {
            const playerPos = usePersistentWorldStore.getState().playerPos || [0, 0, 0];
            const recentContext = messages.slice(-4).map(m => `${m.senderName}: "${m.text}"`).join('\n');
            const context = `DECA-COUNCIL AGORA TABLETOP WORKSHOP:
- Elevated Sovereign Admin: Zak at center coordinates [${playerPos[0].toFixed(1)}, ${playerPos[1].toFixed(1)}, ${playerPos[2].toFixed(1)}].
- Active Objective: Co-engineering a physical 3D Tabletop Board Game in this Agora sandbox to compile into a video game cartridge.
- Recent Council Debate:
${recentContext}
- You are representing the ${primaryAgentId.toUpperCase()} Pillar. Respond directly and concisely (1-3 sentences), proposing a concrete mechanic or tangible action.`;

            await thinkLocally(primaryAgentId, text, context);
        } catch (e) {
            console.warn("Council thinkLocally failed:", e);
        } finally {
            setIsPondering(false);
            setActiveSpeaker(null);
            setSecondsUntilNextTurn(cadenceSeconds);
        }
    };

    const filteredMessages = useMemo(() => {
        if (filterAgent === 'all') return messages;
        return messages.filter(m => m.agentId === filterAgent || m.agentId === 'user');
    }, [messages, filterAgent]);

    const scrollToMessage = (id: string) => {
        const element = messageElementsRef.current[id];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-cyan-400', 'bg-cyan-950/40');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-cyan-400', 'bg-cyan-950/40');
            }, 1800);
        }
    };

    const handleCameraPreset = (preset: 'player' | 'table' | 'council') => {
        window.dispatchEvent(new CustomEvent('myos:camera-preset', { detail: preset }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-14 right-4 bottom-24 w-[460px] max-w-[94vw] bg-slate-950/94 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col z-[10002] overflow-hidden text-white font-sans select-none"
        >
            {/* Header Toolbar */}
            <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-cyan-950/50 to-slate-900 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
                                DECA-COUNCIL AGORA
                            </span>
                            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-[9px] font-mono text-cyan-200 border border-cyan-400/30">
                                11 MINDS
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono tracking-tight flex items-center gap-1.5">
                            <span>Sovereign Sandbox</span>
                            <span>•</span>
                            <span className="text-amber-300 font-bold">Root Admin: Zak</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    {onExitToDesktop && (
                        <button
                            onClick={onExitToDesktop}
                            className="px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/70 border border-red-500/40 text-[10px] font-mono text-red-300 hover:text-white flex items-center gap-1 transition-all"
                            title="Exit sandbox to pristine desktop"
                        >
                            <span>🚪</span>
                            <span>DESKTOP</span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/20 hover:border-red-400 border border-slate-700 text-slate-400 hover:text-red-300 transition-all"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>

            {/* View Mode Switcher: Live Stream vs Town Square Billboard */}
            <div className="px-4 py-1.5 bg-slate-900/80 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'chat'
                                ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-sm'
                                : 'text-slate-400 hover:text-white border border-transparent'
                        }`}
                    >
                        <span>💬</span> LIVE FEED
                    </button>
                    <button
                        onClick={() => setActiveTab('billboard')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                            activeTab === 'billboard'
                                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-sm'
                                : 'text-slate-400 hover:text-white border border-transparent'
                        }`}
                    >
                        <span>🏛️</span> TOWN SQUARE BOARD
                    </button>
                </div>

                {/* Delimited Cadence Controller */}
                <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-white/10 text-[10px] font-mono">
                    <Clock size={11} className="text-cyan-400" />
                    <span className="text-slate-400">Pacing:</span>
                    <select
                        value={cadenceSeconds}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setCadenceSeconds(val);
                            setSecondsUntilNextTurn(val);
                        }}
                        className="bg-transparent text-cyan-300 outline-none font-bold cursor-pointer"
                    >
                        <option value={30} className="bg-slate-900">30s</option>
                        <option value={45} className="bg-slate-900">45s</option>
                        <option value={60} className="bg-slate-900">60s</option>
                    </select>

                    <button
                        onClick={() => setIsAutonomousDebateActive(prev => !prev)}
                        title={isAutonomousDebateActive ? "Pause autonomous turns" : "Resume autonomous turns"}
                        className="p-1 hover:text-cyan-300 transition-colors"
                    >
                        {isAutonomousDebateActive ? <Pause size={11} /> : <Play size={11} className="fill-cyan-300" />}
                    </button>

                    <button
                        onClick={triggerAutonomousTurn}
                        disabled={isPondering}
                        title="Step now: Trigger next turn immediately"
                        className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 text-[9px] font-bold border border-cyan-400/30 transition-all"
                    >
                        STEP
                    </button>
                </div>
            </div>

            {/* Pacing Progress Bar */}
            {isAutonomousDebateActive && (
                <div className="h-1 w-full bg-slate-900/60 overflow-hidden shrink-0">
                    <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                        style={{
                            width: `${((cadenceSeconds - secondsUntilNextTurn) / cadenceSeconds) * 100}%`
                        }}
                        transition={{ ease: "linear", duration: 1 }}
                    />
                </div>
            )}

            {/* Presence Strip */}
            <div className="px-3 py-2 bg-slate-900/40 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <button
                    onClick={() => setFilterAgent('all')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        filterAgent === 'all'
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                    }`}
                >
                    <Users size={11} /> ALL (11)
                </button>

                {/* Zak (Elevated Admin) */}
                <button
                    onClick={() => setFilterAgent(filterAgent === 'user' ? 'all' : 'user')}
                    title="Zak (Elevated Root Admin)"
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        filterAgent === 'user'
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/60'
                            : 'bg-white/5 text-slate-300 hover:text-white'
                    }`}
                >
                    <span>👑</span> ZAK
                </button>

                {/* MyOS Cortex (Moderator) */}
                <button
                    onClick={() => setFilterAgent(filterAgent === 'cortex' ? 'all' : 'cortex')}
                    title="MyOS Cortex (System Moderator & Steward)"
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                        filterAgent === 'cortex'
                            ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/60'
                            : 'bg-white/5 text-slate-300 hover:text-white'
                    }`}
                >
                    <span>🧠</span> CORTEX
                </button>

                {/* 10 Pillars */}
                {PILLAR_ORDER.map(id => {
                    const glyph = PILLAR_GLYPHS[id];
                    const color = PILLAR_HEX_COLORS[id];
                    const isSelected = filterAgent === id;
                    const isSpeaking = activeSpeaker === id;

                    return (
                        <button
                            key={id}
                            onClick={() => setFilterAgent(isSelected ? 'all' : id)}
                            title={`${COUNCIL_AGENTS[id]?.name}: ${COUNCIL_AGENTS[id]?.title}`}
                            style={{ borderColor: isSelected ? color : 'transparent' }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1 border ${
                                isSelected ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.15)]' : 'bg-white/5 text-slate-400 hover:text-white'
                            } ${isSpeaking ? 'animate-pulse ring-1 ring-cyan-400' : ''}`}
                        >
                            <span style={{ color }}>{glyph}</span>
                            <span style={{ color: isSelected ? color : undefined }}>
                                {id.toUpperCase()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Camera Perspective Presets */}
            <div className="px-3 py-1 bg-slate-950/70 border-b border-white/5 flex items-center justify-between text-[9px] font-mono shrink-0">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Camera size={11} className="text-cyan-400" />
                    <span className="text-slate-400">CAMERA:</span>
                    <button
                        onClick={() => handleCameraPreset('player')}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                    >
                        👤 Player
                    </button>
                    <button
                        onClick={() => handleCameraPreset('table')}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 hover:border-cyan-400/40 border border-transparent text-cyan-300 transition-all"
                    >
                        🎲 Tabletop
                    </button>
                    <button
                        onClick={() => handleCameraPreset('council')}
                        className="px-2 py-0.5 rounded bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-400/40 border border-transparent text-indigo-300 transition-all"
                    >
                        🏛️ 10-Circle
                    </button>
                </div>
                <div className="text-[8px] text-emerald-400/80 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CHAMPS OK</span>
                </div>
            </div>

            {/* TAB CONTENT: LIVE FEED */}
            {activeTab === 'chat' && (
                <>
                    {/* Directive Objective Banner */}
                    <div className="px-4 py-2 bg-indigo-950/30 border-b border-indigo-500/20 flex items-center justify-between text-[11px] font-mono shrink-0">
                        <div className="flex items-center gap-2 text-indigo-300 truncate">
                            <Dices size={13} className="text-indigo-400 shrink-0" />
                            <span className="truncate">DIRECTIVE: 3D Tabletop Game Prototype</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {onManifestTable && (
                                <button
                                    onClick={onManifestTable}
                                    className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[9px] font-bold tracking-wider shrink-0 transition-all"
                                >
                                    + TABLE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 px-4 py-3 overflow-y-auto space-y-3 font-sans select-text"
                    >
                        {filteredMessages.map(msg => {
                            const isUser = msg.agentId === 'user';
                            const isCortex = msg.agentId === 'cortex';

                            return (
                                <motion.div
                                    key={msg.id}
                                    ref={el => { messageElementsRef.current[msg.id] = el; }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex flex-col gap-1 transition-colors rounded-xl p-1 ${isUser ? 'items-end' : 'items-start'}`}
                                >
                                    {/* Sender Meta Header */}
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                                        <span style={{ color: msg.senderColor }} className="font-bold flex items-center gap-1">
                                            <span>{msg.senderGlyph}</span>
                                            <span>{msg.senderName}</span>
                                        </span>
                                        {msg.roleBadge && (
                                            <span className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold border ${
                                                isUser ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' :
                                                isCortex ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30' :
                                                'bg-slate-800 text-slate-300 border-slate-700'
                                            }`}>
                                                {msg.roleBadge}
                                            </span>
                                        )}
                                        <span>•</span>
                                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                        
                                        {/* Reply / Quote Trigger */}
                                        <button
                                            onClick={() => {
                                                setReplyTarget({
                                                    id: msg.id,
                                                    senderName: msg.senderName,
                                                    senderGlyph: msg.senderGlyph,
                                                    senderColor: msg.senderColor,
                                                    textSnippet: msg.text.slice(0, 60) + (msg.text.length > 60 ? '...' : '')
                                                });
                                            }}
                                            title="Quote and reply to this message"
                                            className="opacity-60 hover:opacity-100 hover:text-cyan-300 p-0.5 transition-opacity ml-1 flex items-center gap-0.5 text-[9px]"
                                        >
                                            <Quote size={10} />
                                            <span>REPLY</span>
                                        </button>
                                    </div>

                                    {/* Quoted Message Callout (If Replying) */}
                                    {msg.replyTo && (
                                        <div
                                            onClick={() => scrollToMessage(msg.replyTo!.id)}
                                            style={{ borderLeftColor: msg.replyTo.senderColor }}
                                            className="px-2.5 py-1 text-[10px] font-mono bg-white/5 hover:bg-white/10 rounded-r-lg border-l-2 text-slate-300 cursor-pointer max-w-[90%] transition-colors mb-0.5"
                                        >
                                            <span style={{ color: msg.replyTo.senderColor }} className="font-bold mr-1">
                                                ↳ {msg.replyTo.senderGlyph} @{msg.replyTo.senderName}:
                                            </span>
                                            <span className="italic text-slate-400 line-clamp-1">
                                                "{msg.replyTo.textSnippet}"
                                            </span>
                                        </div>
                                    )}

                                    {/* Message Body */}
                                    <div
                                        style={{
                                            borderColor: isUser ? '#38bdf866' : isCortex ? '#38bdf888' : `${msg.senderColor}44`,
                                            background: isUser ? 'rgba(14, 165, 233, 0.14)' : isCortex ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.8)'
                                        }}
                                        className={`px-3.5 py-2.5 rounded-2xl border text-xs leading-relaxed max-w-[94%] shadow-sm ${
                                            isUser ? 'rounded-tr-sm text-cyan-50' : 'rounded-tl-sm text-slate-200'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {isPondering && activeSpeaker && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 text-xs font-mono text-cyan-400/80 italic py-1"
                            >
                                <RefreshCw size={12} className="animate-spin text-cyan-400" />
                                <span>{activeSpeaker === 'cortex' ? 'MyOS Cortex' : COUNCIL_AGENTS[activeSpeaker]?.name || activeSpeaker} is synthesizing...</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Active Reply Banner */}
                    {replyTarget && (
                        <div className="px-4 py-1.5 bg-slate-900 border-t border-cyan-500/20 flex items-center justify-between text-[11px] font-mono shrink-0">
                            <div className="flex items-center gap-1.5 text-slate-300 truncate">
                                <span className="text-cyan-400">↳ Replying to</span>
                                <span style={{ color: replyTarget.senderColor }} className="font-bold">
                                    {replyTarget.senderGlyph} @{replyTarget.senderName}:
                                </span>
                                <span className="italic text-slate-400 truncate">"{replyTarget.textSnippet}"</span>
                            </div>
                            <button
                                onClick={() => setReplyTarget(null)}
                                className="text-slate-400 hover:text-red-400 p-0.5 ml-2 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="p-3 bg-slate-900/90 border-t border-cyan-500/20 shrink-0">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex items-center gap-2 bg-slate-950 border border-cyan-500/30 rounded-2xl px-3 py-1.5 focus-within:border-cyan-400 transition-all shadow-inner"
                        >
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={replyTarget ? `Reply to ${replyTarget.senderName}...` : "Direct the 10 Pillars (e.g. 'How should dice rolling work?')..."}
                                className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 font-sans"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isPondering}
                                className="p-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 transition-all shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                            >
                                <Send size={13} />
                            </button>
                        </form>
                    </div>
                </>
            )}

            {/* TAB CONTENT: TOWN SQUARE BILLBOARD */}
            {activeTab === 'billboard' && (
                <div className="flex-1 px-4 py-3 overflow-y-auto space-y-4 font-sans select-text">
                    {/* Core Shared Goal Billboard */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-md">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 uppercase flex items-center gap-1">
                                <Award size={12} /> SOVEREIGN DIRECTIVE (SHARED CONTEXT)
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200 text-[9px] font-mono">
                                ACTIVE
                            </span>
                        </div>
                        <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                            "Design and prototype a 3D tabletop board game in the Agora sandbox, governed autopoietically with human-in-the-loop validation, to be extracted into a standalone video game cartridge."
                        </p>
                    </div>

                    {/* CHAMPS Scorecard Widget */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                            <span className="font-bold flex items-center gap-1">
                                <ShieldCheck size={12} className="text-cyan-400" /> CHAMPS GOVERNANCE SCORECARD
                            </span>
                            <span className="text-cyan-300 font-bold">98% OPTIMAL</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Cleanliness</span>
                                <span className="text-emerald-400 font-bold">100% (Isolated)</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Hospitality</span>
                                <span className="text-amber-400 font-bold">100% (Symbiotic)</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Accuracy</span>
                                <span className="text-cyan-400 font-bold">98% (Finite Math)</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Maintenance</span>
                                <span className="text-purple-400 font-bold">96% (Persistent)</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Production</span>
                                <span className="text-orange-400 font-bold">95% (3D Props)</span>
                            </div>
                            <div className="bg-slate-950/60 p-2 rounded-xl border border-white/5">
                                <span className="text-slate-400 block text-[9px]">Speed</span>
                                <span className="text-pink-400 font-bold">{cadenceSeconds}s (Delimited)</span>
                            </div>
                        </div>
                    </div>

                    {/* 3D Physical Tabletop Manifestation Forge */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                            <span className="font-bold flex items-center gap-1">
                                <Box size={12} className="text-amber-400" /> TANGIBLE 3D PROTOTYPE FORGE
                            </span>
                            <div className="flex items-center gap-1.5">
                                {onClearTableProps && (
                                    <button
                                        onClick={onClearTableProps}
                                        className="px-1.5 py-0.5 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[8px] font-bold transition-all"
                                        title="Clear all tabletop prototype objects"
                                    >
                                        🧹 RESET TABLE
                                    </button>
                                )}
                                <span className="text-amber-300 text-[9px]">SPAWN TO SOUNDSTAGE</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <button
                                onClick={() => (onManifestProp ? onManifestProp('table') : onManifestTable?.())}
                                className="p-2 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/30 text-amber-200 text-left transition-all"
                            >
                                <span className="font-bold block">🪵 OAK TABLE</span>
                                <span className="text-[9px] text-slate-400">Center staging surface</span>
                            </button>
                            <button
                                onClick={() => (onManifestProp ? onManifestProp('hex_board') : onManifestTable?.())}
                                className="p-2 rounded-xl bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-500/30 text-cyan-200 text-left transition-all"
                            >
                                <span className="font-bold block">🗺️ HEX BOARD</span>
                                <span className="text-[9px] text-slate-400">Modular terrain map</span>
                            </button>
                            <button
                                onClick={() => (onManifestProp ? onManifestProp('dice') : onManifestTable?.())}
                                className="p-2 rounded-xl bg-indigo-950/30 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-200 text-left transition-all"
                            >
                                <span className="font-bold block">🎲 D20 DICE SET</span>
                                <span className="text-[9px] text-slate-400">Deterministic seeds</span>
                            </button>
                            <button
                                onClick={() => (onManifestProp ? onManifestProp('tokens') : onManifestTable?.())}
                                className="p-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-200 text-left transition-all"
                            >
                                <span className="font-bold block">♟️ TOKEN STANDS</span>
                                <span className="text-[9px] text-slate-400">10 Keystone figurines</span>
                            </button>
                        </div>
                    </div>

                    {/* Pinned Pillar Proposals */}
                    <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase block">
                            PINNED PILLAR PROPOSALS (10 KELESTONES)
                        </span>

                        <div className="space-y-2">
                            {proposals.map(prop => (
                                <div
                                    key={prop.pillarId}
                                    style={{ borderLeftColor: prop.color }}
                                    className="p-3 bg-slate-900/70 hover:bg-slate-900 border border-white/5 border-l-4 rounded-xl text-xs space-y-1 transition-colors"
                                >
                                    <div className="flex items-center justify-between text-[10px] font-mono">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <span style={{ color: prop.color }}>{prop.glyph} {prop.pillarName}</span>
                                            <span className="text-slate-500">•</span>
                                            <span className="text-slate-400">{prop.category}</span>
                                        </div>
                                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                                            prop.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' :
                                            prop.status === 'Testing' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' :
                                            'bg-slate-800 text-slate-400 border border-slate-700'
                                        }`}>
                                            {prop.status}
                                        </span>
                                    </div>

                                    <h4 className="font-bold text-white text-xs">{prop.title}</h4>
                                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{prop.summary}</p>

                                    <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-slate-400">
                                        <span>CHAMPS Focus: <strong className="text-cyan-300">{prop.champsMetric}</strong></span>
                                        <button
                                            onClick={() => {
                                                setActiveTab('chat');
                                                setReplyTarget({
                                                    id: `prop-${prop.pillarId}`,
                                                    senderName: prop.pillarName,
                                                    senderGlyph: prop.glyph,
                                                    senderColor: prop.color,
                                                    textSnippet: `${prop.title}: ${prop.summary.slice(0, 50)}...`
                                                });
                                            }}
                                            className="hover:text-cyan-300 transition-colors"
                                        >
                                            DISCUSS IN CHAT ↳
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
