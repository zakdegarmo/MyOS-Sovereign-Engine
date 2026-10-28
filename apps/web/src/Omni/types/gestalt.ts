
import type { CouncilInquiry } from './council';

// MODULE 1: GESTALT CORE
export type LogicPreference = "Strict" | "Creative" | "Balanced";

// THE HOLON: Genetic Makeup
export interface Attribute {
    level: number;
    xp: number;
    history: number[]; // Trend line
}

export interface SymbiosisMetrics {
    coherence: number; // How well the system understands you (0-100)
    friction: number;  // How often you have to correct the system (0-100)
    flowState: boolean; // Are you currently "in the zone"?
}

export interface UserGestalt {
    // The Profile
    archetype: string; // e.g., "Digital Alchemist", "Void Walker"
    coreValues: string[];
    narrativeArc: string; // Keeping this for backward compatibility with SelfAgent
    logicPreference: LogicPreference; // Keeping for backward compatibility

    // The Character Sheet
    attributes: {
        construct: Attribute; // Logic/Coding ability
        resonance: Attribute; // emotional intelligence
        vision: Attribute;    // Planning/Architecture
        endurance: Attribute; // Focus
    };

    // The Aptitude Test
    cognitiveModel: {
        learningStyle: 'visual' | 'auditory' | 'textual' | 'kinesthetic';
        riskTolerance: 'conservative' | 'balanced' | 'experimental';
        communicationDensity: 'verbose' | 'concise';
    };

    // The Symbiorithm
    symbiosis: SymbiosisMetrics;

    // v1.4: "Real" Identity Layer
    identity: {
        name: string;
        alias?: string;
        role?: string; // e.g. "Software Architect", "Student"
        github?: string;
        vercel?: string;
        timezone?: string;
        apiKeys?: {
            openai?: string;
            anthropic?: string;
        };
        dob?: string; // Keeping for legacy, but likely unused
    };

    biometrics: {
        height?: string;
        appearance?: string; // Text description for Avatar generation later
        avatarUrl?: string;
    };

    favorites: {
        color: string;
        food: string; // "Ice cream flavor"
        musicGenre?: string;
        scent?: string;
    };
    // v1.3: Self Interface Expansion
    psychometrics?: {
        mbti?: string; // e.g. "INTJ"
        alignment?: string; // e.g. "Chaotic Good"
        big5?: {
            openness: number;
            conscientiousness: number;
            extraversion: number;
            agreeableness: number;
            neuroticism: number;
        };
    };

    aptitude?: {
        codingInterest: 'frontend' | 'backend' | 'fullstack' | 'systems' | 'ai';
        strengths: string[];
        weaknesses: string[];
    };

    councilQuestions?: CouncilInquiry[];

    // v1.5: Symbiorithmic Calibration (The Mirror)
    calibration?: {
        who: boolean;
        what: boolean;
        when: boolean;
        where: boolean;
        why: boolean;
        how: boolean;
    };

    // v1.6: Ontology Map (Identity Factors)
    ontology?: Record<string, string>;

    // v1.7: Manifestation Layer
    genome?: any; // ProceduralGenome (imported from utils if needed, using any to avoid circularity in types)
}
