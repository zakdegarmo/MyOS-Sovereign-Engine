import React from 'react';
import { useSwarmTelemetry } from '../../hooks/useSwarmTelemetry';

export const SystemTelemetryLog: React.FC = () => {
    const { telemetry, isConnected } = useSwarmTelemetry();

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '350px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: `1px solid ${isConnected ? '#00f0ff' : '#ff3366'}`,
            borderRadius: '8px',
            padding: '12px',
            color: '#00f0ff',
            fontFamily: 'monospace',
            zIndex: 1000,
            boxShadow: `0 0 15px ${isConnected ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 51, 102, 0.3)'}`,
            pointerEvents: 'none',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{ fontSize: '12px', marginBottom: '8px', borderBottom: `1px solid ${isConnected ? '#00f0ff33' : '#ff336633'}`, paddingBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>SWARM_TELEMETRY_ENGINE v2.0</span>
                <span style={{ color: isConnected ? '#00ff88' : '#ff3366', animation: isConnected ? 'pulse 1.5s infinite' : 'none' }}>
                    {isConnected ? 'LIVE' : 'OFFLINE'}
                </span>
            </div>

            <div style={{ marginBottom: '12px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>SYSTEM_FPS:</span>
                    <span style={{ color: '#fff' }}>{telemetry.system?.fps || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>CPU_LOAD:</span>
                    <span style={{ color: '#fff' }}>{telemetry.system?.cpu || 0}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>RAM_USAGE:</span>
                    <span style={{ color: '#fff' }}>{telemetry.system?.ram ? `${telemetry.system.ram}%` : 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>OS_PROCESSES:</span>
                    <span style={{ color: '#fff' }}>{telemetry.system?.processCount || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ACTIVE_AGENTS:</span>
                    <span style={{ color: '#00ff88' }}>{Object.keys(telemetry.agents || {}).length}</span>
                </div>
            </div>

            <div style={{ fontSize: '10px', maxHeight: '150px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.keys(telemetry.agents || {}).length === 0 ? (
                    <div style={{ opacity: 0.5 }}>AWAITING_AGENT_DATA...</div>
                ) : (
                    Object.entries(telemetry.agents).map(([id, agent]: [string, any]) => (
                        <div key={id} style={{ borderLeft: '2px solid #f0f', paddingLeft: '6px', backgroundColor: 'rgba(255,0,255,0.05)', padding: '4px' }}>
                            <div style={{ color: '#f0f', fontWeight: 'bold' }}>[{id.toUpperCase()}]</div>
                            <div style={{ color: '#ccc', marginTop: '2px', wordBreak: 'break-all' }}>
                                {agent.action || agent.status || 'Idle'}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
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
