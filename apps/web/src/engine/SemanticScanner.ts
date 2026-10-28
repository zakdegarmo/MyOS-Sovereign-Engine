/**
 * SemanticScanner.ts
 * 
 * Automates the process of "Scanning" an object to generate 100 semantic data points.
 * Uses the RelationshipMatrix to build the query and saves results to SemanticCache.
 */

import { generateRelationshipMatrixQuery } from './RelationshipMatrix';
import { SemanticCache } from './SemanticCache';
import { sendMessageToGemini } from '../Thought/services/tutorGeminiService';

export const SemanticScanner = {
    /**
     * Scan a subject (object, person, or concept).
     * This triggers an LLM call to populate the 10x10 matrix.
     */
    scan: async (subject: string): Promise<any> => {
        console.log(`[SemanticScanner] Initiating Deep Scan for: ${subject}...`);

        // Check cache first
        const existing = SemanticCache.get(subject);
        if (existing) {
            console.log(`[SemanticScanner] Cache HIT for: ${subject}`);
            return existing.traits;
        }

        // Build the ontological query
        let query = generateRelationshipMatrixQuery(subject);

        // GROUNDING: Load library context (Pillar definitions)
        try {
            const pillars = ['Self', 'Thought', 'Logic', 'Unity', 'Existence', 'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'];
            let libraryContext = "\n--- ONTOLOGICAL CONTEXT FROM LIBRARY ---\n";
            
            // We use the available local file system hook or a direct fetch if in public
            // Since this is in the public folder, we can fetch them
            for (const pillar of pillars) {
                try {
                    const response = await fetch(`/library/${pillar}.md`);
                    if (response.ok) {
                        const text = await response.text();
                        // Just take the first 500 chars of each to avoid context blowing up too much? 
                        // Or full if they are reasonable.
                        libraryContext += `\nPILLAR: ${pillar}\n${text.slice(0, 1000)}\n`;
                    }
                } catch (e) {
                    console.warn(`Could not load library context for ${pillar}`);
                }
            }
            
            query = libraryContext + "\n--- END CONTEXT ---\n" + query;
        } catch (err) {
            console.error("Failed to load ontological grounding", err);
        }

        try {
            // Using Gemini for the deep scan due to high reasoning window needed for 100 data points
            const response = await sendMessageToGemini([], query, undefined, true);

            
            // Expected format is a valid JSON object matching the matrix structure
            let traits: any;
            try {
                // Extract JSON if wrapped in markdown
                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                const jsonStr = jsonMatch ? jsonMatch[0] : response.text;
                traits = JSON.parse(jsonStr);
            } catch (e) {
                console.error("[SemanticScanner] Failed to parse LLM response as JSON", e);
                // Fallback: dummy data or partial success?
                return null;
            }

            // Save to persistent cache
            SemanticCache.save(subject, traits);
            return traits;

        } catch (error) {
            console.error("[SemanticScanner] LLM Scan failed", error);
            throw error;
        }
    }
};
