import type { GemId } from '@Omni/types';
import { RELATIONSHIPS, COUNCIL } from '@Omni/constants';

// Map DDC hundreds digit to GemId
export const DDC_TO_GEM: Record<string, GemId> = {
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

export interface SemanticLink {
    gemId: GemId;
    gemName: string;
    gemColor: string;
    relationshipToNext?: string; // The verb connecting this to the next gem
}

/**
 * Decodes a DDC number string (e.g. "681") into a fractal chain of relationships.
 * 6 (Improvement) -> [Fine-tunes] -> 8 (Resonance) -> [Is Felt By] -> 1 (Self)
 */
export const decodeSemanticAddress = (ddc: string): SemanticLink[] => {
    // 1. Clean the string: remove non-numeric chars (dots are okay if we want to parse decimals, but for now let's just take digits)
    // Actually, DDC decimals are significant. 681.25 -> 6, 8, 1, 2, 5
    const digits = ddc.replace(/[^0-9]/g, '').split('');

    const chain: SemanticLink[] = [];

    for (let i = 0; i < digits.length; i++) {
        const digit = digits[i];
        const gemId = DDC_TO_GEM[digit];

        if (!gemId) continue; // Skip invalid digits

        const profile = COUNCIL[gemId];
        const link: SemanticLink = {
            gemId: gemId,
            gemName: profile.name,
            gemColor: profile.color
        };

        // Determine relationship to the NEXT gem in the chain
        if (i < digits.length - 1) {
            const nextDigit = digits[i + 1];
            const nextGemId = DDC_TO_GEM[nextDigit];

            if (nextGemId && RELATIONSHIPS[gemId]) {
                const rel = RELATIONSHIPS[gemId][nextGemId];
                if (rel) {
                    link.relationshipToNext = rel;
                }
            }
        }

        chain.push(link);
    }

    return chain;
};
