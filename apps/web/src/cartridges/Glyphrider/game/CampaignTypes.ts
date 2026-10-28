
import type { TrackConfig } from './Track';
import { Archetype } from './Racer';

export enum WinConditionType {
    RACE = 'RACE', // Finish 1st
    SCORE = 'SCORE', // Get X points
    TIME = 'TIME', // Finish scoring run in X time? Or just survive?
    COLLECT = 'COLLECT' // Collect X items
}

export interface WinCondition {
    type: WinConditionType;
    value: number; // e.g., 5000 points, or 1 (rank)
}

export interface LevelDefinition {
    id: string;
    name: string;
    description: string;

    // Track Geometry
    track: TrackConfig;

    // Gameplay
    playerArchetype?: Archetype; // Force character? Or allow selection?
    // Story usually forces character early on.

    opponentArchetype?: Archetype;
    opponentSpeed?: number;

    winCondition: WinCondition;

    // Narrative
    introText: string;
    cutsceneUrl?: string; // Placeholder for video
}
