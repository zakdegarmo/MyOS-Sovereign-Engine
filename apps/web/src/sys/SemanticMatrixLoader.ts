/**
 * SemanticMatrixLoader — Unified API for the Fractal Genome.
 * 
 * Bridges three data sources:
 *  1. fractalGenome.json      — Clean 10×10×10 terminal names
 *  2. FractalGenomeData.ts    — Unicode IDs + rationales for each terminal
 *  3. constants.ts            — RELATIONSHIPS matrix for verb lookups
 * 
 * Provides navigation, search, and hierarchical access.
 * 
 * Future: SUA (6 alchemical + 2 state Unicode) encoding will be layered
 * on top via SemanticAddress.ts integration.
 */

import { FRACTAL_GENOME_DATA, PILLAR_GLYPHS, type TerminalNode } from '../Omni/data/FractalGenomeData';
import { RELATIONSHIPS } from '../Omni/constants';

// ─── Genome Data (inline to avoid JSON module resolution issues) ─
// This is the canonical 10×10×10 structure of terminal names.
// Source: The complete Fractal Genome from Mystra Nexus alpha.
import fractalGenome from '../Omni/data/fractalGenome.json';

// ─── Types ──────────────────────────────────────────────────────
export type PillarName =
    | 'Self' | 'Thought' | 'Logic' | 'Unity' | 'Existence'
    | 'Improvement' | 'Mastery' | 'Resonance' | 'Transcendence' | 'Omni';

type GenomeData = Record<string, Record<string, string[]>>;

export interface GenomeAddress {
    pillar: string;
    pillarIndex: number;
    relationship: string;
    relationshipIndex: number;
    terminal: string;
    terminalIndex: number;
    /** Dewey-style code: "123" = pillar 1, relationship 2, terminal 3 */
    deweyCode: string;
    /** Unicode glyph for the pillar */
    glyph: string;
    /** Relationship verb from the RELATIONSHIPS matrix */
    verb: string;
    /** The rich TerminalNode with id, name, rationale (if available) */
    richNode?: TerminalNode;
}

// ─── Constants ──────────────────────────────────────────────────
const PILLAR_ORDER: PillarName[] = [
    'Self', 'Thought', 'Logic', 'Unity', 'Existence',
    'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'
];

const PILLAR_TO_DDC_ORDER: string[] = [
    'Omni',          // 0 -> 000
    'Self',           // 1 -> 100
    'Thought',        // 2 -> 200
    'Logic',          // 3 -> 300
    'Unity',          // 4 -> 400
    'Existence',      // 5 -> 500
    'Improvement',    // 6 -> 600
    'Mastery',        // 7 -> 700
    'Resonance',      // 8 -> 800
    'Transcendence',  // 9 -> 900
];

// ─── Loader Class ───────────────────────────────────────────────
export class SemanticMatrixLoader {
    private genome: GenomeData;
    private cache: Map<string, GenomeAddress> = new Map();

    constructor() {
        this.genome = fractalGenome as GenomeData;
    }

    /** Get all 10 pillar names in canonical order */
    getPillars(): PillarName[] {
        return [...PILLAR_ORDER];
    }

    /** Get the 10 relationship names for a given pillar */
    getRelationships(pillar: string): string[] {
        const p = this.genome[pillar];
        return p ? Object.keys(p) : [];
    }

    /** Get the 10 terminal names for a given pillar+relationship */
    getTerminals(pillar: string, relationship: string): string[] {
        const p = this.genome[pillar];
        if (!p) return [];
        return p[relationship] || [];
    }

