/**
 * SpatialMemoryBridge: The Core Symbiorithmic Spatial-Ontology Engine.
 * 
 * Bridges 3D WebGL Canvas Coordinates [X, Y, Z] 1-to-1 with Semantic Vector Memory.
 * Powers:
 * 1. Automatic region-aware prompt priming for AI agent swarms.
 * 2. Dynamic world memory write-backs (mutations).
 * 3. Parallaxatron atmosphere coupling (Lore -> Sky/Weather presets).
 */

export interface SpatialMemoryNode {
    id: string;
    position: [number, number, number]; // [X, Y, Z]
    radius: number;                     // Radius of spatial effect (in meters)
    dimension: string;                  // 'astra_lab' | 'faerun' | 'undermountain'
    title: string;
    lore: string;
    tags: string[];                     // e.g. ['#waterdeep', '#battlefield', '#haunted']
    parallaxPreset?: string;            // 'faerun_overland' | 'yawning_portal' | 'fireball_vortex' | 'undermountain_cavern'
    agentPrompts?: {
        dm?: string;
        rulesLawyer?: string;
        party?: string;
    };
    timestamp: number;
}

class SpatialMemoryBridge {
    private memoryNodes: Map<string, SpatialMemoryNode> = new Map();
    private activeDimension: string = 'astra_lab';

    constructor() {
        this.seedInitialMemories();
    }

    private seedInitialMemories() {
        this.registerMemoryNode({
            id: 'mem_waterdeep_hub',
            position: [-150, 0, 80],
            radius: 120,
            dimension: 'astra_lab',
            title: 'City of Waterdeep (Crown of the North)',
            lore: 'The sprawling Metropolis of Splendors. Home to Blackstaff Tower, Castle Waterdeep, and the legendary Yawning Portal Inn.',
            tags: ['#city', '#waterdeep', '#trade_hub', '#yawning_portal'],
            parallaxPreset: 'faerun_overland',
            timestamp: Date.now()
        });
    }

    public registerMemoryNode(node: SpatialMemoryNode): void {
        this.memoryNodes.set(node.id, node);
    }
}

export const spatialMemoryBridge = new SpatialMemoryBridge();
