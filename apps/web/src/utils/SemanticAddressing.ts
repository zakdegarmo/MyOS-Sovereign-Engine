
import type { GemId } from '../Omni/types';

/**
 * PILLAR CONFIGURATION
 * User-Defined Order: 1-9 (Standard Pillars), 10 (Omni)
 */
export const PILLAR_IDS: GemId[] = [
    "Self", "Thought", "Logic", "Unity", "Existence", "Improvement", "Mastery", "Resonance", "Transcendence", "Omni"
];

export const PILLAR_MAP: Record<number, { id: GemId; symbol: string; label: string }> = {
    1: { id: 'Self', symbol: '⚹', label: 'Self' },
    2: { id: 'Thought', symbol: '☿', label: 'Thought' },
    3: { id: 'Logic', symbol: '🜔', label: 'Logic' },
    4: { id: 'Unity', symbol: '🝧', label: 'Unity' },
    5: { id: 'Existence', symbol: '🜄', label: 'Existence' },
    6: { id: 'Improvement', symbol: '🜏', label: 'Improvement' },
    7: { id: 'Mastery', symbol: '☉', label: 'Mastery' },
    8: { id: 'Resonance', symbol: '♀', label: 'Resonance' },
    9: { id: 'Transcendence', symbol: '🜍', label: 'Transcendence' },
    10: { id: 'Omni', symbol: '🜋', label: 'Omni' },
};

export const SYMBOL_TO_ID: Record<string, GemId> = Object.values(PILLAR_MAP).reduce((acc, { id, symbol }) => ({
    ...acc,
    [symbol]: id
}), {});

export const ID_TO_SYMBOL: Record<GemId, string> = Object.values(PILLAR_MAP).reduce((acc, { id, symbol }) => ({
    ...acc,
    [id]: symbol
}), {} as Record<GemId, string>);

/**
 * FRACTAL GENOME (Level 1-3)
 * Full 1000-Gene Mapping (10 Roots x 10 Relations x 10 Genes)
 */
