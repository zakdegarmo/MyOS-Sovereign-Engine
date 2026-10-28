import { generateCharacterSheet } from './CharacterGenerator';

export interface BuildingPiece {
    id: string;
    type: 'wall' | 'floor' | 'pillar' | 'ceiling' | 'sprite';
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    textureUrl?: string;
    uvOffset?: [number, number];
    health: number; // 0-100
    isDestroyed: boolean;
}

export interface SymbolicLink {
    id: string;
    sourceId: string; // ID of the object (e.g., wall)
    targetId: string; // ID of the occupant (NPC)
    condition: 'on_destroyed' | 'on_damaged' | 'on_proximity';
    reaction: 'flee' | 'attack' | 'bark';
    payload?: any;
}

export interface WorldNPC {
    id: string;
    slug: string;
    unlocked: boolean;
    locationId?: string; // Node ID where they are found
    relationships: string[]; // IDs of other NPCs
}

export interface WorldPopulation {
    mephits?: any[];
}

export interface WorldState {
    npcs: Record<string, WorldNPC>;
    unlockedNpcIds: string[];
    partyMemberIds: string[]; // IDs of NPCs currently in the active team (max 4)
    currentEnvironment: 'hub' | 'vpn';
    currentDimension?: string;
    activeMissionId?: string;
    activeNodeId?: string;
    persistentProps?: any[]; // For Quantum Persistence
    buildingPieces: BuildingPiece[];
    symbolicLinks: SymbolicLink[];
    population?: WorldPopulation;
    terrainConfig?: {
        seed: number;
        complexity: number;
        heightScale: number;
        octaves: number;
        heightmapUrl?: string;
        displacementScale?: number;
    };
    stashedPosition?: [number, number, number]; // [x, y, z] for dimension swaps
    stashedDimension?: string; // The origin dimension
    ontoWallet: {
        total: number; // Omni (🜋)
        coins: Record<string, number>; // The 9 Pillar Denominations
    };
    sessionData: {
        id: string; // The conversation UUID
        glyphs: string; // The 2-glyph SUA identifier
        concepts: { title: string; description: string }[]; // Harvested from JSON-LD
    };
    mountState: {
        isHorseSummoned: boolean;
        isMounted: boolean;
        horseType: number; // 1-5
        horsePosition?: [number, number, number];
    };
}

/**
 * WorldState.ts
 * Manages the global registry of Hexroll-generated entities.
 */
export const INITIAL_WORLD_STATE: WorldState = {
    npcs: {
        'talia': {
            id: 'talia',
            slug: 'npc.cleric.talia',
            unlocked: true,
            relationships: ['aelar'],
        },
        'aelar': {
            id: 'aelar',
            slug: 'npc.fighter.aelar',
            unlocked: true,
            relationships: ['talia'],
        }
    },
    unlockedNpcIds: ['talia', 'aelar'],
    partyMemberIds: ['talia', 'aelar'],
    currentEnvironment: 'hub',
    currentDimension: 'greenest', // Default to heroscape dimension for now
    persistentProps: [],
    buildingPieces: [],
    symbolicLinks: [],
    population: {
        mephits: []
    },
    terrainConfig: {
        seed: 42,
        complexity: 0.012,
        heightScale: 12.0,
        octaves: 3,
        displacementScale: 1.0
    },
    ontoWallet: {
        total: 0,
        coins: {
            '⚹': 0, '☿': 0, '🜔': 0, '🝩': 0, '🜄': 0, '🜏': 0, '☉': 0, '♀': 0, '🜍': 0
        }
    },
    sessionData: {
        id: 'session-001',
        glyphs: '⚎⚙',
        concepts: []
    },
    mountState: {
        isHorseSummoned: false,
        isMounted: false,
        horseType: 1
    }
};

/**
 * Helper to get the full character data for a world NPC.
 */
export const getFullCharacter = (npc: WorldNPC) => {
    return generateCharacterSheet(npc.slug);
};
