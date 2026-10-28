// apps/web/src/components/World/filmArchetypes.ts
/**
 * MyOS Sovereign Character Archetypes
 * Handcrafted aesthetic silhouettes and behavioral design profiles.
 * Rejecting generic modular socket lego-blocks in favor of distinctive, expressive character soul.
 */

export interface CharacterArchetype {
    id: string;
    name: string;
    title: string;
    description: string;
    genre: string;
    colorAccent: string;
    emissiveColor: string;
    silhouetteStyle: string;
    blendPath?: string;
    spriteSheetUrl?: string;
    defaultActions: {
        idle: string;
        walk: string;
        run: string;
        actionPrimary: string;
        actionSecondary: string;
        victory: string;
    };
    stageScale: [number, number, number];
    walkSpeed: number;
}

export const FILM_CHARACTER_ARCHETYPES: Record<string, CharacterArchetype> = {
    larry_technician: {
        id: 'larry_technician',
        name: 'Larry',
        title: 'Chief Stage Technician',
        description: 'Working-class retro-tech specialist in tailored slacks, crisp collar, and red tie. Ready to troubleshoot reality with a wrench and clipboard.',
        genre: 'Dieselpunk / Sci-Fi Utility',
        colorAccent: '#38bdf8',
        emissiveColor: '#0284c7',
        silhouetteStyle: 'Sleek modern athletic proportions with sharp collar, rolled cuffs, and tie silhouette.',
        blendPath: 'flesh_larry_technician.blend',
        spriteSheetUrl: '/actions/larry_idle_loop.png',
        defaultActions: {
            idle: 'Fixing_Kneeling',
            walk: 'Walk_Formal_Loop',
            run: 'Sprint_Loop',
            actionPrimary: 'Interact',
            actionSecondary: 'Push_Loop',
            victory: 'Dance_Loop'
        },
        stageScale: [2.5, 2.5, 1],
        walkSpeed: 3.2
    },
    moonlit_mage: {
        id: 'moonlit_mage',
        name: 'Lunaria',
        title: 'Moonlit Arch-Mage',
        description: 'Flowing midnight indigo robes stitched with astral silver runes, adorned with an elegant pointed brimmed hat and glowing focus staff.',
        genre: 'Celestial Dark Fantasy',
        colorAccent: '#a855f7',
        emissiveColor: '#7c3aed',
        silhouetteStyle: 'Wide conical hat silhouette with flowing drapery and vertical staff silhouette.',
        blendPath: 'moonlit_mage_chibi_master.blend',
        spriteSheetUrl: '/actions/chibi_mage_idle_loop.png',
        defaultActions: {
            idle: 'Spell_Simple_Idle_Loop',
            walk: 'Walk_Loop',
            run: 'Jog_Fwd_Loop',
            actionPrimary: 'Spell_Simple_Shoot',
            actionSecondary: 'Spell_Simple_Enter',
            victory: 'Dance_Loop'
        },
        stageScale: [2.4, 2.4, 1],
        walkSpeed: 2.8
    },
    shadow_rogue: {
        id: 'shadow_rogue',
        name: 'Vespera',
        title: 'Shadow Vanguard',
        description: 'Chiaroscuro assassin draped in a midnight leather hooded cowl, wielding twin reverse-grip trench daggers with low stalking predator stance.',
        genre: 'Film Noir / High Octane Rogue',
        colorAccent: '#f43f5e',
        emissiveColor: '#be123c',
        silhouetteStyle: 'Low-profile hooded cowl silhouette with asymmetric blade glints.',
        blendPath: 'shadow_rogue_chibi_master.blend',
        spriteSheetUrl: '/actions/shadow_rogue_idle_loop.png',
        defaultActions: {
            idle: 'Crouch_Idle_Loop',
            walk: 'Crouch_Fwd_Loop',
            run: 'Sprint_Loop',
            actionPrimary: 'Melee_Weapon_Attack',
            actionSecondary: 'Roll',
            victory: 'Dance_Loop'
        },
        stageScale: [2.3, 2.3, 1],
        walkSpeed: 3.8
    },
    sunlit_paladin: {
        id: 'sunlit_paladin',
        name: 'Solas',
        title: 'Sunlit Templar',
        description: 'Heavy plate armor etched with solar rays, bearing a towering sunburst kite shield and tempered longsword with unwavering righteous poise.',
        genre: 'High Fantasy / Heroic Epic',
        colorAccent: '#fbbf24',
        emissiveColor: '#d97706',
        silhouetteStyle: 'Broad armored shoulders, wide kite shield silhouette, and noble upright spine.',
        blendPath: 'sunlit_paladin_chibi_master.blend',
        spriteSheetUrl: '/actions/chibi_paladin_idle_loop.png',
        defaultActions: {
            idle: 'Melee_Weapon_Idle',
            walk: 'Walk_Formal_Loop',
            run: 'Jog_Fwd_Loop',
            actionPrimary: 'Punch_Cross',
            actionSecondary: 'Melee_Weapon_Attack',
            victory: 'Dance_Loop'
        },
        stageScale: [2.6, 2.6, 1],
        walkSpeed: 2.6
    },
    flesh_mannequin: {
        id: 'flesh_mannequin',
        name: 'Proto',
        title: 'Decivoxel Flesh Mannequin',
        description: 'The iconic untextured comic hero mannequin from flesh_base_comic.blend, serving as the pure choreographic stunt performer for raw motion capture.',
        genre: 'Action Stunt / Master Prototype',
        colorAccent: '#34d399',
        emissiveColor: '#059669',
        silhouetteStyle: 'Clean anatomical decivoxel silhouette with expressive comic face decals.',
        blendPath: 'flesh_base_comic.blend',
        spriteSheetUrl: '/actions/flesh_base_mannequin_idle_loop.png',
        defaultActions: {
            idle: 'Idle_Loop',
            walk: 'Walk_Loop',
            run: 'Sprint_Loop',
            actionPrimary: 'Punch_Jab',
            actionSecondary: 'Jump_Loop',
            victory: 'Dance_Loop'
        },
        stageScale: [2.5, 2.5, 1],
        walkSpeed: 3.0
    }
};

export default FILM_CHARACTER_ARCHETYPES;
