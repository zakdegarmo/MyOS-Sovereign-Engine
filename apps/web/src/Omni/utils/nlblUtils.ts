import type { GemId } from '@Omni/types';

/**
 * Non-Linear-Base-Logic (NLBL) Utility
 * 
 * In this system, addresses are not sequential but resonant.
 * Every piece of content (thought, code, memory) is mapped to a 
 * 10D coordinate space corresponding to the 10 Council Agents.
 */

export interface NLBLCoordinate {
    [key: string]: number; // Map of GemId -> Resonant Value (0.0 to 1.0)
}

export class NLBLMapper {
    private static COUNCIL_ORDER: GemId[] = [
        'Self', 'Thought', 'Logic', 'Unity',
        'Existence', 'Improvement', 'Mastery',
        'Resonance', 'Transcendence', 'Omni'
    ];

    /**
     * Maps a string hash (e.g. SHA-256) to a resonant coordinate.
     */
    public static mapToCoordinate(hash: string): NLBLCoordinate {
        const coords: NLBLCoordinate = {};

        // Use segments of the hash to Determine resonance for each agent
        for (let i = 0; i < this.COUNCIL_ORDER.length; i++) {
            const agent = this.COUNCIL_ORDER[i];
            const hexSegment = hash.substr(i * 4, 4) || "0000";
            const val = parseInt(hexSegment, 16) / 65535; // Normalize 0-1
            coords[agent] = val;
        }

        return coords;
    }

    /**
     * Calculates the "Resonance Distance" between two coordinates.
     * In NLBL, distance is not just Euclidean; it's semantic affinity.
     */
    public static getDistance(a: NLBLCoordinate, b: NLBLCoordinate): number {
        let sum = 0;
        for (const agent of this.COUNCIL_ORDER) {
            sum += Math.pow((a[agent] || 0) - (b[agent] || 0), 2);
        }
        return Math.sqrt(sum);
    }
}
