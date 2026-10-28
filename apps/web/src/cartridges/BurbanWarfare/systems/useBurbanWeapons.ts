/**
 * BurbanWarfare/systems/useBurbanWeapons.ts
 * 
 * Weapon system, projectile physics, bullet pooling, and collision resolution.
 */

import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { WeaponDefinition, WeaponType, SecondaryItemDefinition, SecondaryItemType, Projectile, EnemyInstance } from '../types';
import { burbanAudio } from './burbanAudio';

const INITIAL_WEAPONS: Record<WeaponType, WeaponDefinition> = {
    water_blaster: {
        id: 'water_blaster',
        name: 'Super Soaker 2000',
        description: 'Fires high-velocity streams of pressurized water.',
        icon: 'Droplets',
        level: 1,
        maxLevel: 5,
        baseDamage: 22,
        fireRate: 4.5, // 4.5 shots / sec
        projectileSpeed: 28,
        projectileCount: 1,
        range: 30,
        areaOfEffect: 0.6,
        color: '#00d2ff',
        isEvolved: false,
        evolutionName: 'Holy Hydro-Cannon'
    },
    pop_grenade: {
        id: 'pop_grenade',
        name: 'Soda Pop Grenade',
        description: 'Shaken fizzy soda cans that bounce and explode in carbonated shrapnel.',
        icon: 'Bomb',
        level: 0,
        maxLevel: 5,
        baseDamage: 45,
        fireRate: 1.2,
        projectileSpeed: 16,
        projectileCount: 1,
        range: 22,
        areaOfEffect: 4.5,
        color: '#ff0055',
        isEvolved: false,
        evolutionName: 'Carbonated Nuke'
    },
    weed_whacker: {
        id: 'weed_whacker',
        name: 'Weed Whacker Aura',
        description: 'High-RPM nylon cutting blades orbiting around the player.',
        icon: 'Disc',
        level: 0,
        maxLevel: 5,
        baseDamage: 14,
        fireRate: 8.0,
        projectileSpeed: 0,
        projectileCount: 2,
        range: 3.5,
        areaOfEffect: 3.5,
        color: '#39ff14',
        isEvolved: false,
        evolutionName: 'Hyper-Chainsaw Cyclone'
    },
    popsicle_blizzard: {
        id: 'popsicle_blizzard',
        name: 'Popsicle Blizzard',
        description: 'Sprays a freezing cone of arctic blue-raspberry ice that chills and slows.',
        icon: 'Snowflake',
        level: 0,
        maxLevel: 5,
        baseDamage: 18,
        fireRate: 2.0,
        projectileSpeed: 18,
        projectileCount: 3,
        range: 15,
        areaOfEffect: 2.0,
        color: '#b0e0e6',
        isEvolved: false,
        evolutionName: 'Liquid Nitrogen Jet'
    },
    inflatable_clown: {
        id: 'inflatable_clown',
        name: 'Inflatable Clown Trap',
        description: 'Deploys a squeaking backyard decoy clown that attracts enemies then pops violently.',
        icon: 'Smile',
        level: 0,
        maxLevel: 5,
        baseDamage: 80,
        fireRate: 0.4,
        projectileSpeed: 0,
        projectileCount: 1,
        range: 5,
        areaOfEffect: 6.0,
        color: '#ffaa00',
        isEvolved: false,
        evolutionName: 'Carnival Jitter Siren'
    }
};

