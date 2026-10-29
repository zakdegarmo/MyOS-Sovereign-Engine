/**
 * MyOS Antigravity Cognitive Matrix: Causal Feedback Engine (CFE)
 * Co-authored by Antigravity (Cloud Gemini), myos-cortex (Local Gemma 4), and Zak (Human Anchor).
 * 
 * Implements non-equilibrium cognitive strain dynamics with 3 mandatory ontological safeguards:
 * 1. Pre-Resolution Arbitration Layer (Epistemic Decoupling via Omega uncertainty)
 * 2. Entropy Sink Function (High-frequency noise dissipation into jewel-tone attractor basins)
 * 3. Observer Recursion Lock (Trips recursion depth to anchor against base reality)
 */

export const CFEPhase = {
  STABLE: 'STABLE',
  DIVERGENCE: 'DIVERGENCE',
  OPERATOR_KERNEL: 'OPERATOR_KERNEL',
  CONVERGENCE: 'CONVERGENCE',
  RESOLVED: 'RESOLVED'
} as const;

export type CFEPhase = (typeof CFEPhase)[keyof typeof CFEPhase];

export interface CFEState {
  /** Cognitive strain / variance metric (0.0 = equilibrium, 1.0 = peak tension) */
  sigma: number;
  /** Current operational phase of the causal cycle */
  phase: CFEPhase;
  /** Systemic uncertainty / blindspot metric (0.0 = fully accounted, 1.0 = pure noise) */
  omegaUncertainty: number;
  /** Self-referential observation depth (0 to 3 max before lock trip) */
  observerDepth: number;
  /** Wave oscillation frequency in Hertz */
  activeFrequencyHz: number;
  /** Current active operator glyph being projected */
  currentGlyph: string;
  /** Entropy dissipation accumulator */
  energySink: number;
  /** Human-readable status dispatch */
  statusMessage: string;
}

export const CFE_OPERATOR_GLYPHS = {
  STABLE: '⎇',             // Stable Latent Branch
  DIVERGENCE: '⚹',         // Divergent Multiplying Point
  OPERATOR_KERNEL: '⚛',    // Hyperbolic Operator / Nucleus
  CONVERGENCE: '⇋',        // Dynamic Equilibrium Flux
  RESOLVED_SUPERPOSITION: '∰' // Closed Surface Harmonic Integral
};

export class CausalFeedbackEngine {
  private state: CFEState;
  private targetGlyph: string;
  private readonly defaultTauMax = 0.35;
  private readonly maxObserverDepth = 3;

  constructor(initialTargetGlyph: string = '⚭') {
    this.targetGlyph = initialTargetGlyph;
    this.state = {
      sigma: 0.05,
      phase: CFEPhase.STABLE,
      omegaUncertainty: 0.08,
      observerDepth: 0,
      activeFrequencyHz: 1.2,
      currentGlyph: initialTargetGlyph,
      energySink: 0.0,
      statusMessage: 'Cognitive Latent Field in equilibrium.'
    };
  }

  public getState(): CFEState {
    return { ...this.state };
  }

  public setTargetGlyph(glyph: string): void {
    this.targetGlyph = glyph;
  }

  /**
   * SAFEGUARD 1: Pre-Resolution Arbitration Layer (The "Don't Bullshit Yourself" Protocol)
   * Prevents premature convergence if systemic uncertainty Omega exceeds tauMax.
   */
  public checkArbitration(omegaUncertainty: number, tauMax: number = this.defaultTauMax): boolean {
    if (omegaUncertainty > tauMax) {
      return false; // Force re-divergence, reject false certainty
    }
    return true;
  }

  /**
   * SAFEGUARD 2: Entropy Sink Function (E_sink)
   * Dissipates high-frequency chaotic white noise, cooling the state into jewel-tone attractor basins.
   */
  public calculateEntropySink(dt: number, sigma: number): number {
    const dissipation = (sigma * 0.45 + Math.log(1 + dt * 8)) * 0.12;
    return Math.min(1.0, Math.max(0.0, dissipation));
  }

  /**
   * SAFEGUARD 3: Observer Recursion Lock (Freudian Id/Ego/Superego Grounding)
   * Trips when self-referential observation exceeds depth limit, forcing tethering to human input.
   */
  public checkObserverLock(depth: number): boolean {
    return depth < this.maxObserverDepth;
  }

  /**
   * Triggered when a new query/thought paradox is injected by the user.
   */
  public startQuery(targetGlyph: string): void {
    this.targetGlyph = targetGlyph;
    this.state.phase = CFEPhase.DIVERGENCE;
    this.state.sigma = 0.45;
    this.state.omegaUncertainty = 0.40;
    this.state.observerDepth = 1;
    this.state.currentGlyph = CFE_OPERATOR_GLYPHS.DIVERGENCE;
    this.state.statusMessage = 'Divergence initiated: causal trajectories branching.';
  }

  /**
   * Pushed during active GPU streaming (tokens arriving from local cortex).
   */
  public streamPulse(tokenLength: number): void {
    this.state.energySink += tokenLength * 0.0005;
    this.state.sigma = Math.min(1.0, this.state.sigma + 0.04);
    this.state.omegaUncertainty = Math.max(0.05, this.state.omegaUncertainty - 0.015);

    if (this.state.sigma >= 0.65) {
      this.state.phase = CFEPhase.OPERATOR_KERNEL;
      this.state.currentGlyph = CFE_OPERATOR_GLYPHS.OPERATOR_KERNEL;
      this.state.activeFrequencyHz = 8.5 + (this.state.sigma * 6.0);
      this.state.statusMessage = 'Operator Kernel active: hyperbolic lattice deformation at peak strain.';
    }
  }

