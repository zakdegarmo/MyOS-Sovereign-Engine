import React, { useState } from 'react';
import { DnDEquipmentCompositor, type DnDCharacterConcept } from '../../engine/DnDEquipmentCompositor';
import { FastCharacterRulesEngine, type FastCharacter5eSheet } from '../../engine/FastCharacterRulesEngine';

interface DnDCharacterBuilderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCharacterCreated?: (sheet: FastCharacter5eSheet) => void;
    onUpdateUserGestalt?: (update: any) => void;
}

export const DnDCharacterBuilderModal: React.FC<DnDCharacterBuilderModalProps> = ({
    isOpen,
    onClose,
    onCharacterCreated,
    onUpdateUserGestalt
}) => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

    const [concept, setConcept] = useState<DnDCharacterConcept>({
        name: 'Hero of Waterdeep',
        species: 'Human',
        characterClass: 'Fighter',
        armor: 'PlateMail',
        primaryWeapon: 'Greatsword'
    });

    if (!isOpen) return null;

    const sheet = FastCharacterRulesEngine.generateCharacter(concept);

    const handleFinalizeCharacter = () => {
        try {
            // Direct React state trigger for active player avatar!
            onUpdateUserGestalt?.({
                name: concept.name,
                genome: sheet.spriteGenome
            });

            const saved = localStorage.getItem('myos_user_gestalt');
            if (saved) {
                const parsed = JSON.parse(saved);
                parsed.name = concept.name;
                parsed.genome = { ...parsed.genome, ...sheet.spriteGenome };
                localStorage.setItem('myos_user_gestalt', JSON.stringify(parsed));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (e) {
            console.error('Failed to finalize character avatar:', e);
        }

        onCharacterCreated?.(sheet);
        onClose();
    };

    return (
        <div
            onClick={(e) => e.stopPropagation()}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(5, 8, 15, 0.9)',
                backdropFilter: 'blur(12px)',
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
                    width: '860px',
                    maxHeight: '88vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.95)',
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
                            🎲 D&D 5e Character Builder (Step {step} of 4)
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            Powered by FastCharacter.com 5e Rules Engine
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#94a3b8',
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
                    {/* Left Column: Live 2D Billboarded LPC Pixel Token */}
                    <div style={{
                        width: '270px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRight: '1px solid rgba(255,255,255,0.05)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
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
                        <div style={{ fontSize: '0.9rem', color: '#eab308', fontWeight: 'bold' }}>
                            {sheet.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '2px' }}>
                            {sheet.species} {sheet.characterClass}
                        </div>

                        {/* Calculated 5e Combat Headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', width: '100%', textAlign: 'center', marginTop: '16px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>AC</div>
                                <div style={{ fontSize: '1.1rem', color: '#eab308', fontWeight: 'bold' }}>{sheet.ac}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>HP</div>
                                <div style={{ fontSize: '1.1rem', color: '#22c55e', fontWeight: 'bold' }}>{sheet.hp.max}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(202, 138, 4, 0.3)', borderRadius: '6px', padding: '6px' }}>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>SPEED</div>
                                <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold' }}>{sheet.speed}</div>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '12px' }}>
                            2D LPC Billboard Sprite Sync
                        </div>
                    </div>

                    {/* Right Column: Step Content */}
                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
                        {step === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ color: '#eab308', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                                        Character Name:
                                    </label>
                                    <input
                                        type="text"
                                        value={concept.name}
                                        onChange={e => setConcept({ ...concept, name: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: '#0f172a',
                                            border: '1px solid rgba(202, 138, 4, 0.5)',
                                            color: '#fff',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ color: '#eab308', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Select Species / Race:
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {['Human', 'Elf', 'Dwarf', 'Halfling', 'Tiefling', 'Dragonborn'].map(sp => (
                                            <button
                                                key={sp}
                                                onClick={() => setConcept({ ...concept, species: sp as any })}
                                                style={{
                                                    background: concept.species === sp ? 'linear-gradient(135deg, #ca8a04, #a16207)' : 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(202, 138, 4, 0.4)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {sp}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ color: '#eab308', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Select Class:
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        {['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Paladin', 'Bard'].map(cl => (
                                            <button
                                                key={cl}
                                                onClick={() => setConcept({ ...concept, characterClass: cl as any })}
                                                style={{
                                                    background: concept.characterClass === cl ? 'linear-gradient(135deg, #ca8a04, #a16207)' : 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(202, 138, 4, 0.4)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {cl}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label style={{ color: '#eab308', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        Select Armor Apparel (Mutates 2D Sprite Torso/Legs):
                                    </label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                        {[
                                            { id: 'PlateMail', name: 'Plate Mail (Heavy - AC 18)' },
                                            { id: 'ChainMail', name: 'Chain Mail (Medium - AC 16)' },
                                            { id: 'Leather', name: 'Leather Armor (Light - AC 13)' },
                                            { id: 'WizardRobes', name: 'Wizard Robes (Arcane - AC 12)' }
                                        ].map(ar => (
                                            <button
                                                key={ar.id}
                                                onClick={() => setConcept({ ...concept, armor: ar.id as any })}
                                                style={{
                                                    background: concept.armor === ar.id ? 'linear-gradient(135deg, #ca8a04, #a16207)' : 'rgba(255,255,255,0.03)',
                                                    border: '1px solid rgba(202, 138, 4, 0.4)',
                                                    color: '#fff',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {ar.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <label style={{ color: '#eab308', display: 'block', marginBottom: '12px', fontWeight: 'bold' }}>
                                    Primary Weapon Selection:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                                    {['Greatsword', 'Longsword', 'Dagger', 'ArcaneStaff', 'Longbow'].map(wp => (
                                        <button
                                            key={wp}
                                            onClick={() => setConcept({ ...concept, primaryWeapon: wp as any })}
                                            style={{
                                                background: concept.primaryWeapon === wp ? 'linear-gradient(135deg, #ca8a04, #a16207)' : 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(202, 138, 4, 0.4)',
                                                color: '#fff',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {wp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <h3 style={{ color: '#eab308', margin: '0 0 12px 0' }}>FastCharacter 5e Statblock Review</h3>
                                <div style={{ background: '#090d16', border: '1px solid #ca8a04', borderRadius: '8px', padding: '16px', fontSize: '0.9rem', lineHeight: '1.8' }}>
                                    <div><strong>Name:</strong> {sheet.name}</div>
                                    <div><strong>Species / Class:</strong> Level 5 {sheet.species} {sheet.characterClass}</div>
                                    <div><strong>Armor Class (AC):</strong> {sheet.ac}</div>
                                    <div><strong>Hit Points:</strong> {sheet.hp.max}</div>
                                    <div><strong>Ability Scores:</strong> STR {sheet.abilityScores.str}, DEX {sheet.abilityScores.dex}, CON {sheet.abilityScores.con}, INT {sheet.abilityScores.int}, WIS {sheet.abilityScores.wis}, CHA {sheet.abilityScores.cha}</div>
                                    <div><strong>Equipped Weapon:</strong> {concept.primaryWeapon}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <button
                        disabled={step === 1}
                        onClick={() => setStep(prev => (prev - 1) as any)}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: step === 1 ? '#64748b' : '#fff',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: step === 1 ? 'default' : 'pointer'
                        }}
                    >
                        ← Back
                    </button>

                    {step < 4 ? (
                        <button
                            onClick={() => setStep(prev => (prev + 1) as any)}
                            style={{
                                background: 'linear-gradient(135deg, #ca8a04, #a16207)',
                                border: 'none',
                                color: '#fff',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Next Step →
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalizeCharacter}
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: '#fff',
                                padding: '10px 24px',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            ⚔️ Finalize & Manifest 2D Sprite Avatar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
