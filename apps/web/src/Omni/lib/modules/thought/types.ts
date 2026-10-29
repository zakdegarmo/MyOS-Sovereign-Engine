
import type { ThoughtTrigger } from '../self/types';

export type ThinkingMode = ThoughtTrigger['type'];

export interface IdeaNode {
    id: string;
    title: string;
    description: string;
    wildness: number; // 0.0 (Conventional) to 1.0 (Radical)
    feasibility: number; // 0.0 (Impossible) to 1.0 (Trivial)
    connections: string[]; // IDs of related concepts
}

export interface ThoughtStream {
    seed: string;
    mode: ThinkingMode;
    ideas: IdeaNode[];
    narrative: string; // The "Inner Monologue" of Da Vinci
}
