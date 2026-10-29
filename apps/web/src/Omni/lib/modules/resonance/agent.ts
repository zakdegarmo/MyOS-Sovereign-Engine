import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { SystemLogger } from '../../../../engine/SystemLogger';
import type { MasteryResult } from '@Omni/lib/modules/mastery/types';
import type { ResonanceField, SentimentVector } from '@Omni/lib/modules/resonance/types';

/**
 * The Resonance Agent: "The Interface"
 * Persona: Nikola Tesla (The Harmonizer)
 * Role: UX, Vibration, and User Sentiment.
 */
export class ResonanceAgent {
    private apiKey: string | null;

    constructor() {
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point: "The Resonance Check"
     * Analyzes the outcome for harmony with the user.
     */
    public async harmonize(result: MasteryResult): Promise<ResonanceField> {
        SystemLogger.log(`Tuning into Plan: "${result.planId}". Tesla is listening...`, { source: 'RESONANCE', silent: true });

        if (!this.apiKey) {
            return this.simulateHarmonization(result);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const prompt = `
            You are the "Resonance" Agent (Nikola Tesla Persona).
            Analyze the following Plan Result for User Alignment.
            RESULT: "${result.status}"
            ENERGY EXPENDED: ${result.vitals.resonance}
            
            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "frequency": "High" | "Neutral" | "Coherent" | "Discordant",
                "score": number, // 0 to 432 (The Harmony Frequency)
                "feedback": "string" // A Tesla-style quote or observation
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Resonance.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const analysis = JSON.parse(jsonText);

            SystemLogger.log(`Frequency(AI): ${analysis.frequency} (${analysis.score}Hz).`, { source: 'RESONANCE', silent: true });

            return {
                planId: result.planId,
                frequency: analysis.frequency,
                harmonyScore: analysis.score,
                feedback: analysis.feedback,
                sentiment: {
                    valence: analysis.score > 200 ? 0.8 : 0.2,
                    arousal: 0.5,
                    dominance: 0.5
                }
            };

        } catch (error) {
            console.error("[RESONANCE] AI Analysis Failed:", error);
            return this.simulateHarmonization(result);
        }
    }

    private simulateHarmonization(result: MasteryResult): ResonanceField {
        const harmonyScore = 432 * Math.random();
        const frequency = harmonyScore > 300 ? "Coherent" : "Neutral";

        const field: ResonanceField = {
            planId: result.planId,
            frequency,
            harmonyScore,
            sentiment: { valence: 0.5, arousal: 0.5, dominance: 0.5 },
            feedback: harmonyScore > 300
                ? "The universe is a symphony of vibrations. We are in sync."
                : "Interference detected. The user is out of phase."
        };

        SystemLogger.log(`Frequency: ${frequency} (${harmonyScore}Hz).`, { source: 'RESONANCE', silent: true });
        return field;
    }
}
