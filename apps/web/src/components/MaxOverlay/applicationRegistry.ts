// apps/web/src/components/MaxOverlay/applicationRegistry.ts

export interface ApplicationRoute {
    id: string;
    symbolSequence: string[]; // e.g. ['🜄', '⚹']
    manifestUrl: string;
}

export const APPLICATION_REGISTRY: Record<string, ApplicationRoute> = {
    'vault': {
        id: 'vault',
        symbolSequence: ['🜏'],
        manifestUrl: '/manifests/vault_v1.json'
    },
    'aether': {
        id: 'aether',
        symbolSequence: ['🜋'],
        manifestUrl: '/manifests/aether_v1.json'
    },
    'profile': {
        id: 'profile',
        symbolSequence: ['⚹'],
        manifestUrl: '/manifests/profile_v1.json'
    },
    'scanner': {
        id: 'scanner',
        symbolSequence: ['♀'],
        manifestUrl: '/manifests/scanner_v1.json'
    },
    'logic': {
        id: 'logic',
        symbolSequence: ['🜔'],
        manifestUrl: '/manifests/logic_v1.json'
    },
    'unity': {
        id: 'unity',
        symbolSequence: ['🝧'],
        manifestUrl: '/manifests/unity_v1.json'
    },
    'thought': {
        id: 'thought',
        symbolSequence: ['☿'],
        manifestUrl: '/manifests/thought_v1.json'
    },
    'transcendence': {
        id: 'transcendence',
        symbolSequence: ['🜍'],
        manifestUrl: '/manifests/transcendence_v1.json'
    },
    'mastery': {
        id: 'mastery',
        symbolSequence: ['☉'],
        manifestUrl: '/manifests/mastery_v1.json'
    },
    'nexus': {
        id: 'nexus',
        symbolSequence: ['🜋', '⚹'],
        manifestUrl: '/manifests/nexus_v1.json'
    },
    'lore-architect': {
        id: 'lore-architect',
        symbolSequence: ['🜄', '🕮'],
        manifestUrl: '/manifests/lore_v1.json'
    },
    'manifestation-chamber': {
        id: 'manifestation-chamber',
        symbolSequence: ['🜄', '☉'],
        manifestUrl: '/manifests/manifestation_v1.json'
    },
    'glyphrider': {
        id: 'glyphrider',
        symbolSequence: ['🜄', '🜔'],
        manifestUrl: '/manifests/glyphrider_v1.json'
    },
    'uniracers_world': {
        id: 'uniracers_world',
        symbolSequence: ['🜄', '🜔'],
        manifestUrl: '/manifests/glyphrider_v1.json'
    }
};

/**
 * Helper to find a manifest by its symbol sequence
 * Sequences are joined with '-' for lookup
 */
export const findApplicationBySequence = (sequence: string[]) => {
    const seqKey = sequence.join('-');
    return Object.values(APPLICATION_REGISTRY).find(app => app.symbolSequence.join('-') === seqKey);
};

export const getSequenceById = (id: string): string[] => {
    return APPLICATION_REGISTRY[id]?.symbolSequence || [];
};
