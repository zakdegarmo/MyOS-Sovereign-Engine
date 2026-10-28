import { GoogleGenAI } from '@google/genai';
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { ExistentialManifest } from '@Omni/lib/modules/existence/types';
import { OptimizedPlan, OptimizationReport, PatternReport } from '@Omni/lib/modules/improvement/types';

/**
 * The Improvement Agent: "The Optimizer"
 * Persona: Benjamin Franklin (The Self-Improver)
 * Role: Efficiency, Versioning, and Learning (Pattern Recognition).
 */
export class ImprovementAgent {
    private persona = COUNCIL.Improvement.patron; // Benjamin Franklin
    private apiKey: string | null;

    constructor() {
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point 1: "The Polish"
     * Refines a grounded plan before execution.
     */
    public async optimize(manifest: ExistentialManifest): Promise<OptimizationReport> {
        console.log(`[IMPROVEMENT] Received Manifest: "${manifest.planId}".Ben Franklin is polishing...`);

        if (!this.apiKey) {
            return this.simulateOptimization(manifest);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const planText = manifest.groundedSteps.map(s => `- ${s.step} (Cost: ${s.estimatedCost})`).join('\n');

            const prompt = `
            You are the "Improvement" Agent(Benjamin Franklin Persona).
            Your goal is to OPTIMIZE the following Execution Plan.
            Look for redundancy.Can steps be combined ? Can they be done smarter ?
    Also, detect if this is a repeating pattern that should be saved as a workflow.

            CURRENT PLAN:
            ${planText}

            OUTPUT FORMAT(Return ONLY raw JSON):
{
    "optimizedSteps": ["string", "string"], // The refined list of actions
        "efficiencyGain": "string", // e.g. "15%"
            "insight": "string", // A Franklin-style quote or observation
                "patterns": {
        "detected": ["string"], // e.g. "Build-Verify Cycle"
            "proposal": {
            "name": "string",
                "steps": ["string", "string"]
        } // Optional
    }
}
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Improvement.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const result = JSON.parse(jsonText);

            const optimizedPlan: OptimizedPlan = {
                version: `v${Date.now().toString().slice(-4)} `,
                originalId: manifest.planId,
                actions: result.optimizedSteps || manifest.groundedSteps.map(s => s.step),
                estimatedEfficiencyGain: result.efficiencyGain || "0%"
            };

            const learning: PatternReport = {
                detectedPatterns: result.patterns?.detected || [],
                proposals: result.patterns?.proposal ? [{
                    name: result.patterns.proposal.name,
                    triggerFrequency: 1,
                    suggestedSteps: result.patterns.proposal.steps
                }] : []
            };

            console.log(`[IMPROVEMENT] Optimization Complete(AI).Gain: ${optimizedPlan.estimatedEfficiencyGain} `);

            return {
                plan: optimizedPlan,
                learning
            };

        } catch (error) {
            console.error("[IMPROVEMENT] AI Optimization Failed:", error);
            return this.simulateOptimization(manifest);
        }
    }

    private async simulateOptimization(manifest: ExistentialManifest): Promise<OptimizationReport> {
        // 1. Optimization Logic (Simulated)
        // Remove redundant steps or combine frequent ones.
        const uniqueSteps = [...new Set(manifest.groundedSteps.map(s => s.step))];
        const efficiency = ((1 - (uniqueSteps.length / manifest.groundedSteps.length)) * 100).toFixed(0);

        const optimizedPlan: OptimizedPlan = {
            version: `v${Date.now().toString().slice(-4)} `,
            originalId: manifest.planId,
            actions: uniqueSteps,
            estimatedEfficiencyGain: `${efficiency}% `
        };

        // 2. Learning Loop (Pattern Recognition)
        const patterns = await this.learn(uniqueSteps);

        console.log(`[IMPROVEMENT] Optimization Complete.Version ${optimizedPlan.version} ready.`);
        if (patterns.proposals.length > 0) {
            console.log(`[IMPROVEMENT] 💡 INSIGHT: A new workflow pattern was detected!`);
        }

        return {
            plan: optimizedPlan,
            learning: patterns
        };
    }

    /**
     * Primary Entry Point 2: "The Retrospective"
     * Analyzes history to find repeating tasks.
     */
    private async learn(currentActions: string[]): Promise<PatternReport> {
        const report: PatternReport = {
            detectedPatterns: [],
            proposals: []
        };

        // Simulation: If the plan involves "Build" AND "Verify", suggest a CI/CD workflow.
        const hasBuild = currentActions.some(a => a.includes("Build"));
        const hasVerify = currentActions.some(a => a.includes("Verify"));

        if (hasBuild && hasVerify) {
            report.detectedPatterns.push("Build-Verify Cycle");
            report.proposals.push({
                name: "Auto-Verification Workflow",
                triggerFrequency: 3,
                suggestedSteps: ["Build Component", "Run Tests", "Report Result"]
            });
        }

        return report;
    }
}
