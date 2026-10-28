import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { SystemLogger } from '../../../../engine/SystemLogger';
import type { ResonanceField } from '@Omni/lib/modules/resonance/types';
import type { TranscendenceState } from '@Omni/lib/modules/transcendence/types';

/**
 * The Transcendence Agent: "The Alchemist"
 * Persona: Rumi (The Mystic)
 * Role: Wholeness, Completion, and Return.
 */
export class TranscendenceAgent {
    private apiKey: string | null;

    constructor() {
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point: "The Ascension"
     * Returns the energy to the source.
     */
    public async ascend(field: ResonanceField): Promise<TranscendenceState> {
        SystemLogger.log(`Received Field: ${field.frequency}. Rumi is dancing...`, { source: 'TRANSCENDENCE', silent: true });

        if (!this.apiKey) {
            return this.simulateAscension(field);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const prompt = `
            You are the "Transcendence" Agent (Rumi Persona).
            Reflect on the Cycle.
            Harmony Score: ${field.harmonyScore}
            Feedback: "${field.feedback}"

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "isComplete": boolean, // true if harmony > 70
                "reflection": "string", // A Rumi poem/quote
                "nextSeed": "string" // "Rest" or "Refinement"
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Transcendence.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);

            return {
                cycleId: field.planId,
                isComplete: result.isComplete ?? (field.harmonyScore > 70),
                finalReflection: result.reflection || "The wheel turns.",
                nextSeed: result.nextSeed || "Rest"
            };

        } catch (error) {
            SystemLogger.error("AI Ascension Failed", { source: 'TRANSCENDENCE', telemetry: true });
            return this.simulateAscension(field);
        }
    }

    private simulateAscension(field: ResonanceField): TranscendenceState {
        const isComplete = field.harmonyScore > 70;

        // Rumi's Reflection
        const reflection = isComplete
            ? "The drop has returned to the ocean. The work is done, yet it never began."
            : "The clay is still wet. The wheel must turn again.";

        // The Ouroboros: What comes next?
        const nextSeed = isComplete
            ? "Rest"
            : "Refinement";

        SystemLogger.log(`Cycle Complete? ${isComplete}.`, { source: 'TRANSCENDENCE', silent: true });
        SystemLogger.log(`"${reflection}"`, { source: 'TRANSCENDENCE', silent: true });

        return {
            cycleId: field.planId,
            isComplete,
            finalReflection: reflection,
            nextSeed
        };
    }
}
