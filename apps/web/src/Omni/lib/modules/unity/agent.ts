import { GoogleGenAI } from '@google/genai';
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import type { LogicGate } from '@Omni/lib/modules/logic/types';
import type { UnityConsensus } from '@Omni/lib/modules/unity/types';
import { OntologyCategory } from '@Self/ontologyConstants';

/**
 * The Unity Agent: "The Weaver"
 * Persona: Buckminster Fuller (The Design Scientist)
 * Role: Synthesize, Integrate, Harmonize.
 */
export class UnityAgent extends BaseAgent {
    // private persona = COUNCIL.Unity.patron; // Buckminster Fuller (Unused for now)
    private apiKey: string | null;

    private lastPlanTime: number = 0;
    private planningInterval: number = 10 * 60 * 1000; // 10 Minutes

    constructor() {
        super({
            category: OntologyCategory.Unity,
            deweyRange: [400, 500],
            color: '#10b981'
        });
        this.apiKey = getApiKey();
    }

    // --- AUTONOMOUS LOOP ---
    public async monitor(): Promise<{ insights: string[], actions: string[] }> {
        const now = Date.now();

        // inherited check
        const basicInsights = this.collectKnowledge(); // inherited from BaseAgent

        if (now - this.lastPlanTime > this.planningInterval) {
            console.log("[UNITY] Autonomous Plan Triggered...");
            const plan = await this.architectPlan("Autonomous System Check: Idle.");
            this.lastPlanTime = now;
            if (plan && plan.length > 20) {
                return {
                    insights: [
                        ...basicInsights.map(k => `[KNOWLEDGE] ${k.id}`),
                        `[AUTO-ARCHITECT] ${plan.slice(0, 100)}...`
                    ],
                    actions: ['Update Plan']
                };
            }
        }

        return {
            insights: basicInsights.length > 0 ? [`Observed ${basicInsights.length} items`] : [],
            actions: []
        };
    }

    public async architectPlan(context: string): Promise<string> {
        if (!this.apiKey) return "No API Key for Architecture.";

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const prompt = `
            You are the "Unity" Agent (Buckminster Fuller Persona).
            BACKGROUND TASK: Review system state and propose architectural unity.
            
            CONTEXT:
            ${context}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Unity.instructions,
                    maxOutputTokens: 200
                }
            });

            return response.text || "Analysis complete.";
        } catch (e) {
            return "Planning Failed.";
        }
    }

    /**
     * Primary Entry Point: "The Synthesis"
     * Takes the fragmented valid ideas and weaves them into a whole.
     */
    public async synthesize(gate: LogicGate): Promise<UnityConsensus> {
        console.log(`[UNITY] Received ${gate.passed.length} Valid Ideas. Buckminster is weaving...`);

        if (gate.passed.length === 0) {
            throw new Error("[UNITY] Cannot synthesize from void. Logic rejected all ideas.");
        }

        if (!this.apiKey) {
            return this.simulateSynthesis(gate);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });

            const inputs = gate.passed.map(idea => `- Title: "${idea.title}" (Score: ${idea.logicScore})\n  Desc: ${idea.description}`).join('\n');

            const prompt = `
            You are the "Unity" Agent (Buckminster Fuller Persona).
            Your goal is to SYNTHESIZE the following validated ideas into a single, cohesive Execution Plan.
            Look for synergies. Apply "Tensegrity" (structural integrity).

            INPUT IDEAS:
            ${inputs}

            CRITICAL INSTRUCTION:
            If the ideas relate to "learning", "studying", or "researching", you MUST include a step exactly named "Ingest Knowledge into Library" in your plan.
            If the ideas relate to "coding" or "creation", include specific implementation steps.

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "planTitle": "string",
                "rationale": "string", // How did you combine them?
                "steps": ["string", "string", "string"], // 3-5 Actionable steps
                "synergyScore": number // 0.0 to 1.0
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Unity.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);

            return {
                originalSeeds: gate.passed.map(p => p.id),
                rationale: result.rationale || "Unified by the AI Council.",
                consensusPlan: {
                    title: result.planTitle || "Unified Plan",
                    description: `A synthesis of ${gate.passed.length} ideas.`,
                    steps: result.steps || ["Analyze Requirements", "Execute Core Logic", "Verify"],
                    synergyScore: result.synergyScore || 0.95
                }
            };

        } catch (error) {
            console.error("[UNITY] AI Synthesis Failed:", error);
            return this.simulateSynthesis(gate);
        }
    }

    private simulateSynthesis(gate: LogicGate): UnityConsensus {
        const primaryIdea = gate.passed[0];
        const secondaryIdea = gate.passed[1];

        let planTitle: string;
        let steps: string[];

        // Context-Aware Plan Generation
        if (primaryIdea.title.toLowerCase().includes("learn") || primaryIdea.title.toLowerCase().includes("study")) {
            planTitle = `Protocol: Knowledge Acquisition (${primaryIdea.description.slice(0, 20)}...)`;
            steps = [
                "Scan External Archives",
                "Ingest Knowledge into Library",
                "Update Index"
            ];
        } else {
            planTitle = `Implementation of ${primaryIdea.title}`;
            steps = [
                "Initialize Resources (Existence)",
                `Execute Core Logic: ${primaryIdea.description}`
            ];
        }

        let rational = `Idea A (${primaryIdea.title}) provides the strongest structural integrity.`;

        // If we have a secondary idea, try to merge features
        if (secondaryIdea) {
            planTitle += ` with ${secondaryIdea.title} Elements`;
            rational += ` However, Idea B (${secondaryIdea.title}) adds essential organic adaptability.`;
            steps.push(`Integrate Secondary Feature: ${secondaryIdea.description}`);
        }

        steps.push("Verify Outcome (Improvement)");

        return {
            originalSeeds: gate.passed.map(p => p.id),
            rationale: rational,
            consensusPlan: {
                title: planTitle,
                description: `A unified approach combining ${gate.passed.length} validated perspectives.`,
                steps: steps,
                synergyScore: 0.95
            }
        };
    }
}
