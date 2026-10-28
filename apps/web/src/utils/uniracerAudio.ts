/**
 * uniracerAudio.ts
 * -----------------
 * Pure procedural Web Audio API sound synthesizer for the Sovereign Uniracer.
 * 100% native, requires 0 audio asset downloads, works in any browser.
 */

class UniracerAudioSynthesizer {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    public playJumpWhoosh(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    public playLandingThud(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    public playStuntChime(tier: number = 1): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Pentatonic bright fanfare: C6, E6, G6, C7
        const baseFreqs = tier >= 2 ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [523.25, 659.25, 783.99];

        baseFreqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const noteStart = now + idx * 0.06;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteStart);

            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(noteStart);
            osc.stop(noteStart + 0.26);
        });
    }

    public playWipeoutBounce(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.32);
    }

    public playSpringPtwang(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        // 1. Primary harmonic oscillator (comedic rising pitch sweep + rapid wobble vibrato)
        const osc = ctx.createOscillator();
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        const gain = ctx.createGain();

        // Vibrato creates the rubbery metallic coil "twang" oscillation
        vibrato.frequency.setValueAtTime(18, now); // 18 Hz wobble
        vibratoGain.gain.setValueAtTime(50, now);
        vibratoGain.gain.exponentialRampToValueAtTime(1.0, now + 0.65);
        vibrato.connect(osc.frequency);

        osc.type = 'triangle';
        // Classic cartoon spring pitch envelope: rapid upward 'ptw-' into ringing '-ang!'
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.07);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.65);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);

        // 2. High metallic chime overtone for the steel coil resonance
        const overtoneOsc = ctx.createOscillator();
        const overtoneGain = ctx.createGain();

        overtoneOsc.type = 'sine';
        overtoneOsc.frequency.setValueAtTime(820, now);
        overtoneOsc.frequency.exponentialRampToValueAtTime(410, now + 0.45);

        overtoneGain.gain.setValueAtTime(0.12, now);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        vibrato.start(now);
        osc.start(now);
        overtoneOsc.start(now);

        vibrato.stop(now + 0.65);
        osc.stop(now + 0.65);
        overtoneOsc.stop(now + 0.45);
    }

    private lastGrindTime: number = 0;

    public playGrindSpark(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        if (now - this.lastGrindTime < 0.12) return;
        this.lastGrindTime = now;

        // Metallic spark scrape: short burst of FM chatter
        const osc = ctx.createOscillator();
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();

        mod.frequency.setValueAtTime(180 + Math.random() * 120, now);
        modGain.gain.setValueAtTime(300, now);
        mod.connect(modGain);
        modGain.connect(osc.frequency);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);

        mod.start(now);
        osc.start(now);
        mod.stop(now + 0.12);
        osc.stop(now + 0.12);
    }
}

export const uniracerAudio = new UniracerAudioSynthesizer();