const INITIAL_SECONDARIES: Record<SecondaryItemType, SecondaryItemDefinition> = {
    soda_bomb: {
        id: 'soda_bomb',
        name: 'Fizzy Cherry Bomb',
        description: 'Instant throwable mega explosive.',
        icon: 'Flame',
        count: 5,
        maxCount: 10,
        cooldown: 1.5,
        lastUsed: 0
    },
    first_aid_cooler: {
        id: 'first_aid_cooler',
        name: 'Igloo Lunchbox Snack',
        description: 'Instant +50 HP restoration.',
        icon: 'Heart',
        count: 3,
        maxCount: 5,
        cooldown: 3.0,
        lastUsed: 0
    },
    decoy_clown: {
        id: 'decoy_clown',
        name: 'Pop-Up Decoy Clown',
        description: 'Distracts all nearby zombies for 4 seconds.',
        icon: 'Ghost',
        count: 2,
        maxCount: 4,
        cooldown: 5.0,
        lastUsed: 0
    },
    speed_energy_drink: {
        id: 'speed_energy_drink',
        name: 'Hyper Surge Cola',
        description: 'Gives +80% move speed and invulnerability burst for 3 seconds.',
        icon: 'Zap',
        count: 3,
        maxCount: 5,
        cooldown: 8.0,
        lastUsed: 0
    }
};

