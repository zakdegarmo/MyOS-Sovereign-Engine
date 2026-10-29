export const SEMIO_LEXICON: Record<string, string> = {
    // PILLARS (Synced with @Omni/constants)
    'Self': '⚹',
    'Thought': '☿',
    'Logic': '🜔',
    'Unity': '🝧',
    'Existence': '🜄',
    'Improvement': '🜏',
    'Mastery': '☉',
    'Resonance': '♀',
    'Transcendence': '🜍',
    'Omni': '🜋',

    // CONCEPTS
    'Time': '⏳',
    'Space': '㎥',
    'Energy': '⚡',
    'Matter': '■',
    'Void': 'Ø',
    'Chaos': '⚄',
    'Order': '⚏',
    'Life': '⚘',
    'Death': '☠',
    'Spirit': '👻',
    'Soul': '🔥',
    'Mind': '🧠',
    'Body': '💪',
    'Code': '💾',
    'Data': '📄',
    'Network': '🕸',
    'Agent': '🤖',
    'User': '👤',
    'God': '👁',
    'Universe': '🌌',

    // ALCHEMY
    'Salt': '🜔',
    'Sulfur': '🜏',
    'Mercury': '☿',
    'Fire': '🜂',
    'Water': '🜄',
    'Air': '🜁',
    'Earth': '🜃',

    // ASTROLOGY
    'Aries': '♈',
    'Taurus': '♉',
    'Gemini': '♊',
    'Cancer': '♋',
    'Leo': '♌',
    'Virgo': '♍',
    'Libra': '♎',
    'Scorpio': '♏',
    'Sagittarius': '♐',
    'Capricorn': '♑',
    'Aquarius': '♒',
    'Pisces': '♓',

    // GEOMETRY
    'Triangle': '△',
    'Square': '□',
    'Circle': '○',
    'Pentagon': '⬠',
    'Hexagon': '⬡',
    'Star': '☆',

    // TECH
    'React': '⚛',
    'TypeScript': '📘',
    'Node': '🟢',
    'Database': '🛢',
    'Cloud': '☁',
    'Security': '🔒',
    'AI': '🧠',
    'VR': '🥽',

    // MISC
    'Unknown': '?',
    'Error': '⚠',
    'Warning': '‼',
    'Success': '✓',
    'Pending': '…'
};

export const getGlyphFor = (key: string): string => {
    // 1. Direct Match
    if (SEMIO_LEXICON[key]) return SEMIO_LEXICON[key];

    // 2. Case Insensitive
    const lowerKey = key.toLowerCase();
    const found = Object.keys(SEMIO_LEXICON).find(k => k.toLowerCase() === lowerKey);
    if (found) return SEMIO_LEXICON[found];

    // 3. Fallback based on type/prefix
    if (key.startsWith('node-')) return '●';

    return '•'; // Default dot
};
