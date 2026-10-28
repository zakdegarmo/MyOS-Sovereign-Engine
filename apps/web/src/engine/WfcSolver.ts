/**
 * WfcSolver.ts
 * 
 * A typed Wave Function Collapse (WFC) solver for the Faerun biome grid.
 * 
 * ALGORITHM:
 * 1. Initialize every cell as a superposition of all possible tile IDs.
 * 2. Optionally seed specific cells from a biome hint map (Toril TIF analysis).
 * 3. Loop:
 *    a. Find the uncollapsed cell with minimum entropy (fewest remaining options).
 *    b. Collapse it by randomly selecting one option (weighted by tile.weight).
 *    c. Propagate: remove incompatible tiles from all 4 neighbors' superpositions.
 *    d. If any cell's superposition empties → contradiction → backtrack (or re-seed).
 * 4. Return the fully collapsed 2D grid of PlacedTile objects.
 * 
 * GRID SCALE: 16×16 five-foot squares per macro tile, ~24.4m per macro tile.
 */

import {
    BIOME_TILES,
    SOCKET_COMPATIBILITY,
    TILE_MAP,
    type BiomeTile,
    type SocketType,
} from './BiomeTileSystem';

export interface PlacedTile {
    tileId: string;
    tile: BiomeTile;
    /** Grid column index */
    col: number;
    /** Grid row index */
    row: number;
    /** World-space center X coordinate */
    worldX: number;
    /** World-space center Z coordinate */
    worldZ: number;
    /** Random variation seed for feature placement */
    featureSeed: number;
}

export interface BiomeSeedHint {
    col: number;
    row: number;
    /** Force-collapse this cell to the given socket type */
    dominantSocket: SocketType;
}

export interface WfcConfig {
    /** Number of macro tiles across each axis (grid will be cols × rows) */
    cols: number;
    rows: number;
    /** Size of one macro tile in world units (16 × 1.524 = ~24.38m) */
    macroTileSize: number;
    /** World-space origin (center of the grid) */
    originX: number;
    originZ: number;
    /** Random seed for reproducible generation */
    seed: number;
    /** Optional per-cell biome hints from the Toril map analysis */
    seedHints?: BiomeSeedHint[];
}

// ─── Seeded LCG PRNG ──────────────────────────────────────────────────────────
class SeededRng {
    private state: number;
    constructor(seed: number) { this.state = seed | 0; }
    next(): number {
        this.state = (Math.imul(this.state, 1664525) + 1013904223) | 0;
        return (this.state >>> 0) / 0xFFFFFFFF;
    }
    nextInt(max: number): number { return Math.floor(this.next() * max); }
    pick<T>(arr: T[]): T { return arr[this.nextInt(arr.length)]; }
}

// ─── Cell superposition ───────────────────────────────────────────────────────
interface Cell {
    /** Remaining possible tile IDs */
    options: string[];
    /** True once collapsed to a single tile */
    collapsed: boolean;
    col: number;
    row: number;
}

function entropy(cell: Cell): number {
    return cell.options.length;
}

/** Remove tile options from a cell that are incompatible with the given socket on the given side */
function constrain(cell: Cell, side: 'N' | 'S' | 'E' | 'W', allowedSockets: SocketType[]): boolean {
    const before = cell.options.length;
    cell.options = cell.options.filter(id => {
        const tile = TILE_MAP[id];
        return allowedSockets.includes(tile.sockets[side]);
    });
    return cell.options.length < before; // returns true if something was removed
}

const OPPOSITE: Record<'N' | 'S' | 'E' | 'W', 'N' | 'S' | 'E' | 'W'> = {
    N: 'S', S: 'N', E: 'W', W: 'E',
};

const DIRECTIONS: Array<{ dir: 'N' | 'S' | 'E' | 'W'; dCol: number; dRow: number }> = [
    { dir: 'N', dCol: 0, dRow: -1 },
    { dir: 'S', dCol: 0, dRow: 1 },
    { dir: 'E', dCol: 1, dRow: 0 },
    { dir: 'W', dCol: -1, dRow: 0 },
];

