import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { BaseAgent } from '@Omni/lib/modules/BaseAgent';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { OptimizedPlan, WorkflowProposal } from '@Omni/lib/modules/improvement/types';
import { MasteryResult, WorkflowArtifact } from '@Omni/lib/modules/mastery/types';

/**
 * The Mastery Agent: "The Builder"
 * Persona: Michelangelo (The Craftsman)
 * Role: Execution, Creation, and Refinement.
 */
export class MasteryAgent {
    private persona = COUNCIL.Mastery.patron; // Michelangelo
    private apiKey: string | null;

    constructor() {
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point: "The Work"
     * Executes the optimized plan.
     */
    public async execute(plan: OptimizedPlan, newWorkflow?: WorkflowProposal): Promise<MasteryResult> {
        console.log(`[MASTERY] Received Plan: ${plan.version}. Michelangelo takes up the chisel...`);
        const startTime = Date.now();
        const logs: string[] = [];
        const artifacts: WorkflowArtifact[] = [];

        // 1. Execution Loop
        for (const action of plan.actions) {
            console.log(`[MASTERY] Executing Action: "${action}"`);

            // HYBRID APPROACH: Check local strings first (Speed), then AI (Intelligence)
            // Local Check
            if (action.includes("Ingest Knowledge")) {
                await this.ingestLibraryEntry("Ancient Texts & AI"); // Default topic checks
                logs.push(`Executed: Real Ingestion(Local Match)`);
                continue;
            }

            // AI Check
            if (this.apiKey) {
                try {
                    const ai = new GoogleGenAI({ apiKey: this.apiKey });
                    const prompt = `
                    You are "Mastery"(Michelangelo).
                    Map the following ACTION to a Tool.

    ACTION: "${action}"
                    AVAILABLE TOOLS:
1. ingest_library(Args: topic) - Use if action implies adding / learning knowledge.
                    2. none - Use if action is abstract or verifiable only.

                    OUTPUT JSON: { "tool": "ingest_library" | "none", "args": { "topic": "string" } }
`;

                    const response = await ai.models.generateContent({
                        model: 'gemini-2.0-flash',
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        config: { responseMimeType: 'application/json' }
                    });

                    const result = JSON.parse(response.text || "{}");

                    if (result.tool === "ingest_library") {
                        await this.ingestLibraryEntry(result.args?.topic || "Unknown Topic");
                        logs.push(`Executed: Real Ingestion(AI Match: ${result.args?.topic})`);
                        continue;
                    }
                } catch (e) {
                    console.warn(`[MASTERY] AI Tool Map failed for "${action}", falling back.`);
                }
            }

            // Fallback: Simulation
            logs.push(`Executed: ${action} (Simulated)`);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 2. Workflow Forging (if requested by Improvement)
        if (newWorkflow) {
            console.log(`[MASTERY] Forging new Workflow: "${newWorkflow.name}"...`);
            const artifact = this.forgeWorkflow(newWorkflow);
            artifacts.push(artifact);
            logs.push(`Forged Workflow: ${artifact.filename} `);
        }

        return {
            planId: plan.originalId,
            success: true,
            logs,
            artifacts,
            duration: Date.now() - startTime
        };
    }

    /**
     * Performs a real file system update to the Library.
     */
    private async ingestLibraryEntry(topic: string) {
        const libPath = path.join(process.cwd(), 'library.json');
        if (fs.existsSync(libPath)) {
            const raw = await fs.promises.readFile(libPath, 'utf-8');
            const library = JSON.parse(raw);

            // Create a new entry representing the "Knowledge" gained
            const newEntry = {
                id: `manifest - ${Date.now()} `,
                title: `The Codex of ${topic} `,
                author: "The Council (Mastery)",
                description: "A synthesis of knowledge generated during the Agentic Cycle.",
                content: "This text was manifested by the Council Agents acting upon user intent.",
                category: "Ancient Wisdom",
                tags: ["AI", "GameDev", "Manifestation"],
                unlocked: true,
                read: false
            };

            library.push(newEntry);
            await fs.promises.writeFile(libPath, JSON.stringify(library, null, 2));
            console.log(`[MASTERY] ⚔️ TANGIBLE IMPACT: Added "${newEntry.title}" to library.json`);
        }
    }

    /**
     * Generates the Antigravity Workflow Markdown
     */
    private forgeWorkflow(proposal: WorkflowProposal): WorkflowArtifact {
        const filename = proposal.name.toLowerCase().replace(/\s+/g, '_') + '.md';
        const content = `-- -
    description: Auto - generated workflow for ${proposal.name}
---

# ${proposal.name}

Triggered by finding this pattern ${proposal.triggerFrequency} times.

## Steps
${proposal.suggestedSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
`;

        return {
            filename,
            content,
            path: `.agent / workflows / ${filename} `
        };
    }
}
