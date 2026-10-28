import { BaseAgent } from './BaseAgent';
import type { AgentConfig } from './BaseAgent';
import { SelfAgent } from './self/agent';
import { OmniAgent } from './omniverse/agent';
import { ThoughtAgent } from './thought/agent';
// import { ImprovementAgent } from '@Improvement/Factors/Optimizes/ImprovementAgent';
import { GenericOntologyAgent } from './GenericOntologyAgent';
import { OntologyCategory } from '@Self/ontologyConstants';
import type { LibraryNode } from '@Omni/types';

import { FairTaskOrchestrator } from './orchestration/FairTaskOrchestrator';

export class AgentOrchestrator {
    private agents: Map<OntologyCategory, BaseAgent> = new Map();
    private scheduler: FairTaskOrchestrator;

    // improvement agent ref for direct access
    // private improvementAgent: ImprovementAgent | null = null;

    constructor() {
        this.scheduler = new FairTaskOrchestrator();
        this.initializeAgents();
        // Register agents with the scheduler (Default Nice = 0)
        this.agents.forEach((agent, category) => {
            // Assign specific Nice values for personality
            // Logic/Self = High Priority (-5), Resonance = Low Priority (5)
            let nice = 0;
            if (category === OntologyCategory.Logic || category === OntologyCategory.Self) nice = -5;
            if (category === OntologyCategory.Improvement) nice = -20; // Turbo Mode for Mitosis
            if (category === OntologyCategory.Resonance) nice = 5;

            this.scheduler.registerEntity(category, nice);
        });
    }

    private initializeAgents() {
        // 1. Specialized Agents
        this.agents.set(OntologyCategory.Self, new SelfAgent());
        this.agents.set(OntologyCategory.TheNothingAndEverything, new OmniAgent()); // Omni
        this.agents.set(OntologyCategory.Thought, new ThoughtAgent());


        /*
        const impAgent = new ImprovementAgent();
        this.agents.set(OntologyCategory.Improvement, impAgent);
        this.improvementAgent = impAgent;
        */

        // 2. Generic Agents (for now)
        this.createGeneric(OntologyCategory.Logic, [300, 400], '#38bdf8');
        this.createGeneric(OntologyCategory.Unity, [400, 500], '#10b981');
        this.createGeneric(OntologyCategory.Existence, [500, 600], '#f59e0b');
        this.createGeneric(OntologyCategory.Improvement, [600, 700], '#14b8a6'); // Restored Generic
        this.createGeneric(OntologyCategory.Mastery, [700, 800], '#ef4444');
        this.createGeneric(OntologyCategory.Resonance, [800, 900], '#d946ef');
        this.createGeneric(OntologyCategory.Transcendence, [900, 1000], '#8b5cf6');
    }

    private createGeneric(category: OntologyCategory, deweyRange: [number, number], color: string) {
        this.agents.set(category, new GenericOntologyAgent({
            category,
            deweyRange,
            color
        }));
    }

    public getAgent(category: OntologyCategory): BaseAgent | undefined {
        return this.agents.get(category);
    }

    public getAllAgents(): BaseAgent[] {
        return Array.from(this.agents.values());
    }

    public setFiles(files: any[]) {
        /*
        if (this.improvementAgent) {
            this.improvementAgent.setFiles(files);
        }
        */
    }

    /**
     * Runs a single "Fair Tick": Picks the most deserving agent, runs it, and updates vruntime.
     */
    public async runFairTick(library: LibraryNode, graphNodes: any[]): Promise<{ category: string, result: any, debug: any }> {
        const nextTask = this.scheduler.pickNextEntity();
        if (!nextTask) return { category: 'None', result: null, debug: null };

        const category = nextTask.id as OntologyCategory;
        const agent = this.agents.get(category);

        if (!agent) {
            console.error(`[Orchestrator] Scheduler picked unknown agent: ${category}`);
            return { category, result: null, debug: null };
        }

        const start = Date.now();
        // Don't overwrite files if it's ImprovementAgent, but do set library
        agent.setLibrary(library);
        agent.setGraphNodes(graphNodes);

        let result = null;
        try {
            // "Run" the agent (Monitor)
            result = await agent.monitor();
        } catch (e) {
            console.error(`[Orchestrator] Error running ${category}:`, e);
        }

        const duration = Date.now() - start;

        // Update vruntime based on execution time (simulating CPU usage)
        this.scheduler.updateCurr(nextTask, duration);

        return {
            category,
            result,
            debug: this.scheduler.getDebugState()
        };
    }

    /**
     * Runs the monitoring cycle for all agents (Legacy / Parallel Mode).
     */
    public async runMonitoring(library: LibraryNode, graphNodes: any[]): Promise<Record<string, { insights: string[], actions: string[] }>> {
        const results: Record<string, { insights: string[], actions: string[] }> = {};

        // Run in parallel
        const promises = Array.from(this.agents.entries()).map(async ([category, agent]) => {
            agent.setLibrary(library);
            agent.setGraphNodes(graphNodes);
            try {
                const result = await agent.monitor();
                if (result.insights.length > 0 || result.actions.length > 0) {
                    results[category] = result;
                }
            } catch (e) {
                console.error(`[ORCHESTRATOR] Error monitoring ${category}:`, e);
            }
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * Forces a specific agent to run immediately, bypassing the scheduler.
     * Useful for UI-driven "Turbo Mode" or specific agent testing.
     */
    public async forceRun(category: OntologyCategory, library: LibraryNode, graphNodes: any[]): Promise<{ category: string, result: any }> {
        const agent = this.agents.get(category);
        if (!agent) {
            console.warn(`[Orchestrator] Cannot force run unknown agent: ${category}`);
            return { category: category as string, result: null };
        }

        agent.setLibrary(library);
        agent.setGraphNodes(graphNodes);

        try {
            const result = await agent.monitor();
            return { category: category as string, result };
        } catch (e) {
            console.error(`[Orchestrator] Error force running ${category}:`, e);
            return { category: category as string, result: null };
        }
    }

    /**
     * Consults a specific agent using the Persona Protocol.
     */
    public async consultAgent(category: OntologyCategory, query: string, context: any[] = []): Promise<string> {
        const agent = this.agents.get(category);
        if (!agent) return `[System] Agent ${category} is offline.`;
        return await agent.consult(query, context);
    }
}
