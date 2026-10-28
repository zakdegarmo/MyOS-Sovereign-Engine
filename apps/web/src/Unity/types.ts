
export type ConceptKey =
    | 'Self'
    | 'Thought'
    | 'Logic'
    | 'Unity'
    | 'Existence'
    | 'Improvement'
    | 'Mastery'
    | 'Resonance'
    | 'Transcendence'
    | 'Omni';

export interface ConceptNode {
    id: ConceptKey;
    symbol: string;
    color: string;
    description: string; // Short description
}

export interface Relationship {
    source: ConceptKey;
    target: ConceptKey;
    label: string;
}

export interface W5HContent {
    who: string;
    what: string;
    when: string;
    why: string;
    where: string;
    how: string;
    raw: string; // The full text provided
}

export interface SystemAnalysisContent {
    raw: string;
    parsed: W5HContent;
}

export interface OntologyData {
    nodes: ConceptNode[];
    links: Relationship[];
    content: Record<ConceptKey, W5HContent>;
    systemAnalysis: Record<ConceptKey, SystemAnalysisContent>;
}
