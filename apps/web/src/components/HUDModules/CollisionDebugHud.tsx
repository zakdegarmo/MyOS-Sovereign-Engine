import React from 'react';

interface CollisionDebugHudProps {
    logs: { time: number, msg: string }[];
    fragmentStatus: {
        total: number;
        secured: number;
        compromised: number;
    };
    isCombatActive: boolean;
}

export const CollisionDebugHud: React.FC<CollisionDebugHudProps> = ({ logs, fragmentStatus, isCombatActive }) => {
    if (!isCombatActive) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '300px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid #00f0ff',
            borderRadius: '8px',
            padding: '12px',
            color: '#00f0ff',
            fontFamily: 'monospace',
            zIndex: 1000,
            boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
            pointerEvents: 'none',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', borderBottom: '1px solid #00f0ff33', paddingBottom: '4px' }}>
                COLLISION_TELEMETRY_ENGINE v1.0
            </div>

            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>FRAGMENTS_TOTAL:</span>
                    <span>{fragmentStatus.total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#00ff88' }}>
                    <span>SECURED:</span>
                    <span>{fragmentStatus.secured}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff0088' }}>
                    <span>COMPROMISED:</span>
                    <span>{fragmentStatus.compromised}</span>
                </div>
                
                {/* Progress Bar */}
                <div style={{ width: '100%', height: '4px', backgroundColor: '#333', marginTop: '8px', borderRadius: '2px' }}>
                    <div style={{ 
                        width: `${(fragmentStatus.secured / fragmentStatus.total) * 100}%`, 
                        height: '100%', 
                        backgroundColor: '#00ff88', 
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            <div style={{ fontSize: '10px', maxHeight: '120px', overflow: 'hidden' }}>
                {logs.length === 0 ? (
                    <div style={{ opacity: 0.5 }}>AWAITING_COLLISION_DATA...</div>
                ) : (
                    logs.map((log, i) => (
                        <div key={log.time + i} style={{ marginBottom: '2px', borderLeft: '2px solid #00f0ff', paddingLeft: '6px' }}>
                            [{new Date(log.time).toLocaleTimeString()}] {log.msg}
                        </div>
                    ))
                )}
            </div>

            {fragmentStatus.secured >= fragmentStatus.total && (
                <div style={{ 
                    marginTop: '12px', 
                    padding: '8px', 
                    backgroundColor: '#00ff8833', 
                    border: '1px solid #00ff88',
                    textAlign: 'center',
                    animation: 'pulse 1.5s infinite'
                }}>
                    DIMENSION_DOOR_UNLOCKED
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                }
            `}} />
        </div>
    );
};
