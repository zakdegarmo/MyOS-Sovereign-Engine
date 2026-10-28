import React, { useState, useEffect, useRef } from 'react';
import { usePersistentWorldStore } from '../../store/usePersistentWorldStore';

interface FaerunMinimapHudProps {
    currentDimension?: string;
}

interface PoiMarker {
    name: string;
    slug: string;
    type: string;
    worldX: number;
    worldZ: number;
}

/**
 * FaerunMinimapHud
 * 
 * AAA-Grade Minimap & World Map Overlay Engine for MyOS.
 * Provides a circular radar HUD in the top-right corner and a full-screen
 * cartography world map when pressing 'M' or clicking the map.
 */
export const FaerunMinimapHud: React.FC<FaerunMinimapHudProps> = ({ currentDimension }) => {
    const [isWorldMapOpen, setIsWorldMapOpen] = useState(false);
    const [pois, setPois] = useState<PoiMarker[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fullMapCanvasRef = useRef<HTMLCanvasElement>(null);

    const playerPos = usePersistentWorldStore(state => state.playerPos) || [0, 0, 0];

    // Load POIs
    useEffect(() => {
        fetch('/assets/data/faerun_pois.json')
            .then(r => r.json())
            .then(d => {
                const combined = [...(d.cities || []), ...(d.dungeons || [])];
                setPois(combined);
            })
            .catch(() => {});
    }, []);

    // Toggle World Map with 'M' key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'm' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
                setIsWorldMapOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Render Minimap Radar (Corner Widget)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // Clear & Draw Circular Radar Disk
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.clip();

        // Dark radar background
        ctx.fillStyle = '#0a101d';
        ctx.fillRect(0, 0, w, h);

        // Radar grid rings
        ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, (cx - 2) * 0.4, 0, Math.PI * 2);
        ctx.arc(cx, cy, (cx - 2) * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
        ctx.moveTo(0, cy); ctx.lineTo(w, cy);
        ctx.stroke();

        // Render POI Blips on Minimap (Radar scale: 1px = 40ft)
        const scale = 0.05;
        pois.forEach(poi => {
            const relX = (poi.worldX - playerPos[0]) * scale;
            const relZ = (poi.worldZ - playerPos[2]) * scale;
            const screenX = cx + relX;
            const screenY = cy + relZ;

            const dist = Math.hypot(relX, relZ);
            if (dist < cx - 8) {
                ctx.fillStyle = poi.type === 'ruin' ? '#c084fc' : poi.type === 'dungeon' ? '#ef4444' : '#fbbf24';
                ctx.beginPath();
                ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Player Indicator (Center Arrow)
        ctx.fillStyle = '#00ffcc';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Outer Neon Ring
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.stroke();
    }, [playerPos, pois]);

    if (currentDimension !== 'astra_lab' && currentDimension !== 'astra_faerun') {
        return null;
    }

    return (
        <>
            {/* Corner Minimap HUD Widget */}
            <div 
                onClick={() => setIsWorldMapOpen(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '140px',
                    height: '140px',
                    cursor: 'pointer',
                    zIndex: 90,
                    filter: 'drop-shadow(0 0 12px rgba(0, 255, 204, 0.3))'
                }}
                title="Click or press 'M' for Continent Map"
            >
                <canvas ref={canvasRef} width={140} height={140} style={{ borderRadius: '50%' }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-22px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#00ffcc',
                    fontFamily: 'monospace',
                    textShadow: '0 0 4px #000',
                    whiteSpace: 'nowrap'
                }}>
                    [M] WORLD MAP
                </div>
            </div>

            {/* Full World Map Modal */}
            {isWorldMapOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(5, 10, 20, 0.92)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    {/* Map Header */}
                    <div style={{
                        width: '90%',
                        maxWidth: '900px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        color: '#00ffcc',
                        fontFamily: 'monospace'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px' }}>
                            🗺️ CONTINENT OF FAERÛN — MACRO MAP
                        </h2>
                        <button 
                            onClick={() => setIsWorldMapOpen(false)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #00ffcc',
                                color: '#00ffcc',
                                padding: '6px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            CLOSE [ESC]
                        </button>
                    </div>

                    {/* Continent Map Canvas Container */}
                    <div style={{
                        position: 'relative',
                        width: '90%',
                        maxWidth: '900px',
                        height: '70vh',
                        border: '2px solid rgba(0, 255, 204, 0.5)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#0a1424',
                        boxShadow: '0 0 30px rgba(0, 255, 204, 0.2)'
                    }}>
                        <img 
                            src="/assets/textures/toril_biome_mask.png" 
                            alt="Faerun Biome Map"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                opacity: 0.85
                            }}
                        />

                        {/* Player Pin on World Map */}
                        {(() => {
                            // Scale divisor: 2000 for Astra Lab local bounds, 40000 for continent-scale Faerun
                            const scaleDivisor = currentDimension === 'astra_lab' ? 2000 : 40000;
                            const mapX = 50 + (playerPos[0] / scaleDivisor) * 100;
                            const mapZ = 50 + (playerPos[2] / scaleDivisor) * 100;
                            return (
                                <div style={{
                                    position: 'absolute',
                                    left: `${Math.min(Math.max(mapX, 5), 95)}%`,
                                    top: `${Math.min(Math.max(mapZ, 5), 95)}%`,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 10
                                }}>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        backgroundColor: '#00ffcc',
                                        boxShadow: '0 0 15px #00ffcc, 0 0 30px #00ffcc',
                                        border: '2px solid #ffffff'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '18px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: '#00ffcc',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'nowrap',
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        padding: '2px 6px',
                                        borderRadius: '3px'
                                    }}>
                                        YOU ARE HERE
                                    </div>
                                </div>
                            );
                        })()}

                        {/* POI City Pins on World Map */}
                        {pois.map(poi => {
                            const scaleDivisor = currentDimension === 'astra_lab' ? 2000 : 40000;
                            const px = 50 + (poi.worldX / scaleDivisor) * 100;
                            const pz = 50 + (poi.worldZ / scaleDivisor) * 100;
                            return (
                                <div key={poi.slug} style={{
                                    position: 'absolute',
                                    left: `${Math.min(Math.max(px, 5), 95)}%`,
                                    top: `${Math.min(Math.max(pz, 5), 95)}%`,
                                    transform: 'translate(-50%, -50%)',
                                    pointerEvents: 'none'
                                }}>
                                    <div style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        backgroundColor: poi.type === 'ruin' ? '#c084fc' : poi.type === 'dungeon' ? '#ef4444' : '#fbbf24',
                                        border: '1px solid #fff'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        color: '#fbbf24',
                                        fontSize: '10px',
                                        fontWeight: 'bold',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'nowrap',
                                        textShadow: '0 0 3px #000'
                                    }}>
                                        {poi.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Coordinate & Region Readout */}
                    <div style={{
                        marginTop: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                    }}>
                        COORDINATES: X = {Math.round(playerPos[0])} ft | Z = {Math.round(playerPos[2])} ft | SCALE: 1 Pixel = 20 Feet
                    </div>
                </div>
            )}
        </>
    );
};

export default FaerunMinimapHud;
