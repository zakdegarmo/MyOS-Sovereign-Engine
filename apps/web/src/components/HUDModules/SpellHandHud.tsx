import React, { useState } from 'react';
import type { SpellSchool } from '../World/SpellFxEngine';

export interface SpellCardItem {
    id: string;
    name: string;
    school: SpellSchool;
    schoolName: string;
    level: string;
    castingTime: string;
    range: string;
    components: string;
    duration: string;
    description: string;
    damageOrEffect: string;
    imagePath?: string;
}

export const CANONICAL_SPELL_BOOK: SpellCardItem[] = [
    {
        id: 'spell_fireball',
        name: 'Fireball',
        school: 'evocation_fire',
        schoolName: 'Evocation (Fire)',
        level: '3rd-Level',
        castingTime: '1 Action',
        range: '150 feet',
        components: 'V, S, M (Guano & Sulfur)',
        duration: 'Instantaneous',
        description: 'A bright streak flashes from your pointing finger to a point you choose and then blossoms into an explosion of flame.',
        damageOrEffect: '8d6 Fire Damage (DC 15 Dex Save)',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Fireball.png'
    },
    {
        id: 'spell_ray_of_frost',
        name: 'Ray of Frost',
        school: 'evocation_frost',
        schoolName: 'Evocation (Cold)',
        level: 'Cantrip',
        castingTime: '1 Action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'A frigid beam of blue-white light streaks toward a creature within range. Speed reduced by 10ft.',
        damageOrEffect: '1d8 Cold Damage & -10ft Speed',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Ray%20of%20Frost.png'
    },
    {
        id: 'spell_lightning_bolt',
        name: 'Lightning Bolt',
        school: 'evocation_lightning',
        schoolName: 'Evocation (Lightning)',
        level: '3rd-Level',
        castingTime: '1 Action',
        range: 'Self (100-foot line)',
        components: 'V, S, M (Bit of fur & rod)',
        duration: 'Instantaneous',
        description: 'A stroke of lightning forming a line 100 feet long and 5 feet wide blasts out from you.',
        damageOrEffect: '8d6 Lightning Damage (DC 15 Dex Save)',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Lightning%20Bolt.png'
    },
    {
        id: 'spell_shield_of_faith',
        name: 'Shield of Faith',
        school: 'abjuration_holy',
        schoolName: 'Abjuration (Holy)',
        level: '1st-Level',
        castingTime: '1 Bonus Action',
        range: '60 feet',
        components: 'V, S, M (Parchment with holy text)',
        duration: 'Concentration, up to 10 min',
        description: 'A shimmering field appears and surrounds a creature of your choice, granting +2 AC.',
        damageOrEffect: '+2 Armor Class Bonus',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Shield%20of%20Faith.png'
    },
    {
        id: 'spell_misty_step',
        name: 'Misty Step',
        school: 'conjuration_teleport',
        schoolName: 'Conjuration (Teleport)',
        level: '2nd-Level',
        castingTime: '1 Bonus Action',
        range: 'Self',
        components: 'V',
        duration: 'Instantaneous',
        description: 'Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space you can see.',
        damageOrEffect: 'Teleport 30ft instantly',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Misty%20Step.png'
    },
    {
        id: 'spell_invisibility',
        name: 'Invisibility',
        school: 'conjuration_teleport',
        schoolName: 'Illusion',
        level: '2nd-Level',
        castingTime: '1 Action',
        range: 'Touch',
        components: 'V, S, M (An eyelash in gum arabic)',
        duration: 'Concentration, up to 1 hour',
        description: 'A creature you touch becomes invisible until the spell ends or until the target attacks or casts a spell.',
        damageOrEffect: 'Target becomes Invisible',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Invisibility.png'
    },
    {
        id: 'spell_heal',
        name: 'Heal',
        school: 'abjuration_holy',
        schoolName: 'Evocation (Healing)',
        level: '6th-Level',
        castingTime: '1 Action',
        range: '60 feet',
        components: 'V, S',
        duration: 'Instantaneous',
        description: 'Choose a creature within range. A surge of positive energy washes through the creature, restoring 70 hit points.',
        damageOrEffect: 'Restore 70 HP & Cure Diseases',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Heal.png'
    },
    {
        id: 'spell_entangle',
        name: 'Entangle',
        school: 'evocation_frost',
        schoolName: 'Conjuration (Nature)',
        level: '1st-Level',
        castingTime: '1 Action',
        range: '90 feet',
        components: 'V, S',
        duration: 'Concentration, up to 1 min',
        description: 'Grasping weeds and vines sprout from the ground in a 20-foot square, restraining creatures.',
        damageOrEffect: 'Restrain targets (DC 15 Str Save)',
        imagePath: '/integrations/5e%20spell%20cards%20individual/Entangle.png'
    }
];

