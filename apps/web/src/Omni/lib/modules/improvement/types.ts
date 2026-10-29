import type { ExistentialManifest } from '../existence/types';

export interface WorkflowProposal {
    name: string;
    triggerFrequency: number;
    suggestedSteps: string[];
}

export interface PatternReport {
    detectedPatterns: string[];
    proposals: WorkflowProposal[];
}

export interface OptimizedPlan {
    version: string;
    originalId: string;
    actions: string[]; // Final, refined actions
    estimatedEfficiencyGain: string; // e.g., "15%"
}

export interface OptimizationReport {
    plan: OptimizedPlan;
    learning: PatternReport; // Did we learn anything new?
}
