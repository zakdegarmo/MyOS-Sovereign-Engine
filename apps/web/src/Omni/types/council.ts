
// --- COUNCIL & GEM TYPES ---

export type GemId =
    | 'Self'
    | 'Thought'
    | 'Logic'
    | 'Unity'
    | 'Existence'
    | 'Improvement'
    | 'Mastery'
    | 'Resonance'
    | 'Transcendence'
    | 'Omni';

export interface GemProfile {
    id: GemId;
    name: string;
    symbol: string;
    color: string;
    shortDesc: string;
    instructions: string;
    patron?: {
        name: string;
        role: string;
    };
    modelUrl?: string; // URL for the avatar GLB
    visualPrompt?: string; // Meshy AI prompt for avatar generation
}

export type FeedbackType =
    | 'affirm'
    | 'expand'
    | 'verify'
    | 'unify'
    | 'anchor'
    | 'optimize'
    | 'execute'
    | 'resonate'
    | 'ignite'
    | 'dissolve'
    | 'coherence'
    | 'friction';

export interface CouncilInquiry {
    id: string;
    gemId: GemId;
    question: string;
    options: { id: string; text: string; value: string }[];
    type: 'binary' | 'open';
    answer?: string;
    timestamp?: number;
    isAnswered?: boolean;
}

// --- GEM VITALITY SYSTEM ---
export interface GemNeeds {
    sustenance: number; // Hunger for Data (0-100)
    connection: number; // Hunger for Social (0-100)
    clarity: number;    // Hygiene/Context Cleanliness (0-100)
    drive: number;      // Purpose/Agency (0-100)
}

export interface GemState {
    id: GemId;
    level: number;
    xp: number;
    rank: string; // e.g. "Initiate"
    needs: GemNeeds;
    lastInteraction: number; // Timestamp
}

export type CouncilState = Record<GemId, GemState>;
export type RelationshipMatrix = Record<GemId, Record<GemId, string>>;
export type OntologyReport = Record<GemId, string>;
