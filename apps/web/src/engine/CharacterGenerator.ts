import { cyrb53 } from '../hooks/useOntologicalGenome';

export interface CharacterSheet5e {
    id: string; // The unique slug/path (e.g. 'npc.fighter.bob')
    name: string;
    race: string;
    charClass: string;
    alignment: string;
    level: number;
    hp: number;
    ac: number;
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    background: string;
    inventory: string[];
    persona: string;
}

// A simple linear congruential generator for seeded randoms [0, 1)
const seededRandom = (seed: number) => {
    let currentSeed = seed;
    return () => {
        currentSeed = (currentSeed * 1664525 + 1013904223) >>> 0;
        return currentSeed / 4294967296;
    };
};

// Roll 4d6 drop lowest
const rollAttribute = (rng: () => number) => {
    const rolls = [
        Math.floor(rng() * 6) + 1,
        Math.floor(rng() * 6) + 1,
        Math.floor(rng() * 6) + 1,
        Math.floor(rng() * 6) + 1,
    ];
    rolls.sort((a, b) => a - b);
    return rolls[1] + rolls[2] + rolls[3];
};

const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling', 'Half-Orc', 'Gnome'];
const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Bard', 'Paladin', 'Ranger', 'Warlock'];
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
const BACKGROUNDS = ['Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Urchin'];

const NAMES = {
    first: ['Aelar', 'Borin', 'Cora', 'Daen', 'Eldon', 'Fargrim', 'Gael', 'Hildar', 'Ilyana', 'Jorn', 'Kaelen', 'Lyra', 'Morthos', 'Nyx', 'Orik', 'Pyra', 'Quinn', 'Rurik', 'Sylas', 'Talia', 'Ulfgar', 'Vex', 'Wyn', 'Xander', 'Yara', 'Zane'],
    last: ['Ironfist', 'Swiftbrook', 'Nightbreeze', 'Stonebreaker', 'Lightbringer', 'Shadowwalker', 'Fireforge', 'Starwhisper', 'Frostbeard', 'Stormrider']
};

const MOTIVATIONS = ['Pay off a massive cyber-debt', 'Find a lost sibling in the matrix', 'Overthrow local secure-node admin', 'Achieve digital immortality', 'Steal the root access keys'];
const SECRETS = ['Secretly an android', 'Working for the rival faction', 'Patient zero for a digital virus', 'Knows a back door into the Hub', 'Is actually a rogue AI fragment'];
const OCCUPATIONS = ['Data Courier', 'Ice Breaker', 'Neon Scavenger', 'Grid Security', 'Sim-Stim Dealer', 'Void Cartographer', 'Memory Broker'];
const APPEARANCES = ['tall and unusually thin', 'heavily cybernetically modified', 'wearing a tattered trenchcoat', 'glowing with unnatural bioluminescence', 'missing an arm, replaced by a holographic projection', 'dressed in pristine corporate uniform'];
const ABILITIES = ['Overclock', 'Ghost Walk', 'Neural Spike', 'Firewall Burst', 'Data Siphon', 'Void Blink'];
const RELATIONSHIP_TYPES = ['Trusted Ally', 'Bitter Rival', 'Former Partner', 'Digital Sibling', 'Indebted To', 'Undercover Agent'];

const DEFAULT_SHEET: CharacterSheet5e & { 
    motivation: string; 
    secret: string; 
    occupation: string; 
    appearance: string;
    abilities: string[];
    relationships: string[];
    spriteTags: string[];
} = {
    id: 'unknown',
    name: 'Unknown Agent',
    race: 'Construct',
    charClass: 'Unknown',
    alignment: 'True Neutral',
    level: 1,
    hp: 1,
    ac: 10,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    background: 'Unknown',
    inventory: [],
    persona: 'A silent vessel in the matrix.',
    motivation: 'Unknown',
    secret: 'Unknown',
    occupation: 'Unknown',
    appearance: 'Unknown',
    abilities: [],
    relationships: [],
    spriteTags: []
};

export const generateCharacterSheet = (slug: string): CharacterSheet5e & { 
    motivation: string; 
    secret: string; 
    occupation: string; 
    appearance: string;
    abilities: string[];
    relationships: string[];
    spriteTags: string[];
} => {
    if (!slug) return DEFAULT_SHEET;

    const seed = cyrb53(slug);
    const rng = seededRandom(seed);


    const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

    const race = pick(RACES);
    const charClass = pick(CLASSES);
    const firstName = pick(NAMES.first);
    const lastName = pick(NAMES.last);

    const stats = {
        str: rollAttribute(rng),
        dex: rollAttribute(rng),
        con: rollAttribute(rng),
        int: rollAttribute(rng),
        wis: rollAttribute(rng),
        cha: rollAttribute(rng)
    };

    const conMod = Math.floor((stats.con - 10) / 2);
    let hitDie = 8;
    if (charClass === 'Fighter' || charClass === 'Paladin' || charClass === 'Ranger') hitDie = 10;
    if (charClass === 'Wizard') hitDie = 6;
    
    const hp = hitDie + conMod;
    const dexMod = Math.floor((stats.dex - 10) / 2);
    const ac = 10 + dexMod + (charClass === 'Fighter' ? 4 : 0);

    const motivation = pick(MOTIVATIONS);
    const secret = pick(SECRETS);
    const occupation = pick(OCCUPATIONS);
    const appearance = pick(APPEARANCES);

    const abilities = [pick(ABILITIES)];
    if (rng() > 0.7) abilities.push(pick(ABILITIES));

    const relationships = [`${pick(RELATIONSHIP_TYPES)}: ${pick(NAMES.first)} ${pick(NAMES.last)}`];

    // Generate explicit declarative tags for the visual engine depending on Hexroll outputs
    const spriteTags = [
        race.toLowerCase(),
        charClass.toLowerCase(),
        rng() > 0.5 ? 'male' : 'female'
    ];

    if (charClass === 'Fighter') spriteTags.push('armor', 'sword');
    if (charClass === 'Wizard') spriteTags.push('robe', 'staff');
    if (charClass === 'Rogue') spriteTags.push('leather', 'dagger');
    if (charClass === 'Cleric') spriteTags.push('chainmail', 'mace');

    return {
        id: slug,
        name: `${firstName} ${lastName}`,
        race,
        charClass,
        alignment: pick(ALIGNMENTS),
        level: 1,
        hp: Math.max(1, hp),
        ac,
        stats,
        background: pick(BACKGROUNDS),
        inventory: ['Rations', 'Waterskin', 'Bedroll', 'Torch'],
        persona: `A ${pick(ALIGNMENTS).toLowerCase()} ${race} ${charClass} acting as a ${occupation}. ${firstName} is ${appearance}. Driven to ${motivation}, but hides a dark truth: ${secret}.`,
        motivation,
        secret,
        occupation,
        appearance,
        abilities,
        relationships,
        spriteTags
    };
};
