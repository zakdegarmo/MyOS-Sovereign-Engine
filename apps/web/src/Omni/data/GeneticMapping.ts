import { FRACTAL_GENOME_DATA, type TerminalNode } from '../data/FractalGenomeData';

/**
 * Maps the Genetic Atoms (Fractal Genome) to the Dewey Decimal System.
 * 
 * Mapping Logic:
 * Pillar Index (0-9) corresponds to the 000-900 Dewey Classes.
 * Matrix within Pillar maps to the 10s (Divisions).
 * Terminal Node index maps to the 1s (Sections).
 */

export interface GeneticDeweyMap {
    atom: TerminalNode;
    deweyCode: string;
    pillar: string;
    matrix: string;
}

const PILLAR_ORDER = [
    "Omnipotence", // 0 -> 000
    "Self",        // 1 -> 100
    "Thought",     // 2 -> 200
    "Logic",       // 3 -> 300
    "Unity",       // 4 -> 400 (Maps to Conjunction/Connection)
    "Existence",   // 5 -> 500
    "Improvement", // 6 -> 600
    "Mastery",     // 7 -> 700
    "Resonance",   // 8 -> 800
    "Transcendence"// 9 -> 900
];

export const getGeneticMapping = (): GeneticDeweyMap[] => {
    const mappings: GeneticDeweyMap[] = [];

    PILLAR_ORDER.forEach((pillar, pIdx) => {
        const pillarData = FRACTAL_GENOME_DATA[pillar];
        if (!pillarData) return;

        const matrices = Object.keys(pillarData);
        matrices.forEach((matrix, mIdx) => {
            const atoms = pillarData[matrix];
            atoms.forEach((atom, aIdx) => {
                const deweyCode = `${pIdx}${mIdx}${aIdx}`;
                mappings.push({
                    atom,
                    deweyCode,
                    pillar,
                    matrix
                });
            });
        });
    });

    return mappings;
};

export const getAtomByDewey = (code: string): GeneticDeweyMap | undefined => {
    const all = getGeneticMapping();
    return all.find(m => m.deweyCode === code);
};

export const getDeweyByAtomId = (atomId: string): string | undefined => {
    const all = getGeneticMapping();
    return all.find(m => m.atom.id === atomId)?.deweyCode;
};
