import type { MasteryResult } from '../mastery/types';

export interface SentimentVector {
    source: 'User' | 'System';
    value: number; // -1.0 (Negative) to 1.0 (Positive)
    tags: string[];
}

export interface ResonanceField {
    planId: string;
    harmonyScore: number; // 0-100%
    frequency: string; // "High", "Low", "Dissonant"
    userSentiment: SentimentVector;
    feedback: string;
}
