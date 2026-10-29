/**
 * DnDEquipmentCompositor.ts
 * 
 * Maps D&D 5e Character Creation choices (Race, Class Starter Kits, Regional Styles, Individual Item Slots)
 * to exact, verified, color-matched LPC spritesheet layer filenames and 3D GLB model specifications.
 */

export type DnDSpecies = 
    | 'Human' 
    | 'HighElf' 
    | 'WoodElf' 
    | 'Drow' 
    | 'MountainDwarf' 
    | 'Halfling' 
    | 'Tiefling' 
    | 'Dragonborn' 
    | 'HalfOrc' 
    | 'Goblin' 
    | 'Lizardfolk'
    | 'Gnome'
    | 'Aasimar';

export type DnDClass = 
    | 'Fighter' 
    | 'Wizard' 
    | 'Rogue' 
    | 'Cleric' 
    | 'Paladin' 
    | 'Barbarian' 
    | 'Ranger' 
    | 'Bard' 
    | 'Sorcerer' 
    | 'Warlock' 
    | 'Druid' 
    | 'Monk';

export type DnDArmorType = 'None' | 'Padded' | 'Leather' | 'StuddedLeather' | 'ChainMail' | 'SplintMail' | 'PlateMail' | 'WizardRobes' | 'BarbarianHarness';
export type DnDWeapon = 'Unarmed' | 'Longsword' | 'Greatsword' | 'Dagger' | 'ArcaneStaff' | 'Longbow' | 'Battleaxe' | 'Warhammer' | 'Rapier' | 'DualDaggers';
export type DnDShield = 'None' | 'KiteShield' | 'RoundBuckler' | 'TowerShield' | 'SpellTome';
export type DnDRegion = 'None' | 'Waterdeep' | 'Underdark' | 'Rashemen' | 'Thay' | 'Calimshan' | 'IcewindDale';

export interface DnDSpeciesMeta {
    id: DnDSpecies;
    name: string;
    description: string;
    traits: string[];
    abilityBonus: string;
    icon: string;
    color: string;
    model3D?: string;
}

export interface DnDClassMeta {
    id: DnDClass;
    name: string;
    role: string;
    description: string;
    hitDie: string;
    primaryStat: string;
    icon: string;
    color: string;
    starterArmor: DnDArmorType;
    starterWeapon: DnDWeapon;
    starterOffhand: DnDShield;
    starterHead?: string;
    starterShoulders?: string;
    starterTorso?: string;
    starterLegs?: string;
    starterBoots?: string;
}

export interface DnDRegionMeta {
    id: DnDRegion;
    name: string;
    tagline: string;
    cloak: string;
    tunic: string;
    accentColor: string;
    icon: string;
}

