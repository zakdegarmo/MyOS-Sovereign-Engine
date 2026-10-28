/**
 * BiomeTileSystem.ts
 * 
 * Defines the complete tile vocabulary for the WFC (Wave Function Collapse) biome
 * system. Each tile has typed edge sockets that constrain which tiles may be placed
 * adjacent to it, ensuring smooth biome transitions across macro-tile boundaries.
 * 
 * MACRO TILE SCALE: 16×16 five-foot squares = ~24.4m per macro tile.
 */

export type SocketType =
    | 'OCEAN'
    | 'COAST'
    | 'PLAINS'
    | 'FOREST'
    | 'MOUNTAIN'
    | 'DESERT'
    | 'RIVER'
    | 'ROAD'
    | 'CLIFF';

export interface TileSockets {
    N: SocketType;
    S: SocketType;
    E: SocketType;
    W: SocketType;
}

export interface NoiseProfile {
    /** Base elevation amplitude (units) */
    amp: number;
    /** Noise frequency multiplier */
    freq: number;
    /** Number of fractal octaves (higher = more rugged detail) */
    octaves?: number;
    /** Variance per tile for natural randomness */
    ampVariance?: number;
}

export type FeatureType = 'trees' | 'rocks' | 'ruins' | 'flowers' | 'mushrooms' | 'boulders';

export interface BiomeTile {
    id: string;
    /** Typed edge sockets for WFC constraint matching */
    sockets: TileSockets;
    /** Controls the vertex shader noise for this tile's biome */
    noiseProfile: NoiseProfile;
    /** Which surface texture to use in the fragment shader */
    surfaceTexture: 'mud' | 'sand' | 'grass' | 'stone' | 'snow' | 'water';
    /** Small decorative 3D objects that can spawn on this tile */
    featureSet?: FeatureType[];
    /** WFC selection weight — rarer tiles have lower weight */
    weight: number;
    // Feature flags
    isCity?: boolean;
    isDungeon?: boolean;
    isRiver?: boolean;
    isRoad?: boolean;
    isCliff?: boolean;
    isOcean?: boolean;
    /** Optional city/POI label — overridden by faerun_pois.json at runtime */
    label?: string;
}

/**
 * The complete tile vocabulary.
 * All edge socket pairs must be symmetric — if tile A has socket X on its East edge,
 * only tiles with socket X on their West edge may be placed to its East.
 */
