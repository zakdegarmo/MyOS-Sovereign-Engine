import React, { useState } from 'react';

export type SpellDef = {
    id: string;
    name: string;
    icon?: string;
    color: string;
    description: string;
    level: number;
    school: string;
    cardImage?: string; // Path to the 5e spell card image
};

const spells: SpellDef[] = [
    { id: 'fireball', name: 'Fireball', color: '#ff5500', description: 'AoE Force Explosion', level: 3, school: 'Evocation' },
    { id: 'misty_step', name: 'Misty Step', color: '#aa88ff', description: 'Teleport to target', level: 2, school: 'Conjuration' },
    { id: 'invisibility', name: 'Invisibility', color: '#aaddff', description: 'Toggle visibility', level: 2, school: 'Illusion' },
    { id: 'acid_splash', name: 'Acid Splash', color: '#33ff00', description: 'Melt targets', level: 0, school: 'Conjuration' },
    { id: 'aid', name: 'Aid', color: '#00ffff', description: 'HP Buff', level: 2, school: 'Abjuration' },
];

interface RadialSpellMenuProps {
    selectedSpell: string;
    onSelectSpell: (spellId: string) => void;
}

export const RadialSpellMenu: React.FC<RadialSpellMenuProps> = ({ selectedSpell, onSelectSpell }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hoveredSpell, setHoveredSpell] = useState<SpellDef | null>(null);

    const toggleMenu = () => setIsOpen(!isOpen);

    const radius = 120; // Radius of the radial wheel

    return (
        <div style={{ position: 'relative', width: '300px', height: '300px', pointerEvents: 'auto' }}>
            {/* Center Toggle Button */}
            <button 
                onClick={toggleMenu}
                style={{
                    position: 'absolute',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '60px', height: '60px',
                    borderRadius: '50%',
                    background: '#1a1a2e',
                    border: '2px solid #aa88ff',
                    color: 'white',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 0 15px rgba(170, 136, 255, 0.5)',
                    fontWeight: 'bold',
                    fontSize: '12px'
                }}
            >
                {isOpen ? 'CLOSE' : 'SPELLS'}
            </button>

            {/* Radial Items */}
            {isOpen && spells.map((spell, index) => {
                const angle = (index / spells.length) * Math.PI * 2 - (Math.PI / 2); // Start at top
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                const isSelected = selectedSpell === spell.id;

                return (
                    <button
                        key={spell.id}
                        onClick={() => {
                            onSelectSpell(spell.id);
                            setIsOpen(false);
                        }}
                        onMouseEnter={() => setHoveredSpell(spell)}
                        onMouseLeave={() => setHoveredSpell(null)}
                        style={{
                            position: 'absolute',
                            top: `calc(50% + ${y}px)`,
                            left: `calc(50% + ${x}px)`,
                            transform: 'translate(-50%, -50%)',
                            width: '50px', height: '50px',
                            borderRadius: '50%',
                            background: isSelected ? spell.color : '#2a1b3d',
                            border: `2px solid ${spell.color}`,
                            color: isSelected ? 'black' : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? `0 0 15px ${spell.color}` : 'none',
                            zIndex: 5,
                            fontSize: '10px',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center'
                        }}
                    >
                        {spell.name}
                    </button>
                );
            })}

            {/* Hover Tooltip / Card Viewer */}
            {isOpen && hoveredSpell && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '110%',
                    transform: 'translateY(-50%)',
                    width: '250px',
                    background: 'rgba(20, 10, 40, 0.9)',
                    border: `1px solid ${hoveredSpell.color}`,
                    borderRadius: '8px',
                    padding: '15px',
                    color: 'white',
                    zIndex: 20,
                    pointerEvents: 'none'
                }}>
                    <h3 style={{ margin: '0 0 5px 0', color: hoveredSpell.color }}>{hoveredSpell.name}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontStyle: 'italic', opacity: 0.8 }}>
                        Level {hoveredSpell.level} {hoveredSpell.school}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{hoveredSpell.description}</p>
                    
                    {/* Placeholder for actual Card Image popups later */}
                    <div style={{
                        width: '100%',
                        height: '150px',
                        background: '#000',
                        border: '1px dashed #555',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: '#888'
                    }}>
                        [Card Image Placeholder]
                    </div>
                </div>
            )}
        </div>
    );
};
