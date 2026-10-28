
/**
 * Genetic Kernel Audit: Adaptation of Linux 'fair.c' (CFS) for Agent Orchestration.
 * 
 * CORE PHILOSOPHY:
 * In Linux, the Completely Fair Scheduler (CFS) models an "ideal, precise class of multi-tasking CPU"
 * where each task gets an equal slice of processor time (Virtual Runtime - vruntime).
 * 
 * MAPPING TO NEXUS:
 * - CPU -> User Attention / Token Limit / System Latency
 * - Task -> Agent (Self, Thought, Logic, etc.)
 * - vruntime -> Accumulated Semantic Weight (tokens generated + tools called)
 * 
 * MECHANISM:
 * We use a simplified priority queue (mimicking the Red-Black Tree) to order Agents.
 * Agents with the LOWEST vruntime are scheduled next.
 */

export interface AgentTaskStruct {
    id: string; // Agent Name (e.g., "Logic")
    nice: number; // Priority (-20 to 19, lower is higher priority)
    vruntime: number; // Virtual Runtime (normalized execution time)
    lastRun: number; // Timestamp
    weight: number; // Calculated from Nice value
}

// Pre-computed weights for Nice values (mappings from Linux sched_prio_to_weight)
const PRIO_TO_WEIGHT = [
    88761, 71755, 56483, 46273, 36291, // -20 to -16
    29154, 23254, 18705, 14949, 11916, // -15 to -11
    9548, 7620, 6100, 4904, 3906,      // -10 to -6
    3121, 2501, 1991, 1586, 1277,      // -5 to -1
    1024,                              // 0 (Default)
    820, 655, 526, 423, 335,           // 1 to 5
    272, 215, 172, 137, 110,           // 6 to 10
    87, 70, 56, 45, 36                 // 11 to 15
];

export class FairTaskOrchestrator {
    private runqueue: AgentTaskStruct[] = [];
    private min_vruntime: number = 0;

    constructor() { }

    /**
     * Registers an agent into the scheduler.
     * @param id Agent ID
     * @param nice Priority (Default 0). Lower = Higher Priority.
     */
    registerEntity(id: string, nice: number = 0) {
        const weight = this.getWeight(nice);
        const entity: AgentTaskStruct = {
            id,
            nice,
            vruntime: this.min_vruntime, // New tasks start at current min to prevent starvation
            lastRun: 0,
            weight
        };
        this.runqueue.push(entity);
        this.sortQueue();
        console.log(`[CFS] Registered Entity: ${id} (Nice: ${nice}, Weight: ${weight})`);
    }

    private getWeight(nice: number): number {
        // Clamp nice value -20 to 19 (actually mapped to 0-39 index)
        const clamped = Math.max(-20, Math.min(19, nice));
        const index = clamped + 20; // Shift to array index
        return PRIO_TO_WEIGHT[index] || 1024;
    }

    /**
     * "Pick Next Task" - Corresponds to __schedule() -> pick_next_task_fair()
     * select the task with the lowest vruntime.
     */
    pickNextEntity(): AgentTaskStruct | null {
        if (this.runqueue.length === 0) return null;

        // In a real R-B Tree, this is O(1) (leftmost node).
        // Here, it's O(1) because we sort on insert/update.
        const next = this.runqueue[0];

        return next;
    }

    /**
     * "Context Switch" - Update the running task's stats and re-insert.
     * @param entity The task that just ran.
     * @param delta_exec The actual wall-time or token-count consumed.
     */
    updateCurr(entity: AgentTaskStruct, delta_exec: number) {
        // Calc delta_vruntime: delta_exec * (NICE_0_LOAD / weight)
        // Heavier tasks (high weight) gain vruntime slower, so they run longer.
        const NICE_0_LOAD = 1024;
        const delta_vruntime = (delta_exec * NICE_0_LOAD) / entity.weight;

        entity.vruntime += delta_vruntime;
        entity.lastRun = Date.now();

        // Update global min_vruntime (monotonically increasing)
        this.min_vruntime = Math.max(this.min_vruntime, entity.vruntime);

        // Re-sort queue (O(N log N) - acceptable for <20 agents)
        this.sortQueue();
    }

    private sortQueue() {
        this.runqueue.sort((a, b) => a.vruntime - b.vruntime);
    }

    public getDebugState() {
        return {
            min_vruntime: this.min_vruntime,
            queue: this.runqueue.map(e => `${e.id}: ${e.vruntime.toFixed(2)}`)
        };
    }
}
