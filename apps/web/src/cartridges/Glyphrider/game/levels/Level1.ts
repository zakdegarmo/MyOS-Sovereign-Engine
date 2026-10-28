
import { type LevelDefinition, WinConditionType } from '../CampaignTypes';
import { Archetype } from '../Racer';

export const Level1_Junkyard: LevelDefinition = {
    id: 'lvl_01_junkyard',
    name: 'The Rust Bucket',
    description: 'Mono wakes up in the junkyard. Time to shake off the rust.',

    track: {
        radius: 200,
        tubeRadius: 40, // Wide tube for tutorial
        tubularSegments: 400,
        radialSegments: 16,
        p: 2, // Simple Loop
        q: 3, // Slight Twist
        trackColor: '#554433' // Rusty Brown
    },

    playerArchetype: Archetype.PLUMBER, // "Mono" (using Plumber stats for now as 'Balanced')
    // Actually, let's say Mono is Plumber based on current stats? 
    // Wait, Mono (Self) should probably be new stats, but Plumber is fine for prototype.

    opponentArchetype: undefined, // Solo run

    winCondition: {
        type: WinConditionType.SCORE,
        value: 1000 // Just do a few tricks
    },

    introText: "System Reboot... core unstable... attempt movement."
};
