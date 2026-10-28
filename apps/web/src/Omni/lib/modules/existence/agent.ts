import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { UnityConsensus } from '@Omni/lib/modules/unity/types';
import { ExistentialManifest, ResourceState, TaskAllocation } from './types';

/**
 * The Existence Agent: "The Anchor"
 * Persona: Marcus Aurelius (The Stoic Emperor)
 * Role: Grounding, Resource Management, Reality Check.
 */
export class ExistenceAgent {
    private persona = COUNCIL.Existence.patron; // Marcus Aurelius
    private resources: ResourceState;
    private apiKey: string | null;

    constructor() {
        // Simulation of system state
        this.resources = {
            energy: 85,
            timeAvailable: 60, // 60 minutes
            environment: 'Development'
        };
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point: "The Grounding"
     * Takes the Ideal (Unity Plan) and maps it to the Real (Resources).
     */
    public async ground(consensus: UnityConsensus): Promise<ExistentialManifest> {
        console.log(`[EXISTENCE] Received Consensus: "${consensus.consensusPlan.title}". Marcus is measuring...`);

        if (!this.apiKey) {
            return this.simulateGrounding(consensus);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const stepList = consensus.consensusPlan.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');

            const prompt = `
            You are the "Existence" Agent (Marcus Aurelius Persona).
            Your goal is to GROUND the following plan into Reality. 
            Estimate the "Energy Cost" (Cognitive Load/effort) for each step (0-100).
            Total Energy Available: ${this.resources.energy}.

            PLAN STEPS:
            ${stepList}

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "allocations": [
                    { "stepIndex": number, "cost": number, "priority": "Immediate" | "Background" }
                ],
                "impact": "Low" | "Medium" | "High" | "Critical",
                "feasible": boolean
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Existence.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);
            const allocations = result.allocations || [];

            // Map AI allocations back to plan steps
            const groundedSteps: TaskAllocation[] = allocations.map((a: any, i: number) => ({
                step: consensus.consensusPlan.steps[i] || "Unknown Step",
                estimatedCost: a.cost || 10,
                priority: a.priority || "Background"
            }));

            return {
                planId: `manifest-${Date.now()}`,
                groundedSteps: groundedSteps,
                resourceImpact: result.impact || 'Medium',
                executableNow: result.feasible ?? true
            };

        } catch (error) {
            console.error("[EXISTENCE] AI Grounding Failed:", error);
            return this.simulateGrounding(consensus);
        }
    }

    private simulateGrounding(consensus: UnityConsensus): ExistentialManifest {
        const manifest: ExistentialManifest = {
            planId: `manifest-${Date.now()}`,
            groundedSteps: [],
            resourceImpact: 'Low',
            executableNow: true
        };

        let totalCost = 0;

        for (const step of consensus.consensusPlan.steps) {
            // Logic: Estimate cost based on complexity keywords
            let cost = 5;
            if (step.includes("Build") || step.includes("Implement")) cost = 20;
            if (step.includes("Verify")) cost = 10;

            const allocation: TaskAllocation = {
                step,
                estimatedCost: cost,
                priority: cost > 15 ? 'Immediate' : 'Background'
            };

            manifest.groundedSteps.push(allocation);
            totalCost += cost;
        }

        // Reality Check
        if (totalCost > this.resources.energy) {
            manifest.resourceImpact = 'Critical';
            manifest.executableNow = false;
            console.log(`[EXISTENCE] Warning: Plan requires ${totalCost} energy. Available: ${this.resources.energy}.`);
        } else {
            console.log(`[EXISTENCE] Reality Check Passed. Cost: ${totalCost}.`);
        }

        return manifest;
    }
}
