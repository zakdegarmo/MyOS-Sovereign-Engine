import type { ResonanceField } from '../resonance/types';

export interface TranscendenceState {
    cycleId: string;
    isComplete: boolean;
    finalReflection: string;
    nextSeed: string; // The cycle begins anew
}
