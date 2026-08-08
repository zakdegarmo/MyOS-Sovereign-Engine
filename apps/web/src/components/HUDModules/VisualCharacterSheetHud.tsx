import React, { useState, useEffect } from 'react';
import { SpellCardItem } from './SpellHandHud';

export interface CharacterSheetState {
    name: string;
    characterClass: string;
    level: number;
    currentHp: number;
    maxHp: number;
    tempHp: number;
    armorClass: number;
    speed: number;
    spellSlotsLevel1: { total: number; used: number };
    spellSlotsLevel2: { total: number; used: number };
    spellSlotsLevel3: { total: number; used: number };
    conditions: { id: string; name: string; icon: string; color: string }[];
}

export const INITIAL_CHARACTER_STATE: CharacterSheetState = {
    name: 'Eldrin Starweaver',
    characterClass: 'Evocation Wizard',
    level: 5,
    currentHp: 28,
    maxHp: 36,
    tempHp: 0,
    armorClass: 15,
    speed: 30,
    spellSlotsLevel1: { total: 4, used: 1 },
    spellSlotsLevel2: { total: 3, used: 1 },
    spellSlotsLevel3: { total: 2, used: 0 },
    conditions: [
        { id: 'cond_conc', name: 'Concentrating', icon: '💫', color: '#60a5fa' },
        { id: 'cond_mage_armor', name: 'Mage Armor', icon: '🛡️', color: '#a855f7' }
    ]
};

export interface VisualCharacterSheetHudProps {
    onCastSpellHotkey?: (spellName: string, school: string) => void;
}

export const VisualCharacterSheetHud: React.FC<VisualCharacterSheetHudProps> = ({ onCastSpellHotkey }) => {
    const [charState, setCharState] = useState<CharacterSheetState>(INITIAL_CHARACTER_STATE);
    const [lastHotkeyAction, setLastHotkeyAction] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                const key = e.key.toLowerCase();
                let actionName = '';
                let school = 'evocation_fire';

                switch (key) {
                    case 'f':
                        actionName = 'Fireball';
                        school = 'evocation_fire';
                        setCharState(prev => ({
                            ...prev,
                            spellSlotsLevel3: { ...prev.spellSlotsLevel3, used: Math.min(prev.spellSlotsLevel3.used + 1, prev.spellSlotsLevel3.total) }
                        }));
                        break;
                    case 'r':
                        actionName = 'Ray of Frost';
                        school = 'evocation_frost';
                        break;
                    case 'l':
                        actionName = 'Lightning Bolt';
                        school = 'evocation_lightning';
                        setCharState(prev => ({
                            ...prev,
                            spellSlotsLevel3: { ...prev.spellSlotsLevel3, used: Math.min(prev.spellSlotsLevel3.used + 1, prev.spellSlotsLevel3.total) }
                        }));
                        break;
                    case 's':
                        actionName = 'Shield of Faith';
                        school = 'abjuration_holy';
                        setCharState(prev => ({
                            ...prev,
                            spellSlotsLevel1: { ...prev.spellSlotsLevel1, used: Math.min(prev.spellSlotsLevel1.used + 1, prev.spellSlotsLevel1.total) }
                        }));
                        break;
                    case 'm':
                        actionName = 'Misty Step';
                        school = 'conjuration_teleport';
                        setCharState(prev => ({
                            ...prev,
                            spellSlotsLevel2: { ...prev.spellSlotsLevel2, used: Math.min(prev.spellSlotsLevel2.used + 1, prev.spellSlotsLevel2.total) }
                        }));
                        break;
                    case 'h':
                        actionName = 'Heal';
                        school = 'abjuration_holy';
                        setCharState(prev => ({
                            ...prev,
                            currentHp: Math.min(prev.currentHp + 12, prev.maxHp)
                        }));
                        break;
                    default:
                        return;
                }

                e.preventDefault();
                setLastHotkeyAction(`[Ctrl + ${key.toUpperCase()}] Instant Cast: ${actionName}`);

                if ((window as any).castSpellFx) {
                    (window as any).castSpellFx(school, actionName);
                }

                if (onCastSpellHotkey) {
                    onCastSpellHotkey(actionName, school);
                }

                setTimeout(() => setLastHotkeyAction(null), 3000);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCastSpellHotkey]);

    const heartCount = Math.ceil(charState.maxHp / 6);
    const filledHearts = Math.ceil(charState.currentHp / 6);

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            left: '20px',
            zIndex: 9999,
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '14px',
                padding: '14px 18px',
                color: '#f8fafc',
                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                width: '320px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                        <strong style={{ fontSize: '15px', color: '#38bdf8' }}>{charState.name}</strong>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>Level {charState.level} {charState.characterClass}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ background: '#1e293b', border: '1px solid #475569', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>🛡️ AC {charState.armorClass}</span>
                        <span style={{ background: '#1e293b', border: '1px solid #475569', padding: '3px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' }}>🏃 {charState.speed}ft</span>
                    </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>Hit Points (HP)</span>
                        <span style={{ fontWeight: 'bold' }}>{charState.currentHp} / {charState.maxHp} HP</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '16px' }}>
                        {Array.from({ length: heartCount }).map((_, idx) => (
                            <span key={idx} style={{ opacity: idx < filledHearts ? 1.0 : 0.25, transition: 'all 0.2s ease' }}>
                                ❤️
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '10px', background: 'rgba(30, 41, 59, 0.6)', padding: '8px 10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a855f7', marginBottom: '4px' }}>Spell Slots (5e Rules)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#cbd5e1' }}>Lvl 1:</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {Array.from({ length: charState.spellSlotsLevel1.total }).map((_, i) => (
                                    <span key={i} style={{ opacity: i < (charState.spellSlotsLevel1.total - charState.spellSlotsLevel1.used) ? 1.0 : 0.2 }}>🔮</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#cbd5e1' }}>Lvl 2:</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {Array.from({ length: charState.spellSlotsLevel2.total }).map((_, i) => (
                                    <span key={i} style={{ opacity: i < (charState.spellSlotsLevel2.total - charState.spellSlotsLevel2.used) ? 1.0 : 0.2 }}>🔮</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#cbd5e1' }}>Lvl 3:</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {Array.from({ length: charState.spellSlotsLevel3.total }).map((_, i) => (
                                    <span key={i} style={{ opacity: i < (charState.spellSlotsLevel3.total - charState.spellSlotsLevel3.used) ? 1.0 : 0.2 }}>🔮</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {charState.conditions.map(cond => (
                        <span key={cond.id} style={{
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: `1px solid ${cond.color}`,
                            color: cond.color,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            {cond.icon} {cond.name}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                padding: '6px 12px',
                color: '#94a3b8',
                fontSize: '10px',
                width: '320px',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '500'
            }}>
                <span>⌨️ Hotkeys:</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Ctrl+F (Fire)</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>Ctrl+R (Frost)</span>
                <span style={{ color: '#a855f7', fontWeight: 'bold' }}>Ctrl+L (Lightning)</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>Ctrl+M (Teleport)</span>
            </div>

            {lastHotkeyAction && (
                <div style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.5)'
                }}>
                    ⚡ {lastHotkeyAction}
                </div>
            )}
        </div>
    );
};