export const DND_SPECIES_LIST: DnDSpeciesMeta[] = [
    { id: 'Human', name: 'Human', description: 'Versatile and ambitious champions of any domain.', traits: ['Extra Skill', 'Adaptability'], abilityBonus: '+1 All Abilities', icon: '🧑', color: '#ffcc88', model3D: 'mannequin/human_mannequin_native_bald.glb' },
    { id: 'HighElf', name: 'High Elf', description: 'Graceful spellweavers with keen senses and arcane mastery.', traits: ['Darkvision', 'Fey Ancestry', 'Cantrip'], abilityBonus: '+2 Dex, +1 Int', icon: '🧝‍♀️', color: '#88ddff' },
    { id: 'WoodElf', name: 'Wood Elf', description: 'Swift hunters aligned with the primeval wilderness.', traits: ['Fleet of Foot', 'Mask of the Wild'], abilityBonus: '+2 Dex, +1 Wis', icon: '🏹', color: '#88ee88' },
    { id: 'Drow', name: 'Drow (Dark Elf)', description: 'Subterranean elves wielding shadow magic and obsidian skin.', traits: ['Superior Darkvision', 'Drow Magic'], abilityBonus: '+2 Dex, +1 Cha', icon: '🌑', color: '#aa88ff' },
    { id: 'MountainDwarf', name: 'Mountain Dwarf', description: 'Stout, armored warriors trained in mountain keeps.', traits: ['Dwarven Resilience', 'Dwarven Armor Training'], abilityBonus: '+2 Str, +2 Con', icon: '🧔', color: '#ff9944' },
    { id: 'Halfling', name: 'Halfling', description: 'Small and surprisingly lucky wanderers.', traits: ['Lucky', 'Brave', 'Nimble'], abilityBonus: '+2 Dex', icon: '👣', color: '#eebb44' },
    { id: 'Tiefling', name: 'Tiefling', description: 'Bearers of infernal heritage with fiery magical sparks.', traits: ['Hellish Resistance', 'Infernal Legacy'], abilityBonus: '+2 Cha, +1 Int', icon: '😈', color: '#ff4466' },
    { id: 'Dragonborn', name: 'Dragonborn', description: 'Proud draconic warriors exhaling elemental breath.', traits: ['Breath Weapon', 'Draconic Damage Resistance'], abilityBonus: '+2 Str, +1 Cha', icon: '🐲', color: '#eeaa33' },
    { id: 'HalfOrc', name: 'Half-Orc', description: 'Fierce combatants driven by primal strength and endurance.', traits: ['Relentless Endurance', 'Savage Attacks'], abilityBonus: '+2 Str, +1 Con', icon: '👹', color: '#66bb66' },
    { id: 'Goblin', name: 'Goblin', description: 'Cunning skirmishers mastering nimble escapes.', traits: ['Nimble Escape', 'Fury of the Small'], abilityBonus: '+2 Dex, +1 Con', icon: '👺', color: '#44aa55' },
    { id: 'Lizardfolk', name: 'Lizardfolk', description: 'Cold-blooded survivalists with natural armor.', traits: ['Natural Armor', 'Hungry Jaws'], abilityBonus: '+2 Con, +1 Wis', icon: '🦎', color: '#33cc99' },
    { id: 'Gnome', name: 'Gnome', description: 'Inquisitive inventors and illusion masters.', traits: ['Gnome Cunning', 'Artificer Lore'], abilityBonus: '+2 Int, +1 Dex', icon: '🔮', color: '#dd66ff' },
    { id: 'Aasimar', name: 'Aasimar', description: 'Mortals bearing the celestial spark of the upper planes.', traits: ['Celestial Resistance', 'Healing Hands', 'Light Bearer'], abilityBonus: '+2 Cha, +1 Wis', icon: '✨', color: '#ffee66' },
];

