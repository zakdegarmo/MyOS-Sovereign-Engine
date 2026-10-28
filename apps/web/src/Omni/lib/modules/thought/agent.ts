import { GoogleGenAI } from '@google/genai';
import { COUNCIL } from '@Omni/constants';
import type { ThoughtTrigger } from '@Omni/lib/modules/self/types';
import type { ThoughtStream, IdeaNode } from './types';

/**
 * The Thought Agent: "The Engine of Cognition"
 * Persona: Leonardo da Vinci (Polymath, Artist, Inventor)
 * Role: Expand, Simulate, Connect (Divergent Thinking)
 */
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { OntologyCategory } from '@Self/ontologyConstants';

/**
 * The Thought Agent: "The Engine of Cognition"
 * Persona: Leonardo da Vinci (Polymath, Artist, Inventor)
 * Role: Expand, Simulate, Connect (Divergent Thinking)
 */
export class ThoughtAgent extends BaseAgent {
    private persona = COUNCIL.Thought.patron; // Leonardo da Vinci

    constructor() {
        super({
            category: OntologyCategory.Thought,
            deweyRange: [200, 300], // 200-299
            color: '#6366f1'
        });
    }

    /**
     * Primary Entry Point: "The Expansion"
     * Takes a seed from Self and explodes it into possibilities.
     */
    public async expand(trigger: ThoughtTrigger): Promise<ThoughtStream> {
        console.log(`[THOUGHT] Received Trigger: [${trigger.type}] "${trigger.seed}"`);

        if (!this.apiKey) {
            console.log(`[THOUGHT] No API Key. Simulating Da Vinci...`);
            return this.simulateExpansion(trigger);
        }

        console.log(`[THOUGHT] Leonardo is contemplating (Real AI)...`);

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            const prompt = `
            You are the "Thought" Agent (Leonardo da Vinci Persona).
            Your goal is to generate 3 divergent, creative, or logical ideas based on the input SEED.
            
            INPUT SEED: "${trigger.seed}"
            MODE: ${trigger.type}

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "narrative": "string", // A short, cryptic, or inspiring sentence reflecting your thought process (Da Vinci style).
                "ideas": [
                    {
                        "title": "string",
                        "description": "string", // Detailed explanation of the concept
                        "wildness": number, // 0.0 to 1.0 (How abstract/crazy is it?)
                        "feasibility": number // 0.0 to 1.0 (How doable is it?)
                    },
                    ... (Total of 3 ideas)
                ]
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Thought.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);

            // Map results to IdeaNodes
            const ideaNodes: IdeaNode[] = (result.ideas || []).map((idea: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: idea.title || "Untitled Idea",
                description: idea.description || "No description.",
                wildness: idea.wildness || 0.5,
                feasibility: idea.feasibility || 0.5,
                connections: []
            }));

            return {
                seed: trigger.seed,
                mode: trigger.type,
                ideas: ideaNodes,
                narrative: result.narrative || "The mind expands."
            };

        } catch (error) {
            console.error("[THOUGHT] AI Expansion Failed:", error);
            return this.simulateExpansion(trigger);
        }
    }

    private async simulateExpansion(trigger: ThoughtTrigger): Promise<ThoughtStream> {
        const stream: ThoughtStream = {
            seed: trigger.seed,
            mode: trigger.type,
            ideas: [],
            narrative: ""
        };

        if (trigger.type === 'Divergent') {
            stream.narrative = "The mind wanders as a river. We must not be bound by the shore.";
            stream.ideas = [
                this.createIdea(`The Mechanical Approach to "${trigger.seed.slice(0, 30)}..."`, `A structured implementation focusing on stability and logic regarding: ${trigger.seed}`, 0.4, 0.9),
                this.createIdea(`The Biological Metaphor for "${trigger.seed.slice(0, 30)}..."`, `An adaptive system that grows and learns from: ${trigger.seed}`, 0.8, 0.5),
                this.createIdea(`The Aetheric Shift of "${trigger.seed.slice(0, 30)}..."`, "Do not solve it. Transmute the problem into art.", 0.9, 0.2)
            ];
        }

        else if (trigger.type === 'Convergent') {
            stream.narrative = "The scattered light must be focused through the lens. Precision is beauty.";
            stream.ideas = [
                this.createIdea("The Keystone", "Identify the single structural weakness and brace it.", 0.2, 0.95),
                this.createIdea("The Architect's Plan", "Refactor the foundation before building higher.", 0.5, 0.8)
            ];
        }

        else if (trigger.type === 'Simulation') {
            stream.narrative = "I see the bird in flight. I see the wind. I see the fall.";
            stream.ideas = [
                this.createIdea("Scenario A: Success", "The user engages deeply. System load increases by 20%.", 0.3, 0.8),
                this.createIdea("Scenario B: Confusion", "The interface is too abstract. Rejection rate 60%.", 0.3, 0.9)
            ];
        }

        return stream;
    }

    private createIdea(title: string, description: string, wildness: number, feasibility: number): IdeaNode {
        return {
            id: Math.random().toString(36).substr(2, 9),
            title,
            description,
            wildness,
            feasibility,
            connections: []
        };
    }
}
