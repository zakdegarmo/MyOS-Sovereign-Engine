/** @version 1.1.0-Omni @timestamp 2026-04-06 18:45 @author Antigravity-Omni */

export interface Thing {
    id: string;
    type: 'tree' | 'rock' | 'building' | 'altar' | 'item';
    spriteUrl: string;
    scale: number;
    heightOffset: number;
    isPassable: boolean;
    metadata: Record<string, any>;
}

/**
 * ThingLibrary
 * -------------------
 * The central registry for all "Things and Stuff" that populate the Gaia wilderness.
 */
export const THING_PRESETS: Record<string, Thing> = {
    'pine_tree': {
        id: 'pine_tree',
        type: 'tree',
        spriteUrl: '/assets/world/pine_tree.png',
        scale: 4.5,
        heightOffset: 2.2,
        isPassable: false,
        metadata: { biome: 'forest' }
    },
    'gray_rock': {
        id: 'gray_rock',
        type: 'rock',
        spriteUrl: '/assets/world/rock_gray.png',
        scale: 2.0,
        heightOffset: 0.8,
        isPassable: false,
        metadata: { biome: 'mountain' }
    },
    'ancient_altar': {
        id: 'ancient_altar',
        type: 'altar',
        spriteUrl: '/assets/world/altar_stone.png',
        scale: 3.5,
        heightOffset: 1.5,
        isPassable: false,
        metadata: { interactive: true }
    },
    'red_flower': {
        id: 'red_flower',
        type: 'item',
        spriteUrl: '/assets/world/flower_red.png',
        scale: 1.2,
        heightOffset: 0.5,
        isPassable: true,
        metadata: { collectable: true }
    }
};

export class ThingLibrary {
    public getThing(id: string): Thing | undefined {
        return THING_PRESETS[id];
    }

    public getRandomThingForBiome(biome: string): Thing {
        const matching = Object.values(THING_PRESETS).filter(t => t.metadata.biome === biome || !t.metadata.biome);
        return matching[Math.floor(Math.random() * matching.length)];
    }
}

export const thingLibrary = new ThingLibrary();