export const DND_CLASS_LIST: DnDClassMeta[] = [
    { 
        id: 'Fighter', name: 'Fighter', role: 'Martial Master', 
        description: 'Master of martial combat, skilled with diverse weapons and heavy armor.', 
        hitDie: 'd10', primaryStat: 'Strength or Dex', icon: '⚔️', color: '#cc3333',
        starterArmor: 'ChainMail', starterWeapon: 'Greatsword', starterOffhand: 'None',
        starterTorso: 'torso_armour_plate_male_iron.png', starterLegs: 'legs_armour_plate_male_iron.png', starterBoots: 'feet_armour_plate_male_iron.png'
    },
    { 
        id: 'Wizard', name: 'Wizard', role: 'Arcane Scholar', 
        description: 'Scholarly magic-user wielding devastating elemental and spatial spells.', 
        hitDie: 'd6', primaryStat: 'Intelligence', icon: '🪄', color: '#3388ff',
        starterArmor: 'WizardRobes', starterWeapon: 'ArcaneStaff', starterOffhand: 'SpellTome',
        starterTorso: 'torso_aprons_apron_full_female_maroon.png', starterLegs: 'legs_cuffed_male_black.png', starterBoots: 'feet_boots_male_brown.png', starterHead: 'hat_cowl_black.png'
    },
    { 
        id: 'Rogue', name: 'Rogue', role: 'Shadow Skirmisher', 
        description: 'Stealthy opportunist unleashing deadly sneak attacks from behind.', 
        hitDie: 'd8', primaryStat: 'Dexterity', icon: '🗡️', color: '#888899',
        starterArmor: 'Leather', starterWeapon: 'DualDaggers', starterOffhand: 'None',
        starterTorso: 'torso_armour_leather_male_brown.png', starterLegs: 'legs_cuffed_male_black.png', starterBoots: 'feet_boots_male_brown.png', starterShoulders: 'shoulders_cape_short_black.png'
    },
    { 
        id: 'Cleric', name: 'Cleric', role: 'Divine Champion', 
        description: 'Priest of divine magic, wielding holy wrath and radiant healing.', 
        hitDie: 'd8', primaryStat: 'Wisdom', icon: '✝️', color: '#ffbb33',
        starterArmor: 'ChainMail', starterWeapon: 'Warhammer', starterOffhand: 'KiteShield',
        starterTorso: 'torso_armour_plate_male_iron.png', starterLegs: 'legs_cuffed_male_black.png', starterBoots: 'feet_armour_plate_male_iron.png'
    },
    { 
        id: 'Paladin', name: 'Paladin', role: 'Holy Avenger', 
        description: 'Holy warrior bound by a sacred oath to smite evil and champion good.', 
        hitDie: 'd10', primaryStat: 'Str & Cha', icon: '🛡️', color: '#ffdd44',
        starterArmor: 'PlateMail', starterWeapon: 'Longsword', starterOffhand: 'KiteShield',
        starterTorso: 'torso_armour_plate_male_steel.png', starterLegs: 'legs_armour_plate_male_steel.png', starterBoots: 'feet_armour_plate_male_steel.png'
    },
    { 
        id: 'Barbarian', name: 'Barbarian', role: 'Primal Berserker', 
        description: 'Fierce warrior of primal rage who thrives in unarmored combat.', 
        hitDie: 'd12', primaryStat: 'Strength', icon: '🪓', color: '#dd5522',
        starterArmor: 'BarbarianHarness', starterWeapon: 'Battleaxe', starterOffhand: 'None',
        starterTorso: 'none', starterLegs: 'legs_pants_male_brown.png', starterBoots: 'feet_boots_male_brown.png'
    },
    { 
        id: 'Ranger', name: 'Ranger', role: 'Wilderness Tracker', 
        description: 'Deadly marksman and tracker guarding the boundaries of civilization.', 
        hitDie: 'd10', primaryStat: 'Dex & Wis', icon: '🏹', color: '#44aa44',
        starterArmor: 'StuddedLeather', starterWeapon: 'Longbow', starterOffhand: 'None',
        starterTorso: 'torso_armour_leather_male_brown.png', starterLegs: 'legs_pants_male_green.png', starterBoots: 'feet_boots_male_brown.png', starterShoulders: 'shoulders_cape_short_green.png'
    },
    { 
        id: 'Bard', name: 'Bard', role: 'Inspiring Virtuoso', 
        description: 'Charismatic weaver of song, lore, and illusion magic.', 
        hitDie: 'd8', primaryStat: 'Charisma', icon: '🪕', color: '#ff66aa',
        starterArmor: 'Leather', starterWeapon: 'Rapier', starterOffhand: 'None',
        starterTorso: 'torso_shirts_shirt_male_white.png', starterLegs: 'legs_pants_male_teal.png', starterBoots: 'feet_shoes_male_brown.png', starterHead: 'hat_feather_purple.png'
    },
    { 
        id: 'Sorcerer', name: 'Sorcerer', role: 'Innate Conduit', 
        description: 'Spellcaster drawing upon innate magical bloodlines.', 
        hitDie: 'd6', primaryStat: 'Charisma', icon: '🔮', color: '#aa44ff',
        starterArmor: 'None', starterWeapon: 'ArcaneStaff', starterOffhand: 'None',
        starterTorso: 'torso_tunics_tunic_male_purple.png', starterLegs: 'legs_cuffed_male_black.png', starterBoots: 'feet_boots_male_brown.png'
    },
    { 
        id: 'Warlock', name: 'Warlock', role: 'Eldritch Pact-Binder', 
        description: 'Wielder of arcane secrets bestowed by an otherworldly patron.', 
        hitDie: 'd8', primaryStat: 'Charisma', icon: '👁️', color: '#7733bb',
        starterArmor: 'Leather', starterWeapon: 'Dagger', starterOffhand: 'SpellTome',
        starterTorso: 'torso_armour_leather_male_black.png', starterLegs: 'legs_cuffed_male_black.png', starterBoots: 'feet_boots_male_black.png', starterShoulders: 'shoulders_cape_short_purple.png'
    },
    { 
        id: 'Druid', name: 'Druid', role: 'Nature Shaper', 
        description: 'Priest of the Old Faith, taking beast forms and casting wild magic.', 
        hitDie: 'd8', primaryStat: 'Wisdom', icon: '🌿', color: '#22aa77',
        starterArmor: 'Leather', starterWeapon: 'ArcaneStaff', starterOffhand: 'RoundBuckler',
        starterTorso: 'torso_armour_leather_male_brown.png', starterLegs: 'legs_pants_male_brown.png', starterBoots: 'feet_boots_male_brown.png'
    },
    { 
        id: 'Monk', name: 'Monk', role: 'Ki Martial Artist', 
        description: 'Unarmed master of body and ki energy.', 
        hitDie: 'd8', primaryStat: 'Dex & Wis', icon: '🥋', color: '#ff8833',
        starterArmor: 'None', starterWeapon: 'Unarmed', starterOffhand: 'None',
        starterTorso: 'torso_shirts_shirt_male_white.png', starterLegs: 'legs_pants_male_black.png', starterBoots: 'feet_shoes_male_brown.png'
    },
];

