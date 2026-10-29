import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Torus, Billboard, Html } from '@react-three/drei';
import * as THREE from 'three';

const CATEGORIES = ['Spells', 'Combat Actions', 'Bonus Actions', 'Movement', 'Inventory', 'Skills'];

const MOCK_SPELLS = [
    { id: 'acid_splash', name: 'Acid Splash', level: 'Cantrip', school: 'Conjuration', file: '5espells1_card_000.png' },
    { id: 'aid', name: 'Aid', level: 'Level 2', school: 'Abjuration', file: '5espells1_card_001.png' },
    { id: 'alarm', name: 'Alarm', level: 'Level 1', school: 'Abjuration', file: '5espells1_card_002.png' },
    { id: 'fireball', name: 'Fireball', level: 'Level 3', school: 'Evocation', file: '5espells3_card_010.png' },
    { id: 'misty_step', name: 'Misty Step', level: 'Level 2', school: 'Conjuration', file: '5espells4_card_020.png' },
    { id: 'invisibility', name: 'Invisibility', level: 'Level 2', school: 'Illusion', file: '5espells3_card_005.png' },
];

const SafeCardMesh = ({ filename, name, materialRef }: { filename: string, name: string, materialRef?: any }) => {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const loader = new THREE.TextureLoader();
        loader.load(
            `/integrations/5e spell cards individual/sliced_grid/${filename}`,
            (tex) => setTexture(tex),
            undefined,
            () => setFailed(true)
        );
    }, [filename]);

    const w = 1.0;
    const h = 1.4;

    if (failed || !texture) {
        return (
            <group>
                <mesh>
                    <planeGeometry args={[w, h]} />
                    <meshBasicMaterial ref={materialRef} color="#1a0b2e" side={THREE.DoubleSide} transparent opacity={0} />
                </mesh>
                <Text position={[0, 0, 0.01]} fontSize={0.15} color="white" maxWidth={w - 0.1} textAlign="center" fillOpacity={0}>
                    {name}
                </Text>
            </group>
        );
    }

    return (
        <mesh>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial ref={materialRef} map={texture} side={THREE.DoubleSide} transparent opacity={0} />
        </mesh>
    );
};

// A smart item that calculates its own fade-in/fade-out based on its world angle relative to the camera
const SpinTextItem = ({ text, index, total, radius, groupRef, isActiveLayer, activeColor }: any) => {
    const textRef = useRef<any>(null);
    const baseAngle = (index / total) * Math.PI * 2;

    useFrame(() => {
        if (!textRef.current || !groupRef.current || !isActiveLayer) {
            if (textRef.current) {
                textRef.current.fillOpacity = 0;
                textRef.current.outlineOpacity = 0;
            }
            return;
        }
        
        const currentGroupRot = groupRef.current.rotation.y;
        let worldAngle = (baseAngle + currentGroupRot) % (Math.PI * 2);
        
        if (worldAngle > Math.PI) worldAngle -= Math.PI * 2;
        if (worldAngle < -Math.PI) worldAngle += Math.PI * 2;
        
        const distance = Math.abs(worldAngle);
        const fadeThreshold = Math.PI / 4; 
        
        let newOpacity = 0;
        if (distance < fadeThreshold) {
            newOpacity = 1.0 - (distance / fadeThreshold);
            newOpacity = Math.pow(newOpacity, 1.5);
        }
        
        // Mutate directly to avoid React re-renders!
        textRef.current.fillOpacity = newOpacity;
        textRef.current.outlineOpacity = newOpacity;
        textRef.current.visible = newOpacity > 0.01;
    });

    if (!isActiveLayer) return null;

    return (
        <group position={[Math.sin(baseAngle) * radius, 0, -Math.cos(baseAngle) * radius]}>
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <Text 
                    ref={textRef}
                    fontSize={0.4} 
                    color="#ffffff"
                    outlineWidth={0.02}
                    outlineColor={activeColor}
                    anchorY="bottom"
                    fillOpacity={0}
                    outlineOpacity={0}
                    visible={false}
                >
                    {text}
                </Text>
            </Billboard>
        </group>
    );
};

