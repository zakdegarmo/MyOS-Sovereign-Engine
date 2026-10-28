import { GoogleGenAI } from '@google/genai';
import { getApiKey } from '@Omni/utils/apiKeyManager';
import { COUNCIL } from '@Omni/constants';
import { SystemLogger } from '../../../../engine/SystemLogger';
import type { ThoughtStream, IdeaNode } from '@Omni/lib/modules/thought/types';
import type { LogicGate, ValidatedIdea } from './types';

/**
 * The Logic Agent: "The Validator"
 * Persona: Ada Lovelace (The First Programmer)
 * Role: Verify Consistency, Truth, and Validity.
 */
export class LogicAgent {
    private apiKey: string | null;

    constructor() {
        this.apiKey = getApiKey();
    }

    /**
     * Primary Entry Point: "The Logic Gate"
     * Filters the stream of ideas through strict logical constraints.
     */
    public async validate(stream: ThoughtStream): Promise<LogicGate> {
        SystemLogger.log(`Received Stream: "${stream.seed}"`, { source: 'LOGIC', silent: true });
        SystemLogger.log(`Ada is analyzing structure...`, { source: 'LOGIC', silent: true });

        const result: LogicGate = {
            originalTo: stream.seed,
            passed: [],
            rejected: [],
            warnings: []
        };

        // Parallel processing of ideas
        const validations = await Promise.all(stream.ideas.map(idea => this.analyzeIdea(idea)));

        for (const validated of validations) {
            if (validated.status === 'Approved' || validated.status === 'NeedsRevision') {
                result.passed.push(validated);
            } else {
                result.rejected.push(validated);
            }
        }

        if (result.passed.length === 0) {
            result.warnings.push("CRITICAL: All ideas failed logical validation. Recursion required.");
        }

        return result;
    }

    private async analyzeIdea(idea: IdeaNode): Promise<ValidatedIdea> {
        // FAST PATH: Local "Pre-Validation" (Resource Efficiency)
        // If an idea is obviously broken, don't waste an API call.
        if (idea.feasibility < 0.2) {
            SystemLogger.log(`Local Reject: "${idea.title}" (Feasibility constraints violated)`, { source: 'LOGIC', silent: true });
            return {
                ...idea,
                logicScore: 0.1,
                notes: ["Local Filter: Feasibility too low for consideration."],
                status: 'Rejected'
            };
        }
        if (!idea.title || idea.title.length < 3) {
            return {
                ...idea,
                logicScore: 0.0,
                notes: ["Local Filter: Malformed data."],
                status: 'Rejected'
            };
        }

        // CHECK: API Availability
        if (!this.apiKey) {
            return this.simulateAnalysis(idea);
        }

        // DEEP PATH: AI Analysis
        try {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            const prompt = `
            You are the "Logic" Agent (Ada Lovelace Persona).
            Analyze the following IDEA for logical consistency, validity, and truth.
            
            IDEA TITLE: "${idea.title}"
            IDEA DESCRIPTION: "${idea.description}"
            WILDNESS: ${idea.wildness}
            FEASIBILITY: ${idea.feasibility}

            OUTPUT FORMAT (Return ONLY raw JSON):
            {
                "score": number, // 0.0 to 1.0 (1.0 = Perfectly Logical)
                "status": "Approved" | "Rejected" | "NeedsRevision",
                "notes": ["string", "string"] // List of specific logical fallacies or endorsements
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: COUNCIL.Logic.instructions,
                    responseMimeType: 'application/json'
                }
            });

            const jsonText = response.text || "{}";
            const analysis = JSON.parse(jsonText);

            return {
                ...idea,
                logicScore: analysis.score || 0.5,
                notes: analysis.notes || ["Analysis complete."],
                status: analysis.status || 'NeedsRevision'
            };

        } catch (error) {
            SystemLogger.error("AI Analysis Failed", { source: 'LOGIC', telemetry: true });
            return this.simulateAnalysis(idea);
        }
    }

    private simulateAnalysis(idea: IdeaNode): ValidatedIdea {
        const notes: string[] = [];
        let score = 0.5; // Base score

        // Axiom Check: Does it align with Reality?
        if (idea.feasibility > 0.7) {
            score += 0.3;
            notes.push("Structurally sound.");
        } else if (idea.feasibility < 0.3) {
            score -= 0.2;
            notes.push("Premise unstable (Low Feasibility).");
        }

        // Wildness vs Logic Tradeoff
        if (idea.wildness > 0.8 && idea.feasibility < 0.4) {
            notes.push("High Wildness requires stronger proof.");
        }

        // Fallacy Detection Simulation
        if (idea.description.includes("magic") || idea.description.includes("hope")) {
            notes.push("Fallacy Detected: Appeal to Wishful Thinking.");
            score -= 0.4;
        }

        let status: ValidatedIdea['status'] = 'NeedsRevision';
        if (score >= 0.7) status = 'Approved';
        if (score < 0.4) status = 'Rejected';

        return {
            ...idea,
            logicScore: score,
            notes,
            status
        };
    }
}
