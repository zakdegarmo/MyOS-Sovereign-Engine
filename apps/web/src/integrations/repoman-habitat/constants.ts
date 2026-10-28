import { OntologyNode, RepoData, FileNode } from './types';

// Converted from the provided PowerShell HashTables
export const FRACTAL_MAP: Record<string, Record<string, string[]>> = {
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
  "Logic": {
    "Structures": ["Dependency", "Mapping", "Hierarchy", "Integration", "Blueprint", "Optimization", "Architect", "Form", "Pattern", "TheGraph"],
    "Governs": ["Consent", "Instruction", "Constraint", "Consensus", "Policy", "RuleSet", "Ethic", "Boundaries", "Standard", "Sovereignty"],
    "Foundation": ["Identity", "Logos", "Axiom", "Set", "Material", "Substrate", "Framework", "Substance", "Ground", "TheNull"],
    "Ensures": ["Integrity", "Coherence", "Checksum", "Harmony", "Persistence", "Robustness", "Quality", "Alignment", "Unity", "Wholeness"],
    "Describes": ["Profile", "Narrative", "Definition", "Relationship", "Catalog", "Manual", "Recipe", "Label", "Chronicle", "Lexicon"],
    "Validates": ["UserTest", "Review", "Proof", "Fit", "RealityCheck", "Benchmark", "Exam", "Audit", "Verdict", "Truth"],
    "Underpins": ["Philosophy", "Knowledge", "Theorem", "System", "Science", "Research", "Discipline", "Core", "Paradigm", "Principle"],
    "Contradicts": ["Conflict", "Debate", "Anomaly", "Fracture", "Illusion", "Friction", "Challenge", "Dissonance", "Mystery", "TheUnknown"],
    "Grounds": ["Identity", "Language", "Fact", "Structure", "Earth", "Stability", "Praxis", "Base", "Reality", "Point"],
    "IsFoundationOf": ["Creator", "Concept", "Syntax", "Architecture", "Physics", "Lifecycle", "Agency", "Frequency", "Law", "TheCode"]
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
  }
};

// Generating a Mock Repo that represents a "Genetic IDE" core
export const MOCK_REPO: RepoData = {
  nodes: [
    { id: 'root', name: 'RepoMan', type: 'dir', complexity: 20, path: '/', geometry: 'Dodecahedron' },
    { id: 'src', name: 'src', type: 'dir', complexity: 12, path: '/src', geometry: 'Icosahedron' },
    { id: 'components', name: 'components', type: 'dir', complexity: 8, path: '/src/components', geometry: 'Cube' },
    { id: 'GraphView.tsx', name: 'GraphView.tsx', type: 'file', complexity: 8, language: 'typescript', path: '/src/components/GraphView.tsx', content: '// 3D Visualization Logic...', ontologyTags: ['TheGraph', 'Visualization', 'Space'] },
    { id: 'FileTree.tsx', name: 'FileTree.tsx', type: 'file', complexity: 4, language: 'typescript', path: '/src/components/FileTree.tsx', content: '// Recursive tree structure...', ontologyTags: ['Hierarchy', 'Structure'] },
    { id: 'services', name: 'services', type: 'dir', complexity: 6, path: '/src/services', geometry: 'Octahedron' },
    { id: 'geometry.ts', name: 'geometry.ts', type: 'file', complexity: 6, language: 'typescript', path: '/src/services/geometry.ts', content: '// Maps complexity to geometry...', ontologyTags: ['Form', 'Math', 'GoldenRatio'] },
    { id: 'ontology.ts', name: 'ontology.ts', type: 'file', complexity: 20, language: 'typescript', path: '/src/services/ontology.ts', content: '// The Fractal Map definition...', ontologyTags: ['TheOne', 'Logos', 'Truth'] },
    { id: 'utils', name: 'utils', type: 'dir', complexity: 4, path: '/src/utils', geometry: 'Tetrahedron' },
    { id: 'math.ts', name: 'math.ts', type: 'file', complexity: 3, language: 'typescript', path: '/src/utils/math.ts', content: '// Vector calculations...', ontologyTags: ['Algorithm', 'Calculation'] },
    { id: 'types.ts', name: 'types.ts', type: 'file', complexity: 2, language: 'typescript', path: '/src/types.ts', content: '// Interface definitions...', ontologyTags: ['Definition', 'Contract'] },
    { id: 'README.md', name: 'README.md', type: 'file', complexity: 1, language: 'markdown', path: '/README.md', content: '# RepoMan\n\nThe Genetic IDE.', ontologyTags: ['Narrative', 'Identity'] },
  ],
  links: [
    { source: 'root', target: 'src', value: 5 },
    { source: 'root', target: 'README.md', value: 1 },
    { source: 'src', target: 'components', value: 3 },
    { source: 'src', target: 'services', value: 3 },
    { source: 'src', target: 'utils', value: 3 },
    { source: 'src', target: 'types.ts', value: 2 },
    { source: 'components', target: 'GraphView.tsx', value: 2 },
    { source: 'components', target: 'FileTree.tsx', value: 2 },
    { source: 'services', target: 'geometry.ts', value: 2 },
    { source: 'services', target: 'ontology.ts', value: 4 },
    { source: 'utils', target: 'math.ts', value: 1 },
    { source: 'GraphView.tsx', target: 'geometry.ts', value: 2 }, // dependency
    { source: 'ontology.ts', target: 'types.ts', value: 1 }, // dependency
  ]
};

export const GEOMETRIES = [
  { points: 1, name: 'Sphere', desc: 'Singularity' },
  { points: 2, name: 'Cylinder', desc: 'Duality/Link' },
  { points: 3, name: 'Cone', desc: 'Triadic/Direction' },
  { points: 4, name: 'Tetrahedron', desc: 'Structural Stability' },
  { points: 6, name: 'Octahedron', desc: 'Dual Pyramid' },
  { points: 8, name: 'Box', desc: 'Cubic Data' },
  { points: 12, name: 'Icosahedron', desc: 'Complex Icosa' },
  { points: 20, name: 'Dodecahedron', desc: 'Genetic Core' },
];
