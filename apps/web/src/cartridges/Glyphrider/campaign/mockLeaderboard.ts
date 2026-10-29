/**
 * Glyphrider/campaign/mockLeaderboard.ts
 * 
 * Simulated live MMO leaderboard rankings, viral wipeouts,
 * and dynamic Twitch/Esports live chat reactions.
 */

export interface LeaderboardEntry {
    rank: number;
    name: string;
    score: number;
    bestTrick: string;
    avatarColor: string;
    isPlayer?: boolean;
}

export const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: "The_White_Cycle", score: 48920, bestTrick: "Septuple Twist + Hexa-Flip", avatarColor: "#ffffff" },
    { rank: 2, name: "TurboPink94", score: 38450, bestTrick: "Quad Tabletop Combo", avatarColor: "#ec4899" },
    { rank: 3, name: "BlueStreak_OG", score: 32100, bestTrick: "Triple Backflip 720", avatarColor: "#3b82f6" },
    { rank: 4, name: "RedMike_Vet", score: 28900, bestTrick: "Double Frontflip Roll", avatarColor: "#ef4444" },
    { rank: 5, name: "Pixar_CeaseDesist", score: 18500, bestTrick: "Litigation Wipeout", avatarColor: "#94a3b8" },
    { rank: 6, name: "SpokeSpinner99", score: 14200, bestTrick: "Super Corkscrew", avatarColor: "#10b981" },
    { rank: 7, name: "UnicycleGoat", score: 11300, bestTrick: "Z-Stall 540", avatarColor: "#f59e0b" }
];

export const MOCK_CHAT_MESSAGES = [
    "POG! Look at that rotation speed!",
    "OMEGALUL DID HE JUST QUAD FLIP INTO A LOOP?!",
    "Red Mike is actually the GOAT, 30 years later and still got it",
    "Pixar in shambles right now 😂",
    "Clip that wipeout!!",
    "The 90s physics engine hits different 🔥",
    "WHITE CYCLE SIGHTING IN CHAT??",
    "Boost gauge at 100%, he's going for the world record!",
    "HYPERSPACE LOOP IS INSANE",
    "Uniracers League Reboot is the best thing in MyOS!"
];
