/**
 * BurbanWarfare/systems/useBurbanHorde.ts
 * 
 * Enemy horde director, swarm flocking, health, damage, and XP gem drops.
 */

import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { EnemyInstance, EnemyType, GemDrop, NeighborNPC } from '../types';
import { burbanAudio } from './burbanAudio';

const ENEMY_TEMPLATES: Record<EnemyType, {
    name: string;
    maxHp: number;
    speed: number;
    damage: number;
    radius: number;
    color: string;
    xpValue: number;
}> = {
    shuffler: {
        name: 'Suburban Shuffler',
        maxHp: 40,
        speed: 3.2,
        damage: 12,
        radius: 0.55,
        color: '#4ade80',
        xpValue: 10
    },
    toxic_mephit: {
        name: 'Toxic Mephit Swarmer',
        maxHp: 20,
        speed: 5.5,
        damage: 8,
        radius: 0.4,
        color: '#a855f7',
        xpValue: 15
    },
    chainsaw_clone: {
        name: 'Chainsaw Maniac',
        maxHp: 180,
        speed: 2.6,
        damage: 30,
        radius: 0.85,
        color: '#ef4444',
        xpValue: 60
    },
    lawn_ghoul: {
        name: 'Lawn Flamingo Ghoul',
        maxHp: 55,
        speed: 4.0,
        damage: 16,
        radius: 0.5,
        color: '#ec4899',
        xpValue: 20
    },
    alien_spitter: {
        name: 'Martian Weed-Spitter',
        maxHp: 70,
        speed: 2.2,
        damage: 22,
        radius: 0.6,
        color: '#06b6d4',
        xpValue: 35
    }
};

