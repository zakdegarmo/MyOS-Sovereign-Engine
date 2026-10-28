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

    constructor() {
        this.reset();
    }

    public startJump(_currentRot?: THREE.Quaternion) {
        this.reset();
    }

    public reset() {
        this.totalPitch = 0;
        this.totalYaw = 0;
        this.totalRoll = 0;
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

        const nameParts: string[] = [];
        let score = 0;
        let boost = 0;

        // Scoring Logic (Uniracers Style)
        if (Math.abs(flips) > 0) {
            const count = Math.abs(flips);
            const prefix = count === 1 ? '' : count === 2 ? 'Double ' : count === 3 ? 'Triple ' : `${count}x `;
            const label = flips > 0 ? 'Frontflip' : 'Backflip';
            nameParts.push(`${prefix}${label}`);
            score += count * 100;
            boost += count * 60;
        }

        if (Math.abs(rolls) > 0) {
            const count = Math.abs(rolls);
            const prefix = count === 1 ? '' : count === 2 ? 'Double ' : count === 3 ? 'Triple ' : `${count}x `;
            nameParts.push(`${prefix}Roll`);
            score += count * 100;
            boost += count * 60;
        }

        if (Math.abs(twists) > 0) {
            const count = Math.abs(twists);
            const prefix = count === 1 ? '' : count === 2 ? 'Double ' : count === 3 ? 'Triple ' : `${count}x `;
            nameParts.push(`${prefix}Twist`);
            score += count * 100;
            boost += count * 60;
        }

        // Combo Multiplier
        if (nameParts.length > 1) {
            score *= nameParts.length;
            boost *= 1.5;
            nameParts.push('COMBO!');
        }

        if (score > 0) {
            return {
                name: nameParts.join(' + '),
                boost: Math.round(boost),
                points: score,
                rotationQuality: 1.0
            };
        }
        return null;
    }
}
