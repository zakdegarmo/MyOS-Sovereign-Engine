/**
 * SemanticCache.ts
 * 
 * Persistent storage for the 100-point Relationship Matrix traits.
 * This ensures that once an object is "scanned", its semantic depth is 
 * remembered across sessions and informs future LLM interactions.
 */

export interface SemanticTraitSet {
    subjectId: string;
    timestamp: number;
    traits: Record<string, Record<string, string>>; // Matrix: Pillars x Relationships
}

const CACHE_KEY = 'myos_semantic_cache';

export const SemanticCache = {
    /** Save a trait set for a specific subject (e.g., 'door_1', 'talia') */
    save: (subjectId: string, traits: Record<string, Record<string, string>>) => {
        const cache = SemanticCache.getAll();
        cache[subjectId] = {
            subjectId,
            timestamp: Date.now(),
            traits
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        console.log(`[SemanticCache] Saved 100 traits for: ${subjectId}`);
    },

    /** Load a trait set for a subject */
    get: (subjectId: string): SemanticTraitSet | null => {
        const cache = SemanticCache.getAll();
        return cache[subjectId] || null;
    },

    /** Get the entire cache */
    getAll: (): Record<string, SemanticTraitSet> => {
        try {
            const data = localStorage.getItem(CACHE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error("[SemanticCache] Failed to parse cache", e);
            return {};
        }
    },

    /** Clear a specific entry */
    clear: (subjectId: string) => {
        const cache = SemanticCache.getAll();
        delete cache[subjectId];
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
};