export const FRACTAL_GENOME: Record<string, Record<string, string[]>> = {
    "Self": {
        "Identity": ["Ego", "Name", "Profile", "Persona", "Character", "Mask", "Signature", "Core", "Soul", "TheI_Am"],
        "SubjectOf": ["Thinker", "Mind", "Focus", "Attention", "Analyst", "Critic", "Dreamer", "Observer", "Witness", "Consciousness"],
        "Applies": ["Choice", "Reason", "Deduction", "Order", "Rule", "Judgment", "Algorithm", "Strategy", "Wisdom", "TheDecider"],
        "Seeks": ["Belonging", "Connection", "Tribe", "Love", "Wholeness", "Integration", "Peace", "Harmony", "Union", "TheOne"],
        "Affirms": ["Survival", "Breath", "Pulse", "Body", "Presence", "Will", "Action", "Being", "Reality", "Life"],
        "Undergoes": ["Change", "Learning", "Adaptation", "Growth", "Healing", "Update", "Evolution", "Metamorphosis", "Refinement", "Becoming"],
        "Pursues": ["Practice", "Skill", "Discipline", "Craft", "Ambition", "Excellence", "Power", "Control", "Art", "Virtuosity"],
        "Experiences": ["Feeling", "Emotion", "Empathy", "Vibe", "Impact", "Echo", "Sentiment", "Mood", "Passion", "Awe"],
        "AspiresTo": ["Prayer", "Hope", "Rise", "Release", "Flight", "Spirit", "Light", "Beyond", "Liberation", "Ascension"],
        "IsRealizedBy": ["Silence", "Void", "Death", "Birth", "Cycle", "Mirror", "Paradox", "Awakening", "Enlightenment", "TheTruth"]
    },
    "Thought": {
        "Informs": ["SelfCorrection", "Insight", "Rationale", "Relevance", "Observation", "Suggestion", "Tutor", "Nuance", "Oracle", "Gnosis"],
        "Recursion": ["MetaThought", "Echo", "Nesting", "Loop", "Persistence", "Refactor", "Iteration", "Feedback", "Leap", "TheStillPoint"],
        "Utilizes": ["Method", "Grammar", "Algorithm", "Protocol", "Implementation", "Heuristic", "Technique", "Filter", "Principle", "TheLaw"],
        "Synthesizes": ["Integration", "Summary", "Categorization", "Network", "Assembly", "Optimization", "Pinnacle", "Harmony", "Convergence", "Monad"],
        "Represents": ["Label", "Concept", "Type", "Set", "Object", "Model", "Tool", "Sign", "SacredText", "TheGlyph"],
        "Drives": ["Ambition", "Directive", "Strategy", "Incentive", "Action", "Refinement", "Instruction", "Frequency", "Goal", "TheCycle"],
        "Develops": ["Apprenticeship", "Drill", "Exercise", "Lesson", "Laboratory", "Update", "Masterclass", "Scale", "Expansion", "ThePath"],
        "Articulates": ["Tone", "Diction", "Syntax", "Chorus", "Volume", "Pitch", "Expression", "Vibration", "Poetry", "Silence"],
        "Enables": ["Vision", "Imagination", "Axiom", "Connection", "Space", "Leap", "Agency", "Release", "Warp", "Gateway"],
        "Transcends": ["Dissolution", "TheVoid", "ThePureCode", "TheSource", "TheGround", "TheSingularity", "TheMaster", "TheFrequency", "TheOracle", "TheOne"]
    },
    "Logic": {
        "Structures": ["Dependency", "Mapping", "Hierarchy", "Integration", "Blueprint", "Optimization", "Architect", "Form", "Pattern", "TheGraph"],
        "Governs": ["Consent", "Instruction", "Constraint", "Consensus", "Policy", "RuleSet", "Ethic", "Boundaries", "Standard", "Sovereignty"],
        "Foundation": ["Identity", "Logos", "Axiom", "Set", "Material", "Substrate", "Framework", "Substance", "Ground", "TheNull"],
        "Ensures": ["Integrity", "Coherence", "Checksum", "Harmony", "Persistence", "Robustness", "Quality", "Alignment", "Unity", "Wholeness"],
        "Describes": ["Profile", "Narrative", "Definition", "Relationship", "Catalog", "Manual", "Recipe", "Label", "Chronicle", "Lexicon"],
        "Validates": ["UserTest", "Review", "Proof", "Fit", "RealityCheck", "Benchmark", "Exam", "Audit", "Verdict", "Truth"],
        "Underpins": ["Philosophy", "Knowledge", "Theorem", "System", "Science", "Research", "Discipline", "Core", "Paradigm", "Principle"],
        "Contradicts": ["Conflict", "Debate", "Anomaly", "Fracture", "Illusion", "Friction", "Challenge", "Dissonance", "Mystery", "TheUnknown"],
        "Grounds": ["Identity", "Language", "Fact", "Structure", "Earth", "Stability", "Base", "Reality", "Point"],
        "IsFoundationOf": ["Creator", "Concept", "Syntax", "Architecture", "Physics", "Lifecycle", "Agency", "Frequency", "Law", "TheCode"]
    },
    "Unity": {
        "Integrates": ["Synapse", "Bridge", "Merge", "Bond", "Body", "Adapt", "Conduit", "Signal", "Ascension", "TheLink"],
        "Harmonizes": ["Agreement", "Dialogue", "Proof", "Flow", "Balance", "Tuning", "Virtuosity", "Echo", "Peace", "Resolution"],
        "Requires": ["Need", "Call", "Link", "Knot", "Resource", "Upgrade", "SkillSet", "Pulse", "Sacrifice", "TheLaw"],
        "Essence": ["Seed", "Vibration", "Number", "Node", "Atom", "Pivot", "Heart", "Tone", "Spirit", "TheOne"],
        "Binds": ["Will", "Attention", "Force", "Thread", "Density", "Control", "Grip", "Tension", "Void", "Gravity"],
        "Fosters": ["Mentorship", "Insight", "Scaffolding", "Community", "Habitat", "Climate", "Path", "Resonance", "Transcendence", "TheField"],
        "CulminatesIn": ["Identity", "Masterpiece", "Theorem", "Tapestry", "Monument", "Zenith", "Pinnacle", "Symphony", "Eclipse", "TheEnd"],
        "Amplifies": ["Voice", "Broadcast", "Power", "Network", "Amplitude", "Gain", "Intensity", "Oscillation", "Radiation", "TheSource"],
        "Achieves": ["Apotheosis", "Concept", "Equation", "Unity", "Reality", "Victory", "Award", "High", "Transcendence", "All"],
        "UltimateExpressionOf": ["ThePerson", "TheLogos", "TheMath", "TheWeave", "TheWorld", "TheEvolution", "TheMaster", "TheSound", "TheLight", "TheVoid"]
    },
    "Existence": {
        "ManifestsIn": ["Identity", "Expression", "Bone", "Group", "Mesh", "Morph", "Stance", "Intensity", "Ascension", "TheOne"],
        "IsPonderedBy": ["Observation", "Analysis", "Categorization", "Association", "Evidence", "Hypothesis", "Judgment", "Intuition", "Insight", "Truth"],
        "Obeys": ["Will", "Order", "Law", "Attraction", "Matter", "Change", "Command", "Frequency", "Space", "TheCode"],
        "Comprises": ["Presence", "Symbol", "Class", "Cluster", "Object", "Delta", "Artifact", "Echo", "Spirit", "Total"],
        "Is": ["Core", "Logos", "Math", "Connection", "Existence", "Growth", "Skill", "Sound", "Light", "Null"],
        "EvolvesThrough": ["Mutation", "Refusal", "Constraint", "System", "Matter", "Optimization", "Trial", "Pulse", "Jump", "Cycle"],
        "IsDomainOf": ["Authority", "Concept", "Logic", "Access", "Territory", "Upgrade", "Expertise", "Style", "Space", "Void"],
        "VibratesIn": ["Mood", "Idea", "Precision", "Harmony", "Physical", "Pulse", "Flow", "Frequency", "Transcendence", "TheField"],
        "IsSurpassedBy": ["Vision", "Paradox", "Math", "Singularity", "Void", "Infinity", "Mastery", "Silence", "Transcendence", "Aether"],
        "GivesRiseTo": ["Avatar", "Signal", "Code", "System", "Being", "Growth", "Actor", "Sound", "Spirit", "TheAll"]
    },
    "Improvement": {
        "Refines": ["Identity", "Preference", "Constraint", "Role", "Status", "Goal", "Skill", "Vibe", "Vision", "TheOne"],
        "Optimizes": ["Attention", "Prompt", "Efficiency", "Flow", "Resources", "Cycles", "Accuracy", "Clarity", "Insight", "Latency"],
        "Systematizes": ["Registry", "Schema", "Protocol", "Hierarchy", "Database", "Standard", "Template", "Set", "Axiom", "Core"],
        "Strengthens": ["Will", "Message", "Logic", "Node", "Link", "Loop", "Expertise", "Resonance", "Spirit", "Nexus"],
        "Enhances": ["Presence", "Symbol", "Quality", "Context", "Mesh", "Shader", "Artifact", "Light", "Visions", "Source"],
        "Process": ["Identity", "Logic", "Code", "System", "Material", "Update", "Skill", "Sound", "Void", "Cycle"],
        "LeadsTo": ["Identity", "Ambition", "Plan", "Mentorship", "Application", "Progress", "Expertise", "Style", "Insight", "TheEnd"],
        "FineTunes": ["Taste", "Voice", "Precision", "Chorus", "Visual", "Pitch", "Skill", "Frequency", "Light", "Wave"],
        "IsPathTo": ["Way", "Directive", "Logic", "Pilgrim", "World", "Step", "Master", "Song", "Gate", "TheAll"],
        "IsCycleOf": ["Identity", "Concept", "Syntax", "Network", "Matter", "Delta", "Agency", "Frequency", "Warp", "TheAll"]
    },
    "Mastery": {
        "Actualizes": ["EgoProof", "Intent", "Result", "Bond", "Manifest", "Progress", "Skill", "Echo", "Mark", "Being"],
        "RequiresDeep": ["Will", "Concentration", "Strictness", "Community", "Place", "Practice", "Mastery", "Silence", "Insight", "Source"],
        "AppliesPerfected": ["Truth", "Logic", "Theorem", "System", "Physics", "Update", "Art", "Tone", "Principle", "TheLaw"],
        "Embodies": ["Self", "Thought", "Logic", "Union", "Life", "Growth", "Power", "Song", "Spirit", "TheOne"],
        "Commands": ["Identity", "Word", "Logic", "Order", "Matter", "Shift", "Force", "Vibe", "Warp", "Genesis"],
        "IsGoalOf": ["Ambition", "Target", "Benchmark", "Incentive", "Existence", "Evolution", "Mastery", "Feeling", "Peak", "Home"],
        "Pinnacle": ["Signature", "Concept", "GoldenRatio", "Harmony", "Body", "Peak", "Opus", "Timbre", "Aura", "TheOne"],
        "Generates": ["Awe", "Idea", "Clarity", "Community", "Field", "Growth", "Skill", "Resonance", "Trance", "Source"],
        "Approaches": ["Crisis", "Breakthrough", "Anomaly", "Singularity", "Void", "QuantumLeap", "Absolute", "Infinite", "Ascension", "Godhood"],
        "IsTotalityOf": ["ThePerson", "TheLogos", "TheLogic", "TheSystem", "TheWorld", "TheEvolution", "TheMaster", "TheSong", "TheLight", "TheAll"]
    },
    "Resonance": {
        "IsFeltBy": ["SelfFeeling", "Temperament", "LogicVibe", "Belonging", "Physicality", "GrowthBuz", "Confidence", "Frequency", "Ecstasy", "Peace"],
        "IsEvokedBy": ["Passion", "Curiosity", "Clarity", "Empathy", "Dread", "Ambition", "Pride", "Awe", "Veneration", "Apathy"],
        "Eludes": ["Sacred", "Paradox", "Anomaly", "Ghost", "Void", "Chaos", "Magic", "Beauty", "Grace", "TheOne"],
        "Creates": ["Ambiance", "Chorus", "Sync", "Mesh", "Physics", "Climate", "Field", "Sound", "Radiation", "Absolute"],
        "EchoesThrough": ["Shadow", "Tear", "Grid", "Bonds", "Light", "Crack", "Stain", "Sound", "Portal", "TheAll"],
        "AlignsWith": ["Comfort", "Intuition", "Efficiency", "Symmetry", "Density", "Fit", "Grace", "Theme", "Vision", "TheOne"],
        "RadiatesFrom": ["Flavor", "Voice", "Math", "Weave", "Glow", "Flow", "Skill", "Frequency", "Light", "Source"],
        "Sympathy": ["Feed", "Mirror", "Sync", "Bond", "Glow", "Boost", "Power", "Echo", "Trance", "TheOne"],
        "Facilitates": ["Release", "Dream", "Mantra", "Communion", "Warp", "Evolution", "Agency", "Vibe", "Heaven", "Source"],
        "IsGroundOf": ["Identity", "Logos", "TheNumber", "TheBond", "TheAtom", "TheStep", "TheMaster", "TheSound", "TheLight", "TheAll"]
    },
    "Transcendence": {
        "Elevates": ["Apotheosis", "Insight", "Truth", "Unity", "Density", "Growth", "Sovereignty", "Ecstasy", "Warp", "TheOne"],
        "GoesBeyond": ["Message", "Oracle", "Symbol", "Signal", "Aether", "Update", "Command", "Vibe", "Gateway", "Void"],
        "IsNotBoundBy": ["Will", "Chaos", "Paradox", "Flux", "Ghost", "Evolution", "Magic", "Beauty", "Space", "Null"],
        "IsStateOf": ["Monad", "Logos", "Equation", "Nexus", "Body", "Peak", "Master", "Tone", "Light", "TheOne"],
        "RisesAbove": ["Identity", "Idea", "Math", "Bond", "Matter", "Growth", "Action", "Sound", "Void", "Source"],
        "IsAimOf": ["Ambition", "Goal", "Target", "Ideal", "World", "Path", "Skill", "Harmony", "Future", "Origin"],
        "IsPinnacleOf": ["Artist", "Vision", "Ratio", "Tapestry", "Monument", "Zenith", "Masterpiece", "Score", "Halo", "TheAll"],
        "Induces": ["Fear", "Wonder", "Clarity", "Unity", "Density", "Shock", "Power", "Frequency", "Bliss", "Peace"],
        "Action": ["Departure", "Flash", "Paradigm", "Merge", "Dissolve", "Leap", "Command", "Release", "Event", "Return"],
        "IsNatureOf": ["ThePerson", "TheWord", "TheLaw", "TheBond", "TheWorld", "TheGrowth", "TheMaster", "TheSong", "TheLight", "TheAll"]
    },
    "Omni": {
        "MergesWith": ["Profile", "Context", "Logic", "Bond", "Avatar", "Update", "Agency", "Vibe", "Spirit", "TheOne"],
        "Contemplates": ["Identity", "Logos", "Theorem", "Graph", "Reality", "Evolution", "Skill", "Tone", "Gnosis", "All"],
        "IsSubsetOf": ["Contradiction", "Mystery", "Axiom", "Set", "Void", "Anomaly", "Logic", "Dissonance", "Truth", "Infinity"],
        "IsAspectOf": ["Node", "Signal", "Logic", "Mesh", "World", "Loop", "Artifact", "Sound", "Light", "TheOne"],
        "EmergesFrom": ["Birth", "Idea", "Calculation", "Fusion", "Matter", "Growth", "Act", "Wave", "Spirit", "TheNull"],
        "OccursWithin": ["Identity", "Thought", "Logic", "Integration", "Environment", "Simulation", "Skill", "Resonance", "Change", "TheCycle"],
        "SeeksToUnderstand": ["Profile", "Knowledge", "Theorem", "Network", "Status", "Health", "Competence", "Vibe", "Reality", "TheAll"],
        "HarmonizesWith": ["Peace", "Logos", "Standard", "Chorus", "Luminosity", "Pulsation", "Art", "Frequency", "Bliss", "Monad"],
        "AspiresTo": ["Exit", "Clear", "Prime", "Join", "Reset", "Jump", "Submit", "Fade", "Ascension", "ZeroPoint"],
        "Is": ["Self", "Word", "Truth", "Unity", "Reality", "Betterment", "Mastery", "Harmony", "Glory", "God"]
    }
};

