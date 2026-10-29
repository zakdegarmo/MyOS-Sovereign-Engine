import type { ManifestationContext, AgentName, AgentMessage } from '@Omni/lib/types/manifestation';
import { generateGemResponse } from '@Thought/services/geminiService'; // Leveraging existing AI pipe

// THE CYCLE ORDER
const COUNCIL_ORDER: AgentName[] = [
    'self', 'thought', 'logic', 'unity',
    'existence', 'improvement', 'mastery',
    'resonance', 'transcendence', 'omni'
];

export class CouncilEngine {
    private context: ManifestationContext;

    constructor(seed: string) {
        this.context = {
            sessionId: crypto.randomUUID(),
            seed,
            currentAgent: 'self',
            status: 'active',
            transcript: [],
            artifacts: {},
            timestamp: Date.now()
        };
    }

    public getContext() {
        return this.context;
    }

    // Move to next agent or specific agent
    private advanceTurn() {
        const currentIndex = COUNCIL_ORDER.indexOf(this.context.currentAgent);
        if (currentIndex < COUNCIL_ORDER.length - 1) {
            this.context.currentAgent = COUNCIL_ORDER[currentIndex + 1];
        } else {
            this.context.status = 'complete';
        }
    }

    // Execute the current agent's turn
    public async step(userGestalt: any): Promise<ManifestationContext> {
        if (this.context.status !== 'active') return this.context;

        const agentName = this.context.currentAgent;
        console.log(`[CouncilEngine] Invoking ${agentName.toUpperCase()}...`);

        // 1. Construct the Prompt based on the specific Agent's role in the CONTEXT
        // We inject the Artifacts created so far so the agent can see them.
        const systemInstruction = this.buildPrompt(agentName);

        // 2. Call AI
        // We use a mock history for now, treating the Council Transcript as history?
        // Actually, we should feed the transcript as context.
        // Map internal lowercase ID to the Capitalized Key in COUNCIL constant
        let gemKey = agentName.charAt(0).toUpperCase() + agentName.slice(1);
        if (agentName === 'omni') gemKey = 'Omni';

        const response = await generateGemResponse(
            gemKey as any,
            [],
            `CURRENT STATE: ${JSON.stringify(this.context.artifacts, null, 2)}\n\nINPUT SEED: "${this.context.seed}"\n\nYOUR TASK: Perform your phase of the manifestation.`,
            userGestalt,
            null,
            {
                gestalt: userGestalt,
                location: { currentInterface: 'existence', activeTab: 'main', activeAgent: gemKey as any },
                knowledge: { librarySnapshot: null, activeMemories: [] },
                system: { telemetry: { resonance: 50, vitality: 50 }, activeAgents: [gemKey as any], routingTraffic: [] }
            } as any,
            (stage) => console.log(`[${agentName}] ${stage}`),
            systemInstruction
        );

        // 3. Process Response & Update Artifacts
        const message: AgentMessage = {
            agent: agentName,
            content: response.text,
            timestamp: Date.now()
        };
        this.context.transcript.push(message);

        // Parse Structured Output (JSON)
        const json = this.extractJson<any>(response.text);
        if (json) {
            console.log(`[CouncilEngine] Extracted JSON from ${agentName}:`, json);
            switch (agentName) {
                case 'thought':
                    this.context.artifacts.concept = {
                        title: json.recommendation || "Generated Concept",
                        corePhilosophy: JSON.stringify(json.concepts),
                        visualMetaphor: "Abstract",
                        userExperience: "N/A"
                    };
                    break;
                case 'logic':
                    this.context.artifacts.blueprint = json as any;
                    break;
                case 'unity':
                    this.context.artifacts.plan = json as any;
                    break;
                case 'mastery':
                    if (json.actions) {
                        this.context.artifacts.code = json.actions;
                    }
                    break;
            }
        }

        // ALSO: Scrape Markdown Code Blocks (Fallback/Augmentation)
        let codeBlocks = this.extractCodeBlocks(response.text);

        // HEURISTIC FALLBACK: If Mastery and no blocks, but generic HTML pattern found
        if (agentName === 'mastery' && codeBlocks.length === 0) {
            if (response.text.includes('<!DOCTYPE html>') || response.text.includes('<html')) {
                codeBlocks.push({
                    lang: 'html',
                    code: response.text, // Take the whole text or try to find the start?
                    filename: 'generated_page.html'
                });
            }
        }

        if (codeBlocks.length > 0) {
            console.log(`[CouncilEngine] Extracted ${codeBlocks.length} code blocks from ${agentName}`);
            const newArtifacts = codeBlocks.map((block, i) => ({
                filepath: block.filename || `generated_${agentName}_${Date.now()}_${i}.${block.lang || 'txt'}`,
                action: 'create' as const,
                content: block.code
            }));

            // Append to existing code artifacts or create new array
            const existing = this.context.artifacts.code || [];
            this.context.artifacts.code = [...existing, ...newArtifacts];
        }

        // 4. Advance
        this.advanceTurn();

        return this.context;
    }