export const useBurbanWeapons = () => {
    const [weapons, setWeapons] = useState<Record<WeaponType, WeaponDefinition>>(INITIAL_WEAPONS);
    const [activeWeaponType, setActiveWeaponType] = useState<WeaponType>('water_blaster');
    const [secondaryItems, setSecondaryItems] = useState<Record<SecondaryItemType, SecondaryItemDefinition>>(INITIAL_SECONDARIES);
    const [activeSecondaryType, setActiveSecondaryType] = useState<SecondaryItemType>('soda_bomb');

    const projectilesRef = useRef<Projectile[]>([]);
    const lastFireTimesRef = useRef<Record<WeaponType, number>>({
        water_blaster: 0,
        pop_grenade: 0,
        weed_whacker: 0,
        popsicle_blizzard: 0,
        inflatable_clown: 0
    });

    const weedWhackerAngleRef = useRef<number>(0);

    /**
     * Primary Weapon Fire Trigger
     */
    const firePrimary = useCallback((
        playerPos: THREE.Vector3,
        aimDirection: THREE.Vector3,
        damageMultiplier: number = 1.0,
        fireRateMultiplier: number = 1.0
    ) => {
        const now = performance.now() / 1000;
        const currentWeapon = weapons[activeWeaponType];
        if (!currentWeapon || currentWeapon.level <= 0) return;

        const cooldown = 1 / (currentWeapon.fireRate * fireRateMultiplier);
        if (now - lastFireTimesRef.current[activeWeaponType] < cooldown) return;

        lastFireTimesRef.current[activeWeaponType] = now;

        const effectiveDamage = currentWeapon.baseDamage * damageMultiplier * (1 + (currentWeapon.level - 1) * 0.35);

        if (activeWeaponType === 'water_blaster') {
            burbanAudio.playWaterSquirt();
            const count = currentWeapon.projectileCount + (currentWeapon.level >= 4 ? 1 : 0);
            const spreadAngle = 0.12;

            for (let i = 0; i < count; i++) {
                const angleOffset = count === 1 ? 0 : (i - (count - 1) / 2) * spreadAngle;
                const dir = aimDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset).normalize();

                projectilesRef.current.push({
                    id: `wb_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'water_blaster',
                    position: playerPos.clone().add(new THREE.Vector3(0, 0.6, 0)),
                    velocity: dir.multiplyScalar(currentWeapon.projectileSpeed),
                    damage: effectiveDamage,
                    radius: currentWeapon.areaOfEffect,
                    life: 0,
                    maxLife: currentWeapon.range / currentWeapon.projectileSpeed,
                    color: currentWeapon.color,
                    pierce: currentWeapon.level >= 5 ? 3 : 1,
                    piercedEnemyIds: new Set()
                });
            }
        } else if (activeWeaponType === 'pop_grenade') {
            burbanAudio.playSodaPop();
            const dir = aimDirection.clone().normalize();
            projectilesRef.current.push({
                id: `pop_${Math.random().toString(36).substr(2, 9)}`,
                type: 'pop_grenade',
                position: playerPos.clone().add(new THREE.Vector3(0, 0.6, 0)),
                velocity: dir.multiplyScalar(currentWeapon.projectileSpeed),
                damage: effectiveDamage,
                radius: currentWeapon.areaOfEffect,
                life: 0,
                maxLife: 1.2,
                color: currentWeapon.color,
                pierce: 999,
                piercedEnemyIds: new Set(),
                bounces: 2
            });
        } else if (activeWeaponType === 'popsicle_blizzard') {
            burbanAudio.playWaterSquirt();
            const count = 4;
            const spread = 0.45;
            for (let i = 0; i < count; i++) {
                const angleOffset = (i - (count - 1) / 2) * (spread / count);
                const dir = aimDirection.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset).normalize();

                projectilesRef.current.push({
                    id: `popbliz_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'popsicle_blizzard',
                    position: playerPos.clone().add(new THREE.Vector3(0, 0.6, 0)),
                    velocity: dir.multiplyScalar(currentWeapon.projectileSpeed * (0.8 + Math.random() * 0.4)),
                    damage: effectiveDamage * 0.7,
                    radius: currentWeapon.areaOfEffect,
                    life: 0,
                    maxLife: 0.8,
                    color: currentWeapon.color,
                    pierce: 2,
                    piercedEnemyIds: new Set()
                });
            }
        }
    }, [activeWeaponType, weapons]);

    /**
     * Secondary Item Use Trigger (RMB)
     */
    const useSecondary = useCallback((
        playerPos: THREE.Vector3,
        aimDirection: THREE.Vector3,
        onHealPlayer?: (amount: number) => void,
        onSpeedBoost?: () => void
    ) => {
        const item = secondaryItems[activeSecondaryType];
        if (!item || item.count <= 0) return;

        const now = performance.now() / 1000;
        if (now - item.lastUsed < item.cooldown) return;

        // Decrement item
        setSecondaryItems(prev => ({
            ...prev,
            [activeSecondaryType]: {
                ...prev[activeSecondaryType],
                count: prev[activeSecondaryType].count - 1,
                lastUsed: now
            }
        }));

        if (activeSecondaryType === 'soda_bomb') {
            burbanAudio.playSodaPop();
            const dir = aimDirection.clone().normalize();
            projectilesRef.current.push({
                id: `sodabomb_${Math.random().toString(36).substr(2, 9)}`,
                type: 'pop_grenade',
                position: playerPos.clone().add(new THREE.Vector3(0, 0.8, 0)),
                velocity: dir.multiplyScalar(20),
                damage: 150,
                radius: 7.0,
                life: 0,
                maxLife: 1.0,
                color: '#ff0044',
                pierce: 999,
                piercedEnemyIds: new Set(),
                bounces: 1
            });
        } else if (activeSecondaryType === 'first_aid_cooler') {
            burbanAudio.playGemPickup();
            if (onHealPlayer) onHealPlayer(50);
        } else if (activeSecondaryType === 'speed_energy_drink') {
            burbanAudio.playLevelUp();
            if (onSpeedBoost) onSpeedBoost();
        }
    }, [activeSecondaryType, secondaryItems]);

    /**
     * Cycle Active Primary Weapon (Ctrl / Q)
     */
    const cyclePrimaryWeapon = useCallback(() => {
        const unlockedTypes = (Object.keys(weapons) as WeaponType[]).filter(t => weapons[t].level > 0);
        if (unlockedTypes.length <= 1) return;
        const currentIndex = unlockedTypes.indexOf(activeWeaponType);
        const nextIndex = (currentIndex + 1) % unlockedTypes.length;
        setActiveWeaponType(unlockedTypes[nextIndex]);
    }, [activeWeaponType, weapons]);

    /**
     * Cycle Active Secondary Item (Spacebar)
     */
    const cycleSecondaryItem = useCallback(() => {
        const types: SecondaryItemType[] = ['soda_bomb', 'first_aid_cooler', 'speed_energy_drink'];
        const currentIndex = types.indexOf(activeSecondaryType);
        const nextIndex = (currentIndex + 1) % types.length;
        setActiveSecondaryType(types[nextIndex]);
    }, [activeSecondaryType]);

    /**
     * Upgrade or Unlock a Weapon
     */
    const upgradeWeapon = useCallback((weaponId: WeaponType) => {
        setWeapons(prev => {
            const current = prev[weaponId];
            const nextLevel = Math.min(current.maxLevel, current.level + 1);
            return {
                ...prev,
                [weaponId]: {
                    ...current,
                    level: nextLevel,
                    projectileCount: nextLevel >= 3 ? current.projectileCount + 1 : current.projectileCount,
                    isEvolved: nextLevel >= current.maxLevel
                }
            };
        });
        burbanAudio.playLevelUp();
    }, []);

    /**
     * Frame Step Update (Physics & Hit Resolution)
     */
    const stepProjectiles = useCallback((
        delta: number,
        playerPos: THREE.Vector3,
        enemies: EnemyInstance[],
        onEnemyDamaged: (enemyId: string, damage: number, isFrozen?: boolean) => void
    ) => {
        // Weed Whacker Orbit Update
        const weedWhacker = weapons.weed_whacker;
        if (weedWhacker && weedWhacker.level > 0) {
            weedWhackerAngleRef.current += delta * 7.0;
            const bladeCount = weedWhacker.projectileCount + (weedWhacker.level >= 3 ? 1 : 0);
            const orbitRadius = weedWhacker.range;

            for (let i = 0; i < bladeCount; i++) {
                const angle = weedWhackerAngleRef.current + (i * Math.PI * 2) / bladeCount;
                const bladePos = playerPos.clone().add(new THREE.Vector3(
                    Math.cos(angle) * orbitRadius,
                    0.5,
                    Math.sin(angle) * orbitRadius
                ));

                // Check collision with nearby enemies
                for (const enemy of enemies) {
                    if (bladePos.distanceTo(enemy.position) < weedWhacker.areaOfEffect + enemy.radius) {
                        onEnemyDamaged(enemy.id, weedWhacker.baseDamage * delta * 8);
                        burbanAudio.playWeedWhack();
                    }
                }
            }
        }

        // Standard Projectiles
        const activeProjectiles: Projectile[] = [];

        for (const p of projectilesRef.current) {
            p.life += delta;

            // Move
            p.position.addScaledVector(p.velocity, delta);

            // Bouncing logic for soda cans
            if (p.bounces && p.bounces > 0 && p.position.y < 0.3) {
                p.position.y = 0.3;
                p.velocity.y = -p.velocity.y * 0.6;
            }

            let isExpired = p.life >= p.maxLife;

            // Enemy Collisions
            for (const enemy of enemies) {
                if (p.piercedEnemyIds.has(enemy.id)) continue;

                const dist = p.position.distanceTo(enemy.position);
                if (dist < p.radius + enemy.radius) {
                    p.piercedEnemyIds.add(enemy.id);
                    const isFrozen = p.type === 'popsicle_blizzard';
                    onEnemyDamaged(enemy.id, p.damage, isFrozen);

                    if (p.type === 'pop_grenade' || p.type === 'inflatable_clown') {
                        burbanAudio.playExplosion();
                    } else {
                        burbanAudio.playEnemyHit();
                    }

                    if (p.piercedEnemyIds.size >= p.pierce) {
                        isExpired = true;
                        break;
                    }
                }
            }

            if (!isExpired) {
                activeProjectiles.push(p);
            }
        }

        projectilesRef.current = activeProjectiles;
    }, [weapons]);

    return {
        weapons,
        activeWeaponType,
        setActiveWeaponType,
        secondaryItems,
        activeSecondaryType,
        setActiveSecondaryType,
        projectilesRef,
        firePrimary,
        useSecondary,
        cyclePrimaryWeapon,
        cycleSecondaryItem,
        upgradeWeapon,
        stepProjectiles
    };
};
