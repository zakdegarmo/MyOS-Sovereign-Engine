import type { OptimizedPlan } from '../improvement/types';

export interface WorkflowArtifact {
    filename: string;
    content: string; // The markdown content
    path: string;
}

export interface MasteryResult {
    planId: string;
    success: boolean;
    logs: string[];
    artifacts: WorkflowArtifact[]; // Files created during execution
    duration: number; // ms
}

export interface SceneAPI {
    log: (message: string) => void;
    updateTransform: (id: string, update: (t: any) => any) => void;
    getObject: (id: string) => any;
    updatePrimitiveParameters: (id: string, update: (p: any) => any) => void;
}
