// test_alchemist_lite.js
const ON_BIT = 1;
const OFF_BIT = 0;

function pack(input) {
    if (!isFinite(input) || input > 0xFFFF) return [0x80, 0x88];
    const bytes = [0, 0];
    const v1 = input & 0x07;
    const op1 = (input >> 3) & 0x07;
    bytes[0] = (OFF_BIT << 7) | (v1 << 4) | (OFF_BIT << 3) | op1;
    if (input > 0x3F) {
        const v2 = (input >> 6) & 0x07;
        const op2 = (input >> 9) & 0x07;
        const hasMore = (input >> 12) > 0 ? ON_BIT : OFF_BIT;
        bytes[1] = (hasMore << 7) | (v2 << 4) | (ON_BIT << 3) | op2;
        bytes[0] |= (ON_BIT << 3); 
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
        const v2 = (bytes[1] >> 4) & 0x07;
        const op2 = (bytes[1] & 0x07);
        result |= (v2 << 6);
        result |= (op2 << 9);
    }
    return result;
}

function distill(uuid) {
    const clean = uuid.replace(/-/g, '');
    let hash = 0;
    for (let i = 0; i < clean.length; i++) {
        hash = ((hash << 5) - hash) + clean.charCodeAt(i);
        hash |= 0;
    }
    const salt1 = (hash >> 16) & 0xFFFF;
    const salt2 = hash & 0xFFFF;
    const b1 = pack(Math.abs(salt1));
    const b2 = pack(Math.abs(salt2));
    const code1 = (b1[0] << 8) | b1[1];
    const code2 = (b2[0] << 8) | b2[1];
    return String.fromCharCode(0x2600 + (code1 % 0x100)) + String.fromCharCode(0x2600 + (code2 % 0x100));
}

const uuid = '010aef1f-2c08-48e1-8d18-8a9df985d7f6';
console.log(`Existential ID: ${uuid}`);
console.log(`Semantic Glyphs: ${distill(uuid)}`);
console.log(`42 ->`, pack(42), `->`, unpack(pack(42)));
console.log(`10000 ->`, pack(10000), `->`, unpack(pack(10000)));
console.log(`Infinity ->`, pack(Infinity), `->`, unpack(pack(Infinity)));