export interface SpellHandHudProps {
    onCastSpell: (spell: SpellCardItem) => void;
}

export const SpellHandHud: React.FC<SpellHandHudProps> = ({ onCastSpell }) => {
    const [selectedSchool, setSelectedSchool] = useState<string>('All');
    const [hoveredSpell, setHoveredSpell] = useState<SpellCardItem | null>(null);

    const filteredSpells = CANONICAL_SPELL_BOOK.filter(s => 
        selectedSchool === 'All' || s.school.includes(selectedSchool.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            maxWidth: 'calc(100vw - 380px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
            pointerEvents: 'auto'
        }}>
            <div style={{
                display: 'flex',
                gap: '8px',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}>
                {['All', 'Evocation', 'Abjuration', 'Conjuration'].map(school => (
                    <button
                        key={school}
                        onClick={() => setSelectedSchool(school)}
                        style={{
                            background: selectedSchool === school ? '#3b82f6' : 'transparent',
                            color: selectedSchool === school ? '#ffffff' : '#94a3b8',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {school === 'Evocation' ? '🔥 Evocation' : school === 'Abjuration' ? '🛡️ Abjuration' : school === 'Conjuration' ? '🌀 Conjuration' : '✨ All Schools'}
                    </button>
                ))}
            </div>

            {hoveredSpell && (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid #3b82f6',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    maxWidth: '440px',
                    color: '#f8fafc',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
                    animation: 'fadeIn 0.2s ease-in-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#60a5fa', fontSize: '15px' }}>{hoveredSpell.name}</strong>
                        <span style={{ fontSize: '11px', background: '#1e293b', padding: '2px 8px', borderRadius: '8px', border: '1px solid #475569' }}>{hoveredSpell.schoolName} | {hoveredSpell.level}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.4' }}>{hoveredSpell.description}</p>
                    <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 'bold', color: '#f59e0b' }}>
                        ⚡ Effect: {hoveredSpell.damageOrEffect}
                    </div>
                </div>
            )}

            <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-end',
                paddingTop: '10px',
                maxWidth: '100%',
                overflowX: 'auto',
                paddingBottom: '8px'
            }}>
                {filteredSpells.map((spell, idx) => {
                    const isHovered = hoveredSpell?.id === spell.id;
                    return (
                        <div
                            key={spell.id}
                            onMouseEnter={() => setHoveredSpell(spell)}
                            onMouseLeave={() => setHoveredSpell(null)}
                            onClick={() => onCastSpell(spell)}
                            style={{
                                width: '110px',
                                height: '160px',
                                minWidth: '110px',
                                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                borderRadius: '10px',
                                border: isHovered ? '2px solid #60a5fa' : '1px solid #334155',
                                boxShadow: isHovered ? '0 12px 28px rgba(96, 165, 250, 0.4)' : '0 4px 12px rgba(0,0,0,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: isHovered ? 'translateY(-24px) scale(1.12)' : `translateY(${Math.abs(idx - 2) * 4}px)`,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                padding: '6px 4px',
                                textAlign: 'center',
                                background: 'rgba(0,0,0,0.6)',
                                borderBottom: '1px solid #334155'
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{spell.name}</span>
                            </div>

                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090d16', padding: '4px' }}>
                                {spell.imagePath ? (
                                    <img src={spell.imagePath} alt={spell.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                ) : (
                                    <span style={{ fontSize: '28px' }}>🔮</span>
                                )}
                            </div>

                            <div style={{
                                padding: '4px',
                                background: isHovered ? '#2563eb' : '#1e293b',
                                color: '#fff',
                                textAlign: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                {isHovered ? '✨ CAST SPELL' : spell.level}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
