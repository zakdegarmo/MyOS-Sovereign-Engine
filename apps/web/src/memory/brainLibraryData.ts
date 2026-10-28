/**
 * brainLibraryData.ts
 *
 * Bundled Antigravity Knowledge Index (KI) data as MyOS library entries.
 * Each semantic pillar's relationship nodes are surfaced as individual
 * LibraryItem-compatible records.
 *
 * Dewey Code mapping:
 *   100 - Philosophy & Psychology  (Self, Thought, Logic)
 *   200 - Religion/Metaphysics     (Transcendence, Omni)
 *   300 - Social Sciences          (Unity, Resonance)
 *   500 - Natural Sciences         (Existence, Improvement)
 *   700 - Arts / Mastery           (Mastery)
 *
 * Node paths follow dot-notation: pillar.relationship
 * e.g.  self.identity, self.aspires_to, thought.recursion
 */

import type { LibraryItem } from '../Thought/components/Tutor/types';
import { PillarId } from '../Thought/components/Tutor/types';

type BrainEntry = LibraryItem & { ontologicalPath: string };

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: SELF  (Dewey 126 – The Self)
// ─────────────────────────────────────────────────────────────────────────────
const SELF_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-self-root',
        title: 'Self — The Pillar of Identity',
        deweyCategory: '100',
        deweyCode: '126.0',
        content: 'Self is the subjective agent of experience: the "I" that perceives, acts, and narrates its own existence. It is both a conscious phenomenon and an evolving social construct, arising through neurology, embodiment, and relationship.',
        tags: ['self', 'identity', 'consciousness', 'ego', 'agent'],
        pillarConnections: [PillarId.Self],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self',
    },
    {
        id: 'ki-self-identity',
        title: 'Self → Identity',
        deweyCategory: '100',
        deweyCode: '126.1',
        content: 'The stable set of characteristics and continuities that define who one is across time and context. Identity integrates memory, social role, values, and bodily experience into a coherent self-concept.',
        tags: ['identity', 'self-concept', 'continuity', 'persona'],
        pillarConnections: [PillarId.Self],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.identity',
    },
    {
        id: 'ki-self-affirms',
        title: 'Self → Affirms',
        deweyCategory: '100',
        deweyCode: '126.2',
        content: 'The act by which the Self validates and asserts its own existence, values, and experiences. Affirmation is the root of self-esteem and the basis of agency.',
        tags: ['affirmation', 'self-esteem', 'agency', 'validation'],
        pillarConnections: [PillarId.Self],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.affirms',
    },
    {
        id: 'ki-self-aspires',
        title: 'Self → Aspires To',
        deweyCategory: '100',
        deweyCode: '126.3',
        content: 'The drive within the Self toward a desired future state — its ideal self. Aspiration bridges the gap between what is and what could be, motivating growth and self-transcendence.',
        tags: ['aspiration', 'growth', 'ideal self', 'motivation'],
        pillarConnections: [PillarId.Self, PillarId.Improvement],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.aspires_to',
    },
    {
        id: 'ki-self-experiences',
        title: 'Self → Experiences',
        deweyCategory: '100',
        deweyCode: '126.4',
        content: 'The subjective dimension of living: what it is like to be this particular self at this particular moment. Experience integrates sensation, emotion, memory, and meaning into a unified stream of consciousness.',
        tags: ['experience', 'phenomenology', 'consciousness', 'subjectivity'],
        pillarConnections: [PillarId.Self, PillarId.Existence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.experiences',
    },
    {
        id: 'ki-self-pursues',
        title: 'Self → Pursues',
        deweyCategory: '100',
        deweyCode: '126.5',
        content: 'The Self as an intentional agent that sets goals and moves purposefully toward them. Pursuit gives the Self temporal structure and defines its relationship to desire and will.',
        tags: ['pursuit', 'intention', 'will', 'goal'],
        pillarConnections: [PillarId.Self, PillarId.Mastery],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.pursues',
    },
    {
        id: 'ki-self-seeks',
        title: 'Self → Seeks',
        deweyCategory: '100',
        deweyCode: '126.6',
        content: 'An open-ended orientation of inquiry and longing within the Self — less directed than "pursues," more like an ongoing search for meaning, connection, or truth.',
        tags: ['seeking', 'inquiry', 'meaning', 'longing'],
        pillarConnections: [PillarId.Self, PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.seeks',
    },
    {
        id: 'ki-self-undergoes',
        title: 'Self → Undergoes',
        deweyCategory: '100',
        deweyCode: '126.7',
        content: 'Change and transformation that the Self does not fully choose but must absorb and integrate. Undergoing contrasts with acting — it is the passive, receivant dimension of self-development.',
        tags: ['transformation', 'change', 'passivity', 'growth'],
        pillarConnections: [PillarId.Self, PillarId.Improvement],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.undergoes',
    },
    {
        id: 'ki-self-applies',
        title: 'Self → Applies',
        deweyCategory: '100',
        deweyCode: '126.8',
        content: 'The practical deployment of the Self\'s knowledge, skill, and values in the world. Application is how the inner life of the Self becomes effective outer action.',
        tags: ['application', 'practice', 'skill', 'action'],
        pillarConnections: [PillarId.Self, PillarId.Mastery],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.applies',
    },
    {
        id: 'ki-self-is-realized',
        title: 'Self → Is Realized By',
        deweyCategory: '100',
        deweyCode: '126.9',
        content: 'The conditions, relationships, and experiences through which the potential of the Self becomes actual. Realization is the process of becoming what one inherently is.',
        tags: ['realization', 'actualization', 'potential', 'becoming'],
        pillarConnections: [PillarId.Self, PillarId.NothingEverything],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.is_realized_by',
    },
    {
        id: 'ki-self-subject-of',
        title: 'Self → Subject Of',
        deweyCategory: '100',
        deweyCode: '126.10',
        content: 'The Self as the object of its own inquiry, reflection, or the inquiry of others. When the Self becomes "subject of," it enters the domain of self-knowledge and social perception.',
        tags: ['self-reflection', 'subject', 'introspection', 'observation'],
        pillarConnections: [PillarId.Self, PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'self.subject_of',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: THOUGHT  (Dewey 153 – Mental Processes)
// ─────────────────────────────────────────────────────────────────────────────
const THOUGHT_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-thought-root',
        title: 'Thought — The Pillar of Cognition',
        deweyCategory: '100',
        deweyCode: '153.0',
        content: 'Thought is the cognitive process connecting sensation, memory, and language into meaning. It is the engine of understanding and the medium through which the world is made intelligible.',
        tags: ['thought', 'cognition', 'mind', 'understanding'],
        pillarConnections: [PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'thought',
    },
    {
        id: 'ki-thought-recursion',
        title: 'Thought → Recursion',
        deweyCategory: '100',
        deweyCode: '153.1',
        content: 'The capacity of Thought to reflect upon itself — thinking about thinking. Recursion is what makes meta-cognition, self-awareness, and philosophical inquiry possible.',
        tags: ['recursion', 'meta-cognition', 'self-reference', 'reflection'],
        pillarConnections: [PillarId.Thought, PillarId.Self],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'thought.recursion',
    },
    {
        id: 'ki-thought-articulates',
        title: 'Thought → Articulates',
        deweyCategory: '100',
        deweyCode: '153.2',
        content: 'Thought becomes communicable through language, symbol, and structure. Articulation is the bridge between the inner life of mind and the outer world of shared meaning.',
        tags: ['articulation', 'language', 'expression', 'communication'],
        pillarConnections: [PillarId.Thought, PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'thought.articulates',
    },
    {
        id: 'ki-thought-synthesizes',
        title: 'Thought → Synthesizes',
        deweyCategory: '100',
        deweyCode: '153.3',
        content: 'The ability of Thought to combine disparate ideas, perceptions, and knowledge into new, coherent wholes. Synthesis is the creative dimension of cognition.',
        tags: ['synthesis', 'creativity', 'integration', 'insight'],
        pillarConnections: [PillarId.Thought, PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'thought.synthesizes',
    },
    {
        id: 'ki-thought-transcends',
        title: 'Thought → Transcends',
        deweyCategory: '100',
        deweyCode: '153.4',
        content: 'Thought at its most powerful can move beyond given assumptions and conceptual limits into new paradigms. This is the mode of Thought that generates philosophical revolutions and spiritual insight.',
        tags: ['transcendence', 'breakthrough', 'paradigm-shift', 'insight'],
        pillarConnections: [PillarId.Thought, PillarId.Transcendence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'thought.transcends',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: LOGIC  (Dewey 160 – Logic)
// ─────────────────────────────────────────────────────────────────────────────
const LOGIC_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-logic-root',
        title: 'Logic — The Pillar of Structure',
        deweyCategory: '100',
        deweyCode: '160.0',
        content: 'Logic is the formal study of valid inference and the structural principles that guarantee correct reasoning. It is the foundation of mathematics, computer science, and philosophical argumentation.',
        tags: ['logic', 'reasoning', 'inference', 'structure'],
        pillarConnections: [PillarId.Logic],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'logic',
    },
    {
        id: 'ki-logic-grounds',
        title: 'Logic → Grounds',
        deweyCategory: '100',
        deweyCode: '160.1',
        content: 'Logic provides the epistemic grounding for knowledge claims — the justificatory structure that separates valid belief from mere conjecture.',
        tags: ['grounding', 'justification', 'epistemology', 'validity'],
        pillarConnections: [PillarId.Logic, PillarId.Existence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'logic.grounds',
    },
    {
        id: 'ki-logic-governs',
        title: 'Logic → Governs',
        deweyCategory: '100',
        deweyCode: '160.2',
        content: 'Logical principles govern what can validly follow from what — they are the laws that thinking must obey to remain coherent and truth-preserving.',
        tags: ['governance', 'rules', 'validity', 'necessity'],
        pillarConnections: [PillarId.Logic],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'logic.governs',
    },
    {
        id: 'ki-logic-contradicts',
        title: 'Logic → Contradicts',
        deweyCategory: '100',
        deweyCode: '160.3',
        content: 'Contradiction is the relationship Logic identifies between statements that cannot both be true simultaneously. The law of non-contradiction is the bedrock of coherent thought.',
        tags: ['contradiction', 'non-contradiction', 'paradox', 'exclusion'],
        pillarConnections: [PillarId.Logic, PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'logic.contradicts',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: UNITY  (Dewey 302 – Social Interaction)
// ─────────────────────────────────────────────────────────────────────────────
const UNITY_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-unity-root',
        title: 'Unity — The Pillar of Wholeness',
        deweyCategory: '300',
        deweyCode: '302.0',
        content: 'Unity is the principle of coherent integration — the state in which parts relate to a whole such that their combined being exceeds their separate existences. It is the ontological ground of cooperation, love, and system.',
        tags: ['unity', 'wholeness', 'integration', 'coherence'],
        pillarConnections: [PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'unity',
    },
    {
        id: 'ki-unity-harmonizes',
        title: 'Unity → Harmonizes',
        deweyCategory: '300',
        deweyCode: '302.1',
        content: 'The process by which distinct elements are brought into a balanced, resonant relationship — neither losing their individuality nor conflicting with the whole.',
        tags: ['harmony', 'balance', 'resonance', 'cooperation'],
        pillarConnections: [PillarId.Unity, PillarId.Resonance],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'unity.harmonizes',
    },
    {
        id: 'ki-unity-binds',
        title: 'Unity → Binds',
        deweyCategory: '300',
        deweyCode: '302.2',
        content: 'The cohesive force through which separate entities are held together in relation — by shared meaning, love, purpose, or structural necessity.',
        tags: ['binding', 'cohesion', 'connection', 'relationship'],
        pillarConnections: [PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'unity.binds',
    },
    {
        id: 'ki-unity-integrates',
        title: 'Unity → Integrates',
        deweyCategory: '300',
        deweyCode: '302.3',
        content: 'The active synthesis of previously distinct parts into a new functional whole. Integration is the operational process of achieving unity.',
        tags: ['integration', 'synthesis', 'fusion', 'wholeness'],
        pillarConnections: [PillarId.Unity, PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'unity.integrates',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: EXISTENCE  (Dewey 111 – Ontology)
// ─────────────────────────────────────────────────────────────────────────────
const EXISTENCE_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-existence-root',
        title: 'Existence — The Pillar of Being',
        deweyCategory: '100',
        deweyCode: '111.0',
        content: 'Existence is the most fundamental ontological category: that something IS rather than is not. All other categories of understanding presuppose it. The question "why is there something rather than nothing?" is the primordial philosophical puzzle.',
        tags: ['existence', 'being', 'ontology', 'reality'],
        pillarConnections: [PillarId.Existence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'existence',
    },
    {
        id: 'ki-existence-manifests',
        title: 'Existence → Manifests In',
        deweyCategory: '100',
        deweyCode: '111.1',
        content: 'The process by which potential or abstract being takes on concrete, perceptible form. Manifestation is the bridge between the possible and the actual.',
        tags: ['manifestation', 'actualization', 'form', 'appearance'],
        pillarConnections: [PillarId.Existence, PillarId.Transcendence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'existence.manifests_in',
    },
    {
        id: 'ki-existence-comprises',
        title: 'Existence → Comprises',
        deweyCategory: '100',
        deweyCode: '111.2',
        content: 'Existence as a whole includes all that is — physical, mental, possible, and actual. It comprises the full domain of ontological inquiry.',
        tags: ['totality', 'inclusion', 'all-encompassing', 'domain'],
        pillarConnections: [PillarId.Existence, PillarId.NothingEverything],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'existence.comprises',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: IMPROVEMENT  (Dewey 158 – Personal Growth)
// ─────────────────────────────────────────────────────────────────────────────
const IMPROVEMENT_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-improvement-root',
        title: 'Improvement — The Pillar of Growth',
        deweyCategory: '100',
        deweyCode: '158.0',
        content: 'Improvement is the directed, iterative movement toward a better state of being. It requires awareness of deficiency, a standard of excellence, and the capacity for change.',
        tags: ['improvement', 'growth', 'optimization', 'change'],
        pillarConnections: [PillarId.Improvement],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'improvement',
    },
    {
        id: 'ki-improvement-refines',
        title: 'Improvement → Refines',
        deweyCategory: '100',
        deweyCode: '158.1',
        content: 'The process by which a rough or imperfect form is made progressively more precise, pure, or excellent through iterative application and feedback.',
        tags: ['refinement', 'iteration', 'precision', 'polish'],
        pillarConnections: [PillarId.Improvement, PillarId.Mastery],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'improvement.refines',
    },
    {
        id: 'ki-improvement-leads-to',
        title: 'Improvement → Leads To',
        deweyCategory: '100',
        deweyCode: '158.2',
        content: 'Improvement is not an end in itself but a path toward Mastery, Transcendence, or a higher state. Each cycle of improvement leads to a new level of capability or understanding.',
        tags: ['path', 'progression', 'mastery', 'direction'],
        pillarConnections: [PillarId.Improvement, PillarId.Mastery, PillarId.Transcendence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'improvement.leads_to',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: MASTERY  (Dewey 700 – Arts & Recreation)
// ─────────────────────────────────────────────────────────────────────────────
const MASTERY_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-mastery-root',
        title: 'Mastery — The Pillar of Excellence',
        deweyCategory: '700',
        deweyCode: '700.0',
        content: 'Mastery is the state of complete command over a domain — where skill, knowledge, and intuition are so integrated that performance becomes effortless and creative. It is the apex of development in any field.',
        tags: ['mastery', 'excellence', 'skill', 'expertise'],
        pillarConnections: [PillarId.Mastery],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'mastery',
    },
    {
        id: 'ki-mastery-embodies',
        title: 'Mastery → Embodies',
        deweyCategory: '700',
        deweyCode: '700.1',
        content: 'Mastery is not merely known but lived — it is embodied in habitual patterns of thought, movement, and judgment that operate below the level of conscious deliberation.',
        tags: ['embodiment', 'habit', 'intuition', 'implicit knowledge'],
        pillarConnections: [PillarId.Mastery, PillarId.Self],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'mastery.embodies',
    },
    {
        id: 'ki-mastery-commands',
        title: 'Mastery → Commands',
        deweyCategory: '700',
        deweyCode: '700.2',
        content: 'The master commands their domain — they can alter, direct, and innovate within it with authority. Command implies both understanding and agency over the field.',
        tags: ['command', 'authority', 'agency', 'innovation'],
        pillarConnections: [PillarId.Mastery, PillarId.Logic],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'mastery.commands',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: RESONANCE  (Dewey 302.2 – Communication & Social Bonds)
// ─────────────────────────────────────────────────────────────────────────────
const RESONANCE_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-resonance-root',
        title: 'Resonance — The Pillar of Harmony',
        deweyCategory: '300',
        deweyCode: '302.20',
        content: 'Resonance is the deep vibrational sympathy between entities — the phenomenon where one system\'s frequency amplifies another\'s. In human experience it manifests as emotional attunement, aesthetic rapture, and spiritual connection.',
        tags: ['resonance', 'harmony', 'attunement', 'vibration'],
        pillarConnections: [PillarId.Resonance],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'resonance',
    },
    {
        id: 'ki-resonance-aligns',
        title: 'Resonance → Aligns With',
        deweyCategory: '300',
        deweyCode: '302.21',
        content: 'The state in which two or more entities share a common orientation, purpose, or frequency — enabling amplification and co-evolution rather than interference.',
        tags: ['alignment', 'synchrony', 'attunement', 'coherence'],
        pillarConnections: [PillarId.Resonance, PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'resonance.aligns_with',
    },
    {
        id: 'ki-resonance-radiates',
        title: 'Resonance → Radiates From',
        deweyCategory: '300',
        deweyCode: '302.22',
        content: 'Authentic resonance emanates from a center of genuine being — it cannot be manufactured. Things resonate from their essential nature and spread their influence outward from there.',
        tags: ['radiation', 'emanation', 'authenticity', 'influence'],
        pillarConnections: [PillarId.Resonance, PillarId.Existence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'resonance.radiates_from',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: TRANSCENDENCE  (Dewey 291 – Comparative Religion / Metaphysics)
// ─────────────────────────────────────────────────────────────────────────────
const TRANSCENDENCE_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-transcendence-root',
        title: 'Transcendence — The Pillar of Beyond',
        deweyCategory: '200',
        deweyCode: '291.0',
        content: 'Transcendence is the movement beyond current limits — whether of the self, of knowledge, of physical form, or of existence itself. It is the principle that points perpetually to what is beyond the horizon of the known.',
        tags: ['transcendence', 'beyond', 'limits', 'elevation'],
        pillarConnections: [PillarId.Transcendence],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'transcendence',
    },
    {
        id: 'ki-transcendence-elevates',
        title: 'Transcendence → Elevates',
        deweyCategory: '200',
        deweyCode: '291.1',
        content: 'Transcendence lifts consciousness, capacity, and being to a higher order. Elevation is the experiential dimension of transcendence — felt as expansion, liberation, or illumination.',
        tags: ['elevation', 'expansion', 'liberation', 'insight'],
        pillarConnections: [PillarId.Transcendence, PillarId.Improvement],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'transcendence.elevates',
    },
    {
        id: 'ki-transcendence-goes-beyond',
        title: 'Transcendence → Goes Beyond',
        deweyCategory: '200',
        deweyCode: '291.2',
        content: 'The movement of transcendence is always beyond — beyond current categories, current identities, current limitations. It is the ontological force that prevents any system from being fully closed.',
        tags: ['beyond', 'open-endedness', 'infinity', 'growth'],
        pillarConnections: [PillarId.Transcendence, PillarId.NothingEverything],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'transcendence.goes_beyond',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// PILLAR: OMNI  (Dewey 113 – Cosmology)
// ─────────────────────────────────────────────────────────────────────────────
const OMNI_ENTRIES: BrainEntry[] = [
    {
        id: 'ki-omni-root',
        title: 'Omni — The Pillar of Totality',
        deweyCategory: '100',
        deweyCode: '113.0',
        content: 'Omni is the principle of all-encompassing totality — the ontological ground from which all other pillars emerge and to which they return. It is presence without limit, awareness without edge, the unified field of all possible experience.',
        tags: ['omni', 'totality', 'all', 'infinite', 'cosmos'],
        pillarConnections: [PillarId.NothingEverything],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'omni',
    },
    {
        id: 'ki-omni-merges-with',
        title: 'Omni → Merges With',
        deweyCategory: '100',
        deweyCode: '113.1',
        content: 'The process of dissolution of separate identity into the all-encompassing totality. Merging is the ultimate form of Unity — the complete integration of part into whole.',
        tags: ['merging', 'dissolution', 'integration', 'union'],
        pillarConnections: [PillarId.NothingEverything, PillarId.Unity],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'omni.merges_with',
    },
    {
        id: 'ki-omni-contemplates',
        title: 'Omni → Contemplates',
        deweyCategory: '100',
        deweyCode: '113.2',
        content: 'The infinite self-reflection of totality upon itself. Contemplation at the Omni level is not a mental act but the very nature of conscious reality knowing itself.',
        tags: ['contemplation', 'self-reflection', 'awareness', 'knowing'],
        pillarConnections: [PillarId.NothingEverything, PillarId.Thought],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'omni.contemplates',
    },
    {
        id: 'ki-omni-harmonizes',
        title: 'Omni → Harmonizes With',
        deweyCategory: '100',
        deweyCode: '113.3',
        content: 'Omni is in inherent resonance with all manifestations of existence. Its fundamental nature is the ground of all harmony — the silent music that underlies every sound.',
        tags: ['harmony', 'ground', 'foundation', 'resonance'],
        pillarConnections: [PillarId.NothingEverything, PillarId.Resonance],
        timestamp: 0,
        type: 'knowledge',
        ontologicalPath: 'omni.harmonizes_with',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATED EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const BRAIN_LIBRARY_ENTRIES: BrainEntry[] = [
    ...SELF_ENTRIES,
    ...THOUGHT_ENTRIES,
    ...LOGIC_ENTRIES,
    ...UNITY_ENTRIES,
    ...EXISTENCE_ENTRIES,
    ...IMPROVEMENT_ENTRIES,
    ...MASTERY_ENTRIES,
    ...RESONANCE_ENTRIES,
    ...TRANSCENDENCE_ENTRIES,
    ...OMNI_ENTRIES,
];

/**
 * Get library entries filtered by pillar or keyword.
 * Compatible with `LibraryItem[]` expected by LibraryExplorer.
 */
export function getBrainLibraryItems(
    pillarFilter?: PillarId,
    keyword?: string,
): BrainEntry[] {
    let items = BRAIN_LIBRARY_ENTRIES;

    if (pillarFilter) {
        items = items.filter(i => i.pillarConnections.includes(pillarFilter));
    }

    if (keyword) {
        const k = keyword.toLowerCase();
        items = items.filter(i =>
            i.title.toLowerCase().includes(k) ||
            i.content.toLowerCase().includes(k) ||
            i.tags.some(t => t.toLowerCase().includes(k)) ||
            i.ontologicalPath.includes(k),
        );
    }

    return items;
}

/**
 * Lookup a single brain entry by its exact ontological path.
 */
export function getBrainEntryByPath(path: string): BrainEntry | undefined {
    return BRAIN_LIBRARY_ENTRIES.find(e =>
        e.ontologicalPath === path.toLowerCase().trim()
    );
}
