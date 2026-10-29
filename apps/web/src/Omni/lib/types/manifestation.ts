export type AgentName =
    | 'self'
    | 'thought'
    | 'logic'
    | 'unity'
    | 'existence'
    | 'improvement'
    | 'mastery'
    | 'resonance'
    | 'transcendence'
    | 'omni';

// The "DNA" of the Idea as it evolves
export interface ManifestationContext {
    sessionId: string;
    seed: string; // The original User Intent

    // The "Baton" state
    currentAgent: AgentName;
    status: 'idle' | 'active' | 'paused' | 'complete' | 'failed';

    // The "Memory" of the Council
    transcript: AgentMessage[];

    // The "Artifacts" (Concrete Outputs)
    artifacts: {
        concept?: ConceptManifest;     // Output of Thought
        blueprint?: ArchitectureSpec;  // Output of Logic
        plan?: ConstructionPlan;       // Output of Unity
        code?: CodeArtifact[];         // Output of Mastery
    };

    // System Metadata
    timestamp: number;
}

export interface AgentMessage {
    agent: AgentName;
    content: string; // The "Speech"
    internalMonologue?: string; // The "Thought Process" (Hidden from user initially?)
    timestamp: number;
}

// STAGE 1: THOUGHT
export interface ConceptManifest {
    title: string;
    corePhilosophy: string;
    visualMetaphor: string; // e.g. "A Clockwork Orange"
    userExperience: string; // Narrative description
    features?: string[];
}

// STAGE 2: LOGIC
export interface ArchitectureSpec {
    dataModels: string[]; // Descriptions of JSON schemas
    components: string[]; // List of React Components needed
    stateStrategy: string;
}

// STAGE 3: UNITY
export interface ConstructionPlan {
    tasks: {
        id: string;
        description: string;
        assignedAgent: 'existence' | 'improvement' | 'mastery';
        status: 'pending' | 'done';
    }[];
}

// STAGE 4: MASTERY
export interface CodeArtifact {
    filepath: string;
    action: 'create' | 'modify' | 'delete';
    content?: string; // If create/modify
}
