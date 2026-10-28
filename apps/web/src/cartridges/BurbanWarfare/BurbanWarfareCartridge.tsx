/**
 * BurbanWarfare/BurbanWarfareCartridge.tsx
 * 
 * Master Cartridge: 'Burban Warfare (60-120 FPS Optimized)
 * Decoupled simulation loop running on refs with throttled HUD updates.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { BurbanCanvas } from './BurbanCanvas';
import { BurbanHUD } from './BurbanHUD';
import { BurbanLevelUpModal } from './BurbanLevelUpModal';
import { useBurbanWeapons } from './systems/useBurbanWeapons';
import { useBurbanHorde } from './systems/useBurbanHorde';
import { useBurbanNeighbors } from './systems/useBurbanNeighbors';
import type { PlayerStats, UpgradeCard, RelicInstance, NeighborNPC } from './types';
import { burbanAudio } from './systems/burbanAudio';
import type { CartridgeProps } from '../Cartridge';

export const BurbanWarfareCartridge: React.FC<CartridgeProps> = ({ onClose }) => {
    // High-performance direct refs (0 React re-renders during motion)
    const playerPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.5, 0));
    const aimDirectionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 1));
    const isFiringRef = useRef<boolean>(false);

    // Progression & Stats (Updated on events / throttled)
    const [stats, setStats] = useState<PlayerStats>({
        hp: 100,
        maxHp: 100,
        level: 1,
        xp: 0,
        xpToNextLevel: 50,
        moveSpeed: 1.0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        magnetRadius: 4.5,
        kills: 0,
        neighborsSaved: 0,
        neighborsLost: 0
    });

    const statsRef = useRef<PlayerStats>(stats);
    statsRef.current = stats;

    const [isLevelingUp, setIsLevelingUp] = useState<boolean>(false);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
    const elapsedSecondsRef = useRef<number>(0);

    // Systems hooks
    const {
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
    } = useBurbanWeapons();

    const {
        enemiesRef,
        gemsRef,
        killCount,
        damageEnemy,
        stepHorde
    } = useBurbanHorde();

    const {
        neighbors,
        activeRelics,
        latestSavedNeighbor,
        clearLatestToast,
        stepNeighbors
    } = useBurbanNeighbors();

    const neighborsRef = useRef<NeighborNPC[]>(neighbors);
    neighborsRef.current = neighbors;

    // Relic buff handler
    const handleRelicAwarded = useCallback((relic: RelicInstance) => {
        setStats(s => {
            const next = { ...s, neighborsSaved: s.neighborsSaved + 1 };
            if (relic.statMultiplier.damage) next.damageMultiplier += relic.statMultiplier.damage;
            if (relic.statMultiplier.speed) next.moveSpeed += relic.statMultiplier.speed;
            if (relic.statMultiplier.fireRate) next.fireRateMultiplier += relic.statMultiplier.fireRate;
            if (relic.statMultiplier.magnetRadius) next.magnetRadius += relic.statMultiplier.magnetRadius;
            return next;
        });
    }, []);

    // XP Gem Collection & Level Up Trigger
    const handleGemCollected = useCallback((xpValue: number) => {
        setStats(prev => {
            const nextXp = prev.xp + xpValue;
            if (nextXp >= prev.xpToNextLevel) {
                setIsLevelingUp(true);
                burbanAudio.playLevelUp();
                return {
                    ...prev,
                    level: prev.level + 1,
                    xp: nextXp - prev.xpToNextLevel,
                    xpToNextLevel: Math.floor(prev.xpToNextLevel * 1.45)
                };
            }
            return { ...prev, xp: nextXp };
        });
    }, []);

    // Player Damaged
    const handlePlayerDamaged = useCallback((damage: number) => {
        setStats(prev => {
            const nextHp = prev.hp - damage;
            if (nextHp <= 0 && !isGameOver) {
                setIsGameOver(true);
                burbanAudio.playExplosion();
                return { ...prev, hp: 0 };
            }
            return { ...prev, hp: nextHp };
        });
    }, [isGameOver]);

    // Upgrade Card Selected
    const handleSelectUpgrade = useCallback((card: UpgradeCard) => {
        if (card.type === 'weapon_new' || card.type === 'weapon_upgrade') {
            if (card.weaponId) {
                upgradeWeapon(card.weaponId);
            }
        } else if (card.id === 'stat_speed') {
            setStats(s => ({ ...s, moveSpeed: s.moveSpeed + 0.2 }));
        } else if (card.id === 'stat_damage') {
            setStats(s => ({ ...s, damageMultiplier: s.damageMultiplier + 0.25 }));
        } else if (card.id === 'stat_magnet') {
            setStats(s => ({ ...s, magnetRadius: s.magnetRadius + 8.0 }));
        } else if (card.id === 'stat_health') {
            setStats(s => ({ ...s, maxHp: s.maxHp + 40, hp: s.maxHp + 40 }));
        }

        setIsLevelingUp(false);
    }, [upgradeWeapon]);

    // Keyboard Hotkeys
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLevelingUp || isGameOver) return;

            if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.code === 'KeyQ') {
                cyclePrimaryWeapon();
            } else if (e.code === 'Space') {
                cycleSecondaryItem();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cyclePrimaryWeapon, cycleSecondaryItem, isLevelingUp, isGameOver]);

    // Master Simulation Loop (Running purely in memory & RAF without triggering React renders)
    useEffect(() => {
        let lastTime = performance.now();
        let animationFrameId: number;
        let hudUpdateTimer = 0;

        const loop = (currentTime: number) => {
            const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;

            if (!isLevelingUp && !isGameOver) {
                elapsedSecondsRef.current += delta;

                // Continuous Primary Fire
                if (isFiringRef.current) {
                    firePrimary(
                        playerPosRef.current,
                        aimDirectionRef.current,
                        statsRef.current.damageMultiplier,
                        statsRef.current.fireRateMultiplier
                    );
                }

                // Step Projectiles
                stepProjectiles(delta, playerPosRef.current, enemiesRef.current, damageEnemy);

                // Step Horde
                stepHorde(
                    delta,
                    elapsedSecondsRef.current,
                    playerPosRef.current,
                    neighborsRef.current,
                    statsRef.current.magnetRadius,
                    handlePlayerDamaged,
                    handleGemCollected
                );

                // Step Neighbors
                stepNeighbors(delta, playerPosRef.current, enemiesRef.current, handleRelicAwarded);

                // Throttled HUD update (4 times a second, 250ms)
                hudUpdateTimer += delta;
                if (hudUpdateTimer >= 0.25) {
                    hudUpdateTimer = 0;
                    setElapsedSeconds(Math.floor(elapsedSecondsRef.current));
                    setStats(s => ({ ...s, kills: killCount }));
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [
        isLevelingUp,
        isGameOver,
        firePrimary,
        stepProjectiles,
        stepHorde,
        stepNeighbors,
        damageEnemy,
        handlePlayerDamaged,
        handleGemCollected,
        handleRelicAwarded,
        killCount
    ]);

    // Pointer events for Canvas
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (isLevelingUp || isGameOver) return;
        if (e.button === 0) {
            isFiringRef.current = true;
            firePrimary(
                playerPosRef.current, 
                aimDirectionRef.current, 
                statsRef.current.damageMultiplier, 
                statsRef.current.fireRateMultiplier
            );
        } else if (e.button === 2) {
            useSecondary(
                playerPosRef.current,
                aimDirectionRef.current,
                (heal) => setStats(s => ({ ...s, hp: Math.min(s.maxHp, s.hp + heal) })),
                () => setStats(s => ({ ...s, moveSpeed: s.moveSpeed * 1.8 }))
            );
        }
    }, [isLevelingUp, isGameOver, firePrimary, useSecondary]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (e.button === 0) {
            isFiringRef.current = false;
        }
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
    }, []);

    const activeWeapon = weapons[activeWeaponType];
    const activeSecondary = secondaryItems[activeSecondaryType];

    return (
        <div className="w-full h-full bg-slate-950 relative overflow-hidden select-none">
            {/* --- HUD OVERLAY --- */}
            <BurbanHUD
                stats={stats}
                activeWeapon={activeWeapon}
                allWeapons={Object.values(weapons)}
                activeSecondary={activeSecondary}
                allSecondaries={Object.values(secondaryItems)}
                neighbors={neighbors}
                activeRelics={activeRelics}
                elapsedSeconds={elapsedSeconds}
                savedNeighborToast={latestSavedNeighbor}
                onDismissToast={clearLatestToast}
            />

            {/* --- 3D ISOMETRIC VIEWPORT --- */}
            <BurbanCanvas
                playerPosRef={playerPosRef}
                aimDirectionRef={aimDirectionRef}
                isFiringRef={isFiringRef}
                activeWeapon={activeWeapon}
                weedWhackerLevel={weapons.weed_whacker.level}
                speedMultiplier={stats.moveSpeed}
                projectilesRef={projectilesRef}
                enemiesRef={enemiesRef}
                neighborsRef={neighborsRef}
                gemsRef={gemsRef}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onContextMenu={handleContextMenu}
            />

            {/* --- LEVEL UP MODAL --- */}
            {isLevelingUp && (
                <BurbanLevelUpModal
                    level={stats.level}
                    weapons={weapons}
                    onSelectUpgrade={handleSelectUpgrade}
                />
            )}

            {/* --- GAME OVER MODAL --- */}
            {isGameOver && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center font-mono">
                    <h2 className="text-red-500 font-black text-4xl uppercase tracking-widest animate-pulse mb-2">
                        THE HORDE OVERRAN THE BLOCK!
                    </h2>
                    <p className="text-white/70 text-sm mb-6">
                        You survived for <span className="text-yellow-400 font-bold">{Math.floor(elapsedSeconds)} seconds</span> and defeated <span className="text-rose-400 font-bold">{stats.kills} monsters</span>!
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-wider rounded-xl shadow-lg transition-all"
                    >
                        Play Again (Restart)
                    </button>
                </div>
            )}
        </div>
    );
};

export default BurbanWarfareCartridge;
