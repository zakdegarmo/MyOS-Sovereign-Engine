/**
 * ContextLoader.ts
 * 
 * Dynamically fetches the ontological definitions from the public/library 
 * directories to inject into the LLM Web Worker's JSON-LD payload.
 */

export interface OntologyDefinition {
    pillar: string;
    endpoint: string;
    term: string; // The specific string term (e.g., "Ego")
    content: string; // The markdown definition content
}

export const loadOntologyContext = async (
    pillar: string, 
    endpoint: string, 
    term: string
): Promise<OntologyDefinition> => {
    try {
        // Fetch the markdown file from the public library
        const response = await fetch(`/library/${pillar}/${endpoint}.md`);
        
        if (!response.ok) {
            throw new Error(`Failed to load definition for ${pillar} -> ${endpoint}`);
        }

        const fullMarkdown = await response.text();

        return {
            pillar,
            endpoint,
            term,
            content: fullMarkdown
        };
    } catch (err) {
        console.error(`[ContextLoader] Error:`, err);
        return {
            pillar,
            endpoint,
            term,
            content: `Definition missing for ${pillar} -> ${endpoint}`
        };
    }
};
