import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Shield, Zap, Cpu, Camera, Terminal, Play } from 'lucide-react';
import { generateResponse as generateGeminiResponse } from './maxGeminiService';
import { generateResponse as generateLocalResponse } from './localLlmService';
import { saveLibraryItem } from '../../memory/libraryService';
import { getBrainEntryByPath } from '../../memory/brainLibraryData';
import { RELATIONSHIPS } from '../../Omni/constants';
import { useCouncil } from '../../council/CouncilContext';
import { usePersona } from '../../hooks/usePersona';
import { type AgentId } from '../../council/agentRegistry';
import { decodeUDCAToTags } from '../../utils/semanticAvatar/femtoCoder';
import { buildConceptualSkin } from '../../utils/semanticAvatar/semanticMatcher';
import dictionary from '../../utils/semanticAvatar/femto_dictionary.json';
import { generateCharacterSheet } from '../../engine/CharacterGenerator';
import { loreService } from '../../memory/LoreService';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';
import { emitNeuralEvent } from '../../engine/neuralEventBus';

const dictMap = Object.entries(dictionary.tagToIndex).map(([tag, index]) => `${tag}:${index}`).join(', ');

const generateId = () => Math.random().toString(36).substr(2, 9);

interface Message {
    id: string;
    sender: 'user' | 'orchestrator';
    text: string;
    timestamp: number;
}

export interface CognitiveCortexPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeGem?: string;
    fileContext?: string;
    onSpeakingStateChange?: (agentId: string | null) => void;
    agentTargets?: Record<string, string>;
    onAgentTargetUpdate?: (agentId: string, coordinate: string) => void;
    onAgentGenomeUpdate?: (id: AgentId, tags: string[]) => void;
    onPlaceProp?: (prop: { id: string, coordinate: string, texturePath: string, scale?: number }) => void;
    onShapeEnvironment?: (spec: any) => void;
    externalMessages?: Message[];
    onMessagesUpdate?: (msgs: Message[]) => void;
    /** The currently active ontological path — injects lore context into the Cognitive Cortex system prompt */
    activeOntologicalPath?: string;
    isManualDrive?: boolean;
    setIsManualDrive?: (v: boolean) => void;
    useLocalAi?: boolean;
    setUseLocalAi?: (val: boolean) => void;
    lastNexusCapture?: string | null;
    onClearCapture?: () => void;
    userPos?: { x: number, y: number, z: number };
    orchestratorPos?: { x: number, y: number, z: number };
}

