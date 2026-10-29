import type { IdeaNode } from '../thought/types';

export interface FallacyReport {
    detected: boolean;
    type?: string; // e.g., "Ad Hominem", "Circular Reasoning"
    description?: string;
}

export interface ValidatedIdea extends IdeaNode {
    logicScore: number; // 0.0 to 1.0 (Validity)
    notes: string[]; // Logic's commentary
    status: 'Approved' | 'Rejected' | 'NeedsRevision';
}

export interface LogicGate {
    originalTo: string; // The Seed ID
    passed: ValidatedIdea[];
    rejected: ValidatedIdea[];
    warnings: string[];
}

export interface FileSystemNode {
    path: string;
    name: string;
    type: 'dir' | 'file';
    children?: FileSystemNode[];
    files?: FileSystemNode[];
    extension?: string;
    size_bytes?: number;
    total_size_bytes?: number;
    file_count?: number;
    depth_level: number;
    originalFileObject?: File;
}
