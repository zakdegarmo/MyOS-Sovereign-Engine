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
    spritePath: string;
    isCurrentTurn: boolean;
    statusEffects: string[];
}

export interface FloatingDamageNumber {
    id: string;
    text: string;
    color: string;
    position: [number, number, number];
    progress: number;
}

const CustomSpellShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uColor: { value: new THREE.Color('#f97316') }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uProgress;
        uniform float uTime;

        void main() {
            vUv = uv;
            vPosition = position;
            vec3 pos = position * (1.0 + uProgress * 4.0);
            pos.y += sin(uTime * 5.0 + position.x * 2.0) * 0.15;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float uProgress;
        uniform float uTime;
        uniform vec3 uColor;

        void main() {
            float dist = length(vUv - vec2(0.5));
            float alpha = smoothstep(0.5, 0.1, dist) * (1.0 - uProgress);
            vec3 glowColor = uColor + vec3(sin(uTime * 8.0) * 0.2);
            gl_FragColor = vec4(glowColor, alpha);
        }
    `
};

export const ChronoFaerunWorld: React.FC<ChronoFaerunWorldProps> = ({
    isActive
}) => {
    const shaderRef = useRef<THREE.ShaderMaterial>(null);

    const [combatants, setCombatants] = useState<Combatant[]>([
        {
            id: 'player_eldrin',
            name: 'Eldrin Starweaver',
            type: 'player',
            hp: 32,
            maxHp: 32,
            ac: 15,
            initiative: 18,
            position: [0, 0.5, 4],
            spritePath: '/assets/sprites/mage_idle.png',
            isCurrentTurn: true,
            statusEffects: ['🛡️ Mage Armor', '✨ Blessed']
        },
        {
            id: 'enemy_goblin',
            name: 'Goblin Warlord',
            type: 'enemy',
            hp: 24,
            maxHp: 24,
            ac: 14,
            initiative: 12,
            position: [-5, 0.5, -3],
            spritePath: '/assets/sprites/goblin.png',
            isCurrentTurn: false,
            statusEffects: ['🔥 Burning']
        },
        {
            id: 'enemy_mindflayer',
            name: 'Mind Flayer Sorcerer',
            type: 'boss',
            hp: 48,
            maxHp: 48,
            ac: 16,
            initiative: 8,
            position: [5, 0.5, -5],
            spritePath: '/assets/sprites/mindflayer.png',
            isCurrentTurn: false,
            statusEffects: ['🔮 Psionic Shield']
        }
    ]);

    const [floatingNumbers, setFloatingNumbers] = useState<FloatingDamageNumber[]>([]);
    const [activeSpell, setActiveSpell] = useState<{
        type: 'fireball' | 'frost' | 'lightning';
        pos: [number, number, number];
        progress: number;
    } | null>(null);

    const [combatLogs, setCombatLogs] = useState<string[]>([
        '🏰 Chrono-Faerûn: Netheril Arcane Spire (-339 DR).',
        '⚔️ Encounter Started! Eldrin Starweaver leads turn order (Initiative 18).'
    ]);

    useFrame((state, delta) => {
        if (shaderRef.current) {
            shaderRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
        }

        if (activeSpell) {
            setActiveSpell(prev => {
                if (!prev) return null;
                if (prev.progress >= 1.0) return null;
                return { ...prev, progress: prev.progress + delta * 2.5 };
            });
        }

        setFloatingNumbers(prev => prev
            .map(num => ({
                ...num,
                position: [num.position[0], num.position[1] + delta * 1.5, num.position[2]] as [number, number, number],
                progress: num.progress + delta * 1.2
            }))
            .filter(num => num.progress < 1.0)
        );
    });

    const handleCastSpell = (targetId: string, spellName: string, spellType: 'fireball' | 'frost' | 'lightning') => {
        const target = combatants.find(c => c.id === targetId);
        if (!target) return;

        const d20 = Math.floor(Math.random() * 20) + 1;
        const attackRoll = d20 + 7;
        const isCrit = d20 === 20;
        const hits = attackRoll >= target.ac || isCrit;
        const damage = isCrit ? (Math.floor(Math.random() * 18) + 6) * 2 : (Math.floor(Math.random() * 18) + 6);

        setActiveSpell({
            type: spellType,
            pos: target.position,
            progress: 0.0
        });

        const damageText = hits ? (isCrit ? `CRIT! -${damage}` : `-${damage}`) : 'MISS!';
        const damageColor = hits ? (isCrit ? '#ef4444' : '#f59e0b') : '#94a3b8';

        setFloatingNumbers(prev => [
            ...prev,
            {
                id: `dmg_${Date.now()}_${Math.random()}`,
                text: damageText,
                color: damageColor,
                position: [target.position[0], target.position[1] + 2.0, target.position[2]],
                progress: 0.0
            }
        ]);

        setCombatants(prev => prev.map(c => {
            if (c.id === targetId) {
                return { ...c, hp: Math.max(0, c.hp - (hits ? damage : 0)) };
            }
            return c;
        }));

        const logMsg = hits
            ? `🔥 Eldrin cast ${spellName}! d20: ${d20}+7=${attackRoll} vs AC ${target.ac} (${isCrit ? 'CRITICAL HIT!' : 'HIT!'}). Dealt ${damage} damage to ${target.name}!`
            : `💨 Eldrin cast ${spellName}! d20: ${d20}+7=${attackRoll} vs AC ${target.ac} (MISSED!).`;

        setCombatLogs(prev => [logMsg, ...prev]);
    };

    if (!isActive) return null;

    return (
        <group position={[0, 0, 0]}>
            <ambientLight intensity={1.8} />
            <directionalLight position={[15, 35, 15]} intensity={2.2} castShadow />
            <pointLight position={[0, 12, 0]} intensity={4.0} color="#38bdf8" />

            <gridHelper args={[80, 40, '#38bdf8', '#1e293b']} position={[0, 0.01, 0]} />

            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[80, 1, 80]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.3} />
            </mesh>

            {combatants.map(c => (
                <group key={c.id} position={c.position}>
                    <mesh position={[0, 1.4, 0]} onClick={() => handleCastSpell(c.id, 'Fireball', 'fireball')}>
                        <planeGeometry args={[2.2, 2.6]} />
                        <meshStandardMaterial
                            color={c.type === 'player' ? '#38bdf8' : c.type === 'boss' ? '#a855f7' : '#ef4444'}
                            side={THREE.DoubleSide}
                            transparent
                            opacity={0.95}
                        />
                    </mesh>

                    <group position={[0, 3.0, 0]}>
                        <mesh position={[0, 0, 0]}>
                            <planeGeometry args={[2.0, 0.25]} />
                            <meshBasicMaterial color="#1e293b" />
                        </mesh>
                        <mesh position={[(c.hp / c.maxHp - 1.0), 0, 0.01]}>
                            <planeGeometry args={[(c.hp / c.maxHp) * 2.0, 0.2]} />
                            <meshBasicMaterial color={c.type === 'player' ? '#22c55e' : '#ef4444'} />
                        </mesh>
                    </group>

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                        <ringGeometry args={[1.1, 1.4, 32]} />
                        <meshBasicMaterial color={c.isCurrentTurn ? '#f59e0b' : c.type === 'player' ? '#38bdf8' : '#ef4444'} />
                    </mesh>
                </group>
            ))}

            {activeSpell && (
                <group position={activeSpell.pos}>
                    <mesh scale={1.0 + activeSpell.progress * 5.0}>
                        <sphereGeometry args={[1.2, 32, 32]} />
                        <shaderMaterial
                            ref={shaderRef}
                            attach="material"
                            args={[CustomSpellShaderMaterial]}
                            transparent
                            depthWrite={false}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
};