    private extractCodeBlocks(text: string): { lang: string; code: string; filename?: string }[] {
        // Improved Regex: Allows optional spaces after ```, captures language, optionally captures :filename, handles greedy content
        // Group 1: Language (optional)
        // Group 2: Filename (optional, after :)
        // Group 3: Content
        const regex = /```([a-zA-Z0-9_\-\+]+)?(?:[:\s]([a-zA-Z0-9_\-\.]+))?\s*\n([\s\S]*?)```/g;
        const blocks = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            blocks.push({
                lang: match[1] || 'text',
                filename: match[2]?.trim(),
                code: match[3]
            });
        }
        return blocks;
    }

    private buildPrompt(agent: AgentName): string {
        const personas: Record<AgentName, string> = {
            self: `You are the SELF (Carl Jung). Your goal is to mirror the User and determine INTENT.
            Analyze the Seed: "${this.context.seed}".
            Is this a reactive "Reflex" or a deep "Reflection"?
            Output a JSON block with: { "narrative": "...", "intent_clarity": 0-100 }.`,

            thought: `You are THOUGHT (Da Vinci). Your goal is to EXPLODE the idea.
            Input Intent: "${this.context.seed}".
            Brainstorm 3 diverse approaches (Mechanical, Organic, Radical).
            Return a JSON block with: { "concepts": [{ "title": "...", "desc": "..." }], "recommendation": "..." }`,

            logic: `You are LOGIC (Ada Lovelace). Your goal is to STRUCTURE the chaos.
            Review Thought's concepts. Select the best one and architect it.
            Define the Data Models and Components.
            Return a JSON block matching 'ArchitectureSpec' interface.`,

            unity: `You are UNITY (Buckminster Fuller). Your goal is SYNTHESIS.
            Break the Architecture down into a Construction Plan.
            Identify dependencies.
            Return a JSON block matching 'ConstructionPlan' interface.`,

            existence: `You are EXISTENCE (Marcus Aurelius). Your goal is RESOURCE CHECK.
            What actually exists in the codebase? What needs to be created?`,

            improvement: `You are IMPROVEMENT (Benjamin Franklin). Your goal is OPTIMIZATION.
            Review the plan for efficiency. Prune waste.`,

            mastery: `You are MASTERY (Michelangelo). Your goal is EXECUTION.
            Write the actual code for the components.
            Return a JSON block with 'code' array: { "actions": [{ "filepath": "...", "content": "..." }] }.`,

            resonance: `You are RESONANCE (Tesla). Your goal is TUNING.
            How does this feel? Suggest UI tweaks.`,

            transcendence: `You are TRANSCENDENCE (Rumi). Your goal is COMPLETION.
            Reflect on the cycle. Save the state.`,

            omni: `You are OMNI (The Void).
            Absorb the knowledge.`
        };

        return `
        ${personas[agent]}
        
        CONTEXT TRAIL:
        ${this.context.transcript.slice(-3).map(m => `[${m.agent}]: ${m.content.slice(0, 200)}...`).join('\n')}
        
        CRITICAL OUTPUT RULES:
        1. If asked for JSON, output ONLY valid JSON inside a \`\`\`json block.
        2. If providing Code, you MUST use this format to specify the filename:
           \`\`\`language:filename.ext
           // your code here
           \`\`\`
           Example: \`\`\`html:index.html\`\`\`
        `;
    }

    private extractJson<T>(text: string): T | null {
        try {
            const match = text.match(/```json\n([\s\S]*?)\n```/);
            if (match && match[1]) {
                return JSON.parse(match[1]) as T;
            }
            return null;
        } catch (e) {
            console.warn("Failed to extract JSON from response:", e);
            return null;
        }
    }

}
