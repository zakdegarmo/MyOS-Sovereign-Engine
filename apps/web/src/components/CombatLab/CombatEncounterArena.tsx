import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sword, Sparkles, MessageSquare, Shield, Footprints, 
    RotateCcw, Trophy, Skull, Heart, Dice5, Volume2, 
    CheckCircle2, XCircle, ChevronRight, X
} from 'lucide-react';

export interface Combatant {
    id: string;
    name: string;
    role: 'hero' | 'enemy';
    hp: number;
    maxHp: number;
    ac: number;
    speedFeet: number; // 30ft = 6 squares
    position: [number, number]; // [col, row] in 5ft grid
    action: string; // 'idle' | 'walk' | 'slash' | 'damage' | 'death' | 'spellcast' | 'talk'
    direction: 'U' | 'UL' | 'L' | 'DL' | 'D' | 'DR' | 'R' | 'UR';
    spritesheetUrl: string;
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    isDefending?: boolean;
}

interface FloatingText {
    id: string;
    text: string;
    color: string;
    x: number;
    y: number;
}

interface CombatLog {
    id: string;
    timestamp: number;
    sender: string;
    text: string;
    type: 'hit' | 'miss' | 'heal' | 'speech' | 'info' | 'victory' | 'defeat';
}

const GRID_COLS = 12;
const GRID_ROWS = 7;
const CELL_SIZE_PX = 68; // 68px per 5ft square

// 8-directional compass mapping based on delta vector
function resolveHeading(dx: number, dy: number): 'U' | 'UL' | 'L' | 'DL' | 'D' | 'DR' | 'R' | 'UR' {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 to 180
    // In grid: y increases downwards (South is +y, North is -y, East is +x, West is -x)
    if (angle >= -22.5 && angle < 22.5) return 'R';
    if (angle >= 22.5 && angle < 67.5) return 'DR';
    if (angle >= 67.5 && angle < 112.5) return 'D';
    if (angle >= 112.5 && angle < 157.5) return 'DL';
    if (angle >= 157.5 || angle < -157.5) return 'L';
    if (angle >= -157.5 && angle < -112.5) return 'UL';
    if (angle >= -112.5 && angle < -67.5) return 'U';
    return 'UR';
}

// 8x8 Spritesheet Row mapping
const DIR_ROWS: Record<string, number> = {
    'D': 0, 'DL': 1, 'L': 2, 'UL': 3,
    'U': 4, 'UR': 5, 'R': 6, 'DR': 7
};

