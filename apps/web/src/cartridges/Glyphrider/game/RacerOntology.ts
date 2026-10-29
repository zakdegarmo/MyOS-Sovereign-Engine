import { GameConfig } from './GameConfig';

/**
 * Micro-Ontology: The Decad Mapping Method
 * 
 * This establishes a stabilized data structure that maps domain-specific 
 * concepts (Racer Stats) to the 10 Pillars of the Fractal Semantic Genome.
 */
export const RacerOntology = {
    pillars: {
        S1_SELF: 'self',          // Handling / Grip Stability
        S2_THOUGHT: 'thought',    // Rotation X (Pitch / Anticipation)
        S3_LOGIC: 'logic',        // Rotation Z (Roll / Structure)
        S4_UNITY: 'unity',        // Rotation Y (Yaw / Alignment)
        S5_EXISTENCE: 'existence', // Base Velocity / Engine Power
        S6_IMPROVEMENT: 'improvement', // Magnetism / Landing Assist
        S7_MASTERY: 'mastery',    // Combo Multiplier / Skill Mastery
        S8_RESONANCE: 'resonance', // Boost Strength / Pulse
        S9_TRANSCENDENCE: 'transcendence', // Jump Height / Elevation
        S10_OMNI: 'omni'         // Stomp / Void Recovery (Space-Time Control)
    },

    /**
     * Stabilizes a raw stats object into a Pillar-aligned genome.
     * This method is the "Meta-Micro-Ontology" intended for shared context.
     */
    stabilize(stats: any) {
        return {
            existence: stats.existence || GameConfig.decad.existence,
            thought: stats.thought || GameConfig.decad.thought,
            logic: stats.logic || GameConfig.decad.logic,
            unity: stats.unity || GameConfig.decad.unity,
            self: stats.self || GameConfig.decad.self,
            improvement: stats.improvement || GameConfig.decad.improvement,
            mastery: stats.mastery || GameConfig.decad.mastery,
            resonance: stats.resonance || GameConfig.decad.resonance,
            transcendence: stats.transcendence || GameConfig.decad.transcendence,
            omni: stats.omni || GameConfig.decad.omni
        };
    }
};