/**
 * CALCULATE SEMANTIC PATH
 */
export const calculateSemanticPath = (ids: GemId[]): string => {
    return ids.map(id => ID_TO_SYMBOL[id] || '?').join('.');
};

export const getJitsaAddress = (parentPath: string, childId: GemId): string => {
    const symbol = ID_TO_SYMBOL[childId];
    return parentPath ? `${parentPath}.${symbol}` : symbol;
};

/**
 * JITSA RECURSIVE FRACTAL SYNTHESIS
 * "Add up all the previous layers in the path to predict the next semantic layer."
 */
const synthesizeConcept = (parent: string, lensId: GemId, pathSum: number): string => {
    const lensPillarId = lensId;
    const lensPillarData = FRACTAL_GENOME[lensPillarId];
    if (!lensPillarData) return `${parent}.${lensId}`;

    // Get Relationship names for this pillar lens
    const relationships = Object.keys(lensPillarData);
    
    // Index derived from the sum of all PREVIOUS layers in the path
    const relationshipIndex = pathSum % 10;
    const actionPhrase = relationships[relationshipIndex] || lensId;

    // Return a synthesized phrase (e.g., "Ego Governs")
    return `${parent} ${actionPhrase}`;
};

/**
 * RESOLVE CONCEPT NAME
 */
