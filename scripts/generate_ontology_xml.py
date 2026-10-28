
import os

PILLAR_IDS = [
    "Omni", "Self", "Thought", "Logic", "Unity", "Existence", "Improvement", "Mastery", "Resonance", "Transcendence"
]

PILLAR_SYMBOLS = [
    "🜋", "⚹", "☿", "🜔", "🝧", "🜄", "🜏", "☉", "♀", "🜍"
]

FRACTAL_GENOME = {
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
}

def generate_xml():
    xml = [f'<?xml version="1.0" encoding="UTF-8"?>']
    xml.append(f'<MyOntology project="MyOS" version="1.0" totalNodes="1110">')
    
    for p_idx, p_id in enumerate(PILLAR_IDS):
        p_symbol = PILLAR_SYMBOLS[p_idx]
        xml.append(f'  <Pillar id="{p_id}" symbol="{p_symbol}" address="{p_idx}">')
        
        # In FRACTAL_GENOME, relations are the second grouping.
        # We'll map them according to the 10-bit addressing (0-9).
        if p_id in FRACTAL_GENOME:
            relations = list(FRACTAL_GENOME[p_id].keys())
            # Zip with symbols for the relation digit
            for r_idx, r_id in enumerate(relations):
                r_symbol = PILLAR_SYMBOLS[r_idx]
                xml.append(f'    <Relationship id="{r_id}" symbol="{r_symbol}" address="{p_idx}.{r_idx}">')
                
                genes = FRACTAL_GENOME[p_id][r_id]
                for g_idx, g_name in enumerate(genes):
                    g_symbol = PILLAR_SYMBOLS[g_idx]
                    xml.append(f'      <Gene id="{g_name}" symbol="{g_symbol}" address="{p_idx}.{r_idx}.{g_idx}" />')
                
                xml.append(f'    </Relationship>')
        
        xml.append(f'  </Pillar>')
        
    xml.append(f'</MyOntology>')
    return "\n".join(xml)

output_path = "C:/Users/zakde/Desktop/AntiGravity projects/MyOS/myontology-genome.xml"
try:
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(generate_xml())
    print(f"SUCCESS: XML generated at {output_path}")
except Exception as e:
    print(f"FAILURE: {e}")
