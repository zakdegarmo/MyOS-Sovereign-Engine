/**
 * OfficeAudioSynth: Zero-dependency Web Audio API Sound Generator
 * Synthesizes retro-modern cyber-office SFX, printer grinding, terminal hacks,
 * radio chatter squelches, and guard slips directly in the browser.
 */

class OfficeAudioSynth {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public setMuted(muted: boolean) {
        this.isMuted = muted;
    }

    public getMuted(): boolean {
        return this.isMuted;
    }

    /**
     * Retro JRPG Typewriter speech chirp blip
     */
    public playSpeechChirp(speaker: string) {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        let freq = 380;
        let type: OscillatorType = 'triangle';
        if (speaker === 'PATCH') {
            freq = 640 + Math.random() * 80;
            type = 'sine';
        } else if (speaker === 'LARRY') {
            freq = 280 + Math.random() * 40;
            type = 'triangle';
        } else if (speaker === 'BRENDA') {
            freq = 480 + Math.random() * 60;
            type = 'sawtooth';
        } else if (speaker === 'KAREN_ICE') {
            freq = 180 + Math.random() * 20;
            type = 'square';
        }

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.045);
    }

    /**
     * Soft footstep on low-pile corporate carpet
     */
    public playFootstep() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80 + Math.random() * 30, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * Urgent printer paper jam alert beep (two-tone digital pulse)
     */
    public playPrinterAlert() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.07);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    /**
     * Satisfying electronic repair chime when printer is cleared or server rebooted
     */
    public playRepairSuccess() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        const now = ctx.currentTime;

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0.14, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.4);
        });
    }

    /**
     * Slippery comic slide whistle / zap when guard slips on paper or grease
     */
    public playGuardSlip() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
    }

    /**
     * Deploy gadget swoosh (dropping thermal slick or memo)
     */
    public playDeployGadget() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(650, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    /**
     * Radio handshake chirp / squelch when new SysAdmin liaison chatter arrives
     */
    public playRadioChime() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.setValueAtTime(1760, now + 0.04);
        osc.frequency.setValueAtTime(2200, now + 0.08);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Guard detection alarm ping (staccato warning pulse)
     */
    public playAlertPing() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.08);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
    }

    /**
     * Major victory fanfare sequence
     */
    public playVictory() {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [
            { f: 523.25, d: 0.12 },
            { f: 659.25, d: 0.12 },
            { f: 783.99, d: 0.14 },
            { f: 1046.5, d: 0.45 }
        ];

        let offset = ctx.currentTime;
        notes.forEach(({ f, d }) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, offset);

            gain.gain.setValueAtTime(0.2, offset);
            gain.gain.exponentialRampToValueAtTime(0.001, offset + d);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(offset);
            osc.stop(offset + d);
            offset += d * 0.9;
        });
    }
}

export const officeAudio = new OfficeAudioSynth();
