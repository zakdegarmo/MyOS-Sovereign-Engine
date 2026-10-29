import { GoogleGenAI } from "@google/genai";
import { Book, LibraryNode, GhostNode, GemId, UserGestalt } from "../types";
import { getAllBooks } from "../utils/libraryUtils";
import { COUNCIL } from "../constants";

export class ProbabilityLoom {
    private genAI: GoogleGenAI;
    private model: any;

    constructor() {
        const apiKey = localStorage.getItem("mystra_api_key") || "";
        this.genAI = new GoogleGenAI({ apiKey });
        this.model = this.genAI.models;
    }

    /**
     * Spims the Loom to generate Ghost Nodes based on a trigger (Book/Thought) and the existing Library.
     * This is the "Rudder" for AI Hallucination.
     */
    async spin(trigger: Book, library: LibraryNode, gestalt: UserGestalt): Promise<GhostNode[]> {
        if (!trigger) return [];

        console.log(`[Loom] Spinning probability threads for: ${trigger.title}`);

        // 1. Gather Context (The Thread)
        const allBooks = getAllBooks(library);
        const contextBooks = this.selectContext(trigger, allBooks);

        if (contextBooks.length === 0) return []; // Cannot weave from nothing

        // 2. The Incantation (Prompt)
        const prompt = `
      You are the PROBABILITY LOOM, a sub-routine of the Mystra Nexus.
      Your goal is to generate "Ghost Nodes" - hypothetical knowledge that does not exist yet, but SHOULD.
      
      TRIGGER NODE:
      Title: "${trigger.title}"
      Summary: "${trigger.summary.substring(0, 300)}..."
      Keywords: ${(trigger.keywords || []).join(", ")}

      CONTEXT NODES (Existing Data):
      ${contextBooks.map(b => `- "${b.title}" (${(b.keywords || []).slice(0, 2).join(", ")})`).join("\n")}

      USER GESTALT (The User's Core Values):
      ${gestalt.coreValues.join(", ")}

      TASK:
      Generate 3 Ghost Nodes.
      1. A BRIDGE: A hypothetical book/concept that links the TRIGGER to one of the CONTEXT NODES.
      2. AN EXTRAPOLATION: What is the logical next step after the TRIGGER? (e.g. "Advanced X")
      3. A SHADOW: What is the dangerous failure mode or opposing philosophy to the TRIGGER?

      RETURN FORMAT (JSON ARRAY ONLY):
      [
        {
          "title": "Title of Ghost Node",
          "summary": "Brief description of this hypothetical concept.",
          "type": "bridge" | "extrapolation" | "shadow",
          "probability": 0.5 to 0.9,
          "parentIds": ["${trigger.id}", "OPTIONAL_CONTEXT_ID"],
          "patron": "GemName" (Pick one: Thought, Logic, Unity, Mastery, Everything)
        }
      ]
    `;

        try {
            const result = await this.model.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            const text = result.text() || "[]";

            // Clean and Parse JSON
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const rawNodes = JSON.parse(jsonStr);

            // 3. Materialize (Convert to GhostNode objects)
            const ghostNodes: GhostNode[] = rawNodes.map((raw: any) => ({
                id: `ghost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'ghost',
                title: `[GHOST] ${raw.title}`,
                summary: raw.summary,
                probability: raw.probability,
                parentIds: raw.parentIds,
                spawnedAt: Date.now(),
                expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 Days TTL
                patron: raw.patron as GemId,
                keywords: ['ghost', raw.type, ...trigger.keywords.slice(0, 2)]
            }));

            return ghostNodes;

        } catch (error) {
            console.error("[Loom] Thread snapped:", error);
            return [];
        }
    }

    /**
     * Selects random but relevant books from the library to serve as context.
     */
    private selectContext(trigger: Book, allBooks: Book[]): Book[] {
        // Filter out the trigger itself
        const candidates = allBooks.filter(b => b.id !== trigger.id);

        if (candidates.length < 3) return candidates;

        // Simple heuristic: 1 keyword match + 2 randoms
        const relevant = candidates.filter(b =>
            b.keywords &&
            trigger.keywords &&
            b.keywords.some(k => trigger.keywords.includes(k))
        );
        const randoms = candidates.filter(b => !relevant.includes(b));

        // Shuffle and pick
        const selection = [
            ...relevant.sort(() => 0.5 - Math.random()).slice(0, 1),
            ...randoms.sort(() => 0.5 - Math.random()).slice(0, 2)
        ];

        return selection.slice(0, 3);
    }
}
