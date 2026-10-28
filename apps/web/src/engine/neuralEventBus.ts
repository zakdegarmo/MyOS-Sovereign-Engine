/**
 * neuralEventBus.ts
 * 
 * Global deterministic telemetry and neural graph event bus for MyOS.
 * Links agent tool calls, terminal commands, local Ollama LLM thought streams,
 * and vector database queries directly to physical 3D coordinates in the Rubik's Cognitive Matrix.
 */

import type { GemId } from '../Omni/types';

export type NeuralEventType = 
    | 'tool_call' 
    | 'llm_thought' 
    | 'llm_token' 
    | 'script_exec' 
    | 'vector_query' 
    | 'state_mutation'
    | 'user_intent';

export type NeuralVisualIndicator = 
    | 'EMISSIVE_SPARK' 
    | 'SLICES_TWIST' 
    | 'NODE_JUMP' 
    | 'SYNAPTIC_BEAM';

export interface MyOsNeuralEvent {
    id: string;
    timestamp: number;
    type?: NeuralEventType;
    eventType?: string;
    source?: string;
    sourceNode?: string;
    dominantPillar?: GemId;
    targetPillar?: GemId;
    nodeAddress?: { x: number; y: number; z: number } | [number, number, number];
    toolName?: string;
    label: string;
    colorHex?: string;
    status?: 'pending' | 'active' | 'success' | 'failure';
    visual?: {
        indicator?: NeuralVisualIndicator;
        colorHex?: string;
        intensity?: number;
        durationMs?: number;
    };
    meta?: any;
    payload?: any;
}

// Pillar to Color mapping
export const PILLAR_HEX_COLORS: Record<GemId, string> = {
    Self: '#f43f5e',
    Thought: '#fbbf24',
    Logic: '#3b82f6',
    Unity: '#10b981',
    Existence: '#8b5cf6',
    Improvement: '#f97316',
    Mastery: '#ef4444',
    Resonance: '#ec4899',
    Transcendence: '#a855f7',
    Omni: '#38bdf8'
};

// Deterministic 3D Voxel Coordinate mapping for standard MyOS actions
export const SYSTEM_VOXEL_REGISTRY: Record<string, { pillar: GemId; coord: [number, number, number] }> = {
    // Logic (∴): Systems, scripts, execution
    'run_command': { pillar: 'Logic', coord: [1, 0, -1] },
    'write_to_file': { pillar: 'Logic', coord: [1, 0, 0] },
    'replace_file_content': { pillar: 'Logic', coord: [1, 0, 1] },
    'view_file': { pillar: 'Logic', coord: [1, -1, 0] },
    
    // Thought (✧): Ideation, LLM inference, cognitive search
    'ollama_gemma4': { pillar: 'Thought', coord: [0, 1, 0] },
    'gemini_reasoning': { pillar: 'Thought', coord: [0, 1, 1] },
    'search_web': { pillar: 'Thought', coord: [0, 1, -1] },
    
    // Omniscience (۞): Long-term memory, vector store
    'query_memory': { pillar: 'Omni', coord: [0, -1, 1] },
    'ancestral_memories': { pillar: 'Omni', coord: [0, -1, 0] },
    'map_to_genome': { pillar: 'Omni', coord: [0, -1, -1] },
    
    // Mastery (❂): Blender headless, filming, 3D pipelines
    'blender_engine': { pillar: 'Mastery', coord: [-1, 1, 0] },
    'film_soundstage': { pillar: 'Mastery', coord: [-1, 1, 1] },
    'stitch_video_reel': { pillar: 'Mastery', coord: [-1, 1, -1] },
    
    // Improvement (⇈): Stunt physics, gameplay, testing
    'uniracer_physics': { pillar: 'Improvement', coord: [-1, 0, 1] },
    'stunt_engine': { pillar: 'Improvement', coord: [-1, 0, 0] },
    
    // Existence (⬡): Topography, shaders, dimensional world stages
    'bering_sea_shader': { pillar: 'Existence', coord: [-1, -1, 1] },
    'topography_registry': { pillar: 'Existence', coord: [-1, -1, 0] },
    'soundstage_environment': { pillar: 'Existence', coord: [-1, -1, -1] },
    
    // Self (◉): Avatar state, gestalt, persona identity
    'avatar_controller': { pillar: 'Self', coord: [0, 0, 0] },
    'character_gestalt': { pillar: 'Self', coord: [0, 0, 1] },
    
    // Unity (⚭): Multi-agent council, swarm consensus
    'council_orchestrator': { pillar: 'Unity', coord: [1, 1, 0] },
    'agent_swarm_consensus': { pillar: 'Unity', coord: [1, 1, 1] },
    'symbiorithm_network_protocols': { pillar: 'Unity', coord: [1, 1, -1] },

    // Transcendence (⍟): Paradigm shifts, tesseract transitions
    'hyperjump': { pillar: 'Transcendence', coord: [0, 0, -1] },
    'dimension_swap': { pillar: 'Transcendence', coord: [-1, 0, -1] },

    // Antigravity Skills Matrix
    'forge_tool': { pillar: 'Logic', coord: [1, 1, -1] },
    'detective': { pillar: 'Existence', coord: [1, -1, 1] },
    'detective_observe': { pillar: 'Existence', coord: [1, -1, 0] },
    'rag_weaver': { pillar: 'Omni', coord: [0, -1, 1] },
    'memory_weaver': { pillar: 'Omni', coord: [0, -1, 0] },
    'journal_weaver': { pillar: 'Thought', coord: [0, 1, -1] },
    'local_weaver': { pillar: 'Thought', coord: [0, 1, 1] },
    'sprite_inator': { pillar: 'Mastery', coord: [-1, 1, -1] },
    'transparent_inator': { pillar: 'Mastery', coord: [-1, 0, -1] },
    'reconcile': { pillar: 'Improvement', coord: [-1, -1, 0] },
    'search_ledger': { pillar: 'Omni', coord: [0, -1, -1] },
    'search_party': { pillar: 'Unity', coord: [1, 0, 1] }
};

