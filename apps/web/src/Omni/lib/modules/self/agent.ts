import { GoogleGenAI } from '@google/genai';
import { COUNCIL } from '@Omni/constants';
import { REFLEX_ACTIONS } from './types';
import type { StimulusContext, SelfState, ThoughtTrigger } from './types';

/**
 * The Self Agent: "The Subjective Observer & Intent Generator"
 * Architecture: W5H Ontology (Who, What, Where, When, Why, How)
 * Mode: Reflex (Brain Stem) vs. Reflection (Cortex)
 */
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { OntologyCategory } from '@Self/ontologyConstants';

/**
 * The Self Agent: "The Subjective Observer & Intent Generator"
 * Architecture: W5H Ontology (Who, What, Where, When, Why, How)
 * Mode: Reflex (Brain Stem) vs. Reflection (Cortex)
 */
export class SelfAgent extends BaseAgent {
    private state: SelfState;

    constructor() {
        super({
            category: OntologyCategory.Self,
            deweyRange: [100, 200],
            color: '#fb7185'
        });

        this.state = {
            currentPersona: COUNCIL.Self.patron.name, // Carl Jung
            focus: "Idle",
            energy: 100
        };
    }

    /**
     * Primary Entry Point: "The Mirror Check"
     * @param input Raw string from User or System
     * @param sender Who sent it? (Default: User)
     */
    public async processStimulus(input: string, sender: string = 'User'): Promise<{ action: string, data: any }> {
        // 1. Ingest & W5H Tagging
        const stimulus: StimulusContext = {
            sender,
            content: input,
            timestamp: Date.now(),
            urgency: this.assessUrgency(input)
        };

        console.log(`[SELF] Processing Stimulus: "${input}" (${sender})`);

        // 2. Layer 1: The Brain Stem (Reflex)
        // "Do I know how to do this automatically?"
        const reflex = this.reflexCheck(stimulus);
        if (reflex) {
            console.log(`[SELF] Reflex Triggered: ${reflex}`);
            return { action: 'REFLEX_EXECUTED', data: { type: reflex } };
        }

        // 3. Layer 2: The Cortex (Reflection)
        // "This requires Agency. I must Introspect."
        console.log(`[SELF] Entering Reflection Mode (Real AI)...`);
        const thoughtTrigger = await this.reflect(stimulus);

        if (thoughtTrigger.required) {
            return { action: 'THOUGHT_REQUIRED', data: thoughtTrigger };
        } else {
            return { action: 'DIRECT_RESPONSE', data: { message: thoughtTrigger.reasoning } };
        }
    }

    /**
     * Layer 1: Axiomatic Reflexes
     * Checks strictly for known atomic patterns.
     */
    private reflexCheck(stimulus: StimulusContext): string | null {
        const cleanInput = stimulus.content.toLowerCase().trim();

        // Simple patterns (can be expanded to a proper Registry later)
        if (cleanInput === 'ping') return 'ping';
        if (cleanInput.includes('clear log')) return 'clear_logs';
        if (['ok', 'thanks', 'good'].includes(cleanInput)) return 'ack';

        return null;
    }

    /**
     * Layer 2: Reflection (W5H Analysis)
     * Calls Gemini using the Carl Jung Persona.
     */
    private async reflect(stimulus: StimulusContext): Promise<ThoughtTrigger> {
        if (!this.apiKey) {
            console.warn("[SELF] No API Key found. Falling back to simulation.");
            return this.simulateReflection(stimulus);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            const prompt = `
            You are the Cortex of the Self Agent (Carl Jung Persona).
            Analyze the following Input Stimulus and decide if it requires Deep Thought (Council Meeting) or if you can answer it directly.

            INPUT: "${stimulus.content}"
            SENDER: ${stimulus.sender}
            URGENCY: ${stimulus.urgency}

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "required": boolean, // True if we need to call the "Thought" agent for creative/logical expansion. False if it's a simple chat.
                "type": "Divergent" | "Convergent" | "Simulation" | "None",
                "seed": "string", // If required=true, what is the core seed/prompt for the Thought agent?
                "reasoning": "string" // Why did you make this decision? (Jungian perspective)
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Self.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);

            return {
                required: result.required,
                type: result.type || 'None',
                seed: result.seed || stimulus.content,
                reasoning: result.reasoning || "Analysis complete."
            };

        } catch (error) {
            console.error("[SELF] AI Reflection Failed:", error);
            return this.simulateReflection(stimulus);
        }
    }

    /**
     * Fallback Simulation (Original Logic)
     */
    private simulateReflection(stimulus: StimulusContext): ThoughtTrigger {
        const { content, urgency } = stimulus;
        let triggerType: ThoughtTrigger['type'] = 'None';
        let seed = '';
        let reasoning = '';

        const isQuestion = content.includes('?');
        const isCreative = /create|imagine|design|new|build|forge|learn|study|research/i.test(content);
        const isProblem = /fix|error|broken|fail/i.test(content);

        // HOW: Decision Logic
        if (isProblem || urgency === 'high') {
            triggerType = 'Convergent';
            seed = `Constraint: System Stability. Goal: Resolve "${content}". Logic Agent required.`;
            reasoning = "Survival instinct triggered. Immediate solution needed.";
        } else if (isCreative) {
            triggerType = 'Divergent';
            seed = `Archetype: The Creator. Goal: Expansion of "${content}". Thought Agent required to generate 3 possibilities.`;
            reasoning = "Desire for creation detected. Need potentiality.";
        } else if (isQuestion) {
            triggerType = 'Simulation';
            seed = `Query: "${content}". Perspective: Jungian Analysis. Evaluate subjective implication.`;
            reasoning = "User seeks knowledge. Subjective interpretation required.";
        } else {
            // Default fallback
            triggerType = 'None';
            reasoning = "Input acknowledged. No immediate Agency required.";
        }

        return {
            required: triggerType !== 'None',
            type: triggerType,
            seed,
            reasoning
        };
    }

    /**
     * Simple heuristic for 'WHY' (Survival/Urgency)
     */
    private assessUrgency(input: string): StimulusContext['urgency'] {
        if (/error|critical|fatal|alert/i.test(input)) return 'high';
        if (/deadline|quick|now/i.test(input)) return 'medium';
        return 'low';
    }
}
