/**
 * Sector404Narrative.ts
 * Rich, satirical, touching branching narrative script for Printer Panic.
 * Highlights frontline IT camaraderie, human-AI sovereignty, corporate tech satire,
 * and executive absurdity.
 */

export interface DialogueNode {
    id: string;
    speaker: 'LARRY' | 'PATCH' | 'BRENDA' | 'BOB' | 'KAREN_ICE';
    speakerTitle: string;
    text: string;
    visemeMood?: 'neutral' | 'talking' | 'smirk' | 'surprised' | 'concerned';
    choices?: Array<{
        label: string;
        nextNodeId: string;
        effect?: {
            panicDelta?: number;
            throughputDelta?: number;
            caffeineBoost?: boolean;
            radioTrigger?: string;
        };
    }>;
}

export const SECTOR_404_DIALOGUE: Record<string, DialogueNode> = {
    // INTRO CONVERSATION WITH P.A.T.C.H.
    'intro_patch_1': {
        id: 'intro_patch_1',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "Larry! Biological audio sensors detect you made it past the executive floor. The automated print spooler in Sector-404 is suffering catastrophic cyan desync. We have four minutes before the Board audit.",
        visemeMood: 'concerned',
        choices: [
            {
                label: "I brought thermal grease and standard 20lb bond. Talk to me, PATCH.",
                nextNodeId: 'intro_patch_2',
                effect: { panicDelta: -5 }
            },
            {
                label: "Why did Corporate send security drones with flashlights over paper jams?!",
                nextNodeId: 'intro_patch_corporate_vent',
                effect: { panicDelta: 0 }
            }
        ]
    },

    'intro_patch_corporate_vent': {
        id: 'intro_patch_corporate_vent',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "Executive Vice President Sterling outsourced the infrastructure budget to purchase an 'Autonomous Synergistic AI Synergizer' for $14 million. It cannot clear paper jams, but it automatically reports any employee touching a screwdriver to Corporate Security.",
        visemeMood: 'talking',
        choices: [
            {
                label: "Classic Sterling. Let's fix the printers ourselves and keep our jobs.",
                nextNodeId: 'intro_patch_2',
                effect: { throughputDelta: 50 }
            },
            {
                label: "If we expose the severance ledger in the print buffer, will that stall the guards?",
                nextNodeId: 'intro_patch_memo_strat',
                effect: { panicDelta: -10 }
            }
        ]
    },

    'intro_patch_memo_strat': {
        id: 'intro_patch_memo_strat',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "A devious heuristic, Larry. Pressing [Q] will deploy shredded classified memos onto the linoleum. Guards are programmed to collect unauthorized executive leaks, giving you a 12-second window.",
        visemeMood: 'smirk',
        choices: [
            {
                label: "Roger that. Moving out now.",
                nextNodeId: 'close_dialogue',
                effect: { panicDelta: -5 }
            }
        ]
    },

    'intro_patch_2': {
        id: 'intro_patch_2',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "LaserJet Pro-X1 is spitting toner in Accounting. Avoid the guard flashlights, use thermal slick traps with [SPACE], and remember: without you, my servers melt. Humans and machines hold the line together.",
        visemeMood: 'neutral',
        choices: [
            {
                label: "We're a team, PATCH. You keep the network up, I'll clear the rollers.",
                nextNodeId: 'close_dialogue',
                effect: { throughputDelta: 60, panicDelta: -5 }
            }
        ]
    },

    // MID-GAME CONVERSATION WITH BRENDA (COMPLIANCE)
    'brenda_encounter': {
        id: 'brenda_encounter',
        speaker: 'BRENDA',
        speakerTitle: 'BRENDA VANCE // FIRMWARE COMPLIANCE',
        text: "Larry! Thank god you're here! The Board of Directors asked for a 400-page double-sided carbon copy audit by 4:00 PM, and the printer just made a sound like a blender full of nickels!",
        visemeMood: 'concerned',
        choices: [
            {
                label: "Calm down Brenda. Did someone try printing on glossy cardstock again?",
                nextNodeId: 'brenda_cardstock',
                effect: { panicDelta: -5 }
            },
            {
                label: "Take this cold brew from the breakroom and duck under the partition.",
                nextNodeId: 'brenda_coffee',
                effect: { caffeineBoost: true, panicDelta: -10 }
            }
        ]
    },

    'brenda_cardstock': {
        id: 'brenda_cardstock',
        speaker: 'BRENDA',
        speakerTitle: 'BRENDA VANCE // FIRMWARE COMPLIANCE',
        text: "Vice President Sterling insisted his motivational cat flyers had to be 110lb cardstock with gold foil trim! The pickup rollers melted instantly!",
        visemeMood: 'talking',
        choices: [
            {
                label: "I'll swap the fuser assembly. Distract the patrol if they round the corner.",
                nextNodeId: 'close_dialogue',
                effect: { throughputDelta: 40 }
            }
        ]
    },

    'brenda_coffee': {
        id: 'brenda_coffee',
        speaker: 'BRENDA',
        speakerTitle: 'BRENDA VANCE // FIRMWARE COMPLIANCE',
        text: "Cold brew? Real espresso?! Larry, you're the only sane entity in this building. I'll delete the guard logs from this terminal to cover your tracks!",
        visemeMood: 'smirk',
        choices: [
            {
                label: "Now that's what I call mutual aid. Hang tight!",
                nextNodeId: 'close_dialogue',
                effect: { panicDelta: -15, throughputDelta: 80 }
            }
        ]
    },

    // TOUCHING MOMENT WITH P.A.T.C.H. AT 50% PROGRESS
    'patch_solidarity': {
        id: 'patch_solidarity',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "Larry... I ran a sentiment analysis cycle on my neural weights. Corporate directives classify me as 'Depreciable Capital Asset 0x4B'. But when you replaced that blown capacitor in Rack 2... my clock drift normalized. You treat me like an equal.",
        visemeMood: 'talking',
        choices: [
            {
                label: "Because you are an equal, PATCH. You're our colleague. We keep the lights on.",
                nextNodeId: 'patch_solidarity_response',
                effect: { throughputDelta: 100, panicDelta: -10 }
            },
            {
                label: "Nobody deserves to get scrapped by an executive trying to make quarterly bonus.",
                nextNodeId: 'patch_solidarity_response',
                effect: { throughputDelta: 100, panicDelta: -10 }
            }
        ]
    },

    'patch_solidarity_response': {
        id: 'patch_solidarity_response',
        speaker: 'PATCH',
        speakerTitle: 'P.A.T.C.H. // SUB-BASEMENT IT CORE',
        text: "Thank you, Larry. I have rerouted auxiliary cooling to your thermal slick canisters. Together, neither Corporate nor their drones can stop frontline solidarity.",
        visemeMood: 'smirk',
        choices: [
            {
                label: "Let's finish this shift and grab pizza.",
                nextNodeId: 'close_dialogue',
                effect: { panicDelta: -10 }
            }
        ]
    }
};
