import { OntologyCategory } from '@Self/ontologyConstants';
import { RELATIONSHIPS as RELATIONSHIP_MATRIX, COUNCIL } from '@Omni/constants';
import type { LibraryNode } from '@Omni/types';
import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';

export interface AgentConfig {
    category: OntologyCategory;
    deweyRange: [number, number]; // Inclusive start, Exclusive end (e.g. 100, 200 for 100-199)
    color: string;
}

export abstract class BaseAgent {
    protected config: AgentConfig;
    protected library: LibraryNode | null = null;
    protected graphNodes: any[] = [];
    protected apiKey: string | null;

    constructor(config: AgentConfig) {
        this.config = config;
        this.apiKey = getApiKey();
    }

    public setLibrary(library: LibraryNode) {
        this.library = library;
    }

    public setGraphNodes(nodes: any[]) {
        this.graphNodes = nodes;
    }

    /**
     * Main Monitoring Loop
     * 1. Collect Knowledge (Dewey Scan)
     * 2. Observe Relationships (Matrix Scan)
     */
    public async monitor(): Promise<{ insights: string[], actions: string[] }> {
        const insights: string[] = [];
        const actions: string[] = [];

        // 1. Collect Knowledge
        const knowledge = this.collectKnowledge();
        if (knowledge.length > 0) {
            insights.push(`[${this.config.category}] Observed ${knowledge.length} items in Dewey Range ${this.config.deweyRange[0]}-${this.config.deweyRange[1]}`);
        }

        // 2. Observe Relationships
        const relations = this.observeRelationships();
        if (relations.length > 0) {
            relations.forEach(r => insights.push(r));
        }

        return { insights, actions };
    }

    /**
     * Scans the Library for content within the Agent's Dewey Domain
     */
    protected collectKnowledge(): any[] {
        if (!this.library) return [];
        const items = this.flattenLibrary(this.library);

        return items.filter(item => {
            // Simple check: does it have a 'dewey' field? or infer from id/tags?
            // Assuming item might have explicit dewey or we map it.
            // For now, let's look for explicit 'dewey' property or assume standard mapping if absent.
            const dewey = (item as any).dewey || (item as any).meta?.dewey;
            if (typeof dewey === 'number') {
                return dewey >= this.config.deweyRange[0] && dewey < this.config.deweyRange[1];
            }
            if (typeof dewey === 'string') {
                const num = parseInt(dewey.substring(0, 3));
                return !isNaN(num) && num >= this.config.deweyRange[0] && num < this.config.deweyRange[1];
            }
            return false;
        });
    }

    /**
     * Scans the Relationship Matrix for connections
     */
    protected observeRelationships(): string[] {
        const matrix = RELATIONSHIP_MATRIX[this.config.category];
        if (!matrix) return [];

        const observations: string[] = [];

        // For each relationship defined in the matrix
        Object.entries(matrix).forEach(([targetCategory, relation]) => {
            // Check if there are active nodes in the graph belonging to this target category
            const targetNodes = this.graphNodes.filter(n => n.group === 'core' && n.id === targetCategory);

            if (targetNodes.length > 0) {
                observations.push(`[RELATIONSHIP] ${this.config.category} -> ${relation} -> ${targetCategory}`);
            }
        });

        return observations;
    }
    // ... (skip to flattenLibrary)
    private flattenLibrary(node: LibraryNode): any[] {
        let items: any[] = [];
        // Fix: books property not on LibraryNode type check
        if ((node as any).books) items = [...items, ...(node as any).books];
        if (node.children) {
            Object.values(node.children).forEach(child => {
                items = [...items, ...this.flattenLibrary(child)];
            });
        }
        return items;
    }

    /**
     * Consult the Agent with a specific query and context.
     * Uses the Persona defined in COUNCIL constants.
     */
    public async consult(query: string, contextItems: any[] = []): Promise<string> {
        if (!this.apiKey) return `[${this.config.category}] Error: No API Key available for consultation.`;

        const profile = COUNCIL[this.config.category as keyof typeof COUNCIL];
        if (!profile) return `[${this.config.category}] I am silent. (No Persona Found)`;

        console.log(`[${this.config.category.toUpperCase()}] Consulting...`);

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            // Build Context Block
            let contextBlock = "";
            if (contextItems.length > 0) {
                contextBlock = `\n\n[[ RELEVANT MEMORY ]]\nThe following Knowledge/Memories are relevant to the user's query. Use them to inform your perspective:\n\n`;
                contextItems.forEach((item, idx) => {
                    const contentSnippet = item.content.length > 1000 ? item.content.substring(0, 1000) + "..." : item.content;
                    contextBlock += `ITEM ${idx + 1} (${item.title || item.name}):\n${contentSnippet}\n---\n`;
                });
            }

            const prompt = `
            ${contextBlock}

            USER QUERY: "${query}"
            
            Respond as your Persona (${profile.name}).
            Keep it concise (under 150 words) unless asked otherwise.
            Stay strictly in character: ${profile.shortDesc}.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash', // Fast for conversational feel
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: profile.instructions,
                }
            });

            return response.text || "...";

        } catch (error) {
            console.error(`[${this.config.category}] Consultation Error:`, error);
            return `[${this.config.category}] *Static Interference* (Error: ${error})`;
        }
    }
}
