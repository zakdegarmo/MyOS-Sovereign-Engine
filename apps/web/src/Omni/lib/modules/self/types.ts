
export interface StimulusContext {
    sender: string;    // WHO sent this? (User, AgentName, System)
    content: string;   // WHAT is the raw content?
    timestamp: number; // WHEN did this happen?
    urgency: 'low' | 'medium' | 'high' | 'critical'; // WHY (Context: Survival check)
}

export interface SelfState {
    currentPersona: string; // e.g., "Carl Jung"
    focus: string;          // Current active goal or "Idle"
    energy: number;         // 0-100 (Simulated resource)
}

export interface ThoughtTrigger {
    required: boolean;
    type: 'Divergent' | 'Convergent' | 'Simulation' | 'None';
    seed: string; // The structured prompt for Thought
    reasoning: string; // Why did Self decide this?
}

export const REFLEX_ACTIONS = [
    'ping',
    'clear_logs',
    'update_time',
    'ack' // Simple acknowledgement
] as const;

export type ReflexActionType = typeof REFLEX_ACTIONS[number];
