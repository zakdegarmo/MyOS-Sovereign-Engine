import React, { useState, useEffect } from 'react';
import { ALL_CARD_FILES } from './cardFileList';

const SCHOOLS = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation'];
const LEVELS = ['Cantrip', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7', 'Level 8', 'Level 9'];

export const CyclotropeMenu: React.FC<{
    selectedSpell: string;
    onSelectSpell: (spellId: string) => void;
}> = ({ selectedSpell, onSelectSpell }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // 0 = School, 1 = Level, 2 = Spell
    const [activeRing, setActiveRing] = useState(0);
    
    const [schoolIdx, setSchoolIdx] = useState(0);
    const [levelIdx, setLevelIdx] = useState(0);
    const [spellIdx, setSpellIdx] = useState(0);

    // Mock spell database for the spells we DO have metadata for (so the filtering works exactly as requested)
    const MOCK_SPELLS = [
        { id: 'acid_splash', name: 'Acid Splash', level: 'Cantrip', school: 'Conjuration', file: '5espells1_card_000.png' },
        { id: 'aid', name: 'Aid', level: 'Level 2', school: 'Abjuration', file: '5espells1_card_001.png' }, // placeholder file
        { id: 'alarm', name: 'Alarm', level: 'Level 1', school: 'Abjuration', file: '5espells1_card_002.png' },
        { id: 'fireball', name: 'Fireball', level: 'Level 3', school: 'Evocation', file: '5espells3_card_010.png' },
        { id: 'misty_step', name: 'Misty Step', level: 'Level 2', school: 'Conjuration', file: '5espells4_card_020.png' },
        { id: 'invisibility', name: 'Invisibility', level: 'Level 2', school: 'Illusion', file: '5espells3_card_005.png' },
    ];

    // Filter spells based on selected school and level
    const activeSpells = MOCK_SPELLS
        .filter(s => s.school === SCHOOLS[schoolIdx])
        .filter(s => s.level === LEVELS[levelIdx]);

    useEffect(() => {
        const handleToggle = (e: KeyboardEvent) => {
            if (e.key === 'm' || e.key === 'M' || e.key === 'Tab') {
                e.preventDefault();
                setIsOpen(prev => {
                    if (!prev) { setActiveRing(0); setSchoolIdx(0); setLevelIdx(0); setSpellIdx(0); }
                    return !prev;
                });
            }
        };
        window.addEventListener('keydown', handleToggle);
        return () => window.removeEventListener('keydown', handleToggle);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleMenuKeys = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'd') {
                if (activeRing === 0) setSchoolIdx(p => (p + 1) % SCHOOLS.length);
                if (activeRing === 1) setLevelIdx(p => (p + 1) % LEVELS.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p + 1) % activeSpells.length);
            } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                if (activeRing === 0) setSchoolIdx(p => (p - 1 + SCHOOLS.length) % SCHOOLS.length);
                if (activeRing === 1) setLevelIdx(p => (p - 1 + LEVELS.length) % LEVELS.length);
                if (activeRing === 2 && activeSpells.length > 0) setSpellIdx(p => (p - 1 + activeSpells.length) % activeSpells.length);
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (activeRing < 2) {
                    setActiveRing(p => p + 1);
                    setSpellIdx(0); // Reset spell index when entering the spell ring
                } else if (activeSpells.length > 0) {
                    onSelectSpell(activeSpells[spellIdx].id);
                    setIsOpen(false);
                }
            } else if (e.key === 'Escape' || e.key === 'Backspace') {
                if (activeRing > 0) {
                    setActiveRing(p => p - 1);
                } else {
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleMenuKeys);
        return () => window.removeEventListener('keydown', handleMenuKeys);
    }, [isOpen, activeRing, schoolIdx, levelIdx, spellIdx, activeSpells, onSelectSpell]);

    if (!isOpen) {
        return (
            <div style={{
                position: 'fixed', bottom: '20px', right: '20px', padding: '15px 25px',
                background: 'rgba(20, 10, 40, 0.9)', color: 'white', border: '2px solid #aa88ff',
                borderRadius: '8px', fontFamily: 'monospace', pointerEvents: 'auto', cursor: 'pointer', zIndex: 9999,
                boxShadow: '0 0 15px rgba(170, 136, 255, 0.4)'
            }} onClick={() => setIsOpen(true)}>
                <h3>OPEN GRIMOIRE (Press M)</h3>
            </div>
        );
    }

    // Ring configuration for the "Halo"
    const RINGS = [
        { items: SCHOOLS, radius: 250, width: 150, height: 40, activeIdx: schoolIdx, fontSize: '18px' },
        { items: LEVELS, radius: 350, width: 120, height: 40, activeIdx: levelIdx, fontSize: '16px' },
        { items: activeSpells, radius: 550, width: 160, height: 230, activeIdx: spellIdx, isCards: true }
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle, rgba(10,5,20,0.8) 0%, rgba(0,0,0,0.95) 100%)',
            zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto', fontFamily: 'monospace', overflow: 'hidden'
        }}>
            
            <h1 style={{ position: 'absolute', top: '40px', color: 'white', letterSpacing: '4px', textShadow: '0 0 10px #aa88ff', zIndex: 10 }}>
                Concentric Grimoire
            </h1>
            <p style={{ position: 'absolute', top: '90px', color: '#aaa', zIndex: 10 }}>[A]/[D] to spin ring. [Enter] to select. [Backspace] to go back.</p>

            {/* Selection Window (The red box from the mockup) - Scales to the active ring */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: `${RINGS[activeRing].width + 20}px`,
                height: `${RINGS[activeRing].height + 20}px`,
                border: '2px solid #ff0055', borderRadius: '8px',
                boxShadow: '0 0 20px rgba(255, 0, 85, 0.4), inset 0 0 10px rgba(255, 0, 85, 0.2)',
                pointerEvents: 'none', zIndex: 5, transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }} />

            {/* The 3D Cyclotrope Halo */}
            <div style={{
                perspective: '1000px', width: '100vw', height: '100vh',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {RINGS.map((ring, ringIdx) => {
                    const isRingActive = activeRing === ringIdx;
                    const isRingCompleted = activeRing > ringIdx;
                    
                    // If we haven't reached this ring yet, hide it completely.
                    // If completed, dim it.
                    let ringOpacity = 0;
                    if (isRingActive) ringOpacity = 1;
                    if (isRingCompleted) ringOpacity = 0.3;

                    const numItems = ring.items.length;
                    const theta = numItems > 0 ? 360 / numItems : 0;
                    const currentRotation = ring.activeIdx * -theta;

                    return (
                        <div key={ringIdx} style={{
                            position: 'absolute', width: 0, height: 0,
                            transformStyle: 'preserve-3d',
                            // The halo is centered around the character's face (the camera), so we translateZ forward by the ring's radius
                            transform: `translateZ(${ring.radius}px) rotateY(${currentRotation}deg)`,
                            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s',
                            opacity: ringOpacity,
                            pointerEvents: isRingActive ? 'auto' : 'none'
                        }}>
                            {ring.items.map((item, idx) => {
                                const cellAngle = theta * idx;
                                const isTarget = idx === ring.activeIdx;
                                
                                return (
                                    <div key={idx} onClick={() => {
                                        if (!isRingActive) return;
                                        if (ringIdx === 0) setSchoolIdx(idx);
                                        if (ringIdx === 1) setLevelIdx(idx);
                                        if (ringIdx === 2) setSpellIdx(idx);
                                        if (isTarget && ringIdx === 2) {
                                            onSelectSpell(activeSpells[idx].id);
                                            setIsOpen(false);
                                        } else if (isTarget) {
                                            setActiveRing(p => p + 1);
                                        }
                                    }} style={{
                                        position: 'absolute',
                                        width: `${ring.width}px`, height: `${ring.height}px`,
                                        left: `-${ring.width / 2}px`, top: `-${ring.height / 2}px`,
                                        // Place item on the cylinder wall facing INWARD
                                        transform: `rotateY(${cellAngle}deg) translateZ(${-ring.radius}px)`,
                                        backfaceVisibility: 'hidden',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'filter 0.2s, opacity 0.2s, transform 0.2s',
                                        opacity: isTarget ? 1 : 0.4,
                                        filter: isTarget && isRingActive ? 'drop-shadow(0 0 15px rgba(255,255,255,0.6)) brightness(1.2)' : 'brightness(0.7)',
                                        color: isTarget && isRingActive ? '#fff' : '#aaa',
                                        fontSize: ring.fontSize, textTransform: 'uppercase', letterSpacing: '2px', cursor: 'pointer',
                                        background: ring.isCards ? 'transparent' : (isTarget ? 'rgba(50, 20, 80, 0.8)' : 'rgba(20, 10, 40, 0.5)'),
                                        border: ring.isCards ? 'none' : `1px solid ${isTarget ? '#aa88ff' : '#444'}`,
                                        borderRadius: '8px'
                                    }}>
                                        {ring.isCards ? (
                                            item ? (
                                                <img 
                                                    src={`/integrations/5e spell cards individual/sliced_grid/${item.file}`} 
                                                    alt={item.name || `Spell ${idx}`} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                                                />
                                            ) : (
                                                <div style={{ color: 'red' }}>NO SPELLS IN THIS CATEGORY</div>
                                            )
                                        ) : (
                                            item
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
