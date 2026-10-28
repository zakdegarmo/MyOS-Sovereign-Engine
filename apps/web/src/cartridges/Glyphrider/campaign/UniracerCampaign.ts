/**
 * Glyphrider/campaign/UniracerCampaign.ts
 * 
 * 90s Meta-Narrative Campaign: The Uniracers Indy Reboot League.
 * 5 distinct narrative stages with story cutscenes, custom track topologies, and win conditions.
 */

export interface CampaignChapter {
    id: number;
    title: string;
    subtitle: string;
    dialogue: {
        speaker: string;
        avatar: string;
        text: string;
    }[];
    trackConfig: {
        radius: number;
        tubeRadius: number;
        tubularSegments: number;
        radialSegments: number;
        p: number;
        q: number;
        trackColor: string;
    };
    winCondition: {
        type: 'SCORE' | 'RACE' | 'SURVIVE';
        targetScore?: number;
        targetTime?: number;
        description: string;
    };
    opponentName?: string;
    opponentColor?: string;
    reward: string;
}

export const UNIRACER_CAMPAIGN_CHAPTERS: CampaignChapter[] = [
    {
        id: 1,
        title: "ACT I: DUSTING OFF THE SPOKES",
        subtitle: "The Garage Attic Revival (1994 -> 2026)",
        dialogue: [
            {
                speaker: "Red Mike (Veteran Unicycle)",
                avatar: "🔴",
                text: "30 years... 30 years since the corporate suits hit our studio with that ridiculous desk-lamp copyright lawsuit and erased our league."
            },
            {
                speaker: "Red Mike (Veteran Unicycle)",
                avatar: "🔴",
                text: "They may have buried our cartridges, but they couldn't bury our momentum! Let's do some backflips and test if these old spokes still spin!"
            }
        ],
        trackConfig: {
            radius: 180,
            tubeRadius: 28,
            tubularSegments: 300,
            radialSegments: 16,
            p: 2,
            q: 3,
            trackColor: '#ef4444'
        },
        winCondition: {
            type: 'SCORE',
            targetScore: 2000,
            description: 'Score 2,000+ Trick Points using Flips (A/D) & Twists (Q/E)'
        },
        reward: 'Red Mike\'s Chrome Hubcaps (+10% Boost Power)'
    },
    {
        id: 2,
        title: "ACT II: THE UNDERGROUND WAREHOUSE",
        subtitle: "Reuniting the Original Stunt Crew",
        dialogue: [
            {
                speaker: "Blue Streak",
                avatar: "🔵",
                text: "Mike?! Is that really you? I thought you were gathering dust at a retro flea market!"
            },
            {
                speaker: "Red Mike",
                avatar: "🔴",
                text: "We're putting the league back together, Streak! No publishers, no legal red tape—pure open-source unicycle stunt chaos!"
            },
            {
                speaker: "Blue Streak",
                avatar: "🔵",
                text: "Prove you've still got the rhythm. Chain a 4-stunt combo in the half-pipe and I'm in!"
            }
        ],
        trackConfig: {
            radius: 220,
            tubeRadius: 32,
            tubularSegments: 400,
            radialSegments: 16,
            p: 3,
            q: 5,
            trackColor: '#3b82f6'
        },
        winCondition: {
            type: 'SCORE',
            targetScore: 6000,
            description: 'Execute high-altitude combo stunts to reach 6,000 Points!'
        },
        reward: 'Blue Streak Nitro Tank (+15% Max Speed)'
    },
    {
        id: 3,
        title: "ACT III: STREAMING SENSATION",
        subtitle: "The Mock-MMO League Goes Viral",
        dialogue: [
            {
                speaker: "Turbo Pink",
                avatar: "💖",
                text: "Guys, I turned on the livestream and our stunt clips just hit #1 on the viral leaderboards! 500,000 viewers are watching our lobby!"
            },
            {
                speaker: "Esports Caster AI",
                avatar: "🎙️",
                text: "WELCOME UNICYCLE FANS! Tonight we have the legendary high-speed speedrun trials! Can our veteran cycles beat the clock?!"
            }
        ],
        trackConfig: {
            radius: 260,
            tubeRadius: 30,
            tubularSegments: 450,
            radialSegments: 16,
            p: 4,
            q: 7,
            trackColor: '#ec4899'
        },
        winCondition: {
            type: 'RACE',
            targetTime: 45,
            description: 'Complete the high-speed hyperspace lap in under 45 seconds!'
        },
        opponentName: "Turbo Pink",
        opponentColor: "#ec4899",
        reward: 'Hyper Surge Bearings (+20% Acceleration)'
    },
    {
        id: 4,
        title: "ACT IV: THE WHITE CYCLE MYTH",
        subtitle: "Encounter with the Spectral Prototype",
        dialogue: [
            {
                speaker: "Red Mike",
                avatar: "🔴",
                text: "Look at the telemetry... it's the mythical White Cycle! The fabled prototype that vanished before the 1994 release!"
            },
            {
                speaker: "The White Cycle",
                avatar: "⚪",
                text: "...*Spooky mechanical hum*... I AM THE GHOST OF UNRECOLORED MESHES. OUT-STUNT ME IF YOU DARE!"
            }
        ],
        trackConfig: {
            radius: 300,
            tubeRadius: 34,
            tubularSegments: 500,
            radialSegments: 16,
            p: 5,
            q: 8,
            trackColor: '#f8fafc'
        },
        winCondition: {
            type: 'SCORE',
            targetScore: 10000,
            description: 'Defeat the Spectral White Cycle with a 10,000+ Point mega stunt run!'
        },
        opponentName: "The White Cycle",
        opponentColor: "#ffffff",
        reward: 'Ghost Inversion Drive (Unlocks Spectral White Skin)'
    },
    {
        id: 5,
        title: "ACT V: WORLD MMO GRAND FINALS",
        subtitle: "The Sovereign Championship Mega-Loop",
        dialogue: [
            {
                speaker: "Esports Caster AI",
                avatar: "🎙️",
                text: "THIS IS IT! THE GRAND FINALS OF THE ROGUE UNICYCLE LEAGUE! 100,000 SPECTATORS CHEERING ACROSS THE MYOS DIMENSIONS!"
            },
            {
                speaker: "Red Mike",
                avatar: "🔴",
                text: "Let's show the whole world that real games never die—they just get rebooted!"
            }
        ],
        trackConfig: {
            radius: 350,
            tubeRadius: 36,
            tubularSegments: 600,
            radialSegments: 16,
            p: 6,
            q: 11,
            trackColor: '#facc15'
        },
        winCondition: {
            type: 'SCORE',
            targetScore: 15000,
            description: 'Achieve 15,000+ points on the Hyperspace Mega-Loop to claim the Gold Cup!'
        },
        reward: 'Sovereign Grand Cup Trophy & Infinite Stunt Sandbox'
    }
];
