/**
 * BurbanWarfare/systems/useBurbanNeighbors.ts
 * 
 * Manages the 5 iconic suburban neighbors in need of rescue,
 * their distress timers, rescue triggers, and game-changing relic rewards.
 */

import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { NeighborNPC, RelicInstance, EnemyInstance } from '../types';
import { burbanAudio } from './burbanAudio';

const INITIAL_NEIGHBORS: NeighborNPC[] = [
    {
        id: 'bbq_dad',
        name: 'Big Bob',
        role: 'Grill Master',
        title: 'Barbecue Dad',
        dialogue: "Hey kid! Grab a burger, these zombies are trying to ruin my medium-rare brisket!",
        position: new THREE.Vector3(14, 0.5, 9),
        isSaved: false,
        isLost: false,
        hp: 100,
        maxHp: 100,
        relicName: 'Grill Master Spatula',
        relicDescription: '+25% All Weapon Damage & sets close enemies on fire.',
        relicIcon: 'Flame',
        avatarColor: '#f97316',
        distressTimer: 0
    },
    {
        id: 'cheerleader',
        name: 'Tiffany',
        role: 'Varsity Captain',
        title: 'Sunnyvale Cheerleader',
        dialogue: "Ewww, gross! Get away from my pom-poms, you mutated creeps!",
        position: new THREE.Vector3(-15, 0.5, 12),
        isSaved: false,
        isLost: false,
        hp: 100,
        maxHp: 100,
        relicName: 'Spirit Pom-Poms',
        relicDescription: '+30% Movement Speed & lightning bursts on dodge.',
        relicIcon: 'Zap',
        avatarColor: '#ec4899',
        distressTimer: 0
    },
    {
        id: 'doggo',
        name: 'Barnaby',
        role: 'Goodest Boy',
        title: 'Neighborhood Golden Retriever',
        dialogue: "*Happy Bark!* Barnaby retrieved a tennis ball and wants to fetch all your XP!",
        position: new THREE.Vector3(-10, 0.5, -16),
        isSaved: false,
        isLost: false,
        hp: 100,
        maxHp: 100,
        relicName: 'Golden Tennis Ball',
        relicDescription: '+12m XP Gem Magnet Pickup Radius.',
        relicIcon: 'Compass',
        avatarColor: '#eab308',
        distressTimer: 0
    },
    {
        id: 'science_kid',
        name: 'Dexter',
        role: 'Junior Chemist',
        title: 'Chemistry Whiz Kid',
        dialogue: "Fascinating! Their cellular structure is completely destabilized by carbonated acid!",
        position: new THREE.Vector3(18, 0.5, -14),
        isSaved: false,
        isLost: false,
        hp: 100,
        maxHp: 100,
        relicName: 'Flask of Acid',
        relicDescription: '+20% Fire Rate & melts monster armor.',
        relicIcon: 'FlaskConical',
        avatarColor: '#06b6d4',
        distressTimer: 0
    },
    {
        id: 'trampoline_grandma',
        name: 'Nana Helen',
        role: 'Garden Queen',
        title: 'Acrobatic Grandma',
        dialogue: "Hold my iced tea, sonny! These ghouls picked the wrong flowerbed to trample!",
        position: new THREE.Vector3(0, 0.5, 20),
        isSaved: false,
        isLost: false,
        hp: 100,
        maxHp: 100,
        relicName: 'Nana\'s Homemade Casserole',
        relicDescription: 'Passive +3 HP/sec Health Regeneration.',
        relicIcon: 'HeartPulse',
        avatarColor: '#a855f7',
        distressTimer: 0
    }
];

export const useBurbanNeighbors = () => {
    const [neighbors, setNeighbors] = useState<NeighborNPC[]>(INITIAL_NEIGHBORS);
    const [activeRelics, setActiveRelics] = useState<RelicInstance[]>([]);
    const [latestSavedNeighbor, setLatestSavedNeighbor] = useState<NeighborNPC | null>(null);

    /**
     * Check if player reached a neighbor or if enemies are hurting them
     */
    const stepNeighbors = useCallback((
        delta: number,
        playerPos: THREE.Vector3,
        enemies: EnemyInstance[],
        onRelicAwarded: (relic: RelicInstance) => void
    ) => {
        setNeighbors(prev => {
            let updated = false;
            const next = prev.map(neighbor => {
                if (neighbor.isSaved || neighbor.isLost) return neighbor;

                // Check player proximity for rescue
                const distToPlayer = playerPos.distanceTo(neighbor.position);
                if (distToPlayer < 2.0) {
                    updated = true;
                    burbanAudio.playNeighborSaved();
                    setLatestSavedNeighbor(neighbor);

                    const newRelic: RelicInstance = {
                        id: `relic_${neighbor.id}`,
                        name: neighbor.relicName,
                        description: neighbor.relicDescription,
                        icon: neighbor.relicIcon,
                        statMultiplier: {
                            damage: neighbor.id === 'bbq_dad' ? 0.25 : undefined,
                            speed: neighbor.id === 'cheerleader' ? 0.30 : undefined,
                            magnetRadius: neighbor.id === 'doggo' ? 12 : undefined,
                            fireRate: neighbor.id === 'science_kid' ? 0.20 : undefined,
                            hpRegen: neighbor.id === 'trampoline_grandma' ? 3.0 : undefined
                        }
                    };

                    setActiveRelics(r => [...r, newRelic]);
                    onRelicAwarded(newRelic);

                    return {
                        ...neighbor,
                        isSaved: true
                    };
                }

                // Check nearby enemies inflicting damage
                let takingDamage = 0;
                for (const enemy of enemies) {
                    if (enemy.position.distanceTo(neighbor.position) < enemy.radius + 1.0) {
                        takingDamage += enemy.damage * delta * 0.8;
                    }
                }

                if (takingDamage > 0) {
                    updated = true;
                    const nextHp = neighbor.hp - takingDamage;
                    if (nextHp <= 0) {
                        return { ...neighbor, hp: 0, isLost: true };
                    }
                    return { ...neighbor, hp: nextHp, distressTimer: 2.0 };
                }

                if (neighbor.distressTimer > 0) {
                    return { ...neighbor, distressTimer: neighbor.distressTimer - delta };
                }

                return neighbor;
            });

            return updated ? next : prev;
        });
    }, []);

    const clearLatestToast = useCallback(() => {
        setLatestSavedNeighbor(null);
    }, []);

    return {
        neighbors,
        activeRelics,
        latestSavedNeighbor,
        clearLatestToast,
        stepNeighbors
    };
};
