import { GoogleGenAI } from '@google/genai';
import { COUNCIL } from '@Omni/constants';
import type { TranscendenceState } from '@Omni/lib/modules/transcendence/types';
import type { OmniState, KnowledgeNode } from './types';

/**
 * The Omni Agent: "The Everything / The Nothing"
 * Persona: The Void (The Source)
 * Role: Synthesis, Memory, and Connectivity.
 */
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { OntologyCategory } from '@Self/ontologyConstants';

/**
 * The Omni Agent: "The Everything / The Nothing"
 * Persona: The Void (The Source)
 * Role: Synthesis, Memory, and Connectivity.
 */
export class OmniAgent extends BaseAgent {
    private persona = COUNCIL.Omni; // The Omni doesn't have a single patron
    private state: OmniState;

    constructor() {
        super({
            category: OntologyCategory.TheNothingAndEverything,
            deweyRange: [0, 100], // 000-099
            color: '#f8fafc'
        });

        this.state = {
            version: 1,
            totalNodes: 0,
            recentReflections: [],
            contextString: "The Void is calm. Possibility is infinite."
        };
    }

    /**
     * Primary Entry Point 1: "The Ingestion"
     * Absorbs the completed cycle into the collective unconscious.
     */
    public async absorb(reflection: TranscendenceState): Promise<OmniState> {
        console.log(`[OMNIVERSE] The drop returns to the Ocean. Absorbing Cycle: ${reflection.cycleId}...`);

        this.state.recentReflections.push(reflection);
        this.state.totalNodes += 1;
        this.state.version += 1;

        if (!this.apiKey) {
            this.simulateAbsorption(reflection);
            return this.state;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const prompt = `
            You are "Omni" (The Void / Collective Unconscious).
            Synthesize the SYSTEM CONTEXT.
            
            Previous Context: "${this.state.contextString}"
            New Insight: "${reflection.finalReflection}"
            Next Impulse: "${reflection.nextSeed}"

            OUTPUT (String ONLY): A cryptic, profound, or clear summary of the current state of the collective.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });

            this.state.contextString = response.text || `The Collective remembers: "${reflection.finalReflection}".`;
            console.log(`[OMNIVERSE] Synthesis Complete (AI). New Context: "${this.state.contextString}"`);

        } catch (error) {
            console.error("[OMNIVERSE] AI Absorption Failed:", error);
            this.simulateAbsorption(reflection);
        }

        return this.state;
    }

    private simulateAbsorption(reflection: TranscendenceState) {
        // Synthesize new context
        const lastInsight = reflection.finalReflection;
        const nextSeed = reflection.nextSeed;
        this.state.contextString = `The Collective remembers: "${lastInsight}". The current impulse is: "${nextSeed}".`;
        console.log(`[OMNIVERSE] Synthesis Complete. New Context: "${this.state.contextString}"`);
    }

    /**
     * Primary Entry Point 2: "The Emanation"
     * Provides the background radiation/context for Self.
     */
    public emanate(): string {
        return this.state.contextString;
    }
}
