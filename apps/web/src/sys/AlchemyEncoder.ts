/**
 * AlchemyEncoder.ts
 * 
 * The Degarmo-UCDA Synthesis: 1-3-1-3 Recursive Bit-Packing Engine.
 * Converts raw numbers and UUID fragments into Semantic SUA Glyphs.
 */

const ON_BIT = 1;
const OFF_BIT = 0;

export class AlchemyEncoder {
    /**
     * Packs a value into a Little-Endian Recursive Chain.
     * Supports "DE-cursion": Recursive upward shifts when the 2-byte horizon is exceeded.
     * Layout: [Flag(1), Value(3), Operator(1), Operand(3)]
     */
    static pack(input: number): Uint8Array {
        // UPWARD RECURSIVE SHIFT (DE-cursion)
        if (input > 0xFFFF) {
            const high = this.pack(Math.floor(input / 0x10000));
            const low = this.pack(input % 0x10000);
            const combined = new Uint8Array(high.length + low.length);
            combined.set(high);
            combined.set(low, high.length);
            return combined;
        }

        const bytes = new Uint8Array(2);
        
        // Byte 1: The Body (Base 0-63)
        const v1 = input & 0x07;
        const op1 = (input >> 3) & 0x07;
        bytes[0] = (OFF_BIT << 7) | (v1 << 4) | (OFF_BIT << 3) | op1;

        // Byte 2: The Soul (Magnitude/Scale)
        if (input > 0x3F) {
            bytes[0] |= (ON_BIT << 3); // Set relationship 'Link'
            
            if (input <= 0x0FFF) {
                // Linear 12-bit mode
                const v2 = (input >> 6) & 0x07;
                const op2 = (input >> 9) & 0x07;
                bytes[1] = (OFF_BIT << 7) | (v2 << 4) | (ON_BIT << 3) | op2;
            } else {
                // Exponential 'Neutron Star' mode (F=1)
                // Result = Mantissa (Byte 1) << Exponent (Byte 2)
                // Find highest set bit to normalize
                const msb = 31 - Math.clz32(input);
                const exponent = msb - 5; // We keep 6 bits of mantissa
                const mantissa = (input >> exponent) & 0x3F;
                
                // Re-pack Byte 1 with mantissa
                const mv1 = mantissa & 0x07;
                const mop1 = (mantissa >> 3) & 0x07;
                bytes[0] = (OFF_BIT << 7) | (mv1 << 4) | (ON_BIT << 3) | mop1;
                
                // Pack Byte 2 with exponent
                const ev2 = exponent & 0x07;
                const eop2 = (exponent >> 3) & 0x07;
                bytes[1] = (ON_BIT << 7) | (ev2 << 4) | (ON_BIT << 3) | eop2;
            }
        }

        return bytes;
    }

    /**
     * Unpacks a 2-byte chain back into a decimal value.
     * Retains the Degarmo loop logic for power-of-n sampling.
     */
    static unpack(bytes: Uint8Array): number {
        if (bytes.length < 2) return 0;

        // Check for Void Leak
        if (bytes[0] === 0x80 && bytes[1] === 0x88) return Infinity;

        // Byte 1 decomposition
        const v1 = (bytes[0] >> 4) & 0x07;
        const op1 = bytes[0] & 0x07;
        const isLinked = (bytes[0] >> 3) & 0x01;

        let result = v1 | (op1 << 3);

        // Byte 2 scaling logic (Little Endian Magnitude)
        if (isLinked) {
            const isExp = (bytes[1] >> 7) & 0x01;
            const v2 = (bytes[1] >> 4) & 0x07;
            const op2 = bytes[1] & 0x07;
            
            if (isExp) {
                // Exponential Leap
                const exponent = v2 | (op2 << 3);
                result = result << exponent;
            } else {
                // Linear Continuation
                result |= (v2 << 6);
                result |= (op2 << 9);
            }
        }

        return result;
    }

    /**
     * Distills a 128-bit UUID into a 4-byte (2-glyph) Semantic Path.
     * Uses a CRC32-style 'Purification' to condense the matter.
     */
    static distill(uuid: string): string {
        const clean = uuid.replace(/-/g, '');
        let hash = 0;
        for (let i = 0; i < clean.length; i++) {
            hash = ((hash << 5) - hash) + clean.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }

        // Split 32-bit hash into two 16-bit 'Quantum Salts'
        const salt1 = (hash >> 16) & 0xFFFF;
        const salt2 = hash & 0xFFFF;

        const b1 = this.pack(Math.abs(salt1));
        const b2 = this.pack(Math.abs(salt2));

        // Map bytes to Unicode SUA symbols (offset into the BMP or Pillar range)
        return this.bytesToGlyph(b1) + this.bytesToGlyph(b2);
    }

    private static bytesToGlyph(bytes: Uint8Array): string {
        // Combine 2 bytes into a single UTF-16 code point (Base-65536)
        const code = (bytes[0] << 8) | bytes[1];
        // Ensure we stay within a readable/semantic range (Pillar symbols start around 0x2600)
        return String.fromCharCode(0x2600 + (code % 0x100)); 
    }
}
