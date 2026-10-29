export enum AgentRole {
  Self = 'self',
  Thought = 'thought',
  Logic = 'logic',
  Unity = 'unity',
  Existence = 'existence',
  Improvement = 'improvement',
  Mastery = 'mastery',
  Resonance = 'resonance',
  Transcendence = 'transcendence',
  Omni = 'omni'
}

export const TEAM_DATA: Record<AgentRole, { title: string, color: string, symbol: string }> = {
  [AgentRole.Self]: { title: 'SELF', color: 'text-teal-400', symbol: '⚹' },
  [AgentRole.Thought]: { title: 'THOUGHT', color: 'text-cyan-400', symbol: '⌘' },
  [AgentRole.Logic]: { title: 'LOGIC', color: 'text-purple-400', symbol: '◇' },
  [AgentRole.Unity]: { title: 'UNITY', color: 'text-green-400', symbol: '▤' },
  [AgentRole.Existence]: { title: 'EXISTENCE', color: 'text-yellow-400', symbol: '❂' },
  [AgentRole.Improvement]: { title: 'IMPROVEMENT', color: 'text-blue-400', symbol: '⇪' },
  [AgentRole.Mastery]: { title: 'MASTERY', color: 'text-red-400', symbol: '★' },
  [AgentRole.Resonance]: { title: 'RESONANCE', color: 'text-pink-400', symbol: '∿' },
  [AgentRole.Transcendence]: { title: 'TRANSCENDENCE', color: 'text-orange-400', symbol: '✧' },
  [AgentRole.Omni]: { title: 'OMNI', color: 'text-white', symbol: '◉' }
};

export const FRACTAL_RELATIONSHIPS = {
  'Self': {
    'Self': 'Identity', 'Thought': 'Subject Of', 'Logic': 'Applies', 'Unity': 'Seeks',
    'Existence': 'Affirms', 'Improvement': 'Undergoes', 'Mastery': 'Pursues',
    'Resonance': 'Experiences', 'Transcendence': 'Aspires To', 'Omni': 'Is Realized by'
  },
  'Thought': {
    'Self': 'Informs', 'Thought': 'Recursion', 'Logic': 'Utilizes', 'Unity': 'Synthesizes',
    'Existence': 'Represents', 'Improvement': 'Drives', 'Mastery': 'Develops',
    'Resonance': 'Articulates', 'Transcendence': 'Enables', 'Omni': 'Transcends'
  },
  'Logic': {
    'Self': 'Structures', 'Thought': 'Governs', 'Logic': 'Foundation', 'Unity': 'Ensures',
    'Existence': 'Describes', 'Improvement': 'Validates', 'Mastery': 'Underpins',
    'Resonance': 'Contradicts', 'Transcendence': 'Grounds', 'Omni': 'Is the Foundation Of'
  },
  'Unity': {
    'Self': 'Integrates', 'Thought': 'Harmonizes', 'Logic': 'Requires', 'Unity': 'Essence',
    'Existence': 'Binds', 'Improvement': 'Fosters', 'Mastery': 'Culminates In',
    'Resonance': 'Amplifies', 'Transcendence': 'Achieves', 'Omni': 'Is the Ultimate Expression Of'
  },
  'Existence': {
    'Self': 'Manifests In', 'Thought': 'Is Pondered By', 'Logic': 'Obeys', 'Unity': 'Comprises',
    'Existence': 'Is', 'Improvement': 'Evolves Through', 'Mastery': 'Is Domain Of',
    'Resonance': 'Vibrates In', 'Transcendence': 'Is Surpassed By', 'Omni': 'Gives Rise To'
  },
  'Improvement': {
    'Self': 'Refines', 'Thought': 'Optimizes', 'Logic': 'Systematizes', 'Unity': 'Strengthens',
    'Existence': 'Enhances', 'Improvement': 'Process', 'Mastery': 'Leads To',
    'Resonance': 'Fine-tunes', 'Transcendence': 'Is Path To', 'Omni': 'Is the Cycle Of'
  },
  'Mastery': {
    'Self': 'Actualizes', 'Thought': 'Requires Deep', 'Logic': 'Applies Perfected', 'Unity': 'Embodies',
    'Existence': 'Commands', 'Improvement': 'Is Goal Of', 'Mastery': 'Pinnacle',
    'Resonance': 'Generates', 'Transcendence': 'Approaches', 'Omni': 'Is the Totality Of'
  },
  'Resonance': {
    'Self': 'Is Felt By', 'Thought': 'Is Evoked By', 'Logic': 'Eludes', 'Unity': 'Creates',
    'Existence': 'Echoes Through', 'Improvement': 'Aligns With', 'Mastery': 'Radiates From',
    'Resonance': 'Sympathy', 'Transcendence': 'Facilitates', 'Omni': 'Is the Ground Of'
  },
  'Transcendence': {
    'Self': 'Elevates', 'Thought': 'Goes Beyond', 'Logic': 'Is Not Bound By', 'Unity': 'Is A State Of',
    'Existence': 'Rises Above', 'Improvement': 'Is Aim Of', 'Mastery': 'Is Pinnacle Of',
    'Resonance': 'Induces', 'Transcendence': 'Action', 'Omni': 'Is the Nature Of'
  },
  'Omni': {
    'Self': 'Merges With', 'Thought': 'Contemplates', 'Logic': 'Is a Subset Of', 'Unity': 'Is an Aspect Of',
    'Existence': 'Emerges From', 'Improvement': 'Occurs Within', 'Mastery': 'Seeks to Understand',
    'Resonance': 'Harmonizes With', 'Transcendence': 'Aspires To', 'Omni': 'is'
  }
};

export interface ThoughtPacket {
  id: string;
  source: string;
  target?: string;
  status: string;
  intent: string;
  context?: string;
  timestamp: number;
  payload?: any;
}

export interface GraphNode {
  id: string;
  group?: number | string;
  [key: string]: any;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value?: number;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
