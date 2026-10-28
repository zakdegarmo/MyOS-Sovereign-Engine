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
        // Seed default canonical spatial memories across Faerûn & Astra Lab
        this.seedInitialMemories();
    }

    private seedInitialMemories() {
        this.registerMemoryNode({
            id: 'mem_waterdeep_hub',
            position: [-150, 0, 80],
            radius: 120,
            dimension: 'astra_lab',
            title: 'City of Waterdeep (Crown of the North)',
            lore: 'The sprawling Metropolis of Splendors. Home to Blackstaff Tower, Castle Waterdeep, and the legendary Yawning Portal Inn. Governed by the Masked Lords of Waterdeep.',
            tags: ['#city', '#waterdeep', '#trade_hub', '#yawning_portal'],
            parallaxPreset: 'faerun_overland',
            agentPrompts: {
                dm: 'Describe the towering spires of Waterdeep and the distant sounds of bustling sea docks and merchants.',
                rulesLawyer: 'Remind the party that city guards strictly enforce the Code Legal within Waterdeep gates.',
                party: 'Thorin wants to find a blacksmith; Lyra checks for thieves guilds; Eldrin searches for arcane scrolls.'
            },
            timestamp: Date.now()
        });

        this.registerMemoryNode({
            id: 'mem_myth_drannor_ruins',
            position: [320, 0, -50],
            radius: 150,
            dimension: 'astra_lab',
            title: 'Ruins of Myth Drannor',
            lore: 'Ancient elf-dwarf city of High Magic shattered during the Weave collapse. Haunted by wild magic surges, elven phantoms, and forgotten draconic wards.',
            tags: ['#ruins', '#haunted', '#high_magic', '#myth_drannor'],
            parallaxPreset: 'undermountain_cavern',
            agentPrompts: {
                dm: 'Whisper of spectral elven melodies drifting through shattered marble pillars.',
                rulesLawyer: 'All spellcasters must roll a d20 on wild magic surges when casting level 1+ spells here.'
            },
            timestamp: Date.now()
        });

        this.registerMemoryNode({
            id: 'mem_yawning_portal_well',
            position: [-148, 0, 82],
            radius: 20,
            dimension: 'astra_lab',
            title: 'The Yawning Portal Hoist Elevator',
            lore: 'The 40ft wide stone well inside Durnan tavern. A 140ft iron bucket hoist lowers adventurers 1 GP per head into Undermountain Level 1.',
            tags: ['#inn', '#hoist', '#undermountain', '#entry'],
            parallaxPreset: 'yawning_portal',
            timestamp: Date.now()
        });
    }

    public registerMemoryNode(node: SpatialMemoryNode): void {
        this.memoryNodes.set(node.id, node);
        console.log(`[SpatialMemoryBridge] Registered Memory Node: "${node.title}" at [${node.position.join(', ')}] (Radius: ${node.radius}m)`);
    }

    public setActiveDimension(dimension: string): void {
        this.activeDimension = dimension;
    }

    /**
     * Query all spatial memories active at position [X, Y, Z] within their spatial radius
     */
    public queryMemoriesAtPosition(x: number, y: number, z: number, dimension?: string): SpatialMemoryNode[] {
        const dim = dimension || this.activeDimension;
        const matches: SpatialMemoryNode[] = [];

        for (const node of this.memoryNodes.values()) {
            if (node.dimension !== dim) continue;

            const [nx, ny, nz] = node.position;
            const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2 + (z - nz) ** 2);

            if (dist <= node.radius) {
                matches.push(node);
            }
        }

        return matches;
    }

    /**
     * Get active Parallaxatron preset tied to local spatial memory lore
     */
    public getParallaxPresetForPosition(x: number, z: number, dimension?: string): string | null {
        const memories = this.queryMemoriesAtPosition(x, 0, z, dimension);
        for (const mem of memories) {
            if (mem.parallaxPreset) {
                return mem.parallaxPreset;
            }
        }
        return null;
    }

    /**
     * Format prompt context for active agent swarm based on current 3D position
     */
    public formatAgentPromptContext(x: number, y: number, z: number, role: 'dm' | 'rulesLawyer' | 'party' | 'all'): string {
        const memories = this.queryMemoriesAtPosition(x, y, z);
        if (memories.length === 0) return 'Location: Open Faerûn Wilderness.';

        const lines: string[] = ['=== 📍 SPATIAL ONTOLOGY MEMORY CONTEXT ==='];
        for (const mem of memories) {
            lines.push(`• REGION: ${mem.title} [Tags: ${mem.tags.join(', ')}]`);
            lines.push(`  LORE: ${mem.lore}`);
            if (role !== 'all' && mem.agentPrompts?.[role]) {
                lines.push(`  DIRECTIVE (${role}): ${mem.agentPrompts[role]}`);
            }
        }
        lines.push('=========================================');
        return lines.join('\n');
    }

    /**
     * Write-back (mutate) spatial memory node from WebGL in-game event
     */
    public mutateWorldMemory(id: string, newLore: string, addTags: string[]): void {
        const existing = this.memoryNodes.get(id);
        if (existing) {
            existing.lore += ` [UPDATE: ${newLore}]`;
            existing.tags = Array.from(new Set([...existing.tags, ...addTags]));
            existing.timestamp = Date.now();
            console.log(`[SpatialMemoryBridge] Mutated Memory "${existing.title}":`, existing.lore);
        }
    }
}

export const spatialMemoryBridge = new SpatialMemoryBridge();
(window as any).spatialMemoryBridge = spatialMemoryBridge;