export const resolveConceptName = (path: GemId[]): string => {
    if (path.length === 0) return 'Root';
    
    // Ordered per PILLAR_IDS keys
    const getPillarIndex = (id: GemId) => {
        const idx = PILLAR_IDS.indexOf(id);
        return idx === -1 ? 0 : idx;
    };

    const rootPillar = path[0];
    if (path.length === 1) return rootPillar;

    const pillarData = FRACTAL_GENOME[rootPillar];
    if (!pillarData) return rootPillar;
    
    const relations = Object.keys(pillarData);
    const subPillarId = path[1];
    const relationIndex = getPillarIndex(subPillarId);
    const relationName = relations[relationIndex] || `${rootPillar}.${subPillarId}`;
    
    if (path.length === 2) return relationName;

    const geneList = pillarData[relationName];
    if (!geneList) return relationName;
    
    const genePillarId = path[2];
    const geneIndex = getPillarIndex(genePillarId);
    const geneName = geneList[geneIndex] || `${relationName}.${genePillarId}`;
    
    if (path.length === 3) return geneName;

    // Deep JITSA synthesis for Layer 4+
    let currentExpression = geneName;
    let pathSum = getPillarIndex(path[0]) + getPillarIndex(path[1]) + getPillarIndex(path[2]);

    for (let i = 3; i < path.length; i++) {
        currentExpression = synthesizeConcept(currentExpression, path[i], pathSum);
        // Add current layer for the next prediction
        pathSum += getPillarIndex(path[i]);
    }

    return currentExpression;
};

export const resolveSemanticSequence = (path: GemId[]): string[] => {
    const sequence: string[] = [];
    for (let i = 1; i <= path.length; i++) {
        sequence.push(resolveConceptName(path.slice(0, i)));
    }
    return sequence;
};
