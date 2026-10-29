import { GoogleGenAI, Type } from "@google/genai";
import type { Book, LibraryNode, Synapse, UserGestalt, GemId } from '@Omni/types';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { getAllBooks } from '@Omni/utils/libraryUtils';


const SYNAPSE_PROMPT = `
You are the Synapse Engine of the Mystra Nexus.
Compare the SOURCE BOOK with the CANDIDATE BOOK.
Determine if a meaningful connection exists between them based on the User's Gestalt.

USER GESTALT:
- Core Values: {{VALUES}}
- Narrative Arc: {{NARRATIVE}}

SOURCE BOOK:
Title: "{{SOURCE_TITLE}}"
Summary: "{{SOURCE_SUMMARY}}"
Patron: {{SOURCE_PATRON}}

CANDIDATE BOOK:
Title: "{{TARGET_TITLE}}"
Summary: "{{TARGET_SUMMARY}}"
Patron: {{TARGET_PATRON}}

CLASSIFICATION RULES:
- thematic: They explore the same concept from different angles.
- contradiction: They fundamentally disagree or offer opposing viewpoints (High value for "Truth over Comfort").
- supporting: The candidate provides evidence, history, or foundation for the source.
- evolution: The source is a more advanced or complex iteration of the candidate.
- none: No strong connection worth logging.

OUTPUT:
Return JSON. If 'none', set type to null.
`;

const SYNAPSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['thematic', 'contradiction', 'supporting', 'evolution', 'null'] },
        strength: { type: Type.NUMBER, description: "0.0 to 1.0" },
        insight: { type: Type.STRING, description: "One sentence explaining the connection." }
    },
    required: ["type", "strength", "insight"]
};

export class SerendipityEngine {
    private apiKey: string;
    private ai: GoogleGenAI;

    constructor() {
        this.apiKey = getApiKey() || '';
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    }

    // The "Tribunal" Heuristic
    private selectCandidates(source: Book, library: LibraryNode): Book[] {
        const allBooks = getAllBooks(library).filter(b => b.id !== source.id);
        if (allBooks.length === 0) return [];

        const candidates: Set<Book> = new Set();

        // 1. Peer (Same Patron or DDC)
        const peers = allBooks.filter(b => b.patron === source.patron || (b.ddc?.number && b.ddc.number === source.ddc?.number));
        if (peers.length > 0) candidates.add(peers[Math.floor(Math.random() * peers.length)]);

        // 2. Challenger (Opposing Patron if defined, or just distinct)
        // Simple heuristic: If Logic, find Resonance/Thought. If Existence, find Unity.
        // For now, just pick a distinct patron.
        const challengers = allBooks.filter(b => b.patron !== source.patron);
        if (challengers.length > 0) candidates.add(challengers[Math.floor(Math.random() * challengers.length)]);

        // 3. Wildcard (Pure Random)
        candidates.add(allBooks[Math.floor(Math.random() * allBooks.length)]);

        return Array.from(candidates).slice(0, 5); // Increased to 5 for better demo results
    }

    public async generateSynapses(
        source: Book,
        library: LibraryNode,
        gestalt: UserGestalt
    ): Promise<Synapse[]> {
        if (!this.apiKey) {
            console.warn("SerendipityEngine: No API Key available.");
            return [];
        }

        const candidates = this.selectCandidates(source, library);
        const newSynapses: Synapse[] = [];

        console.log(`[Serendipity] Analyzing ${candidates.length} candidates for "${source.title}"...`);

        for (const target of candidates) {
            try {
                const prompt = SYNAPSE_PROMPT
                    .replace("{{VALUES}}", gestalt.coreValues.join(', '))
                    .replace("{{NARRATIVE}}", gestalt.narrativeArc)
                    .replace("{{SOURCE_TITLE}}", source.title)
                    .replace("{{SOURCE_SUMMARY}}", source.summary)
                    .replace("{{SOURCE_PATRON}}", source.patron || 'Unknown')
                    .replace("{{TARGET_TITLE}}", target.title)
                    .replace("{{TARGET_SUMMARY}}", target.summary)
                    .replace("{{TARGET_PATRON}}", target.patron || 'Unknown');

                const response = await this.ai.models.generateContent({
                    model: 'gemini-flash-latest', // Fast model for connections
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: SYNAPSE_SCHEMA
                    }
                });

                const result = JSON.parse(response.text || "{}");

                if (result.type && result.type !== 'null' && result.type !== null) {
                    const synapse: Synapse = {
                        id: `syn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        sourceId: source.id,
                        targetId: target.id,
                        type: result.type,
                        strength: result.strength || 0.5,
                        insight: result.insight || "Connected by the Serendipity Engine.",
                        createdAt: Date.now()
                    };
                    newSynapses.push(synapse);
                    console.log(`[Serendipity] Linked: "${source.title}" <-> "${target.title}" (${synapse.type})`);
                }

            } catch (error) {
                console.error(`[Serendipity] Failed to analyze pair:`, error);
            }
        }

        return newSynapses;
    }
}