export const useBurbanHorde = () => {
    const enemiesRef = useRef<EnemyInstance[]>([]);
    const gemsRef = useRef<GemDrop[]>([]);
    const [killCount, setKillCount] = useState<number>(0);
    const spawnTimerRef = useRef<number>(0);
    const waveIntensityRef = useRef<number>(1.0);

    /**
     * Spawn an enemy of a specific type around the player
     */
    const spawnEnemy = useCallback((type: EnemyType, playerPos: THREE.Vector3) => {
        const template = ENEMY_TEMPLATES[type];
        const spawnDistance = 20 + Math.random() * 8;
        const angle = Math.random() * Math.PI * 2;
        const spawnPos = new THREE.Vector3(
            playerPos.x + Math.cos(angle) * spawnDistance,
            0.5,
            playerPos.z + Math.sin(angle) * spawnDistance
        );

        const newEnemy: EnemyInstance = {
            id: `enemy_${Math.random().toString(36).substr(2, 9)}`,
            type,
            name: template.name,
            position: spawnPos,
            velocity: new THREE.Vector3(),
            hp: template.maxHp * waveIntensityRef.current,
            maxHp: template.maxHp * waveIntensityRef.current,
            speed: template.speed,
            damage: template.damage,
            radius: template.radius,
            color: template.color,
            xpValue: template.xpValue,
            animFrame: 0,
            facingDirection: 'down',
            isHitFlashing: 0
        };

        enemiesRef.current.push(newEnemy);
    }, []);

    /**
     * Damage an enemy
     */
    const damageEnemy = useCallback((enemyId: string, damage: number, isFrozen: boolean = false) => {
        const enemy = enemiesRef.current.find(e => e.id === enemyId);
        if (!enemy) return;

        enemy.hp -= damage;
        enemy.isHitFlashing = 0.12;

        if (isFrozen) {
            enemy.isFrozen = 2.0; // slowed for 2 seconds
        }

        if (enemy.hp <= 0) {
            // Drop XP Gem
            gemsRef.current.push({
                id: `gem_${Math.random().toString(36).substr(2, 9)}`,
                position: enemy.position.clone(),
                xpValue: enemy.xpValue,
                color: enemy.xpValue >= 50 ? '#facc15' : enemy.xpValue >= 20 ? '#38bdf8' : '#4ade80',
                magnetSpeed: 0,
                isCollected: false
            });

            // Remove enemy
            enemiesRef.current = enemiesRef.current.filter(e => e.id !== enemyId);
            setKillCount(k => k + 1);
        }
    }, []);

    /**
     * Frame Step Update (Movement, Spawning, Gem Attraction)
     */
    const stepHorde = useCallback((
        delta: number,
        elapsedTime: number,
        playerPos: THREE.Vector3,
        neighbors: NeighborNPC[],
        playerMagnetRadius: number,
        onPlayerDamaged: (dmg: number) => void,
        onGemCollected: (xp: number) => void
    ) => {
        // Ramp wave intensity over time
        waveIntensityRef.current = 1.0 + Math.floor(elapsedTime / 45) * 0.25;

        // Wave Spawner Clock
        spawnTimerRef.current += delta;
        const spawnInterval = Math.max(0.35, 1.2 - (elapsedTime / 120) * 0.6);

        if (spawnTimerRef.current >= spawnInterval && enemiesRef.current.length < 80) {
            spawnTimerRef.current = 0;

            // Pick mob type based on elapsed time
            const roll = Math.random();
            let type: EnemyType = 'shuffler';
            if (elapsedTime > 90 && roll < 0.2) {
                type = 'chainsaw_clone';
            } else if (elapsedTime > 50 && roll < 0.35) {
                type = 'alien_spitter';
            } else if (elapsedTime > 25 && roll < 0.5) {
                type = 'lawn_ghoul';
            } else if (roll < 0.4) {
                type = 'toxic_mephit';
            }

            spawnEnemy(type, playerPos);
        }

        // Move Enemies toward Player or nearest Neighbor
        for (const enemy of enemiesRef.current) {
            // Hit flash tick
            if (enemy.isHitFlashing > 0) {
                enemy.isHitFlashing -= delta;
            }
            if (enemy.isFrozen && enemy.isFrozen > 0) {
                enemy.isFrozen -= delta;
            }

            // Target selection: Nearest active neighbor or Player
            let targetPos = playerPos;
            let minDist = playerPos.distanceTo(enemy.position);

            for (const n of neighbors) {
                if (!n.isSaved && !n.isLost) {
                    const distToN = n.position.distanceTo(enemy.position);
                    if (distToN < 8.0 && distToN < minDist) {
                        targetPos = n.position;
                        minDist = distToN;
                    }
                }
            }

            // Direction calculation
            const dir = new THREE.Vector3().subVectors(targetPos, enemy.position).setY(0);
            const dist = dir.length();

            if (dist > 0.1) {
                dir.normalize();
                const effectiveSpeed = enemy.isFrozen && enemy.isFrozen > 0 ? enemy.speed * 0.4 : enemy.speed;
                enemy.position.addScaledVector(dir, effectiveSpeed * delta);

                // Update facing
                if (Math.abs(dir.x) > Math.abs(dir.z)) {
                    enemy.facingDirection = dir.x > 0 ? 'right' : 'left';
                } else {
                    enemy.facingDirection = dir.z > 0 ? 'down' : 'up';
                }
            }

            // Attack Player collision
            if (enemy.position.distanceTo(playerPos) < enemy.radius + 0.6) {
                onPlayerDamaged(enemy.damage * delta * 1.5);
            }
        }

        // Step Gems (Magnet Attraction)
        const activeGems: GemDrop[] = [];
        for (const gem of gemsRef.current) {
            const distToPlayer = gem.position.distanceTo(playerPos);

            if (distToPlayer < playerMagnetRadius) {
                // Accelerate toward player
                gem.magnetSpeed = Math.min(25, gem.magnetSpeed + delta * 30);
                const dir = new THREE.Vector3().subVectors(playerPos, gem.position).normalize();
                gem.position.addScaledVector(dir, gem.magnetSpeed * delta);
            }

            if (distToPlayer < 0.8) {
                burbanAudio.playGemPickup();
                onGemCollected(gem.xpValue);
            } else {
                activeGems.push(gem);
            }
        }
        gemsRef.current = activeGems;
    }, [spawnEnemy]);

    return {
        enemiesRef,
        gemsRef,
        killCount,
        damageEnemy,
        stepHorde
    };
};
