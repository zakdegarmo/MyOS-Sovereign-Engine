import dictionary from './femto_dictionary.json';

// 1. The Updated Base-10 Semantic Map
const runeToNum: Record<string, number> = {
    '🜋': 0, // Omni (Everything/Nothing)
    '⚹': 1,  // Self
    '☿': 2,  // Thought
    '🜔': 3,  // Logic
    '🝧': 4,  // Unity
    '🜄': 5,  // Existence
    '🜏': 6,  // Improvement
    '☉': 7,  // Mastery
    '♀': 8,  // Resonance
    '🜍': 9   // Transcendence
};

const numToRune = ['🜋', '⚹', '☿', '🜔', '🝧', '🜄', '🜏', '☉', '♀', '🜍'];

// --- FORWARD: Tags -> Database Index -> Runes ---
function getFractalRune(index: number): string {
    if (index <= 0) return ''; // Root

    // 1. Mathematically determine the Depth (L) of this index
    const L = Math.floor(Math.log10(9 * index + 1));

    // 2. Calculate the offset for that depth
    const offset = (Math.pow(10, L) - 1) / 9;

    // 3. Find the relative value and pad it with leading zeros to match Depth
    const value = index - offset;
    const numericString = value.toString().padStart(L, '0');

    // 4. Map the digits back to the visual Runes
    let runeString = '';
    for (let char of numericString) {
        runeString += numToRune[parseInt(char, 10)];
    }

    return runeString;
}

export function encodeTagsToUDCA(tags: string[]): string {
    const map = dictionary.tagToIndex as Record<string, number>;
    let payload = "";

    // We separate individual tags with a unique delimiter so Gemini can safely compose arrays of runes
    // For safety, we use a pipe '|' to delimit individual encoded tags in the compressed payload.
    for (const tag of tags) {
        const index = map[tag.toLowerCase().trim()];
        if (index) {
            payload += getFractalRune(index) + "|";
        }
    }

    return payload.slice(0, -1); // Remove trailing pipe
}

// --- REVERSE: Runes -> Database Index -> Tags ---
function getFractalIndex(address: string): number {
    // Need to handle multi-byte unicode characters properly utilizing Array.from
    const runeArray = Array.from(address);
    const L = runeArray.length;
    if (L === 0 || L > 10) return 0; // Root node

    // The Depth Offset (e.g., 1, 11, 111...)
    const offset = (Math.pow(10, L) - 1) / 9;

    let numericString = '';
    for (let char of runeArray) {
        if (runeToNum[char] !== undefined) {
            numericString += runeToNum[char];
        }
    }

    return offset + parseInt(numericString, 10);
}

export function decodeUDCAToTags(payload: string): string[] {
    const map = dictionary.indexToTag as Record<string, string>;
    const runicBlocks = payload.split('|');
    const recoveredTags: string[] = [];

    for (const block of runicBlocks) {
        const cleanBlock = block.trim();
        if (!cleanBlock) continue;

        const index = getFractalIndex(cleanBlock);
        if (index > 0 && map[index]) {
            recoveredTags.push(map[index]);
        }
    }

    return recoveredTags;
}