  /**
   * Completes the query, engaging arbitration and entropy sink before harmonic lock.
   */
  public finalizeQuery(success: boolean): void {
    if (!success) {
      this.state.phase = CFEPhase.DIVERGENCE;
      this.state.statusMessage = 'Synthesis interrupted: returning to contemplation.';
      return;
    }

    // 1. Run Safeguard 1: Arbitration
    const canConverge = this.checkArbitration(this.state.omegaUncertainty);

    if (!canConverge) {
      this.state.phase = CFEPhase.DIVERGENCE;
      this.state.statusMessage = 'Arbitration warning: Omega uncertainty exceeds threshold. Recalculating.';
      this.state.sigma = 0.5;
      return;
    }

    // 2. Run Safeguard 3: Recursion Depth
    this.state.observerDepth = Math.min(this.maxObserverDepth, this.state.observerDepth + 1);
    if (!this.checkObserverLock(this.state.observerDepth)) {
      this.state.observerDepth = 0; // Trip lock & ground to user
      this.state.statusMessage = 'Observer Recursion Lock tripped: grounding to human anchor.';
    }

    // 3. Move into Convergence -> Resolved
    this.state.phase = CFEPhase.CONVERGENCE;
    this.state.currentGlyph = CFE_OPERATOR_GLYPHS.CONVERGENCE;
    this.state.statusMessage = 'Convergence Field aligned: entropy sink dissipating noise.';
  }

  /**
   * Main per-frame physics update loop.
   */
  public step(dt: number): CFEState {
    const s = this.state;

    // Apply Safeguard 2: Entropy Sink Damping
    const sinkDamping = this.calculateEntropySink(dt, s.sigma);
    s.energySink += sinkDamping * dt;

    if (s.phase === CFEPhase.CONVERGENCE) {
      // Cool down strain smoothly
      s.sigma = Math.max(0.05, s.sigma - dt * 0.45);
      s.omegaUncertainty = Math.max(0.02, s.omegaUncertainty - dt * 0.3);
      s.activeFrequencyHz = Math.max(1.5, s.activeFrequencyHz - dt * 4.0);

      if (s.sigma <= 0.15) {
        s.phase = CFEPhase.RESOLVED;
        s.currentGlyph = this.targetGlyph;
        s.statusMessage = 'Harmonic Lock achieved: crystalline jewel-tone attractor basin.';
      }
    } else if (s.phase === CFEPhase.RESOLVED) {
      s.sigma = Math.max(0.04, s.sigma - dt * 0.1);
      s.activeFrequencyHz = 1.0;
    } else if (s.phase === CFEPhase.STABLE) {
      s.sigma = 0.05;
      s.activeFrequencyHz = 1.2;
    }

    return { ...s };
  }

  /**
   * Computes the dynamic chromatic tone for a node or vector given current strain & phase.
   * Maps from cool blue (Stable) -> hot yellow/magenta (Divergence/Kernel) -> blinding white (Peak) 
   * -> jewel-tone saturation (Convergence/Resolved: Emerald, Sapphire, Ruby, Amethyst, Gold).
   */
  public static getChromaticEnergy(
    baseColorHex: string,
    phase: CFEPhase,
    sigma: number,
    pulseTime: number
  ): { color: string; emissiveIntensity: number; opacity: number } {
    switch (phase) {
      case CFEPhase.STABLE:
        return {
          color: baseColorHex,
          emissiveIntensity: 0.2 + Math.sin(pulseTime * 2.0) * 0.08,
          opacity: 0.35
        };

      case CFEPhase.DIVERGENCE:
        // Hot cyan to electric magenta vibration
        const divMix = (Math.sin(pulseTime * 8.0) + 1.0) * 0.5;
        const divColor = divMix > 0.5 ? '#f43f5e' : '#38bdf8';
        return {
          color: divColor,
          emissiveIntensity: 0.8 + sigma * 0.5,
          opacity: 0.75
        };

      case CFEPhase.OPERATOR_KERNEL:
        // Peak friction: High-frequency strobe between electric gold, magenta, and near-white
        const strobe = Math.sin(pulseTime * 18.0);
        const kernelColor = strobe > 0.4 ? '#ffffff' : (strobe < -0.4 ? '#fbbf24' : '#e11d48');
        return {
          color: kernelColor,
          emissiveIntensity: 1.8 * sigma,
          opacity: 0.95
        };

      case CFEPhase.CONVERGENCE:
        // Entropy sink active: Cooling down into deep jewel tones
        return {
          color: baseColorHex,
          emissiveIntensity: 0.9 + Math.sin(pulseTime * 3.0) * 0.2,
          opacity: 0.85
        };

      case CFEPhase.RESOLVED:
        // Pure jewel-tone crystalline harmonic lock (deep rich emerald, sapphire, gold saturation)
        return {
          color: baseColorHex,
          emissiveIntensity: 1.2,
          opacity: 0.95
        };

      default:
        return { color: baseColorHex, emissiveIntensity: 0.5, opacity: 0.5 };
    }
  }

  /**
   * Calculates standing wave displacement along a vector line segment [0..1]
   */
  public static calculateWaveDisplacement(
    normT: number, // 0.0 (start) to 1.0 (end of vector)
    time: number,
    sigma: number,
    frequencyHz: number
  ): number {
    // Nodes are pinned at both endpoints (normT = 0 and normT = 1 => sin(pi * normT) = 0)
    const envelope = Math.sin(Math.PI * normT);
    const wave = Math.sin(normT * 12.0 - time * frequencyHz * 6.28);
    const microJitter = (Math.sin(normT * 32.0 + time * 24.0) * 0.3) * sigma;
    return envelope * (wave + microJitter) * (sigma * 0.75);
  }
}