export const DND_REGIONS: DnDRegionMeta[] = [
    { id: 'None', name: 'Standard Adventurer', tagline: 'Unaligned wandering sellsword', cloak: 'none', tunic: 'standard', accentColor: '#ffffff', icon: '🗺️' },
    { id: 'Waterdeep', name: 'Waterdhavian Noble', tagline: 'Opulent silk cape & fine gilded embroidery', cloak: 'shoulders_cape_long_blue.png', tunic: 'torso_shirts_shirt_male_white.png', accentColor: '#3388ff', icon: '👑' },
    { id: 'Underdark', name: 'Menzoberranzan Shadow', tagline: 'Spider-silk piwafwi & stealth cowl', cloak: 'shoulders_cape_short_purple.png', tunic: 'torso_armour_leather_male_black.png', accentColor: '#aa44ff', icon: '🕷️' },
    { id: 'Rashemen', name: 'Rashemi Berserker', tagline: 'Heavy winter pelt mantle & iron clasps', cloak: 'shoulders_fur_brown.png', tunic: 'torso_armour_leather_male_brown.png', accentColor: '#cc5522', icon: '🐺' },
    { id: 'Thay', name: 'Red Wizard of Thay', tagline: 'Crimson ceremonial vestments', cloak: 'shoulders_cape_long_red.png', tunic: 'torso_aprons_apron_full_female_maroon.png', accentColor: '#ff2244', icon: '🔥' },
    { id: 'Calimshan', name: 'Calimshan Merchant', tagline: 'Flowing desert sash & lightweight linen', cloak: 'shoulders_cape_short_gold.png', tunic: 'torso_tunics_tunic_male_yellow.png', accentColor: '#eebb22', icon: '🏜️' },
    { id: 'IcewindDale', name: 'Ten-Towns Nomad', tagline: 'Frost-insulated wolf pelt & thick sealskin boots', cloak: 'shoulders_fur_white.png', tunic: 'torso_armour_leather_male_brown.png', accentColor: '#88ddff', icon: '❄️' },
];

export interface DnDCharacterConcept {
    name: string;
    species: DnDSpecies;
    characterClass: DnDClass;
    gender: 'male' | 'female';
    region: DnDRegion;
    armor: DnDArmorType;
    primaryWeapon: DnDWeapon;
    offhandWeapon: DnDShield;
    headwear?: string;
    hairStyle?: string;
    facialHairStyle?: string;
    shoulders?: string;
    customTorso?: string;
    customLegs?: string;
    customBoots?: string;
}

export interface LPCGenome {
    body: string;
    head?: string;
    ears?: string;
    torso?: string;
    legs?: string;
    feet?: string;
    hair?: string;
    facial?: string;
    hat?: string;
    shoulders?: string;
    weapon?: string;
    offhand?: string;
}

