
// Authentic HRM Port
// Based on: HRM/models/hrm/hrm_act_v1.py

import { MemCube } from '../memory/MemCube'; // Authentic MemOS integration

export interface HRMConfig {
    H_cycles: number; // e.g., 1 (Slow)
    L_cycles: number; // e.g., 5 (Fast per H-step)
    hidden_size: number;
}

export interface HRMState {
    z_H: number[]; // High-Level Latent State (Abstract Plan)
    z_L: number[]; // Low-Level Latent State (Concrete Actions)
    step: number;
    emotionalState: string; // Derived from z_H variance
    memCube?: MemCube;
}

export class DualRecurrentReasoningModule {
    private config: HRMConfig;
    private state: HRMState;
    private subscribers: ((s: HRMState) => void)[] = [];
    private isAwake: boolean = false;
    private intervalParams: any = null;
    public memCube: MemCube; // The Deterministic Storage Engine

    constructor(config: HRMConfig = { H_cycles: 1, L_cycles: 4, hidden_size: 16 }) {
        this.config = config;
        // Default MemCube with no IO (Will be hydrated by setIO)
        this.memCube = new MemCube({
            cube_id: 'init',
            text_mem: { backend: 'uninitialized' },
            act_mem: { backend: 'uninitialized' },
            para_mem: { backend: 'uninitialized' },
            pref_mem: { backend: 'uninitialized' }
        });

        this.state = {
            // Initialize vectors with 0.1 for stability
            z_H: new Array(config.hidden_size).fill(0.1),
            z_L: new Array(config.hidden_size).fill(0.1),
            step: 0,
            emotionalState: "PASSIVE"
        };
    }

    // --- Core Logic (Forward Pass) ---

    // Simulating: z_L = self.L_level(z_L, z_H + input_embeddings)
    private forwardL(input: number[]): void {
        const new_z_L = this.state.z_L.map((val, i) => {
            // Recurrent update: decay * old + input + influence_from_H
            return (val * 0.8) + (input[i % input.length] * 0.2) + (this.state.z_H[i] * 0.1);
        });
        this.state.z_L = new_z_L;
    }

    // Simulating: z_H = self.H_level(z_H, z_L)
    private forwardH(): void {
        const new_z_H = this.state.z_H.map((val, i) => {
            // Recurrent update: decay * old + influence_from_L
            return (val * 0.95) + (this.state.z_L[i] * 0.05); // H moves slower
        });
        this.state.z_H = new_z_H;

        // Update Meta-State
        this.state.emotionalState = this.calculateVariance(this.state.z_H) > 0.01 ? "FOCUS" : "IDLE";

        // MEMORY LOG
        // We log the trace of the High Level Vector every Step
        this.memCube.act_mem.add({ step: this.state.step, z_H: this.state.z_H, emotion: this.state.emotionalState });
    }

    private calculateVariance(arr: number[]): number {
        const mean = arr.reduce((a, b) => a + b) / arr.length;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    }

    // --- Cycle Logic ---

    public tick(inputEmbedding: number[] = [0]): void {
        if (!this.isAwake) return;

        this.state.step++;

        // H-Loop Cycle
        // In the paper, for each H step, we run L_cycles L steps.

        // 1. Run L-Cycles (Fast Thinking)
        for (let l = 0; l < this.config.L_cycles; l++) {
            this.forwardL(inputEmbedding);
        }

        // 2. Run H-Cycle (Slow Thinking)
        this.forwardH();

        this.notify();
    }

    // --- Runtime Management ---

    public wakeUp() {
        if (this.isAwake) return;
        this.isAwake = true;
        this.state.emotionalState = "AWAKENING";

        // Main Event Loop (mimicking the forward pass stream)
        this.intervalParams = setInterval(() => {
            // Input is effectively random noise or sensor data in this mock
            const noise = [Math.random() * 0.1];
            this.tick(noise);
        }, 1000); // 1 tick per second (contains 4 L-steps)

        this.notify();
    }

    public sleep() {
        this.isAwake = false;
        clearInterval(this.intervalParams);
        this.state.emotionalState = "PASSIVE";
        this.notify();
    }

    public solve(puzzle: string) {
        this.setHighLevelIntent(`SOLVING_${puzzle.toUpperCase()}`);
        // Boost z_L activity to simulate effort
        this.state.z_L = this.state.z_L.map(x => x + 0.5);
        console.log(`[HRM] Solving ${puzzle} with H_cycles=${this.config.H_cycles}`);
    }

    private setHighLevelIntent(str: string) {
        // Mock: Convert string to vector perturbation
        // In real HRM, this is embedding injection
        this.state.z_H = this.state.z_H.map(x => x + 0.2);
    }

    // --- Interface ---

    public getState(): HRMState {
        return { ...this.state, memCube: this.memCube };
    }

    public subscribe(cb: (s: HRMState) => void) {
        this.subscribers.push(cb);
        return () => { this.subscribers = this.subscribers.filter(x => x !== cb); };
    }

    private notify() {
        // Deep copy state to avoid ref issues
        const s = this.getState();
        this.subscribers.forEach(cb => cb(s));
    }

    // --- INTEGRATION ---
    public setIO(writeFile: (p: string, c: string) => Promise<boolean>, readFile: (p: string) => Promise<string | null>) {
        // Re-instantiate MemCube with IO
        this.memCube = new MemCube(
            { cube_id: 'primary', text_mem: {} as any, act_mem: {} as any, para_mem: {} as any, pref_mem: {} as any },
            writeFile,
            readFile
        );
    }

    public getMemCube() {
        return this.memCube;
    }
}

// Initial instance with NO IO (Wait for Context injection)
export const HRMInstance = new DualRecurrentReasoningModule();
