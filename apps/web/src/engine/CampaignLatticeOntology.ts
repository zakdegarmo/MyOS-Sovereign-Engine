/**
 * CampaignLatticeOntology.ts
 * Structured 5W1H Knowledge Graph Lattice for D&D Campaigns.
 * Organizes Noun Data (WHO, WHAT, WHERE) and Relationship Edges (WHEN, WHY, HOW).
 */

export type NounCategory = 'WHO' | 'WHAT' | 'WHERE';

export type NounSubType = 
    | 'npc' 
    | 'monster' 
    | 'hero' 
    | 'artifact' 
    | 'prop' 
    | 'trap' 
    | 'room' 
    | 'landmark';

export interface NounNode {
    id: string;
    name: string;
    category: NounCategory;
    subType: NounSubType;
    description: string;
    spriteUrl?: string;
    gridCoordinates?: {
        x: number;
        z: number;
        dimension: string;
    };
    stats?: {
        hp?: number;
        ac?: number;
        cr?: string;
        dc?: number;
    };
}

export interface RelationshipEdge {
    id: string;
    sourceNodeId: string; // e.g. "halaster_blackcloak" (WHO)
    targetNodeId: string; // e.g. "undermountain_level_1" (WHERE)
    relationType: 'guards' | 'owns' | 'inhabits' | 'trapped_by' | 'contains' | 'allied_with';
    
    // 5W1H Causality
    when: string; // e.g. "Encounter Phase 1 / On Room Entry"
    why: string;  // e.g. "Halaster's madness spell binding the archway"
    how: string;  // e.g. "DC 15 Arcana check to disarm glyph"
}

export interface SpatialRegionNode {
    id: string;
    name: string;
    level: 'continent' | 'major_region' | 'minor_region' | 'poi';
    parentId?: string;
    childIds: string[];
    bounds?: {
        minX: number;
        maxX: number;
        minZ: number;
        maxZ: number;
    };
    seed?: number;
    heightmapUrl?: string;
}

export interface ChunkNode {
    id: string; // e.g. "chunk_12_45_sword_coast"
    regionId: string;
    chunkX: number;
    chunkZ: number;
    seed: number;
    isGenerated: boolean;
    modifiedProps?: NounNode[];
    terrainDataHash?: string;
}

export interface CampaignLattice {
    campaignId: string;
    title: string;
    nodes: Record<string, NounNode>;
    regions?: Record<string, SpatialRegionNode>;
    chunks?: Record<string, ChunkNode>;
    edges: RelationshipEdge[];
}