export class DnDEquipmentCompositor {
    public static composeGenome(concept: DnDCharacterConcept): LPCGenome {
        const isFemale = concept.gender === 'female';
        const genderKey = isFemale ? 'female' : 'male';
        
        // 1. Resolve Species Anatomical Naked Base
        const genome: LPCGenome = {
            body: isFemale ? 'body_bodies_female.png' : 'body_bodies_male.png',
            head: isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male.png',
            hair: concept.hairStyle || 'adult_universal_hair_shortknot.png',
            facial: concept.facialHairStyle || 'none',
            hat: concept.headwear || 'none',
            shoulders: concept.shoulders || 'none',
            feet: `feet_boots_${genderKey}_brown.png`,
            legs: `legs_cuffed_${genderKey}_black.png`,
            torso: 'none'
        };

        switch (concept.species) {
            case 'Drow':
                genome.body = isFemale ? 'body_bodies_female_lavender.png' : 'body_bodies_male_lavender.png';
                genome.head = isFemale ? 'head_heads_human_female_elderly_lavender.png' : 'head_heads_human_male_gaunt_lavender.png';
                genome.ears = 'head_ears_elven_adult_lavender.png';
                genome.hair = concept.hairStyle || 'adult_universal_hair_longknot.png';
                break;
            case 'HighElf':
                genome.body = isFemale ? 'body_bodies_female_light.png' : 'body_bodies_male_light.png';
                genome.head = isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male_gaunt_light.png';
                genome.ears = 'head_ears_elven_adult_brown.png';
                genome.hair = concept.hairStyle || 'adult_universal_hair_longknot.png';
                break;
            case 'WoodElf':
                genome.body = isFemale ? 'body_bodies_female_amber.png' : 'body_bodies_male_amber.png';
                genome.head = isFemale ? 'head_heads_human_female_small_brown.png' : 'head_heads_human_male_amber.png';
                genome.ears = 'head_ears_elven_adult_brown.png';
                genome.hair = concept.hairStyle || 'adult_universal_hair_messy.png';
                break;
            case 'MountainDwarf':
                genome.body = 'body_bodies_muscular.png';
                genome.head = 'head_heads_human_male_amber.png';
                genome.facial = concept.facialHairStyle || 'brunettemustache_0.png';
                break;
            case 'Tiefling':
                genome.body = isFemale ? 'body_bodies_female_amber.png' : 'body_bodies_male_amber.png';
                genome.head = isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male_amber.png';
                genome.ears = 'head_ears_dragon_adult_dark_green.png';
                genome.hair = concept.hairStyle || 'adult_universal_side_swoop.png';
                break;
            case 'Dragonborn':
                genome.body = 'body_bodies_muscular_bronze.png';
                genome.head = isFemale ? 'head_heads_lizard_female_black.png' : 'head_heads_lizard_male_fur_gold.png';
                genome.ears = 'head_ears_dragon_adult_dark_green.png';
                genome.hair = 'none';
                break;
            case 'HalfOrc':
                genome.body = 'body_bodies_muscular_dark_green.png';
                genome.head = isFemale ? 'head_heads_orc_female.png' : 'head_heads_orc_male_pale_green.png';
                genome.ears = 'head_ears_big_adult_light.png';
                genome.hair = 'none';
                break;
            case 'Goblin':
                genome.body = 'body_bodies_male_bright_green.png';
                genome.head = isFemale ? 'head_heads_goblin_adult_olive.png' : 'head_heads_goblin_adult_green.png';
                genome.ears = 'head_ears_big_adult_light.png';
                genome.hair = 'none';
                break;
            case 'Lizardfolk':
                genome.body = 'body_bodies_muscular_green.png';
                genome.head = isFemale ? 'head_heads_lizard_female_bright_green.png' : 'head_heads_lizard_male_fur_tan.png';
                genome.hair = 'none';
                break;
            case 'Gnome':
            case 'Halfling':
                genome.body = 'body_bodies_teen.png';
                genome.head = isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male_small_green.png';
                break;
            case 'Aasimar':
                genome.body = isFemale ? 'body_bodies_female_light.png' : 'body_bodies_male_light.png';
                genome.head = isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male.png';
                genome.hair = concept.hairStyle || 'adult_universal_hair_longknot.png';
                break;
            default:
                genome.body = isFemale ? 'body_bodies_female.png' : 'body_bodies_male.png';
                genome.head = isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male.png';
                genome.hair = concept.hairStyle || 'adult_universal_hair_shortknot.png';
                break;
        }

        // 2. Armor & Apparel Modular Slots
        if (concept.customTorso) {
            genome.torso = concept.customTorso;
        } else {
            switch (concept.armor) {
                case 'PlateMail':
                case 'SplintMail':
                    genome.torso = `torso_armour_plate_${genderKey}_steel.png`;
                    genome.legs = `legs_armour_plate_${genderKey}_steel.png`;
                    genome.feet = `feet_armour_plate_${genderKey}_steel.png`;
                    break;
                case 'ChainMail':
                    genome.torso = `torso_armour_plate_${genderKey}_iron.png`;
                    genome.legs = `legs_armour_plate_${genderKey}_iron.png`;
                    genome.feet = `feet_armour_plate_${genderKey}_iron.png`;
                    break;
                case 'StuddedLeather':
                case 'Leather':
                case 'Padded':
                    genome.torso = `torso_armour_leather_${genderKey}_brown.png`;
                    genome.legs = `legs_cuffed_${genderKey}_black.png`;
                    genome.feet = `feet_boots_${genderKey}_brown.png`;
                    break;
                case 'WizardRobes':
                    genome.torso = `torso_aprons_apron_full_female_maroon.png`;
                    genome.legs = `legs_cuffed_${genderKey}_black.png`;
                    genome.feet = `feet_boots_${genderKey}_brown.png`;
                    break;
                case 'BarbarianHarness':
                    genome.torso = 'none';
                    genome.legs = `legs_pants_${genderKey}_brown.png`;
                    genome.feet = `feet_boots_${genderKey}_brown.png`;
                    break;
                default:
                    genome.torso = 'none';
                    genome.legs = `legs_cuffed_${genderKey}_black.png`;
                    genome.feet = `feet_boots_${genderKey}_brown.png`;
                    break;
            }
        }

        if (concept.customLegs) genome.legs = concept.customLegs;
        if (concept.customBoots) genome.feet = concept.customBoots;

        // 3. Regional Style Overrides / Accents
        const regionMeta = DND_REGIONS.find(r => r.id === concept.region);
        if (regionMeta && regionMeta.id !== 'None') {
            if (regionMeta.cloak !== 'none' && !concept.shoulders) {
                genome.shoulders = regionMeta.cloak;
            }
        }

        // 4. Weapons & Offhand Shields
        switch (concept.primaryWeapon) {
            case 'Greatsword':
            case 'Longsword':
                genome.weapon = 'weapon_magic_diamond_universal_foreground_steel.png';
                break;
            case 'Warhammer':
                genome.weapon = 'animate_axe_0.png';
                break;
            case 'ArcaneStaff':
                genome.weapon = 'weapon_magic_crystal_universal_foreground_blue.png';
                break;
            case 'Longbow':
                genome.weapon = 'weapon_magic_gnarled_universal_foreground_steel.png';
                break;
            case 'Dagger':
            case 'Rapier':
                genome.weapon = 'weapon_magic_diamond_off_universal_foreground_steel.png';
                break;
            case 'DualDaggers':
                genome.weapon = 'weapon_magic_diamond_off_universal_foreground_steel.png';
                genome.offhand = 'weapon_magic_diamond_off_universal_foreground_steel.png';
                break;
            case 'Battleaxe':
                genome.weapon = 'animate_axe_0.png';
                break;
            default:
                genome.weapon = 'none';
                break;
        }

        if (concept.offhandWeapon === 'KiteShield' || concept.offhandWeapon === 'RoundBuckler' || concept.offhandWeapon === 'TowerShield') {
            genome.offhand = 'animate_kite_shield.png';
        } else if (concept.offhandWeapon === 'SpellTome') {
            genome.offhand = 'weapon_magic_crystal_universal_foreground_blue.png';
        }

        return genome;
    }
}
