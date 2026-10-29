// The Psychoacoustic Framework
// "The Bridge between Data (Truth) and Sound (Feeling)"

export type EmotionalValence = 'ecstatic' | 'happy' | 'neutral' | 'melancholic' | 'despairing';
export type EmotionalArousal = 'zen' | 'calm' | 'alert' | 'tense' | 'chaotic';
export type CognitiveLoad = 'simple' | 'moderate' | 'complex' | 'abstract';

export interface SonicPalette {
    rootKey: string;
    mode: string;
    tempo: number;
    waveform: 'sine' | 'triangle' | 'square' | 'sawtooth';
    harmonicDensity: 'sparse' | 'triad' | 'extension' | 'cluster';
    attack: number; // in seconds
    release: number; // in seconds
    roughness: number; // 0 to 1 (Detune/Modulation)
}

// THE MAPPING MATRIX (Thought's Geometry + Resonance's Soul)
export const PSYCHOACOUSTIC_MAPPING = {
    // 1. SCALES & MODES (Valence)
    scales: {
        ecstatic: 'lydian',    // The sound of wonder (#4)
        happy: 'major',        // The sound of stability
        neutral: 'mixolydian', // The sound of movement (b7)
        melancholic: 'minor',  // The sound of introspection (b3)
        despairing: 'locrian'  // The sound of collapse (b2, b5)
    },
    // 2. TIMBRE & TEXTURE (Complexity/Load)
    waveforms: {
        simple: 'sine',        // Pure truth
        moderate: 'triangle',  // Soft harmonics
        complex: 'square',     // Digital richness
        abstract: 'sawtooth'   // Raw energy/Friction
    },
    // 3. ENVELOPE & TEMPO (Arousal)
    dynamics: {
        zen: { tempo: 60, attack: 0.5, release: 2.0 },      // Breathing
        calm: { tempo: 80, attack: 0.1, release: 1.0 },     // Walking
        alert: { tempo: 110, attack: 0.05, release: 0.5 },  // Thinking
        tense: { tempo: 130, attack: 0.01, release: 0.2 },  // Fighting
        chaotic: { tempo: 160, attack: 0, release: 0.1 }    // Glitching
    }
};

/**
 * Translates a Gemini Analysis (Sentiment/Context) into Musical Parameters
 */
export const translateContextToSound = (
    valence: number, // -1 to 1
    arousal: number, // 0 to 1
    complexity: number // 0 to 1
): SonicPalette => {
    
    // Map Valence to Scale
    let emotion: EmotionalValence = 'neutral';
    if (valence > 0.6) emotion = 'ecstatic';
    else if (valence > 0.2) emotion = 'happy';
    else if (valence < -0.6) emotion = 'despairing';
    else if (valence < -0.2) emotion = 'melancholic';

    // Map Arousal to Dynamics
    let state: EmotionalArousal = 'alert';
    if (arousal < 0.2) state = 'zen';
    else if (arousal < 0.4) state = 'calm';
    else if (arousal > 0.8) state = 'chaotic';
    else if (arousal > 0.6) state = 'tense';

    // Map Complexity to Waveform/Roughness
    let load: CognitiveLoad = 'moderate';
    let roughness = 0;
    if (complexity < 0.3) { load = 'simple'; roughness = 0; }
    else if (complexity > 0.8) { load = 'abstract'; roughness = 0.5; }
    else if (complexity > 0.6) { load = 'complex'; roughness = 0.2; }

    const dyn = PSYCHOACOUSTIC_MAPPING.dynamics[state];

    return {
        rootKey: 'C', // Dynamic root selection can be added later
        mode: PSYCHOACOUSTIC_MAPPING.scales[emotion],
        waveform: PSYCHOACOUSTIC_MAPPING.waveforms[load] as any,
        harmonicDensity: complexity > 0.7 ? 'extension' : 'triad',
        tempo: dyn.tempo,
        attack: dyn.attack,
        release: dyn.release,
        roughness: roughness
    };
};