const SpinCardItem = ({ data, index, total, radius, groupRef, isActiveLayer }: any) => {
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);
    const [hovered, setHovered] = useState(false);
    const baseAngle = (index / total) * Math.PI * 2;
    const [opacityState, setOpacityState] = useState(0);

    useFrame(() => {
        if (!groupRef.current || !isActiveLayer || !materialRef.current) return;
        
        const currentGroupRot = groupRef.current.rotation.y;
        let worldAngle = (baseAngle + currentGroupRot) % (Math.PI * 2);
        if (worldAngle > Math.PI) worldAngle -= Math.PI * 2;
        if (worldAngle < -Math.PI) worldAngle += Math.PI * 2;
        
        const distance = Math.abs(worldAngle);
        const fadeThreshold = Math.PI / 4;
        
        let newOpacity = 0;
        if (distance < fadeThreshold) {
            newOpacity = 1.0 - (distance / fadeThreshold);
            newOpacity = Math.pow(newOpacity, 1.5);
        }
        
        materialRef.current.opacity = newOpacity;
        materialRef.current.visible = newOpacity > 0.01;
        
        // Sync opacity state occasionally for the HTML tooltip so we don't cause massive re-renders
        if (Math.abs(opacityState - newOpacity) > 0.1) {
            setOpacityState(newOpacity);
        }
    });

    if (!isActiveLayer) return null;

    const shortDesc = (data.desc && data.desc.length > 0) ? data.desc[0].slice(0, 150) + "..." : "No description available.";

    return (
        <group 
            position={[Math.sin(baseAngle) * radius, 0.7, -Math.cos(baseAngle) * radius]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <Billboard follow lockX={false} lockY={false} lockZ={false}>
                <SafeCardMesh filename={data.file} name={data.name} materialRef={materialRef} />
                
                {hovered && opacityState > 0.5 && (
                    <Html center position={[0, -1.2, 0.1]} style={{ 
                        pointerEvents: 'none', 
                        background: 'rgba(0, 0, 0, 0.8)', 
                        padding: '10px',
                        border: '2px solid #ff3366',
                        borderRadius: '8px',
                        color: 'white',
                        width: '300px',
                        textAlign: 'center',
                        textShadow: '1px 1px 2px black',
                        fontFamily: 'monospace'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#ff3366' }}>{data.name}</div>
                        <div style={{ fontSize: '12px', color: '#aaaaaa', marginBottom: '8px' }}>{data.level} | {data.school}</div>
                        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>{shortDesc}</div>
                    </Html>
                )}
            </Billboard>
        </group>
    );
};

export const CyclotropeMenu3D: React.FC<{
    position?: [number, number, number];
    selectedSpell: string;
    onSelectSpell: (spellId: string) => void;
}> = ({ position = [0, 2.5, 0], selectedSpell, onSelectSpell }) => {
    const { scene } = useThree();
    const [isOpen, setIsOpen] = useState(false);
    const [spellDatabase, setSpellDatabase] = useState(MOCK_SPELLS);

    useEffect(() => {
        // Attempt to fetch the dynamically generated LLaVA database
        fetch('/spell_database.json')
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("No database yet");
            })
            .then(data => {
                if (data && data.length > 0) {
                    setSpellDatabase(data);
                }
            })
            .catch(err => console.log("Using fallback MOCK_SPELLS while pipeline runs..."));
    }, []);
    
    // 0 = School, 1 = Level, 2 = Spell
    const [activeRing, setActiveRing] = useState(0);
    const [categoryIdx, setCategoryIdx] = useState(0);
    const [letterIdx, setLetterIdx] = useState(0);
    const [spellIdx, setSpellIdx] = useState(0);

    const letters = useMemo(() => {
        const set = new Set<string>();
        spellDatabase.forEach(s => { if (s.name) set.add(s.name.charAt(0).toUpperCase()); });
        return Array.from(set).sort();
    }, [spellDatabase]);

    const activeSpells = useMemo(() => {
        if (letters.length === 0) return [];
        const selectedLetter = letters[letterIdx] || 'A';
        return spellDatabase.filter(s => s.name && s.name.charAt(0).toUpperCase() === selectedLetter);
    }, [spellDatabase, letters, letterIdx]);

    const haloRef = useRef<THREE.Group>(null);
    const [spinVelocity, setSpinVelocity] = useState(0);
    const targetYRef = useRef(position[1] + 2.5); // The dynamic height of the halo
    const currentYRef = useRef(position[1] + 2.5);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.key === 'm' || e.key === 'M' || e.key === 'Tab') {
                e.preventDefault();
                setIsOpen(prev => {
                    if (!prev) { setActiveRing(0); setCategoryIdx(0); setLetterIdx(0); setSpellIdx(0); }
                    return !prev;
                });
                return;
            }

            if (!isOpen) return;

            // Exclusive Numpad controls (4 = Prev, 6 = Next)
            if (e.code === 'Numpad4') { 
                if (activeRing === 0) setCategoryIdx(p => (p - 1 + CATEGORIES.length) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) setLetterIdx(p => (p - 1 + letters.length) % letters.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p - 1 + activeSpells.length) % activeSpells.length);
            } else if (e.code === 'Numpad6') { 
                if (activeRing === 0) setCategoryIdx(p => (p + 1) % CATEGORIES.length);
                if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) setLetterIdx(p => (p + 1) % letters.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p + 1) % activeSpells.length);
            } else if (e.key === 'Enter' || e.code === 'Numpad5' || e.code === 'NumpadEnter') {
                if (activeRing === 0 && categoryIdx !== 0) {
                    // Block deeper traversal if not Spells for now
                    console.log('Not implemented yet');
                } else if (activeRing < 2) {
                    setActiveRing(p => p + 1);
                    setSpellIdx(0);
                    setSpinVelocity(1.0); 
                } else if (activeSpells.length > 0) {
                    onSelectSpell(activeSpells[spellIdx].id);
                    setIsOpen(false);
                }
            } else if (e.key === 'Backspace' || e.code === 'Numpad8' || e.key === 'Escape') {
                if (activeRing > 0) {
                    setActiveRing(p => p - 1);
                    setSpinVelocity(-1.0);
                } else {
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [isOpen, activeRing, categoryIdx, letterIdx, spellIdx, activeSpells, onSelectSpell]);

    useFrame((_, delta) => {
        if (!isOpen || !haloRef.current) return;
        
        // 1. DYNAMIC HEIGHT SCANNER
        let maxY = position[1] + 1.0; 
        
        scene.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
                let isUI = false;
                let curr = child;
                while (curr) {
                    if (curr.name === 'CyclotropeMenu' || curr.name === 'MagicLabEnvironment') {
                        isUI = true;
                        break;
                    }
                    curr = curr.parent;
                }
                if (isUI) return; // Completely ignore our own UI meshes

                const wp = new THREE.Vector3();
                child.getWorldPosition(wp);
                
                // If the object is near the player's [x, z] footprint
                if (Math.abs(wp.x - position[0]) < 1.0 && Math.abs(wp.z - position[2]) < 1.0) {
                    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                    if (child.geometry.boundingBox) {
                        const box = child.geometry.boundingBox.clone();
                        box.applyMatrix4(child.matrixWorld);
                        
                        // Ignore the floor (y < 0.1)
                        if (box.max.y > maxY && box.max.y < position[1] + 6.0 && box.max.y > 0.1) {
                            maxY = box.max.y;
                        }
                    }
                }
            }
        });
        
        // The target Y is slightly above the tallest point of the character mesh
        targetYRef.current = maxY + 0.6;
        
        // Smoothly lerp the halo to the correct height
        currentYRef.current = THREE.MathUtils.lerp(currentYRef.current, targetYRef.current, 5 * delta);
        haloRef.current.position.y = currentYRef.current;
        haloRef.current.position.x = position[0];
        haloRef.current.position.z = position[2];

        // 2. SMOOTH ROTATIONAL SPIN JUICE
        // Calculate the ideal rotation based on the current selection index
        let targetRot = 0;
        if (activeRing === 0) targetRot = -categoryIdx * (Math.PI * 2 / CATEGORIES.length);
        if (activeRing === 1 && categoryIdx === 0 && letters.length > 0) targetRot = -letterIdx * (Math.PI * 2 / letters.length);
        if (activeRing === 2 && activeSpells.length > 0) targetRot = -spellIdx * (Math.PI * 2 / activeSpells.length);
        
        // Lerp the physical rotation to match the target index
        // To prevent spin-the-long-way bugs, we ensure we rotate the shortest distance
        let currentRot = haloRef.current.rotation.y;
        let diff = targetRot - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        
        haloRef.current.rotation.y += diff * (10 * delta);

        // Add additional aesthetic spin velocity from level transitions
        if (Math.abs(spinVelocity) > 0.01) {
            haloRef.current.rotation.y += spinVelocity;
            setSpinVelocity(v => v * 0.9);
        }
    });

    if (!isOpen) return null;

    const haloRadius = 1.2;
    const activeColor = activeRing === 0 ? "#ffff00" : activeRing === 1 ? "#00ffff" : "#ff3366";

    return (
        <group name="CyclotropeMenu">
            {/* The Master Floating Halo Group */}
            <group ref={haloRef}>
                
                {/* Visual Magical Rings */}
                <Torus args={[haloRadius, 0.05, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color={activeColor} transparent opacity={0.6} />
                </Torus>
                <Torus args={[haloRadius - 0.05, 0.02, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
                </Torus>

                {/* Ring 0: Categories */}
                {CATEGORIES.map((cat, i) => (
                    <SpinTextItem 
                        key={cat} text={cat} index={i} total={CATEGORIES.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 0} 
                        activeColor="#ffff00" 
                    />
                ))}

                {/* Ring 1: A-Z Alphabet */}
                {categoryIdx === 0 && letters.map((letter, i) => (
                    <SpinTextItem 
                        key={letter} text={letter} index={i} total={letters.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 1} 
                        activeColor="#00ffff" 
                    />
                ))}

                {/* Ring 2: Spell Cards */}
                {activeRing === 2 && activeSpells.length === 0 && (
                    <group position={[0, 0, -haloRadius + 0.1]}>
                        <Billboard follow lockX={false} lockY={false} lockZ={false}>
                            <Text fontSize={0.2} color="#ff3333" anchorY="bottom">No Spells Found</Text>
                        </Billboard>
                    </group>
                )}
                {categoryIdx === 0 && activeSpells.map((spell, i) => (
                    <SpinCardItem 
                        key={spell.id} data={spell} index={i} total={activeSpells.length} 
                        radius={haloRadius - 0.1} groupRef={haloRef} isActiveLayer={activeRing === 2} 
                    />
                ))}

                {/* UI Navigation Hint - Anchored to the Halo itself */}
                <Text position={[0, -0.4, -haloRadius]} fontSize={0.12} color="#888888" rotation={[0, Math.PI, 0]}>
                    Numpad 4/6: Select | 5: Confirm | 8: Back
                </Text>
            </group>
        </group>
    );
};
