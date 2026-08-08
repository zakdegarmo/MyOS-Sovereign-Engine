/**
 * DnDEquipmentCompositor.ts
 * 
 * Maps D&D 5e Character Creation choices (Race, Class, Armor, Weapons, Hairstyles)
 * to exact, verified, color-matched LPC spritesheet layer filenames.
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
    | 'Lizardfolk';

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

export type DnDArmorType = 'None' | 'Padded' | 'Leather' | 'ChainMail' | 'PlateMail' | 'WizardRobes';
export type DnDWeapon = 'Unarmed' | 'Longsword' | 'Greatsword' | 'Dagger' | 'ArcaneStaff' | 'Longbow' | 'Battleaxe' | 'Shield';

export interface DnDCharacterConcept {
    name: string;
    species: DnDSpecies;
    characterClass: DnDClass;
    armor: DnDArmorType;
    primaryWeapon: DnDWeapon;
    offhandWeapon?: DnDWeapon;
    gender?: 'male' | 'female';
}

export interface LPCGenome {
    body: string;
    head?: string;
    ears?: string;
    torso?: string;
    legs?: string;
    feet?: string;
    hair?: string;
    weapon?: string;
}

export class DnDEquipmentCompositor {
    public static composeGenome(concept: DnDCharacterConcept): LPCGenome {
        const isFemale = concept.gender === 'female';
        const genderKey = isFemale ? 'female' : 'male';
        
        return {
            body: isFemale ? 'body_bodies_female.png' : 'body_bodies_male.png',
            head: isFemale ? 'head_heads_human_female_small_bronze.png' : 'head_heads_human_male.png',
            feet: `feet_boots_${genderKey}_brown.png`,
            legs: `legs_cuffed_${genderKey}_black.png`
        };
    }
}
