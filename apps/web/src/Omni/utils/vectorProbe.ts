import { RELATIONSHIPS, COUNCIL } from '@Omni/constants';
import type { GemId } from '@Omni/types';

/**
 * The Ontological Vector Probe
 * Maps a static DDC number to dynamic Council Vectors.
 */

const DDC_TO_GEM: Record<string, GemId> = {
    '0': 'Omni',
    '1': 'Self',
    '2': 'Thought',
    '3': 'Logic',
    '4': 'Unity',
    '5': 'Existence',
    '6': 'Improvement',
    '7': 'Mastery',
    '8': 'Resonance',
    '9': 'Transcendence'
};

export interface VectorProfile {
    ddc: string;
    gem: { id: GemId; name: string };
    inputs: { source: GemId; relation: string }[];  // Forces acting ON this knowledge
    outputs: { target: GemId; relation: string }[]; // Where this knowledge FLOWS
    resonance: { target: GemId; relation: string }[]; // Pure harmonics
}

export const probeVectors = (ddcNumber: string): VectorProfile | null => {
    // 1. Identify the Container
    const hundredsDigit = ddcNumber.charAt(0);
    const gemId = DDC_TO_GEM[hundredsDigit];

    if (!gemId || !COUNCIL[gemId]) return null;

    const profile: VectorProfile = {
        ddc: ddcNumber,
        gem: { id: gemId, name: COUNCIL[gemId].name },
        inputs: [],
        outputs: [],
        resonance: []
    };

    // 2. Calculate Vectors based on the Matrix
    // RELATIONSHIPS[Source][Target] = "Description"

    // OUTPUTS: Relationships WHERE Source == This Gem
    const outMap = RELATIONSHIPS[gemId];
    if (outMap) {
        Object.entries(outMap).forEach(([target, desc]) => {
            if (target === gemId) return; // Self-reflection is internal

            // Categorize vector types
            if (['Resonance', 'Unity', 'Transcendence'].includes(target)) {
                profile.resonance.push({ target: target as GemId, relation: desc });
            } else {
                profile.outputs.push({ target: target as GemId, relation: desc });
            }
        });
    }

    // INPUTS: Relationships WHERE Target == This Gem
    // We have to iterate the whole matrix to find who points AT us
    Object.entries(RELATIONSHIPS).forEach(([sourceId, relations]) => {
        if (sourceId === gemId) return;

        const relationToUs = relations[gemId as GemId];
        if (relationToUs) {
            profile.inputs.push({ source: sourceId as GemId, relation: relationToUs });
        }
    });

    return profile;
};

// --- EXPERIMENT RUNNER (Uncomment to run in isolation) ---
// const testNums = ['100', '523', '600', '900'];
// testNums.forEach(num => {
//     console.log(`\n--- PROBE REPORT: ${num} ---`);
//     console.log(JSON.stringify(probeVectors(num), null, 2));
// });
