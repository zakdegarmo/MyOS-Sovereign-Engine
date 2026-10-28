import type { FastCharacter5eSheet } from './FastCharacterRulesEngine';

export interface CombatantState {
    id: string;
    sheet: FastCharacter5eSheet;
    isPlayer: boolean;
    position: [number, number, number];
    currentHp: number;
    maxHp: number;
    ac: number;
    initiativeRoll: number;
    hasActedThisTurn: boolean;
    remainingMovementFeet: number;
}

export interface DiceRollResult {
    d20: number;
    modifier: number;
    total: number;
    isCriticalSuccess: boolean;
    isCriticalFailure: boolean;
    detail: string;
}

export class TacticalEncounterEngine {
    /**
     * Rolls a D20 with optional modifier.
     */
    public static rollD20(modifier: number = 0): DiceRollResult {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const total = d20 + modifier;
        return {
            d20,
            modifier,
            total,
            isCriticalSuccess: d20 === 20,
            isCriticalFailure: d20 === 1,
            detail: `Rolled d20 (${d20}) + ${modifier} = ${total}`
        };
    }

    /**
     * Executes an Ability Check vs Target DC.
     */
    public static rollAbilityCheck(
        sheet: FastCharacter5eSheet,
        stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha',
        dc: number
    ): { success: boolean; roll: DiceRollResult } {
        const score = sheet.abilityScores[stat] || 10;
        const mod = Math.floor((score - 10) / 2);
        const roll = this.rollD20(mod);
        const success = roll.total >= dc || roll.isCriticalSuccess;

        return {
            success,
            roll
        };
    }

    /**
     * Executes a 5e Attack Roll against defender Armor Class.
     */
    public static executeAttack(
        attacker: CombatantState,
        defender: CombatantState
    ): { isHit: boolean; damageDealt: number; roll: DiceRollResult; combatLog: string } {
        const strMod = Math.floor((attacker.sheet.abilityScores.str - 10) / 2);
        const dexMod = Math.floor((attacker.sheet.abilityScores.dex - 10) / 2);
        const attackMod = Math.max(strMod, dexMod) + 3; // +3 Proficiency at Lvl 5

        const roll = this.rollD20(attackMod);
        const isHit = (roll.total >= defender.ac || roll.isCriticalSuccess) && !roll.isCriticalFailure;
        
        let damageDealt = 0;
        let combatLog = '';

        if (isHit) {
            const baseDmg = Math.floor(Math.random() * 8) + 1 + Math.max(strMod, dexMod); // 1d8 + Mod
            damageDealt = roll.isCriticalSuccess ? baseDmg * 2 : baseDmg;
            defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
            combatLog = `💥 ${attacker.sheet.name} hits ${defender.sheet.name} for ${damageDealt} damage! (${defender.currentHp}/${defender.maxHp} HP remaining)`;
        } else {
            combatLog = `🛡️ ${attacker.sheet.name}'s attack missed ${defender.sheet.name} (AC ${defender.ac}).`;
        }

        return {
            isHit,
            damageDealt,
            roll,
            combatLog
        };
    }

    /**
     * Initializes initiative order for all party members and monsters.
     */
    public static rollInitiative(combatants: CombatantState[]): CombatantState[] {
        return combatants
            .map(c => {
                const dexMod = Math.floor((c.sheet.abilityScores.dex - 10) / 2);
                const initRoll = this.rollD20(dexMod);
                return {
                    ...c,
                    initiativeRoll: initRoll.total,
                    hasActedThisTurn: false,
                    remainingMovementFeet: 30
                };
            })
            .sort((a, b) => b.initiativeRoll - a.initiativeRoll);
    }
}
