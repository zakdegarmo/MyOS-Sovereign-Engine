/**
 * SoundManager.ts
 * ----------------
 * Procedural Web Audio API Sound Synthesizer for Uniracers: Outlaw Syndicate.
 * Zero external audio assets required - synthesizes 100% native retro-arcade audio:
 * - Dynamic dual-oscillator engine motor (pitch/volume tracks player velocity)
 * - White noise resonant tire drift screech
 * - Boost warp surge with pitch bend
 * - 3-note pentatonic lap completion chime
 * - Triumphant harmonic victory fanfare
 */

export class SoundManager {
    private static instance: SoundManager | null = null;
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private musicAudio: HTMLAudioElement | null = null;
    private currentTrack: string = '';

    // Motor Nodes
    private motorOsc1: OscillatorNode | null = null;
    private motorOsc2: OscillatorNode | null = null;
    private motorFilter: BiquadFilterNode | null = null;
    private motorGain: GainNode | null = null;

    // Drift / Screech Nodes
    private driftNoiseNode: AudioBufferSourceNode | null = null;
    private driftGain: GainNode | null = null;
    private driftFilter: BiquadFilterNode | null = null;
    private isDrifting: boolean = false;

    private noiseBuffer: AudioBuffer | null = null;

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private constructor() {
        // AudioContext will be initialized on first user interaction
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopAll();
            if (this.musicAudio) this.musicAudio.pause();
        } else {
            if (this.musicAudio && this.currentTrack) this.musicAudio.play().catch(() => {});
        }
        return this.isMuted;
    }

    public isMutedState(): boolean {
        return this.isMuted;
    }

    public playMusicTrack(trackFile: string): void {
        if (this.currentTrack === trackFile && this.musicAudio && !this.musicAudio.paused) return;
        this.currentTrack = trackFile;
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio = null;
        }
        if (!trackFile || this.isMuted) return;

        const audio = new Audio(`/audio/${trackFile}`);
        audio.loop = true;
        audio.volume = 0.45;
        this.musicAudio = audio;
        audio.play().catch(err => console.log('Music play deferred:', err));
    }

    public stopMusicTrack(): void {
        if (this.musicAudio) {
            this.musicAudio.pause();
            this.musicAudio = null;
        }
        this.currentTrack = '';
    }

    public initContext(): void {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();

        // Pre-create 1-second white noise buffer for screech / sparks
        const sampleRate = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < sampleRate; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.setupMotorSynth();
        this.setupDriftSynth();
    }

    private setupMotorSynth(): void {
        if (!this.ctx) return;

        // Dual oscillator for rich 16-bit analog unicycle engine purr
        this.motorOsc1 = this.ctx.createOscillator();
        this.motorOsc2 = this.ctx.createOscillator();
        this.motorFilter = this.ctx.createBiquadFilter();
        this.motorGain = this.ctx.createGain();

        this.motorOsc1.type = 'sawtooth';
        this.motorOsc2.type = 'triangle';
        this.motorOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 base
        this.motorOsc2.frequency.setValueAtTime(110, this.ctx.currentTime);

        this.motorFilter.type = 'lowpass';
        this.motorFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
        this.motorFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.motorOsc1.connect(this.motorFilter);
        this.motorOsc2.connect(this.motorFilter);
        this.motorFilter.connect(this.motorGain);
        this.motorGain.connect(this.ctx.destination);

        this.motorOsc1.start();
        this.motorOsc2.start();
    }

    private setupDriftSynth(): void {
        if (!this.ctx || !this.noiseBuffer) return;

        this.driftFilter = this.ctx.createBiquadFilter();
        this.driftFilter.type = 'bandpass';
        this.driftFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
        this.driftFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

        this.driftGain = this.ctx.createGain();
        this.driftGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.driftFilter.connect(this.driftGain);
        this.driftGain.connect(this.ctx.destination);
    }

    public updatePlayerSpeed(speed: number, maxSpeed: number, isDrifting: boolean): void {
        if (!this.ctx || this.isMuted) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const normSpeed = Math.min(1.0, Math.max(0.0, speed / (maxSpeed || 500)));
        const now = this.ctx.currentTime;

        // 1. Motor Pitch & Volume
        if (this.motorOsc1 && this.motorOsc2 && this.motorFilter && this.motorGain) {
            const targetFreq1 = 55 + normSpeed * 220; // 55Hz to 275Hz
            const targetFreq2 = 110 + normSpeed * 330;
            const targetCutoff = 300 + normSpeed * 1800;
            const targetGain = 0.08 + normSpeed * 0.12;

            this.motorOsc1.frequency.setTargetAtTime(targetFreq1, now, 0.05);
            this.motorOsc2.frequency.setTargetAtTime(targetFreq2, now, 0.05);
            this.motorFilter.frequency.setTargetAtTime(targetCutoff, now, 0.05);
            this.motorGain.gain.setTargetAtTime(targetGain, now, 0.05);
        }

        // 2. Drift Screech
        if (this.driftGain && this.driftFilter && this.noiseBuffer) {
            if (isDrifting && normSpeed > 0.15) {
                if (!this.isDrifting) {
                    this.isDrifting = true;
                    // Start looping noise
                    this.driftNoiseNode = this.ctx.createBufferSource();
                    this.driftNoiseNode.buffer = this.noiseBuffer;
                    this.driftNoiseNode.loop = true;
                    this.driftNoiseNode.connect(this.driftFilter);
                    this.driftNoiseNode.start();
                }
                const driftFreq = 1400 + Math.random() * 800;
                this.driftFilter.frequency.setTargetAtTime(driftFreq, now, 0.03);
                this.driftGain.gain.setTargetAtTime(0.18, now, 0.03);
            } else {
                if (this.isDrifting) {
                    this.isDrifting = false;
                    this.driftGain.gain.setTargetAtTime(0.0, now, 0.05);
                    if (this.driftNoiseNode) {
                        try {
                            this.driftNoiseNode.stop(now + 0.06);
                        } catch { }
                        this.driftNoiseNode = null;
                    }
                }
            }
        }
    }

    public playBoost(): void {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    public playStuntChime(tier: number = 1): void {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const freqs = tier >= 2 ? [659.25, 880.00, 1174.66, 1567.98] : [783.99, 1046.50];

        freqs.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            const start = now + idx * 0.05;
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.0, start);
            gain.gain.linearRampToValueAtTime(0.18, start + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(start);
            osc.stop(start + 0.25);
        });
    }

    public playLapChime(lapNum: number): void {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.08);

            gain.gain.setValueAtTime(0.0, now + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(now + idx * 0.08);
            osc.stop(now + idx * 0.08 + 0.35);
        });
    }

    public playVictoryFanfare(): void {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        // Triumphant 16-bit arpeggio: C4, E4, G4, C5, E5, G5, C6 chord hold
        const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        arpeggio.forEach((f, i) => {
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'square';
            const noteStart = now + i * 0.07;
            osc.frequency.setValueAtTime(f, noteStart);

            const duration = i === arpeggio.length - 1 ? 1.2 : 0.25;
            gain.gain.setValueAtTime(0.18, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.001, noteStart + duration);

            osc.connect(gain);
            gain.connect(this.ctx!.destination);
            osc.start(noteStart);
            osc.stop(noteStart + duration);
        });
    }

    public stopAll(): void {
        if (this.motorGain && this.ctx) {
            this.motorGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
        }
        if (this.driftGain && this.ctx) {
            this.driftGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.05);
        }
    }
}
