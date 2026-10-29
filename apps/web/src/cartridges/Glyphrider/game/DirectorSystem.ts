import { GameConfig } from './GameConfig';

export class DirectorSystem {
    private currentIntensity: number = 0;
    private boredomCounter: number = 0;
    private currentLevel: number = 1;

    constructor() { }

    public setLevel(level: number) {
        this.currentLevel = Math.max(1, Math.min(100, level));
    }

    public update(delta: number, playerStats: { speed: number, isTricking: boolean }) {
        const speedFactor = Math.min(playerStats.speed / 1000, 1.0);
        const trickFactor = playerStats.isTricking ? 1.0 : 0.0;
        const difficultyFactor = this.currentLevel / 100;

        // Intensity increases with level difficulty
        const targetIntensity = (speedFactor * 0.5) + (trickFactor * 0.3) + (difficultyFactor * 0.2);
        this.currentIntensity = this.lerp(this.currentIntensity, targetIntensity, delta * 0.5);

        // Boredom Check (Trigger morphs faster as level increases)
        const boredomThreshold = 30 - (this.currentLevel * 0.2); // Faster morphs at high level
        if (this.currentIntensity < 0.4) {
            this.boredomCounter += delta;
        } else {
            this.boredomCounter = Math.max(0, this.boredomCounter - delta);
        }

        if (this.boredomCounter > boredomThreshold) {
            this.boredomCounter = 0;
            // The GameManager will see this and call getAction()
        }
    }

    public getAction(): 'MORPH' | 'PULSE' | 'NONE' {
        if (this.boredomCounter === 0) return 'MORPH';

        // Pulses are level-synced vibrations
        const pulseChance = 0.001 * this.currentLevel; 
        if (this.currentIntensity > 0.7 && Math.random() < pulseChance) {
            return 'PULSE';
        }

        return 'NONE';
    }

    public generateNextConfig(currentConfig: any): any {
        // Difficulty-based P/Q generation
        // Level 1: 2..4
        // Level 100: 2..15
        const maxP = 4 + Math.floor(this.currentLevel * 0.1);
        const maxQ = 6 + Math.floor(this.currentLevel * 0.15);

        let newP = 2 + Math.floor(Math.random() * (maxP - 2));
        let newQ = 3 + Math.floor(Math.random() * (maxQ - 3));

        // Ensure complexity increases
        if (this.currentLevel > 50 && newP + newQ < 10) {
            newP += 5;
            newQ += 5;
        }

        return {
            ...currentConfig,
            p: newP,
            q: newQ,
            radius: currentConfig.radius + (Math.random() - 0.5) * 20,
            level: this.currentLevel // Feed level to Track for fractal rates
        };
    }

    /**
     * Physical Fork Logic: Returns gap ranges [t_start, t_end]
     * Gaps become more frequent and longer at higher levels.
     */
    public generateGaps(): [number, number][] {
        if (this.currentLevel < 10) return []; // No gaps on early levels

        const gaps: [number, number][] = [];
        const gapNum = Math.floor(this.currentLevel / 20); // 1-5 gaps
        
        for (let i = 0; i < gapNum; i++) {
            const start = Math.random() * 0.8; // Avoid wrap-around for now
            const length = 0.02 + (this.currentLevel * 0.0005); // Up to 0.07 (approx 7% of track)
            gaps.push([start, start + length]);
        }

        return gaps;
    }

    private lerp(v0: number, v1: number, t: number) {
        return v0 * (1 - t) + v1 * t;
    }
}