export const BIOME_TILES: BiomeTile[] = [
    // ─── OCEAN ────────────────────────────────────────────────────────────────
    {
        id: 'deep_ocean',
        sockets: { N: 'OCEAN', S: 'OCEAN', E: 'OCEAN', W: 'OCEAN' },
        noiseProfile: { amp: -18, freq: 0.003, octaves: 2, ampVariance: 2 },
        surfaceTexture: 'mud',
        weight: 8,
        isOcean: true,
    },
    {
        id: 'ocean_coast_n',
        sockets: { N: 'COAST', S: 'OCEAN', E: 'OCEAN', W: 'OCEAN' },
        noiseProfile: { amp: -8, freq: 0.005, octaves: 2 },
        surfaceTexture: 'sand',
        weight: 4,
        isOcean: true,
    },

    // ─── COAST ────────────────────────────────────────────────────────────────
    {
        id: 'coast',
        sockets: { N: 'COAST', S: 'COAST', E: 'COAST', W: 'COAST' },
        noiseProfile: { amp: -2, freq: 0.008, octaves: 2, ampVariance: 1 },
        surfaceTexture: 'sand',
        featureSet: ['rocks'],
        weight: 5,
    },
    {
        id: 'coast_to_plains_n',
        sockets: { N: 'PLAINS', S: 'COAST', E: 'COAST', W: 'COAST' },
        noiseProfile: { amp: 1, freq: 0.01, octaves: 3 },
        surfaceTexture: 'sand',
        featureSet: ['rocks'],
        weight: 3,
    },

    // ─── PLAINS ───────────────────────────────────────────────────────────────
    {
        id: 'plains',
        sockets: { N: 'PLAINS', S: 'PLAINS', E: 'PLAINS', W: 'PLAINS' },
        noiseProfile: { amp: 2, freq: 0.015, octaves: 3, ampVariance: 1 },
        surfaceTexture: 'grass',
        featureSet: ['flowers'],
        weight: 12,
    },
    {
        id: 'plains_to_forest_n',
        sockets: { N: 'FOREST', S: 'PLAINS', E: 'PLAINS', W: 'PLAINS' },
        noiseProfile: { amp: 3, freq: 0.018, octaves: 3 },
        surfaceTexture: 'grass',
        featureSet: ['trees', 'flowers'],
        weight: 4,
    },
    {
        id: 'plains_to_desert_e',
        sockets: { N: 'PLAINS', S: 'PLAINS', E: 'DESERT', W: 'PLAINS' },
        noiseProfile: { amp: 2, freq: 0.012, octaves: 2 },
        surfaceTexture: 'sand',
        weight: 3,
    },

    // ─── FOREST ───────────────────────────────────────────────────────────────
    {
        id: 'forest',
        sockets: { N: 'FOREST', S: 'FOREST', E: 'FOREST', W: 'FOREST' },
        noiseProfile: { amp: 5, freq: 0.02, octaves: 4, ampVariance: 2 },
        surfaceTexture: 'grass',
        featureSet: ['trees', 'rocks', 'mushrooms'],
        weight: 10,
    },
    {
        id: 'forest_to_mountain_n',
        sockets: { N: 'MOUNTAIN', S: 'FOREST', E: 'FOREST', W: 'FOREST' },
        noiseProfile: { amp: 10, freq: 0.03, octaves: 4 },
        surfaceTexture: 'stone',
        featureSet: ['trees', 'boulders'],
        weight: 4,
    },
    {
        id: 'deep_forest',
        sockets: { N: 'FOREST', S: 'FOREST', E: 'FOREST', W: 'FOREST' },
        noiseProfile: { amp: 6, freq: 0.022, octaves: 4, ampVariance: 3 },
        surfaceTexture: 'grass',
        featureSet: ['trees', 'ruins', 'mushrooms'],
        weight: 5,
    },

    // ─── MOUNTAIN ─────────────────────────────────────────────────────────────
    {
        id: 'mountain_foothills',
        sockets: { N: 'MOUNTAIN', S: 'FOREST', E: 'MOUNTAIN', W: 'MOUNTAIN' },
        noiseProfile: { amp: 18, freq: 0.035, octaves: 5 },
        surfaceTexture: 'stone',
        featureSet: ['boulders', 'rocks'],
        weight: 5,
    },
    {
        id: 'mountain_peak',
        sockets: { N: 'MOUNTAIN', S: 'MOUNTAIN', E: 'MOUNTAIN', W: 'MOUNTAIN' },
        noiseProfile: { amp: 40, freq: 0.05, octaves: 6, ampVariance: 8 },
        surfaceTexture: 'snow',
        featureSet: ['rocks'],
        weight: 4,
    },
    {
        id: 'mountain_valley',
        sockets: { N: 'MOUNTAIN', S: 'MOUNTAIN', E: 'MOUNTAIN', W: 'MOUNTAIN' },
        noiseProfile: { amp: 20, freq: 0.04, octaves: 5 },
        surfaceTexture: 'stone',
        featureSet: ['rocks', 'boulders'],
        weight: 3,
    },

    // ─── DESERT ───────────────────────────────────────────────────────────────
    {
        id: 'desert',
        sockets: { N: 'DESERT', S: 'DESERT', E: 'DESERT', W: 'DESERT' },
        noiseProfile: { amp: 6, freq: 0.01, octaves: 2, ampVariance: 2 },
        surfaceTexture: 'sand',
        featureSet: ['rocks'],
        weight: 6,
    },
    {
        id: 'desert_dunes',
        sockets: { N: 'DESERT', S: 'DESERT', E: 'DESERT', W: 'DESERT' },
        noiseProfile: { amp: 10, freq: 0.008, octaves: 3 },
        surfaceTexture: 'sand',
        weight: 4,
    },

    // ─── RIVER ────────────────────────────────────────────────────────────────
    {
        id: 'river_ew',
        sockets: { N: 'PLAINS', S: 'PLAINS', E: 'RIVER', W: 'RIVER' },
        noiseProfile: { amp: -3, freq: 0.0, octaves: 1 },
        surfaceTexture: 'mud',
        weight: 3,
        isRiver: true,
    },
    {
        id: 'river_ns',
        sockets: { N: 'RIVER', S: 'RIVER', E: 'PLAINS', W: 'PLAINS' },
        noiseProfile: { amp: -3, freq: 0.0, octaves: 1 },
        surfaceTexture: 'mud',
        weight: 3,
        isRiver: true,
    },
    {
        id: 'river_bend_ne',
        sockets: { N: 'RIVER', S: 'PLAINS', E: 'RIVER', W: 'PLAINS' },
        noiseProfile: { amp: -3, freq: 0.0, octaves: 1 },
        surfaceTexture: 'mud',
        weight: 2,
        isRiver: true,
    },
    {
        id: 'river_bend_nw',
        sockets: { N: 'RIVER', S: 'PLAINS', E: 'PLAINS', W: 'RIVER' },
        noiseProfile: { amp: -3, freq: 0.0, octaves: 1 },
        surfaceTexture: 'mud',
        weight: 2,
        isRiver: true,
    },
    {
        id: 'river_mouth',
        sockets: { N: 'RIVER', S: 'OCEAN', E: 'COAST', W: 'COAST' },
        noiseProfile: { amp: -5, freq: 0.0, octaves: 1 },
        surfaceTexture: 'mud',
        weight: 1,
        isRiver: true,
    },

    // ─── ROAD ─────────────────────────────────────────────────────────────────
    {
        id: 'road_ew',
        sockets: { N: 'PLAINS', S: 'PLAINS', E: 'ROAD', W: 'ROAD' },
        noiseProfile: { amp: 1, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        weight: 3,
        isRoad: true,
    },
    {
        id: 'road_ns',
        sockets: { N: 'ROAD', S: 'ROAD', E: 'PLAINS', W: 'PLAINS' },
        noiseProfile: { amp: 1, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        weight: 3,
        isRoad: true,
    },

    // ─── CITY ─────────────────────────────────────────────────────────────────
    {
        id: 'city',
        sockets: { N: 'ROAD', S: 'ROAD', E: 'ROAD', W: 'ROAD' },
        noiseProfile: { amp: 0, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        weight: 1,
        isCity: true,
    },

    // ─── DUNGEON ──────────────────────────────────────────────────────────────
    {
        id: 'dungeon',
        sockets: { N: 'FOREST', S: 'FOREST', E: 'FOREST', W: 'FOREST' },
        noiseProfile: { amp: -5, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        featureSet: ['ruins', 'rocks'],
        weight: 1,
        isDungeon: true,
    },

    // ─── CLIFF ────────────────────────────────────────────────────────────────
    {
        id: 'cliff_ns',
        sockets: { N: 'MOUNTAIN', S: 'PLAINS', E: 'CLIFF', W: 'CLIFF' },
        noiseProfile: { amp: 20, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        weight: 2,
        isCliff: true,
    },
    {
        id: 'cliff_ew',
        sockets: { N: 'CLIFF', S: 'CLIFF', E: 'MOUNTAIN', W: 'PLAINS' },
        noiseProfile: { amp: 20, freq: 0.0, octaves: 1 },
        surfaceTexture: 'stone',
        weight: 2,
        isCliff: true,
    },
];

/** Lookup table: given a socket type, which socket types are compatible on the opposing edge? */
export const SOCKET_COMPATIBILITY: Record<SocketType, SocketType[]> = {
    OCEAN:    ['OCEAN', 'COAST'],
    COAST:    ['COAST', 'OCEAN', 'PLAINS'],
    PLAINS:   ['PLAINS', 'COAST', 'FOREST', 'DESERT', 'RIVER', 'ROAD', 'CLIFF'],
    FOREST:   ['FOREST', 'PLAINS', 'MOUNTAIN'],
    MOUNTAIN: ['MOUNTAIN', 'FOREST', 'CLIFF'],
    DESERT:   ['DESERT', 'PLAINS'],
    RIVER:    ['RIVER', 'OCEAN', 'COAST'],
    ROAD:     ['ROAD', 'PLAINS'],
    CLIFF:    ['CLIFF', 'MOUNTAIN', 'PLAINS'],
};

/** Build a map from tile id to tile definition for O(1) lookup */
export const TILE_MAP: Record<string, BiomeTile> = Object.fromEntries(
    BIOME_TILES.map(t => [t.id, t])
);
