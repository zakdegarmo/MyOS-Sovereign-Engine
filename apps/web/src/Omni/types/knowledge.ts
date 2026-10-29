
import type { GemId, OntologyReport } from './council';

// --- LIBRARY TYPES ---

export interface DdcInfo {
    number: string;
    name: string;
}

export type PrimitiveType = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'dodecahedron' | 'icosahedron' | 'octahedron' | 'tetrahedron' | 'torusKnot' | 'point' | 'voxel_grid';

export interface TransformState {
    position: [number, number, number];
    rotation: [number, number, number, number]; // Quaternion
    scale: [number, number, number];
}

export interface ModifiersState {
    twist?: { enabled: boolean; axis: 'x' | 'y' | 'z'; angle: number };
    bend?: { enabled: false; axis: 'x' | 'y' | 'z'; angle: number }; // Disabled for now until geometryModifiers.ts is ported
    taper?: { enabled: false; axis: 'x' | 'y' | 'z'; factor: number };
}

export interface VisualMeta {
    transform?: TransformState;
    modifiers?: ModifiersState;
    color?: string;
    shape?: PrimitiveType;
    visible?: boolean;
}

// --- GLB LIBRARY TYPES (Mirrors LibraryBook) ---
export interface GlbModel {
    id: string; // e.g., "glb-135.4-pyramid"
    callNumber: string; // DDC mapping
    title: string;
    description: string;
    modelUrl: string; // Path to .glb file
    thumbnailUrl?: string; // Path to thumbnail
    keywords: string[];
    ddc: DdcInfo;
    ontologyReport?: OntologyReport; // How this object relates to the Council
    addedAt: number;
    patron?: GemId;
    weight?: number; // 0-1 relevance
}

export interface GlbLibraryNode {
    id: string;
    name: string;
    children: Record<string, GlbLibraryNode>;
    models: GlbModel[];
}


export interface DdcClassification {
    number: string;
    name: string;
    path: DdcInfo[];
}

export interface Book {
    id: string;
    callNumber: string;
    title: string;
    author?: string;
    publishDate?: string;
    summary: string;
    originalText: string;
    content?: string;
    keywords: string[];
    ddc: DdcClassification;
    ontologyReport: OntologyReport;
    addedAt: number;
    patron: GemId; // The Council Member this book "orbits"
    weight: number; // 0.1 to 1.0
    accessStats?: {
        openCount: number;
        lastAccessed: number;
        decayFactor?: number; // 0-1, future use for 'fading'
    };
    visual?: VisualMeta; // Phase 2: 3D Persistence
}

// v2.1: Seat of Thought - The MemCube (MemOS Standard)
export type MemCubeType = 'textual' | 'activation' | 'parametric' | 'asset'; // Added 'asset'

export interface MemCube {
    id: string;
    type: MemCubeType;
    content: {
        text?: string;        // Textual Memory (Unstructured/Structured)
        kvCache?: any;       // Activation Memory (Context Reuse)
        weights?: string;    // Parametric Memory (LoRA Adapter Path)
        assetUrl?: string;   // Asset Memory (Image/Audio/GLB Path)
        mimeType?: string;   // e.g. "image/png"
        fileName?: string;   // Original filename
    };
    meta: {
        timestamp: number;
        origin: string;      // e.g. "User", "System", "Thought"
        context: string[];   // Tags/Keywords
        resonance: number;   // 0.0 to 1.0
        embedding?: number[]; // Vector representation
    };
    // Legacy support for visual graph
    visual?: VisualMeta;
}

export interface IdeaCube {
    id: string;
    transient: true;
    content: string; // The raw thought
    sparkedBy: GemId; // Who had the idea?
    timestamp: number;
    tags: string[];
    status: 'fleeting' | 'captured' | 'crystallized' | 'discarded';
    crystallizedId?: string; // Link to MemCube if crystallized
}

export interface LibraryNode {
    id: string; // The DDC number (e.g., "100", "150.3")
    name: string; // "Philosophy", "Psychology"
    children: Record<string, LibraryNode>;
    books: Book[];
    memories?: MemCube[]; // Phase 2: Thought Crystals
    visual?: VisualMeta; // Phase 2: 3D Persistence
}

export interface GhostNode {
    id: string; // e.g., "ghost-12345"
    type: 'ghost';
    title: string;
    summary: string; // The "What if?"
    probability: number; // 0.0 to 1.0 confidence
    parentIds: string[]; // IDs of the "parents" (Book IDs or other Ghosts)
    spawnedAt: number;
    expiresAt: number; // TTL
    patron: GemId; // Which Gem hallucinated this?
    keywords: string[];
}

export type GraphNode = MemCube | GhostNode;

// MODULE 5: THE LIVING LIBRARY
export type SynapseType = 'thematic' | 'contradiction' | 'supporting' | 'evolution';

export interface Synapse {
    id: string;
    sourceId: string; // ID of the book/node
    targetId: string; // ID of the connected book/node
    type: SynapseType;
    strength: number; // 0.1 to 1.0
    insight: string; // The "Why"
    createdAt: number;
}