type NeuralEventHandler = (event: MyOsNeuralEvent) => void;

class NeuralEventBus {
    private handlers: Set<NeuralEventHandler> = new Set();
    private history: MyOsNeuralEvent[] = [];
    private maxHistory = 100;

    public emit(event: Omit<MyOsNeuralEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): MyOsNeuralEvent {
        const fullEvent: MyOsNeuralEvent = {
            id: event.id || `ne-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            timestamp: event.timestamp || Date.now(),
            ...event
        };

        this.history.unshift(fullEvent);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }

        // Notify subscribers
        this.handlers.forEach(h => {
            try {
                h(fullEvent);
            } catch (err) {
                console.error('NeuralEventBus handler error:', err);
            }
        });

        // Also broadcast to window for external listeners / devtools
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('myos_neural_event', { detail: fullEvent }));
        }

        return fullEvent;
    }

    public subscribe(handler: NeuralEventHandler): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    public getRecentEvents(count = 20): MyOsNeuralEvent[] {
        return this.history.slice(0, count);
    }

    public clear(): void {
        this.history = [];
    }
}

export const neuralEventBus = new NeuralEventBus();

export const emitNeuralEvent = (event: Partial<MyOsNeuralEvent> & { label: string }): MyOsNeuralEvent => {
    const rawAddress = event.nodeAddress;
    let normalizedAddress = rawAddress;
    if (Array.isArray(rawAddress)) {
        normalizedAddress = { x: rawAddress[0], y: rawAddress[1], z: rawAddress[2] };
    }
    const pillar = event.dominantPillar || event.targetPillar || 'Self';
    const color = event.colorHex || event.visual?.colorHex || PILLAR_HEX_COLORS[pillar] || '#38bdf8';

    return neuralEventBus.emit({
        id: event.id || `ne-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: event.timestamp || Date.now(),
        type: event.type || (event.eventType as any) || 'state_mutation',
        eventType: event.eventType || event.type,
        source: event.source || event.sourceNode || 'engine',
        sourceNode: event.sourceNode || event.source || 'engine',
        dominantPillar: pillar,
        targetPillar: pillar,
        nodeAddress: normalizedAddress as any,
        toolName: event.toolName,
        label: event.label,
        colorHex: color,
        status: event.status || 'active',
        visual: {
            indicator: event.visual?.indicator || 'EMISSIVE_SPARK',
            colorHex: color,
            intensity: event.visual?.intensity ?? 2.4,
            durationMs: event.visual?.durationMs ?? 1200
        },
        meta: event.meta || event.payload,
        payload: event.payload || event.meta
    });
};

export const subscribeNeuralEvents = (handler: (event: MyOsNeuralEvent) => void): (() => void) => {
    return neuralEventBus.subscribe(handler);
};

export const getRecentNeuralEvents = (count = 20): MyOsNeuralEvent[] => {
    return neuralEventBus.getRecentEvents(count);
};
