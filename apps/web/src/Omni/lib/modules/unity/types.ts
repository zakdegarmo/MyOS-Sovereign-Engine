import type { ValidatedIdea } from '../logic/types';

export interface ConsensualPlan {
    title: string;
    description: string;
    steps: string[]; // Actionable steps
    synergyScore: number; // 0.0 to 1.0 (How well parts fit)
}

export interface UnityConsensus {
    originalSeeds: string[];
    consensusPlan: ConsensualPlan;
    rationale: string; // "We chose X because..."
}
