/**
 * NounSpriteResolver: Maps Extracted Nouns (People, Places, Things) to 2D LPC Sprite Sheets.
 * Uses exact pattern matching against public/assets/lpc/ filenames.
 */

export interface MappedNounSprite {
    name: string;
    type: string;
    spriteUrl: string;
    scale?: [number, number, number];
}

export class NounSpriteResolver {
    private static DEFAULT_MAP: Record<string, string> = {
        // PEOPLE (NPCs / Monsters)
        'drow': '/assets/lpc/LPC Dark Elves/dark_elf.png',
        'beholder': '/assets/lpc/lpc-monsters/beholder.png',
        'bugbear': '/assets/lpc/goblin/goblin_0.png',
        'duergar': '/assets/lpc/darkmale.png',
        'mad mage halaster': '/assets/lpc/lpc_barbarian.png',
        'deekin scalesinger': '/assets/lpc/frogman_1.png',

        // THINGS (Props & Objects)
        'well': '/assets/lpc/lpc-well.png',
        'dagger': '/assets/lpc/long_knife.png',
        'torch-lit cavern': '/assets/lpc/animated_torch.png',
        'strange glyphs': '/assets/lpc/waterfountain.png',
        'cleverly concealed traps': '/assets/lpc/chest_rounded.png',
        'rusted iron rungs': '/assets/lpc/dungeon10.png',
        'stone altar': '/assets/lpc/BasaltColumns.png',
        'iron chest': '/assets/lpc/chest_squared.png'
    };

    public static resolveSprite(nounName: string, nounType: string): MappedNounSprite {
        const key = nounName.toLowerCase().trim();
        let spriteUrl = this.DEFAULT_MAP[key];

        if (!spriteUrl) {
            // Fallback heuristics based on type
            if (nounType === 'monster') {
                spriteUrl = '/assets/lpc/lpc-monsters/beholder.png';
            } else if (nounType === 'npc') {
                spriteUrl = '/assets/lpc/darkmale.png';
            } else if (nounType === 'trap') {
                spriteUrl = '/assets/lpc/chest_rounded.png';
            } else {
                spriteUrl = '/assets/lpc/outside objects.png';
            }
        }

        return {
            name: nounName,
            type: nounType,
            spriteUrl,
            scale: nounType === 'monster' ? [1.8, 1.8, 1] : [1.2, 1.2, 1]
        };
    }
}
