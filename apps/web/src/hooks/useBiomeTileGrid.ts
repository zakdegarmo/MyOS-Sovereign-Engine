/**
 * useBiomeTileGrid.ts
 * 
 * React hook that runs the WFC solver once on mount (or seed change),
 * caches the result in localStorage for offline/deterministic reuse,
 * and exposes the tile grid for the shader and feature overlays to query.
 */

import { useMemo, useCallback } from 'react';
import { solveWfc, type PlacedTile, type WfcConfig } from '../engine/WfcSolver';
import type { BiomeSeedHint } from '../engine/WfcSolver';

/** MACRO TILE SCALE: 16 five-foot squares × 1.524m = 24.384m per macro tile */
const FIVE_FOOT = 1.524;
const SQUARES_PER_MACRO = 16;
export const MACRO_TILE_SIZE = SQUARES_PER_MACRO * FIVE_FOOT; // ~24.384m

/** Edge blend width — outermost N 5ft squares lerp toward neighbor biome */
export const EDGE_BLEND_SQUARES = 2;
export const EDGE_BLEND_WIDTH = EDGE_BLEND_SQUARES * FIVE_FOOT; // ~3.05m

const GRID_COLS = 20;
const GRID_ROWS = 20;

export interface BiomeTileGrid {
    tiles: PlacedTile[];
    /** Get the placed tile at a given world X/Z position */
    getTileAt: (worldX: number, worldZ: number) => PlacedTile | null;
    /** Get the 4 neighboring tiles (N, S, E, W) of a tile at a world position */
    getNeighbors: (worldX: number, worldZ: number) => {
        N: PlacedTile | null;
        S: PlacedTile | null;
        E: PlacedTile | null;
        W: PlacedTile | null;
    };
    /**
     * Get the blended elevation at a world position.
     * Lerps between the home tile's amplitude and its neighbor's amplitude
     * based on distance-to-edge, giving smooth biome transitions.
     */
    getElevationAt: (worldX: number, worldZ: number) => number;
    /** Config used to generate this grid */
    config: WfcConfig;
}

function worldToGrid(
    worldX: number,
    worldZ: number,
    config: WfcConfig
): { col: number; row: number } {
    const col = Math.floor((worldX - config.originX + (GRID_COLS / 2) * MACRO_TILE_SIZE) / MACRO_TILE_SIZE);
    const row = Math.floor((worldZ - config.originZ + (GRID_ROWS / 2) * MACRO_TILE_SIZE) / MACRO_TILE_SIZE);
    return { col, row };
}

export function useBiomeTileGrid(seed: number = 42, seedHints: BiomeSeedHint[] = []): BiomeTileGrid {
    const config: WfcConfig = {
        cols: GRID_COLS,
        rows: GRID_ROWS,
        macroTileSize: MACRO_TILE_SIZE,
        originX: 0,
        originZ: 0,
        seed,
        seedHints,
    };

    const cacheKey = `wfc_grid_${seed}_${GRID_COLS}x${GRID_ROWS}`;

    const tiles = useMemo<PlacedTile[]>(() => {
        // Try to restore from localStorage for determinism + speed
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached) as PlacedTile[];
                if (Array.isArray(parsed) && parsed.length === GRID_COLS * GRID_ROWS) {
                    // Rehydrate tile references (JSON can't store functions)
                    return parsed;
                }
            }
        } catch {
            // Cache miss or corrupt — fall through to solve
        }

        const solved = solveWfc(config);

        try {
            localStorage.setItem(cacheKey, JSON.stringify(solved));
        } catch {
            // Storage full — continue without caching
        }

        return solved;
    }, [seed, cacheKey]);

    // Build a fast 2D lookup index
    const tileIndex = useMemo(() => {
        const idx: Record<string, PlacedTile> = {};
        for (const t of tiles) idx[`${t.col},${t.row}`] = t;
        return idx;
    }, [tiles]);

    const getTileAt = useCallback((worldX: number, worldZ: number): PlacedTile | null => {
        const { col, row } = worldToGrid(worldX, worldZ, config);
        return tileIndex[`${col},${row}`] ?? null;
    }, [tileIndex, config]);

    const getNeighbors = useCallback((worldX: number, worldZ: number) => {
        const { col, row } = worldToGrid(worldX, worldZ, config);
        return {
            N: tileIndex[`${col},${row - 1}`] ?? null,
            S: tileIndex[`${col},${row + 1}`] ?? null,
            E: tileIndex[`${col + 1},${row}`] ?? null,
            W: tileIndex[`${col - 1},${row}`] ?? null,
        };
    }, [tileIndex, config]);

    const getElevationAt = useCallback((worldX: number, worldZ: number): number => {
        const home = getTileAt(worldX, worldZ);
        if (!home) return 0;

        const homeAmp = home.tile.noiseProfile.amp;

        // Calculate position within the macro tile (0..1 on each axis)
        const localX = ((worldX - home.worldX) / MACRO_TILE_SIZE) + 0.5;
        const localZ = ((worldZ - home.worldZ) / MACRO_TILE_SIZE) + 0.5;

        // Edge blend factor — how close to each edge (0 = center, 1 = at edge)
        const edgeFrac = EDGE_BLEND_WIDTH / MACRO_TILE_SIZE;
        const blendE = Math.max(0, (localX - (1 - edgeFrac)) / edgeFrac);
        const blendW = Math.max(0, (edgeFrac - localX) / edgeFrac);
        const blendS = Math.max(0, (localZ - (1 - edgeFrac)) / edgeFrac);
        const blendN = Math.max(0, (edgeFrac - localZ) / edgeFrac);

        const neighbors = getNeighbors(worldX, worldZ);

        let blendedAmp = homeAmp;
        if (blendE > 0 && neighbors.E) blendedAmp = homeAmp * (1 - blendE) + neighbors.E.tile.noiseProfile.amp * blendE;
        if (blendW > 0 && neighbors.W) blendedAmp = homeAmp * (1 - blendW) + neighbors.W.tile.noiseProfile.amp * blendW;
        if (blendS > 0 && neighbors.S) blendedAmp = homeAmp * (1 - blendS) + neighbors.S.tile.noiseProfile.amp * blendS;
        if (blendN > 0 && neighbors.N) blendedAmp = homeAmp * (1 - blendN) + neighbors.N.tile.noiseProfile.amp * blendN;

        return blendedAmp;
    }, [getTileAt, getNeighbors]);

    return { tiles, getTileAt, getNeighbors, getElevationAt, config };
}
