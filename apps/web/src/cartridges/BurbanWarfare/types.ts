/**
 * BurbanWarfare/types.ts
 * 
 * Game types and data structures for 'Burban Warfare
 * (2.5D Isometric Suburban Horde Survivor).
 */

import * as THREE from 'three';

export type WeaponType = 'water_blaster' | 'pop_grenade' | 'weed_whacker' | 'popsicle_blizzard' | 'inflatable_clown';

export type SecondaryItemType = 'soda_bomb' | 'first_aid_cooler' | 'decoy_clown' | 'speed_energy_drink';

export interface WeaponDefinition {
    id: WeaponType;
    name: string;
    description: string;
    icon: string;
    level: number;
    maxLevel: number;
    baseDamage: number;
    fireRate: number; // shots per second
    projectileSpeed: number;
    projectileCount: number;
    range: number;
    areaOfEffect: number;
    color: string;
    isEvolved?: boolean;
    evolutionName?: string;
}

export interface SecondaryItemDefinition {
    id: SecondaryItemType;
    name: string;
    description: string;
    icon: string;
    count: number;
    maxCount: number;
    cooldown: number; // seconds
    lastUsed: number;
}

export interface Projectile {
    id: string;
    type: WeaponType;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    damage: number;
    radius: number;
    life: number; // in seconds
    maxLife: number;
    color: string;
    pierce: number;
    piercedEnemyIds: Set<string>;
    bounces?: number;
    isOrbital?: boolean;
    orbitAngle?: number;
    orbitDistance?: number;
}

export type EnemyType = 'shuffler' | 'toxic_mephit' | 'chainsaw_clone' | 'lawn_ghoul' | 'alien_spitter';

export interface EnemyInstance {
    id: string;
    type: EnemyType;
    name: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    hp: number;
    maxHp: number;
    speed: number;
    damage: number;
    radius: number;
    color: string;
    xpValue: number;
    animFrame: number;
    facingDirection: 'down' | 'left' | 'right' | 'up';
    isHitFlashing: number; // timer in seconds
    isFrozen?: number;
}

export interface NeighborNPC {
    id: string;
    name: string;
    role: string;
    title: string;
    dialogue: string;
    position: THREE.Vector3;
    isSaved: boolean;
    isLost: boolean;
    hp: number;
    maxHp: number;
    relicName: string;
    relicDescription: string;
    relicIcon: string;
    avatarColor: string;
    distressTimer: number; // when enemies are near
}

export interface GemDrop {
    id: string;
    position: THREE.Vector3;
    xpValue: number;
    color: string;
    magnetSpeed: number;
    isCollected: boolean;
}

export interface RelicInstance {
    id: string;
    name: string;
    description: string;
    icon: string;
    statMultiplier: {
        damage?: number;
        speed?: number;
        fireRate?: number;
        magnetRadius?: number;
        armorMelt?: number;
        hpRegen?: number;
    };
}

export interface UpgradeCard {
    id: string;
    title: string;
    type: 'weapon_new' | 'weapon_upgrade' | 'stat_boost' | 'relic_power';
    weaponId?: WeaponType;
    description: string;
    icon: string;
    levelAfter?: number;
}

export interface PlayerStats {
    hp: number;
    maxHp: number;
    level: number;
    xp: number;
    xpToNextLevel: number;
    moveSpeed: number;
    damageMultiplier: number;
    fireRateMultiplier: number;
    magnetRadius: number;
    kills: number;
    neighborsSaved: number;
    neighborsLost: number;
}
