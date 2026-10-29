import * as THREE from 'three';
import type { FloorConfig } from '../components/MaxOverlay/types';

// Battleship Grid Logic: 10x10 (A-J columns, 1-10 rows)
export const GRID_SIZE = 10;
export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export interface GridCoordinate {
    col: number; // 0-9 (A-J)
    row: number; // 0-9 (1-10)
}

// Semantic Pillar Order for Relation Matrix mapping
export const PILLAR_ORDER = [
    'Self', 'Thought', 'Logic', 'Unity', 'Existence',
    'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'
];

/**
 * BattleshipGrid Utility
 * Translates semantic coordinates like "A1" or "J10" into 3D Vector3 positions
 * relative to a centered floor configuration, and maps them to the Relationship Matrix.
 */
export class BattleshipGrid {
    /**
     * Parse a coordinate string like "A1" into column and row indices
     */
    static parse(coord: string): GridCoordinate | null {
        const match = coord.match(/^([A-J])(10|[1-9])$/i);
        if (!match) return null;

        const colStr = match[1].toUpperCase();
        const rowStr = match[2];

        // Column maps to Pillar Index (A=0, J=9)
        const col = COLS.indexOf(colStr);
        // Row string 1-10 maps to Index 0-9
        const row = parseInt(rowStr, 10) - 1;

        return { col, row };
    }

    /**
     * Get 3D position for a grid coordinate given floor dimensions
     */
    static getPosition(coord: string | GridCoordinate, config: FloorConfig): THREE.Vector3 | null {
        let gridCoord: GridCoordinate | null = null;

        if (typeof coord === 'string') {
            gridCoord = this.parse(coord);
        } else {
            gridCoord = coord;
        }

        if (!gridCoord) return null;

        const { width, depth } = config;
        const cellWidth = width / GRID_SIZE;
        const cellDepth = depth / GRID_SIZE;

        // Alignment logic matching GridFloor.tsx:
        // Top-Left corner is (-width/2, -depth/2).
        // X: Columns (A-J) move Left to Right
        const x = -width / 2 + (gridCoord.col * cellWidth) + (cellWidth / 2);

        // Z: Rows (1-10) move Top to Bottom (Forward to Back in 3D)
        const z = -depth / 2 + (gridCoord.row * cellDepth) + (cellDepth / 2);

        return new THREE.Vector3(x, 0, z);
    }

    /**
     * Get Semantic Context for a coordinate (Relationship Matrix mapping)
     * e.g. A2 -> { pillar: 'Self', subPillar: 'Thought', relation: 'Subject Of' }
     */
    static getSemanticContext(coord: string) {
        const parsed = this.parse(coord);
        if (!parsed) return null;

        const pillar = PILLAR_ORDER[parsed.col];
        const subPillar = PILLAR_ORDER[parsed.row];

        return {
            pillar,
            subPillar,
            coordinate: coord.toUpperCase()
        };
    }

    /**
     * Get the coordinate string back from col/row
     */
    static toString(coord: GridCoordinate): string {
        return `${COLS[coord.col]}${coord.row + 1}`;
    }
}