export const CombatEncounterArena: React.FC<{
    onClose?: () => void;
    heroSpriteSheet?: string;
    opponentSpriteSheet?: string;
}> = ({
    onClose,
    heroSpriteSheet = '/actions/flesh_base_mannequin_idle_loop.png',
    opponentSpriteSheet = '/actions/elven_shadow_rogue_idle_loop.png'
}) => {
    // --- Combatants State ---
    const [hero, setHero] = useState<Combatant>({
        id: 'hero',
        name: 'Flesh Paladin',
        role: 'hero',
        hp: 38,
        maxHp: 38,
        ac: 16,
        speedFeet: 30,
        position: [2, 3], // Col 2, Row 3
        action: 'idle',
        direction: 'R',
        spritesheetUrl: heroSpriteSheet,
        stats: { str: 16, dex: 12, con: 16, int: 10, wis: 12, cha: 16 }
    });

    const [enemy, setEnemy] = useState<Combatant>({
        id: 'enemy',
        name: 'Shadow Rogue',
        role: 'enemy',
        hp: 32,
        maxHp: 32,
        ac: 15,
        speedFeet: 35,
        position: [9, 3], // Col 9, Row 3
        action: 'idle',
        direction: 'L',
        spritesheetUrl: opponentSpriteSheet,
        stats: { str: 12, dex: 18, con: 14, int: 12, wis: 14, cha: 12 }
    });

    // --- Turn & Encounter Lifecycle ---
    const [round, setRound] = useState(1);
    const [turn, setTurn] = useState<'hero' | 'enemy'>('hero');
    const [hasActed, setHasActed] = useState(false);
    const [hasMoved, setHasMoved] = useState(false);
    const [remainingMoveFeet, setRemainingMoveFeet] = useState(30);

    // End State: null | 'victory' | 'defeat' | 'peace' | 'flee'
    const [resolutionState, setResolutionState] = useState<'victory' | 'defeat' | 'peace' | 'flee' | null>(null);

    // --- Active SNES JRPG Menu Mode ---
    // 'main' | 'magic' | 'roleplay' | 'move'
    const [menuMode, setMenuMode] = useState<'main' | 'magic' | 'roleplay' | 'move'>('main');
    const [selectedMenuIndex, setSelectedMenuIndex] = useState(0);

    // --- Floating VFX Numbers & Action Logs ---
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [combatLogs, setCombatLogs] = useState<CombatLog[]>([
        { id: 'log-0', timestamp: Date.now(), sender: 'Initiative', text: 'Encounter started! 5-Foot Tactical Grid calibrated.', type: 'info' },
        { id: 'log-1', timestamp: Date.now(), sender: 'Hero', text: 'Hero rolled Initiative 17. Your turn!', type: 'info' }
    ]);

    // Animation frame tick for sprite rendering (8 frames loop)
    const [animFrame, setAnimFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimFrame(prev => (prev + 1) % 8);
        }, 125); // 8 FPS
        return () => clearInterval(interval);
    }, []);

    // Helper: Add floating combat text
    const spawnFloatingText = useCallback((text: string, color: string, col: number, row: number) => {
        const id = `float-${Date.now()}-${Math.random()}`;
        const x = col * CELL_SIZE_PX + CELL_SIZE_PX / 2;
        const y = row * CELL_SIZE_PX - 10;
        setFloatingTexts(prev => [...prev, { id, text, color, x, y }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(f => f.id !== id));
        }, 1600);
    }, []);

    // Helper: Add combat log
    const addLog = useCallback((sender: string, text: string, type: CombatLog['type']) => {
        setCombatLogs(prev => [
            { id: `log-${Date.now()}-${Math.random()}`, timestamp: Date.now(), sender, text, type },
            ...prev.slice(0, 15)
        ]);
    }, []);

    // Calculate grid distance in 5-ft steps (Chebyshev distance)
    const getDistanceFeet = useCallback((posA: [number, number], posB: [number, number]) => {
        const dc = Math.abs(posA[0] - posB[0]);
        const dr = Math.abs(posA[1] - posB[1]);
        return Math.max(dc, dr) * 5;
    }, []);

    // Update facing directions so combatants face each other
    useEffect(() => {
        if (hero.action === 'death' || enemy.action === 'death') return;
        const heroToEnemy = resolveHeading(enemy.position[0] - hero.position[0], enemy.position[1] - hero.position[1]);
        const enemyToHero = resolveHeading(hero.position[0] - enemy.position[0], hero.position[1] - enemy.position[1]);
        setHero(h => ({ ...h, direction: heroToEnemy }));
        setEnemy(e => ({ ...e, direction: enemyToHero }));
    }, [hero.position, enemy.position, hero.action, enemy.action]);

    // Helper: Roll d20
    const rollD20 = (mod: number = 0) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        return { d20, total: d20 + mod, isCrit: d20 === 20, isFumble: d20 === 1 };
    };

    // =========================================================================
    // HERO COMBAT ACTIONS
    // =========================================================================

    // 1. Melee Attack (Slash)
    const handleHeroMeleeAttack = () => {
        if (turn !== 'hero' || hasActed || resolutionState) return;

        const dist = getDistanceFeet(hero.position, enemy.position);
        if (dist > 5) {
            addLog('Combat', `Out of melee reach! (${dist}ft away, need 5ft). Move closer first!`, 'info');
            return;
        }

        setHasActed(true);
        setHero(h => ({ ...h, action: 'slash' }));

        // Roll d20 + Str Mod (+3) + Proficiency (+3) = +6
        const attackRoll = rollD20(6);
        const effectiveAc = enemy.isDefending ? enemy.ac + 2 : enemy.ac;
        const isHit = (attackRoll.total >= effectiveAc || attackRoll.isCrit) && !attackRoll.isFumble;

        setTimeout(() => {
            if (isHit) {
                // 1d8 + 3 slashing
                const baseDmg = Math.floor(Math.random() * 8) + 1 + 3;
                const finalDmg = attackRoll.isCrit ? baseDmg * 2 : baseDmg;
                const newHp = Math.max(0, enemy.hp - finalDmg);

                setEnemy(e => ({
                    ...e,
                    hp: newHp,
                    action: newHp === 0 ? 'death' : 'damage',
                    isDefending: false
                }));

                const hitMsg = attackRoll.isCrit
                    ? `⚔️ CRITICAL HIT! d20(20)+6 = ${attackRoll.total} vs AC ${effectiveAc}! Dealt ${finalDmg} Slashing!`
                    : `⚔️ HIT! d20(${attackRoll.d20})+6 = ${attackRoll.total} vs AC ${effectiveAc}! Dealt ${finalDmg} Slashing.`;

                addLog('Hero', hitMsg, 'hit');
                spawnFloatingText(attackRoll.isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`, attackRoll.isCrit ? '#f59e0b' : '#ef4444', enemy.position[0], enemy.position[1]);

                if (newHp === 0) {
                    setTimeout(() => triggerResolution('victory'), 1000);
                } else {
                    setTimeout(() => setEnemy(e => ({ ...e, action: 'idle' })), 600);
                }
            } else {
                addLog('Hero', `🛡️ MISS! d20(${attackRoll.d20})+6 = ${attackRoll.total} vs AC ${effectiveAc}. Opponent parries!`, 'miss');
                spawnFloatingText('MISS', '#94a3b8', enemy.position[0], enemy.position[1]);
            }

            setHero(h => ({ ...h, action: 'idle' }));
        }, 500);
    };

    // 2. Spellcast Action
    const handleCastSpell = (spellType: 'firebolt' | 'magic_missile' | 'cure_wounds') => {
        if (turn !== 'hero' || hasActed || resolutionState) return;

        setHasActed(true);
        setMenuMode('main');
        setHero(h => ({ ...h, action: 'spellcast' }));

        setTimeout(() => {
            if (spellType === 'cure_wounds') {
                const heal = Math.floor(Math.random() * 8) + 1 + 3; // 1d8 + 3
                const newHp = Math.min(hero.maxHp, hero.hp + heal);
                setHero(h => ({ ...h, hp: newHp, action: 'idle' }));
                addLog('Hero', `✨ Cast Cure Wounds! Restored +${heal} HP (${newHp}/${hero.maxHp}).`, 'heal');
                spawnFloatingText(`+${heal} HP`, '#10b981', hero.position[0], hero.position[1]);
            } else if (spellType === 'magic_missile') {
                // 3 darts, auto-hit force damage
                const dmg = (Math.floor(Math.random() * 4) + 2) + (Math.floor(Math.random() * 4) + 2) + (Math.floor(Math.random() * 4) + 2);
                const newHp = Math.max(0, enemy.hp - dmg);
                setEnemy(e => ({ ...e, hp: newHp, action: newHp === 0 ? 'death' : 'damage' }));
                setHero(h => ({ ...h, action: 'idle' }));
                addLog('Hero', `✨ Cast Magic Missile! 3 unerring darts hit for ${dmg} Force damage!`, 'hit');
                spawnFloatingText(`-${dmg}`, '#a855f7', enemy.position[0], enemy.position[1]);

                if (newHp === 0) {
                    setTimeout(() => triggerResolution('victory'), 1000);
                } else {
                    setTimeout(() => setEnemy(e => ({ ...e, action: 'idle' })), 600);
                }
            } else if (spellType === 'firebolt') {
                const roll = rollD20(6);
                const effectiveAc = enemy.isDefending ? enemy.ac + 2 : enemy.ac;
                const isHit = (roll.total >= effectiveAc || roll.isCrit) && !roll.isFumble;

                if (isHit) {
                    const dmg = Math.floor(Math.random() * 10) + 1;
                    const finalDmg = roll.isCrit ? dmg * 2 : dmg;
                    const newHp = Math.max(0, enemy.hp - finalDmg);
                    setEnemy(e => ({ ...e, hp: newHp, action: newHp === 0 ? 'death' : 'damage' }));
                    addLog('Hero', `🔥 Fire Bolt struck! d20(${roll.d20})+6 = ${roll.total} vs AC ${effectiveAc} -> ${finalDmg} Fire Damage!`, 'hit');
                    spawnFloatingText(`-${finalDmg}`, '#f97316', enemy.position[0], enemy.position[1]);

                    if (newHp === 0) {
                        setTimeout(() => triggerResolution('victory'), 1000);
                    } else {
                        setTimeout(() => setEnemy(e => ({ ...e, action: 'idle' })), 600);
                    }
                } else {
                    addLog('Hero', `🔥 Fire Bolt missed! d20(${roll.d20})+6 = ${roll.total} vs AC ${effectiveAc}.`, 'miss');
                    spawnFloatingText('MISS', '#94a3b8', enemy.position[0], enemy.position[1]);
                }
                setHero(h => ({ ...h, action: 'idle' }));
            }
        }, 600);
    };

    // 3. Social / Roleplay Action (D&D 5e Persuasion / Intimidation Check)
    const handleRoleplayCheck = (skill: 'persuasion' | 'intimidation' | 'insight') => {
        if (turn !== 'hero' || hasActed || resolutionState) return;

        setHasActed(true);
        setMenuMode('main');
        setHero(h => ({ ...h, action: 'talk' }));

        const mod = skill === 'persuasion' ? hero.stats.cha : hero.stats.str;
        const skillMod = Math.floor((mod - 10) / 2) + 3; // +3 Proficiency
        const dc = skill === 'persuasion' ? 14 : skill === 'intimidation' ? 15 : 12;

        const roll = rollD20(skillMod);
        const success = (roll.total >= dc || roll.isCrit) && !roll.isFumble;

        setTimeout(() => {
            if (skill === 'persuasion') {
                if (success) {
                    addLog('Hero', `🕊️ SUCCESS! Persuasion d20(${roll.d20})+${skillMod} = ${roll.total} vs DC ${dc}. The Shadow Rogue lowers her daggers and agrees to a ceasefire!`, 'speech');
                    spawnFloatingText('TRUCE!', '#38bdf8', enemy.position[0], enemy.position[1]);
                    setTimeout(() => triggerResolution('peace'), 1200);
                } else {
                    addLog('Hero', `❌ FAILED. Persuasion d20(${roll.d20})+${skillMod} = ${roll.total} vs DC ${dc}. "Save your honeyed words for your grave!"`, 'speech');
                    spawnFloatingText('DEFIANT', '#ef4444', enemy.position[0], enemy.position[1]);
                }
            } else if (skill === 'intimidation') {
                if (success) {
                    addLog('Hero', `💀 SUCCESS! Intimidation d20(${roll.d20})+${skillMod} = ${roll.total} vs DC ${dc}. Overwhelmed by your resolve, the rogue surrenders!`, 'speech');
                    spawnFloatingText('SURRENDER!', '#f59e0b', enemy.position[0], enemy.position[1]);
                    setTimeout(() => triggerResolution('peace'), 1200);
                } else {
                    addLog('Hero', `❌ FAILED. Intimidation d20(${roll.d20})+${skillMod} = ${roll.total} vs DC ${dc}. "You do not frighten me, Paladin!"`, 'speech');
                    spawnFloatingText('UNFAZED', '#ef4444', enemy.position[0], enemy.position[1]);
                }
            } else if (skill === 'insight') {
                if (success) {
                    addLog('Hero', `👁️ Insight SUCCESS (${roll.total} vs DC ${dc}). You spotted her feint! Advantage gained on your next turn.`, 'info');
                    spawnFloatingText('INSIGHT!', '#06b6d4', hero.position[0], hero.position[1]);
                } else {
                    addLog('Hero', `👁️ Insight FAILED (${roll.total} vs DC ${dc}). Her intent remains inscrutable.`, 'info');
                }
            }
            setHero(h => ({ ...h, action: 'idle' }));
        }, 700);
    };

    // 4. Defend Action (Dodge)
    const handleHeroDefend = () => {
        if (turn !== 'hero' || hasActed || resolutionState) return;
        setHasActed(true);
        setHero(h => ({ ...h, isDefending: true }));
        addLog('Hero', '🛡️ Took the Dodge Action. AC increased by +2 and incoming attacks suffer disadvantage!', 'info');
        spawnFloatingText('DODGE +2 AC', '#38bdf8', hero.position[0], hero.position[1]);
    };

    // 5. Grid Tile Movement
    const handleMoveToTile = (col: number, row: number) => {
        if (turn !== 'hero' || resolutionState) return;

        // Check if tile is occupied by enemy
        if (enemy.position[0] === col && enemy.position[1] === row) return;

        const dist = getDistanceFeet(hero.position, [col, row]);
        if (dist > remainingMoveFeet) return;

        // Pathing: move hero to target tile
        const moveHeading = resolveHeading(col - hero.position[0], row - hero.position[1]);
        setHero(h => ({
            ...h,
            action: 'walk',
            direction: moveHeading
        }));

        setTimeout(() => {
            setHero(h => ({
                ...h,
                position: [col, row],
                action: 'idle'
            }));
            setRemainingMoveFeet(prev => prev - dist);
            setHasMoved(true);
            setMenuMode('main');
            addLog('Hero', `Moved ${dist} feet to grid square [${col}, ${row}]. (${remainingMoveFeet - dist}ft remaining)`, 'info');
        }, 400);
    };

    // End Turn -> Triggers Enemy AI Turn
    const handleEndTurn = () => {
        if (turn !== 'hero' || resolutionState) return;
        setTurn('enemy');
        setHero(h => ({ ...h, isDefending: false }));
        addLog('System', 'Enemy Turn begins...', 'info');
    };

    // =========================================================================
    // ENEMY AI TURN EXECUTION
    // =========================================================================
    useEffect(() => {
        if (turn !== 'enemy' || resolutionState) return;

        const aiTimer = setTimeout(() => {
            executeEnemyTurn();
        }, 1000);

        return () => clearTimeout(aiTimer);
    }, [turn, resolutionState]);

    const executeEnemyTurn = () => {
        const dist = getDistanceFeet(enemy.position, hero.position);

        // 1. Move towards hero if > 5ft away
        if (dist > 5) {
            // Step 1 square closer
            const dc = Math.sign(hero.position[0] - enemy.position[0]);
            const dr = Math.sign(hero.position[1] - enemy.position[1]);
            const targetCol = enemy.position[0] + dc;
            const targetRow = enemy.position[1] + dr;

            // Ensure tile is not hero tile
            if (!(targetCol === hero.position[0] && targetRow === hero.position[1])) {
                const heading = resolveHeading(dc, dr);
                setEnemy(e => ({ ...e, action: 'walk', direction: heading }));

                setTimeout(() => {
                    setEnemy(e => ({
                        ...e,
                        position: [targetCol, targetRow],
                        action: 'idle'
                    }));
                    addLog('Enemy', `Shadow Rogue advances 5ft to [${targetCol}, ${targetRow}].`, 'info');

                    // Check if now within melee or ranged
                    const newDist = getDistanceFeet([targetCol, targetRow], hero.position);
                    setTimeout(() => enemyPerformAttack(newDist), 400);
                }, 400);
                return;
            }
        }

        enemyPerformAttack(dist);
    };

    const enemyPerformAttack = (dist: number) => {
        setEnemy(e => ({ ...e, action: 'slash' }));

        const isMelee = dist <= 5;
        const attackMod = 6; // +4 Dex + 2 Prof
        const effectiveHeroAc = hero.isDefending ? hero.ac + 2 : hero.ac;

        // If hero is defending, roll with disadvantage
        let roll1 = rollD20(attackMod);
        let roll2 = rollD20(attackMod);
        let attackRoll = hero.isDefending
            ? (roll1.total < roll2.total ? roll1 : roll2)
            : roll1;

        const isHit = (attackRoll.total >= effectiveHeroAc || attackRoll.isCrit) && !attackRoll.isFumble;

        setTimeout(() => {
            if (isHit) {
                // 1d6 + 4 piercing
                const baseDmg = Math.floor(Math.random() * 6) + 1 + 4;
                const finalDmg = attackRoll.isCrit ? baseDmg * 2 : baseDmg;
                const newHp = Math.max(0, hero.hp - finalDmg);

                setHero(h => ({
                    ...h,
                    hp: newHp,
                    action: newHp === 0 ? 'death' : 'damage'
                }));

                const hitMsg = isMelee
                    ? `🗡️ Shadow Rogue strikes with dual daggers! d20(${attackRoll.d20})+${attackMod} = ${attackRoll.total} vs AC ${effectiveHeroAc} -> ${finalDmg} Piercing!`
                    : `🏹 Shadow Rogue fires a shortbow arrow! d20(${attackRoll.d20})+${attackMod} = ${attackRoll.total} vs AC ${effectiveHeroAc} -> ${finalDmg} Piercing!`;

                addLog('Enemy', hitMsg, 'hit');
                spawnFloatingText(attackRoll.isCrit ? `CRIT! -${finalDmg}` : `-${finalDmg}`, '#ef4444', hero.position[0], hero.position[1]);

                if (newHp === 0) {
                    setTimeout(() => triggerResolution('defeat'), 1000);
                } else {
                    setTimeout(() => setHero(h => ({ ...h, action: 'idle' })), 600);
                }
            } else {
                addLog('Enemy', `🛡️ Shadow Rogue missed! d20(${attackRoll.d20})+${attackMod} = ${attackRoll.total} vs AC ${effectiveHeroAc}.`, 'miss');
                spawnFloatingText('MISS', '#94a3b8', hero.position[0], hero.position[1]);
            }

            setEnemy(e => ({ ...e, action: 'idle' }));

            // Return turn to hero after enemy action
            setTimeout(() => {
                if (hero.hp > 0 && enemy.hp > 0 && !resolutionState) {
                    setTurn('hero');
                    setHasActed(false);
                    setHasMoved(false);
                    setRemainingMoveFeet(30);
                    setRound(r => r + 1);
                    addLog('System', `--- ROUND ${round + 1}: Hero's Turn ---`, 'info');
                }
            }, 800);
        }, 500);
    };

    const triggerResolution = (state: 'victory' | 'defeat' | 'peace' | 'flee') => {
        setResolutionState(state);
        if (state === 'victory') {
            addLog('System', '🏆 VICTORY! Enemy defeated in tactical combat. Gained 450 XP and 75 GP.', 'victory');
        } else if (state === 'defeat') {
            addLog('System', '💀 DEFEAT! The Paladin has fallen. Darkness claims the arena.', 'defeat');
        } else if (state === 'peace') {
            addLog('System', '🕊️ DIPLOMATIC TRUCE! Hostilities ceased through roleplay. Full 450 XP awarded!', 'victory');
        }
    };

    const resetEncounter = () => {
        setHero({
            id: 'hero',
            name: 'Flesh Paladin',
            role: 'hero',
            hp: 38,
            maxHp: 38,
            ac: 16,
            speedFeet: 30,
            position: [2, 3],
            action: 'idle',
            direction: 'R',
            spritesheetUrl: heroSpriteSheet,
            stats: { str: 16, dex: 12, con: 16, int: 10, wis: 12, cha: 16 }
        });
        setEnemy({
            id: 'enemy',
            name: 'Shadow Rogue',
            role: 'enemy',
            hp: 32,
            maxHp: 32,
            ac: 15,
            speedFeet: 35,
            position: [9, 3],
            action: 'idle',
            direction: 'L',
            spritesheetUrl: opponentSpriteSheet,
            stats: { str: 12, dex: 18, con: 14, int: 12, wis: 14, cha: 12 }
        });
        setRound(1);
        setTurn('hero');
        setHasActed(false);
        setHasMoved(false);
        setRemainingMoveFeet(30);
        setResolutionState(null);
        setMenuMode('main');
        setCombatLogs([
            { id: 'reset-1', timestamp: Date.now(), sender: 'System', text: 'Tactical Encounter Reset. Fight anew!', type: 'info' }
        ]);
    };

    // Calculate valid move tiles for Hero
    const validMoveTiles = useMemo(() => {
        if (menuMode !== 'move' || remainingMoveFeet <= 0 || turn !== 'hero') return new Set<string>();
        const valid = new Set<string>();
        for (let c = 0; c < GRID_COLS; c++) {
            for (let r = 0; r < GRID_ROWS; r++) {
                if (c === enemy.position[0] && r === enemy.position[1]) continue;
                const d = getDistanceFeet(hero.position, [c, r]);
                if (d <= remainingMoveFeet && d > 0) {
                    valid.add(`${c},${r}`);
                }
            }
        }
        return valid;
    }, [menuMode, remainingMoveFeet, turn, hero.position, enemy.position, getDistanceFeet]);

    return (
        <div className="relative w-full h-full min-h-[640px] flex flex-col bg-[#080c16] text-white font-mono overflow-hidden select-none">
            {/* TOP BAR: ROUND & TURN STATUS */}
            <div className="h-12 px-6 bg-slate-950/80 border-b border-cyan-500/30 flex items-center justify-between backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-cyan-300 font-bold text-xs">
                        <Dice5 size={14} className="text-cyan-400" />
                        <span>TACTICAL COMBAT LAB • ROUND {round}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:inline">
                        5e D&D Mechanics × SNES JRPG Turn-Based UX
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Active Turn Banner */}
                    <div className={`px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all ${
                        turn === 'hero'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-emerald-950/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-rose-950/40'
                    }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${turn === 'hero' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span>{turn === 'hero' ? '🌟 HERO TURN' : '⚔️ ENEMY TURN'}</span>
                    </div>

                    <button
                        onClick={resetEncounter}
                        className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition"
                        title="Reset Encounter"
                    >
                        <RotateCcw size={14} />
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg border border-red-500/40 text-red-300 transition"
                            title="Close Combat Lab"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* ARENA MAIN VIEWPORT: GRID + CHARACTERS */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* 5ft Tactical Grid Container */}
                <div 
                    className="relative bg-slate-900/90 rounded-2xl border-[2px] border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden"
                    style={{
                        width: `${GRID_COLS * CELL_SIZE_PX}px`,
                        height: `${GRID_ROWS * CELL_SIZE_PX}px`
                    }}
                >
                    {/* Floor Texture Background */}
                    <div 
                        className="absolute inset-0 opacity-40 bg-[url('/textures/stone_floor_2.jpg')] bg-repeat"
                        style={{ backgroundSize: '136px 136px' }}
                    />

                    {/* 5-Foot Discrete Grid Cells */}
                    <div 
                        className="absolute inset-0 grid"
                        style={{
                            gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE_PX}px)`,
                            gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE_PX}px)`
                        }}
                    >
                        {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, idx) => {
                            const c = idx % GRID_COLS;
                            const r = Math.floor(idx / GRID_COLS);
                            const key = `${c},${r}`;
                            const isValidMove = validMoveTiles.has(key);

                            return (
                                <div
                                    key={key}
                                    onClick={() => isValidMove && handleMoveToTile(c, r)}
                                    className={`relative border border-cyan-500/15 transition-all ${
                                        isValidMove 
                                            ? 'bg-cyan-500/25 border-cyan-400/80 cursor-pointer hover:bg-cyan-400/40 shadow-[inset_0_0_12px_rgba(6,182,212,0.5)] animate-pulse' 
                                            : ''
                                    }`}
                                >
                                    <span className="absolute bottom-1 right-1 text-[7px] font-mono text-white/10 select-none">
                                        {c},{r}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* HERO SPRITE */}
                    <div
                        className="absolute transition-all duration-300 ease-out pointer-events-none flex flex-col items-center"
                        style={{
                            width: `${CELL_SIZE_PX}px`,
                            height: `${CELL_SIZE_PX}px`,
                            left: `${hero.position[0] * CELL_SIZE_PX}px`,
                            top: `${hero.position[1] * CELL_SIZE_PX}px`,
                            zIndex: 10 + hero.position[1]
                        }}
                    >
                        {/* HP Bar Above Sprite */}
                        <div className="absolute -top-5 w-14 flex flex-col items-center gap-0.5">
                            <span className="text-[8px] font-black text-emerald-300 drop-shadow">
                                {hero.hp}/{hero.maxHp} HP
                            </span>
                            <div className="w-full bg-black/60 rounded-full h-1.5 border border-white/20 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                                    style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Ground Contact Shadow */}
                        <div className="absolute bottom-1 w-10 h-3 bg-black/60 rounded-full blur-[2px]" />

                        {/* 8-Way Animated Spritesheet Slice */}
                        <div 
                            className="relative w-24 h-24 -mt-10"
                            style={{
                                backgroundImage: `url(${
                                    hero.action === 'slash' 
                                        ? '/actions/flesh_base_mannequin_slash_loop.png'
                                        : hero.action === 'spellcast'
                                        ? '/actions/flesh_base_mannequin_spellcast_loop.png'
                                        : hero.action === 'talk'
                                        ? '/actions/flesh_base_mannequin_talk_loop.png'
                                        : hero.action === 'damage'
                                        ? '/actions/flesh_base_mannequin_damage_loop.png'
                                        : hero.action === 'death'
                                        ? '/actions/flesh_base_mannequin_death_loop.png'
                                        : hero.action === 'walk'
                                        ? '/actions/flesh_base_mannequin_walk_loop.png'
                                        : '/actions/flesh_base_mannequin_idle_loop.png'
                                })`,
                                backgroundSize: '768px 768px', // 8 cols x 8 rows @ 96px per tile
                                backgroundPosition: `-${animFrame * 96}px -${DIR_ROWS[hero.direction] * 96}px`,
                                filter: hero.isDefending ? 'drop-shadow(0 0 8px #38bdf8)' : 'none'
                            }}
                        />
                    </div>

                    {/* ENEMY SPRITE */}
                    <div
                        className="absolute transition-all duration-300 ease-out pointer-events-none flex flex-col items-center"
                        style={{
                            width: `${CELL_SIZE_PX}px`,
                            height: `${CELL_SIZE_PX}px`,
                            left: `${enemy.position[0] * CELL_SIZE_PX}px`,
                            top: `${enemy.position[1] * CELL_SIZE_PX}px`,
                            zIndex: 10 + enemy.position[1]
                        }}
                    >
                        {/* HP Bar Above Enemy */}
                        <div className="absolute -top-5 w-14 flex flex-col items-center gap-0.5">
                            <span className="text-[8px] font-black text-rose-300 drop-shadow">
                                {enemy.hp}/{enemy.maxHp} HP
                            </span>
                            <div className="w-full bg-black/60 rounded-full h-1.5 border border-white/20 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                                    style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Ground Contact Shadow */}
                        <div className="absolute bottom-1 w-10 h-3 bg-black/60 rounded-full blur-[2px]" />

                        {/* 8-Way Animated Spritesheet Slice */}
                        <div 
                            className="relative w-24 h-24 -mt-10"
                            style={{
                                backgroundImage: `url(${
                                    enemy.action === 'walk' 
                                        ? '/actions/elven_shadow_rogue_walk_loop.png'
                                        : enemy.action === 'slash'
                                        ? '/actions/flesh_base_mannequin_slash_loop.png'
                                        : enemy.action === 'damage'
                                        ? '/actions/flesh_base_mannequin_damage_loop.png'
                                        : enemy.action === 'death'
                                        ? '/actions/flesh_base_mannequin_death_loop.png'
                                        : '/actions/elven_shadow_rogue_idle_loop.png'
                                })`,
                                backgroundSize: '768px 768px',
                                backgroundPosition: `-${animFrame * 96}px -${DIR_ROWS[enemy.direction] * 96}px`,
                                filter: enemy.action === 'damage' ? 'brightness(1.8) saturate(2)' : 'none'
                            }}
                        />
                    </div>

                    {/* FLOATING DAMAGE / HEAL TEXTS */}
                    <AnimatePresence>
                        {floatingTexts.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 1, y: item.y, x: item.x, scale: 0.8 }}
                                animate={{ opacity: 0, y: item.y - 45, scale: 1.2 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.4, ease: 'easeOut' }}
                                className="absolute pointer-events-none font-black text-sm tracking-wider font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] z-50"
                                style={{ color: item.color }}
                            >
                                {item.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* BOTTOM HUD: CLASSIC SNES JRPG COMMAND WINDOW */}
            <div className="h-44 p-3 bg-slate-950/95 border-t-[3px] border-cyan-500/40 flex gap-4 backdrop-blur-xl z-30 shrink-0">
                {/* 1. JRPG ACTION MENU BOX */}
                <div className="w-80 bg-gradient-to-b from-blue-950/90 to-slate-950/95 border-[2px] border-cyan-400/50 rounded-xl p-3 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <div className="flex items-center justify-between pb-1 border-b border-cyan-500/30">
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                            COMMAND SELECTION
                        </span>
                        <span className="text-[9px] text-cyan-400/70 font-mono">
                            {turn === 'hero' ? 'ACTIVATE' : 'WAITING...'}
                        </span>
                    </div>

                    {/* Main Command Grid or Submenus */}
                    {menuMode === 'main' && (
                        <div className="grid grid-cols-2 gap-1.5 py-1">
                            <button
                                disabled={turn !== 'hero' || hasActed || Boolean(resolutionState)}
                                onClick={handleHeroMeleeAttack}
                                className="px-3 py-2 bg-blue-900/40 hover:bg-blue-600/50 border border-cyan-400/30 hover:border-cyan-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
                            >
                                <Sword size={14} className="text-cyan-400" />
                                <span>⚔️ ATTACK</span>
                            </button>

                            <button
                                disabled={turn !== 'hero' || hasActed || Boolean(resolutionState)}
                                onClick={() => setMenuMode('magic')}
                                className="px-3 py-2 bg-purple-900/40 hover:bg-purple-600/50 border border-purple-400/30 hover:border-purple-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
                            >
                                <Sparkles size={14} className="text-purple-400" />
                                <span>✨ MAGIC</span>
                            </button>

                            <button
                                disabled={turn !== 'hero' || hasActed || Boolean(resolutionState)}
                                onClick={() => setMenuMode('roleplay')}
                                className="px-3 py-2 bg-amber-900/40 hover:bg-amber-600/50 border border-amber-400/30 hover:border-amber-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
                            >
                                <MessageSquare size={14} className="text-amber-400" />
                                <span>🎭 ROLEPLAY</span>
                            </button>

                            <button
                                disabled={turn !== 'hero' || hasActed || Boolean(resolutionState)}
                                onClick={handleHeroDefend}
                                className="px-3 py-2 bg-emerald-900/40 hover:bg-emerald-600/50 border border-emerald-400/30 hover:border-emerald-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
                            >
                                <Shield size={14} className="text-emerald-400" />
                                <span>🛡️ DEFEND</span>
                            </button>

                            <button
                                disabled={turn !== 'hero' || remainingMoveFeet <= 0 || Boolean(resolutionState)}
                                onClick={() => setMenuMode('move')}
                                className="px-3 py-2 bg-cyan-900/40 hover:bg-cyan-600/50 border border-cyan-400/30 hover:border-cyan-300 rounded-lg text-[10px] font-bold tracking-wider flex items-center gap-2 transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-white"
                            >
                                <Footprints size={14} className="text-cyan-300" />
                                <span>🏃 MOVE ({remainingMoveFeet}ft)</span>
                            </button>

                            <button
                                disabled={turn !== 'hero' || Boolean(resolutionState)}
                                onClick={handleEndTurn}
                                className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 border border-white/20 rounded-lg text-[10px] font-bold tracking-wider flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-slate-300"
                            >
                                <span>PASS TURN ❯❯</span>
                            </button>
                        </div>
                    )}

                    {/* Magic Submenu */}
                    {menuMode === 'magic' && (
                        <div className="flex flex-col gap-1 py-1">
                            <button
                                onClick={() => handleCastSpell('firebolt')}
                                className="px-2.5 py-1.5 bg-orange-950/60 hover:bg-orange-800/50 border border-orange-500/40 rounded text-[9px] font-bold flex justify-between items-center text-orange-200 cursor-pointer"
                            >
                                <span>🔥 Fire Bolt (Ranged Spell)</span>
                                <span className="text-slate-400">1d10 Fire</span>
                            </button>
                            <button
                                onClick={() => handleCastSpell('magic_missile')}
                                className="px-2.5 py-1.5 bg-purple-950/60 hover:bg-purple-800/50 border border-purple-500/40 rounded text-[9px] font-bold flex justify-between items-center text-purple-200 cursor-pointer"
                            >
                                <span>🔮 Magic Missile (Unerring)</span>
                                <span className="text-slate-400">3d4+3 Force</span>
                            </button>
                            <button
                                onClick={() => handleCastSpell('cure_wounds')}
                                className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-800/50 border border-emerald-500/40 rounded text-[9px] font-bold flex justify-between items-center text-emerald-200 cursor-pointer"
                            >
                                <span>✨ Cure Wounds (Self Heal)</span>
                                <span className="text-slate-400">+1d8+3 HP</span>
                            </button>
                            <button
                                onClick={() => setMenuMode('main')}
                                className="mt-1 text-[8px] text-cyan-400 underline self-start cursor-pointer hover:text-white"
                            >
                                ❮ Back to Commands
                            </button>
                        </div>
                    )}

                    {/* Roleplay / Social Check Submenu */}
                    {menuMode === 'roleplay' && (
                        <div className="flex flex-col gap-1 py-1">
                            <button
                                onClick={() => handleRoleplayCheck('persuasion')}
                                className="px-2.5 py-1.5 bg-cyan-950/60 hover:bg-cyan-800/50 border border-cyan-500/40 rounded text-[9px] font-bold flex justify-between items-center text-cyan-200 cursor-pointer"
                            >
                                <span>🕊️ Propose Ceasefire / Truce</span>
                                <span className="text-amber-300">DC 14 Persuasion</span>
                            </button>
                            <button
                                onClick={() => handleRoleplayCheck('intimidation')}
                                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-800/50 border border-rose-500/40 rounded text-[9px] font-bold flex justify-between items-center text-rose-200 cursor-pointer"
                            >
                                <span>⚔️ Demand Instant Surrender</span>
                                <span className="text-amber-300">DC 15 Intimidate</span>
                            </button>
                            <button
                                onClick={() => handleRoleplayCheck('insight')}
                                className="px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-800/50 border border-indigo-500/40 rounded text-[9px] font-bold flex justify-between items-center text-indigo-200 cursor-pointer"
                            >
                                <span>👁️ Gauge Rogue's Intentions</span>
                                <span className="text-amber-300">DC 12 Insight</span>
                            </button>
                            <button
                                onClick={() => setMenuMode('main')}
                                className="mt-1 text-[8px] text-cyan-400 underline self-start cursor-pointer hover:text-white"
                            >
                                ❮ Back to Commands
                            </button>
                        </div>
                    )}

                    {/* Move Submenu */}
                    {menuMode === 'move' && (
                        <div className="flex flex-col gap-1 py-2 text-center">
                            <span className="text-[10px] font-bold text-cyan-300 animate-pulse">
                                CLICK ANY HIGHLIGHTED 5FT SQUARE
                            </span>
                            <span className="text-[9px] text-slate-400">
                                Remaining movement: <strong className="text-cyan-400">{remainingMoveFeet} ft</strong>
                            </span>
                            <button
                                onClick={() => setMenuMode('main')}
                                className="mt-2 text-[8px] text-cyan-400 underline cursor-pointer hover:text-white"
                            >
                                ❮ Cancel Movement
                            </button>
                        </div>
                    )}
                </div>

                {/* 2. STATBLOCK & CHARACTER SUMMARY */}
                <div className="w-72 bg-black/60 border border-white/10 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center pb-1 border-b border-white/10">
                            <span className="text-[10px] font-bold text-white uppercase">{hero.name}</span>
                            <span className="text-[9px] text-emerald-400 font-mono font-bold">AC {hero.ac}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 py-2 text-[8px] font-mono text-center">
                            <div className="bg-white/5 p-1 rounded">STR <strong className="text-white">+3</strong></div>
                            <div className="bg-white/5 p-1 rounded">DEX <strong className="text-white">+1</strong></div>
                            <div className="bg-white/5 p-1 rounded">CON <strong className="text-white">+3</strong></div>
                            <div className="bg-white/5 p-1 rounded">INT <strong className="text-white">+0</strong></div>
                            <div className="bg-white/5 p-1 rounded">WIS <strong className="text-white">+1</strong></div>
                            <div className="bg-white/5 p-1 rounded">CHA <strong className="text-white">+3</strong></div>
                        </div>
                    </div>
                    <div className="text-[8px] text-slate-400 pt-1 border-t border-white/10 flex justify-between">
                        <span>Movement: {remainingMoveFeet}/{hero.speedFeet}ft</span>
                        <span>Proficiency: +3</span>
                    </div>
                </div>

                {/* 3. COMBAT & D20 ACTION LOGS TICKER */}
                <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-2.5 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center pb-1 border-b border-white/10 shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            ENCOUNTER LOGS (D&D 5E DICE ROLLS)
                        </span>
                        <span className="text-[8px] text-cyan-400/80 font-mono">LIVE FEED</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 pt-1.5 scrollbar-thin scrollbar-thumb-cyan-500/20">
                        {combatLogs.map(log => (
                            <div 
                                key={log.id} 
                                className={`text-[9px] font-mono leading-tight ${
                                    log.type === 'hit' ? 'text-amber-300' :
                                    log.type === 'heal' ? 'text-emerald-300' :
                                    log.type === 'speech' ? 'text-cyan-300 font-bold' :
                                    log.type === 'miss' ? 'text-slate-400' :
                                    log.type === 'victory' ? 'text-yellow-300 font-black' :
                                    'text-slate-300'
                                }`}
                            >
                                <span className="text-white/40 mr-1.5">[{log.sender}]</span>
                                <span>{log.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RESOLUTION MODAL OVERLAYS */}
            <AnimatePresence>
                {resolutionState && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-6"
                    >
                        <div className="max-w-md w-full bg-gradient-to-b from-slate-900 to-black border-2 border-cyan-400 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_0_60px_rgba(6,182,212,0.4)]">
                            {resolutionState === 'victory' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-yellow-300 mb-3 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                                        <Trophy size={32} />
                                    </div>
                                    <h2 className="text-xl font-black text-yellow-300 tracking-wider uppercase mb-1">
                                        TACTICAL VICTORY!
                                    </h2>
                                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                        The Shadow Rogue has been subdued with honor. The arena stands victorious.
                                    </p>
                                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-5 text-left text-[10px] space-y-1">
                                        <div className="flex justify-between text-slate-400"><span>Combat XP Awarded:</span><strong className="text-emerald-400">+450 XP</strong></div>
                                        <div className="flex justify-between text-slate-400"><span>Gold Spoils:</span><strong className="text-yellow-400">+75 GP</strong></div>
                                        <div className="flex justify-between text-slate-400"><span>Reputation (Faerûn):</span><strong className="text-cyan-400">+2 Heroic Standing</strong></div>
                                    </div>
                                </>
                            )}

                            {resolutionState === 'peace' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <h2 className="text-xl font-black text-cyan-300 tracking-wider uppercase mb-1">
                                        PEACEFUL RESOLUTION!
                                    </h2>
                                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                        Conflict resolved without needless bloodshed. Through roleplay and social prowess, an alliance has been established.
                                    </p>
                                    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mb-5 text-left text-[10px] space-y-1">
                                        <div className="flex justify-between text-slate-400"><span>Diplomatic XP:</span><strong className="text-emerald-400">+450 XP (Full Reward)</strong></div>
                                        <div className="flex justify-between text-slate-400"><span>Outcome:</span><strong className="text-cyan-400">Peace Accord Signed</strong></div>
                                        <div className="flex justify-between text-slate-400"><span>Status:</span><strong className="text-amber-400">Shadow Rogue Pacified</strong></div>
                                    </div>
                                </>
                            )}

                            {resolutionState === 'defeat' && (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-3 shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                                        <Skull size={32} />
                                    </div>
                                    <h2 className="text-xl font-black text-rose-400 tracking-wider uppercase mb-1">
                                        HERO FALLEN
                                    </h2>
                                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                        Your HP reached 0. The tactical encounter was lost, but knowledge endures.
                                    </p>
                                </>
                            )}

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={resetEncounter}
                                    className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-lg shadow-cyan-500/20"
                                >
                                    FIGHT AGAIN
                                </button>
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase rounded-xl transition cursor-pointer"
                                    >
                                        EXIT LAB
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CombatEncounterArena;