    /** Navigate by dot-notation: "Self.Identity.Ego" → GenomeAddress */
    navigate(path: string): GenomeAddress | null {
        if (this.cache.has(path)) return this.cache.get(path)!;

        const parts = path.split('.');
        if (parts.length < 1 || parts.length > 3) return null;

        const pillar = parts[0];
        const pIdx = PILLAR_ORDER.indexOf(pillar as PillarName);
        if (pIdx === -1) return null;

        if (parts.length === 1) {
            const addr: GenomeAddress = {
                pillar, pillarIndex: pIdx,
                relationship: '', relationshipIndex: -1,
                terminal: '', terminalIndex: -1,
                deweyCode: `${pIdx}`,
                glyph: PILLAR_GLYPHS[pillar] || '?',
                verb: '',
            };
            this.cache.set(path, addr);
            return addr;
        }

        const relationship = parts[1];
        const rels = this.getRelationships(pillar);
        const rIdx = rels.indexOf(relationship);
        if (rIdx === -1) return null;

        // Get the verb from the RELATIONSHIPS matrix
        const verb = RELATIONSHIPS?.[pIdx]?.[rIdx] || relationship;

        if (parts.length === 2) {
            const addr: GenomeAddress = {
                pillar, pillarIndex: pIdx,
                relationship, relationshipIndex: rIdx,
                terminal: '', terminalIndex: -1,
                deweyCode: `${pIdx}${rIdx}`,
                glyph: PILLAR_GLYPHS[pillar] || '?',
                verb: String(verb),
            };
            this.cache.set(path, addr);
            return addr;
        }

        const terminal = parts[2];
        const terms = this.getTerminals(pillar, relationship);
        const tIdx = terms.indexOf(terminal);
        if (tIdx === -1) return null;

        // Try to find the rich node from FractalGenomeData
        let richNode: TerminalNode | undefined;
        const pillarData = FRACTAL_GENOME_DATA[pillar];
        if (pillarData) {
            // FractalGenomeData uses the target pillar name as the matrix key
            const matrixKey = PILLAR_ORDER[rIdx];
            const nodes = pillarData[matrixKey];
            if (nodes && nodes[tIdx]) {
                richNode = nodes[tIdx];
            }
        }

        const addr: GenomeAddress = {
            pillar, pillarIndex: pIdx,
            relationship, relationshipIndex: rIdx,
            terminal, terminalIndex: tIdx,
            deweyCode: `${pIdx}${rIdx}${tIdx}`,
            glyph: PILLAR_GLYPHS[pillar] || '?',
            verb: String(verb),
            richNode,
        };
        this.cache.set(path, addr);
        return addr;
    }

    /** Get a flat list of all 1000 terminal addresses */
    getAllTerminals(): GenomeAddress[] {
        const result: GenomeAddress[] = [];
        for (const pillar of PILLAR_ORDER) {
            const rels = this.getRelationships(pillar);
            for (const rel of rels) {
                const terms = this.getTerminals(pillar, rel);
                for (const term of terms) {
                    const addr = this.navigate(`${pillar}.${rel}.${term}`);
                    if (addr) result.push(addr);
                }
            }
        }
        return result;
    }

    /** Search terminals by name (case-insensitive, partial match) */
    search(query: string): GenomeAddress[] {
        const q = query.toLowerCase();
        return this.getAllTerminals().filter(a =>
            a.terminal.toLowerCase().includes(q) ||
            a.relationship.toLowerCase().includes(q) ||
            a.pillar.toLowerCase().includes(q)
        );
    }

    /** Get all descendants of a pillar as a tree structure */
    getSubtree(pillar: string): { relationship: string; terminals: string[] }[] {
        const rels = this.getRelationships(pillar);
        return rels.map(r => ({
            relationship: r,
            terminals: this.getTerminals(pillar, r),
        }));
    }

    /** Total node count at each depth */
    get stats() {
        const relCount = PILLAR_ORDER.reduce(
            (sum: number, p: string) => sum + this.getRelationships(p).length, 0
        );
        const termCount = this.getAllTerminals().length;
        return {
            pillars: PILLAR_ORDER.length,
            relationships: relCount,
            terminals: termCount,
            totalNodes: PILLAR_ORDER.length + relCount + termCount,
        };
    }

    /** Get DDC-aligned code for a given pillar */
    getDeweyClass(pillar: string): string {
        const idx = PILLAR_TO_DDC_ORDER.indexOf(pillar);
        return idx >= 0 ? `${idx}00` : '???';
    }
}

// Singleton export
export const semanticMatrix = new SemanticMatrixLoader();
