import { Crucible } from '../sys/Crucible';
import type { ValidationResult } from '../sys/Crucible';
import { OptimizationDaemon } from '../Logic/OptimizationDaemon';
import type { StickyNote } from '../sys/Daemon';

/**
 * DaemonOrchestrator.ts
 * 
 * Manages the background evaluation of system proposals.
 * Bridges the Crucible results with the World State (Ontological Economy & Concepts).
 */

export class DaemonOrchestrator {
    private static instance: DaemonOrchestrator;
    private depositFn: (result: ValidationResult) => void = () => {};
    private conceptFn: (title: string, desc: string) => void = () => {};

    private constructor() {}

    public static getInstance(): DaemonOrchestrator {
        if (!DaemonOrchestrator.instance) {
            DaemonOrchestrator.instance = new DaemonOrchestrator();
        }
        return DaemonOrchestrator.instance;
    }

    /**
     * Initialize with WorldContext callbacks.
     */
    public initialize(
        deposit: (result: ValidationResult) => void,
        addConcept: (title: string, desc: string) => void
    ) {
        this.depositFn = deposit;
        this.conceptFn = addConcept;
        console.log("[DaemonOrchestrator] Initialized with WorldState bridge.");
    }

    /**
     * Triggers a new evaluation cycle.
     */
    public async processProposal(proposal: StickyNote) {
        const daemon = new OptimizationDaemon(); // In a real scenario, this would be the actual logic donor
        
        console.log(`[DaemonOrchestrator] Initiating evaluation for ${proposal.id}...`);
        
        // 1. Evaluate via Crucible
        const result = await Crucible.evaluate(daemon, proposal);
        
        // 2. If it passes the threshold, merge into reality
        if (result.passed) {
            console.log("[DaemonOrchestrator] Proposal PASSED. Minting ontoBucks...");
            
            // Deposit currency
            this.depositFn(result);
            
            // Harvest concept
            this.conceptFn(
                proposal.name,
                `Harvested from ${proposal.metadata.daemonType} execution. Evaluation Score: ${result.totalScore.toFixed(2)}`
            );
            
            return { success: true, result };
        } else {
            console.warn("[DaemonOrchestrator] Proposal FAILED. Logic burned.");
            return { success: false, result };
        }
    }
}
