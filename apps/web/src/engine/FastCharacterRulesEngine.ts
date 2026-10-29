/**
 * FastCharacterRulesEngine.ts
 * 
 * Powered by FastCharacter.com 5e rulesets.
 * Integrates 5e statblock generation, equipment cards, and 2D LPC Billboarded Sprite compositing.
 */

import { DnDEquipmentCompositor, type DnDCharacterConcept, type LPCGenome } from './DnDEquipmentCompositor';

export interface FastCharacter5eSheet {
    name: string;
    species: string;
    characterClass: string;
    background: string;
    level: number;
    hp: { current: number; max: number };
    ac: number;
    initiative: number;
    speed: string;
    abilityScores: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    skills: string[];
    equipmentCards: string[];
    spriteGenome: LPCGenome;
}

export class FastCharacterRulesEngine {
    public static generateCharacter(concept: DnDCharacterConcept): FastCharacter5eSheet {
        // Base Ability Scores based on Class priorities
        const baseScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
        
        switch (concept.characterClass) {
            case 'Fighter':
            case 'Paladin':
                baseScores.str = 16; baseScores.con = 14; baseScores.dex = 12;
                break;
            case 'Wizard':
                baseScores.int = 16; baseScores.con = 14; baseScores.dex = 13;
                break;
            case 'Rogue':
                baseScores.dex = 16; baseScores.cha = 14; baseScores.con = 12;
                break;
            case 'Cleric':
                baseScores.wis = 16; baseScores.str = 14; baseScores.con = 12;
                break;
            default:
                baseScores.str = 14; baseScores.dex = 14; baseScores.con = 14;
                break;
        }

        // AC calculation based on Armor Selection
        let baseAC = 10 + Math.floor((baseScores.dex - 10) / 2);
        if (concept.armor === 'PlateMail') baseAC = 18;
        else if (concept.armor === 'ChainMail') baseAC = 16;
        else if (concept.armor === 'Leather') baseAC = 12 + Math.floor((baseScores.dex - 10) / 2);
        else if (concept.armor === 'WizardRobes') baseAC = 11 + Math.floor((baseScores.dex - 10) / 2);

        // Synthesize 2D LPC Billboarded Sprite Genome
        const spriteGenome = DnDEquipmentCompositor.composeGenome(concept);

        return {
            name: concept.name || 'Hero of Waterdeep',
            species: concept.species,
            characterClass: concept.characterClass,
            background: 'Folk Hero',
            level: 5,
            hp: { current: 38 + baseScores.con, max: 38 + baseScores.con },
            ac: baseAC,
            initiative: Math.floor((baseScores.dex - 10) / 2),
            speed: concept.species === 'Dwarf' || concept.species === 'Halfling' ? '25ft' : '30ft',
            abilityScores: baseScores,
            skills: ['Athletics', 'Perception', 'Insight'],
            equipmentCards: ['Plate Armor', 'Greatsword', 'Potion of Healing'],
            spriteGenome
        };
    }
}
