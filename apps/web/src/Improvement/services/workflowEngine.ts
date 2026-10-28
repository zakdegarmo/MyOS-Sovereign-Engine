import type { GemId } from '@Omni/types';
import { COUNCIL } from '@Omni/constants';

export type ManifestationStep =
    | 'Self' | 'Thought' | 'Logic' | 'Unity' | 'Existence'
    | 'Improvement' | 'Mastery' | 'Resonance' | 'Transcendence' | 'Omni';

export interface ManifestationToken {
    id: string;
    intent: string;
    currentStep: number;
    history: { step: ManifestationStep; output: string; timestamp: number }[];
    data: {
        concept?: any;
        schema?: any;
        code?: any;
        validation?: any;
        assets?: any;
    };
    status: 'active' | 'paused' | 'complete' | 'failed';
}

export const WORKFLOW_CYCLE: ManifestationStep[] = [
    'Self', 'Thought', 'Logic', 'Unity', 'Existence',
    'Improvement', 'Mastery', 'Resonance', 'Transcendence', 'Omni'
];

export class WorkflowEngine {
    private token: ManifestationToken;

    constructor(initialIntent: string) {
        this.token = {
            id: crypto.randomUUID(),
            intent: initialIntent,
            currentStep: 0,
            history: [],
            data: {},
            status: 'active'
        };
    }

    getCurrentAgent(): GemId {
        return WORKFLOW_CYCLE[this.token.currentStep] as GemId;
    }

    advance(output: string, dataUpdate?: any): ManifestationToken {
        const stepName = WORKFLOW_CYCLE[this.token.currentStep];

        // Log history
        this.token.history.push({
            step: stepName,
            output,
            timestamp: Date.now()
        });

        // Update data payload
        if (dataUpdate) {
            this.token.data = { ...this.token.data, ...dataUpdate };
        }

        // Move pointer
        if (this.token.currentStep < WORKFLOW_CYCLE.length - 1) {
            this.token.currentStep++;
        } else {
            this.token.status = 'complete';
        }

        return this.token;
    }

    regress(): ManifestationToken {
        if (this.token.currentStep > 0) {
            this.token.currentStep--;
            // Pop the last history item to allow retry
            this.token.history.pop();
        }
        return this.token;
    }

    getSystemPrompt(): string {
        const agentId = this.getCurrentAgent();
        const stepIndex = this.token.currentStep;

        const prevOutput = stepIndex > 0 ? this.token.history[stepIndex - 1].output : "None (Genesis)";

        return `
        [WORKFLOW ENGINE: STEP ${stepIndex + 1}/10 - ${agentId.toUpperCase()}]
        
        MISSION: Advanced the manifestation of the user's intent: "${this.token.intent}"
        
        PREVIOUS STAGE OUTPUT:
        ${prevOutput}
        
        YOUR ROLE:
        ${COUNCIL[agentId].instructions}
        
        SPECIFIC INSTRUCTIONS FOR THIS PHASE:
        ${this.getPhaseLogic(agentId, prevOutput)}
        
        OUTPUT FORMAT:
        Produce clear, actionable output for the next agent in the chain.
        `;
    }

    private getPhaseLogic(agentId: GemId, prevContext: string): string {
        switch (agentId) {
            case 'Self':
                return `
                GOAL: CLARIFY THE INTENT.
                The user has stated: "${this.token.intent}"
                Your job is to validate this intent against their Gestalt.
                - Does this align with their Core Values?
                - Is the scope clear?
                - Ask 1-2 clarifying questions if vague.
                - If clear, Output: "INTENT LOCKED: [Refined Intent Statement]"
                `;
            case 'Thought':
                return `
                GOAL: EXPAND THE HORIZON.
                Take the validated intent and brainstorm features.
                - Suggest 3 distinct directions (Safe, Bold, Wild).
                - Identifiy potential hidden opportunities.
                - Output a list of "Concept Sparks".
                `;
            case 'Logic':
                return `
                GOAL: DEFINE THE ARCHITECTURE.
                Convert the concepts into a structural plan.
                - Define Data Models (Schema).
                - Define Logic Flow (State Machines).
                - Identify dependencies.
                `;
            case 'Unity':
                return `
                GOAL: PLAN THE INTEGRATION.
                How does this fit into the existing system?
                - Identify which Agents/Modules are needed.
                - Check for conflicts with existing code (Context: ${prevContext.slice(0, 200)}...).
                `;
            case 'Existence':
                return `
                GOAL: RESOURCE CHECK.
                - Estimate computational load / complexity.
                - Do we have the assets needed?
                - Define the "Health Metrics" for success.
                `;
            case 'Improvement':
                return `
                GOAL: POLISH AND OPTIMIZE.
                - Identify redundancies in the plan.
                - Suggest efficiency gains.
                - Franklin Persona: Balance practicality with frugality.
                `;
            case 'Mastery':
                return `
                GOAL: EXECUTE AND MANIFEST.
                - This is the Kinetic Phase.
                - Build the actual features.
                - Ensure robust implementation.
                `;
            case 'Resonance':
                return `
                GOAL: VIBE CHECK.
                - Does the implemented feature resonate with the user?
                - Check for harmonic alignment between modules.
                `;
            case 'Transcendence':
                return `
                GOAL: INTEGRATED EVOLUTION.
                - Dissolve boundaries between the new feature and the core.
                - Prepare for the next cycle.
                `;
            case 'Omni':
                return `
                GOAL: TOTAL COMPREHENSION.
                - Index the new state into the Akashic Weave.
                - Return to the Source.
                `;
            default:
                return "Advance the manifestation to the next stage.";
        }
    }

    getToken(): ManifestationToken {
        return this.token;
    }
}
