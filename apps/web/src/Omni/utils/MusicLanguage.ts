
/**
 * THE MYSTRA MUSIC LANGUAGE
 * Rooted in Dodecadecimal (12) and Octodecimal (18)
 * "The Recursive Dance of Dissonance and Consonance"
 */

export interface MusicInterval {
    name: string;
    ratio: number;
    base12: number; // Semitones
    base18: number; // Harmonic steps
    type: 'consonant' | 'dissonant' | 'neutral';
}

export const DEWEY_SOUND_CATEGORIES = {
    "000": "Information Synthesis / White Noise / Void Hum",
    "100": "Self-Reflection / Binaural Identity / Ego Resonance",
    "200": "Sacred Frequencies / Transcendental Echoes / Celestial Pads",
    "300": "Collective Harmony / Unified Chorus / Network Pulse",
    "400": "Articulate Thought / Glitch Phonemes / Symbolic Rhythms",
    "500": "Pure Logic / Sine Waves / Mathematical Precision",
    "600": "Applied Improvement / Industrial Percussion / Evolving Loops",
    "700": "Emotional Resonance / Melodic Strings / Vibrational Soul",
    "800": "Dramatic Narrative / Orchestral Texture / Literary Soundscapes",
    "900": "Existential Grounding / Ambient Nature / Resource Thrum"
};

export const INTERVALS: MusicInterval[] = [
    { name: 'Root', ratio: 1 / 1, base12: 0, base18: 0, type: 'consonant' },
    { name: 'Minor Second', ratio: 16 / 15, base12: 1, base18: 1.5, type: 'dissonant' },
    { name: 'Major Second', ratio: 9 / 8, base12: 2, base18: 3, type: 'dissonant' },
    { name: 'Minor Third', ratio: 6 / 5, base12: 3, base18: 4.5, type: 'consonant' },
    { name: 'Major Third', ratio: 5 / 4, base12: 4, base18: 6, type: 'consonant' },
    { name: 'Perfect Fourth', ratio: 4 / 3, base12: 5, base18: 7.5, type: 'consonant' },
    { name: 'Tritone', ratio: 45 / 32, base12: 6, base18: 9, type: 'dissonant' },
    { name: 'Perfect Fifth', ratio: 3 / 2, base12: 7, base18: 10.5, type: 'consonant' },
    { name: 'Minor Sixth', ratio: 8 / 5, base12: 8, base18: 12, type: 'consonant' },
    { name: 'Major Sixth', ratio: 5 / 3, base12: 9, base18: 13.5, type: 'consonant' },
    { name: 'Minor Seventh', ratio: 7 / 4, base12: 10, base18: 15, type: 'dissonant' },
    { name: 'Major Seventh', ratio: 15 / 8, base12: 11, base18: 16.5, type: 'dissonant' },
    { name: 'Octave', ratio: 2 / 1, base12: 12, base18: 18, type: 'consonant' }
];

export class MystraComposer {
    /**
     * Translates a base-18 harmonic step into a frequency
     */
    static stepToFreq(step: number, rootFreq: number = 432): number {
        // 432Hz is the ontological root
        const octave = Math.floor(step / 18);
        const remainder = step % 18;
        // Map 18 steps to an octave
        const ratio = Math.pow(2, remainder / 18);
        return rootFreq * Math.pow(2, octave) * ratio;
    }

    /**
     * Recursive music generation based on Relationship Matrix
     */
    static generateSequence(agentA: string, agentB: string, matrix: any): number[] {
        const relation = matrix[agentA]?.[agentB] || 'Neutral';
        // Map relation string length or first char to hash for seed
        const seed = relation.length;
        const sequence: number[] = [];

        // Use recursive logic: next step depends on previous + relation
        let lastStep = seed % 18;
        for (let i = 0; i < 8; i++) {
            sequence.push(lastStep);
            // Recursive step: (n-1 * seed) mod 18 + complexity of relation
            lastStep = (lastStep * seed + relation.charCodeAt(i % relation.length)) % 18;
        }
        return sequence;
    }

    /**
     * Map Dewey Code to Sound Type
     */
    static getDeweyFlavor(code: string): string {
        const prefix = code.substring(0, 1) + "00";
        return (DEWEY_SOUND_CATEGORIES as any)[prefix] || "Unknown Frequency";
    }
}
