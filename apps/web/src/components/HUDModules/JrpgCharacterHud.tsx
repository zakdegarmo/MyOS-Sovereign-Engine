import React, { useState } from 'react';
import { DraggableResizableWindow } from './DraggableResizableWindow';

export interface JrpgCharacterState {
    name: string;
    level: number;
    characterClass: string;
    species: string;
    currentHp: number;
    maxHp: number;
    tempHp: number;
    armorClass: number;
    initiativeBonus: number;
    speed: number;
    spellSlots: { level: number; total: number; used: number }[];
    conditions: { id: string; name: string; icon: string; description: string }[];
    abilities: { id: string; name: string; category: 'Class Feature' | 'Feat' | 'Action'; icon: string; description: string }[];
}

export const DEMO_JRPG_CHARACTER: JrpgCharacterState = {
    name: 'Eldrin Starweaver',
    level: 5,
    characterClass: 'Wizard (Evoker)',
    species: 'High Elf',
    currentHp: 28,
    maxHp: 32,
    tempHp: 5,
    armorClass: 15, // Mage Armor + Dex
    initiativeBonus: 3,
    speed: 30,
    spellSlots: [
        { level: 1, total: 4, used: 1 },
        { level: 2, total: 3, used: 2 },
        { level: 3, total: 2, used: 0 }
    ],
    conditions: [
        { id: 'cond_mage_armor', name: 'Mage Armor', icon: '🛡️', description: '+3 AC from abjuration ward.' },
        { id: 'cond_blessed', name: 'Blessed', icon: '✨', description: '+1d4 to attack rolls and saving throws.' }
    ],
    abilities: [
        { id: 'feat_sculpt_spells', name: 'Sculpt Spells', category: 'Class Feature', icon: '🔥', description: 'Protect allies from evocation AOE spell damage.' },
        { id: 'feat_arcane_recovery', name: 'Arcane Recovery', category: 'Class Feature', icon: '📖', description: 'Regain spell slots during a short rest once per day.' },
        { id: 'feat_war_caster', name: 'War Caster', category: 'Feat', icon: '⚔️', description: 'Advantage on Con saves for spell concentration.' }
    ]
};

export interface JrpgCharacterHudProps {
    character?: JrpgCharacterState;
    isOpen?: boolean;
    onClose?: () => void;
    onUseAbility?: (abilityName: string) => void;
}

export const JrpgCharacterHud: React.FC<JrpgCharacterHudProps> = ({
    character = DEMO_JRPG_CHARACTER,
    isOpen = true,
    onClose,
    onUseAbility
}) => {
    const [activeTab, setActiveTab] = useState<'status' | 'features' | 'slots'>('status');

    // Calculate Heart Containers (1 heart = 4 HP)
    const heartsCount = Math.ceil(character.maxHp / 4);
    const fullHearts = Math.floor(character.currentHp / 4);
    const hasHalfHeart = (character.currentHp % 4) >= 2;
    const tempHearts = Math.ceil(character.tempHp / 4);

    return (
        <DraggableResizableWindow
            id="jrpg_character_sheet"
            title="5e JRPG Character Overlay"
            icon="👤"
            defaultPosition={{ x: window.innerWidth - 380, y: 100 }}
            defaultSize={{ width: 350, height: 460 }}
            minSize={{ width: 300, height: 280 }}
            isOpen={isOpen}
            onClose={onClose}
        >
            {/* 1. Header: Character Name, Level, Class & Armor Class */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8', fontWeight: '800' }}>{character.name}</h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>Lvl {character.level} {character.species} {character.characterClass}</div>
                </div>
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    border: '1px solid #38bdf8',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(56, 189, 248, 0.3)'
                }}>
                    <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>ARMOR CLASS</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#f8fafc' }}>🛡️ {character.armorClass}</div>
                </div>
            </div>

            {/* 2. JRPG Hearts HP Display */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderRadius: '10px',
                padding: '8px 12px',
                marginBottom: '12px',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase' }}>HEALTH (HP)</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#f8fafc' }}>
                        {character.currentHp} / {character.maxHp} HP {character.tempHp > 0 && <span style={{ color: '#f59e0b' }}>({character.tempHp} Temp)</span>}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {/* Render Full / Half / Empty Hearts */}
                    {Array.from({ length: heartsCount }).map((_, idx) => {
                        if (idx < fullHearts) return <span key={idx} style={{ fontSize: '16px' }}>❤️</span>;
                        if (idx === fullHearts && hasHalfHeart) return <span key={idx} style={{ fontSize: '16px' }}>💔</span>;
                        return <span key={idx} style={{ fontSize: '16px', opacity: 0.25 }}>🖤</span>;
                    })}
                    {/* Render Temp HP Gold Hearts */}
                    {Array.from({ length: tempHearts }).map((_, idx) => (
                        <span key={`temp_${idx}`} style={{ fontSize: '16px', filter: 'drop-shadow(0 0 4px #f59e0b)' }}>💛</span>
                    ))}
                </div>
            </div>

            {/* 3. JRPG Navigation Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                    onClick={() => setActiveTab('status')}
                    style={{
                        flex: 1,
                        background: activeTab === 'status' ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
                        color: activeTab === 'status' ? '#0f172a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    🤢 Status ({character.conditions.length})
                </button>
                <button
                    onClick={() => setActiveTab('slots')}
                    style={{
                        flex: 1,
                        background: activeTab === 'slots' ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
                        color: activeTab === 'slots' ? '#0f172a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    🔮 Slots
                </button>
                <button
                    onClick={() => setActiveTab('features')}
                    style={{
                        flex: 1,
                        background: activeTab === 'features' ? '#38bdf8' : 'rgba(30, 41, 59, 0.6)',
                        color: activeTab === 'features' ? '#0f172a' : '#94a3b8',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    📜 Feats ({character.abilities.length})
                </button>
            </div>

            {/* Tab 1: 5e Conditions & Status Effects */}
            {activeTab === 'status' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {character.conditions.map(cond => (
                        <div key={cond.id} style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '16px' }}>{cond.icon}</span>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8' }}>{cond.name}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{cond.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab 2: Arcane Spell Slot Orbs */}
            {activeTab === 'slots' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {character.spellSlots.map(slot => (
                        <div key={slot.level} style={{
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(30, 41, 59, 0.6)',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a855f7' }}>Level {slot.level} Slots</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {Array.from({ length: slot.total }).map((_, idx) => {
                                    const isAvailable = idx >= slot.used;
                                    return (
                                        <span key={idx} style={{
                                            fontSize: '14px',
                                            filter: isAvailable ? 'drop-shadow(0 0 6px #a855f7)' : 'none',
                                            opacity: isAvailable ? 1.0 : 0.25
                                        }}>
                                            🔮
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab 3: Feats & Class Abilities */}
            {activeTab === 'features' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {character.abilities.map(feat => (
                        <div
                            key={feat.id}
                            onClick={() => onUseAbility && onUseAbility(feat.name)}
                            style={{
                                background: 'rgba(30, 41, 59, 0.6)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b' }}>{feat.icon} {feat.name}</div>
                                <span style={{ fontSize: '9px', background: '#1e293b', padding: '1px 6px', borderRadius: '6px', color: '#94a3b8' }}>{feat.category}</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#cbd5e1', marginTop: '2px' }}>{feat.description}</div>
                        </div>
                    ))}
                </div>
            )}
        </DraggableResizableWindow>
    );
};
