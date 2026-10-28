export const INITIAL_RELATIONSHIP_MATRIX: Record<string, Record<string, string>> = {
    'Self': {
        'Self': 'Identity', 'Thought': 'Subject Of', 'Logic': 'Applies', 'Unity': 'Seeks',
        'Existence': 'Affirms', 'Improvement': 'Undergoes', 'Mastery': 'Pursues',
        'Resonance': 'Experiences', 'Transcendence': 'Aspires To', 'Nothing/Everything': 'Is Realized by'
    },
    'Thought': {
        'Self': 'Informs', 'Thought': 'Recursion', 'Logic': 'Utilizes', 'Unity': 'Synthesizes',
        'Existence': 'Represents', 'Improvement': 'Drives', 'Mastery': 'Develops',
        'Resonance': 'Articulates', 'Transcendence': 'Enables', 'Nothing/Everything': 'Transcends'
    },
    'Logic': {
        'Self': 'Structures', 'Thought': 'Governs', 'Logic': 'Foundation', 'Unity': 'Ensures',
        'Existence': 'Describes', 'Improvement': 'Validates', 'Mastery': 'Underpins',
        'Resonance': 'Contradicts', 'Transcendence': 'Grounds', 'Nothing/Everything': 'Is the Foundation Of'
    },
    'Unity': {
        'Self': 'Integrates', 'Thought': 'Harmonizes', 'Logic': 'Requires', 'Unity': 'Essence',
        'Existence': 'Binds', 'Improvement': 'Fosters', 'Mastery': 'Culminates In',
        'Resonance': 'Amplifies', 'Transcendence': 'Achieves', 'Nothing/Everything': 'Is the Ultimate Expression Of'
    },
    'Existence': {
        'Self': 'Manifests In', 'Thought': 'Is Pondered By', 'Logic': 'Obeys', 'Unity': 'Comprises',
        'Existence': 'Is', 'Improvement': 'Evolves Through', 'Mastery': 'Is Domain Of',
        'Resonance': 'Vibrates In', 'Transcendence': 'Is Surpassed By', 'Nothing/Everything': 'Gives Rise To'
    },
    'Improvement': {
        'Self': 'Refines', 'Thought': 'Optimizes', 'Logic': 'Systematizes', 'Unity': 'Strengthens',
        'Existence': 'Enhances', 'Improvement': 'Process', 'Mastery': 'Leads To',
        'Resonance': 'Fine-tunes', 'Transcendence': 'Is Path To', 'Nothing/Everything': 'Is the Cycle Of'
    },
    'Mastery': {
        'Self': 'Actualizes', 'Thought': 'Requires Deep', 'Logic': 'Applies Perfected', 'Unity': 'Embodies',
        'Existence': 'Commands', 'Improvement': 'Is Goal Of', 'Mastery': 'Pinnacle',
        'Resonance': 'Generates', 'Transcendence': 'Approaches', 'Nothing/Everything': 'Is the Totality Of'
    },
    'Resonance': {
        'Self': 'Is Felt By', 'Thought': 'Is Evoked By', 'Logic': 'Eludes', 'Unity': 'Creates',
        'Existence': 'Echoes Through', 'Improvement': 'Aligns With', 'Mastery': 'Radiates From',
        'Resonance': 'Sympathy', 'Transcendence': 'Facilitates', 'Nothing/Everything': 'Is the Ground Of'
    },
    'Transcendence': {
        'Self': 'Elevates', 'Thought': 'Goes Beyond', 'Logic': 'Is Not Bound By', 'Unity': 'Is A State Of',
        'Existence': 'Rises Above', 'Improvement': 'Is Aim Of', 'Mastery': 'Is Pinnacle Of',
        'Resonance': 'Induces', 'Transcendence': 'Action', 'Nothing/Everything': 'Is the Nature Of'
    },
    'Nothing/Everything': {
        'Self': 'Merges With', 'Thought': 'Contemplates', 'Logic': 'Is a Subset Of', 'Unity': 'Is an Aspect Of',
        'Existence': 'Emerges From', 'Improvement': 'Occurs Within', 'Mastery': 'Seeks to Understand',
        'Resonance': 'Harmonizes With', 'Transcendence': 'Aspires To', 'Nothing/Everything': 'is'
    }
};
