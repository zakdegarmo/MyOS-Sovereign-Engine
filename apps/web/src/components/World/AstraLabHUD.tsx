import React, { useState, useEffect } from 'react';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [masterPois, setMasterPois] = useState<PoiLocation[]>([]);

    useEffect(() => {
        // Load master 3,275 POI catalog if available
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

            {isOpen && (
                <div style={{
                    marginTop: '10px',
                    width: '320px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#f8fafc',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
                }}>
                    {/* Position & Minimap Coordinate Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '8px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Position</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>X: {px}m | Z: {pz}m</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Region</div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#10b981' }}>Sword Coast North</div>
                        </div>
                    </div>

                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="Search 3,275+ POIs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            background: 'rgba(30, 41, 59, 0.8)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '6px',
                            padding: '8px 10px',
                            color: '#fff',
                            fontSize: '12px',
                            marginBottom: '12px',
                            outline: 'none'
                        }}
                    />

                    {/* POI List */}
                    <div style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '4px'
                    }}>
                        {filteredPois.slice(0, 15).map(poi => {
                            const dist = Math.round(
                                Math.sqrt(
                                    Math.pow(poi.position[0] - playerPos[0], 2) + 
                                    Math.pow(poi.position[2] - playerPos[2], 2)
                                )
                            );
                            return (
                                <div
                                    key={poi.id}
                                    onClick={() => onTeleport(poi.position)}
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.5)',
                                        border: `1px solid ${poi.color || '#38bdf8'}`,
                                        borderRadius: '8px',
                                        padding: '8px 10px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease-in-out',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#f8fafc' }}>
                                            📍 {poi.name}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                            {poi.category}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '11px', color: poi.color || '#38bdf8', fontWeight: 'bold' }}>
                                            {dist}m away
                                        </div>
                                        <div style={{ fontSize: '9px', color: '#64748b' }}>
                                            Click to Teleport
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