// ─── Main solver ──────────────────────────────────────────────────────────────
export function solveWfc(config: WfcConfig): PlacedTile[] {
    const { cols, rows, macroTileSize, originX, originZ, seed, seedHints = [] } = config;
    const rng = new SeededRng(seed);
    const allTileIds = BIOME_TILES.map(t => t.id);

    // Initialize grid
    const grid: Cell[][] = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
            options: [...allTileIds],
            collapsed: false,
            col,
            row,
        }))
    );

    const getCell = (col: number, row: number): Cell | null =>
        (col >= 0 && col < cols && row >= 0 && row < rows) ? grid[row][col] : null;

    // Apply biome seed hints — collapse hinted cells first
    for (const hint of seedHints) {
        const cell = getCell(hint.col, hint.row);
        if (!cell) continue;
        // Keep only tiles whose majority socket matches the hint
        const filtered = cell.options.filter(id => {
            const t = TILE_MAP[id];
            const sockets = Object.values(t.sockets) as SocketType[];
            return sockets.filter(s => s === hint.dominantSocket).length >= 2;
        });
        if (filtered.length > 0) cell.options = filtered;
    }

    // Weighted random collapse
    function collapseCell(cell: Cell): void {
        const totalWeight = cell.options.reduce((sum, id) => sum + TILE_MAP[id].weight, 0);
        let r = rng.next() * totalWeight;
        let chosen = cell.options[cell.options.length - 1];
        for (const id of cell.options) {
            r -= TILE_MAP[id].weight;
            if (r <= 0) { chosen = id; break; }
        }
        cell.options = [chosen];
        cell.collapsed = true;
    }

    // Constraint propagation (BFS)
    function propagate(startCol: number, startRow: number): void {
        const queue: Array<[number, number]> = [[startCol, startRow]];
        while (queue.length > 0) {
            const [col, row] = queue.shift()!;
            const cell = getCell(col, row)!;
            for (const { dir, dCol, dRow } of DIRECTIONS) {
                const neighbor = getCell(col + dCol, row + dRow);
                if (!neighbor || neighbor.collapsed) continue;
                // Build the set of sockets that this cell allows on the `dir` side
                const allowedOnNeighborSide = new Set<SocketType>();
                for (const id of cell.options) {
                    const tileSocket = TILE_MAP[id].sockets[dir];
                    for (const compatible of SOCKET_COMPATIBILITY[tileSocket]) {
                        allowedOnNeighborSide.add(compatible);
                    }
                }
                const changed = constrain(neighbor, OPPOSITE[dir], [...allowedOnNeighborSide]);
                if (changed) queue.push([col + dCol, row + dRow]);
                // If neighbor collapsed to 1, mark it
                if (neighbor.options.length === 1) neighbor.collapsed = true;
                // Contradiction safety: restore to plains if empty
                if (neighbor.options.length === 0) {
                    neighbor.options = allTileIds.filter(id => TILE_MAP[id].id === 'plains');
                }
            }
        }
    }

    // Main WFC loop
    let iterations = 0;
    const maxIterations = cols * rows * 2;
    while (iterations++ < maxIterations) {
        // Find uncollapsed cell with minimum entropy
        let minEntropy = Infinity;
        let target: Cell | null = null;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = grid[r][c];
                if (cell.collapsed) continue;
                const e = entropy(cell) + rng.next() * 0.01; // tie-break noise
                if (e < minEntropy) { minEntropy = e; target = cell; }
            }
        }
        if (!target) break; // All collapsed
        collapseCell(target);
        propagate(target.col, target.row);
    }

    // Convert to PlacedTile array
    const result: PlacedTile[] = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = grid[row][col];
            const tileId = cell.options[0] ?? 'plains';
            const tile = TILE_MAP[tileId] ?? TILE_MAP['plains'];
            const worldX = originX + (col - cols / 2 + 0.5) * macroTileSize;
            const worldZ = originZ + (row - rows / 2 + 0.5) * macroTileSize;
            result.push({
                tileId,
                tile,
                col,
                row,
                worldX,
                worldZ,
                featureSeed: rng.next() * 1000,
            });
        }
    }

    return result;
}
