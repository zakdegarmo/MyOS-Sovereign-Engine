// test_alchemist_lite_v2.js
const ON_BIT = 1;
const OFF_BIT = 0;

function pack(input) {
    if (!isFinite(input) || input > 0x01FFFFFFFFFF) return [0x80, 0x88]; // Higher limit for exp mode
    const bytes = [0, 0];
    const v1 = input & 0x07;
    const op1 = (input >> 3) & 0x07;
    bytes[0] = (OFF_BIT << 7) | (v1 << 4) | (OFF_BIT << 3) | op1;
    if (input > 0x3F) {
        bytes[0] |= (ON_BIT << 3);
        if (input <= 0x0FFF) {
            const v2 = (input >> 6) & 0x07;
            const op2 = (input >> 9) & 0x07;
            bytes[1] = (OFF_BIT << 7) | (v2 << 4) | (ON_BIT << 3) | op2;
        } else {
            const msb = 31 - Math.clz32(input);
            const exponent = msb - 5;
            const mantissa = (input >> exponent) & 0x3F;
            const mv1 = mantissa & 0x07;
            const mop1 = (mantissa >> 3) & 0x07;
            bytes[0] = (OFF_BIT << 7) | (mv1 << 4) | (ON_BIT << 3) | mop1;
            const ev2 = exponent & 0x07;
            const eop2 = (exponent >> 3) & 0x07;
            bytes[1] = (ON_BIT << 7) | (ev2 << 4) | (ON_BIT << 3) | eop2;
        }
    }
    return bytes;
}

function unpack(bytes) {
    if (bytes[0] === 128 && bytes[1] === 136) return Infinity;
    const v1 = (bytes[0] >> 4) & 0x07;
    const op1 = bytes[0] & 0x07;
    const isLinked = (bytes[0] >> 3) & 0x01;
    let result = v1 | (op1 << 3);
    if (isLinked) {
        const isExp = (bytes[1] >> 7) & 0x01;
        const v2 = (bytes[1] >> 4) & 0x07;
        const op2 = (bytes[1] & 0x07);
        if (isExp) {
            const exponent = v2 | (op2 << 3);
            result = result << exponent;
        } else {
            result |= (v2 << 6);
            result |= (op2 << 9);
        }
    }
    return result;
}

const uuid = '010aef1f-2c08-48e1-8d18-8a9df985d7f6';
console.log(`42 ->`, pack(42), `->`, unpack(pack(42)));
console.log(`1000 ->`, pack(1000), `->`, unpack(pack(1000)));
console.log(`10000 ->`, pack(10000), `->`, unpack(pack(10000)));
console.log(`1000000 ->`, pack(1000000), `->`, unpack(pack(1000000)));
console.log(`Infinity ->`, pack(Infinity), `->`, unpack(pack(Infinity)));
