import React, { useState, useEffect } from 'react';
import { DnDEquipmentCompositor, type DnDCharacterConcept } from '../../engine/DnDEquipmentCompositor';

interface DnDCharacterSheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    character?: DnDCharacterConcept;
    onUpdateCharacter?: (updated: DnDCharacterConcept) => void;
    onUpdateUserGestalt?: (update: any) => void;
}

interface DnDCardItem {
    id: string;
    path: string;
    name: string;
    type: string;
    rarity: string;
    properties: string;
    damage: string;
    acBonus: number;
    spriteArmor: string;
}

export const DnDCharacterSheetModal: React.FC<DnDCharacterSheetModalProps> = ({
    isOpen,
    onClose,
    character = {
        name: 'Valerius the Bold',
        species: 'Human',
        characterClass: 'Fighter',
        armor: 'PlateMail',
        primaryWeapon: 'Greatsword'
    },
    onUpdateCharacter,
    onUpdateUserGestalt
}) => {
    const [concept, setConcept] = useState<DnDCharacterConcept>(character);
    const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'inventory'>('stats');
    const [cards, setCards] = useState<DnDCardItem[]>([]);
    const [selectedCard, setSelectedCard] = useState<DnDCardItem | null>(null);
    const [equippedCard, setEquippedCard] = useState<DnDCardItem | null>(null);

    useEffect(() => {
        fetch('/assets/dnd_cards/cards_database.json')
            .then(res => res.json())
            .then(data => setCards(data.cards || []))
            .catch(() => setCards([]));
    }, []);

    const handleConceptChange = (updatedConcept: DnDCharacterConcept) => {
        setConcept(updatedConcept);
        onUpdateCharacter?.(updatedConcept);

        const newGenome = DnDEquipmentCompositor.composeGenome(updatedConcept);
        onUpdateUserGestalt?.({ genome: newGenome });

        try {
            const saved = localStorage.getItem('myos_user_gestalt');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.genome = { ...parsed.genome, ...newGenome };
                localStorage.setItem('myos_user_gestalt', JSON.stringify(parsed));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Failed to update player avatar genome:', e);
        }
    };

    const handleEquipCardToSprite = (card: DnDCardItem) => {
        setEquippedCard(card);
        const nextArmor = card.spriteArmor || (concept.armor === 'PlateMail' ? 'Leather' : 'PlateMail');
        handleConceptChange({
            ...concept,
            armor: nextArmor as any,
            primaryWeapon: card.type === 'Weapon' ? card.name : concept.primaryWeapon
        });
        setSelectedCard(null);
    };

    if (!isOpen) return null;

    const calculatedAC = 10 + 4 + (equippedCard ? equippedCard.acBonus : 8);

    return (
        <div 
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(5, 8, 15, 0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999999,
                fontFamily: 'serif',
                color: '#e2e8f0',
                pointerEvents: 'auto'
            }}
        >
            <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                    border: '2px solid #ca8a04',
                    borderRadius: '16px',
                    width: '920px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(202, 138, 4, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#eab308', fontSize: '1.5rem' }}>
                            📜 {concept.name}
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            Level 5 {concept.species} {concept.characterClass}
                        </span>
                    </div>

                    {/* Navigation Tabs */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['stats', 'skills', 'inventory'].map(tab => (
                            <button
                                key={tab}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTab(tab as any);
                                }}
                                style={{
                                    background: activeTab === tab ? '#ca8a04' : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab === 'inventory' ? `🎴 Equipment Cards Deck (${cards.length})` : tab}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#e2e8f0',
                            fontSize: '1.2rem',
                            borderRadius: '8px',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Main Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Column: Avatar & Combat Header */}
                    <div style={{
                        width: '270px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <div style={{
                            width: '128px',
                            height: '128px',
                            background: '#090d16',
                            border: '2px solid #ca8a04',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            boxShadow: '0 0 20px rgba(234, 179, 8, 0.2)'
                        }}>
                            <span style={{ fontSize: '3rem' }}>🛡️</span>
                        </div>

                        {/* Combat Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', width: '100%', textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ARMOR CLASS</div>
                                <div style={{ fontSize: '1.1rem', color: '#eab308', fontWeight: 'bold' }}>{calculatedAC}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>INITIATIVE</div>
                                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>+2</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>SPEED</div>
                                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>30ft</div>
                            </div>
                        </div>

                        {/* Active Equipped Card Info */}
                        {equippedCard ? (
                            <div style={{ width: '100%', background: '#090d16', border: '1px solid #ca8a04', borderRadius: '8px', padding: '10px', fontSize: '0.8rem' }}>
                                <div style={{ color: '#eab308', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {equippedCard.name}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                    {equippedCard.type} • {equippedCard.damage !== 'N/A' ? equippedCard.damage : equippedCard.properties}
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>No Card Equipped</div>
                        )}
                    </div>

                    {/* Right Column: Tab Content */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                        {activeTab === 'stats' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '20px', textAlign: 'center' }}>
                                    {[
                                        { label: 'STR', val: '18 (+4)' },
                                        { label: 'DEX', val: '14 (+2)' },
                                        { label: 'CON', val: '16 (+3)' },
                                        { label: 'INT', val: '10 (+0)' },
                                        { label: 'WIS', val: '12 (+1)' },
                                        { label: 'CHA', val: '10 (+0)' }
                                    ].map(st => (
                                        <div key={st.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '8px', padding: '8px 4px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{st.label}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', marginTop: '2px' }}>{st.val}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#ca8a04', display: 'block', marginBottom: '4px' }}>
                                            Species / Race (Mutates 2D Sprite Body):
                                        </label>
                                        <select
                                            value={concept.species}
                                            onChange={e => handleConceptChange({ ...concept, species: e.target.value as any })}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(202, 138, 4, 0.5)', color: '#fff', padding: '10px', borderRadius: '6px' }}
                                        >
                                            {['Human', 'Elf', 'Dwarf', 'Halfling', 'Tiefling', 'Dragonborn'].map(sp => (
                                                <option key={sp} value={sp}>{sp}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ fontSize: '0.85rem', color: '#ca8a04', display: 'block', marginBottom: '4px' }}>
                                            Armor & Apparel (Mutates 2D Sprite Layers):
                                        </label>
                                        <select
                                            value={concept.armor}
                                            onChange={e => handleConceptChange({ ...concept, armor: e.target.value as any })}
                                            style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(202, 138, 4, 0.5)', color: '#fff', padding: '10px', borderRadius: '6px' }}
                                        >
                                            {['None', 'Padded', 'Leather', 'ChainMail', 'PlateMail', 'WizardRobes'].map(ar => (
                                                <option key={ar} value={ar}>{ar}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', color: '#eab308' }}>
                                    🎴 D&D Equipment Cards Deck ({cards.length} Cards)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {cards.map(card => (
                                        <div
                                            key={card.id}
                                            onClick={() => setSelectedCard(card)}
                                            style={{
                                                background: '#090d16',
                                                border: '1px solid rgba(202, 138, 4, 0.4)',
                                                borderRadius: '8px',
                                                padding: '8px',
                                                cursor: 'pointer',
                                                boxShadow: '0 6px 15px rgba(0,0,0,0.6)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <img
                                                src={card.path}
                                                alt={card.name}
                                                style={{ width: '100%', borderRadius: '4px', display: 'block', marginBottom: '8px' }}
                                            />
                                            <div style={{ fontSize: '0.85rem', color: '#eab308', fontWeight: 'bold', textAlign: 'center' }}>
                                                {card.name}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px', textAlign: 'center' }}>
                                                {card.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FULL-SCREEN CARD INSPECTOR WITH ACCURATE 5E METADATA */}
                {selectedCard && (
                    <div 
                        onClick={() => setSelectedCard(null)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999999
                        }}
                    >
                        <div 
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#0f172a',
                                border: '2px solid #ca8a04',
                                borderRadius: '16px',
                                padding: '24px',
                                display: 'flex',
                                gap: '24px',
                                alignItems: 'center',
                                maxWidth: '680px',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.95)'
                            }}
                        >
                            <img
                                src={selectedCard.path}
                                alt={selectedCard.name}
                                style={{ width: '260px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}
                            />

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h3 style={{ margin: 0, color: '#eab308', fontSize: '1.4rem' }}>
                                    {selectedCard.name}
                                </h3>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                    {selectedCard.type}
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    {selectedCard.damage !== 'N/A' && <div style={{ marginBottom: '6px' }}><strong>Damage:</strong> {selectedCard.damage}</div>}
                                    {selectedCard.acBonus > 0 && <div style={{ marginBottom: '6px' }}><strong>AC Bonus:</strong> +{selectedCard.acBonus}</div>}
                                    <div><strong>Properties:</strong> {selectedCard.properties}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                    <button
                                        onClick={() => handleEquipCardToSprite(selectedCard)}
                                        style={{
                                            background: 'linear-gradient(135deg, #ca8a04, #a16207)',
                                            border: 'none',
                                            color: '#fff',
                                            padding: '10px 18px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        🛡️ Equip Card to Avatar Sprite
                                    </button>
                                    <button
                                        onClick={() => setSelectedCard(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                            padding: '10px 18px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