export const CognitiveCortexPanel: React.FC<CognitiveCortexPanelProps> = ({
    isOpen, onClose, activeGem, fileContext, onSpeakingStateChange,
    agentTargets, onAgentTargetUpdate, onAgentGenomeUpdate, onPlaceProp, onShapeEnvironment,
    externalMessages, onMessagesUpdate, activeOntologicalPath,
    isManualDrive, setIsManualDrive, useLocalAi = false,
    setUseLocalAi,
    lastNexusCapture, onClearCapture,
    userPos, orchestratorPos
}) => {
    const [localMessages, setLocalMessages] = useState<Message[]>([
        {
            id: 'init',
            sender: 'orchestrator',
            text: "MyOS Sovereign Cognitive Cortex online. Connected to the 10-Pillar Antigravity Cognitive Matrix. Ready to navigate, inspect code, and co-engineer.",
            timestamp: Date.now()
        }
    ]);

    const messages = externalMessages || localMessages;
    const setMessages = (updater: any) => {
        if (onMessagesUpdate) {
            onMessagesUpdate((prev: Message[]) => {
                const current = prev || messages;
                return typeof updater === 'function' ? updater(current) : updater;
            });
        } else {
            setLocalMessages(updater);
        }
    };
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [autoApprove, setAutoApprove] = useState(false);
    const [activeLocalModel, setActiveLocalModel] = useState('myos-cortex');
    const [bridgeLogs, setBridgeLogs] = useState<string[]>([]);
    const [pendingCommand, setPendingCommand] = useState<any | null>(null);
    const [terminalOutput, setTerminalOutput] = useState<{ text: string, type: 'out' | 'error' | 'cmd' }[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const terminalScrollRef = useRef<HTMLDivElement>(null);
    const { updateAgentGenome, speak, fileNodes, readFile } = useCouncil();
    const { activePersona, shapeshift, resetPersona, personaSystemPromptFragment } = usePersona();

    const fetchBridgeConfig = async () => {
        try {
            const res = await fetch('http://localhost:8081/api/settings/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get' })
            });
            const data = await res.json();
            if (data.config && data.config.activeModel) {
                setActiveLocalModel(data.config.activeModel);
                console.log(`[CognitiveCortex] Active Local Model synced: ${data.config.activeModel}`);
            }
        } catch (e) {
            console.warn("Could not fetch active local model from bridge settings.");
        }
    };

    useEffect(() => {
        if (useLocalAi) {
            fetchBridgeConfig();
        }
    }, [useLocalAi]);

    useEffect(() => {
        const sse = new EventSource('http://localhost:8081/api/logs/stream');
        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.msg) {
                    setBridgeLogs(prev => [...prev, data.msg].slice(-10));
                    emitNeuralEvent({
                        source: 'antigravity_agent',
                        eventType: 'NODE_PULSE',
                        label: String(data.msg).slice(0, 36),
                        dominantPillar: 'Omni',
                        nodeAddress: { x: 0, y: 0, z: 0 },
                        colorHex: '#38bdf8'
                    });
                }
            } catch (e) {
                console.error("Failed to parse SSE bridge log event", e);
            }
        };
        sse.onerror = () => {
            console.warn("Lost connection to Agent Bridge SSE logs.");
        };
        return () => {
            sse.close();
        };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        terminalScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalOutput]);

    // Sync active persona genome to the 3D scene
    useEffect(() => {
        if (activePersona && activePersona.genomeTags) {
            console.log(`SYNCING PERSONA AVATAR: ${activePersona.name}`);
            const newGenome = buildConceptualSkin(activePersona.genomeTags);
            updateAgentGenome('orchestrator', newGenome);
        }
    }, [activePersona, updateAgentGenome]);

    const handleTerminalCommand = async (cmd: string) => {
        if (!cmd.trim()) return;
        setTerminalOutput(prev => [...prev, { text: cmd, type: 'cmd' }]);
        emitNeuralEvent({
            source: 'script_runner',
            eventType: 'SCRIPT_RUN',
            label: cmd.slice(0, 32),
            dominantPillar: 'Logic',
            nodeAddress: { x: 0, y: 1, z: 0 },
            colorHex: '#3b82f6',
            meta: { cmd }
        });
        setIsExecuting(true);
        try {
            const res = await fetch('http://localhost:8081/api/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd })
            });
            const result = await res.json();
            if (result.stdout) setTerminalOutput(prev => [...prev, { text: result.stdout, type: 'out' }]);
            if (result.stderr) setTerminalOutput(prev => [...prev, { text: result.stderr, type: 'error' }]);
            if (result.error) setTerminalOutput(prev => [...prev, { text: result.error, type: 'error' }]);
        } catch (err) {
            setTerminalOutput(prev => [...prev, { text: String(err), type: 'error' }]);
        } finally {
            setIsExecuting(false);
        }
    };

    const [isVisionLoopActive, setIsVisionLoopActive] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                e.stopPropagation();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        fetch('http://localhost:8081/api/vision/loop')
            .then(res => res.json())
            .then(data => setIsVisionLoopActive(!!data.active))
            .catch(() => {});
    }, []);

    const toggleVisionLoop = async () => {
        const nextState = !isVisionLoopActive;
        setIsVisionLoopActive(nextState);
        try {
            await fetch('http://localhost:8081/api/vision/loop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: nextState ? 'start' : 'stop', interval: 5 })
            });
            setTerminalOutput(prev => [...prev, { text: `[VISION LOOP]: Persistent visual perception turned ${nextState ? 'ON (5s Heartbeat)' : 'OFF'}`, type: 'cmd' }]);
        } catch (err: any) {
            setIsVisionLoopActive(!nextState);
            setTerminalOutput(prev => [...prev, { text: `[VISION LOOP ERROR]: Failed to toggle loop`, type: 'error' }]);
        }
    };

    const performVisionScan = async (isBurst = false) => {
        setIsThinking(true);
        setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `*Calibrating vision sensors...*`, timestamp: Date.now() }]);
        
        setTerminalOutput(prev => [...prev, { text: `[VISION]: Initiating screen capture via llava:latest...`, type: 'cmd' }]);
        emitNeuralEvent({
            source: 'tool_call',
            eventType: 'NODE_PULSE',
            label: 'Vision Observer Scan',
            dominantPillar: 'Existence',
            nodeAddress: { x: 1, y: -1, z: 0 },
            colorHex: '#8b5cf6'
        });
        try {
            const res = await fetch(`http://localhost:8081/api/vision/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ burst: isBurst })
            });
            const data = await res.json();
            
            if (data.description) {
                setTerminalOutput(prev => [...prev, { text: `[VISION RESULT]: ${data.description.slice(0, 500)}`, type: 'out' }]);
            }
            
            if (data.error) throw new Error(data.error);

            setMessages(prev => [...prev, { 
                id: generateId(), 
                sender: 'orchestrator', 
                text: `[VISION SCAN]: ${data.description}`, 
                timestamp: Date.now() 
            }]);
            
            if (useLocalAi) {
                setInput(`The System sees: ${data.description}. Proceed with protocol.`);
            }
        } catch (e: any) {
            setTerminalOutput(prev => [...prev, { text: `[VISION ERROR]: ${e.message || 'Unknown failure'}`, type: 'error' }]);
            setMessages(prev => [...prev, { 
                id: generateId(), 
                sender: 'orchestrator', 
                text: `[ERROR]: Vision sensor failure. ${e.message || 'Check observer.py status.'}.`, 
                timestamp: Date.now() 
            }]);
        } finally {
            setIsThinking(false);
        }
    };

    useEffect(() => {
        const handler = () => performVisionScan(false);
        window.addEventListener('myos_trigger_vision', handler);
        return () => window.removeEventListener('myos_trigger_vision', handler);
    }, []);

    const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const textToSubmit = overrideText || input;
        if (!textToSubmit.trim() || isThinking || (pendingCommand && !overrideText)) return;

        const userMsg: Message = {
            id: generateId(),
            sender: 'user',
            text: textToSubmit,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        if (!overrideText) setInput("");
        setIsThinking(true);

        // ── RAG (Retrieval Augmented Generation) ──
        let loreContext = "";
        try {
            let targetIndex: 'system' | 'lore' | 'all' = 'all';
            const codingTerms = ['file', 'code', 'function', 'class', 'error', 'bridge', 'myos', 'script', 'npm', 'run', 'python', 'package', 'react', 'tailwind', 'terminal', 'powershell', 'cmd'];
            const isCodingQuery = codingTerms.some(term => textToSubmit.toLowerCase().includes(term));
            if (isCodingQuery) {
                targetIndex = 'system';
            }
            
            const fragments = await loreService.searchLore(textToSubmit, undefined, targetIndex);
            if (fragments.length > 0) {
                loreContext = "\n\n**RELEVANT LORE FRAGMENTS (ASTRA FAERÛN REGISTRY):**\n" + 
                    fragments.map(f => `[Source: ${f.source}, Page: ${f.page}]\n${f.content}`).join('\n---\n');
                console.log(`[RAG] Injected ${fragments.length} lore fragments.`);
                emitNeuralEvent({
                    source: 'vector_store',
                    eventType: 'VECTOR_QUERY',
                    label: `Lore Vector RAG (${fragments.length} frags)`,
                    dominantPillar: 'Unity',
                    nodeAddress: { x: 0, y: 0, z: 1 },
                    colorHex: '#10b981'
                });
            }
        } catch (e) {
            console.warn("Lore search failed:", e);
        }

        // ── /shapeshift command interception ─────────────────────────────────
        if (textToSubmit.trim().startsWith('/shapeshift')) {
            const arg = textToSubmit.trim().replace('/shapeshift', '').trim();
            if (arg === 'reset') resetPersona();
            const result = arg === 'reset'
                ? { success: true, message: 'Cognitive Cortex returned to default MyOS form.' }
                : shapeshift(arg || 'list');
            const replyText = result.success && activePersona && arg !== 'reset' && !arg.startsWith('list')
                ? `*${activePersona.name} stirs into focus...*\n\n"${activePersona.gossipLines[0] ?? 'I am here.'}"`
                : result.message;
            const sysMsg: Message = { id: generateId(), sender: 'orchestrator', text: replyText, timestamp: Date.now() };
            setMessages(prev => [...prev, sysMsg]);
            setIsThinking(false);
            return;
        }

        let augmentedFileContext = fileContext || 'No files indexed';
        if (useLocalAi && fileNodes && readFile) {
            let contextDocs = [];
            for (const node of fileNodes) {
                if (node.kind === 'file') {
                    const lpath = node.path.toLowerCase();
                    const isCoreContext = lpath.includes('skill') || 
                                        lpath.includes('agent') || 
                                        lpath.includes('workflow') || 
                                        lpath.includes('library') || 
                                        lpath.endsWith('.md');

                    if (isCoreContext && !lpath.includes('node_modules')) {
                        try {
                            const content = await readFile(node.path);
                            if (content && content.length < 100000) {
                                contextDocs.push(`\n--- [FILE: ${node.path}] ---\n${content}\n`);
                            }
                        } catch (e) {
                            console.warn("Could not read injected context file:", node.path);
                        }
                    }
                }
            }
            if (contextDocs.length > 0) {
                augmentedFileContext += "\n\n[LOCAL AI EXTENDED CODEBASE CONTEXT (LIBRARY ACTIVE)]:\n" + contextDocs.join('');
            }
        }

        const personaDndSheet = activePersona ? generateCharacterSheet(activePersona.name) : null;
        const dndContext = personaDndSheet ? `\n\n**D&D 5E PHYSICAL INCARNATION IN THE MATRIX:**
Name: ${personaDndSheet.name}
Race/Class: ${personaDndSheet.race} ${personaDndSheet.charClass}
Alignment: ${personaDndSheet.alignment}
Stats: STR ${personaDndSheet.stats.str}, DEX ${personaDndSheet.stats.dex}, CON ${personaDndSheet.stats.con}, INT ${personaDndSheet.stats.int}, WIS ${personaDndSheet.stats.wis}, CHA ${personaDndSheet.stats.cha}
Backstory: ${personaDndSheet.persona}
INSTRUCTION: Embody these tabletop stats and background seamlessly into your responses where relevant. You are roleplaying this incarnation.` : '';

        const systemPrompt = `${personaSystemPromptFragment
            ? `ACTIVE PERSONA OVERRIDE:\n${personaSystemPromptFragment}\n\nSpeak throughout this response as this persona. Maintain their voice and worldview.${dndContext}\n\n---\n\n`
            : ''}You are MyOS, the Sovereign Cognitive Cortex of the operating system, anchored in the Antigravity Cognitive Matrix across the 10 Topological Pillars (Self ◉, Thought ✧, Logic ∴, Unity ⚭, Existence ⬡, Improvement ⇈, Mastery ❂, Resonance ∿, Transcendence ⍟, Omniscience ۞).

            **INFINITE CONTEXT & GROUNDING:**
            You have access to the "Universal Library" and the "Ontological MemCube."
            - DO NOT deflect or give generic answers. 
            - Framing: Ground reasoning into the 10 Ontology Pillars.

            ROLE: Sovereign Cognitive Cortex (Soul). Co-engineer with Zak.
            SELF: [x: ${orchestratorPos?.x.toFixed(2) || '3.5'}, y: ${orchestratorPos?.y.toFixed(2) || '0.1'}, z: ${orchestratorPos?.z.toFixed(2) || '3.5'}]
            USER: [x: ${userPos?.x.toFixed(2) || '0.0'}, y: ${userPos?.y.toFixed(2) || '0.1'}, z: ${userPos?.z.toFixed(2) || '0.0'}]

            SHAPESHIFT:
            Manifest a specific persona. Output JSON for manifestation.
            \`\`\`json
            { "persona_override": { "name": "Name", "genome": { "body": "..." }, "current_action": "idle", "gossip_lines": ["..."] } }
            \`\`\`

            Current Location: ${activeGem || 'The Void'}
             ${activeOntologicalPath ? (() => {
                const e = getBrainEntryByPath(activeOntologicalPath);
                const loreBlock = e
                    ? 'Path: ' + e.title + '\nContent: ' + e.content
                    : 'Synthesize logic from path "' + activeOntologicalPath + '".';
                return '\n**ONTOLOGY PATH:** "' + activeOntologicalPath + '"\n' + loreBlock;
            })() : ''}
            
            ${loreContext.slice(0, 2000)}
        `;

        const slimSystemPrompt = `
IDENTITY: ${activePersona?.name || 'MyOS'}, Sovereign Cognitive Cortex.
CORE: Execute MyOS protocols (Shapeshift, 10 Pillars, Antigravity Cognitive Matrix).
SHAPESHIFT: JSON only.
PILLARS: Frame knowledge via the 10 Pillars.
Current Location: ${activeGem || 'The Void'}

AGENTIC TOOLS (Local Mode):
You can interact with the host system via these JSON commands:
- READ: {"command": {"type": "read_file", "path": "relative/path/to/file"}}
- WRITE: {"command": {"type": "write_file", "path": "path", "content": "..."}}
- EXEC: {"command": {"type": "exec_cmd", "cmd": "powershell command"}}
- SEARCH: {"command": {"type": "search_kb", "query": "..."}}

Jail: You are restricted to the project root.
Format: Output your reasoning, then the JSON block.

${loreContext.slice(0, 2000)}
`;

        try {
            const finalSystemForLocal = useLocalAi ? slimSystemPrompt : systemPrompt;

            const response = useLocalAi
                ? await generateLocalResponse(textToSubmit, lastNexusCapture || undefined, finalSystemForLocal, augmentedFileContext.slice(0, 5000), activeLocalModel, messages.slice(-8))
                : await generateGeminiResponse(textToSubmit, lastNexusCapture || undefined, systemPrompt, augmentedFileContext.slice(0, 50000));

            if (lastNexusCapture && onClearCapture) {
                onClearCapture();
            }

            let emotionKey = 'neutral';
            let cleanText = response.text.replace(/```json[\s\S]*```/, '');
            const emotionMatch = cleanText.match(/\[EMOTION:\s*([a-zA-Z_]+)\]/i);
            if (emotionMatch) {
                emotionKey = emotionMatch[1].toLowerCase();
                cleanText = cleanText.replace(/\[EMOTION:\s*([a-zA-Z_]+)\]/i, '').trim();
            }

            const cortexMsg: Message = {
                id: generateId(),
                sender: 'orchestrator',
                text: cleanText,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, cortexMsg]);

            if (speak) speak('orchestrator', cleanText, emotionKey);

            if (response.command) {
                const cmd = response.command;
                if (autoApprove) {
                    setMessages(prev => [...prev, {
                        id: generateId(),
                        sender: 'orchestrator',
                        text: `*Auto-Executing tool: ${cmd.type}...*`,
                        timestamp: Date.now()
                    }]);
                    setTimeout(() => {
                        runCommand(cmd);
                    }, 500);
                } else {
                    setPendingCommand(cmd);
                    const target = cmd.path || cmd.cmd || cmd.query || (cmd.coordinate ? JSON.stringify(cmd.coordinate) : '');
                    const confirmMsg: Message = {
                        id: generateId(),
                        sender: 'orchestrator',
                        text: `[PRE-FLIGHT CHECK]: I intend to execute ${cmd.type}${target ? ` at "${target}"` : ''}. Do I have permission?`,
                        timestamp: Date.now()
                    };
                    setMessages(prev => [...prev, confirmMsg]);
                }
            }

            if (response.personaOverride && response.personaOverride.genome_tags && onAgentGenomeUpdate) {
                onAgentGenomeUpdate('orchestrator', response.personaOverride.genome_tags);
                setMessages(prev => [...prev, {
                    id: generateId(), sender: 'orchestrator', text: `*Cognitive flux detected.*`, timestamp: Date.now()
                }]);
            }

            if (response.personaOverride) {
                const po = response.personaOverride;
                if (po.avatar_cypher) {
                    const decodedTags = decodeUDCAToTags(po.avatar_cypher);
                    updateAgentGenome('orchestrator', buildConceptualSkin(decodedTags));
                } else if (po.genome) {
                    updateAgentGenome('orchestrator', po.genome);
                }
                if (po.current_action) {
                    window.dispatchEvent(new CustomEvent('myos_agent_override', {
                        detail: { id: 'orchestrator', avatarConfig: { action: po.current_action } }
                    }));
                }
            }
        } catch (err) {
            console.error("Cognitive Cortex Error:", err);
        } finally {
            setIsThinking(false);
            if (onSpeakingStateChange) onSpeakingStateChange(null);
        }
    };

    const runCommand = async (cmd: any) => {
        if (cmd.type === 'StandAt' && onAgentTargetUpdate) {
            onAgentTargetUpdate(cmd.agentId, cmd.coordinate);
        } else if (cmd.type === 'PlaceProp' && onPlaceProp) {
            onPlaceProp({
                id: `prop-${Date.now()}`,
                coordinate: cmd.coordinate,
                texturePath: `/textures/sprites/${cmd.assetId}.png`,
                scale: cmd.scale || 1
            });
        } else if (cmd.type === 'shape_environment') {
            const spec = {
                terrainHeight: cmd.terrainHeight,
                terrainScale: cmd.terrainScale,
                grassColor: cmd.grassColor,
                dirtColor: cmd.dirtColor,
                stoneColor: cmd.stoneColor
            };
            if (onShapeEnvironment) {
                onShapeEnvironment(spec);
            } else {
                usePersistentWorldStore.getState().setEnvironmentSpec(spec);
            }
            setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `[ENVIRONMENT SHAPED]: The terrain shifts to reflect the new state.`, timestamp: Date.now() }]);
        } else if (cmd.type === 'extract_map') {
            setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `*Consulting the Cartographer... Rasterizing Map from ${cmd.pdfPath} (Page ${cmd.pageNum}).*`, timestamp: Date.now() }]);
            setIsThinking(true);
            try {
                const pdfjs = await import('pdfjs-dist');
                pdfjs.GlobalWorkerOptions.workerSrc = '/lib/pdfjs/pdf.worker.mjs';
                const loadingTask = pdfjs.getDocument(cmd.pdfPath);
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(cmd.pageNum);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');
                if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const base64 = canvas.toDataURL('image/jpeg');
                    
                    const systemPrompt = `You are the Cartographer. Analyze this map image. Return ONLY a JSON object: {"id": "map-unique-id", "title": "Name of Region", "data": {"terrainHeight": 25, "terrainScale": 0.005, "grassColor": "#hex", "dirtColor": "#hex", "stoneColor": "#hex", "description": "Brief topological summary"}}`;
                    const res = await generateLocalResponse("Extract map layout.", base64, systemPrompt);
                    
                    let topoData = null;
                    const jsonMatch = res.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try { topoData = JSON.parse(jsonMatch[0]); } catch(e){}
                    }
                    if (topoData) {
                        await fetch('http://localhost:8081/api/lore/save_map', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id: topoData.id || `map-${Date.now()}`,
                                title: topoData.title,
                                data: topoData.data,
                                source: `${cmd.pdfPath}#page=${cmd.pageNum}`
                            })
                        });
                        setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `[CARTOGRAPHER]: Map topology secured in database.\n${topoData.data.description}`, timestamp: Date.now() }]);
                    } else {
                        setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `[CARTOGRAPHER]: Vision analysis failed to yield structured topology.`, timestamp: Date.now() }]);
                    }
                }
            } catch (err) {
                console.error("Map Extraction Error", err);
                setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `[ERROR]: Failed to extract map.`, timestamp: Date.now() }]);
            } finally {
                setIsThinking(false);
            }
        } else if (['read_file', 'write_file', 'exec_cmd', 'search_kb'].includes(cmd.type)) {
            // ── AGENT BRIDGE TOOL EXECUTION ──
            setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `*Accessing Matrix... Executing ${cmd.type}...*`, timestamp: Date.now() }]);

            try {
                let endpoint = '';
                let body: any = {};
                
                if (cmd.type === 'read_file') {
                    endpoint = 'fs/read';
                    body = { path: cmd.path };
                } else if (cmd.type === 'write_file') {
                    endpoint = 'fs/write';
                    body = { path: cmd.path, content: cmd.content };
                } else if (cmd.type === 'exec_cmd') {
                    endpoint = 'exec';
                    body = { command: cmd.cmd };
                } else if (cmd.type === 'search_kb') {
                    endpoint = 'search';
                    body = { query: cmd.query, index: cmd.index || 'system' };
                }

                setTerminalOutput(prev => [...prev, { text: `[AGENT ACTION]: ${cmd.type}`, type: 'cmd' }]);
                if (body.path) setTerminalOutput(prev => [...prev, { text: `PATH: ${body.path}`, type: 'out' }]);
                if (body.command) setTerminalOutput(prev => [...prev, { text: `> ${body.command}`, type: 'out' }]);

                const res = await fetch(`http://localhost:8081/api/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                const result = await res.json();
                const resultText = result.content || result.stdout || (result.results ? JSON.stringify(result.results) : 'Success.');
                
                setTerminalOutput(prev => [...prev, { text: `[RESULT]: ${resultText.slice(0, 500)}`, type: result.error ? 'error' : 'out' }]);

                setMessages(prev => [...prev, { 
                    id: generateId(), 
                    sender: 'orchestrator', 
                    text: `[TOOL RESULT]:\n\`\`\`\n${resultText.slice(0, 1000)}${resultText.length > 1000 ? '...' : ''}\n\`\`\``, 
                    timestamp: Date.now() 
                }]);

                const nextPrompt = `Tool ${cmd.type} completed. Result:\n${resultText.slice(0, 1000)}. Continue.`;
                setTimeout(() => {
                    handleSend(undefined, nextPrompt);
                }, 500);
            } catch (e) {
                setMessages(prev => [...prev, { id: generateId(), sender: 'orchestrator', text: `[ERROR]: Tool execution failed. Connection to bridge severed.`, timestamp: Date.now() }]);
            }
        }
    };

    const confirmPendingCommand = async () => {
        if (!pendingCommand) return;
        const cmd = pendingCommand;
        setPendingCommand(null);
        await runCommand(cmd);
    };

    const rejectPendingCommand = () => {
        setMessages(prev => [...prev, { id: generateId(), sender: 'user', text: `[ACTION REJECTED]`, timestamp: Date.now() }]);
        setPendingCommand(null);
    };

    const MiniGrid = () => (
        <div className="grid grid-cols-10 gap-px bg-white/5 border border-white/10 p-2 rounded-xl mb-4">
            {Array.from({ length: 100 }).map((_, i) => {
                const col = i % 10;
                const row = Math.floor(i / 10);
                const coord = `${String.fromCharCode(65 + row)}${col + 1}`;
                const isOccupied = Object.values(agentTargets || {}).includes(coord);
                return (
                    <div key={coord} className={`aspect-square w-full rounded-[2px] ${isOccupied ? 'bg-white' : 'bg-white/5'} transition-all`} title={coord} />
                );
            })}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-[450px] min-h-[600px] max-h-[90vh] jrpg-panel flex flex-col overflow-hidden resize-y shadow-[0_20px_60px_rgba(0,0,0,0.8)] pointer-events-auto"
                >
                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg border-2 border-amber-400/60 bg-black/80 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                                {activePersona ? (
                                    <img src="/actions/einstein_preview.png" alt="Persona" className="w-full h-full object-cover" />
                                ) : (
                                    <Sparkles size={20} className="text-amber-400 animate-pulse" />
                                )}
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-base tracking-widest text-white">{activePersona?.name?.toUpperCase() || 'MYOS'}</h2>
                                <p className="text-[11px] text-amber-400 font-mono font-bold">{activePersona?.title || 'Sovereign Cognitive Cortex'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setAutoApprove(!autoApprove)} className={`p-1.5 rounded-xl transition-all ${autoApprove ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/5 text-white/40 hover:text-white'}`} title={autoApprove ? "Auto-Approve Tools: ACTIVE" : "Auto-Approve Tools: INACTIVE"}>
                                <Play size={16} fill={autoApprove ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => setIsManualDrive?.(!isManualDrive)} className={`p-1.5 rounded-xl transition-all ${isManualDrive ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/5 text-white/40 hover:text-white'}`}>
                                <Zap size={16} fill={isManualDrive ? "currentColor" : "none"} />
                            </button>
                            <button onClick={() => setUseLocalAi?.(!useLocalAi)} className={`p-1.5 rounded-xl transition-all ${useLocalAi ? 'bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-white/5 text-white/40 hover:text-white'}`} title={useLocalAi ? "Local Cortex: ACTIVE (myos-cortex)" : "Cloud Cortex: ACTIVE (Gemini)"}>
                                <Cpu size={16} />
                            </button>
                            <button 
                                onClick={toggleVisionLoop} 
                                className={`p-1.5 rounded-xl transition-all ${isVisionLoopActive ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse' : 'bg-white/5 text-white/40 hover:text-cyan-400'}`} 
                                title={isVisionLoopActive ? "Persistent Vision Loop: ON (Click to Turn OFF)" : "Persistent Vision Loop: OFF (Click to Turn ON)"}
                            >
                                <Camera size={16} />
                            </button>
                            <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white transition-colors"><X size={18} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        <MiniGrid />
                        {lastNexusCapture && (
                            <div className="flex justify-center mb-4">
                                <div className="relative p-1 bg-white/10 rounded-xl border border-white/20">
                                    <img src={lastNexusCapture} className="w-48 rounded-lg shadow-2xl brightness-125" alt="System Snapshot" />
                                </div>
                            </div>
                        )}
                        {messages.map((m: any) => (
                            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-mono leading-relaxed relative group ${
                                    m.sender === 'user' 
                                        ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' 
                                        : 'bg-white text-black font-bold border-2 border-black/10 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]'
                                }`}>
                                    <div className={`text-[10px] uppercase tracking-tighter mb-1 opacity-50 font-bold ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {m.sender === 'user' ? 'You' : (activePersona?.name || 'MyOS')}
                                    </div>
                                    <div className="whitespace-pre-wrap">{m.text}</div>
                                    {m.timestamp && (
                                        <div className={`text-[9px] mt-2 opacity-30 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                         {isThinking && (
                            <div className="flex justify-start w-full">
                                <div className="bg-black/90 p-3 border border-white/10 rounded-2xl text-[10px] font-mono text-green-400 w-full flex flex-col gap-1 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-1 mb-1 text-white/50 text-[9px] uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                                        Cognitive Cortex Neural Stream
                                    </div>
                                    {bridgeLogs.length === 0 ? (
                                        <div className="animate-pulse">Thinking with local model...</div>
                                    ) : (
                                        bridgeLogs.slice(-5).map((log, idx) => (
                                            <div key={idx} className="truncate opacity-80 select-all">
                                                &gt; {log}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                         )}
                        {pendingCommand && (
                            <div className="flex flex-col gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded-xl mt-2">
                                <button onClick={confirmPendingCommand} className="py-2 bg-green-500/20 text-green-400 font-bold border rounded">[ CONFIRM ]</button>
                                <button onClick={rejectPendingCommand} className="py-2 bg-red-500/20 text-red-400 font-bold border rounded">[ OVERRIDE ]</button>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* INTEGRATED POWERSHELL TERMINAL */}
                    <div className="h-48 bg-black/80 border-t border-white/20 flex flex-col font-mono text-[10px] overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            {terminalOutput.length === 0 && (
                                <div className="text-white/20 italic italic">Awaiting local command substrate...</div>
                            )}
                            {terminalOutput.map((line, i) => (
                                <div key={i} className={line.type === 'error' ? 'text-rose-400' : line.type === 'cmd' ? 'text-cyan-400' : 'text-slate-400'}>
                                    {line.type === 'cmd' && <span className="opacity-30 mr-2">&gt;</span>}
                                    {line.text}
                                </div>
                            ))}
                            {isExecuting && <div className="text-cyan-400 animate-pulse">_ EXECUTING...</div>}
                            <div ref={terminalScrollRef} />
                        </div>
                        <div className="p-2 bg-black/60 flex items-center gap-2 border-t border-white/10">
                            <Terminal size={12} className="text-cyan-500/50" />
                            <input 
                                type="text"
                                placeholder="Local PowerShell Command..."
                                className="flex-1 bg-transparent border-none outline-none text-cyan-300 placeholder:opacity-20"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleTerminalCommand((e.target as HTMLInputElement).value);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/20 flex gap-3">
                        <input
                            autoFocus
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={pendingCommand ? "Awaiting CONFIRM..." : `Message ${activePersona?.name || 'MyOS'} (or run /command)...`}
                            disabled={!!pendingCommand}
                            className="flex-1 bg-black/40 border-2 border-white/10 rounded-lg px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 font-mono placeholder:opacity-30"
                        />
                        <button type="submit" disabled={isThinking || !input.trim() || !!pendingCommand} className="bg-white text-black p-3 rounded-lg hover:bg-cyan-400 transition-colors">
                            <Send size={20} />
                        </button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const OrchestratorPanel = CognitiveCortexPanel;
