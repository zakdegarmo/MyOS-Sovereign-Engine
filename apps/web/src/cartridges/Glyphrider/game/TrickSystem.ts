import * as THREE from 'three';

export interface TrickResult {
    name: string;
    boost: number;
    points: number;
    rotationQuality: number; // 1.0 is perfect landing
}

export class TrickSystem {
    // Accumulators for total rotation (in radians)
    private totalPitch: number = 0;
    private totalYaw: number = 0;
    private totalRoll: number = 0;

    // Snap-to-Landing logic
    private lastInputTime: number = 0;

    constructor() {
        this.reset();
    }

    public startJump(currentRot: THREE.Quaternion) {
        this.reset();
    }

    public reset() {
        this.totalPitch = 0;
        this.totalYaw = 0;
        this.totalRoll = 0;
        this.lastInputTime = 0;
    }

    public updateInputDeltas(pitch: number, yaw: number, roll: number) {
        // Integrate angular changes
        this.totalPitch += pitch;
        this.totalYaw += yaw;
        this.totalRoll += roll;
    }

    public completeJump(): TrickResult | null {
        // Calculate completed rotations
        // 1 Flip = 2*PI
        const flips = Math.round(this.totalPitch / (Math.PI * 2));
        const twists = Math.round(this.totalYaw / (Math.PI * 2));
        const rolls = Math.round(this.totalRoll / (Math.PI * 2));

        let nameParts = [];
        let score = 0;
        let boost = 0;

        // Scoring Logic (Uniracers Style)
        // More rotations = Exponentially more points? 
        // Or linearly. Let's go linear + combo bonus.

        if (Math.abs(flips) > 0) {
            const label = flips > 0 ? "Frontflip" : "Backflip";
            nameParts.push(`${Math.abs(flips) > 1 ? 'Double ' : ''}${label}`);
            score += Math.abs(flips) * 100;
            boost += Math.abs(flips) * 50;
        }

        if (Math.abs(rolls) > 0) {
            nameParts.push(`${Math.abs(rolls) > 1 ? 'Double ' : ''}Roll`);
            score += Math.abs(rolls) * 100;
            boost += Math.abs(rolls) * 50;
        }

        if (Math.abs(twists) > 0) {
            nameParts.push(`${Math.abs(twists) > 1 ? 'Double ' : ''}Twist`);
            score += Math.abs(twists) * 100;
            boost += Math.abs(twists) * 50;
        }

        // Combo Multiplier
        if (nameParts.length > 1) {
            score *= nameParts.length;
            boost *= 1.5;
            nameParts.push("COMBO!");
        }

        // Check for sloppy landing? 
        // We can check how close totalPitch is to (flips * 2PI). function of "cleanliness".
        const pitchError = Math.abs(this.totalPitch - (flips * Math.PI * 2));

        // Boost is higher for cleaner moves?
        if (score > 0) {
            return {
                name: nameParts.join(' + '),
                boost: boost,
                points: score,
                rotationQuality: 1.0 // TODO: implement gradings
            };
        }
        return null; // No trick
    }
}
