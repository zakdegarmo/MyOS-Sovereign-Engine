/**
 * SemanticAddress.ts
 * 
 * Implements the 10-Character Semantic Unicode Address (SUA).
 * 
 * 1. Root Index (8 Chars): Constrained to 10 specific Alchemical symbols.
 *    Guarantees a 100,000,000-node symmetrical 8D array of meaning.
 * 2. State / Intention Index (2 Chars): Unconstrained, utilizing the entire Unicode table.
 */

// Mapping of Base-10 numbers to the 10 Pillar Symbols
export const ALCHEMICAL_SYMBOLS = [
    '🜋', // 0: Omni (Vinegar 2)
    '⚹', // 1: Self (Sal Ammoniac)
    '☿', // 2: Thought (Mercury)
    '🜔', // 3: Logic (Salt)
    '🝩', // 4: Conjunction/Connection
    '🜄', // 5: Existence (Water)
    '🜏', // 6: Improvement (Leviathan Cross)
    '☉', // 7: Mastery (Gold)
    '♀', // 8: Resonance (Venus)
    '🜍', // 9: Transcendence (Sulfur)
];

export const ALCHEMY_TO_NUMBER: Record<string, number> = {
    '🜋': 0,
    '⚹': 1,
    '☿': 2,
    '🜔': 3,
    '🝩': 4,
    '🜄': 5,
    '🜏': 6,
    '☉': 7,
    '♀': 8,
    '🜍': 9,
};

export class SemanticAddress {
    public rootIndex: string; // The 8-symbol string
    public stateIndex: string; // The 2-symbol state string
    public fullAddress: string;

    /**
     * Provided fullAddress must be exactly 10 unicode characters long.
     * e.g., "☿🜔⚹☉♀🜍🜋⚹♔♨"
     */
    constructor(fullAddress: string) {
        // Array.from splits UTF-16 surrogate pairs into correct individual characters
        const chars = Array.from(fullAddress);
        if (chars.length !== 10) {
            throw new Error(`Invalid address length. Expected 10 Unicode characters, got ${chars.length}: ${fullAddress}`);
        }

        this.rootIndex = chars.slice(0, 8).join('');
        this.stateIndex = chars.slice(8, 10).join('');
        this.fullAddress = fullAddress;

        // Validate the root characters
        for (const char of Array.from(this.rootIndex)) {
            if (ALCHEMY_TO_NUMBER[char] === undefined) {
                throw new Error(`Invalid symbol in root index: ${char}`);
            }
        }
    }

    /**
     * Returns the array of numerical coordinates (0-9).
     */
    public getCoordinates(): number[] {
        return Array.from(this.rootIndex).map(char => ALCHEMY_TO_NUMBER[char]);
    }

    /**
     * Returns a new SemanticAddress with the updated state / intention symbols.
     */
    public setState(unicode1: string, unicode2: string): SemanticAddress {
        const chars1 = Array.from(unicode1);
        const chars2 = Array.from(unicode2);
        if (chars1.length !== 1 || chars2.length !== 1) {
            throw new Error('State must be exactly two distinct Unicode characters.');
        }
        const newFull = this.rootIndex + unicode1 + unicode2;
        return new SemanticAddress(newFull);
    }

    /**
     * Creates an address from raw internal numeric coordinates [1, 2, 3, 0, 0, 0] + Intention.
     */
    public static encode(coords: number[], stateChars: [string, string]): SemanticAddress {
        if (coords.length !== 8) {
            throw new Error('Coordinates must have exactly 8 numbers (0-9).');
        }
        const root = coords.map(n => {
            if (n < 0 || n > 9 || !Number.isInteger(n)) {
                throw new Error(`Coordinate out of bounds: ${n}`);
            }
            return ALCHEMICAL_SYMBOLS[n];
        }).join('');

        const s1 = Array.from(stateChars[0])[0];
        const s2 = Array.from(stateChars[1])[0];

        return new SemanticAddress(root + s1 + s2);
    }

    /**
     * Decodes a 10-character SUA string into a SemanticAddress object.
     */
    public static decode(fullAddress: string): SemanticAddress {
        return new SemanticAddress(fullAddress);
    }

    /**
     * Static lookup for common AI / Execution Intents
     */
    public static INTENTS = {
        ACTIVE: ['♔', '♨'] as [string, string],  // Processing, in-memory, alive
        DORMANT: ['⚰', '❄'] as [string, string], // Archived digital matter
        LATENT: ['☾', '≈'] as [string, string],  // Subconscious, background tasks
        SUPER: ['⚡', '∞'] as [string, string],   // Superconscious, overriding
        ERROR: ['⚠', '☠'] as [string, string],  // Fault state
    };

    /**
     * Total Unconstrained State Space:
     * Unicode defines 1,114,112 possible code points.
     * SUA uses a 2-character state index.
     * Theoretical States = 1,114,112^2 = ~1.24 Trillion.
     * Practically assigned symbols (~150k) = ~22.5 Billion states.
     */
    public static readonly ATOMIC_STATE_LIMIT = BigInt(1114112) ** BigInt(2);

    /**
     * Calculations for point cloud density and semantic resolution.
     */
    public getStateID(): bigint {
        const chars = Array.from(this.stateIndex);
        const c1 = BigInt(chars[0].codePointAt(0) || 0);
        const c2 = BigInt(chars[1].codePointAt(0) || 0);
        return (c1 * BigInt(1114112)) + c2;
    }

    /**
     * Returns the density ratio of the current address space.
     * 1.24 Trillion states mapped to 100 Million genome nodes.
     */
    public static getDensityRatio(): string {
        return "1,241,245,696,000 : 100,000,000";
    }
}
