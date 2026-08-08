import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ChronoFaerunWorldProps {
    isActive: boolean;
    playerPosition?: [number, number, number];
}

export interface Combatant {
    id: string;
    name: string;
    type: 'player' | 'enemy' | 'boss';
    hp: number;
    maxHp: number;
    ac: number;
    initiative: number;
    position: [number, number, number];
    spriteUrl: string;
    isCurrentTurn: boolean;
}

export const ChronoFaerunWorld: React.FC<ChronoFaerunWorldProps> = ({
    isActive,
    playerPosition = [0, 0, 0]
}) => {
    const [combatants, setCombatants] = useState<Combatant[]>([
        {
            id: 'player_eldrin',
            name: 'Eldrin Starweaver (Evoker)',
            type: 'player',
            hp: 32,
            maxHp: 32,
            ac: 15,
            initiative: 18,
            position: [0, 0.5, 4],
            spriteUrl: '/assets/sprites/mage_idle.png',
            isCurrentTurn: true
        },
        {
            id: 'enemy_goblin_boss',
            name: 'Goblin Warlord',
            type: 'enemy',
            hp: 24,
            maxHp: 24,
            ac: 14,
            initiative: 12,
            position: [-6, 0.5, -4],
            spriteUrl: '/assets/sprites/goblin.png',
            isCurrentTurn: false
        },
        {
            id: 'enemy_mind_flayer',
            name: 'Mind Flayer Sorcerer',
            type: 'boss',
            hp: 45,
            maxHp: 45,
            ac: 16,
            initiative: 8,
            position: [6, 0.5, -6],
            spriteUrl: '/assets/sprites/mindflayer.png',
            isCurrentTurn: false
        }
    ]);

    const [activeSpellEffect, setActiveSpellEffect] = useState<{
        type: 'fireball' | 'frost' | 'lightning';
        pos: [number, number, number];
        progress: number;
    } | null>(null);

    const [combatLog, setCombatLog] = useState<string[]>([
        '⚔️ Chrono-Faerûn: Encounter Started in Netheril Ruins (-339 DR)!',
        '🎲 Eldrin Starweaver rolled Initiative: 18 (Turn 1).'
    ]);

    useFrame((_, delta) => {
        if (activeSpellEffect) {
            setActiveSpellEffect(prev => {
                if (!prev) return null;
                if (prev.progress >= 1.0) return null;
                return { ...prev, progress: prev.progress + delta * 2.0 };
            });
        }
    });

    const handleCastSpell = (spellName: string, school: 'fireball' | 'frost' | 'lightning', target: Combatant) => {
        const d20 = Math.floor(Math.random() * 20) + 1;
        const attackRoll = d20 + 7;
        const hits = attackRoll >= target.ac;
        const damage = Math.floor(Math.random() * 18) + 6;

        setActiveSpellEffect({
            type: school,
            pos: target.position,
            progress: 0.0
        });

        setCombatants(prev => prev.map(c => {
            if (c.id === target.id) {
                const newHp = Math.max(0, c.hp - (hits ? damage : 0));
                return { ...c, hp: newHp };
            }
            return c;
        }));

        const logMsg = hits
            ? `🔥 Eldrin cast ${spellName}! Attack: ${attackRoll} vs AC ${target.ac} (HIT!). Dealt ${damage} damage to ${target.name}!`
            : `💨 Eldrin cast ${spellName}! Attack: ${attackRoll} vs AC ${target.ac} (MISSED!).`;

        setCombatLog(prev => [logMsg, ...prev]);

        if ((window as any).ollamaNarrate) {
            (window as any).ollamaNarrate(`Describe the epic 5e spell result: Eldrin cast ${spellName} on ${target.name}. Damage dealt: ${hits ? damage : 0}.`);
        }
    };

    if (!isActive) return null;

    return (
        <group position={[0, 0, 0]}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[20, 40, 20]} intensity={2.0} castShadow />
            <pointLight position={[0, 10, 0]} intensity={3.0} color="#38bdf8" />

            <gridHelper args={[60, 30, '#38bdf8', '#1e293b']} position={[0, 0.01, 0]} />

            <mesh position={[0, -0.5, 0]} receiveShadow>
                <boxGeometry args={[60, 1, 60]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
            </mesh>

            {combatants.map(c => (
                <group key={c.id} position={c.position}>
                    <mesh position={[0, 1.2, 0]}>
                        <planeGeometry args={[2.0, 2.4]} />
                        <meshStandardMaterial
                            color={c.type === 'player' ? '#60a5fa' : c.type === 'boss' ? '#a855f7' : '#ef4444'}
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <ringGeometry args={[1.0, 1.3, 32]} />
                        <meshBasicMaterial color={c.isCurrentTurn ? '#f59e0b' : c.type === 'player' ? '#38bdf8' : '#ef4444'} />
                    </mesh>
                </group>
            ))}

            {activeSpellEffect && (
                <group position={activeSpellEffect.pos}>
                    <mesh scale={1.0 + activeSpellEffect.progress * 6.0}>
                        <sphereGeometry args={[0.5, 16, 16]} />
                        <meshBasicMaterial
                            color={activeSpellEffect.type === 'fireball' ? '#f97316' : activeSpellEffect.type === 'frost' ? '#38bdf8' : '#a855f7'}
                            wireframe
                            transparent
                            opacity={1.0 - activeSpellEffect.progress}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
};
