import React, { useState } from 'react';
import { SpellSchool } from '../World/SpellFxEngine';

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
        imagePath: '/assets/dnd_cards/card_p14_r1_c1.png'
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
        imagePath: '/assets/dnd_cards/card_p15_r0_c2.png'
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
        imagePath: '/assets/dnd_cards/card_p16_r1_c0.png'
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
        imagePath: '/assets/dnd_cards/card_p10_r0_c1.png'
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
        imagePath: '/assets/dnd_cards/card_p12_r1_c2.png'
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
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            pointerEvents: 'auto'
        }}>
            <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
                {['All', 'Evocation', 'Abjuration', 'Conjuration'].map(school => (
                    <button key={school} onClick={() => setSelectedSchool(school)} style={{ background: selectedSchool === school ? '#3b82f6' : 'transparent', color: selectedSchool === school ? '#ffffff' : '#94a3b8', border: 'none', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        {school === 'Evocation' ? '🔥 Evocation' : school === 'Abjuration' ? '🛡️ Abjuration' : school === 'Conjuration' ? '🌀 Conjuration' : '✨ All Schools'}
                    </button>
                ))}
            </div>

            {hoveredSpell && (
                <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #3b82f6', padding: '12px 18px', borderRadius: '12px', maxWidth: '420px', color: '#f8fafc' }}>
                    <strong style={{ color: '#60a5fa', fontSize: '15px' }}>{hoveredSpell.name}</strong>
                    <p style={{ margin: '4px 0', fontSize: '12px', color: '#cbd5e1' }}>{hoveredSpell.description}</p>
                </div>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                {filteredSpells.map((spell) => (
                    <div key={spell.id} onMouseEnter={() => setHoveredSpell(spell)} onMouseLeave={() => setHoveredSpell(null)} onClick={() => onCastSpell(spell)} style={{ width: '110px', height: '160px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155', cursor: 'pointer', overflow: 'hidden' }}>
                        <div style={{ padding: '6px 4px', textAlign: 'center', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>{spell.name}</div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {spell.imagePath ? <img src={spell.imagePath} alt={spell.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>🔮</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
