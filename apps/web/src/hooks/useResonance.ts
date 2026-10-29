import { useMemo, useState } from 'react';


export interface ResonanceState {
    name: string;
    backgroundUrl: string;
    floorTextureUrl: string;
    ambientIntensity: number;
    colorShift?: string; // CSS filter or hex
    glitchIntensity?: number;
}

interface FragmentStatus {
    total: number;
    secured: number;
    compromised: number;
}

const getResonanceForStatus = (status: FragmentStatus): ResonanceState => {
    const { secured, compromised, total } = status;
    const progress = (secured / total) * 100;
    const corruption = (compromised / total) * 100;

    if (secured < 2 && compromised === 0) {
        return {
            name: 'Neutral (The Baseline)',
            backgroundUrl: '/textures/world_map_neutral.jpg',
            floorTextureUrl: '/textures/stone_floor_1.jpg',
            ambientIntensity: 1.2,
            colorShift: 'contrast(1) saturate(1)',
            glitchIntensity: 0
        };
    }

    if (corruption > 30 || (total - secured - compromised) < 3) {
        // Dire State: Matrix cracking, digital debauchery
        return {
            name: 'Dire (Meltdown Sequence)',
            backgroundUrl: '/textures/world_map_neutral.jpg',
            floorTextureUrl: '/textures/stone_floor_1.jpg',
            ambientIntensity: 0.8,
            colorShift: 'none',
            glitchIntensity: 0
        };
    }

    if (progress > 50) {
        // Harmonic (Exotic Matrix)
        return {
            name: 'Harmonic (Exotic Matrix)',
            backgroundUrl: '/textures/world_map_neutral.jpg',
            floorTextureUrl: '/textures/stone_floor_1.jpg',
            ambientIntensity: 1.2,
            colorShift: 'none',
            glitchIntensity: 0
        };
    }

    // Default/Matrix state
    return {
        name: 'Active (The Mesh)',
        backgroundUrl: '/textures/world_map_neutral.jpg',
        floorTextureUrl: '/textures/stone_floor_1.jpg',
        ambientIntensity: 1.0,
        colorShift: 'none',
        glitchIntensity: 0
    };
};

export const useResonance = (status: FragmentStatus = { total: 10, secured: 0, compromised: 0 }) => {
    const [isAutoShifting, setIsAutoShifting] = useState(false);
    const [shiftInterval, setShiftInterval] = useState(5000);
    const [manualOverrideIndex, setManualOverrideIndex] = useState<number | null>(null);

    const allStates = useMemo(() => [
        getResonanceForStatus({ total: 10, secured: 0, compromised: 0 }),
        getResonanceForStatus({ total: 10, secured: 6, compromised: 0 }),
        getResonanceForStatus({ total: 10, secured: 0, compromised: 4 })
    ], []);

    const currentState = useMemo(() => {
        if (manualOverrideIndex !== null && allStates[manualOverrideIndex]) {
            return allStates[manualOverrideIndex];
        }
        return getResonanceForStatus(status);
    }, [status, manualOverrideIndex, allStates]);

    return {
        currentState,
        resonanceIndex: manualOverrideIndex ?? 0,
        setResonanceIndex: setManualOverrideIndex,
        nextResonance: () => setManualOverrideIndex(prev => ((prev ?? 0) + 1) % allStates.length),
        prevResonance: () => setManualOverrideIndex(prev => ((prev ?? 0) - 1 + allStates.length) % allStates.length),
        isAutoShifting,
        setIsAutoShifting,
        shiftInterval,
        setShiftInterval,
        allStates,
        setManualOverride: setManualOverrideIndex
    };
};
