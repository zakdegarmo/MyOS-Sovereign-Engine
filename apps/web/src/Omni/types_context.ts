import { GemId, UserGestalt, TelemetryMetrics, LibraryNode } from './types';

// WHO: The User and their Profile
// (Imported from types.ts: UserGestalt)

// WHERE: The User's Current Focus
export interface LocationState {
    currentInterface: 'thought' | 'unity' | 'mastery' | 'self' | 'logic' | 'existence' | 'improvement' | 'resonance' | 'transcendence' | 'omni';
    activeTab: string; // e.g. "matrix", "stream", "codex"
    focusedNodeId?: string; // If staring at a specific graph node
}

// WHAT: The Knowledge Available
export interface KnowledgeState {
    librarySnapshot: LibraryNode | null; // The full library tree
    activeMemories: string[]; // IDs of recently accessed memories
    clipboard?: string; // Current text in potential clipboard
}

// HOW: The System Status
export interface SystemState {
    telemetry: TelemetryMetrics;
    activeAgents: GemId[]; // Who is currently instantiated
    routingTraffic: ContextPacket[]; // Recent packets
}

// THE PACKET: Event Stream Unit
import { AgentName } from './lib/types/manifestation';



export type AetherFrequency = string; // e.g. "thought.stream.new_idea"

export interface ContextPacket {
    id: string;
    timestamp: number;
    source: AgentName | 'user' | 'system';
    target: AgentName | 'global';
    channel?: AetherFrequency; // NEW: Topic-based addressing
    type: 'state_update' | 'thought' | 'action' | 'error' | 'insight' | 'command' | 'focus';
    payload: any;
}

// THE BRAIN: Unified Context Object
export interface NexusContext {
    gestalt: UserGestalt;
    location: LocationState & { activeAgent?: string };
    knowledge: KnowledgeState;
    system: SystemState;
    lastPacket?: ContextPacket; // Most recent event
}
