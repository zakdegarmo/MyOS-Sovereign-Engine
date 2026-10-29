/**
 * ManifestationAlgorithm.ts
 * 
 * Logic to convert low-fidelity semantic genomes (LPC) 
 * into deterministic 3D procedural specifications (Heroic Scale).
 */
 
export interface AnimationMapping {
    idle: string;
    walk: string;
    run: string;
}

export interface ProceduralGenome {
    id: string;
    archetype?: string;
    traits?: string[];
    animation: 'idle' | 'walk' | 'run';
    colors: {
        skin: string;
        hair: string;
        primary: string;
        secondary: string;
        accent: string;
    };
    meshes: {
        base: string;
        body: string;
        arms: string;
        legs: string;
        feet: string;
        head: string | null;
    };
    dimensions?: {
        head: [number, number, number];
        torso: [number, number, number];
        pelvis: [number, number, number];
        upperArm: [number, number, number];
        lowerArm: [number, number, number];
        hands: [number, number, number];
        upperLeg: [number, number, number];
        lowerLeg: [number, number, number];
        feet: [number, number, number];
    };
    lineage?: {
        generation: number;
        ancestors: string[];
        inheritedTraits: string[];
    };
    animationMapping?: AnimationMapping;
}

const COLOR_MAP: Record<string, string> = {
    'white': '#ffffff',
    'black': '#222222',
    'brown': '#5d4037',
    'ash': '#b4b4b4',
    'red': '#ff4444',
    'blue': '#00ffff',
    'green': '#44ff44',
    'purple': '#aa00ff',
    'gold': '#ffcc00',
    'teal': '#008080',
    'gray': '#808080',
    'orange': '#ff9800',
    'yellow': '#ffff00',
    'pink': '#e91e63',
    'maroon': '#800000',
    'navy': '#000080',
    'silver': '#c0c0c0',
    'bronze': '#cd7f32',
};

const PILLAR_COLORS: Record<string, string> = {
    'logic': '#00ffff',
    'improvement': '#ff9800',
    'unity': '#4caf50',
    'existence': '#9e9e9e',
    'thought': '#3f51b5',
    'self': '#e91e63',
    'mastery': '#f44336',
    'resonance': '#9c27b0',
    'transcendence': '#ffffff',
    'omni': '#ffeb3b'
};

const parseLpcColor = (assetPath: string, fallback: string): string => {
    if (!assetPath) return fallback;
    const lower = assetPath.toLowerCase();
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
        if (lower.includes(name)) return hex;
    }
    return fallback;
};

// Base Unit = 1.0 for GLTF scale multipliers
const HEROIC_DIMENSIONS = {
    head: [1.0, 1.0, 1.0] as [number, number, number],
    torso: [1.0, 1.0, 1.0] as [number, number, number],
    pelvis: [1.0, 1.0, 1.0] as [number, number, number],
    upperArm: [1.0, 1.0, 1.0] as [number, number, number],
    lowerArm: [1.0, 1.0, 1.0] as [number, number, number],
    hands: [1.0, 1.0, 1.0] as [number, number, number],
    upperLeg: [1.0, 1.0, 1.0] as [number, number, number],
    lowerLeg: [1.0, 1.0, 1.0] as [number, number, number],
    feet: [1.0, 1.0, 1.0] as [number, number, number],
};

import registry from '../models/registry.json';

const resolvePath = (name: string | null, type: keyof typeof registry): string | null => {
    if (!name) return null;
    const found = registry[type].find(path => path.includes(name));
    return found || null;
};

export const generateDeterministic3DSpec = (genome: any, id: string = 'agent'): ProceduralGenome => {
    // 1. Determine Colors and Gender from Genome
    const torsoAsset = genome['torso'] || '';
    const hairAsset = genome['hair'] || '';
    const bodyAsset = genome['body'] || '';
    const legsAsset = genome['legs'] || '';

    const isFemale = bodyAsset.toLowerCase().includes('female');
    const genderPrefix = isFemale ? 'Female' : 'Male';
    
    // Assign class based on ID length or just default to Ranger for now (Peasant is alternative)
    const outfitClass = id.length % 2 === 0 ? 'Ranger' : 'Peasant';

    // Primary color: Priority to Pillar ID, then Torso asset
    let primaryColor = PILLAR_COLORS[id] || parseLpcColor(torsoAsset, '#ffffff');
    let secondaryColor = parseLpcColor(legsAsset, '#222222');
    let hairColor = parseLpcColor(hairAsset, '#333333');

    // Skin color
    let skinColor = '#f1c27d'; // Default
    if (bodyAsset.includes('dark')) skinColor = '#5d4037';
    else if (bodyAsset.includes('tanned')) skinColor = '#d2b48c';
    else if (bodyAsset.includes('pale')) skinColor = '#fff5ee';

    return {
        id,
        archetype: genome.archetype || outfitClass,
        traits: genome.traits || [],
        animation: 'idle',
        colors: {
            skin: genome.colors?.skin || skinColor,
            hair: genome.colors?.hair || hairColor,
            primary: genome.colors?.primary || primaryColor,
            secondary: genome.colors?.secondary || secondaryColor,
            accent: genome.colors?.accent || '#333333'
        },
        meshes: {
            base: resolvePath(`Superhero_${genderPrefix}_FullBody`, 'bases') as string,
            body: resolvePath(`${genderPrefix}_${outfitClass}_Body`, 'bodies') as string,
            arms: resolvePath(`${genderPrefix}_${outfitClass}_Arms`, 'arms') as string,
            legs: resolvePath(`${genderPrefix}_${outfitClass}_Legs`, 'legs') as string,
            feet: resolvePath(outfitClass === 'Ranger' && !isFemale ? `Male_Ranger_Feet_Boots` : `${genderPrefix}_${outfitClass}_Feet`, 'feet') as string,
            head: outfitClass === 'Ranger' ? resolvePath(`${genderPrefix}_Ranger_Head_Hood`, 'heads') : null
        },
        dimensions: genome.dimensions || HEROIC_DIMENSIONS,
        animationMapping: genome.animationMapping
    };
};

export const chainManifest3D = async (genome: any, agentId: string): Promise<ProceduralGenome> => {
    return generateDeterministic3DSpec(genome, agentId);
};
