import React from 'react';

export const CircusCrawl: React.FC = () => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#050510',
            color: '#ff33cc',
            fontFamily: 'monospace',
            textAlign: 'center',
            padding: '2rem',
            border: '2px solid #ff33cc',
            boxShadow: '0 0 20px rgba(255, 51, 204, 0.3)'
        }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', textShadow: '0 0 10px #ff33cc' }}>
                CIRCUS CRAWL
            </h1>
            <div style={{ fontSize: '1.2rem', opacity: 0.8 }}>
                [ SYSTEM INITIALIZING ]
            </div>
            <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
                Procedural Dungeon Matrix under construct...<br/>
                Please verify Void Stability before entry.
            </div>
            <div style={{
                marginTop: '2rem',
                width: '120px',
                height: '4px',
                background: '#111',
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: '30%',
                    height: '100%',
                    background: '#ff33cc',
                    animation: 'progress 2s infinite linear'
                }} />
            </div>
            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(333%); }
                }
            `}</style>
        </div>
    );
};

export default CircusCrawl;
