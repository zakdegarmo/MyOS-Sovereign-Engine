import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box, Cylinder, Cone, Html, useTexture } from '@react-three/drei';
import { Physics, RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { EnvironmentalJuice } from './EnvironmentalJuice';
import { RetroFireballVFX } from './RetroFireballVFX';
import { MistyStepVFX, InvisibilityVFX, AcidSplashVFX, AidVFX, ConditionMarker, AlarmVFX, AlterSelfVFX } from './SpellVFX';
import { CyclotropeMenu3D } from './CyclotropeMenu3D';

// Utility for generating random physics targets
const generateRandomTargets = (count: number) => {
    const targets = [];
    for (let i = 0; i < count; i++) {
        const shape = Math.floor(Math.random() * 4);
        const size = 0.5 + Math.random() * 1.5;
        const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
        
        targets.push({
            id: `target_${i}`,
            shape,
            size,
            color,
            position: [
                (Math.random() - 0.5) * 40, 
                size + Math.random() * 10, 
                (Math.random() - 0.5) * 40
            ] as [number, number, number]
        });
    }
    return targets;
};

type SpellType = 'fireball' | 'misty_step' | 'invisibility' | 'acid_splash' | 'aid' | 'alarm' | 'alter_self';

const ActionEconomyUI = ({ position }: { position?: THREE.Vector3 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const ageRef = useRef(0);
    
    useFrame((state, delta) => {
        ageRef.current += delta;
        if (groupRef.current) {
            // Slowly orbit around the player's head
            groupRef.current.rotation.y = ageRef.current * 0.5;
            // Gently bob up and down
            groupRef.current.position.y = 2.5 + Math.sin(ageRef.current * 2) * 0.1;
        }
    });

    if (!position) return null;

    return (
        <group position={[position.x, 0, position.z]}>
            <group ref={groupRef}>
                {/* Action Orb (Green) */}
                <mesh position={[0.8, 0, 0]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshBasicMaterial color="#00ff44" />
                    <pointLight color="#00ff44" intensity={2} distance={2} />
                </mesh>
                
                {/* Bonus Action Orb (Orange) */}
                <mesh position={[-0.4, 0, 0.69]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshBasicMaterial color="#ff8800" />
                    <pointLight color="#ff8800" intensity={1.5} distance={1.5} />
                </mesh>

                {/* Movement Orb (Blue) */}
                <mesh position={[-0.4, 0, -0.69]}>
                    <sphereGeometry args={[0.06, 16, 16]} />
                    <meshBasicMaterial color="#0088ff" />
                    <pointLight color="#0088ff" intensity={1} distance={1} />
                </mesh>
            </group>
        </group>
    );
};

export const MagicLabWorld: React.FC<{ isActive: boolean, playerPosition?: THREE.Vector3 }> = ({ isActive, playerPosition }) => {
    const [targets] = useState(() => generateRandomTargets(60));
    const targetRefs = useRef<Record<string, RapierRigidBody | null>>({});
    const [activeSpells, setActiveSpells] = useState<{ id: string, position: THREE.Vector3, startPos?: THREE.Vector3, type: SpellType }[]>([]);
    const [selectedSpell, setSelectedSpell] = useState<SpellType>('fireball');
    
    // Condition Tracking States
    const [invisibleTargets, setInvisibleTargets] = useState<Set<string>>(new Set());
    const [meltedTargets, setMeltedTargets] = useState<Set<string>>(new Set());
    const [aidedTargets, setAidedTargets] = useState<Set<string>>(new Set());

    // Keyboard shortcuts for spells
    useEffect(() => {
        if (!isActive) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '1') setSelectedSpell('fireball');
            if (e.key === '2') setSelectedSpell('misty_step');
            if (e.key === '3') setSelectedSpell('invisibility');
            if (e.key === '4') setSelectedSpell('acid_splash');
            if (e.key === '5') setSelectedSpell('aid');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isActive]);

    if (!isActive) return null;

    const getClosestTarget = (hitPoint: THREE.Vector3, maxRadius: number = 10) => {
        let closestId: string | null = null;
        let minDistance = maxRadius;
        
        Object.entries(targetRefs.current).forEach(([id, body]) => {
            if (!body) return;
            const pos = body.translation();
            const distance = hitPoint.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z));
            if (distance < minDistance) {
                minDistance = distance;
                closestId = id;
            }
        });
        
        return { closestId, minDistance };
    };

    const handleFloorClick = (e: any) => {
        e.stopPropagation();
        const hitPoint = e.point as THREE.Vector3;
        const spellId = `spell_${Date.now()}`;
        
        if (selectedSpell === 'fireball') {
            setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'fireball' }]);
            
            const EXPLOSION_FORCE = 300;
            const EXPLOSION_RADIUS = 15;
            Object.values(targetRefs.current).forEach(body => {
                if (!body) return;
                const bodyPos = body.translation();
                const distance = hitPoint.distanceTo(new THREE.Vector3(bodyPos.x, bodyPos.y, bodyPos.z));
                if (distance < EXPLOSION_RADIUS) {
                    const dir = new THREE.Vector3(bodyPos.x - hitPoint.x, bodyPos.y - hitPoint.y + 2, bodyPos.z - hitPoint.z).normalize();
                    const forceMagnitude = EXPLOSION_FORCE * (1 - (distance / EXPLOSION_RADIUS));
                    body.applyImpulse({ x: dir.x * forceMagnitude, y: dir.y * forceMagnitude, z: dir.z * forceMagnitude }, true);
                    body.applyTorqueImpulse({ x: (Math.random() - 0.5) * forceMagnitude * 0.1, y: (Math.random() - 0.5) * forceMagnitude * 0.1, z: (Math.random() - 0.5) * forceMagnitude * 0.1 }, true);
                }
            });
        }
        else if (selectedSpell === 'acid_splash') {
            const startPos = new THREE.Vector3(0, 10, 0); 
            setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, startPos, type: 'acid_splash' }]);
            
            const { closestId } = getClosestTarget(hitPoint, 8);
            if (closestId && targetRefs.current[closestId]) {
                const body = targetRefs.current[closestId]!;
                setTimeout(() => {
                    setMeltedTargets(prev => {
                        const next = new Set(prev);
                        if (next.has(closestId)) next.delete(closestId);
                        else next.add(closestId);
                        return next;
                    });
                    body.applyImpulse({ x: (Math.random()-0.5)*10, y: 15, z: (Math.random()-0.5)*10 }, true);
                }, 500);
            }
        }
        else if (selectedSpell === 'aid') {
            const { closestId } = getClosestTarget(hitPoint, 15);
            if (closestId && targetRefs.current[closestId]) {
                const body = targetRefs.current[closestId]!;
                const currentPos = body.translation();
                setActiveSpells(prev => [...prev, { id: spellId, position: new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z), type: 'aid' }]);
                
                // Toggle the Aid condition marker
                setAidedTargets(prev => {
                    const next = new Set(prev);
                    if (next.has(closestId)) next.delete(closestId);
                    else next.add(closestId);
                    return next;
                });
                
                // Apply a gentle floating upward force as a visual queue of the "blessing"
                body.applyImpulse({ x: 0, y: 10, z: 0 }, true);
            } else {
                setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'aid' }]);
            }
        }
        else if (selectedSpell === 'misty_step') {
            const { closestId } = getClosestTarget(hitPoint);
            if (closestId && targetRefs.current[closestId]) {
                const body = targetRefs.current[closestId]!;
                const currentPos = body.translation();
                
                setActiveSpells(prev => [...prev, { id: spellId, position: new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z), type: 'misty_step' }]);
                
                const tpX = currentPos.x + (Math.random() - 0.5) * 40;
                const tpZ = currentPos.z + (Math.random() - 0.5) * 40;
                const tpY = 25; 
                
                body.setTranslation({ x: tpX, y: tpY, z: tpZ }, true);
                body.setLinvel({ x: 0, y: 0, z: 0 }, true);
                body.setAngvel({ x: 0, y: 0, z: 0 }, true);

                setActiveSpells(prev => [...prev, { id: spellId + '_end', position: new THREE.Vector3(tpX, tpY, tpZ), type: 'misty_step' }]);
            } else {
                setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'misty_step' }]);
            }
        }
        else if (selectedSpell === 'invisibility') {
            const { closestId } = getClosestTarget(hitPoint);
            if (closestId && targetRefs.current[closestId]) {
                const body = targetRefs.current[closestId]!;
                const pos = body.translation();
                setActiveSpells(prev => [...prev, { id: spellId, position: new THREE.Vector3(pos.x, pos.y, pos.z), type: 'invisibility' }]);
                
                setInvisibleTargets(prev => {
                    const next = new Set(prev);
                    if (next.has(closestId)) {
                        next.delete(closestId);
                    } else {
                        next.add(closestId);
                    }
                    return next;
                });
            } else {
                setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'invisibility' }]);
            }
        }
        else if (selectedSpell === 'alarm') {
            setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'alarm' }]);
        }
        else if (selectedSpell === 'alter_self') {
            const { closestId } = getClosestTarget(hitPoint, 15);
            if (closestId && targetRefs.current[closestId]) {
                const body = targetRefs.current[closestId]!;
                const pos = body.translation();
                setActiveSpells(prev => [...prev, { id: spellId, position: new THREE.Vector3(pos.x, pos.y, pos.z), type: 'alter_self' }]);
                
                // Pop the physics body up slightly as it morphs
                setTimeout(() => {
                    body.applyImpulse({ x: (Math.random() - 0.5) * 5, y: 12, z: (Math.random() - 0.5) * 5 }, true);
                    body.applyTorqueImpulse({ x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }, true);
                }, 400);
            } else {
                setActiveSpells(prev => [...prev, { id: spellId, position: hitPoint, type: 'alter_self' }]);
            }
        }
    };

    return (
        <group name="MagicLabEnvironment">
            <EnvironmentalJuice biomeType="magic_lab" />
            <ActionEconomyUI position={playerPosition} />

            <CyclotropeMenu3D 
                position={playerPosition ? [playerPosition.x, playerPosition.y + 2.5, playerPosition.z] : [0, 2.5, 0]}
                selectedSpell={selectedSpell} 
                onSelectSpell={(id) => setSelectedSpell(id as SpellType)} 
            />
            
            {activeSpells.map(spell => (
                <React.Fragment key={spell.id}>
                    {spell.type === 'fireball' && <RetroFireballVFX position={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'misty_step' && <MistyStepVFX position={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'invisibility' && <InvisibilityVFX position={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'acid_splash' && <AcidSplashVFX startPos={spell.startPos || new THREE.Vector3(0,5,0)} endPos={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'aid' && <AidVFX position={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'alarm' && <AlarmVFX position={spell.position} playerPosition={playerPosition} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                    {spell.type === 'alter_self' && <AlterSelfVFX position={spell.position} onComplete={() => setActiveSpells(prev => prev.filter(s => s.id !== spell.id))} />}
                </React.Fragment>
            ))}

            <Physics debug={false} gravity={[0, -20, 0]}>
                <RigidBody type="fixed" friction={1}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handleFloorClick} receiveShadow>
                        <planeGeometry args={[200, 200]} />
                        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
                    </mesh>
                    <CuboidCollider args={[100, 0.5, 100]} position={[0, -0.5, 0]} />
                </RigidBody>

                {targets.map(t => {
                    const isInvisible = invisibleTargets.has(t.id);
                    const isMelted = meltedTargets.has(t.id);
                    const isAided = aidedTargets.has(t.id);
                    const displayColor = isMelted ? '#33ff00' : t.color;
                    
                    return (
                        <RigidBody 
                            key={t.id} 
                            ref={(el) => targetRefs.current[t.id] = el}
                            position={t.position} 
                            mass={t.size * 2}
                            restitution={0.6}
                            friction={0.4}
                        >
                            <group>
                                {isMelted && <ConditionMarker type="acid" position={new THREE.Vector3(0, t.size, 0)} />}
                                {isAided && <ConditionMarker type="aid" position={new THREE.Vector3(0, t.size, 0)} />}
                                {t.shape === 0 && <Box args={[t.size, t.size, t.size]} castShadow><meshStandardMaterial color={displayColor} transparent={isInvisible} opacity={isInvisible ? 0.2 : 1} wireframe={isInvisible} emissive={isMelted ? '#115500' : (isAided ? '#003355' : '#000000')} /></Box>}
                                {t.shape === 1 && <Sphere args={[t.size / 2, 16, 16]} castShadow><meshStandardMaterial color={displayColor} transparent={isInvisible} opacity={isInvisible ? 0.2 : 1} wireframe={isInvisible} emissive={isMelted ? '#115500' : (isAided ? '#003355' : '#000000')} /></Sphere>}
                                {t.shape === 2 && <Cylinder args={[t.size / 2, t.size / 2, t.size, 16]} castShadow><meshStandardMaterial color={displayColor} transparent={isInvisible} opacity={isInvisible ? 0.2 : 1} wireframe={isInvisible} emissive={isMelted ? '#115500' : (isAided ? '#003355' : '#000000')} /></Cylinder>}
                                {t.shape === 3 && <Cone args={[t.size / 2, t.size, 16]} castShadow><meshStandardMaterial color={displayColor} transparent={isInvisible} opacity={isInvisible ? 0.2 : 1} wireframe={isInvisible} emissive={isMelted ? '#115500' : (isAided ? '#003355' : '#000000')} /></Cone>}
                            </group>
                        </RigidBody>
                    );
                })}
            </Physics>
        </group>
    );
};
