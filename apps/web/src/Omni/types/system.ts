
import type { GemId, FeedbackType } from './council';

// MODULE 3: HAND OF IRON
export interface ToolLog {
    toolName: string;
    toolInput: any;
    toolOutput: any;
}

// MODULE 2 (v1.2): EVENT HORIZON - Type for distilled tasks
export type TaskLog = string[];

export interface TelemetryMetrics {
    cpuLoad: number;
    memoryUsage: number;
    latency: number;
    errorRate: number;
    activeConnections: number;
    // Legacy / Application State
    counts?: Record<string, number>;
    vitality?: number;
    resonance?: number;
    complexity?: number;
    stability?: number;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    gemId?: GemId; // Only if role is model
    content: string;
    timestamp: number;
    feedback?: FeedbackType; // Telemetry hook state
    toolLog?: ToolLog; // For rendering tool actions
}

// MODULE 2: RECURSION LAYER
export type LoadingState = boolean | 'drafting' | 'critiquing';

export type CampfireMode = 'holon' | 'self' | 'thought' | 'logic' | 'unity' | 'existence' | 'improvement' | 'mastery' | 'resonance' | 'transcendence' | 'omni' | 'nexus' | 'builder' | 'forge' | false;

// MODULE 4: META-PROGRESS
export type QuestStatus = 'active' | 'completed' | 'archived';
export type QuestType = 'main' | 'side' | 'meta';

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: QuestStatus;
    type: QuestType;
    createdAt: number;
    completedAt?: number;
    linkedBookIds?: string[]; // Unity Mesh: Link to Library
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    unlockedAt: number;
    icon: string; // lucide icon name
}

// --- SOVEREIGN LEDGER TYPES ---

export interface SovereignQuest {
    "@context"?: any;
    "@type": string | string[];
    "@id": string;
    meta: {
        title: string;
        created_at: string;
        status: 'Potential' | 'Active' | 'Completed' | 'Archived';
        version: string;
        priority?: string;
    };
    identity_signature: {
        description?: string;
        narrative_arc_contribution?: string;
        narrative_justification?: string;
        signed_by: {
            "@id": string;
            name?: string;
            justification?: string;
        }[] | string; // Allow simplified string signature for Lite mode
        congruence_score?: number;
    };
    logic_constraints: {
        time_budget_minutes: number;
        financial_cost_usd?: number;
        definition_of_done: string;
        resources?: string[];
    };
    thought_divergence: {
        chaos_factor?: number;
        divergent_vectors?: string[];
        mood_forecast?: string;
        narrative_flavor?: string;
        flavor?: string;
    };
    simulation_data?: {
        scenario_A_optimistic: string;
        scenario_B_pessimistic: string;
        critical_failure_point: string;
        probability_success: number;
        unforeseen_variable: string;
    };
    unity_mesh: {
        linked_nodes: {
            "@type"?: string;
            "@id"?: string;
            name?: string;
            url?: string;
            relationship?: string;
        }[];
        linkedBookIds?: string[]; // Unity Mesh
    };
    mastery_kinetic: {
        kinetic_trigger: string;
        current_state?: string;
        friction_log: {
            anticipated: number;
            actual: number | null;
        };
    };
    improvement_log: {
        iterations: any[];
    };
    resonance_feedback: {
        target_audience?: string;
        expected_signal?: string;
        target_signal?: string;
    };
}
