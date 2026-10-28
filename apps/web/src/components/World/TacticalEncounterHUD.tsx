import React, { useState } from 'react';
import { TacticalEncounterEngine } from '../../engine/TacticalEncounterEngine';
import type { CombatantState, DiceRollResult } from '../../engine/TacticalEncounterEngine';
import { FastCharacterRulesEngine } from '../../engine/FastCharacterRulesEngine';

interface TacticalEncounterHUDProps {
    isActive: boolean;
    onClose?: () => void;
}

export const TacticalEncounterHUD: React.FC<TacticalEncounterHUDProps> = ({ isActive, onClose }) => {
    const [combatants, setCombatants] = useState<CombatantState[]>(() => {
        const p1 = FastCharacterRulesEngine.generateCharacter({ name: 'Thorin Ironshield', species: 'Dwarf', characterClass: 'Fighter', gender: 'Male', armor: 'PlateMail', weapon: 'Greatsword' });
        const p2 = FastCharacterRulesEngine.generateCharacter({ name: 'Lyra Shadowstep', species: 'Elf', characterClass: 'Rogue', gender: 'Female', armor: 'Leather', weapon: 'Bow' });
        const p3 = FastCharacterRulesEngine.generateCharacter({ name: 'Eldrin Starweaver', species: 'Human', characterClass: 'Wizard', gender: 'Male', armor: 'WizardRobes', weapon: 'Staff' });
        const mob = FastCharacterRulesEngine.generateCharacter({ name: 'Undermountain Bugbear', species: 'Goblinoid', characterClass: 'Fighter', gender: 'Male', armor: 'ChainMail', weapon: 'Greatsword' });

        const rawList: CombatantState[] = [
            { id: 'player', sheet: p1, isPlayer: true, position: [0, 0, 0], currentHp: 44, maxHp: 44, ac: 18, initiativeRoll: 0, hasActedThisTurn: false, remainingMovementFeet: 30 },
            { id: 'party_rogue', sheet: p2, isPlayer: false, position: [3, 0, -2], currentHp: 32, maxHp: 32, ac: 15, initiativeRoll: 0, hasActedThisTurn: false, remainingMovementFeet: 30 },
            { id: 'party_wizard', sheet: p3, isPlayer: false, position: [-3, 0, -2], currentHp: 26, maxHp: 26, ac: 13, initiativeRoll: 0, hasActedThisTurn: false, remainingMovementFeet: 30 },
            { id: 'monster_bugbear', sheet: mob, isPlayer: false, position: [0, 0, 10], currentHp: 50, maxHp: 50, ac: 16, initiativeRoll: 0, hasActedThisTurn: false, remainingMovementFeet: 30 }
        ];

        return TacticalEncounterEngine.rollInitiative(rawList);
    });

    const [activeTurnIndex, setActiveTurnIndex] = useState(0);
    const [combatLogs, setCombatLogs] = useState<string[]>([
        '⚔️ Encounter initiated! Roll initiative!',
        '🎲 Initiative Order set. Fight for the Realm!'
    ]);
    const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);

    if (!isActive) return null;

    const currentCombatant = combatants[activeTurnIndex] || combatants[0];

    const handleAttack = () => {
        const target = combatants.find(c => c.id === 'monster_bugbear') || combatants[1];
        const res = TacticalEncounterEngine.executeAttack(currentCombatant, target);
        
        setLastRoll(res.roll);
        setCombatLogs(prev => [res.combatLog, ...prev.slice(0, 8)]);
        setCombatants([...combatants]);
    };

    const handleAbilityCheck = (stat: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha') => {
        const res = TacticalEncounterEngine.rollAbilityCheck(currentCombatant.sheet, stat, 15);
        setLastRoll(res.roll);
        const logMsg = res.success 
            ? `✨ ${currentCombatant.sheet.name} PASSED DC 15 ${stat.toUpperCase()} Check! (${res.roll.detail})`
            : `❌ ${currentCombatant.sheet.name} FAILED DC 15 ${stat.toUpperCase()} Check! (${res.roll.detail})`;
        setCombatLogs(prev => [logMsg, ...prev.slice(0, 8)]);
    };

    const handleNextTurn = () => {
        const nextIdx = (activeTurnIndex + 1) % combatants.length;
        setActiveTurnIndex(nextIdx);
        const nextCombatant = combatants[nextIdx];
        setCombatLogs(prev => [`Turn: ${nextCombatant.sheet.name} (${nextCombatant.sheet.characterClass})`, ...prev.slice(0, 8)]);
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '90px',
            left: '20px',
            zIndex: 99999,
            pointerEvents: 'auto',
            width: '680px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid #38bdf8',
            borderRadius: '16px',
            padding: '16px',
            color: '#f8fafc',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
        }}>
            {/* Header: Turn Order & Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚔️ D&D 5e Tactical Combat Encounter
                </div>
                {onClose && (
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>
                        ✖ Close
                    </button>
                )}
            </div>

            {/* Initiative Order Queue */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
                {combatants.map((c, idx) => {
                    const isActiveTurn = idx === activeTurnIndex;
                    return (
                        <div key={c.id} style={{
                            flex: '1',
                            minWidth: '130px',
                            background: isActiveTurn ? 'rgba(56, 189, 248, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                            border: isActiveTurn ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '10px',
                            padding: '8px 10px',
                            transition: 'all 0.2s ease-in-out'
                        }}>
                            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Init: {c.initiativeRoll}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', color: isActiveTurn ? '#38bdf8' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.sheet.name}
                            </div>
                            <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>
                                HP: {c.currentHp}/{c.maxHp} | AC: {c.ac}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Actions Bar & Dice Roller Display */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', flex: '1' }}>
                    <button
                        onClick={handleAttack}
                        style={{
                            flex: '1',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontWeight: 'bold',
                            padding: '10px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                        }}
                    >
                        ⚔️ Attack Target
                    </button>
                    <button
                        onClick={() => handleAbilityCheck('str')}
                        style={{
                            flex: '1',
                            background: 'rgba(30, 41, 59, 0.9)',
                            border: '1px solid #38bdf8',
                            borderRadius: '8px',
                            color: '#38bdf8',
                            fontWeight: 'bold',
                            padding: '10px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        🎲 STR Check (DC 15)
                    </button>
                    <button
                        onClick={handleNextTurn}
                        style={{
                            background: 'rgba(51, 65, 85, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.4)',
                            borderRadius: '8px',
                            color: '#f8fafc',
                            fontWeight: 'bold',
                            padding: '10px 16px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        ⏩ End Turn
                    </button>
                </div>

                {/* Animated D20 Dice Result */}
                {lastRoll && (
                    <div style={{
                        background: lastRoll.isCriticalSuccess ? '#10b981' : lastRoll.isCriticalFailure ? '#ef4444' : '#1e293b',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '10px',
                        padding: '6px 14px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#cbd5e1' }}>D20 Roll</div>
                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{lastRoll.total}</div>
                    </div>
                )}
            </div>

            {/* Combat Logs Window */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px',
                maxHeight: '90px',
                overflowY: 'auto',
                fontSize: '11px',
                color: '#94a3b8',
                lineHeight: '1.5'
            }}>
                {combatLogs.map((log, idx) => (
                    <div key={idx} style={{ color: idx === 0 ? '#f8fafc' : '#94a3b8' }}>{log}</div>
                ))}
            </div>
        </div>
    );
};
