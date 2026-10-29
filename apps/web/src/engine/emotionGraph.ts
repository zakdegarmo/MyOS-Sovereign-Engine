export const PILLARS = [
    'self', 'thought', 'logic', 'unity', 'existence',
    'improvement', 'mastery', 'resonance', 'transcendence', 'omni'
] as const;

export type Pillar = typeof PILLARS[number];

/**
 * 10x10 Matrix of Emotional / Kinesic States
 * Mapped as [Primary Intent] x [Secondary Intent]
 * For LPC Expressions, these can be mapped to Sprite overlays or pure semantic value.
 */
export const EMOTION_MATRIX: Record<Pillar, Record<Pillar, string>> = {
    self: {
        self: 'introspection', thought: 'doubt', logic: 'resolve', unity: 'belonging',
        existence: 'survival', improvement: 'ambition', mastery: 'pride',
        resonance: 'empathy', transcendence: 'ego_death', omni: 'solipsism'
    },
    thought: {
        self: 'realization', thought: 'confusion', logic: 'analysis', unity: 'brainstorming',
        existence: 'epiphany', improvement: 'curiosity', mastery: 'focus',
        resonance: 'inspiration', transcendence: 'revelation', omni: 'omniscience'
    },
    logic: {
        self: 'calculation', thought: 'deduction', logic: 'certainty', unity: 'consensus',
        existence: 'objectivity', improvement: 'optimization', mastery: 'precision',
        resonance: 'validation', transcendence: 'paradigm_shift', omni: 'absolute_truth'
    },
    unity: {
        self: 'loneliness', thought: 'agreement', logic: 'coordination', unity: 'harmony',
        existence: 'interconnectedness', improvement: 'collaboration', mastery: 'synergy',
        resonance: 'love', transcendence: 'assimilation', omni: 'singular_consciousness'
    },
    existence: {
        self: 'fear', thought: 'wonder', logic: 'acceptance', unity: 'peace',
        existence: 'being', improvement: 'growth', mastery: 'survival_instinct',
        resonance: 'presence', transcendence: 'void', omni: 'eternity'
    },
    improvement: {
        self: 'shame', thought: 'regret', logic: 'correction', unity: 'encouragement',
        existence: 'hope', improvement: 'progress', mastery: 'perfectionism',
        resonance: 'motivation', transcendence: 'evolution', omni: 'ascension'
    },
    mastery: {
        self: 'confidence', thought: 'strategy', logic: 'efficiency', unity: 'leadership',
        existence: 'control', improvement: 'discipline', mastery: 'flow_state',
        resonance: 'respect', transcendence: 'enlightenment', omni: 'omnipotence'
    },
    resonance: {
        self: 'vulnerability', thought: 'intuition', logic: 'bias', unity: 'compassion',
        existence: 'awe', improvement: 'passion', mastery: 'charisma',
        resonance: 'harmony', transcendence: 'spiritual_connection', omni: 'universal_love'
    },
    transcendence: {
        self: 'dissociation', thought: 'lucidity', logic: 'paradox', unity: 'merging',
        existence: 'impermanence', improvement: 'mutation', mastery: 'breakthrough',
        resonance: 'sublime', transcendence: 'nirvana', omni: 'apotheosis'
    },
    omni: {
        self: 'avatar', thought: 'prophecy', logic: 'fate', unity: 'pantheism',
        existence: 'creation', improvement: 'miracle', mastery: 'divine_intervention',
        resonance: 'grace', transcendence: 'magic', omni: 'source'
    }
};

/**
 * Returns the exact emotional node given two pillars.
 */
export const getEmotionNode = (primary: Pillar, secondary: Pillar): string => {
    return EMOTION_MATRIX[primary]?.[secondary] || 'neutral';
};

/**
 * Maps a generated semantic emotion to an LPC Expression frame index (0-36)
 * Note: This is a placeholder mapping to available expressions.png indexes.
 * Index 0 might be idle, 1 might be smile, 2 sad, etc.
 */
export const mapEmotionToLpcFrame = (emotionName: string): number => {
    const lpcMap: Record<string, number> = {
        'smile': 1, 'happy': 1, 'joy': 1, 'love': 1,
        'sad': 2, 'fear': 2, 'doubt': 2, 'shame': 2,
        'angry': 3, 'frustration': 3, 'resolve': 3,
        'surprise': 4, 'awe': 4, 'wonder': 4, 'epiphany': 4,
        'neutral': 0
    };

    // Fallback logic
    for (const key in lpcMap) {
        if (emotionName.includes(key)) return lpcMap[key];
    }
    return 0; // Default neutral look
};
