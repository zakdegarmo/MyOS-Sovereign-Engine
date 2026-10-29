export interface UniracerTrickResult {
    name: string;
    boost: number;
    score: number;
    tier: number;
}

export class UniracerTrickTracker {
    private totalPitch: number = 0;
    private totalYaw: number = 0;
    private totalRoll: number = 0;
    private isAirborne: boolean = false;

    public startJump(): void {
        this.totalPitch = 0;
        this.totalYaw = 0;
        this.totalRoll = 0;
        this.isAirborne = true;
    }

    public updateAirborneDeltas(pitchDelta: number, yawDelta: number, rollDelta: number): void {
        if (!this.isAirborne) return;
        this.totalPitch += pitchDelta;
        this.totalYaw += yawDelta;
        this.totalRoll += rollDelta;
    }

    public completeJump(): UniracerTrickResult | null {
        if (!this.isAirborne) return null;
        this.isAirborne = false;

        const twoPi = Math.PI * 2;
        const flips = Math.round(this.totalPitch / twoPi);
        const twists = Math.round(this.totalYaw / twoPi);
        const rolls = Math.round(this.totalRoll / twoPi);

        const parts: string[] = [];
        let score = 0;
        let boost = 0;

        if (Math.abs(flips) > 0) {
            const count = Math.abs(flips);
            const label = flips > 0 ? "Frontflip" : "Backflip";
            const prefix = count > 1 ? (count === 2 ? "Double " : `${count}x `) : "";
            parts.push(`${prefix}${label}`);
            score += count * 150;
            boost += count * 4.0;
        }

        if (Math.abs(twists) > 0) {
            const count = Math.abs(twists);
            const prefix = count > 1 ? (count === 2 ? "Double " : `${count}x `) : "";
            parts.push(`${prefix}Twist`);
            score += count * 120;
            boost += count * 3.5;
        }

        if (Math.abs(rolls) > 0) {
            const count = Math.abs(rolls);
            const prefix = count > 1 ? (count === 2 ? "Double " : `${count}x `) : "";
            parts.push(`${prefix}Barrel Roll`);
            score += count * 140;
            boost += count * 3.8;
        }

        if (parts.length === 0) {
            return null;
        }

        let tier = 1;
        if (parts.length > 1) {
            tier = 2;
            score = Math.round(score * 1.5);
            boost = boost * 1.4;
            parts.push("COMBO!");
        }

        return {
            name: parts.join(' + '),
            boost: Math.min(boost, 15.0),
            score,
            tier
        };
    }
}
