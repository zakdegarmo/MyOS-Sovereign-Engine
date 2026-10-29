import { useState, useCallback, useEffect, useRef } from 'react';

export interface CombatEntity {
    id: string;
    type: 'hero' | 'drone' | 'projectile' | 'fragment' | 'boss' | 'particle';
    position: [number, number, number];
    velocity: [number, number, number];
    health: number;
    maxHealth: number;
    isSecured?: boolean;
    isCompromised?: boolean;
    spriteUrl?: string;
    npcId?: string; // For Hexroll NPCs
    isFollower?: boolean;
    pillarId?: string; // If it's a Pillar boss
    layers?: any[]; // For voxelization of the boss
    life?: number; // Lifetime for particles
    color?: string; // Color for particles
}


export const useActionCombat = () => {
    const [entities, setEntities] = useState<CombatEntity[]>([]);
    const [isCombatActive, setIsCombatActive] = useState(false);

    // Movement Keys for SELF (The Hero)
    const keysPressed = useRef<Record<string, boolean>>({});

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        keysPressed.current[e.key.toLowerCase()] = true;
    }, []);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        keysPressed.current[e.key.toLowerCase()] = false;
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Main Combat Tick (Movement & AI)
    useEffect(() => {
        if (!isCombatActive) return;

        const tick = setInterval(() => {
            setEntities(prev => {
                const hero = prev.find(e => e.type === 'hero');
                const newSecured: string[] = [];
                const next = prev.map(e => {
                    if (e.type === 'hero') {
                        // Hero movement (Internal keys)
                        const speed = 0.5;
                        let dx = 0; let dy = 0; let dz = 0;
                        if (keysPressed.current['w']) dz -= speed;
                        if (keysPressed.current['s']) dz += speed;
                        if (keysPressed.current['a']) dx -= speed;
                        if (keysPressed.current['d']) dx += speed;
                        if (keysPressed.current[' ']) dy += speed;
                        if (keysPressed.current['shift']) dy -= speed;
                        
                        return { 
                            ...e, 
                            position: [e.position[0] + dx, e.position[1] + dy, e.position[2] + dz] as [number, number, number] 
                        };
                    }
                    if (e.type === 'fragment' && !e.isSecured && hero) {
                        const dist = Math.sqrt(
                            Math.pow(hero.position[0] - e.position[0], 2) +
                            Math.pow(hero.position[1] - e.position[1], 2) +
                            Math.pow(hero.position[2] - e.position[2], 2)
                        );
                        if (dist < 1.5) {
                            newSecured.push(e.id);
                            return { ...e, isSecured: true };
                        }
                    }
                    if (e.type === 'drone' && hero) {
                        const chaseSpeed = 0.1;
                        const dx = hero.position[0] - e.position[0];
                        const dz = hero.position[2] - e.position[2];
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist > 1) {
                            return { ...e, position: [e.position[0] + (dx / dist) * chaseSpeed, e.position[1], e.position[2] + (dz / dist) * chaseSpeed] as [number, number, number] };
                        }
                    }
                    if (e.type === 'boss' && hero) {
                        const time = Date.now() * 0.001;
                        return { ...e, position: [hero.position[0] + Math.cos(time) * 10, 5 + Math.sin(time * 2), hero.position[2] + Math.sin(time) * 10] as [number, number, number] };
                    }
                    if (e.type === 'projectile') {
                        return { ...e, position: [e.position[0] + e.velocity[0], e.position[1] + e.velocity[1], e.position[2] + e.velocity[2]] as [number, number, number] };
                    }
                    if (e.type === 'particle') {
                        const newLife = (e.life || 0) - 1;
                        if (newLife <= 0) return null; // Marked for deletion

                        const nextVy = e.velocity[1] - 0.05; // Gravity
                        let nextY = e.position[1] + nextVy;
                        let nextVx = e.velocity[0];
                        let nextVz = e.velocity[2];

                        if (nextY <= 0) {
                            nextY = 0;
                            return {
                                ...e,
                                life: newLife,
                                position: [e.position[0] + nextVx, nextY, e.position[2] + nextVz] as [number, number, number],
                                velocity: [nextVx * 0.8, -nextVy * 0.5, nextVz * 0.8] as [number, number, number]
                            };
                        }

                        return {
                            ...e,
                            life: newLife,
                            position: [e.position[0] + nextVx, nextY, e.position[2] + nextVz] as [number, number, number],
                            velocity: [nextVx, nextVy, nextVz] as [number, number, number]
                        };
                    }
                    if (e.isFollower && hero) {
                        const followDist = 2.5; // Desired distance from lead
                        const followSpeed = 0.12;
                        const dx = hero.position[0] - e.position[0];
                        const dz = hero.position[2] - e.position[2];
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        
                        if (dist > followDist) {
                            // Move towards lead
                            return { 
                                ...e, 
                                position: [
                                    e.position[0] + (dx / dist) * followSpeed, 
                                    e.position[1], 
                                    e.position[2] + (dz / dist) * followSpeed
                                ] as [number, number, number] 
                            };
                        } else {
                            // --- AI ASSISTANT LOGIC ---
                            // If an enemy is close, occasionally "help" the player
                            const enemies = prev.filter(en => en.type === 'drone' || en.type === 'boss');
                            const nearestEnemy = enemies.reduce((prevE, currE) => {
                                const dPrev = Math.sqrt(Math.pow(prevE.position[0] - e.position[0], 2) + Math.pow(prevE.position[2] - e.position[2], 2));
                                const dCurr = Math.sqrt(Math.pow(currE.position[0] - e.position[0], 2) + Math.pow(currE.position[2] - e.position[2], 2));
                                return dCurr < dPrev ? currE : prevE;
                            }, enemies[0]);

                            if (nearestEnemy) {
                                const dToEnemy = Math.sqrt(Math.pow(nearestEnemy.position[0] - e.position[0], 2) + Math.pow(nearestEnemy.position[2] - e.position[2], 2));
                                if (dToEnemy < 12 && Math.random() < 0.02) {
                                    spawnProjectile(e.position, nearestEnemy.position, true);
                                    console.log(`[TUTOR CONTROL] Follower assistance active: ${e.npcId} targeting ${nearestEnemy.id}`);
                                }
                            }
                        }
                    }
                    return e;
                }).filter(Boolean) as CombatEntity[];

                if (newSecured.length > 0) {
                    setTimeout(() => {
                        setCollisionLogs(logs => [
                            ...newSecured.map(id => ({ time: Date.now(), msg: `Fragment ${id.substring(0, 8)} SECURED` })),
                            ...logs.slice(0, 5)
                        ]);
                    }, 0);
                }

                return next;
            });
        }, 32); 

        return () => clearInterval(tick);
    }, [isCombatActive]);

    const [collisionLogs, setCollisionLogs] = useState<{time: number, msg: string}[]>([]);

    const spawnProjectile = useCallback((from: [number, number, number], to: [number, number, number], isFriendly = true) => {
        const dx = to[0] - from[0];
        const dy = to[1] - from[1];
        const dz = to[2] - from[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const speed = 0.5;
        
        setEntities(prev => [...prev, {
            id: `proj-${Date.now()}-${Math.random()}`,
            type: 'particle',
            position: [from[0], from[1] + 1.5, from[2]],
            velocity: [(dx / dist) * speed, (dy / dist) * speed, (dz / dist) * speed],
            life: 60, // frames
            color: isFriendly ? '#00ccff' : '#ff3300',
            health: 1,
            maxHealth: 1
        }]);
    }, []);

    const spawnDrone = useCallback((position: [number, number, number]) => {
        const id = `drone-${Date.now()}-${Math.random()}`;
        setEntities(prev => [...prev, {
            id,
            type: 'drone',
            position,
            velocity: [0, 0, 0],
            health: 100,
            maxHealth: 100,
            spriteUrl: '/assets/lpc/Skorpios_Sprite_Pack/Skorpio\'s Pack/Cutiebots/Cutiebot1.png'
        }]);
    }, []);

    const spawnParticleBurst = useCallback((position: [number, number, number], count: number = 10, color: string = '#ff0055') => {
        setEntities(prev => {
            const particles: CombatEntity[] = Array.from({ length: count }).map((_, i) => ({
                id: `particle-${Date.now()}-${i}-${Math.random()}`,
                type: 'particle',
                position: [...position] as [number, number, number],
                velocity: [(Math.random() - 0.5) * 1.5, Math.random() * 1.0 + 0.5, (Math.random() - 0.5) * 1.5],
                health: 1, maxHealth: 1,
                life: 30 + Math.random() * 30, // 30-60 frames
                color
            }));
            return [...prev, ...particles];
        });
    }, []);

    const spawnFragment = useCallback((position: [number, number, number]) => {
        const id = `fragment-${Date.now()}-${Math.random()}`;
        setEntities(prev => [...prev, {
            id,
            type: 'fragment',
            position,
            velocity: [0, 0, 0],
            health: 50,
            maxHealth: 50,
            isSecured: false,
            isCompromised: false
        }]);
    }, []);

    const spawnFragments = useCallback((count: number, range: [number, number] = [-50, 50]) => {
        const newFrags = Array.from({ length: count }).map((_, i) => ({
            id: `fragment-${Date.now()}-${i}-${Math.random()}`,
            type: 'fragment' as const,
            position: [
                Math.random() * (range[1] - range[0]) + range[0],
                1,
                Math.random() * (range[1] - range[0]) + range[0]
            ] as [number, number, number],
            velocity: [0, 0, 0] as [number, number, number],
            health: 50,
            maxHealth: 50,
            isSecured: false,
            isCompromised: false
        }));
        setEntities(prev => [...prev, ...newFrags]);
    }, []);

    const spawnCustomSprite = useCallback((imageUrl: string, position: [number, number, number]) => {
        const id = `custom-${Date.now()}-${Math.random()}`;
        setEntities(prev => [...prev, {
            id,
            type: 'fragment', // Reusing fragment for now as a generic entity type
            position,
            velocity: [0, 0, 0],
            health: 100,
            maxHealth: 100,
            isSecured: false,
            spriteUrl: imageUrl
        }]);

    }, []);

    const spawnParty = useCallback((partyMemberIds: string[], leadId: string) => {
        setEntities(prev => {
            const newEntities = [...prev];
            partyMemberIds.forEach((id, index) => {
                const isLead = id === leadId;
                const existing = newEntities.find(e => e.npcId === id);
                if (existing) {
                    existing.type = isLead ? 'hero' : 'fragment';
                    existing.isFollower = !isLead;
                } else {
                    newEntities.push({
                        id: `party-${id}-${Date.now()}`,
                        npcId: id,
                        type: isLead ? 'hero' : 'fragment',
                        isFollower: !isLead,
                        position: [isLead ? 0 : (index * 2), 0, isLead ? 0 : (index * 2)],
                        velocity: [0, 0, 0],
                        health: 100,
                        maxHealth: 100
                    });
                }
            });
            return newEntities;
        });
    }, []);

    const startCombat = useCallback((partyMemberIds?: string[], activeLeadId?: string) => {
        setIsCombatActive(true);
        if (partyMemberIds && activeLeadId) {
            spawnParty(partyMemberIds, activeLeadId);
        } else {
            // Fallback for single hero
            setEntities(prev => {
                if (prev.some(e => e.type === 'hero')) return prev;
                return [{
                    id: 'hero-self',
                    type: 'hero',
                    position: [0, 0, 0],
                    velocity: [0, 0, 0],
                    health: 100,
                    maxHealth: 100
                }, ...prev];
            });
        }
    }, [spawnParty]);

    const stopCombat = useCallback(() => {
        setIsCombatActive(false);
        setEntities(prev => prev.filter(e => e.type === 'hero'));
    }, []);

    const spawnBoss = useCallback((pillarId: string, layers: any[], position: [number, number, number]) => {
        const id = `boss-${pillarId}-${Date.now()}`;
        setEntities(prev => [...prev, {
            id,
            type: 'boss',
            pillarId,
            layers,
            position,
            velocity: [0, 0, 0],
            health: 1000,
            maxHealth: 1000
        }]);
    }, []);

    const fireProjectile = useCallback((sourcePos: [number, number, number], targetPos: [number, number, number]) => {
        const id = `proj-${Date.now()}`;
        const dir = [
            targetPos[0] - sourcePos[0],
            targetPos[1] - sourcePos[1],
            targetPos[2] - sourcePos[2]
        ];
        const dist = Math.sqrt(dir[0]**2 + dir[1]**2 + dir[2]**2);
        const speed = 0.5;
        const velocity: [number, number, number] = [
            (dir[0] / dist) * speed,
            (dir[1] / dist) * speed,
            (dir[2] / dist) * speed
        ];

        setEntities(prev => [...prev, {
            id,
            type: 'projectile',
            position: [...sourcePos] as [number, number, number],
            velocity,
            health: 1,
            maxHealth: 1
        }]);
    }, []);

    const syncHeroPosition = useCallback((pos: [number, number, number]) => {
        setEntities(prev => {
            const hero = prev.find(e => e.type === 'hero');
            if (hero) {
                const distSq = Math.pow(hero.position[0] - pos[0], 2) + 
                               Math.pow(hero.position[1] - pos[1], 2) + 
                               Math.pow(hero.position[2] - pos[2], 2);
                if (distSq < 0.0001) return prev; // No meaningful change
            }
            if (!prev.some(e => e.type === 'hero')) return prev;
            return prev.map(e => e.type === 'hero' ? { ...e, position: pos } : e);
        });
    }, []);

    const clearFragments = useCallback(() => {
        setEntities(prev => prev.filter(e => e.type !== 'fragment'));
    }, []);

    return {
        entities,
        isCombatActive,
        startCombat,
        stopCombat,
        spawnDrone,
        spawnFragment,
        spawnFragments,
        spawnParticleBurst,
        spawnCustomSprite,
        spawnBoss,
        fireProjectile,
        syncHeroPosition,
        clearFragments,
        collisionLogs
    };
};

