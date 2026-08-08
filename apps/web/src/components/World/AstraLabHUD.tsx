import React, { useState, useEffect } from 'react';
import { SpellHandHud, type SpellCardItem } from '../HUDModules/SpellHandHud';

export interface PoiLocation {
    id: string;
    name: string;
    category: string;
    description: string;
    position: [number, number, number];
    color: string;
}

interface AstraLabHUDProps {
    playerPos: [number, number, number];
    poiBeacons: PoiLocation[];
    onTeleport: (pos: [number, number, number]) => void;
    onToggleCombat?: () => void;
}

export const AstraLabHUD: React.FC<AstraLabHUDProps> = ({
    playerPos,
    poiBeacons,
    onTeleport,
    onToggleCombat
}) => {
    const [isOpen, setIsOpen] = useState(true);
    const [showSpellbook, setShowSpellbook] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [masterPois, setMasterPois] = useState<PoiLocation[]>([]);

    useEffect(() => {
        fetch('/data/toril_1000_poi_catalog.json')
            .then(res => res.json())
            .then(data => {
                if (data && data.pois) {
                    const loaded: PoiLocation[] = Object.values(data.pois).slice(0, 100).map((p: any, idx: number) => ({
                        id: p.id,
                        name: p.name,
                        category: p.category || 'Canonical POI',
                        description: `Canonical Forgotten Realms landmark in ${p.category}.`,
                        position: [
                            (idx % 10 - 5) * 80 - 100,
                            0,
                            Math.floor(idx / 10 - 5) * 80 + 50
                        ],
                        color: '#38bdf8'
                    }));
                    setMasterPois(loaded);
                }
            })
            .catch(() => {});
    }, []);

    const allPois = masterPois.length > 0 ? [...poiBeacons, ...masterPois] : poiBeacons;
    const filteredPois = allPois.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const px = Math.round(playerPos[0]);
    const pz = Math.round(playerPos[2]);

    return (
        <div style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            zIndex: 99999,
            pointerEvents: 'auto',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Toggle HUD Buttons Row */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid #38bdf8',
                        borderRadius: '8px',
                        color: '#38bdf8',
                        padding: '8px 14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    🗺️ {isOpen ? 'Hide HUD' : 'Faerûn Nav HUD'}
                </button>

                <button
                    onClick={() => setShowSpellbook(!showSpellbook)}
                    style={{
                        background: showSpellbook ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid #60a5fa',
                        borderRadius: '8px',
                        color: '#fff',
                        padding: '8px 14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    ✨ {showSpellbook ? 'Hide Cards' : 'Spellbook Hand'}
                </button>

                {onToggleCombat && (
                    <button
                        onClick={onToggleCombat}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            padding: '8px 12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                        }}
                    >
                        ⚔️ 5e Combat Mode
                    </button>
                )}
            </div>

            {/* Arc-Arranged Card Hand & School of Magic Taxonomy HUD */}
            {showSpellbook && (
                <SpellHandHud
                    onCastSpell={(spell: SpellCardItem) => {
                        if ((window as any).castSpellFx) {
                            (window as any).castSpellFx(spell.school, spell.name);
                        }
                        console.log(`[AstraLabHUD] Cast Spell: ${spell.name} (${spell.schoolName}) - ${spell.damageOrEffect}`);
                    }}
                />
            )}
        </div>
    );
};
