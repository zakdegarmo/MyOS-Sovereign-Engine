/**
 * FractalEncoder.ts
 * 
 * The "Register" layer of MyOS.
 * Translates 10-digit decimal addresses into 2-symbol Unicode signatures.
 * 
 * Base-150,000 logic provides ~22.5 Billion addressable nodes.
 */

const UNICODE_BASE = 150000;

/**
 * Encodes a numeric ontological address into a 2-symbol Unicode signature.
 * Mirror-Folded Indexing: 
 * Digit 1 (Ones) is the first character.
 * Digit 2 (150k-ies) is the second character.
 */
export const encodeSignature = (address: number): string => {
    if (address < 0 || address >= UNICODE_BASE * UNICODE_BASE) {
        throw new Error(`Address ${address} out of ontological bounds.`);
    }

    const symbolA = address % UNICODE_BASE;
    const symbolB = Math.floor(address / UNICODE_BASE);

    return String.fromCodePoint(symbolA) + String.fromCodePoint(symbolB);
};

/**
 * Decodes a 2-symbol Unicode signature back into a numeric address.
 */
export const decodeSignature = (signature: string): number => {
    const symbols = Array.from(signature); // Correctly handles surrogate pairs
    if (symbols.length < 2) {
        throw new Error("Signature must be at least 2 symbols.");
    }

    const codeA = symbols[0].codePointAt(0) || 0;
    const codeB = symbols[1].codePointAt(0) || 0;

    return codeA + (codeB * UNICODE_BASE);
};

/**
 * Formats a decimal address into the 10-digit "Pillared" format.
 */
export const formatPillaredAddress = (address: number): string => {
    return address.toString().padStart(10, '0');
};

/**
 * Example Mapping:
 * Self :: Identity -> 1,100,000,000
 * Signature -> encodeSignature(1100000000)
 */
