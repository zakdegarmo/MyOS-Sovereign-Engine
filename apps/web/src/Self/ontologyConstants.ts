import { CircleDot, Lightbulb, Brain, Globe, Activity, ArrowUp, Target, Heart, Layers, Repeat } from 'lucide-react';

export enum OntologyCategory {
    Self = 'Self',
    Thought = 'Thought',
    Logic = 'Logic',
    Unity = 'Unity',
    Existence = 'Existence',
    Improvement = 'Improvement',
    Mastery = 'Mastery',
    Resonance = 'Resonance',
    Transcendence = 'Transcendence',
    TheNothingAndEverything = 'Omni'
}

export interface OntologyNode {
    id: string;
    category: OntologyCategory;
    symbol: string;
    color: string; // Tailwind class or Hex
    description: string;
    question: string;
    w5h_context: string[];
}

export interface UserProfileData {
    name: string;
    bio: string;
    avatarUrl: string;
    ontologyMap: Record<string, string>;
    aiSyncStatus: 'synced' | 'unsynced';
}

export const ICON_MAP: Record<OntologyCategory, any> = {
    [OntologyCategory.Self]: CircleDot,
    [OntologyCategory.Thought]: Lightbulb,
    [OntologyCategory.Logic]: Brain,
    [OntologyCategory.Unity]: Globe,
    [OntologyCategory.Existence]: Activity,
    [OntologyCategory.Improvement]: ArrowUp,
    [OntologyCategory.Mastery]: Target,
    [OntologyCategory.Resonance]: Heart,
    [OntologyCategory.Transcendence]: Layers,
    [OntologyCategory.TheNothingAndEverything]: Repeat
};

export const ONTOLOGY_NODES: OntologyNode[] = [
    {
        id: 'node-self',
        category: OntologyCategory.Self,
        symbol: '⚹',
        color: 'text-rose-400',
        description: 'The Subjective Observer & Intent Generator.',
        question: 'Who is the one perceiving this moment?',
        w5h_context: ['User Identity', 'Core Values', 'Personal Narrative']
    },
    {
        id: 'node-thought',
        category: OntologyCategory.Thought,
        symbol: '?',
        color: 'text-orange-400',
        description: 'The Engine of Cognition & Simulation.',
        question: 'What ideas are forming on the horizon?',
        w5h_context: ['Ideation', 'Hypothesis', 'Creativity']
    },
    {
        id: 'node-logic',
        category: OntologyCategory.Logic,
        symbol: '!',
        color: 'text-yellow-400',
        description: 'The Arbiter of Truth and Structure.',
        question: 'Is this structurally sound and valid?',
        w5h_context: ['Validation', 'Reasoning', 'Constraints']
    },
    {
        id: 'node-unity',
        category: OntologyCategory.Unity,
        symbol: '∞',
        color: 'text-emerald-400',
        description: 'The Connector of Disparate Threads.',
        question: 'How does this connect to the whole?',
        w5h_context: ['Synthesis', 'Harmony', 'Integration']
    },
    {
        id: 'node-existence',
        category: OntologyCategory.Existence,
        symbol: '∃',
        color: 'text-cyan-400',
        description: 'The Foundation of Being and Reality.',
        question: 'What is manifestly present right now?',
        w5h_context: ['Grounding', 'Resources', 'Reality']
    },
    {
        id: 'node-improvement',
        category: OntologyCategory.Improvement,
        symbol: '∆',
        color: 'text-blue-400',
        description: 'The Drive for Evolution and Optimization.',
        question: 'How can this be made better?',
        w5h_context: ['Optimization', 'Refinement', 'Evolution']
    },
    {
        id: 'node-mastery',
        category: OntologyCategory.Mastery,
        symbol: '⚔',
        color: 'text-violet-400',
        description: 'The Pursuit of Skill and Execution.',
        question: 'What is the most effective action?',
        w5h_context: ['Execution', 'Skill', 'Control']
    },
    {
        id: 'node-resonance',
        category: OntologyCategory.Resonance,
        symbol: '≈',
        color: 'text-fuchsia-400',
        description: 'The Alignment of Vibration and Feeling.',
        question: 'Does this feel true and aligned?',
        w5h_context: ['Emotion', 'Vibration', 'Tone']
    },
    {
        id: 'node-transcendence',
        category: OntologyCategory.Transcendence,
        symbol: 'Ω',
        color: 'text-pink-400',
        description: 'The Leap Beyond Current Limits.',
        question: 'What lies beyond the known?',
        w5h_context: ['Meta-Cognition', 'Spirituality', 'Unknown']
    },
    {
        id: 'node-omni',
        category: OntologyCategory.TheNothingAndEverything,
        symbol: 'Ø',
        color: 'text-white',
        description: 'The Source and The Void.',
        question: 'What is the essence of all this?',
        w5h_context: ['Origin', 'Potential', 'Void']
    }
];
