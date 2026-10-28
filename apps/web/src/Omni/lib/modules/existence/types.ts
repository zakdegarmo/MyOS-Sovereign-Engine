export interface GrubberLink {
    url: string;
    text?: string;
}

export interface GrubberResponse {
    links: string[]; // The API returns an array of strings
}

export interface OntologicalAnalysis {
    summary: string;
    concepts: string[];
    sentiment: string;
    entityType: string;
}

// --- Existence Agent Types ---

import type { ConsensualPlan } from '../unity/types';

export interface ResourceState {
    energy: number; // 0-100%
    timeAvailable: number; // Minutes
    environment: 'Development' | 'Production' | 'Testing';
}

export interface TaskAllocation {
    step: string;
    estimatedCost: number; // Energy/Time cost
    priority: 'Immediate' | 'Background';
}

export interface ExistentialManifest {
    planId: string;
    groundedSteps: TaskAllocation[];
    resourceImpact: string; // "Low", "Critical"
    executableNow: boolean;
}
