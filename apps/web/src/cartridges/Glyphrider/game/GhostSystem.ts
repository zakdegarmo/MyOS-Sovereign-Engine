
import * as THREE from 'three';
import { Racer } from './Racer';
import { GameConfig } from './GameConfig';

export interface GhostFrame {
    time: number;
    t: number; // Track progress
    angle: number; // Radial position
    altitude: number;
    // We store rotation as a simplified array [x, y, z, w] to save space in JSON if needed,
    // or just use Quaternion if we don't care about storage size for now.
    // Let's use array for easy serialization.
    rot: [number, number, number, number];
}

export class GhostSystem {
    private currentRecording: GhostFrame[] = [];
    private bestRun: GhostFrame[] | null = null;
    private isRecording: boolean = false;
    private trackSeed: string = "";

    constructor() { }

    public startRecording(seed: string) {
        this.currentRecording = [];
        this.trackSeed = seed;
        this.isRecording = true;

        // Try to load existing best
        this.loadBestRun(seed);
    }

    public stopRecording(): boolean {
        this.isRecording = false;

        // Check if this is a new best run
        // Criteria: Furthest distance (t) or fastest time to finish?
        // For now, let's assume if we completed loop (t > 1.0 or similar logic) faster.
        // Actually, just comparing total time for a full lap is standard.
        // Or simplified: Just save it if it's the first one.
        // Let's rely on GameManager to decide IF it should be saved (e.g. if player won/finished).
        return true;
    }

    public saveRunIfBest(totalTime: number) {
        // Simple logic: If no best run, or this run is faster (assuming full completion)
        // Ideally we need to know if the run was "complete". 
        // For prototype, we'll just overwrite if it's longer/better.

        const lastBestTime = this.bestRun ? this.bestRun[this.bestRun.length - 1].time : Infinity;

        if (totalTime < lastBestTime) {
            console.log("NEW RECORD! Saving Ghost.");
            this.bestRun = [...this.currentRecording];
            this.persistToStorage();
            return true;
        }
        return false;
    }

    public recordFrame(racer: Racer, time: number) {
        if (!this.isRecording) return;

        this.currentRecording.push({
            time,
            t: racer.t,
            angle: racer.angle,
            altitude: racer.altitude,
            rot: [
                racer.airborneRotation.x,
                racer.airborneRotation.y,
                racer.airborneRotation.z,
                racer.airborneRotation.w
            ]
        });
    }

    public getStateAtTime(time: number): GhostFrame | null {
        if (!this.bestRun || this.bestRun.length === 0) return null;

        // Find frame
        // Optimization: track last index requested to avoid searching from 0
        // For now, simpler find/index logic. 
        // Given 60fps, array can be large (3000 items for 50s). Binary search is better or just simple linear scan from approximated index.

        // Simple distinct frame:
        const frame = this.bestRun.find(f => f.time >= time);
        return frame || this.bestRun[this.bestRun.length - 1];
    }

    public getBestRun(): GhostFrame[] | null {
        return this.bestRun;
    }

    private loadBestRun(seed: string) {
        const data = localStorage.getItem(`glyphrider_ghost_${seed}`);
        if (data) {
            try {
                this.bestRun = JSON.parse(data);
                console.log("Ghost Loaded:", this.bestRun?.length, "frames");
            } catch (e) {
                console.error("Failed to parse ghost data", e);
            }
        } else {
            this.bestRun = null;
        }
    }

    private persistToStorage() {
        if (!this.bestRun) return;
        try {
            const data = JSON.stringify(this.bestRun);
            localStorage.setItem(`glyphrider_ghost_${this.trackSeed}`, data);
        } catch (e) {
            console.warn("Ghost save failed (probably quota)", e);
        }
    }
}
